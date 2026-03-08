DO $$
DECLARE
  target_name_pattern CONSTANT text := '%Johns Hopkins School of Nursing%';
  keep_org_id uuid;
  keep_org_name text;
  has_metadata boolean;
  has_is_active boolean;
  candidate_count integer;
  merge_count integer;
  active_remaining integer;
  merge_org record;
  fk_ref record;
  moved_rows bigint;
  update_sql text;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations'
      AND column_name = 'metadata'
  ) INTO has_metadata;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations'
      AND column_name = 'is_active'
  ) INTO has_is_active;

  IF NOT has_is_active THEN
    RAISE EXCEPTION 'organizations.is_active column is required for duplicate merge guard';
  END IF;

  CREATE TEMP TABLE tmp_jhson_candidates (
    id uuid PRIMARY KEY,
    name text,
    created_at timestamptz,
    is_active boolean,
    membership_count bigint,
    template_count bigint
  ) ON COMMIT DROP;

  INSERT INTO tmp_jhson_candidates (id, name, created_at, is_active, membership_count, template_count)
  SELECT
    o.id,
    o.name,
    o.created_at,
    COALESCE(o.is_active, false),
    COALESCE(m.membership_count, 0),
    COALESCE(t.template_count, 0)
  FROM public.organizations o
  LEFT JOIN (
    SELECT organization_id, COUNT(*)::bigint AS membership_count
    FROM public.organization_memberships
    GROUP BY organization_id
  ) m ON m.organization_id = o.id
  LEFT JOIN (
    SELECT org_id, COUNT(*)::bigint AS template_count
    FROM public.betterat_org_step_templates
    GROUP BY org_id
  ) t ON t.org_id = o.id
  WHERE o.name ILIKE target_name_pattern;

  SELECT COUNT(*) INTO candidate_count FROM tmp_jhson_candidates;
  RAISE NOTICE 'JHSON merge candidates found: %', candidate_count;

  IF candidate_count = 0 THEN
    RAISE NOTICE 'No organizations matched pattern %, skipping.', target_name_pattern;
    RETURN;
  END IF;

  SELECT c.id, c.name
  INTO keep_org_id, keep_org_name
  FROM tmp_jhson_candidates c
  ORDER BY
    c.membership_count DESC,
    c.template_count DESC,
    c.created_at ASC NULLS LAST,
    c.id ASC
  LIMIT 1;

  CREATE TEMP TABLE tmp_jhson_merge_ids (
    id uuid PRIMARY KEY,
    name text
  ) ON COMMIT DROP;

  INSERT INTO tmp_jhson_merge_ids (id, name)
  SELECT c.id, c.name
  FROM tmp_jhson_candidates c
  WHERE c.id <> keep_org_id;

  SELECT COUNT(*) INTO merge_count FROM tmp_jhson_merge_ids;
  RAISE NOTICE 'JHSON canonical keep id: %, name: %, merge rows: %', keep_org_id, keep_org_name, merge_count;

  FOR merge_org IN
    SELECT id, name
    FROM tmp_jhson_merge_ids
    ORDER BY id
  LOOP
    RAISE NOTICE 'Merging org id % (%)-> %', merge_org.id, merge_org.name, keep_org_id;

    FOR fk_ref IN
      SELECT
        src_ns.nspname AS schema_name,
        src_tbl.relname AS table_name,
        src_col.attname AS column_name
      FROM pg_constraint con
      JOIN pg_class src_tbl ON src_tbl.oid = con.conrelid
      JOIN pg_namespace src_ns ON src_ns.oid = src_tbl.relnamespace
      JOIN pg_class tgt_tbl ON tgt_tbl.oid = con.confrelid
      JOIN pg_namespace tgt_ns ON tgt_ns.oid = tgt_tbl.relnamespace
      JOIN unnest(con.conkey) WITH ORDINALITY AS src_key(attnum, ord) ON true
      JOIN unnest(con.confkey) WITH ORDINALITY AS tgt_key(attnum, ord) ON tgt_key.ord = src_key.ord
      JOIN pg_attribute src_col ON src_col.attrelid = src_tbl.oid AND src_col.attnum = src_key.attnum
      JOIN pg_attribute tgt_col ON tgt_col.attrelid = tgt_tbl.oid AND tgt_col.attnum = tgt_key.attnum
      WHERE con.contype = 'f'
        AND tgt_ns.nspname = 'public'
        AND tgt_tbl.relname = 'organizations'
        AND tgt_col.attname = 'id'
    LOOP
      update_sql := format(
        'UPDATE %I.%I SET %I = $1 WHERE %I = $2',
        fk_ref.schema_name,
        fk_ref.table_name,
        fk_ref.column_name,
        fk_ref.column_name
      );
      EXECUTE update_sql USING keep_org_id, merge_org.id;
      GET DIAGNOSTICS moved_rows = ROW_COUNT;
      IF moved_rows > 0 THEN
        RAISE NOTICE 'Moved % row(s) in %.% via %', moved_rows, fk_ref.schema_name, fk_ref.table_name, fk_ref.column_name;
      END IF;
    END LOOP;

    IF has_metadata THEN
      UPDATE public.organizations
      SET
        is_active = false,
        metadata = COALESCE(metadata, '{}'::jsonb)
          || jsonb_build_object(
            'merged_into', keep_org_id::text,
            'merged_at', now(),
            'merged_from_name', merge_org.name,
            'merged_from_id', merge_org.id::text
          )
      WHERE id = merge_org.id;
    ELSE
      UPDATE public.organizations
      SET is_active = false
      WHERE id = merge_org.id;
    END IF;

    GET DIAGNOSTICS moved_rows = ROW_COUNT;
    RAISE NOTICE 'Deactivated merged organization row count for %: %', merge_org.id, moved_rows;
  END LOOP;

  SELECT COUNT(*)
  INTO active_remaining
  FROM public.organizations
  WHERE name ILIKE target_name_pattern
    AND is_active = true;

  IF active_remaining > 1 THEN
    RAISE EXCEPTION 'JHSON merge safety check failed: % active organizations remain', active_remaining;
  END IF;

  RAISE NOTICE 'JHSON merge completed. Active rows matching pattern: %', active_remaining;
END $$;

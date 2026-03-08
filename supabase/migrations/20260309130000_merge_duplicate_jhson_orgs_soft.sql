DO $$
DECLARE
  target_name_pattern CONSTANT text := '%Johns Hopkins School of Nursing%';
  keep_org_id uuid;
  keep_org_name text;
  merge_org record;
  has_org_metadata boolean;
  candidate_count integer;
  merge_count integer;
  active_remaining integer;
  membership_table_exists boolean;
  membership_has_org_id boolean;
  membership_has_user_id boolean;
  membership_has_id boolean;
  membership_has_created_at boolean;
  membership_has_status boolean;
  membership_has_membership_status boolean;
  cohort_members_table_exists boolean;
  cohort_members_has_org_id boolean;
  moved_count bigint;
  conflicts_count bigint := 0;
  status_expr text;
  created_order_expr text;
  delete_conflicts_sql text;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations'
      AND column_name = 'metadata'
  ) INTO has_org_metadata;

  CREATE TEMP TABLE tmp_jhson_candidates (
    id uuid PRIMARY KEY,
    name text,
    created_at timestamptz,
    membership_count bigint,
    template_count bigint
  ) ON COMMIT DROP;

  INSERT INTO tmp_jhson_candidates (id, name, created_at, membership_count, template_count)
  SELECT
    o.id,
    o.name,
    o.created_at,
    COALESCE(m.membership_count, 0),
    COALESCE(t.template_count, 0)
  FROM public.organizations o
  LEFT JOIN (
    SELECT om.organization_id, COUNT(*)::bigint AS membership_count
    FROM public.organization_memberships om
    GROUP BY om.organization_id
  ) m ON m.organization_id = o.id
  LEFT JOIN (
    SELECT st.org_id, COUNT(*)::bigint AS template_count
    FROM public.betterat_org_step_templates st
    GROUP BY st.org_id
  ) t ON t.org_id = o.id
  WHERE o.name ILIKE target_name_pattern;

  SELECT COUNT(*) INTO candidate_count FROM tmp_jhson_candidates;
  RAISE NOTICE 'JHSON candidates found: %', candidate_count;

  IF candidate_count = 0 THEN
    RAISE NOTICE 'No org rows matched %, skipping.', target_name_pattern;
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
  RAISE NOTICE 'JHSON keep id: % (%), merge ids: %', keep_org_id, keep_org_name, merge_count;

  SELECT to_regclass('public.organization_memberships') IS NOT NULL INTO membership_table_exists;

  IF membership_table_exists THEN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'organization_memberships' AND column_name = 'organization_id'
    ) INTO membership_has_org_id;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'organization_memberships' AND column_name = 'user_id'
    ) INTO membership_has_user_id;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'organization_memberships' AND column_name = 'id'
    ) INTO membership_has_id;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'organization_memberships' AND column_name = 'created_at'
    ) INTO membership_has_created_at;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'organization_memberships' AND column_name = 'status'
    ) INTO membership_has_status;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'organization_memberships' AND column_name = 'membership_status'
    ) INTO membership_has_membership_status;
  END IF;

  SELECT to_regclass('public.betterat_org_cohort_members') IS NOT NULL INTO cohort_members_table_exists;
  IF cohort_members_table_exists THEN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'betterat_org_cohort_members' AND column_name = 'org_id'
    ) INTO cohort_members_has_org_id;
  END IF;

  FOR merge_org IN
    SELECT id, name
    FROM tmp_jhson_merge_ids
    ORDER BY id
  LOOP
    RAISE NOTICE 'Merging org % (%)-> %', merge_org.id, merge_org.name, keep_org_id;

    IF membership_table_exists AND membership_has_org_id AND membership_has_user_id THEN
      IF membership_has_id THEN
        status_expr := CASE
          WHEN membership_has_membership_status AND membership_has_status THEN 'COALESCE(m.membership_status::text, m.status::text, '''')'
          WHEN membership_has_membership_status THEN 'COALESCE(m.membership_status::text, '''')'
          WHEN membership_has_status THEN 'COALESCE(m.status::text, '''')'
          ELSE ''''''
        END;

        created_order_expr := CASE
          WHEN membership_has_created_at THEN 'm.created_at DESC NULLS LAST,'
          ELSE ''
        END;

        delete_conflicts_sql := format(
          'WITH ranked AS (
             SELECT
               m.id,
               ROW_NUMBER() OVER (
                 PARTITION BY m.user_id
                 ORDER BY
                   CASE
                     WHEN lower(%1$s) IN (''active'', ''verified'') THEN 3
                     WHEN lower(%1$s) IN (''pending'', ''invited'') THEN 2
                     WHEN lower(%1$s) IN (''rejected'', ''inactive'') THEN 1
                     ELSE 0
                   END DESC,
                   %2$s
                   m.id DESC
               ) AS rn
             FROM public.organization_memberships m
             WHERE m.organization_id IN ($1, $2)
           ),
           losers AS (
             SELECT id
             FROM ranked
             WHERE rn > 1
           )
           DELETE FROM public.organization_memberships om
           USING losers
           WHERE om.id = losers.id',
          status_expr,
          created_order_expr
        );

        EXECUTE delete_conflicts_sql USING keep_org_id, merge_org.id;
        GET DIAGNOSTICS moved_count = ROW_COUNT;
        conflicts_count := conflicts_count + moved_count;

        IF moved_count > 0 THEN
          RAISE NOTICE 'Resolved membership conflicts for merge org %: % row(s)', merge_org.id, moved_count;
        END IF;
      ELSE
        DELETE FROM public.organization_memberships merge_row
        WHERE merge_row.organization_id = merge_org.id
          AND EXISTS (
            SELECT 1
            FROM public.organization_memberships keep_row
            WHERE keep_row.organization_id = keep_org_id
              AND keep_row.user_id = merge_row.user_id
          );
        GET DIAGNOSTICS moved_count = ROW_COUNT;
        conflicts_count := conflicts_count + moved_count;
      END IF;

      UPDATE public.organization_memberships
      SET organization_id = keep_org_id
      WHERE organization_id = merge_org.id;
      GET DIAGNOSTICS moved_count = ROW_COUNT;
      IF moved_count > 0 THEN
        RAISE NOTICE 'Membership rows moved from % to %: %', merge_org.id, keep_org_id, moved_count;
      END IF;
    END IF;

    IF to_regclass('public.betterat_org_step_templates') IS NOT NULL THEN
      UPDATE public.betterat_org_step_templates
      SET org_id = keep_org_id
      WHERE org_id = merge_org.id;
      GET DIAGNOSTICS moved_count = ROW_COUNT;
      IF moved_count > 0 THEN
        RAISE NOTICE 'Step templates moved from % to %: %', merge_org.id, keep_org_id, moved_count;
      END IF;
    END IF;

    IF to_regclass('public.betterat_org_cohorts') IS NOT NULL THEN
      UPDATE public.betterat_org_cohorts
      SET org_id = keep_org_id
      WHERE org_id = merge_org.id;
      GET DIAGNOSTICS moved_count = ROW_COUNT;
      IF moved_count > 0 THEN
        RAISE NOTICE 'Org cohorts moved from % to %: %', merge_org.id, keep_org_id, moved_count;
      END IF;
    END IF;

    IF cohort_members_table_exists AND cohort_members_has_org_id THEN
      UPDATE public.betterat_org_cohort_members
      SET org_id = keep_org_id
      WHERE org_id = merge_org.id;
      GET DIAGNOSTICS moved_count = ROW_COUNT;
      IF moved_count > 0 THEN
        RAISE NOTICE 'Cohort member org_id rows moved from % to %: %', merge_org.id, keep_org_id, moved_count;
      END IF;
    END IF;

    UPDATE public.organizations
    SET
      is_active = false,
      metadata = CASE
        WHEN has_org_metadata THEN
          COALESCE(metadata, '{}'::jsonb)
            || jsonb_build_object(
              'merged_into', keep_org_id::text,
              'merged_at', now()
            )
        ELSE metadata
      END
    WHERE id = merge_org.id;
  END LOOP;

  SELECT COUNT(*)
  INTO active_remaining
  FROM public.organizations o
  WHERE o.name ILIKE target_name_pattern
    AND COALESCE(o.is_active, false) = true;

  IF active_remaining > 1 THEN
    RAISE EXCEPTION 'JHSON merge safety failed: % active org rows remain', active_remaining;
  END IF;

  RAISE NOTICE 'JHSON keep id final: %', keep_org_id;
  RAISE NOTICE 'JHSON merge ids final: %', ARRAY(SELECT id FROM tmp_jhson_merge_ids ORDER BY id);
  RAISE NOTICE 'Total membership conflicts resolved: %', conflicts_count;
END $$;

-- Backfill empty timeline_steps.title values, then enforce non-empty titles
-- going forward.
--
-- Although the original schema declared `title TEXT NOT NULL`, empty strings
-- still satisfied the constraint. Several creation/adoption paths in the app
-- inserted '' (or copied an empty title from the source step during blueprint
-- adoption), causing cards to render the "Untitled step" fallback. Client
-- guards now reject empty titles; this migration cleans up the historical
-- rows and installs a matching CHECK so the DB backstops the invariant.

-- 1. For adopted/copied steps, prefer the source step's title when we have one.
UPDATE timeline_steps AS ts
SET    title = trim(src.title)
FROM   timeline_steps AS src
WHERE  ts.source_id = src.id
  AND  (ts.title IS NULL OR btrim(ts.title) = '')
  AND  src.title IS NOT NULL
  AND  btrim(src.title) <> '';

-- 2. For org-template-backed rows, pull the template title where available.
UPDATE timeline_steps AS ts
SET    title = trim(tpl.title)
FROM   timeline_step_templates AS tpl
WHERE  ts.source_type = 'template'
  AND  ts.source_id = tpl.id
  AND  (ts.title IS NULL OR btrim(ts.title) = '')
  AND  tpl.title IS NOT NULL
  AND  btrim(tpl.title) <> '';

-- 3. Anything still empty gets a stable placeholder using sort_order so the
-- user can identify which card to rename. 'Untitled step' en masse would be
-- harder to disambiguate in the UI.
UPDATE timeline_steps
SET    title = 'Untitled step ' || COALESCE(sort_order::TEXT, id::TEXT)
WHERE  title IS NULL OR btrim(title) = '';

-- 4. Enforce non-empty titles going forward. We keep the existing NOT NULL
-- and add a trim-length CHECK to cover the empty-string gap.
ALTER TABLE timeline_steps
  DROP CONSTRAINT IF EXISTS timeline_steps_title_non_empty;

ALTER TABLE timeline_steps
  ADD CONSTRAINT timeline_steps_title_non_empty
  CHECK (char_length(btrim(title)) > 0);

-- 5. Harden the create RPC so it rejects blank titles server-side too. The
-- client guard already does this, but we want the DB to be authoritative.
CREATE OR REPLACE FUNCTION create_timeline_step(p_input JSONB)
RETURNS SETOF timeline_steps
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_user_id UUID := (p_input->>'user_id')::UUID;
  v_interest_id UUID := (p_input->>'interest_id')::UUID;
  v_title TEXT := btrim(COALESCE(p_input->>'title', ''));
  v_visibility TEXT;
  v_sort_order INTEGER;
  v_starts_at TIMESTAMPTZ;
BEGIN
  IF v_title = '' THEN
    RAISE EXCEPTION 'timeline step title is required and cannot be empty'
      USING ERRCODE = '23514';
  END IF;

  -- Visibility: explicit value wins; otherwise run the cascade
  IF p_input ? 'visibility' AND p_input->>'visibility' IS NOT NULL THEN
    v_visibility := p_input->>'visibility';
  ELSE
    SELECT COALESCE(
      (
        SELECT up.interest_visibility_defaults ->> (v_interest_id::TEXT)
          FROM user_preferences up
         WHERE up.user_id = v_user_id
         LIMIT 1
      ),
      (
        SELECT p.default_step_visibility
          FROM profiles p
         WHERE p.id = v_user_id
         LIMIT 1
      ),
      'followers'
    ) INTO v_visibility;
  END IF;

  -- sort_order: explicit value wins; otherwise epoch-delta seconds
  IF p_input ? 'sort_order' AND p_input->>'sort_order' IS NOT NULL THEN
    v_sort_order := (p_input->>'sort_order')::INTEGER;
  ELSE
    v_sort_order := (
      EXTRACT(EPOCH FROM NOW())
      - EXTRACT(EPOCH FROM TIMESTAMPTZ '2024-01-01 00:00:00+00')
    )::INTEGER;
  END IF;

  -- starts_at: caller may pass explicit null to mean "unscheduled"; only
  -- default to NOW() when the key is absent entirely.
  IF p_input ? 'starts_at' THEN
    v_starts_at := NULLIF(p_input->>'starts_at', '')::TIMESTAMPTZ;
  ELSE
    v_starts_at := NOW();
  END IF;

  RETURN QUERY
  INSERT INTO timeline_steps (
    user_id,
    interest_id,
    organization_id,
    program_session_id,
    source_type,
    source_id,
    title,
    description,
    category,
    status,
    starts_at,
    ends_at,
    location_name,
    location_lat,
    location_lng,
    location_place_id,
    visibility,
    share_approximate_location,
    sort_order,
    metadata
  ) VALUES (
    v_user_id,
    v_interest_id,
    NULLIF(p_input->>'organization_id', '')::UUID,
    NULLIF(p_input->>'program_session_id', '')::UUID,
    COALESCE(p_input->>'source_type', 'manual'),
    NULLIF(p_input->>'source_id', '')::UUID,
    v_title,
    p_input->>'description',
    COALESCE(p_input->>'category', 'general'),
    COALESCE(p_input->>'status', 'pending'),
    v_starts_at,
    NULLIF(p_input->>'ends_at', '')::TIMESTAMPTZ,
    p_input->>'location_name',
    NULLIF(p_input->>'location_lat', '')::DOUBLE PRECISION,
    NULLIF(p_input->>'location_lng', '')::DOUBLE PRECISION,
    p_input->>'location_place_id',
    v_visibility,
    COALESCE((p_input->>'share_approximate_location')::BOOLEAN, FALSE),
    v_sort_order,
    COALESCE(p_input->'metadata', '{}'::jsonb)
  )
  RETURNING *;
END;
$$;

GRANT EXECUTE ON FUNCTION create_timeline_step(JSONB) TO authenticated;

COMMENT ON FUNCTION create_timeline_step(JSONB) IS
  'Creates a timeline step in a single round-trip: validates title is non-empty, resolves visibility cascade, assigns sort_order, inserts the row, and returns it.';

-- Strip the NOW() default for `starts_at` from create_timeline_step RPC.
--
-- Context: `due_at` is now the sole anchor for timeline-step ordering and
-- past/future classification (see lib/races/anchorDate.ts,
-- lib/races/timelineCompare.ts, and lib/races/isItemPast.ts). No consumer
-- reads `starts_at` for ordering anymore — it was a stale zombie field
-- that silently flagged brand-new undated steps as "past" the instant
-- they were created if fallbacks were ever wired back in.
--
-- This migration changes the RPC so an absent `starts_at` key is treated
-- identically to an explicit null: the column is left null and the step is
-- marked "unscheduled" until the user sets an explicit due date.
--
-- No backfill: existing rows with `starts_at = created_at-ish` stay put.
-- They are not used for ordering and clearing them would invalidate any
-- debrief/audit trail recorded against that timestamp.

CREATE OR REPLACE FUNCTION create_timeline_step(p_input JSONB)
RETURNS SETOF timeline_steps
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_user_id UUID := (p_input->>'user_id')::UUID;
  v_interest_id UUID := (p_input->>'interest_id')::UUID;
  v_visibility TEXT;
  v_sort_order INTEGER;
  v_starts_at TIMESTAMPTZ;
BEGIN
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

  -- starts_at: absent key and explicit null both resolve to null. No NOW()
  -- fallback — see migration header for rationale.
  v_starts_at := NULLIF(p_input->>'starts_at', '')::TIMESTAMPTZ;

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
    p_input->>'title',
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

COMMENT ON FUNCTION create_timeline_step(JSONB) IS
  'Creates a timeline step in a single round-trip: resolves visibility cascade, assigns sort_order, inserts the row, and returns it. starts_at is left null when omitted — due_at is the sole anchor for timeline ordering.';

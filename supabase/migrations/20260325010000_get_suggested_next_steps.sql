-- RPC: get_suggested_next_steps
-- Returns the first unadopted step (by sort_order) per subscription, plus progress stats.

CREATE OR REPLACE FUNCTION get_suggested_next_steps(
  p_subscriber_id UUID,
  p_interest_id UUID DEFAULT NULL
)
RETURNS TABLE (
  subscription_id UUID,
  blueprint_id UUID,
  blueprint_title TEXT,
  blueprint_slug TEXT,
  author_id UUID,
  author_name TEXT,
  next_step_id UUID,
  next_step_title TEXT,
  next_step_description TEXT,
  next_step_sort_order INTEGER,
  total_steps BIGINT,
  adopted_count BIGINT,
  dismissed_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    sub.id AS subscription_id,
    bp.id AS blueprint_id,
    bp.title AS blueprint_title,
    bp.slug AS blueprint_slug,
    bp.user_id AS author_id,
    p.full_name AS author_name,
    next_step.id AS next_step_id,
    next_step.title AS next_step_title,
    next_step.description AS next_step_description,
    next_step.sort_order AS next_step_sort_order,
    totals.total_steps,
    totals.adopted_count,
    totals.dismissed_count
  FROM blueprint_subscriptions sub
  JOIN timeline_blueprints bp ON bp.id = sub.blueprint_id AND bp.is_published = true
  LEFT JOIN profiles p ON p.id = bp.user_id
  -- Get progress stats per subscription
  CROSS JOIN LATERAL (
    SELECT
      COUNT(*) FILTER (WHERE TRUE) AS total_steps,
      COUNT(*) FILTER (WHERE bsa.action = 'adopted') AS adopted_count,
      COUNT(*) FILTER (WHERE bsa.action = 'dismissed') AS dismissed_count
    FROM timeline_steps ts
    LEFT JOIN blueprint_step_actions bsa
      ON bsa.subscription_id = sub.id AND bsa.source_step_id = ts.id
    WHERE ts.user_id = bp.user_id
      AND ts.interest_id = bp.interest_id
      AND ts.visibility != 'private'
  ) totals
  -- Get first unadopted step
  CROSS JOIN LATERAL (
    SELECT ts.id, ts.title, ts.description, ts.sort_order
    FROM timeline_steps ts
    WHERE ts.user_id = bp.user_id
      AND ts.interest_id = bp.interest_id
      AND ts.visibility != 'private'
      AND NOT EXISTS (
        SELECT 1 FROM blueprint_step_actions bsa
        WHERE bsa.subscription_id = sub.id
          AND bsa.source_step_id = ts.id
      )
    ORDER BY ts.sort_order ASC
    LIMIT 1
  ) next_step
  WHERE sub.subscriber_id = p_subscriber_id
    AND (p_interest_id IS NULL OR bp.interest_id = p_interest_id);
$$;

GRANT EXECUTE ON FUNCTION get_suggested_next_steps(UUID, UUID) TO anon, authenticated;
NOTIFY pgrst, 'reload schema';

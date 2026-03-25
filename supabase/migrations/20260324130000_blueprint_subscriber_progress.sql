-- Blueprint subscriber progress: RPC + RLS for author visibility
--
-- Gives blueprint authors a per-subscriber view of step adoption,
-- status, ratings, and evidence so they can monitor engagement.

-- 1. RPC: get_blueprint_subscriber_progress
CREATE OR REPLACE FUNCTION get_blueprint_subscriber_progress(p_blueprint_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_result JSONB;
BEGIN
  -- Verify the caller owns this blueprint
  SELECT user_id INTO v_owner_id
    FROM timeline_blueprints
   WHERE id = p_blueprint_id;

  IF v_owner_id IS NULL OR v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized: you do not own this blueprint';
  END IF;

  SELECT COALESCE(jsonb_agg(row_data), '[]'::jsonb)
    INTO v_result
    FROM (
      SELECT jsonb_build_object(
        'subscriber_id', bs.subscriber_id,
        'name', COALESCE(p.full_name, 'Anonymous'),
        'avatar_url', p.avatar_url,
        'subscribed_at', bs.subscribed_at,
        'steps', COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'source_step_id', bsa.source_step_id,
                'adopted_step_id', bsa.adopted_step_id,
                'action', bsa.action,
                'status', COALESCE(ts.status, 'not_adopted'),
                'overall_rating', (ts.metadata -> 'review' ->> 'overall_rating')::int,
                'has_evidence', (ts.metadata -> 'act' -> 'media_urls') IS NOT NULL
                               AND jsonb_array_length(COALESCE(ts.metadata -> 'act' -> 'media_urls', '[]'::jsonb)) > 0,
                'step_title', COALESCE(ts.title, src.title)
              )
            )
            FROM blueprint_step_actions bsa
            LEFT JOIN timeline_steps ts ON ts.id = bsa.adopted_step_id
            LEFT JOIN timeline_steps src ON src.id = bsa.source_step_id
            WHERE bsa.subscription_id = bs.id
          ),
          '[]'::jsonb
        )
      ) AS row_data
      FROM blueprint_subscriptions bs
      JOIN profiles p ON p.id = bs.subscriber_id
      WHERE bs.blueprint_id = p_blueprint_id
      ORDER BY bs.subscribed_at DESC
    ) sub;

  RETURN v_result;
END;
$$;

-- 2. SECURITY DEFINER helper — bypasses RLS on joined tables so the
--    timeline_steps policy can resolve adopted step IDs without being
--    blocked by RLS on blueprint_step_actions / blueprint_subscriptions.
CREATE OR REPLACE FUNCTION get_blueprint_author_adopted_step_ids(p_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT bsa.adopted_step_id
    FROM blueprint_step_actions bsa
    JOIN blueprint_subscriptions bs ON bs.id = bsa.subscription_id
    JOIN timeline_blueprints tb ON tb.id = bs.blueprint_id
   WHERE tb.user_id = p_user_id
     AND bsa.adopted_step_id IS NOT NULL;
$$;

-- 3. RLS policy: blueprint authors can SELECT adopted step copies
DROP POLICY IF EXISTS "Blueprint authors can view adopted step copies" ON timeline_steps;

CREATE POLICY "Blueprint authors can view adopted step copies"
  ON timeline_steps
  FOR SELECT
  USING (
    id IN (SELECT get_blueprint_author_adopted_step_ids(auth.uid()))
  );

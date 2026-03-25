-- Allow blueprint co-subscribers to see each other's non-private timeline steps.
-- This enables the "Peers" section to work without requiring a follow relationship.

-- 1. SECURITY DEFINER helper — returns user IDs who share a blueprint subscription
--    with the given user. Runs with elevated privileges to bypass RLS on
--    blueprint_subscriptions.
CREATE OR REPLACE FUNCTION get_blueprint_co_subscriber_ids(p_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT DISTINCT bs2.subscriber_id
    FROM blueprint_subscriptions bs1
    JOIN blueprint_subscriptions bs2
      ON bs2.blueprint_id = bs1.blueprint_id
     AND bs2.subscriber_id != bs1.subscriber_id
   WHERE bs1.subscriber_id = p_user_id;
$$;

-- 2. RLS policy: blueprint co-subscribers can read each other's non-private steps
CREATE POLICY "Blueprint co-subscribers can view peer steps"
  ON timeline_steps
  FOR SELECT
  USING (
    visibility != 'private'
    AND user_id IN (SELECT get_blueprint_co_subscriber_ids(auth.uid()))
  );

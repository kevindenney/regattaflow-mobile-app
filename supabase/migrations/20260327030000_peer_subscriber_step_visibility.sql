-- Allow co-subscribers of the same blueprint to see each other's non-private
-- timeline steps for the blueprint's interest. This enables the peer timelines
-- feature where subscribers can see progress of other people on the same plan.
CREATE POLICY "Co-subscribers can see peer steps"
  ON public.timeline_steps
  FOR SELECT
  USING (
    visibility <> 'private'
    AND EXISTS (
      SELECT 1
      FROM public.blueprint_subscriptions my_sub
      JOIN public.blueprint_subscriptions peer_sub
        ON my_sub.blueprint_id = peer_sub.blueprint_id
      JOIN public.timeline_blueprints bp
        ON bp.id = my_sub.blueprint_id
      WHERE my_sub.subscriber_id = auth.uid()
        AND peer_sub.subscriber_id = timeline_steps.user_id
        AND bp.interest_id = timeline_steps.interest_id
        AND bp.is_published = true
    )
  );

-- Helper function to check co-subscription without infinite recursion.
-- SECURITY DEFINER bypasses RLS on blueprint_subscriptions itself.
CREATE OR REPLACE FUNCTION public.is_co_subscriber(p_blueprint_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.blueprint_subscriptions bs
    JOIN public.timeline_blueprints bp ON bp.id = bs.blueprint_id
    WHERE bs.subscriber_id = auth.uid()
      AND bs.blueprint_id = p_blueprint_id
      AND bp.is_published = true
  );
$$;

-- Allow subscribers to see other subscribers of the same published blueprint.
-- Uses the SECURITY DEFINER helper to avoid infinite recursion.
CREATE POLICY "Co-subscribers can see peer subscriptions"
  ON public.blueprint_subscriptions
  FOR SELECT
  USING (
    public.is_co_subscriber(blueprint_id)
  );

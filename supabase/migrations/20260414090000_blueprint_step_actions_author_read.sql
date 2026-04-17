-- Allow blueprint authors to read step actions for their blueprints.
-- The existing "Manage own step actions" policy only covers subscribers.
-- The author needs SELECT to power the creator dashboard subscriber views.

CREATE POLICY "Blueprint authors can view step actions"
  ON blueprint_step_actions FOR SELECT
  USING (
    subscription_id IN (
      SELECT bs.id
        FROM blueprint_subscriptions bs
        JOIN timeline_blueprints tb ON tb.id = bs.blueprint_id
       WHERE tb.user_id = auth.uid()
    )
  );

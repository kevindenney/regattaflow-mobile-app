-- Add step_reviewed notification type for mentor feedback sync
ALTER TYPE social_notification_type ADD VALUE IF NOT EXISTS 'step_reviewed';

-- Allow users to read notifications they sent (actor_id = auth.uid()).
-- This powers the "Sent Suggestions" section on the mentor dashboard.
-- Drop-then-create makes this idempotent so the migration can be re-applied
-- if the policy was created out-of-band on the remote database.
DROP POLICY IF EXISTS "Actors can view their own sent notifications" ON social_notifications;
CREATE POLICY "Actors can view their own sent notifications"
  ON social_notifications
  FOR SELECT
  USING (actor_id = auth.uid());

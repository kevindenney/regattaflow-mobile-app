-- Allow authenticated users to create notifications for other users.
-- Previously only service_role could insert, which blocked client-side
-- notification creation (e.g., org invite notifications).
-- Users can still only READ/UPDATE/DELETE their own notifications.

CREATE POLICY "Authenticated users can create notifications"
  ON social_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

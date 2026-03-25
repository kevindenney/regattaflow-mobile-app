-- Create a SECURITY DEFINER function for creating notifications.
-- This bypasses RLS since it runs as the function owner (postgres),
-- allowing authenticated users to create notifications for other users.

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type social_notification_type,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL,
  p_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO social_notifications (user_id, type, title, body, actor_id, data)
  VALUES (p_user_id, p_type, p_title, p_body, p_actor_id, p_data)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;

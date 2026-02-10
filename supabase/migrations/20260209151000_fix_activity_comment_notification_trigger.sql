-- =============================================================================
-- Fix activity_comments notification trigger to use correct column names
-- =============================================================================

-- Add 'activity_comment' to the notification type enum
ALTER TYPE social_notification_type ADD VALUE IF NOT EXISTS 'activity_comment';

-- Replace the trigger function with correct column names
CREATE OR REPLACE FUNCTION notify_on_activity_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_name TEXT;
BEGIN
  -- Don't notify if user is commenting on their own activity
  IF NEW.user_id = NEW.target_user_id THEN
    RETURN NEW;
  END IF;

  -- Get commenter's name
  SELECT full_name INTO v_actor_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Create a notification for the target user using correct columns
  INSERT INTO social_notifications (
    user_id,
    type,
    actor_id,
    title,
    body,
    data
  ) VALUES (
    NEW.target_user_id,
    'activity_comment',
    NEW.user_id,
    COALESCE(v_actor_name, 'Someone') || ' commented on your activity',
    LEFT(NEW.content, 100),
    jsonb_build_object(
      'activity_type', NEW.activity_type,
      'activity_id', NEW.activity_id,
      'comment_id', NEW.id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

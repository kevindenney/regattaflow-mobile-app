-- =============================================================================
-- Forcefully recreate activity_comments notification trigger
-- Drop and recreate to ensure the new version is used
-- =============================================================================

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS trigger_notify_activity_comment ON activity_comments;

-- Drop the old function
DROP FUNCTION IF EXISTS notify_on_activity_comment();

-- Add 'activity_comment' to the notification type enum (if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'activity_comment'
    AND enumtypid = 'social_notification_type'::regtype
  ) THEN
    ALTER TYPE social_notification_type ADD VALUE 'activity_comment';
  END IF;
EXCEPTION WHEN others THEN
  -- Ignore if already exists or type doesn't exist
  NULL;
END $$;

-- Create the new function with correct column names
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
    'race_comment',  -- Use existing enum value that's similar
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
EXCEPTION WHEN others THEN
  -- Don't fail the comment insert if notification fails
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER trigger_notify_activity_comment
AFTER INSERT ON activity_comments
FOR EACH ROW
EXECUTE FUNCTION notify_on_activity_comment();

-- Migration: Push Notifications Infrastructure
-- Enables push notifications for messaging and social interactions

-- =============================================================================
-- PUSH TOKENS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);

-- Enable RLS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view their own tokens
CREATE POLICY "Users can view their own push tokens" ON push_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own tokens
CREATE POLICY "Users can manage their own push tokens" ON push_tokens
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- ADD MESSAGE NOTIFICATION TYPES
-- =============================================================================

-- Note: PostgreSQL doesn't allow directly adding values to enums in a simple way
-- We'll create a new enum type with all values and migrate

-- Create new enum with message types
DO $$
BEGIN
  -- Check if new_message type exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'new_message'
    AND enumtypid = 'social_notification_type'::regtype
  ) THEN
    ALTER TYPE social_notification_type ADD VALUE IF NOT EXISTS 'new_message';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'thread_mention'
    AND enumtypid = 'social_notification_type'::regtype
  ) THEN
    ALTER TYPE social_notification_type ADD VALUE IF NOT EXISTS 'thread_mention';
  END IF;
EXCEPTION WHEN others THEN
  -- Enum values may already exist, that's fine
  NULL;
END $$;

-- =============================================================================
-- NOTIFICATION PREFERENCES - ADD MESSAGE SETTINGS
-- =============================================================================

-- Add message notification columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_preferences'
    AND column_name = 'direct_messages'
  ) THEN
    ALTER TABLE notification_preferences
    ADD COLUMN direct_messages BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notification_preferences'
    AND column_name = 'group_messages'
  ) THEN
    ALTER TABLE notification_preferences
    ADD COLUMN group_messages BOOLEAN DEFAULT true;
  END IF;
END $$;

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Register or update push token
CREATE OR REPLACE FUNCTION register_push_token(
  p_token TEXT,
  p_platform TEXT,
  p_device_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_token_id UUID;
BEGIN
  -- Upsert the token
  INSERT INTO push_tokens (user_id, token, platform, device_name, last_used_at)
  VALUES (auth.uid(), p_token, p_platform, p_device_name, NOW())
  ON CONFLICT (user_id, token)
  DO UPDATE SET
    platform = EXCLUDED.platform,
    device_name = EXCLUDED.device_name,
    last_used_at = NOW()
  RETURNING id INTO v_token_id;

  RETURN v_token_id;
END;
$$;

-- Remove push token (for logout/unregister)
CREATE OR REPLACE FUNCTION remove_push_token(p_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  DELETE FROM push_tokens
  WHERE user_id = auth.uid() AND token = p_token;

  RETURN FOUND;
END;
$$;

-- Get push tokens for a user (used by notification service)
CREATE OR REPLACE FUNCTION get_user_push_tokens(p_user_id UUID)
RETURNS TABLE (
  token TEXT,
  platform TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT token, platform
  FROM push_tokens
  WHERE user_id = p_user_id
  ORDER BY last_used_at DESC;
$$;

-- =============================================================================
-- MESSAGE NOTIFICATION TRIGGER
-- =============================================================================

-- Create notification when a new message is sent in a thread
CREATE OR REPLACE FUNCTION notify_thread_members_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_name TEXT;
  v_thread_name TEXT;
  v_thread_type TEXT;
  v_member RECORD;
BEGIN
  -- Skip system messages
  IF NEW.message_type = 'system' THEN
    RETURN NEW;
  END IF;

  -- Get sender info
  SELECT full_name INTO v_sender_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Get thread info
  SELECT name, thread_type INTO v_thread_name, v_thread_type
  FROM crew_threads
  WHERE id = NEW.thread_id;

  -- Create in-app notifications for all other thread members
  FOR v_member IN
    SELECT ctm.user_id
    FROM crew_thread_members ctm
    WHERE ctm.thread_id = NEW.thread_id
    AND ctm.user_id != NEW.user_id
    AND ctm.is_active = true
  LOOP
    INSERT INTO social_notifications (
      user_id,
      type,
      actor_id,
      title,
      body,
      data
    )
    VALUES (
      v_member.user_id,
      'new_message',
      NEW.user_id,
      CASE
        WHEN v_thread_type = 'direct' THEN COALESCE(v_sender_name, 'Someone')
        ELSE COALESCE(v_thread_name, 'Group Chat')
      END,
      LEFT(NEW.message, 100),
      jsonb_build_object(
        'thread_id', NEW.thread_id,
        'message_id', NEW.id,
        'thread_type', v_thread_type
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger for new messages
DROP TRIGGER IF EXISTS trigger_notify_thread_members ON crew_thread_messages;
CREATE TRIGGER trigger_notify_thread_members
  AFTER INSERT ON crew_thread_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_thread_members_on_message();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE push_tokens IS 'Device push notification tokens for users';
COMMENT ON FUNCTION register_push_token IS 'Register or update a push notification token for the current user';
COMMENT ON FUNCTION remove_push_token IS 'Remove a push notification token (e.g., on logout)';
COMMENT ON FUNCTION get_user_push_tokens IS 'Get all push tokens for a user (for sending notifications)';
COMMENT ON FUNCTION notify_thread_members_on_message IS 'Create in-app notifications when a new message is sent';

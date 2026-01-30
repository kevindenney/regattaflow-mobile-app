-- Migration: Social Notifications System
-- Enables real-time notifications for social interactions

-- =============================================================================
-- NOTIFICATION TYPE ENUM
-- =============================================================================

CREATE TYPE social_notification_type AS ENUM (
  'new_follower',
  'followed_user_race',
  'race_like',
  'race_comment',
  'race_comment_reply',
  'race_result_posted',
  'achievement_earned'
);

-- =============================================================================
-- SOCIAL NOTIFICATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS social_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type social_notification_type NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- who triggered the notification
  regatta_id UUID REFERENCES regattas(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES regatta_comments(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES sailor_achievements(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}'::jsonb, -- additional context data
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_notifications_user ON social_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_social_notifications_unread
  ON social_notifications(user_id, created_at DESC)
  WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_social_notifications_created ON social_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_notifications_actor ON social_notifications(actor_id);

-- Enable RLS
ALTER TABLE social_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON social_notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can mark their notifications as read
CREATE POLICY "Users can update their own notifications" ON social_notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- System can create notifications
CREATE POLICY "Service can create notifications" ON social_notifications
  FOR INSERT WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" ON social_notifications
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- NOTIFICATION PREFERENCES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT false,
  new_follower BOOLEAN DEFAULT true,
  followed_user_race BOOLEAN DEFAULT true,
  race_likes BOOLEAN DEFAULT true,
  race_comments BOOLEAN DEFAULT true,
  achievements BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view their own preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own preferences
CREATE POLICY "Users can manage their own preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- TRIGGER: Create notification on new follow
-- =============================================================================

CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_name TEXT;
BEGIN
  -- Get the follower's name from profiles table
  SELECT full_name INTO v_actor_name
  FROM profiles
  WHERE id = NEW.follower_id;

  -- Create notification for the followed user
  INSERT INTO social_notifications (user_id, type, actor_id, title, body)
  VALUES (
    NEW.following_id,
    'new_follower',
    NEW.follower_id,
    COALESCE(v_actor_name, 'Someone') || ' started following you',
    'Tap to view their profile'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_create_follow_notification ON user_follows;
CREATE TRIGGER trigger_create_follow_notification
  AFTER INSERT ON user_follows
  FOR EACH ROW
  EXECUTE FUNCTION create_follow_notification();

-- =============================================================================
-- TRIGGER: Create notification on race like
-- =============================================================================

CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_name TEXT;
  v_race_name TEXT;
  v_race_owner UUID;
BEGIN
  -- Get the liker's name from profiles table
  SELECT full_name INTO v_actor_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Get race info and owner
  SELECT name, owner_id INTO v_race_name, v_race_owner
  FROM regattas
  WHERE id = NEW.regatta_id;

  -- Don't notify if user is liking their own race
  IF v_race_owner = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Create notification for race owner
  INSERT INTO social_notifications (user_id, type, actor_id, regatta_id, title, body)
  VALUES (
    v_race_owner,
    'race_like',
    NEW.user_id,
    NEW.regatta_id,
    COALESCE(v_actor_name, 'Someone') || ' liked your race',
    v_race_name
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_create_like_notification ON regatta_likes;
CREATE TRIGGER trigger_create_like_notification
  AFTER INSERT ON regatta_likes
  FOR EACH ROW
  EXECUTE FUNCTION create_like_notification();

-- =============================================================================
-- TRIGGER: Create notification on comment
-- =============================================================================

CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_name TEXT;
  v_race_name TEXT;
  v_race_owner UUID;
  v_parent_author UUID;
BEGIN
  -- Get commenter's name from profiles table
  SELECT full_name INTO v_actor_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Get race info
  SELECT name, owner_id INTO v_race_name, v_race_owner
  FROM regattas
  WHERE id = NEW.regatta_id;

  -- If this is a reply, notify the parent comment author
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO v_parent_author
    FROM regatta_comments
    WHERE id = NEW.parent_id;

    -- Don't notify if replying to own comment
    IF v_parent_author IS NOT NULL AND v_parent_author != NEW.user_id THEN
      INSERT INTO social_notifications (user_id, type, actor_id, regatta_id, comment_id, title, body)
      VALUES (
        v_parent_author,
        'race_comment_reply',
        NEW.user_id,
        NEW.regatta_id,
        NEW.id,
        COALESCE(v_actor_name, 'Someone') || ' replied to your comment',
        LEFT(NEW.content, 100)
      );
    END IF;
  END IF;

  -- Notify race owner (if not commenting on own race and not already notified as parent author)
  IF v_race_owner != NEW.user_id AND (v_parent_author IS NULL OR v_race_owner != v_parent_author) THEN
    INSERT INTO social_notifications (user_id, type, actor_id, regatta_id, comment_id, title, body)
    VALUES (
      v_race_owner,
      'race_comment',
      NEW.user_id,
      NEW.regatta_id,
      NEW.id,
      COALESCE(v_actor_name, 'Someone') || ' commented on your race',
      LEFT(NEW.content, 100)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_create_comment_notification ON regatta_comments;
CREATE TRIGGER trigger_create_comment_notification
  AFTER INSERT ON regatta_comments
  FOR EACH ROW
  EXECUTE FUNCTION create_comment_notification();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COUNT(*)
  FROM social_notifications
  WHERE user_id = p_user_id AND is_read = false;
$$;

-- Mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE social_notifications
  SET is_read = true
  WHERE user_id = p_user_id AND is_read = false;
$$;

-- Get recent notifications with actor info
CREATE OR REPLACE FUNCTION get_notifications_with_actors(p_user_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  type social_notification_type,
  title TEXT,
  body TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ,
  regatta_id UUID,
  actor_id UUID,
  actor_name TEXT,
  actor_avatar_emoji TEXT,
  actor_avatar_color TEXT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    sn.id,
    sn.type,
    sn.title,
    sn.body,
    sn.is_read,
    sn.created_at,
    sn.regatta_id,
    sn.actor_id,
    p.full_name as actor_name,
    sp.avatar_emoji as actor_avatar_emoji,
    sp.avatar_color as actor_avatar_color
  FROM social_notifications sn
  LEFT JOIN sailor_profiles sp ON sp.user_id = sn.actor_id
  LEFT JOIN profiles p ON p.id = sn.actor_id
  WHERE sn.user_id = p_user_id
  ORDER BY sn.created_at DESC
  LIMIT p_limit;
$$;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE social_notifications IS 'In-app notifications for social interactions';
COMMENT ON TABLE notification_preferences IS 'User preferences for notification delivery';
COMMENT ON TYPE social_notification_type IS 'Types of social notifications that can be sent';

-- Migration: Enhanced Follow Options for Strava-style social features
-- Adds favorite, notification, and mute options to user follows

-- =============================================================================
-- ADD NEW COLUMNS TO user_follows
-- =============================================================================

ALTER TABLE user_follows
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index for finding favorites (for feed ordering)
CREATE INDEX IF NOT EXISTS idx_user_follows_favorite
  ON user_follows(follower_id, is_favorite DESC);

-- Index for notification queries
CREATE INDEX IF NOT EXISTS idx_user_follows_notifications
  ON user_follows(following_id)
  WHERE notifications_enabled = true;

-- Index for muted users (to filter them out)
CREATE INDEX IF NOT EXISTS idx_user_follows_muted
  ON user_follows(follower_id)
  WHERE is_muted = true;

-- =============================================================================
-- UPDATE POLICIES TO ALLOW COLUMN UPDATES
-- =============================================================================

-- Users can update their own follows (for setting favorites, notifications, mute)
DROP POLICY IF EXISTS "Users can update their own follows" ON user_follows;
CREATE POLICY "Users can update their own follows" ON user_follows
  FOR UPDATE
  USING (auth.uid() = follower_id)
  WITH CHECK (auth.uid() = follower_id);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN user_follows.is_favorite IS 'Mark as favorite - their activities appear first in feed';
COMMENT ON COLUMN user_follows.notifications_enabled IS 'Get notified when they race or post';
COMMENT ON COLUMN user_follows.is_muted IS 'Hide their activities from your feed without unfollowing';

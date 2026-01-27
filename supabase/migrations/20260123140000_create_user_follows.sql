-- Migration: Create user_follows table for social-style user discovery
-- This enables users to follow other RegattaFlow users, making crew discovery
-- more accessible for users who aren't yet part of fleets.

-- =============================================================================
-- CREATE TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique follow relationships and prevent self-follows
  CONSTRAINT user_follows_unique UNIQUE(follower_id, following_id),
  CONSTRAINT user_follows_no_self_follow CHECK (follower_id != following_id)
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Index for finding who a user follows
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);

-- Index for finding a user's followers
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- Composite index for checking if a specific follow relationship exists
CREATE INDEX IF NOT EXISTS idx_user_follows_relationship ON user_follows(follower_id, following_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Users can view their own follows (who they follow)
CREATE POLICY "Users can view their own follows" ON user_follows
  FOR SELECT
  USING (auth.uid() = follower_id);

-- Users can see who follows them
CREATE POLICY "Users can view their followers" ON user_follows
  FOR SELECT
  USING (auth.uid() = following_id);

-- Users can follow others
CREATE POLICY "Users can follow others" ON user_follows
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow (only their own follows)
CREATE POLICY "Users can unfollow" ON user_follows
  FOR DELETE
  USING (auth.uid() = follower_id);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE user_follows IS 'Stores one-way follow relationships between users for social crew discovery';
COMMENT ON COLUMN user_follows.follower_id IS 'The user who is following';
COMMENT ON COLUMN user_follows.following_id IS 'The user being followed';

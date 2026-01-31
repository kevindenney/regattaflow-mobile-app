-- Migration: Add follower sharing setting to sailor_profiles
-- This replaces per-race content_visibility with a global setting

-- Add allow_follower_sharing column to sailor_profiles
-- Default to true so existing users can continue sharing with followers
ALTER TABLE sailor_profiles
ADD COLUMN IF NOT EXISTS allow_follower_sharing BOOLEAN DEFAULT true;

-- Add comment explaining the column
COMMENT ON COLUMN sailor_profiles.allow_follower_sharing IS
  'Global setting to allow/disallow sharing race prep content with followers. When true, followers can see race content. When false, all race content is private.';

-- Create index for efficient filtering in queries
CREATE INDEX IF NOT EXISTS idx_sailor_profiles_allow_follower_sharing
  ON sailor_profiles(allow_follower_sharing)
  WHERE allow_follower_sharing = true;

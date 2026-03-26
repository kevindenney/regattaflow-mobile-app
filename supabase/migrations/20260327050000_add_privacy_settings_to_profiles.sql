-- Migration: Add privacy settings columns to profiles table
-- Centralises privacy controls that were previously scattered (sailor_profiles)
-- or missing entirely (peer visibility, profile discoverability, default step visibility).

-- =============================================================================
-- PROFILES TABLE: Privacy columns
-- =============================================================================

-- Public/private profile toggle
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_public BOOLEAN DEFAULT true;

COMMENT ON COLUMN profiles.profile_public IS
  'When true the profile is discoverable by anyone. When false only followers and org members can see it.';

-- Default visibility for newly-created timeline steps (cascade level 1)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS default_step_visibility TEXT DEFAULT 'followers'
    CHECK (default_step_visibility IN ('private', 'followers', 'coaches', 'organization'));

COMMENT ON COLUMN profiles.default_step_visibility IS
  'Profile-level default visibility applied to new timeline steps when no per-interest override exists.';

-- Global opt-out for blueprint co-subscriber peer visibility
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS allow_peer_visibility BOOLEAN DEFAULT true;

COMMENT ON COLUMN profiles.allow_peer_visibility IS
  'When false the user''s steps are hidden from blueprint co-subscribers (peer timelines).';

-- Follower sharing (migrated from sailor_profiles to be universal)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS allow_follower_sharing BOOLEAN DEFAULT true;

COMMENT ON COLUMN profiles.allow_follower_sharing IS
  'When false followers cannot see any of this user''s non-private steps.';

-- Index for RLS performance
CREATE INDEX IF NOT EXISTS idx_profiles_profile_public
  ON profiles(profile_public) WHERE profile_public = true;

-- =============================================================================
-- USER_PREFERENCES TABLE: Per-interest visibility defaults (cascade level 2)
-- =============================================================================

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS interest_visibility_defaults JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN user_preferences.interest_visibility_defaults IS
  'Per-interest default step visibility overrides. Shape: { "<interest_id>": "private"|"followers"|"coaches"|"organization" }';

-- =============================================================================
-- BACKFILL: Copy allow_follower_sharing from sailor_profiles → profiles
-- =============================================================================

UPDATE profiles p
SET allow_follower_sharing = COALESCE(sp.allow_follower_sharing, true)
FROM sailor_profiles sp
WHERE sp.user_id = p.id
  AND sp.allow_follower_sharing IS NOT NULL;

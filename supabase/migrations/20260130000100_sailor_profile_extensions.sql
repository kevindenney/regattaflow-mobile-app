-- Migration: Sailor Profile Extensions for Strava-style profiles
-- Adds stats caching, achievements, media gallery, and extended profile fields

-- =============================================================================
-- CACHED STATS TABLE FOR PERFORMANCE
-- =============================================================================

CREATE TABLE IF NOT EXISTS sailor_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_races INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  podiums INTEGER DEFAULT 0,
  average_finish DECIMAL(5,2),
  win_rate DECIMAL(5,2),
  season_races INTEGER DEFAULT 0,
  season_wins INTEGER DEFAULT 0,
  season_podiums INTEGER DEFAULT 0,
  last_race_date TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sailor_stats ENABLE ROW LEVEL SECURITY;

-- Everyone can view stats
CREATE POLICY "Anyone can view sailor stats" ON sailor_stats
  FOR SELECT USING (true);

-- System can insert/update (via trigger or function)
CREATE POLICY "Service can manage sailor stats" ON sailor_stats
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- ACHIEVEMENTS/TROPHIES TABLE
-- =============================================================================

CREATE TYPE achievement_type AS ENUM (
  'first_race',
  'first_win',
  'first_podium',
  'race_milestone_10',
  'race_milestone_50',
  'race_milestone_100',
  'win_streak_3',
  'win_streak_5',
  'series_champion',
  'regatta_champion',
  'year_end_champion',
  'perfect_season',
  'comeback_victory',
  'most_improved'
);

CREATE TABLE IF NOT EXISTS sailor_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type achievement_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- emoji or icon name
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  related_regatta_id UUID REFERENCES regattas(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,

  CONSTRAINT unique_user_achievement UNIQUE(user_id, achievement_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sailor_achievements_user ON sailor_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_sailor_achievements_earned ON sailor_achievements(earned_at DESC);

-- Enable RLS
ALTER TABLE sailor_achievements ENABLE ROW LEVEL SECURITY;

-- Everyone can view achievements
CREATE POLICY "Anyone can view achievements" ON sailor_achievements
  FOR SELECT USING (true);

-- System can insert achievements
CREATE POLICY "Service can create achievements" ON sailor_achievements
  FOR INSERT WITH CHECK (true);

-- =============================================================================
-- MEDIA GALLERY TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS sailor_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  media_type TEXT DEFAULT 'image', -- 'image', 'video'
  regatta_id UUID REFERENCES regattas(id) ON DELETE SET NULL,
  caption TEXT,
  is_featured BOOLEAN DEFAULT false,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sailor_media_user ON sailor_media(user_id);
CREATE INDEX IF NOT EXISTS idx_sailor_media_featured ON sailor_media(user_id, is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_sailor_media_regatta ON sailor_media(regatta_id);

-- Enable RLS
ALTER TABLE sailor_media ENABLE ROW LEVEL SECURITY;

-- Everyone can view media
CREATE POLICY "Anyone can view sailor media" ON sailor_media
  FOR SELECT USING (true);

-- Users can manage their own media
CREATE POLICY "Users can manage their own media" ON sailor_media
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- EXTEND SAILOR_PROFILES TABLE
-- =============================================================================

ALTER TABLE sailor_profiles
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS home_club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
  ADD COLUMN IF NOT EXISTS is_profile_public BOOLEAN DEFAULT true;

-- Index for public profiles
CREATE INDEX IF NOT EXISTS idx_sailor_profiles_public
  ON sailor_profiles(user_id)
  WHERE is_profile_public = true;

-- =============================================================================
-- HELPER FUNCTION: Get sailor profile with stats
-- =============================================================================

CREATE OR REPLACE FUNCTION get_sailor_profile_with_stats(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_emoji TEXT,
  avatar_color TEXT,
  bio TEXT,
  location TEXT,
  total_races INTEGER,
  wins INTEGER,
  podiums INTEGER,
  win_rate DECIMAL,
  follower_count BIGINT,
  following_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    sp.user_id,
    p.full_name as display_name,
    sp.avatar_emoji,
    sp.avatar_color,
    sp.bio,
    sp.location,
    COALESCE(ss.total_races, 0) as total_races,
    COALESCE(ss.wins, 0) as wins,
    COALESCE(ss.podiums, 0) as podiums,
    COALESCE(ss.win_rate, 0) as win_rate,
    (SELECT COUNT(*) FROM user_follows WHERE following_id = p_user_id) as follower_count,
    (SELECT COUNT(*) FROM user_follows WHERE follower_id = p_user_id) as following_count
  FROM sailor_profiles sp
  LEFT JOIN profiles p ON p.id = sp.user_id
  LEFT JOIN sailor_stats ss ON ss.user_id = sp.user_id
  WHERE sp.user_id = p_user_id;
$$;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE sailor_stats IS 'Cached performance statistics for sailors, updated periodically';
COMMENT ON TABLE sailor_achievements IS 'Earned achievements and trophies for sailors';
COMMENT ON TABLE sailor_media IS 'Photo and video gallery for sailor profiles';
COMMENT ON COLUMN sailor_profiles.bio IS 'User bio/description for their profile';
COMMENT ON COLUMN sailor_profiles.location IS 'Home location (e.g., Hong Kong, Sydney)';

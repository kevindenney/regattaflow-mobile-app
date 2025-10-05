-- ============================================================================
-- VENUE INTELLIGENCE CACHE
-- ============================================================================
-- User-specific caching of AI-generated venue insights
-- Reduces redundant AI API calls and improves performance
-- Cache expires after 24 hours to ensure fresh intelligence

-- Create venue intelligence cache table
CREATE TABLE IF NOT EXISTS venue_intelligence_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id TEXT REFERENCES sailing_venues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- AI-generated insights
  insights JSONB NOT NULL,

  -- Additional cached data
  weather_data JSONB,
  cultural_data JSONB,

  -- Cache metadata
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One cache entry per user per venue
  UNIQUE(venue_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_venue_intelligence_cache_venue
  ON venue_intelligence_cache(venue_id);

CREATE INDEX IF NOT EXISTS idx_venue_intelligence_cache_user
  ON venue_intelligence_cache(user_id);

CREATE INDEX IF NOT EXISTS idx_venue_intelligence_cache_expires
  ON venue_intelligence_cache(expires_at);

-- Combined index for common query pattern
CREATE INDEX IF NOT EXISTS idx_venue_intelligence_cache_lookup
  ON venue_intelligence_cache(user_id, venue_id, expires_at);

-- Enable RLS
ALTER TABLE venue_intelligence_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own cache
DROP POLICY IF EXISTS "Users can view own cache" ON venue_intelligence_cache;
CREATE POLICY "Users can view own cache"
  ON venue_intelligence_cache
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own cache" ON venue_intelligence_cache;
CREATE POLICY "Users can insert own cache"
  ON venue_intelligence_cache
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own cache" ON venue_intelligence_cache;
CREATE POLICY "Users can update own cache"
  ON venue_intelligence_cache
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own cache" ON venue_intelligence_cache;
CREATE POLICY "Users can delete own cache"
  ON venue_intelligence_cache
  FOR DELETE
  USING (auth.uid() = user_id);

-- Update trigger
CREATE TRIGGER trigger_update_venue_intelligence_cache_updated_at
  BEFORE UPDATE ON venue_intelligence_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean expired cache entries (run periodically)
CREATE OR REPLACE FUNCTION clean_expired_venue_cache()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM venue_intelligence_cache
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON TABLE venue_intelligence_cache IS 'User-specific cache of AI-generated venue intelligence, expires after 24 hours';
COMMENT ON FUNCTION clean_expired_venue_cache IS 'Removes expired venue intelligence cache entries';

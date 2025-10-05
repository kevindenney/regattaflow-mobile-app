-- AI-generated content cache table
-- Purpose: Cache AI agent outputs to reduce API costs and improve performance
-- TTL: 24h for venue intelligence, 12h for course predictions

CREATE TABLE IF NOT EXISTS venue_intelligence_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES sailing_venues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Cache content
  insights JSONB NOT NULL,
  agent_type TEXT NOT NULL, -- 'venue_intelligence' | 'course_prediction'

  -- Cache metadata
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  tokens_used INTEGER,

  -- Performance tracking
  generation_time_ms INTEGER,
  tools_used TEXT[],

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(venue_id, user_id, agent_type)
);

-- Index for fast lookups
CREATE INDEX idx_venue_intelligence_cache_lookup
  ON venue_intelligence_cache(venue_id, user_id, agent_type, expires_at);

-- Index for cleanup
CREATE INDEX idx_venue_intelligence_cache_expiry
  ON venue_intelligence_cache(expires_at);

-- RLS policies
ALTER TABLE venue_intelligence_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own cached insights"
  ON venue_intelligence_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cached insights"
  ON venue_intelligence_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cached insights"
  ON venue_intelligence_cache FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cached insights"
  ON venue_intelligence_cache FOR DELETE
  USING (auth.uid() = user_id);

-- Automatic cleanup of expired cache (runs daily)
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM venue_intelligence_cache
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE venue_intelligence_cache IS 'Cache for AI agent-generated insights to reduce API costs and improve performance';
COMMENT ON COLUMN venue_intelligence_cache.agent_type IS 'Type of agent that generated the cache: venue_intelligence or course_prediction';
COMMENT ON COLUMN venue_intelligence_cache.expires_at IS 'When the cache expires and should be regenerated';
COMMENT ON COLUMN venue_intelligence_cache.tokens_used IS 'Number of AI tokens consumed to generate this cache entry';

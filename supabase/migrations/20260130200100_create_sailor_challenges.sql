-- Migration: Create sailor_challenges table for the Reflect tab
-- Supports gamified challenges with progress tracking and rewards

-- =============================================================================
-- SAILOR CHALLENGES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS sailor_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Challenge definition
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('race_count', 'podium_count', 'win_count', 'streak', 'venue_count', 'custom')),

  -- Progress tracking
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,

  -- Timeframe
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Completion
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,

  -- Reward/badge
  reward TEXT, -- e.g., "Podium Pro Badge"

  -- Display
  icon TEXT DEFAULT 'flag',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_sailor_challenges_user ON sailor_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_sailor_challenges_active ON sailor_challenges(user_id, end_date) WHERE NOT is_completed;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE sailor_challenges ENABLE ROW LEVEL SECURITY;

-- Users can view their own challenges
CREATE POLICY "Users can view their own challenges" ON sailor_challenges
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own challenges
CREATE POLICY "Users can create their own challenges" ON sailor_challenges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own challenges
CREATE POLICY "Users can update their own challenges" ON sailor_challenges
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own challenges
CREATE POLICY "Users can delete their own challenges" ON sailor_challenges
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE sailor_challenges IS 'Gamified challenges for sailors with progress tracking and rewards';
COMMENT ON COLUMN sailor_challenges.type IS 'Challenge type: race_count, podium_count, win_count, streak, venue_count, or custom';
COMMENT ON COLUMN sailor_challenges.reward IS 'Badge or reward text shown upon completion';

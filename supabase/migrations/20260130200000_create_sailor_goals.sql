-- Migration: Create sailor_goals table for the Reflect tab
-- Allows sailors to set and track personal goals (races, wins, time on water, etc.)

-- =============================================================================
-- SAILOR GOALS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS sailor_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Goal definition
  type TEXT NOT NULL CHECK (type IN ('races', 'wins', 'podiums', 'time_on_water', 'venues', 'improvement', 'custom')),
  title TEXT NOT NULL,
  description TEXT,

  -- Progress tracking
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  unit TEXT NOT NULL, -- 'races', 'wins', 'hours', 'venues', 'avg position'

  -- Timeframe
  period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'season', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Completion
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,

  -- Display
  icon TEXT DEFAULT 'flag',
  color TEXT DEFAULT 'systemBlue',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_sailor_goals_user ON sailor_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_sailor_goals_active ON sailor_goals(user_id) WHERE NOT is_completed;
CREATE INDEX IF NOT EXISTS idx_sailor_goals_period ON sailor_goals(user_id, period, start_date);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE sailor_goals ENABLE ROW LEVEL SECURITY;

-- Users can view their own goals
CREATE POLICY "Users can view their own goals" ON sailor_goals
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own goals
CREATE POLICY "Users can create their own goals" ON sailor_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own goals
CREATE POLICY "Users can update their own goals" ON sailor_goals
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own goals
CREATE POLICY "Users can delete their own goals" ON sailor_goals
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- TRIGGER: Update updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_sailor_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sailor_goals_updated_at
  BEFORE UPDATE ON sailor_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_sailor_goals_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE sailor_goals IS 'Personal goals set by sailors for tracking progress in the Reflect tab';
COMMENT ON COLUMN sailor_goals.type IS 'Category of goal: races, wins, podiums, time_on_water, venues, improvement, or custom';
COMMENT ON COLUMN sailor_goals.period IS 'Duration of goal: weekly, monthly, season, or yearly';
COMMENT ON COLUMN sailor_goals.current_value IS 'Current progress towards the goal target';

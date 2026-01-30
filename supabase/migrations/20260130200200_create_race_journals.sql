-- Migration: Create race_journals table for the Reflect tab
-- Allows sailors to write private reflections on their races

-- =============================================================================
-- RACE JOURNALS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS race_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Race reference (optional - can log races not in system)
  regatta_id UUID REFERENCES regattas(id) ON DELETE SET NULL,
  regatta_name TEXT NOT NULL,
  race_date DATE NOT NULL,

  -- Race outcome
  position INTEGER,
  fleet_size INTEGER,

  -- Reflection
  mood TEXT CHECK (mood IN ('great', 'good', 'neutral', 'challenging', 'difficult')),
  pre_race_notes TEXT,
  post_race_notes TEXT,

  -- Structured reflection
  what_worked TEXT[], -- Array of things that went well
  what_to_improve TEXT[], -- Array of areas for improvement

  -- Conditions during the race
  conditions JSONB, -- { windSpeed, windDirection, waveHeight, current }

  -- Tuning settings used
  tuning_settings JSONB, -- { 'Jib Lead': 'Hole 3', 'Backstay': '8/10', ... }

  -- Key moments
  key_moments TEXT[], -- Array of notable moments during the race

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_race_journals_user ON race_journals(user_id);
CREATE INDEX IF NOT EXISTS idx_race_journals_regatta ON race_journals(regatta_id);
CREATE INDEX IF NOT EXISTS idx_race_journals_date ON race_journals(race_date DESC);
CREATE INDEX IF NOT EXISTS idx_race_journals_user_date ON race_journals(user_id, race_date DESC);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE race_journals ENABLE ROW LEVEL SECURITY;

-- Users can view their own journal entries
CREATE POLICY "Users can view their own journals" ON race_journals
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own journal entries
CREATE POLICY "Users can create their own journals" ON race_journals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own journal entries
CREATE POLICY "Users can update their own journals" ON race_journals
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own journal entries
CREATE POLICY "Users can delete their own journals" ON race_journals
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- TRIGGER: Update updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_race_journals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER race_journals_updated_at
  BEFORE UPDATE ON race_journals
  FOR EACH ROW
  EXECUTE FUNCTION update_race_journals_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE race_journals IS 'Private race reflections and learnings for sailors';
COMMENT ON COLUMN race_journals.mood IS 'Overall feeling about the race: great, good, neutral, challenging, or difficult';
COMMENT ON COLUMN race_journals.what_worked IS 'Array of things that went well during the race';
COMMENT ON COLUMN race_journals.what_to_improve IS 'Array of areas identified for improvement';
COMMENT ON COLUMN race_journals.conditions IS 'JSON object with race conditions (windSpeed, windDirection, etc.)';
COMMENT ON COLUMN race_journals.tuning_settings IS 'JSON object with boat tuning settings used during the race';

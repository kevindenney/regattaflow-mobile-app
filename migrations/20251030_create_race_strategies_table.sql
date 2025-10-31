-- ============================================
-- RACE STRATEGIES TABLE
-- Stores AI-generated and user race strategies
-- ============================================

CREATE TABLE IF NOT EXISTS race_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Strategy type and classification
  strategy_type TEXT NOT NULL DEFAULT 'pre_race'
    CHECK (strategy_type IN ('pre_race', 'in_race', 'post_race', 'practice')),

  -- Start strategy fields
  favored_end TEXT
    CHECK (favored_end IN ('pin', 'boat', 'middle')),
  start_line_bias TEXT, -- stored as string, e.g., "5" or "-3"
  layline_approach TEXT,
  wind_strategy TEXT,
  confidence_score INTEGER
    CHECK (confidence_score >= 0 AND confidence_score <= 100),

  -- Full AI strategy and additional data
  strategy_content JSONB DEFAULT '{}'::jsonb,

  -- AI metadata
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,

  -- Timestamps
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(regatta_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_race_strategies_regatta ON race_strategies(regatta_id);
CREATE INDEX idx_race_strategies_user ON race_strategies(user_id);
CREATE INDEX idx_race_strategies_type ON race_strategies(strategy_type);
CREATE INDEX idx_race_strategies_ai_generated ON race_strategies(ai_generated) WHERE ai_generated = true;
CREATE INDEX idx_race_strategies_content ON race_strategies USING GIN (strategy_content);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_race_strategies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists before creating (for idempotency)
DROP TRIGGER IF EXISTS race_strategies_updated_at ON race_strategies;

CREATE TRIGGER race_strategies_updated_at
  BEFORE UPDATE ON race_strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_race_strategies_updated_at();

-- Row Level Security (RLS) policies
ALTER TABLE race_strategies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS race_strategies_select_own ON race_strategies;
DROP POLICY IF EXISTS race_strategies_insert_own ON race_strategies;
DROP POLICY IF EXISTS race_strategies_update_own ON race_strategies;
DROP POLICY IF EXISTS race_strategies_delete_own ON race_strategies;

-- Users can view their own strategies
CREATE POLICY race_strategies_select_own
  ON race_strategies
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own strategies
CREATE POLICY race_strategies_insert_own
  ON race_strategies
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own strategies
CREATE POLICY race_strategies_update_own
  ON race_strategies
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own strategies
CREATE POLICY race_strategies_delete_own
  ON race_strategies
  FOR DELETE
  USING (auth.uid() = user_id);

-- Optional: Allow fleet members to view shared strategies (if you want this feature)
-- CREATE POLICY race_strategies_select_fleet
--   ON race_strategies
--   FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM race_participants rp1
--       JOIN race_participants rp2 ON rp1.regatta_id = rp2.regatta_id
--       WHERE rp1.user_id = auth.uid()
--         AND rp2.user_id = race_strategies.user_id
--         AND rp1.fleet_id IS NOT NULL
--         AND rp1.fleet_id = rp2.fleet_id
--     )
--   );

-- Comment for documentation
COMMENT ON TABLE race_strategies IS 'Stores race strategies (AI-generated or user-created) for regattas';
COMMENT ON COLUMN race_strategies.strategy_content IS 'Full AI strategy data and other structured content stored as JSON';
COMMENT ON COLUMN race_strategies.start_line_bias IS 'Line bias in degrees as string. Positive = pin favored, negative = boat favored';

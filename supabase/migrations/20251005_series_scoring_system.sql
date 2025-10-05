-- ============================================================================
-- SERIES SCORING SYSTEM
-- ============================================================================
-- RRS Appendix A compliant scoring system with Low Point, High Point systems
-- Supports discards, tie-breaking, and Sailwave import/export

-- ============================================================================
-- REGATTA RACES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS regatta_races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Race Identity
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  race_number INTEGER NOT NULL,
  race_name TEXT,

  -- Scheduling
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  race_date TIMESTAMPTZ, -- Actual race date/time

  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled',
    'postponed',
    'in_progress',
    'completed',
    'abandoned',
    'cancelled'
  )),

  -- Race Configuration
  course_id UUID, -- Reference to course if applicable
  distance_nm DECIMAL(10, 2), -- Nautical miles
  time_limit INTERVAL,

  -- Scoring
  weight DECIMAL(5, 2) DEFAULT 1.0, -- For weighted races (usually 1.0)
  use_corrected_time BOOLEAN DEFAULT true,

  -- Results
  results_approved BOOLEAN DEFAULT false,
  results_approved_by UUID REFERENCES auth.users(id),
  results_approved_at TIMESTAMPTZ,

  -- Notes
  race_notes TEXT,
  weather_conditions TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(regatta_id, race_number)
);

CREATE INDEX idx_regatta_races_regatta ON regatta_races(regatta_id);
CREATE INDEX idx_regatta_races_status ON regatta_races(status);
CREATE INDEX idx_regatta_races_scheduled_date ON regatta_races(scheduled_date);

-- ============================================================================
-- SERIES STANDINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS series_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Series Identity
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES race_entries(id) ON DELETE CASCADE,
  division TEXT,

  -- Rankings
  rank INTEGER NOT NULL,
  tied BOOLEAN DEFAULT false,
  tie_breaker TEXT, -- Description of how tie was broken

  -- Points
  total_points DECIMAL(10, 2) NOT NULL,
  net_points DECIMAL(10, 2) NOT NULL, -- After discards
  races_sailed INTEGER NOT NULL,
  discards_used INTEGER DEFAULT 0,

  -- Race Scores (JSONB for flexibility)
  race_scores JSONB NOT NULL DEFAULT '[]',
  -- Structure: [{ race_number: 1, points: 3.0, finish_position: 3, excluded: false, score_code: null }]

  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  calculation_version TEXT, -- Track scoring engine version

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(regatta_id, entry_id, division)
);

CREATE INDEX idx_series_standings_regatta ON series_standings(regatta_id);
CREATE INDEX idx_series_standings_entry ON series_standings(entry_id);
CREATE INDEX idx_series_standings_division ON series_standings(division) WHERE division IS NOT NULL;
CREATE INDEX idx_series_standings_rank ON series_standings(rank);

-- ============================================================================
-- SCORING CONFIGURATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS scoring_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Configuration Identity
  regatta_id UUID REFERENCES regattas(id) ON DELETE CASCADE,
  division TEXT, -- Null means default for entire regatta

  -- Scoring System
  system TEXT NOT NULL DEFAULT 'low_point' CHECK (system IN (
    'low_point',     -- RRS A4
    'high_point',    -- RRS A8
    'bonus_point',   -- RRS A8.2
    'custom'
  )),

  -- Discard Rules
  discards JSONB NOT NULL DEFAULT '[
    {"after_races": 0, "discards": 0},
    {"after_races": 5, "discards": 1},
    {"after_races": 10, "discards": 2}
  ]',

  -- Scoring Options
  use_corrected_time BOOLEAN DEFAULT true,
  exclude_dns_dnc_from_discard BOOLEAN DEFAULT true,
  first_place_points DECIMAL(5, 2) DEFAULT 1.0,

  -- Penalty Points Configuration
  scoring_penalties JSONB NOT NULL DEFAULT '{
    "DNC": "races_sailed_plus_1",
    "DNS": "races_sailed_plus_1",
    "OCS": "races_sailed_plus_1",
    "ZFP": "races_sailed_plus_1",
    "UFD": "races_sailed_plus_1",
    "BFD": "races_sailed_plus_1",
    "SCP": "did_not_finish",
    "DNF": "races_sailed_plus_1",
    "RET": "races_sailed_plus_1",
    "DSQ": "races_sailed_plus_1",
    "DNE": "races_sailed_plus_1"
  }',

  -- Tie Breaking Rules (ordered)
  tie_breaking_rules TEXT[] DEFAULT ARRAY[
    'last_race',
    'most_firsts',
    'most_seconds',
    'best_in_last'
  ],

  -- Custom Formula (for custom scoring)
  custom_formula TEXT,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(regatta_id, division)
);

CREATE INDEX idx_scoring_configurations_regatta ON scoring_configurations(regatta_id);

-- ============================================================================
-- SAILWAVE IMPORT/EXPORT TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS sailwave_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Import Details
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_url TEXT,

  -- Import Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'processing',
    'completed',
    'failed'
  )),

  -- Statistics
  competitors_imported INTEGER DEFAULT 0,
  races_imported INTEGER DEFAULT 0,
  results_imported INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',

  -- Processing
  imported_by UUID REFERENCES auth.users(id),
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sailwave_imports_regatta ON sailwave_imports(regatta_id);
CREATE INDEX idx_sailwave_imports_status ON sailwave_imports(status);

-- ============================================================================
-- ADD FIELDS TO REGATTAS TABLE
-- ============================================================================
ALTER TABLE regattas ADD COLUMN IF NOT EXISTS results_published BOOLEAN DEFAULT false;
ALTER TABLE regattas ADD COLUMN IF NOT EXISTS results_published_at TIMESTAMPTZ;
ALTER TABLE regattas ADD COLUMN IF NOT EXISTS results_published_by UUID REFERENCES auth.users(id);
ALTER TABLE regattas ADD COLUMN IF NOT EXISTS scoring_system TEXT DEFAULT 'low_point';

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Regatta Races
ALTER TABLE regatta_races ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view scheduled races" ON regatta_races;
CREATE POLICY "Anyone can view scheduled races"
  ON regatta_races FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Race committee can manage races" ON regatta_races;
CREATE POLICY "Race committee can manage races"
  ON regatta_races FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM regattas
      WHERE regattas.id = regatta_races.regatta_id
      AND regattas.organizer_id = auth.uid()
    )
  );

-- Series Standings
ALTER TABLE series_standings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published standings" ON series_standings;
CREATE POLICY "Anyone can view published standings"
  ON series_standings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM regattas
      WHERE regattas.id = series_standings.regatta_id
      AND (
        regattas.results_published = true
        OR regattas.visibility = 'public'
        OR regattas.organizer_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Participants can view their standings" ON series_standings;
CREATE POLICY "Participants can view their standings"
  ON series_standings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM race_entries
      WHERE race_entries.id = series_standings.entry_id
      AND race_entries.sailor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Race committee can manage standings" ON series_standings;
CREATE POLICY "Race committee can manage standings"
  ON series_standings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM regattas
      WHERE regattas.id = series_standings.regatta_id
      AND regattas.organizer_id = auth.uid()
    )
  );

-- Scoring Configurations
ALTER TABLE scoring_configurations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view scoring configurations" ON scoring_configurations;
CREATE POLICY "Anyone can view scoring configurations"
  ON scoring_configurations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Race committee can manage scoring configurations" ON scoring_configurations;
CREATE POLICY "Race committee can manage scoring configurations"
  ON scoring_configurations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM regattas
      WHERE regattas.id = scoring_configurations.regatta_id
      AND regattas.organizer_id = auth.uid()
    )
  );

-- Sailwave Imports
ALTER TABLE sailwave_imports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Race committee can view imports for their regattas" ON sailwave_imports;
CREATE POLICY "Race committee can view imports for their regattas"
  ON sailwave_imports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM regattas
      WHERE regattas.id = sailwave_imports.regatta_id
      AND regattas.organizer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Race committee can create imports" ON sailwave_imports;
CREATE POLICY "Race committee can create imports"
  ON sailwave_imports FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM regattas
      WHERE regattas.id = regatta_id
      AND regattas.organizer_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
DROP TRIGGER IF EXISTS update_regatta_races_updated_at ON regatta_races;
CREATE TRIGGER update_regatta_races_updated_at
  BEFORE UPDATE ON regatta_races
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_series_standings_updated_at ON series_standings;
CREATE TRIGGER update_series_standings_updated_at
  BEFORE UPDATE ON series_standings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scoring_configurations_updated_at ON scoring_configurations;
CREATE TRIGGER update_scoring_configurations_updated_at
  BEFORE UPDATE ON scoring_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update race status when results approved
CREATE OR REPLACE FUNCTION update_race_status_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.results_approved = true AND OLD.results_approved = false THEN
    NEW.status = 'completed';
    NEW.results_approved_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_race_status_trigger ON regatta_races;
CREATE TRIGGER update_race_status_trigger
  BEFORE UPDATE ON regatta_races
  FOR EACH ROW
  WHEN (NEW.results_approved = true AND OLD.results_approved = false)
  EXECUTE FUNCTION update_race_status_on_approval();

-- Function to recalculate series standings
CREATE OR REPLACE FUNCTION recalculate_series_standings(p_regatta_id UUID)
RETURNS void AS $$
BEGIN
  -- This would trigger the scoring engine recalculation
  -- For now, just mark standings as needing recalculation
  UPDATE series_standings
  SET updated_at = NOW()
  WHERE regatta_id = p_regatta_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON regatta_races TO authenticated;
GRANT ALL ON series_standings TO authenticated;
GRANT ALL ON scoring_configurations TO authenticated;
GRANT ALL ON sailwave_imports TO authenticated;

-- Comments
COMMENT ON TABLE regatta_races IS 'Individual races within a regatta series';
COMMENT ON TABLE series_standings IS 'Calculated series standings with RRS Appendix A scoring';
COMMENT ON TABLE scoring_configurations IS 'Scoring system configuration per regatta/division';
COMMENT ON TABLE sailwave_imports IS 'Sailwave file import tracking and history';

-- ============================================================================
-- DEFAULT SCORING CONFIGURATIONS
-- ============================================================================

-- Insert default Low Point scoring configuration
-- This will be used as a template for new regattas
CREATE OR REPLACE FUNCTION create_default_scoring_config(p_regatta_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO scoring_configurations (
    regatta_id,
    system,
    discards,
    use_corrected_time,
    exclude_dns_dnc_from_discard,
    first_place_points,
    scoring_penalties,
    tie_breaking_rules
  ) VALUES (
    p_regatta_id,
    'low_point',
    '[
      {"after_races": 0, "discards": 0},
      {"after_races": 5, "discards": 1},
      {"after_races": 10, "discards": 2}
    ]'::jsonb,
    true,
    true,
    1.0,
    '{
      "DNC": "races_sailed_plus_1",
      "DNS": "races_sailed_plus_1",
      "OCS": "races_sailed_plus_1",
      "ZFP": "races_sailed_plus_1",
      "UFD": "races_sailed_plus_1",
      "BFD": "races_sailed_plus_1",
      "SCP": "did_not_finish",
      "DNF": "races_sailed_plus_1",
      "RET": "races_sailed_plus_1",
      "DSQ": "races_sailed_plus_1",
      "DNE": "races_sailed_plus_1"
    }'::jsonb,
    ARRAY['last_race', 'most_firsts', 'most_seconds', 'best_in_last']
  )
  ON CONFLICT (regatta_id, division) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

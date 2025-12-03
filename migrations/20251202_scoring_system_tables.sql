-- ============================================================================
-- Scoring System Tables Migration
-- Creates tables and columns for race scoring, series standings, and results publishing
-- ============================================================================

-- 1. Add scoring columns to regattas table
ALTER TABLE regattas
ADD COLUMN IF NOT EXISTS scoring_config JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS results_published BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS results_published_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS results_status TEXT DEFAULT 'draft' CHECK (results_status IN ('draft', 'provisional', 'final'));

COMMENT ON COLUMN regattas.scoring_config IS 'JSON configuration for scoring system (discards, penalties, tie-breakers)';
COMMENT ON COLUMN regattas.results_published IS 'Whether results are publicly visible';
COMMENT ON COLUMN regattas.results_published_at IS 'When results were last published';
COMMENT ON COLUMN regattas.results_status IS 'Current status of results: draft, provisional, or final';

-- 2. Create series_standings table for storing calculated standings
CREATE TABLE IF NOT EXISTS series_standings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES race_entries(id) ON DELETE CASCADE,
  division TEXT,
  
  -- Calculated standings
  rank INTEGER NOT NULL,
  total_points NUMERIC(10, 2) NOT NULL DEFAULT 0,
  net_points NUMERIC(10, 2) NOT NULL DEFAULT 0,
  races_sailed INTEGER NOT NULL DEFAULT 0,
  discards_used INTEGER NOT NULL DEFAULT 0,
  
  -- Tie handling
  tied BOOLEAN DEFAULT FALSE,
  tie_breaker TEXT,
  
  -- Race-by-race breakdown (JSONB array)
  race_scores JSONB DEFAULT '[]'::JSONB,
  
  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique standing per entry per division
  UNIQUE(regatta_id, entry_id, COALESCE(division, ''))
);

-- Indexes for series_standings
CREATE INDEX IF NOT EXISTS idx_series_standings_regatta ON series_standings(regatta_id);
CREATE INDEX IF NOT EXISTS idx_series_standings_rank ON series_standings(regatta_id, rank);
CREATE INDEX IF NOT EXISTS idx_series_standings_entry ON series_standings(entry_id);

-- RLS for series_standings
ALTER TABLE series_standings ENABLE ROW LEVEL SECURITY;

-- Public can view published standings
CREATE POLICY "Public can view published standings"
  ON series_standings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM regattas
      WHERE regattas.id = series_standings.regatta_id
      AND regattas.results_published = TRUE
    )
  );

-- Club admins can manage standings
CREATE POLICY "Club admins can manage standings"
  ON series_standings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM regattas r
      JOIN club_members cm ON cm.club_id = r.club_id
      WHERE r.id = series_standings.regatta_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('admin', 'race_officer', 'scorer')
    )
  );

-- 3. Create regatta_races table for tracking individual races in a regatta
CREATE TABLE IF NOT EXISTS regatta_races (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  race_number INTEGER NOT NULL,
  race_name TEXT,
  race_date DATE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  
  -- Race status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'postponed', 'started', 'completed', 'abandoned', 'cancelled')),
  
  -- Course info
  course_type TEXT,
  course_distance NUMERIC(10, 2),
  wind_direction INTEGER,
  wind_speed_avg NUMERIC(5, 2),
  
  -- Scoring weight (for weighted scoring systems)
  weight NUMERIC(5, 2) DEFAULT 1,
  
  -- Protest deadline
  protest_time_limit INTERVAL DEFAULT '90 minutes',
  protest_deadline TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Unique race number per regatta
  UNIQUE(regatta_id, race_number)
);

-- Indexes for regatta_races
CREATE INDEX IF NOT EXISTS idx_regatta_races_regatta ON regatta_races(regatta_id);
CREATE INDEX IF NOT EXISTS idx_regatta_races_status ON regatta_races(regatta_id, status);
CREATE INDEX IF NOT EXISTS idx_regatta_races_date ON regatta_races(race_date);

-- RLS for regatta_races
ALTER TABLE regatta_races ENABLE ROW LEVEL SECURITY;

-- Public can view races for public regattas
CREATE POLICY "Public can view public regatta races"
  ON regatta_races FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM regattas
      WHERE regattas.id = regatta_races.regatta_id
      AND (regattas.results_published = TRUE OR regattas.status = 'active')
    )
  );

-- Club members can manage races
CREATE POLICY "Club members can manage races"
  ON regatta_races FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM regattas r
      JOIN club_members cm ON cm.club_id = r.club_id
      WHERE r.id = regatta_races.regatta_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('admin', 'race_officer', 'scorer')
    )
  );

-- 4. Add columns to race_results table for better scoring
ALTER TABLE race_results
ADD COLUMN IF NOT EXISTS score_code TEXT,
ADD COLUMN IF NOT EXISTS scoring_penalty NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS corrected_position INTEGER,
ADD COLUMN IF NOT EXISTS time_penalty INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS elapsed_time INTERVAL,
ADD COLUMN IF NOT EXISTS corrected_time INTERVAL,
ADD COLUMN IF NOT EXISTS rating NUMERIC(10, 4);

COMMENT ON COLUMN race_results.score_code IS 'Scoring code: DNC, DNS, OCS, ZFP, UFD, BFD, SCP, DNF, RET, DSQ, DNE, RDG, DPI';
COMMENT ON COLUMN race_results.scoring_penalty IS 'Additional scoring penalty points';
COMMENT ON COLUMN race_results.corrected_position IS 'Position after time correction (handicap racing)';
COMMENT ON COLUMN race_results.time_penalty IS 'Time penalty in seconds';
COMMENT ON COLUMN race_results.elapsed_time IS 'Elapsed time from start to finish';
COMMENT ON COLUMN race_results.corrected_time IS 'Corrected time after handicap applied';
COMMENT ON COLUMN race_results.rating IS 'Handicap rating used for this race';

-- 5. Create scoring_templates table for reusable scoring configurations
CREATE TABLE IF NOT EXISTS scoring_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Configuration
  config JSONB NOT NULL,
  
  -- Usage tracking
  is_default BOOLEAN DEFAULT FALSE,
  used_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Only one default per club
CREATE UNIQUE INDEX IF NOT EXISTS idx_scoring_templates_default 
  ON scoring_templates(club_id) 
  WHERE is_default = TRUE;

-- RLS for scoring_templates
ALTER TABLE scoring_templates ENABLE ROW LEVEL SECURITY;

-- Club members can view templates
CREATE POLICY "Club members can view scoring templates"
  ON scoring_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.club_id = scoring_templates.club_id
      AND cm.user_id = auth.uid()
    )
  );

-- Admins can manage templates
CREATE POLICY "Club admins can manage scoring templates"
  ON scoring_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.club_id = scoring_templates.club_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('admin', 'scorer')
    )
  );

-- 6. Create results_change_log table for audit trail
CREATE TABLE IF NOT EXISTS results_change_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  race_number INTEGER,
  entry_id UUID REFERENCES race_entries(id) ON DELETE SET NULL,
  
  -- Change details
  change_type TEXT NOT NULL CHECK (change_type IN ('position', 'score_code', 'penalty', 'discard', 'redress', 'other')),
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  
  -- Who made the change
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_results_change_log_regatta ON results_change_log(regatta_id);
CREATE INDEX IF NOT EXISTS idx_results_change_log_entry ON results_change_log(entry_id);

-- RLS for results_change_log
ALTER TABLE results_change_log ENABLE ROW LEVEL SECURITY;

-- Club members can view change log
CREATE POLICY "Club members can view change log"
  ON results_change_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM regattas r
      JOIN club_members cm ON cm.club_id = r.club_id
      WHERE r.id = results_change_log.regatta_id
      AND cm.user_id = auth.uid()
    )
  );

-- Officers can insert change log entries
CREATE POLICY "Officers can insert change log"
  ON results_change_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM regattas r
      JOIN club_members cm ON cm.club_id = r.club_id
      WHERE r.id = results_change_log.regatta_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('admin', 'race_officer', 'scorer')
    )
  );

-- 7. Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_series_standings_updated_at
    BEFORE UPDATE ON series_standings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regatta_races_updated_at
    BEFORE UPDATE ON regatta_races
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scoring_templates_updated_at
    BEFORE UPDATE ON scoring_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Create function to auto-calculate protest deadline
CREATE OR REPLACE FUNCTION set_protest_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.end_time IS NOT NULL THEN
    NEW.protest_deadline := NEW.end_time + NEW.protest_time_limit;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_set_protest_deadline
    BEFORE INSERT OR UPDATE ON regatta_races
    FOR EACH ROW EXECUTE FUNCTION set_protest_deadline();


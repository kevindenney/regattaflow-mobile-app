-- Rule 42 Infractions Tracking
-- SAILTI-competitive feature for propulsion infraction management

-- Create rule42_infractions table
CREATE TABLE IF NOT EXISTS rule42_infractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  race_number INTEGER NOT NULL,
  entry_id UUID NOT NULL REFERENCES race_entries(id) ON DELETE CASCADE,
  sail_number TEXT,
  
  -- Infraction details
  infraction_type TEXT NOT NULL CHECK (infraction_type IN (
    'pumping', 'rocking', 'ooching', 'sculling', 
    'repeated_tacks', 'repeated_gybes', 'torquing', 'other'
  )),
  infraction_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  leg_of_course TEXT,
  
  -- Warning or penalty
  is_warning BOOLEAN NOT NULL DEFAULT TRUE,
  penalty_type TEXT CHECK (penalty_type IN (
    'warning', 'one_turn', 'two_turns', 'scoring_penalty', 'dsq', 'none'
  )),
  penalty_taken BOOLEAN DEFAULT FALSE,
  penalty_taken_at TIMESTAMPTZ,
  
  -- Observer info
  observer_id UUID REFERENCES auth.users(id),
  observer_name TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_rule42_regatta ON rule42_infractions(regatta_id);
CREATE INDEX IF NOT EXISTS idx_rule42_race ON rule42_infractions(regatta_id, race_number);
CREATE INDEX IF NOT EXISTS idx_rule42_entry ON rule42_infractions(regatta_id, entry_id);
CREATE INDEX IF NOT EXISTS idx_rule42_time ON rule42_infractions(infraction_time DESC);

-- RLS Policies
ALTER TABLE rule42_infractions ENABLE ROW LEVEL SECURITY;

-- Race officers and jury can view all infractions for their regattas
CREATE POLICY "Race officers can view infractions"
  ON rule42_infractions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM regattas r
      WHERE r.id = rule42_infractions.regatta_id
      AND (r.created_by = auth.uid() OR r.club_id IN (
        SELECT club_id FROM club_members WHERE user_id = auth.uid() AND role IN ('admin', 'race_officer', 'pro')
      ))
    )
  );

-- Race officers and jury can insert infractions
CREATE POLICY "Race officers can log infractions"
  ON rule42_infractions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM regattas r
      WHERE r.id = rule42_infractions.regatta_id
      AND (r.created_by = auth.uid() OR r.club_id IN (
        SELECT club_id FROM club_members WHERE user_id = auth.uid() AND role IN ('admin', 'race_officer', 'pro')
      ))
    )
  );

-- Race officers can update infractions
CREATE POLICY "Race officers can update infractions"
  ON rule42_infractions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM regattas r
      WHERE r.id = rule42_infractions.regatta_id
      AND (r.created_by = auth.uid() OR r.club_id IN (
        SELECT club_id FROM club_members WHERE user_id = auth.uid() AND role IN ('admin', 'race_officer', 'pro')
      ))
    )
  );

-- Race officers can delete infractions
CREATE POLICY "Race officers can delete infractions"
  ON rule42_infractions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM regattas r
      WHERE r.id = rule42_infractions.regatta_id
      AND (r.created_by = auth.uid() OR r.club_id IN (
        SELECT club_id FROM club_members WHERE user_id = auth.uid() AND role IN ('admin', 'race_officer', 'pro')
      ))
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_rule42_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rule42_updated_at_trigger
  BEFORE UPDATE ON rule42_infractions
  FOR EACH ROW
  EXECUTE FUNCTION update_rule42_updated_at();

-- View for Rule 42 summary by competitor
CREATE OR REPLACE VIEW rule42_competitor_summary AS
SELECT 
  r42.regatta_id,
  r42.entry_id,
  re.sail_number,
  re.boat_name,
  COUNT(*) as total_infractions,
  COUNT(*) FILTER (WHERE r42.is_warning) as warnings,
  COUNT(*) FILTER (WHERE NOT r42.is_warning AND r42.penalty_type NOT IN ('none', 'warning')) as penalties,
  COUNT(*) FILTER (WHERE r42.penalty_type = 'dsq') as dsqs
FROM rule42_infractions r42
JOIN race_entries re ON re.id = r42.entry_id
GROUP BY r42.regatta_id, r42.entry_id, re.sail_number, re.boat_name;

-- View for Rule 42 summary by race
CREATE OR REPLACE VIEW rule42_race_summary AS
SELECT 
  regatta_id,
  race_number,
  COUNT(*) as total_infractions,
  COUNT(*) FILTER (WHERE is_warning) as warnings_given,
  COUNT(*) FILTER (WHERE NOT is_warning) as penalties_given,
  COUNT(DISTINCT entry_id) as boats_flagged
FROM rule42_infractions
GROUP BY regatta_id, race_number;

COMMENT ON TABLE rule42_infractions IS 'Track Rule 42 (propulsion) infractions for SAILTI-competitive jury functionality';


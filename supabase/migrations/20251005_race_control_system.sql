-- ============================================================================
-- RACE CONTROL SYSTEM
-- ============================================================================
-- Race day management for race committees: start sequences, finish recording,
-- protests, and real-time results

-- ============================================================================
-- RACE RESULTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS race_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Race Identity
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  race_number INTEGER NOT NULL,
  entry_id UUID NOT NULL REFERENCES race_entries(id) ON DELETE CASCADE,

  -- Timing
  start_time TIMESTAMPTZ,
  finish_time TIMESTAMPTZ,
  elapsed_time INTERVAL, -- Calculated: finish_time - start_time
  corrected_time INTERVAL, -- After handicap correction

  -- Position
  finish_position INTEGER,
  corrected_position INTEGER,

  -- Status
  status TEXT NOT NULL DEFAULT 'racing' CHECK (status IN (
    'racing',           -- Currently racing
    'finished',         -- Crossed finish line
    'dnf',             -- Did Not Finish
    'dns',             -- Did Not Start
    'dsq',             -- Disqualified
    'ocs',             -- On Course Side at start
    'dnc',             -- Did Not Compete
    'ret',             -- Retired
    'raf'              -- Retired After Finish
  )),

  -- Penalties
  time_penalty INTERVAL DEFAULT '0 seconds',
  scoring_penalty INTEGER DEFAULT 0, -- Points penalty

  -- Handicap
  handicap_rating DECIMAL(10, 4), -- Stored handicap at time of race

  -- Recording Metadata
  recorded_by UUID REFERENCES auth.users(id),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(regatta_id, race_number, entry_id)
);

CREATE INDEX idx_race_results_regatta_race ON race_results(regatta_id, race_number);
CREATE INDEX idx_race_results_entry ON race_results(entry_id);
CREATE INDEX idx_race_results_status ON race_results(status);
CREATE INDEX idx_race_results_finish_position ON race_results(finish_position);

-- ============================================================================
-- RACE PROTESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS race_protests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Race Identity
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  race_number INTEGER NOT NULL,

  -- Parties
  protestor_entry_id UUID REFERENCES race_entries(id) ON DELETE SET NULL,
  protestee_entry_id UUID REFERENCES race_entries(id) ON DELETE SET NULL,

  -- Protest Details
  protest_type TEXT NOT NULL CHECK (protest_type IN (
    'boat_to_boat',
    'boat_to_rc',      -- Race Committee
    'rc_to_boat',      -- RC protests a boat
    'redress',         -- Request for redress
    'measurement'      -- Equipment/measurement issue
  )),

  incident_time TIMESTAMPTZ,
  incident_location TEXT, -- e.g., "Mark 2 rounding", "Start line"

  -- Hails and Flags
  hail_given BOOLEAN DEFAULT false,
  red_flag_displayed BOOLEAN DEFAULT false,
  protest_flag_time TIMESTAMPTZ,

  -- Details
  description TEXT NOT NULL,
  rules_cited TEXT[], -- e.g., ["Rule 10", "Rule 14"]
  witnesses TEXT[],

  -- Status and Decision
  status TEXT NOT NULL DEFAULT 'filed' CHECK (status IN (
    'filed',           -- Protest filed
    'accepted',        -- Accepted for hearing
    'rejected',        -- Rejected (invalid)
    'hearing_scheduled', -- Hearing scheduled
    'hearing_in_progress',
    'decided',         -- Decision made
    'withdrawn',       -- Withdrawn by protestor
    'abandoned'        -- Abandoned by RC
  )),

  decision TEXT CHECK (decision IN (
    'protestor_right',  -- Protestor in the right
    'protestee_right',  -- Protestee in the right
    'both_at_fault',
    'dismissed',
    'redress_granted',
    'redress_denied'
  )),

  penalty_applied TEXT, -- e.g., "DSQ", "2 turns", "20% time penalty"
  decision_details TEXT,

  -- Hearing
  hearing_time TIMESTAMPTZ,
  hearing_location TEXT,
  jury_members UUID[], -- Array of user IDs

  -- Filing Metadata
  filed_by UUID REFERENCES auth.users(id),
  filed_at TIMESTAMPTZ DEFAULT NOW(),
  decided_by UUID REFERENCES auth.users(id),
  decided_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_race_protests_regatta_race ON race_protests(regatta_id, race_number);
CREATE INDEX idx_race_protests_status ON race_protests(status);
CREATE INDEX idx_race_protests_protestor ON race_protests(protestor_entry_id);
CREATE INDEX idx_race_protests_protestee ON race_protests(protestee_entry_id);

-- ============================================================================
-- RACE FLAGS TABLE (Signal Flags)
-- ============================================================================
CREATE TABLE IF NOT EXISTS race_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Race Identity
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  race_number INTEGER,

  -- Flag Details
  flag_type TEXT NOT NULL CHECK (flag_type IN (
    'ap',              -- Postponement (Answering Pennant)
    'ap_over_a',       -- Postponement with 1 minute
    'ap_over_h',       -- Postponement to shore
    'n',               -- Abandonment
    'l',               -- Come within hail/ashore
    'first_substitute', -- General recall
    'i',               -- Round the ends rule in effect
    'z',               -- Z flag (20% penalty zone)
    'u',               -- U flag (1 minute rule)
    'black',           -- Black flag
    'p',               -- Preparatory
    's',               -- Shortened course
    'm',               -- Mark change
    'y',               -- Life jacket required
    'custom'           -- Custom flag
  )),

  flag_description TEXT, -- For custom flags

  -- Timing
  hoisted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lowered_at TIMESTAMPTZ,

  -- Sound Signals
  sound_signal_count INTEGER DEFAULT 1,

  -- Recording
  recorded_by UUID REFERENCES auth.users(id),
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_race_flags_regatta_race ON race_flags(regatta_id, race_number);
CREATE INDEX idx_race_flags_type ON race_flags(flag_type);
CREATE INDEX idx_race_flags_hoisted ON race_flags(hoisted_at DESC);

-- ============================================================================
-- RACE START SEQUENCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS race_start_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Race Identity
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  race_number INTEGER NOT NULL,

  -- Sequence Timing (in minutes before start)
  warning_signal INTEGER NOT NULL DEFAULT 5,      -- Usually 5 minutes
  preparatory_signal INTEGER NOT NULL DEFAULT 4,  -- Usually 4 minutes
  one_minute_signal INTEGER DEFAULT 1,            -- Optional 1 minute signal
  start_signal INTEGER NOT NULL DEFAULT 0,        -- Start (0 minutes)

  -- Actual Times
  warning_time TIMESTAMPTZ,
  preparatory_time TIMESTAMPTZ,
  one_minute_time TIMESTAMPTZ,
  start_time TIMESTAMPTZ,

  -- Sequence Status
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started',
    'in_progress',
    'completed',
    'postponed',
    'abandoned',
    'general_recall'
  )),

  -- Custom sequence description (e.g., "5-4-1-0" or "10-5-4-1-0")
  sequence_description TEXT,

  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(regatta_id, race_number)
);

CREATE INDEX idx_race_start_sequences_regatta ON race_start_sequences(regatta_id);
CREATE INDEX idx_race_start_sequences_status ON race_start_sequences(status);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Race Results
ALTER TABLE race_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public race results are viewable" ON race_results;
CREATE POLICY "Public race results are viewable"
  ON race_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM regattas
      WHERE regattas.id = race_results.regatta_id
      AND regattas.visibility = 'public'
    )
  );

DROP POLICY IF EXISTS "Race committee can manage race results" ON race_results;
CREATE POLICY "Race committee can manage race results"
  ON race_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM regattas
      WHERE regattas.id = race_results.regatta_id
      AND regattas.organizer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Participants can view their own results" ON race_results;
CREATE POLICY "Participants can view their own results"
  ON race_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM race_entries
      WHERE race_entries.id = race_results.entry_id
      AND race_entries.sailor_id = auth.uid()
    )
  );

-- Race Protests
ALTER TABLE race_protests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view protests for public regattas" ON race_protests;
CREATE POLICY "Anyone can view protests for public regattas"
  ON race_protests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM regattas
      WHERE regattas.id = race_protests.regatta_id
      AND regattas.visibility = 'public'
    )
  );

DROP POLICY IF EXISTS "Participants can file protests" ON race_protests;
CREATE POLICY "Participants can file protests"
  ON race_protests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM race_entries
      WHERE race_entries.id = protestor_entry_id
      AND race_entries.sailor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Protestors can view and update their protests" ON race_protests;
CREATE POLICY "Protestors can view and update their protests"
  ON race_protests FOR UPDATE
  USING (filed_by = auth.uid() AND status IN ('filed', 'accepted'))
  WITH CHECK (filed_by = auth.uid());

DROP POLICY IF EXISTS "Race committee can manage protests" ON race_protests;
CREATE POLICY "Race committee can manage protests"
  ON race_protests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM regattas
      WHERE regattas.id = race_protests.regatta_id
      AND regattas.organizer_id = auth.uid()
    )
  );

-- Race Flags
ALTER TABLE race_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view race flags" ON race_flags;
CREATE POLICY "Anyone can view race flags"
  ON race_flags FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Race committee can manage flags" ON race_flags;
CREATE POLICY "Race committee can manage flags"
  ON race_flags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM regattas
      WHERE regattas.id = race_flags.regatta_id
      AND regattas.organizer_id = auth.uid()
    )
  );

-- Race Start Sequences
ALTER TABLE race_start_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view start sequences" ON race_start_sequences;
CREATE POLICY "Anyone can view start sequences"
  ON race_start_sequences FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Race committee can manage start sequences" ON race_start_sequences;
CREATE POLICY "Race committee can manage start sequences"
  ON race_start_sequences FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM regattas
      WHERE regattas.id = race_start_sequences.regatta_id
      AND regattas.organizer_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
DROP TRIGGER IF EXISTS update_race_results_updated_at ON race_results;
CREATE TRIGGER update_race_results_updated_at
  BEFORE UPDATE ON race_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_race_protests_updated_at ON race_protests;
CREATE TRIGGER update_race_protests_updated_at
  BEFORE UPDATE ON race_protests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_race_start_sequences_updated_at ON race_start_sequences;
CREATE TRIGGER update_race_start_sequences_updated_at
  BEFORE UPDATE ON race_start_sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate elapsed time automatically
CREATE OR REPLACE FUNCTION calculate_elapsed_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.finish_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.elapsed_time = NEW.finish_time - NEW.start_time;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_elapsed_time_trigger ON race_results;
CREATE TRIGGER calculate_elapsed_time_trigger
  BEFORE INSERT OR UPDATE ON race_results
  FOR EACH ROW
  WHEN (NEW.finish_time IS NOT NULL AND NEW.start_time IS NOT NULL)
  EXECUTE FUNCTION calculate_elapsed_time();

-- Auto-assign finish positions in order of finish time
CREATE OR REPLACE FUNCTION assign_finish_positions()
RETURNS TRIGGER AS $$
DECLARE
  next_position INTEGER;
BEGIN
  IF NEW.finish_time IS NOT NULL AND NEW.finish_position IS NULL THEN
    -- Get the next finish position for this race
    SELECT COALESCE(MAX(finish_position), 0) + 1
    INTO next_position
    FROM race_results
    WHERE regatta_id = NEW.regatta_id
    AND race_number = NEW.race_number
    AND status = 'finished';

    NEW.finish_position = next_position;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS assign_finish_positions_trigger ON race_results;
CREATE TRIGGER assign_finish_positions_trigger
  BEFORE INSERT OR UPDATE ON race_results
  FOR EACH ROW
  WHEN (NEW.finish_time IS NOT NULL AND NEW.status = 'finished')
  EXECUTE FUNCTION assign_finish_positions();

-- Grant permissions
GRANT ALL ON race_results TO authenticated;
GRANT ALL ON race_protests TO authenticated;
GRANT ALL ON race_flags TO authenticated;
GRANT ALL ON race_start_sequences TO authenticated;

-- Comments
COMMENT ON TABLE race_results IS 'Race results and finish times for race control';
COMMENT ON TABLE race_protests IS 'Protest management system for race committees';
COMMENT ON TABLE race_flags IS 'Signal flags displayed during racing';
COMMENT ON TABLE race_start_sequences IS 'Start sequence timing for races';

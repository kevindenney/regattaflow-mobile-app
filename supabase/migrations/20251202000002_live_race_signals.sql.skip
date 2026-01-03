-- Live Race Signals System
-- SAILTI-competitive feature for real-time race status broadcasting

-- Create race_signals table
CREATE TABLE IF NOT EXISTS race_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  race_number INTEGER NOT NULL,
  fleet_id UUID REFERENCES fleets(id) ON DELETE SET NULL,
  fleet_name TEXT,
  
  -- Signal details
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'flag', 'sound', 'status_change', 'announcement', 'course_change'
  )),
  flags TEXT[], -- Array of flag codes
  sounds INTEGER, -- Number of sound signals
  status TEXT CHECK (status IN (
    'scheduled', 'postponed', 'warning', 'preparatory', 'one_minute',
    'start', 'racing', 'shortened', 'abandoned', 'finished', 'protesting'
  )),
  
  -- Content
  title TEXT NOT NULL,
  message TEXT,
  course_designation TEXT,
  
  -- Timing
  signal_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Meta
  signaled_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create live_race_state table for current race status
CREATE TABLE IF NOT EXISTS live_race_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  race_number INTEGER NOT NULL,
  fleet_id UUID REFERENCES fleets(id) ON DELETE SET NULL,
  fleet_name TEXT,
  
  -- Current state
  status TEXT NOT NULL DEFAULT 'scheduled',
  active_flags TEXT[],
  
  -- Timing
  warning_time TIMESTAMPTZ,
  start_time TIMESTAMPTZ,
  
  -- Sequence
  sequence_started BOOLEAN DEFAULT FALSE,
  
  -- Course
  course_designation TEXT,
  
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(regatta_id, race_number, fleet_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_race_signals_regatta ON race_signals(regatta_id);
CREATE INDEX IF NOT EXISTS idx_race_signals_active ON race_signals(regatta_id, is_active);
CREATE INDEX IF NOT EXISTS idx_race_signals_time ON race_signals(signal_time DESC);
CREATE INDEX IF NOT EXISTS idx_live_race_state_regatta ON live_race_state(regatta_id);

-- RLS Policies for race_signals
ALTER TABLE race_signals ENABLE ROW LEVEL SECURITY;

-- Anyone can view signals (they're public announcements)
CREATE POLICY "Signals are publicly viewable"
  ON race_signals FOR SELECT
  USING (true);

-- Race officers can insert signals
CREATE POLICY "Race officers can send signals"
  ON race_signals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM regattas r
      WHERE r.id = race_signals.regatta_id
      AND (r.created_by = auth.uid() OR r.club_id IN (
        SELECT club_id FROM club_members WHERE user_id = auth.uid() AND role IN ('admin', 'race_officer', 'pro')
      ))
    )
  );

-- Race officers can update signals
CREATE POLICY "Race officers can update signals"
  ON race_signals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM regattas r
      WHERE r.id = race_signals.regatta_id
      AND (r.created_by = auth.uid() OR r.club_id IN (
        SELECT club_id FROM club_members WHERE user_id = auth.uid() AND role IN ('admin', 'race_officer', 'pro')
      ))
    )
  );

-- RLS Policies for live_race_state
ALTER TABLE live_race_state ENABLE ROW LEVEL SECURITY;

-- Anyone can view race state
CREATE POLICY "Race state is publicly viewable"
  ON live_race_state FOR SELECT
  USING (true);

-- Race officers can update state
CREATE POLICY "Race officers can update state"
  ON live_race_state FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM regattas r
      WHERE r.id = live_race_state.regatta_id
      AND (r.created_by = auth.uid() OR r.club_id IN (
        SELECT club_id FROM club_members WHERE user_id = auth.uid() AND role IN ('admin', 'race_officer', 'pro')
      ))
    )
  );

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE race_signals;
ALTER PUBLICATION supabase_realtime ADD TABLE live_race_state;

-- Create saved_regattas table for bookmarks
CREATE TABLE IF NOT EXISTS saved_regattas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, regatta_id)
);

-- Index for saved regattas
CREATE INDEX IF NOT EXISTS idx_saved_regattas_user ON saved_regattas(user_id);

-- RLS for saved_regattas
ALTER TABLE saved_regattas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved regattas"
  ON saved_regattas FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can save regattas"
  ON saved_regattas FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unsave regattas"
  ON saved_regattas FOR DELETE
  USING (user_id = auth.uid());

COMMENT ON TABLE race_signals IS 'Live race signal broadcasting for SAILTI-competitive real-time race communication';
COMMENT ON TABLE live_race_state IS 'Current race state for quick status lookup';
COMMENT ON TABLE saved_regattas IS 'User bookmarked/favorited regattas';


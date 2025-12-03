-- =====================================================
-- Create Missing Scoring Tables Migration
-- Creates race_events, race_results, and series_standings tables
-- that are referenced by other tables but were never created
-- =====================================================

-- =====================================================
-- RACE_EVENTS TABLE
-- Individual race events (alternative to regatta/races structure)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.race_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  name TEXT NOT NULL,
  race_series TEXT,
  race_number INTEGER,
  
  -- Timing
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  
  -- Location
  venue_id UUID REFERENCES public.sailing_venues(id) ON DELETE SET NULL,
  venue_name TEXT,
  
  -- Status
  race_status TEXT DEFAULT 'scheduled' CHECK (race_status IN (
    'scheduled', 'postponed', 'in_progress', 'completed', 'abandoned', 'cancelled'
  )),
  
  -- Boat/Class Info
  boat_class TEXT,
  boat_id UUID,
  
  -- Weather Conditions (recorded)
  wind_speed_avg NUMERIC(5, 2),
  wind_direction_avg NUMERIC(5, 2),
  conditions_notes TEXT,
  
  -- Regatta association (optional)
  regatta_id UUID REFERENCES public.regattas(id) ON DELETE SET NULL,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for race_events
CREATE INDEX IF NOT EXISTS idx_race_events_user ON race_events(user_id);
CREATE INDEX IF NOT EXISTS idx_race_events_venue ON race_events(venue_id);
CREATE INDEX IF NOT EXISTS idx_race_events_status ON race_events(race_status);
CREATE INDEX IF NOT EXISTS idx_race_events_start_time ON race_events(start_time);
CREATE INDEX IF NOT EXISTS idx_race_events_regatta ON race_events(regatta_id);

-- Enable RLS
ALTER TABLE public.race_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for race_events
DROP POLICY IF EXISTS "Users view own race_events" ON race_events;
CREATE POLICY "Users view own race_events"
  ON race_events FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert own race_events" ON race_events;
CREATE POLICY "Users insert own race_events"
  ON race_events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own race_events" ON race_events;
CREATE POLICY "Users update own race_events"
  ON race_events FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users delete own race_events" ON race_events;
CREATE POLICY "Users delete own race_events"
  ON race_events FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- RACE_RESULTS TABLE
-- Individual race finish positions and times
-- =====================================================

CREATE TABLE IF NOT EXISTS public.race_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regatta_id UUID NOT NULL REFERENCES public.regattas(id) ON DELETE CASCADE,
  race_number INTEGER NOT NULL,
  
  -- Result Info
  entry_id UUID,  -- References race_entries if exists
  sailor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  boat_class TEXT,
  sail_number TEXT,
  
  -- Position & Points
  position INTEGER,
  points NUMERIC(6, 2),
  status_code TEXT CHECK (status_code IN (
    'finished', 'dns', 'dnf', 'dsq', 'ocs', 'bfd', 'dnc', 'ret', 'nsc', 'zcm', 'ufd', 'rdg', 'dpi'
  )),
  
  -- Timing
  finish_time TIMESTAMPTZ,
  elapsed_time INTERVAL,
  corrected_time INTERVAL,
  
  -- Notes
  notes TEXT,
  protest_flag BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for race_results
CREATE INDEX IF NOT EXISTS idx_race_results_regatta_race ON race_results(regatta_id, race_number);
CREATE INDEX IF NOT EXISTS idx_race_results_sailor ON race_results(sailor_id);
CREATE INDEX IF NOT EXISTS idx_race_results_entry ON race_results(entry_id);

-- Enable RLS
ALTER TABLE public.race_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for race_results
DROP POLICY IF EXISTS "Users manage results for own regattas" ON race_results;
CREATE POLICY "Users manage results for own regattas"
  ON race_results FOR ALL TO authenticated
  USING (
    regatta_id IN (
      SELECT id FROM regattas WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    regatta_id IN (
      SELECT id FROM regattas WHERE created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Published results are public" ON race_results;
CREATE POLICY "Published results are public"
  ON race_results FOR SELECT TO authenticated
  USING (
    regatta_id IN (
      SELECT id FROM regattas WHERE results_published = true
    )
  );

-- Also allow sailors to see their own results
DROP POLICY IF EXISTS "Sailors can view own results" ON race_results;
CREATE POLICY "Sailors can view own results"
  ON race_results FOR SELECT TO authenticated
  USING (sailor_id = auth.uid());

-- =====================================================
-- SERIES_STANDINGS TABLE
-- Overall standings for a regatta series
-- =====================================================

CREATE TABLE IF NOT EXISTS public.series_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regatta_id UUID NOT NULL REFERENCES public.regattas(id) ON DELETE CASCADE,
  
  -- Standing Info
  entry_id UUID,  -- References race_entries if exists
  sailor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Position & Points
  rank INTEGER NOT NULL,
  net_points NUMERIC(8, 2),
  total_points NUMERIC(8, 2),
  
  -- Breakdown
  races_sailed INTEGER DEFAULT 0,
  race_scores JSONB DEFAULT '[]'::jsonb,  -- Array of individual race scores
  discards JSONB DEFAULT '[]'::jsonb,     -- Array of discarded race numbers
  
  -- Metadata
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for series_standings
CREATE INDEX IF NOT EXISTS idx_series_standings_regatta ON series_standings(regatta_id);
CREATE INDEX IF NOT EXISTS idx_series_standings_entry ON series_standings(entry_id);
CREATE INDEX IF NOT EXISTS idx_series_standings_sailor ON series_standings(sailor_id);
CREATE INDEX IF NOT EXISTS idx_series_standings_rank ON series_standings(regatta_id, rank);

-- Enable RLS
ALTER TABLE public.series_standings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for series_standings
DROP POLICY IF EXISTS "Users manage standings for own regattas" ON series_standings;
CREATE POLICY "Users manage standings for own regattas"
  ON series_standings FOR ALL TO authenticated
  USING (
    regatta_id IN (
      SELECT id FROM regattas WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    regatta_id IN (
      SELECT id FROM regattas WHERE created_by = auth.uid()
    )
  );

-- Published standings are public
DROP POLICY IF EXISTS "Published standings are public" ON series_standings;
CREATE POLICY "Published standings are public"
  ON series_standings FOR SELECT TO authenticated
  USING (
    regatta_id IN (
      SELECT id FROM regattas WHERE results_published = true
    )
  );

-- Sailors can see standings they're part of
DROP POLICY IF EXISTS "Sailors can view own standings" ON series_standings;
CREATE POLICY "Sailors can view own standings"
  ON series_standings FOR SELECT TO authenticated
  USING (sailor_id = auth.uid());

-- =====================================================
-- UPDATE TRIGGERS
-- =====================================================

-- Trigger for race_events updated_at
CREATE OR REPLACE FUNCTION update_race_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_race_events_updated_at ON race_events;
CREATE TRIGGER update_race_events_updated_at
  BEFORE UPDATE ON race_events
  FOR EACH ROW
  EXECUTE FUNCTION update_race_events_updated_at();

-- Trigger for race_results updated_at
CREATE OR REPLACE FUNCTION update_race_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_race_results_updated_at ON race_results;
CREATE TRIGGER update_race_results_updated_at
  BEFORE UPDATE ON race_results
  FOR EACH ROW
  EXECUTE FUNCTION update_race_results_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE race_events IS 'Individual race events with full details for sailor race planning';
COMMENT ON TABLE race_results IS 'Individual race finish positions, times, and scoring codes';
COMMENT ON TABLE series_standings IS 'Aggregated series standings with points and rank';


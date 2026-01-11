-- =============================================================================
-- SEASONS DATA MODEL
--
-- Adds season-based architecture for grouping races and regattas.
-- Sailors think in seasons ("Winter 2024-25"), not flat race lists.
--
-- Tables added:
--   - seasons: The temporal container for a racing season
--   - season_regattas: Junction linking seasons to formal regattas
--   - season_standings: Cross-regatta aggregated standings
--
-- Tables modified:
--   - race_events: Add season_id FK for personal race tracking
-- =============================================================================

-- =============================================================================
-- SEASONS TABLE
-- The temporal container for a racing season
-- =============================================================================
CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name TEXT NOT NULL,                    -- "Winter Series 2024-25"
  short_name TEXT,                       -- "Winter 24-25" (for compact display)
  year INTEGER NOT NULL,                 -- 2024 (primary year)
  year_end INTEGER,                      -- 2025 (if season spans years)

  -- Ownership (at least one must be set)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,

  -- Temporal
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'upcoming', 'active', 'completed', 'archived')),

  -- Scoring (optional, for cross-regatta aggregation)
  scoring_rules JSONB,                   -- How to aggregate across regattas
  discard_rules JSONB,                   -- Season-level discards

  -- Metadata
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints: Must have at least user_id or club_id
  CONSTRAINT season_has_owner CHECK (
    user_id IS NOT NULL OR club_id IS NOT NULL
  )
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_seasons_user ON seasons(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_seasons_club ON seasons(club_id) WHERE club_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_seasons_status ON seasons(status);
CREATE INDEX IF NOT EXISTS idx_seasons_year ON seasons(year);
CREATE INDEX IF NOT EXISTS idx_seasons_dates ON seasons(start_date, end_date);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_seasons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER seasons_updated_at
  BEFORE UPDATE ON seasons
  FOR EACH ROW
  EXECUTE FUNCTION update_seasons_updated_at();

-- RLS policies
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

-- Users can view their own seasons
CREATE POLICY "Users can view own seasons"
  ON seasons FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view seasons for clubs they belong to
CREATE POLICY "Users can view club seasons"
  ON seasons FOR SELECT
  USING (
    club_id IN (
      SELECT club_id FROM club_members WHERE user_id = auth.uid()
    )
  );

-- Users can create their own seasons
CREATE POLICY "Users can create own seasons"
  ON seasons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Club admins can create club seasons
CREATE POLICY "Club admins can create club seasons"
  ON seasons FOR INSERT
  WITH CHECK (
    club_id IN (
      SELECT club_id FROM club_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Users can update their own seasons
CREATE POLICY "Users can update own seasons"
  ON seasons FOR UPDATE
  USING (auth.uid() = user_id);

-- Club admins can update club seasons
CREATE POLICY "Club admins can update club seasons"
  ON seasons FOR UPDATE
  USING (
    club_id IN (
      SELECT club_id FROM club_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Users can delete their own seasons
CREATE POLICY "Users can delete own seasons"
  ON seasons FOR DELETE
  USING (auth.uid() = user_id);


-- =============================================================================
-- SEASON_REGATTAS JUNCTION TABLE
-- Links seasons to formal regattas (club-managed series)
-- =============================================================================
CREATE TABLE IF NOT EXISTS season_regattas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,

  -- Ordering within season
  sequence INTEGER,                      -- 1, 2, 3... order in season

  -- Scoring weight (optional)
  weight DECIMAL(3,2) DEFAULT 1.0,       -- For weighted season scoring
  is_championship BOOLEAN DEFAULT false, -- Championship regatta (special scoring?)

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each regatta can only be in a season once
  UNIQUE(season_id, regatta_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_season_regattas_season ON season_regattas(season_id);
CREATE INDEX IF NOT EXISTS idx_season_regattas_regatta ON season_regattas(regatta_id);

-- RLS policies
ALTER TABLE season_regattas ENABLE ROW LEVEL SECURITY;

-- Users can view season_regattas for seasons they can view
CREATE POLICY "Users can view season_regattas"
  ON season_regattas FOR SELECT
  USING (
    season_id IN (
      SELECT id FROM seasons
      WHERE user_id = auth.uid()
         OR club_id IN (SELECT club_id FROM club_members WHERE user_id = auth.uid())
    )
  );

-- Users can manage season_regattas for their seasons
CREATE POLICY "Users can manage own season_regattas"
  ON season_regattas FOR ALL
  USING (
    season_id IN (SELECT id FROM seasons WHERE user_id = auth.uid())
  );

-- Club admins can manage club season_regattas
CREATE POLICY "Club admins can manage club season_regattas"
  ON season_regattas FOR ALL
  USING (
    season_id IN (
      SELECT s.id FROM seasons s
      JOIN club_members cm ON s.club_id = cm.club_id
      WHERE cm.user_id = auth.uid() AND cm.role IN ('admin', 'owner')
    )
  );


-- =============================================================================
-- SEASON_STANDINGS TABLE
-- Cross-regatta aggregated standings for a season
-- =============================================================================
CREATE TABLE IF NOT EXISTS season_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,

  -- Sailor/Entry identification
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id UUID,                         -- If using regatta entry system
  sailor_name TEXT,                      -- Denormalized for display
  boat_name TEXT,
  sail_number TEXT,

  -- Division/Fleet (if applicable)
  division TEXT,
  fleet TEXT,

  -- Aggregated results
  rank INTEGER,
  total_points DECIMAL(10,2),
  net_points DECIMAL(10,2),              -- After discards
  races_sailed INTEGER DEFAULT 0,
  races_counted INTEGER DEFAULT 0,       -- After discards applied

  -- Detailed breakdown (JSONB for flexibility)
  regatta_results JSONB,                 -- Array of {regatta_id, regatta_name, points, position}
  race_results JSONB,                    -- Array of all race results
  discards JSONB,                        -- Which results were discarded

  -- Stats
  wins INTEGER DEFAULT 0,
  podiums INTEGER DEFAULT 0,             -- Top 3 finishes
  best_finish INTEGER,
  worst_finish INTEGER,

  -- Computed timestamp
  computed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One standing per user per division per season
  UNIQUE(season_id, user_id, division)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_season_standings_season ON season_standings(season_id);
CREATE INDEX IF NOT EXISTS idx_season_standings_user ON season_standings(user_id);
CREATE INDEX IF NOT EXISTS idx_season_standings_rank ON season_standings(season_id, rank);

-- Trigger for updated_at
CREATE TRIGGER season_standings_updated_at
  BEFORE UPDATE ON season_standings
  FOR EACH ROW
  EXECUTE FUNCTION update_seasons_updated_at();

-- RLS policies
ALTER TABLE season_standings ENABLE ROW LEVEL SECURITY;

-- Users can view standings for seasons they can view
CREATE POLICY "Users can view season_standings"
  ON season_standings FOR SELECT
  USING (
    season_id IN (
      SELECT id FROM seasons
      WHERE user_id = auth.uid()
         OR club_id IN (SELECT club_id FROM club_members WHERE user_id = auth.uid())
    )
  );

-- Users can view their own standings
CREATE POLICY "Users can view own standings"
  ON season_standings FOR SELECT
  USING (user_id = auth.uid());


-- =============================================================================
-- UPDATE RACE_EVENTS TABLE
-- Add season_id for personal race tracking
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'race_events' AND column_name = 'season_id'
  ) THEN
    ALTER TABLE race_events
      ADD COLUMN season_id UUID REFERENCES seasons(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_race_events_season ON race_events(season_id);
  END IF;
END $$;


-- =============================================================================
-- HELPER FUNCTION: Get current season for a user
-- =============================================================================
CREATE OR REPLACE FUNCTION get_current_season(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  status TEXT,
  start_date DATE,
  end_date DATE,
  race_count BIGINT,
  completed_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.status,
    s.start_date,
    s.end_date,
    (
      SELECT COUNT(*)
      FROM race_events re
      WHERE re.season_id = s.id AND re.user_id = p_user_id
    ) + (
      SELECT COUNT(*)
      FROM regatta_races rr
      JOIN season_regattas sr ON rr.regatta_id = sr.regatta_id
      WHERE sr.season_id = s.id
    ) AS race_count,
    (
      SELECT COUNT(*)
      FROM race_events re
      WHERE re.season_id = s.id
        AND re.user_id = p_user_id
        AND re.race_status = 'completed'
    ) + (
      SELECT COUNT(*)
      FROM regatta_races rr
      JOIN season_regattas sr ON rr.regatta_id = sr.regatta_id
      WHERE sr.season_id = s.id AND rr.status = 'completed'
    ) AS completed_count
  FROM seasons s
  WHERE s.user_id = p_user_id
    AND s.status = 'active'
  ORDER BY s.start_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================================================
-- HELPER FUNCTION: Get season summary with results
-- =============================================================================
CREATE OR REPLACE FUNCTION get_season_summary(p_season_id UUID, p_user_id UUID)
RETURNS TABLE (
  season_id UUID,
  season_name TEXT,
  status TEXT,
  total_races BIGINT,
  completed_races BIGINT,
  upcoming_races BIGINT,
  user_rank INTEGER,
  user_points DECIMAL,
  user_wins INTEGER,
  results_sequence JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id AS season_id,
    s.name AS season_name,
    s.status,
    -- Total races
    (
      SELECT COUNT(*) FROM race_events re WHERE re.season_id = s.id
    ) + (
      SELECT COUNT(*) FROM regatta_races rr
      JOIN season_regattas sr ON rr.regatta_id = sr.regatta_id
      WHERE sr.season_id = s.id
    ) AS total_races,
    -- Completed
    (
      SELECT COUNT(*) FROM race_events re
      WHERE re.season_id = s.id AND re.race_status = 'completed'
    ) + (
      SELECT COUNT(*) FROM regatta_races rr
      JOIN season_regattas sr ON rr.regatta_id = sr.regatta_id
      WHERE sr.season_id = s.id AND rr.status = 'completed'
    ) AS completed_races,
    -- Upcoming
    (
      SELECT COUNT(*) FROM race_events re
      WHERE re.season_id = s.id AND re.race_status IN ('scheduled', 'upcoming')
    ) + (
      SELECT COUNT(*) FROM regatta_races rr
      JOIN season_regattas sr ON rr.regatta_id = sr.regatta_id
      WHERE sr.season_id = s.id AND rr.status = 'scheduled'
    ) AS upcoming_races,
    -- User standings
    ss.rank AS user_rank,
    ss.net_points AS user_points,
    ss.wins AS user_wins,
    ss.race_results AS results_sequence
  FROM seasons s
  LEFT JOIN season_standings ss ON ss.season_id = s.id AND ss.user_id = p_user_id
  WHERE s.id = p_season_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON TABLE seasons IS 'Temporal container for racing seasons (e.g., Winter 2024-25)';
COMMENT ON TABLE season_regattas IS 'Junction table linking seasons to formal regattas';
COMMENT ON TABLE season_standings IS 'Aggregated standings across all regattas in a season';
COMMENT ON COLUMN seasons.status IS 'draft=planning, upcoming=registration, active=racing, completed=finished, archived=historical';
COMMENT ON COLUMN season_standings.race_results IS 'JSONB array of results for sparkline: [2, 4, 1, null, 3, 2]';

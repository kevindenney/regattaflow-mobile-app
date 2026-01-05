-- Add Match Racing and Team Racing type support
-- This migration extends the race_type field to include 'match' and 'team' types
-- and adds type-specific fields for both race_events and regattas tables

-- ============================================
-- RACE_EVENTS TABLE (primary table for user races)
-- ============================================

-- Step 1: Add race_type column to race_events
ALTER TABLE race_events
  ADD COLUMN IF NOT EXISTS race_type TEXT DEFAULT 'fleet'
    CHECK (race_type IN ('fleet', 'distance', 'match', 'team'));

-- Step 2: Add location/venue fields
ALTER TABLE race_events
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS vhf_channel TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Step 3: Fleet racing fields
ALTER TABLE race_events
  ADD COLUMN IF NOT EXISTS course_type TEXT,
  ADD COLUMN IF NOT EXISTS number_of_laps INTEGER,
  ADD COLUMN IF NOT EXISTS expected_fleet_size INTEGER,
  ADD COLUMN IF NOT EXISTS boat_class TEXT;

-- Step 4: Distance racing fields
ALTER TABLE race_events
  ADD COLUMN IF NOT EXISTS route_waypoints JSONB,
  ADD COLUMN IF NOT EXISTS total_distance_nm NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS time_limit_hours NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS start_finish_same_location BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS route_description TEXT;

-- Step 5: Match racing fields
ALTER TABLE race_events
  ADD COLUMN IF NOT EXISTS opponent_name TEXT,
  ADD COLUMN IF NOT EXISTS match_round INTEGER,
  ADD COLUMN IF NOT EXISTS total_rounds INTEGER,
  ADD COLUMN IF NOT EXISTS series_format TEXT,
  ADD COLUMN IF NOT EXISTS has_umpire BOOLEAN DEFAULT false;

-- Step 6: Team racing fields
ALTER TABLE race_events
  ADD COLUMN IF NOT EXISTS your_team_name TEXT,
  ADD COLUMN IF NOT EXISTS opponent_team_name TEXT,
  ADD COLUMN IF NOT EXISTS heat_number INTEGER,
  ADD COLUMN IF NOT EXISTS team_size INTEGER,
  ADD COLUMN IF NOT EXISTS team_members JSONB;

-- Create index for faster filtering by race type
CREATE INDEX IF NOT EXISTS idx_race_events_race_type ON race_events(race_type);

-- ============================================
-- REGATTAS TABLE (update existing constraint)
-- ============================================

-- Drop the existing constraint and add updated one
ALTER TABLE regattas
  DROP CONSTRAINT IF EXISTS regattas_race_type_check;

ALTER TABLE regattas
  ADD CONSTRAINT regattas_race_type_check
    CHECK (race_type IN ('fleet', 'distance', 'match', 'team'));

-- Match Racing specific fields
ALTER TABLE regattas
  ADD COLUMN IF NOT EXISTS opponent_name TEXT,
  ADD COLUMN IF NOT EXISTS match_round INTEGER,
  ADD COLUMN IF NOT EXISTS total_rounds INTEGER,
  ADD COLUMN IF NOT EXISTS series_format TEXT,
  ADD COLUMN IF NOT EXISTS has_umpire BOOLEAN DEFAULT false;

-- Team Racing specific fields
ALTER TABLE regattas
  ADD COLUMN IF NOT EXISTS your_team_name TEXT,
  ADD COLUMN IF NOT EXISTS opponent_team_name TEXT,
  ADD COLUMN IF NOT EXISTS heat_number INTEGER,
  ADD COLUMN IF NOT EXISTS team_size INTEGER,
  ADD COLUMN IF NOT EXISTS team_members JSONB;

-- ============================================
-- DOCUMENTATION COMMENTS
-- ============================================

-- Race events table comments
COMMENT ON COLUMN race_events.race_type IS 'Type of race: fleet, distance, match, or team';
COMMENT ON COLUMN race_events.location IS 'Race location/venue name';
COMMENT ON COLUMN race_events.vhf_channel IS 'VHF radio channel for race communications';
COMMENT ON COLUMN race_events.opponent_name IS 'Opponent name for match racing';
COMMENT ON COLUMN race_events.your_team_name IS 'Your team name for team racing';
COMMENT ON COLUMN race_events.opponent_team_name IS 'Opponent team name for team racing';

-- Regattas table comments
COMMENT ON COLUMN regattas.race_type IS 'Type of race: fleet, distance, match, or team';
COMMENT ON COLUMN regattas.opponent_name IS 'Opponent name for match racing';
COMMENT ON COLUMN regattas.your_team_name IS 'Your team name for team racing';
COMMENT ON COLUMN regattas.opponent_team_name IS 'Opponent team name for team racing';

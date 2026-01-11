-- Fix missing columns from migration 20260105000000_add_match_team_race_types
-- These columns were recorded as applied but never actually added to the table
-- This migration safely adds them with IF NOT EXISTS

-- Race type with constraint
ALTER TABLE race_events
  ADD COLUMN IF NOT EXISTS race_type TEXT DEFAULT 'fleet';

-- Add check constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'race_events_race_type_check'
  ) THEN
    ALTER TABLE race_events
      ADD CONSTRAINT race_events_race_type_check
        CHECK (race_type IN ('fleet', 'distance', 'match', 'team'));
  END IF;
END $$;

-- Common fields
ALTER TABLE race_events
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS vhf_channel TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Fleet racing fields
ALTER TABLE race_events
  ADD COLUMN IF NOT EXISTS course_type TEXT,
  ADD COLUMN IF NOT EXISTS number_of_laps INTEGER,
  ADD COLUMN IF NOT EXISTS expected_fleet_size INTEGER,
  ADD COLUMN IF NOT EXISTS boat_class TEXT;

-- Distance racing fields
ALTER TABLE race_events
  ADD COLUMN IF NOT EXISTS route_waypoints JSONB,
  ADD COLUMN IF NOT EXISTS total_distance_nm NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS time_limit_hours NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS start_finish_same_location BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS route_description TEXT;

-- Match racing fields
ALTER TABLE race_events
  ADD COLUMN IF NOT EXISTS opponent_name TEXT,
  ADD COLUMN IF NOT EXISTS match_round INTEGER,
  ADD COLUMN IF NOT EXISTS total_rounds INTEGER,
  ADD COLUMN IF NOT EXISTS series_format TEXT,
  ADD COLUMN IF NOT EXISTS has_umpire BOOLEAN DEFAULT false;

-- Team racing fields
ALTER TABLE race_events
  ADD COLUMN IF NOT EXISTS your_team_name TEXT,
  ADD COLUMN IF NOT EXISTS opponent_team_name TEXT,
  ADD COLUMN IF NOT EXISTS heat_number INTEGER,
  ADD COLUMN IF NOT EXISTS team_size INTEGER,
  ADD COLUMN IF NOT EXISTS team_members JSONB;

-- Source document tracking fields
ALTER TABLE race_events
  ADD COLUMN IF NOT EXISTS race_series TEXT,
  ADD COLUMN IF NOT EXISTS racing_area_name TEXT,
  ADD COLUMN IF NOT EXISTS source_documents JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS extraction_method TEXT,
  ADD COLUMN IF NOT EXISTS extraction_status TEXT;

-- Index for race type filtering
CREATE INDEX IF NOT EXISTS idx_race_events_race_type ON race_events(race_type);

-- Add comments for documentation
COMMENT ON COLUMN race_events.race_type IS 'Type of race: fleet, distance, match, or team';
COMMENT ON COLUMN race_events.boat_class IS 'Single boat class for the race';
COMMENT ON COLUMN race_events.location IS 'Race location/venue name';
COMMENT ON COLUMN race_events.vhf_channel IS 'VHF radio channel for race communications';

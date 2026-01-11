-- Migration: Add multi-race results support to race_timer_sessions
-- Purpose: Support regattas with multiple races (e.g., "Series 1 & 2")
-- Design: JSONB array allows per-race position, fleet size, and key moment
--
-- Format: [
--   {"race_number": 1, "position": 2, "fleet_size": 18, "key_moment": "Good start"},
--   {"race_number": 2, "position": 5, "fleet_size": 18, "key_moment": "Lost on downwind"}
-- ]

-- Add race_count field to track number of races in the regatta
ALTER TABLE race_timer_sessions
  ADD COLUMN IF NOT EXISTS race_count INTEGER DEFAULT 1;

-- Add per-race results JSONB array
ALTER TABLE race_timer_sessions
  ADD COLUMN IF NOT EXISTS race_results JSONB DEFAULT '[]'::jsonb;

-- Add constraint: race_count must be positive
ALTER TABLE race_timer_sessions
  ADD CONSTRAINT check_race_count_positive
    CHECK (race_count IS NULL OR race_count >= 1);

-- Index for querying sessions with multi-race results
CREATE INDEX IF NOT EXISTS idx_race_timer_sessions_multi_race
  ON race_timer_sessions(sailor_id, regatta_id)
  WHERE race_count > 1;

-- GIN index for efficient JSONB queries on race_results
CREATE INDEX IF NOT EXISTS idx_race_timer_sessions_race_results
  ON race_timer_sessions USING GIN (race_results);

-- Comments for documentation
COMMENT ON COLUMN race_timer_sessions.race_count IS
  'Number of races in this regatta/session (default 1 for single-race events)';
COMMENT ON COLUMN race_timer_sessions.race_results IS
  'Per-race results array: [{race_number, position, fleet_size, key_moment}, ...]';

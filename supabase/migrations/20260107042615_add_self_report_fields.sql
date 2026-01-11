-- Migration: Add self-report fields to race_timer_sessions
-- Purpose: Allow sailors to self-report race results and key moments
-- Design: Tufte "absence as interface" - these fields populate the sparse race card
--
-- Self-reported results are shown until official results are published.
-- Key moment is an explicit field separate from freeform notes.

-- Add self-reported result fields
ALTER TABLE race_timer_sessions
  ADD COLUMN IF NOT EXISTS self_reported_position INTEGER,
  ADD COLUMN IF NOT EXISTS self_reported_fleet_size INTEGER;

-- Add explicit key moment field (separate from general notes)
ALTER TABLE race_timer_sessions
  ADD COLUMN IF NOT EXISTS key_moment TEXT;

-- Add constraint: position must be positive and <= fleet size
ALTER TABLE race_timer_sessions
  ADD CONSTRAINT check_position_valid
    CHECK (
      (self_reported_position IS NULL AND self_reported_fleet_size IS NULL)
      OR (self_reported_position > 0 AND self_reported_fleet_size > 0 AND self_reported_position <= self_reported_fleet_size)
    );

-- Index for querying sessions with self-reported data
CREATE INDEX IF NOT EXISTS idx_race_timer_sessions_self_reported
  ON race_timer_sessions(sailor_id, regatta_id)
  WHERE self_reported_position IS NOT NULL;

-- Comments for documentation
COMMENT ON COLUMN race_timer_sessions.self_reported_position IS
  'Sailor-reported finish position (overridden by official race_results when available)';
COMMENT ON COLUMN race_timer_sessions.self_reported_fleet_size IS
  'Sailor-reported fleet size for their race';
COMMENT ON COLUMN race_timer_sessions.key_moment IS
  'Explicit key moment/learning from the race (Tufte "absence as interface" field)';

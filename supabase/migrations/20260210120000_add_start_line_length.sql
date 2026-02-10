-- Migration: Add start_line_length_m column to race_positioned_courses
-- Description: Stores the dynamically calculated start line length based on fleet size
-- Date: 2026-02-10

-- =============================================================================
-- ADD COLUMN
-- =============================================================================

-- Add start_line_length_m column (defaults to 100m for backwards compatibility)
ALTER TABLE race_positioned_courses
ADD COLUMN IF NOT EXISTS start_line_length_m DECIMAL(6,1) DEFAULT 100;

-- =============================================================================
-- ADD UNIQUE CONSTRAINT FOR UPSERT
-- =============================================================================

-- Create unique constraint on (regatta_id, user_id) to enable upsert
-- Drop if exists first to handle re-runs
DROP INDEX IF EXISTS idx_positioned_courses_regatta_user;
CREATE UNIQUE INDEX idx_positioned_courses_regatta_user
  ON race_positioned_courses(regatta_id, user_id);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON COLUMN race_positioned_courses.start_line_length_m IS 'Start line length in meters, calculated as 1.5 × LOA × numberOfBoats';

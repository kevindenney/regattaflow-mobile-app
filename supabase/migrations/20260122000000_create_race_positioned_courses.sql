-- Migration: Create race_positioned_courses table
-- Description: Stores GPS-positioned race courses overlaid on maps
-- Date: 2026-01-22

-- =============================================================================
-- CREATE TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS race_positioned_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  regatta_id UUID REFERENCES regattas(id) ON DELETE CASCADE,
  source_document_id UUID REFERENCES race_source_documents(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Course type
  course_type TEXT NOT NULL CHECK (course_type IN ('windward_leeward', 'triangle', 'olympic', 'trapezoid', 'custom')),

  -- Wind direction in degrees (0 = North, 90 = East, etc.)
  wind_direction INTEGER CHECK (wind_direction >= 0 AND wind_direction < 360),

  -- Leg length in nautical miles
  leg_length_nm DECIMAL(4,2) DEFAULT 0.50,

  -- Start line endpoints
  start_pin_lat DECIMAL(10,7),
  start_pin_lng DECIMAL(10,7),
  start_committee_lat DECIMAL(10,7),
  start_committee_lng DECIMAL(10,7),

  -- All marks as JSONB array
  -- Each mark: { id, name, type, latitude, longitude, rounding, color, shape, sequenceOrder, isUserAdjusted }
  marks JSONB NOT NULL DEFAULT '[]',

  -- Track if user has manually adjusted any marks
  has_manual_adjustments BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Index for querying by regatta
CREATE INDEX IF NOT EXISTS idx_positioned_courses_regatta_id
  ON race_positioned_courses(regatta_id);

-- Index for querying by user
CREATE INDEX IF NOT EXISTS idx_positioned_courses_user_id
  ON race_positioned_courses(user_id);

-- Index for querying by source document
CREATE INDEX IF NOT EXISTS idx_positioned_courses_source_document_id
  ON race_positioned_courses(source_document_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE race_positioned_courses ENABLE ROW LEVEL SECURITY;

-- Users can view positioned courses for regattas they have access to
CREATE POLICY "Users can view positioned courses for their regattas"
  ON race_positioned_courses
  FOR SELECT
  USING (
    user_id = (SELECT auth.uid())
    OR regatta_id IN (
      SELECT id FROM regattas WHERE created_by = (SELECT auth.uid())
    )
  );

-- Users can create positioned courses for their own regattas
CREATE POLICY "Users can create positioned courses"
  ON race_positioned_courses
  FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

-- Users can update their own positioned courses
CREATE POLICY "Users can update their own positioned courses"
  ON race_positioned_courses
  FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

-- Users can delete their own positioned courses
CREATE POLICY "Users can delete their own positioned courses"
  ON race_positioned_courses
  FOR DELETE
  USING (user_id = (SELECT auth.uid()));

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION update_positioned_course_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_positioned_course_timestamp
  BEFORE UPDATE ON race_positioned_courses
  FOR EACH ROW
  EXECUTE FUNCTION update_positioned_course_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE race_positioned_courses IS 'GPS-positioned race courses for map overlay visualization';
COMMENT ON COLUMN race_positioned_courses.course_type IS 'Type of course layout (windward_leeward, triangle, olympic, trapezoid, custom)';
COMMENT ON COLUMN race_positioned_courses.wind_direction IS 'Wind direction in degrees (0=N, 90=E, 180=S, 270=W)';
COMMENT ON COLUMN race_positioned_courses.leg_length_nm IS 'Length of one leg in nautical miles';
COMMENT ON COLUMN race_positioned_courses.marks IS 'JSONB array of positioned marks with coordinates';
COMMENT ON COLUMN race_positioned_courses.has_manual_adjustments IS 'True if user has manually adjusted any mark positions';

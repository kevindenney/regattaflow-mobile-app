-- ============================================================================
-- PHASE 6: RACE-COURSE-BOAT LINKING
-- ============================================================================
-- Links races with courses and boats for integrated race strategy display
-- Part of race-centric redesign (Phase 6)

-- ============================================================================
-- ADD LINKING COLUMNS TO REGATTAS
-- ============================================================================

-- Link regattas to race courses (from courses tab)
ALTER TABLE regattas
  ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES race_courses(id) ON DELETE SET NULL;

-- Link regattas to sailor boats (from boats tab)
ALTER TABLE regattas
  ADD COLUMN IF NOT EXISTS boat_id UUID REFERENCES sailor_boats(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_regattas_course ON regattas(course_id);
CREATE INDEX IF NOT EXISTS idx_regattas_boat ON regattas(boat_id);

-- ============================================================================
-- ADD LINKING COLUMNS TO RACE_TIMER_SESSIONS
-- ============================================================================

-- Also link timer sessions to boats and courses for faster queries
ALTER TABLE race_timer_sessions
  ADD COLUMN IF NOT EXISTS boat_id UUID REFERENCES sailor_boats(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES race_courses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_race_timer_sessions_boat ON race_timer_sessions(boat_id);
CREATE INDEX IF NOT EXISTS idx_race_timer_sessions_course ON race_timer_sessions(course_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get race with linked course and boat details
CREATE OR REPLACE FUNCTION get_race_with_links(race_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'race', row_to_json(r.*),
    'course', row_to_json(c.*),
    'boat', row_to_json(b.*),
    'boat_class', row_to_json(bc.*)
  ) INTO result
  FROM regattas r
  LEFT JOIN race_courses c ON r.course_id = c.id
  LEFT JOIN sailor_boats b ON r.boat_id = b.id
  LEFT JOIN boat_classes bc ON b.class_id = bc.id
  WHERE r.id = race_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get races for a specific boat
CREATE OR REPLACE FUNCTION get_races_for_boat(p_boat_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  start_date TIMESTAMPTZ,
  venue_name TEXT,
  course_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.name,
    r.start_date,
    v.name as venue_name,
    c.name as course_name
  FROM regattas r
  LEFT JOIN sailing_venues v ON r.venue_id = v.id
  LEFT JOIN race_courses c ON r.course_id = c.id
  WHERE r.boat_id = p_boat_id
  ORDER BY r.start_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get races using a specific course
CREATE OR REPLACE FUNCTION get_races_for_course(p_course_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  start_date TIMESTAMPTZ,
  boat_name TEXT,
  boat_sail_number TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.name,
    r.start_date,
    b.name as boat_name,
    b.sail_number as boat_sail_number
  FROM regattas r
  LEFT JOIN sailor_boats b ON r.boat_id = b.id
  WHERE r.course_id = p_course_id
  ORDER BY r.start_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION get_race_with_links(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_races_for_boat(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_races_for_course(UUID) TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN regattas.course_id IS 'Links race to a saved course from the courses tab';
COMMENT ON COLUMN regattas.boat_id IS 'Links race to a specific boat from the boats tab';
COMMENT ON COLUMN race_timer_sessions.course_id IS 'Course used during this GPS tracking session';
COMMENT ON COLUMN race_timer_sessions.boat_id IS 'Boat used during this GPS tracking session';
COMMENT ON FUNCTION get_race_with_links(UUID) IS 'Returns race with all linked course and boat details in single query';
COMMENT ON FUNCTION get_races_for_boat(UUID) IS 'Returns all races for a specific boat';
COMMENT ON FUNCTION get_races_for_course(UUID) IS 'Returns all races that used a specific course';

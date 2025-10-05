-- Crew Availability System
-- Manages crew member availability for races and training

-- ==========================================
-- CREW AVAILABILITY TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS crew_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_member_id UUID NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,

  -- Date range
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Availability status
  status TEXT NOT NULL CHECK (status IN ('available', 'unavailable', 'tentative')) DEFAULT 'available',

  -- Optional details
  reason TEXT, -- "Vacation", "Work commitment", "Injury", etc.
  notes TEXT,

  -- Recurring availability patterns (for future use)
  recurrence_rule TEXT, -- iCalendar RRULE format

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure dates are valid
  CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_crew_availability_member ON crew_availability(crew_member_id);
CREATE INDEX IF NOT EXISTS idx_crew_availability_dates ON crew_availability(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_crew_availability_status ON crew_availability(status);

-- ==========================================
-- RLS POLICIES
-- ==========================================

ALTER TABLE crew_availability ENABLE ROW LEVEL SECURITY;

-- Sailors can view availability for their crew members
DROP POLICY IF EXISTS "Sailors can view crew availability" ON crew_availability;
CREATE POLICY "Sailors can view crew availability"
  ON crew_availability FOR SELECT
  USING (
    crew_member_id IN (
      SELECT id FROM crew_members WHERE sailor_id = auth.uid()
    )
  );

-- Sailors can manage availability for their crew members
DROP POLICY IF EXISTS "Sailors can manage crew availability" ON crew_availability;
CREATE POLICY "Sailors can manage crew availability"
  ON crew_availability FOR ALL
  USING (
    crew_member_id IN (
      SELECT id FROM crew_members WHERE sailor_id = auth.uid()
    )
  );

-- Crew members can manage their own availability
DROP POLICY IF EXISTS "Crew can manage own availability" ON crew_availability;
CREATE POLICY "Crew can manage own availability"
  ON crew_availability FOR ALL
  USING (
    crew_member_id IN (
      SELECT id FROM crew_members WHERE user_id = auth.uid()
    )
  );

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- Check crew availability for a specific date
CREATE OR REPLACE FUNCTION check_crew_availability(
  p_crew_member_id UUID,
  p_date DATE
)
RETURNS TEXT AS $$
DECLARE
  v_status TEXT;
BEGIN
  -- Check for any availability record that overlaps the date
  SELECT status INTO v_status
  FROM crew_availability
  WHERE crew_member_id = p_crew_member_id
    AND p_date BETWEEN start_date AND end_date
  ORDER BY
    CASE status
      WHEN 'unavailable' THEN 1
      WHEN 'tentative' THEN 2
      WHEN 'available' THEN 3
    END
  LIMIT 1;

  -- If no record found, assume available
  RETURN COALESCE(v_status, 'available');
END;
$$ LANGUAGE plpgsql;

-- Get crew availability summary for a date range
CREATE OR REPLACE FUNCTION get_crew_availability_summary(
  p_sailor_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  crew_member_id UUID,
  crew_name TEXT,
  crew_role TEXT,
  available_days INTEGER,
  unavailable_days INTEGER,
  tentative_days INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.id AS crew_member_id,
    cm.name AS crew_name,
    cm.role AS crew_role,
    COALESCE(SUM(CASE WHEN ca.status = 'available' THEN (ca.end_date - ca.start_date + 1) ELSE 0 END), 0)::INTEGER AS available_days,
    COALESCE(SUM(CASE WHEN ca.status = 'unavailable' THEN (ca.end_date - ca.start_date + 1) ELSE 0 END), 0)::INTEGER AS unavailable_days,
    COALESCE(SUM(CASE WHEN ca.status = 'tentative' THEN (ca.end_date - ca.start_date + 1) ELSE 0 END), 0)::INTEGER AS tentative_days
  FROM crew_members cm
  LEFT JOIN crew_availability ca
    ON ca.crew_member_id = cm.id
    AND ca.start_date <= p_end_date
    AND ca.end_date >= p_start_date
  WHERE cm.sailor_id = p_sailor_id
    AND cm.status = 'active'
  GROUP BY cm.id, cm.name, cm.role
  ORDER BY cm.created_at;
END;
$$ LANGUAGE plpgsql;

-- Update updated_at timestamp
DROP TRIGGER IF EXISTS update_crew_availability_updated_at ON crew_availability;
CREATE TRIGGER update_crew_availability_updated_at
  BEFORE UPDATE ON crew_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON crew_availability TO authenticated;

COMMENT ON TABLE crew_availability IS 'Crew member availability for races and training sessions';
COMMENT ON FUNCTION check_crew_availability IS 'Check if a crew member is available on a specific date';
COMMENT ON FUNCTION get_crew_availability_summary IS 'Get availability summary for all crew members in a date range';

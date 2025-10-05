-- ============================================================================
-- CREW MANAGEMENT ENHANCEMENTS
-- ============================================================================
-- Adds primary crew designation, certifications, and crew performance tracking

-- ============================================================================
-- ALTER CREW_MEMBERS TABLE
-- ============================================================================

-- Add primary crew flag
ALTER TABLE crew_members
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;

-- Add certifications tracking
ALTER TABLE crew_members
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]';
-- Format: [{"name": "Offshore Safety", "issuer": "US Sailing", "number": "12345", "issued_date": "2024-01-01", "expiry_date": "2026-01-01", "verified": true}]

-- Create index for primary crew lookups
CREATE INDEX IF NOT EXISTS idx_crew_members_primary ON crew_members(sailor_id, class_id, is_primary) WHERE is_primary = true;

-- ============================================================================
-- CREW RACE PARTICIPATION TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS crew_race_participation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_member_id UUID NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  race_number INTEGER NOT NULL,

  -- Position sailed
  position TEXT NOT NULL, -- 'helmsman', 'tactician', 'trimmer', etc.

  -- Performance notes
  performance_rating INTEGER CHECK (performance_rating BETWEEN 1 AND 5), -- 1-5 stars
  notes TEXT,

  -- Race result (denormalized for quick access)
  finish_position INTEGER,
  points_scored DECIMAL(5,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(crew_member_id, regatta_id, race_number)
);

CREATE INDEX IF NOT EXISTS idx_crew_race_participation_crew ON crew_race_participation(crew_member_id);
CREATE INDEX IF NOT EXISTS idx_crew_race_participation_regatta ON crew_race_participation(regatta_id);

-- ============================================================================
-- RLS POLICIES FOR CREW RACE PARTICIPATION
-- ============================================================================

ALTER TABLE crew_race_participation ENABLE ROW LEVEL SECURITY;

-- Sailors can view participation for their crew
DROP POLICY IF EXISTS "Sailors can view crew participation" ON crew_race_participation;
CREATE POLICY "Sailors can view crew participation"
  ON crew_race_participation FOR SELECT
  USING (
    crew_member_id IN (
      SELECT id FROM crew_members WHERE sailor_id = auth.uid()
    )
  );

-- Sailors can manage participation for their crew
DROP POLICY IF EXISTS "Sailors can manage crew participation" ON crew_race_participation;
CREATE POLICY "Sailors can manage crew participation"
  ON crew_race_participation FOR ALL
  USING (
    crew_member_id IN (
      SELECT id FROM crew_members WHERE sailor_id = auth.uid()
    )
  );

-- Crew members can view their own participation
DROP POLICY IF EXISTS "Crew can view own participation" ON crew_race_participation;
CREATE POLICY "Crew can view own participation"
  ON crew_race_participation FOR SELECT
  USING (
    crew_member_id IN (
      SELECT id FROM crew_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to set primary crew (ensures only one primary per sailor/class)
CREATE OR REPLACE FUNCTION set_primary_crew(
  p_crew_member_id UUID,
  p_is_primary BOOLEAN
)
RETURNS VOID AS $$
DECLARE
  v_sailor_id UUID;
  v_class_id UUID;
BEGIN
  -- Get sailor and class for this crew member
  SELECT sailor_id, class_id INTO v_sailor_id, v_class_id
  FROM crew_members
  WHERE id = p_crew_member_id;

  IF p_is_primary THEN
    -- Unset any existing primary crew for this sailor/class
    UPDATE crew_members
    SET is_primary = false
    WHERE sailor_id = v_sailor_id
      AND class_id = v_class_id
      AND is_primary = true
      AND id != p_crew_member_id;
  END IF;

  -- Set the new primary status
  UPDATE crew_members
  SET is_primary = p_is_primary
  WHERE id = p_crew_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get crew race statistics
CREATE OR REPLACE FUNCTION get_crew_race_stats(
  p_crew_member_id UUID
)
RETURNS TABLE(
  total_races INTEGER,
  avg_finish DECIMAL(5,2),
  avg_performance_rating DECIMAL(3,2),
  positions_sailed TEXT[],
  best_finish INTEGER,
  total_points DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_races,
    AVG(finish_position)::DECIMAL(5,2) AS avg_finish,
    AVG(performance_rating)::DECIMAL(3,2) AS avg_performance_rating,
    ARRAY_AGG(DISTINCT position) AS positions_sailed,
    MIN(finish_position)::INTEGER AS best_finish,
    SUM(points_scored)::DECIMAL(10,2) AS total_points
  FROM crew_race_participation
  WHERE crew_member_id = p_crew_member_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON crew_race_participation TO authenticated;

COMMENT ON TABLE crew_race_participation IS 'Tracks crew member participation and performance in individual races';
COMMENT ON FUNCTION set_primary_crew IS 'Sets a crew member as primary crew, ensuring only one primary per sailor/class';
COMMENT ON FUNCTION get_crew_race_stats IS 'Get race statistics for a crew member';

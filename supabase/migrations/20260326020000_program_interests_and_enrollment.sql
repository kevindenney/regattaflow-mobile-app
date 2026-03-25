-- Migration: Program Interests and Enrollment Support
--
-- Links programs to multiple interests (cross-domain programs),
-- and adds interest_id to programs for simple lookup.

-- =============================================================================
-- PROGRAM_INTERESTS: Programs can span multiple interests
-- =============================================================================

CREATE TABLE IF NOT EXISTS program_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  interest_id uuid NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  UNIQUE (program_id, interest_id)
);

CREATE INDEX IF NOT EXISTS idx_program_interests_program ON program_interests(program_id);
CREATE INDEX IF NOT EXISTS idx_program_interests_interest ON program_interests(interest_id);

-- Primary interest column on programs for simple lookup
ALTER TABLE programs ADD COLUMN IF NOT EXISTS interest_id uuid REFERENCES interests(id);

-- RLS
ALTER TABLE program_interests ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read program interests
CREATE POLICY "program_interests_select" ON program_interests
  FOR SELECT TO authenticated USING (true);

-- Org managers can manage
CREATE POLICY "program_interests_insert" ON program_interests
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      JOIN programs p ON p.organization_id = om.organization_id
      WHERE p.id = program_interests.program_id
        AND om.user_id = auth.uid()
        AND om.membership_status = 'active'
        AND om.role IN ('owner', 'admin', 'manager', 'faculty', 'instructor')
    )
  );

CREATE POLICY "program_interests_delete" ON program_interests
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      JOIN programs p ON p.organization_id = om.organization_id
      WHERE p.id = program_interests.program_id
        AND om.user_id = auth.uid()
        AND om.membership_status = 'active'
        AND om.role IN ('owner', 'admin', 'manager', 'faculty', 'instructor')
    )
  );

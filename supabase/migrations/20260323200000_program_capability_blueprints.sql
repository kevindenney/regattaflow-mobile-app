-- Program-Capability Blueprints Migration
-- Adds: sub-competencies, program↔competency mapping, blueprint program_id

-- 1. Sub-competencies table (e.g., 5-6 per AACN competency → ~270 total)
CREATE TABLE IF NOT EXISTS betterat_sub_competencies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competency_id   uuid NOT NULL REFERENCES betterat_competencies(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  sort_order      integer DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sub_competencies_parent ON betterat_sub_competencies(competency_id);

-- 2. Program ↔ Competency mapping (which competencies does this program require?)
CREATE TABLE IF NOT EXISTS program_competencies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  competency_id   uuid NOT NULL REFERENCES betterat_competencies(id) ON DELETE CASCADE,
  is_required     boolean DEFAULT true,
  sort_order      integer DEFAULT 0,
  UNIQUE (program_id, competency_id)
);
CREATE INDEX IF NOT EXISTS idx_program_competencies_program ON program_competencies(program_id);

-- 3. Program ↔ Sub-competency mapping (optional granularity)
CREATE TABLE IF NOT EXISTS program_sub_competencies (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id          uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  sub_competency_id   uuid NOT NULL REFERENCES betterat_sub_competencies(id) ON DELETE CASCADE,
  is_required         boolean DEFAULT true,
  sort_order          integer DEFAULT 0,
  UNIQUE (program_id, sub_competency_id)
);
CREATE INDEX IF NOT EXISTS idx_program_sub_competencies_program ON program_sub_competencies(program_id);

-- 4. Add program_id to blueprints
ALTER TABLE timeline_blueprints
  ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE SET NULL;

-- Update unique indexes for org blueprints to include program
DROP INDEX IF EXISTS idx_blueprint_user_interest_org;
CREATE UNIQUE INDEX IF NOT EXISTS idx_blueprint_user_interest_org_program
  ON timeline_blueprints(user_id, interest_id, organization_id, program_id)
  WHERE organization_id IS NOT NULL AND program_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_blueprint_user_interest_org_no_program
  ON timeline_blueprints(user_id, interest_id, organization_id)
  WHERE organization_id IS NOT NULL AND program_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_blueprints_program ON timeline_blueprints(program_id) WHERE program_id IS NOT NULL;

-- 5. RLS for new tables
ALTER TABLE betterat_sub_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_sub_competencies ENABLE ROW LEVEL SECURITY;

-- Sub-competencies: anyone authenticated can read
CREATE POLICY "sub_competencies_select" ON betterat_sub_competencies
  FOR SELECT TO authenticated USING (true);

-- Program competencies: org members can read, managers can write
CREATE POLICY "program_competencies_select" ON program_competencies
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      JOIN programs p ON p.organization_id = om.organization_id
      WHERE p.id = program_competencies.program_id
        AND om.user_id = auth.uid()
        AND om.membership_status = 'active'
    )
  );

CREATE POLICY "program_competencies_insert" ON program_competencies
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      JOIN programs p ON p.organization_id = om.organization_id
      WHERE p.id = program_competencies.program_id
        AND om.user_id = auth.uid()
        AND om.membership_status = 'active'
        AND om.role IN ('owner', 'admin', 'manager', 'faculty', 'instructor')
    )
  );

CREATE POLICY "program_competencies_update" ON program_competencies
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      JOIN programs p ON p.organization_id = om.organization_id
      WHERE p.id = program_competencies.program_id
        AND om.user_id = auth.uid()
        AND om.membership_status = 'active'
        AND om.role IN ('owner', 'admin', 'manager', 'faculty', 'instructor')
    )
  );

CREATE POLICY "program_competencies_delete" ON program_competencies
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      JOIN programs p ON p.organization_id = om.organization_id
      WHERE p.id = program_competencies.program_id
        AND om.user_id = auth.uid()
        AND om.membership_status = 'active'
        AND om.role IN ('owner', 'admin', 'manager', 'faculty', 'instructor')
    )
  );

-- Program sub-competencies: same policies
CREATE POLICY "program_sub_competencies_select" ON program_sub_competencies
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      JOIN programs p ON p.organization_id = om.organization_id
      WHERE p.id = program_sub_competencies.program_id
        AND om.user_id = auth.uid()
        AND om.membership_status = 'active'
    )
  );

CREATE POLICY "program_sub_competencies_insert" ON program_sub_competencies
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      JOIN programs p ON p.organization_id = om.organization_id
      WHERE p.id = program_sub_competencies.program_id
        AND om.user_id = auth.uid()
        AND om.membership_status = 'active'
        AND om.role IN ('owner', 'admin', 'manager', 'faculty', 'instructor')
    )
  );

CREATE POLICY "program_sub_competencies_update" ON program_sub_competencies
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      JOIN programs p ON p.organization_id = om.organization_id
      WHERE p.id = program_sub_competencies.program_id
        AND om.user_id = auth.uid()
        AND om.membership_status = 'active'
        AND om.role IN ('owner', 'admin', 'manager', 'faculty', 'instructor')
    )
  );

CREATE POLICY "program_sub_competencies_delete" ON program_sub_competencies
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM organization_memberships om
      JOIN programs p ON p.organization_id = om.organization_id
      WHERE p.id = program_sub_competencies.program_id
        AND om.user_id = auth.uid()
        AND om.membership_status = 'active'
        AND om.role IN ('owner', 'admin', 'manager', 'faculty', 'instructor')
    )
  );

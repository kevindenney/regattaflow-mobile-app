-- =============================================================================
-- Org-Scoped Competencies
--
-- Adds organization_id to betterat_competencies and betterat_sub_competencies
-- so orgs can manage their own competencies while global templates remain
-- read-only.
--
-- NULL organization_id = global template (immutable via app)
-- Non-null = org-specific (editable by org admins)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add organization_id columns
-- ---------------------------------------------------------------------------

ALTER TABLE betterat_competencies
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);

ALTER TABLE betterat_sub_competencies
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);

-- ---------------------------------------------------------------------------
-- 2. Indexes on organization_id
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_competencies_org_id
  ON betterat_competencies (organization_id)
  WHERE organization_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sub_competencies_org_id
  ON betterat_sub_competencies (organization_id)
  WHERE organization_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3. Replace unique constraint with partial indexes
-- ---------------------------------------------------------------------------

-- Drop the old unique constraint if it exists
DO $$
BEGIN
  -- Try to drop the constraint by common naming patterns
  BEGIN
    ALTER TABLE betterat_competencies DROP CONSTRAINT IF EXISTS betterat_competencies_interest_id_competency_number_key;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER TABLE betterat_competencies DROP CONSTRAINT IF EXISTS betterat_competencies_interest_competency_number_unique;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- Drop any existing unique index on (interest_id, competency_number)
DROP INDEX IF EXISTS betterat_competencies_interest_id_competency_number_key;
DROP INDEX IF EXISTS betterat_competencies_interest_competency_number_unique;

-- Partial unique index for global templates
CREATE UNIQUE INDEX IF NOT EXISTS uq_competencies_template
  ON betterat_competencies (interest_id, competency_number)
  WHERE organization_id IS NULL;

-- Partial unique index for org-scoped competencies
CREATE UNIQUE INDEX IF NOT EXISTS uq_competencies_org_scoped
  ON betterat_competencies (organization_id, interest_id, competency_number)
  WHERE organization_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4. RLS policies for betterat_competencies
-- ---------------------------------------------------------------------------

-- Ensure RLS is enabled
ALTER TABLE betterat_competencies ENABLE ROW LEVEL SECURITY;

-- Read: anyone authenticated can read all competencies (templates + their org's)
DO $$ BEGIN
  DROP POLICY IF EXISTS competencies_select_authenticated ON betterat_competencies;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY competencies_select_authenticated ON betterat_competencies
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert: org admins can insert org-scoped competencies only
DO $$ BEGIN
  DROP POLICY IF EXISTS competencies_insert_org_admin ON betterat_competencies;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY competencies_insert_org_admin ON betterat_competencies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.organization_id = betterat_competencies.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin', 'manager', 'faculty', 'instructor')
        AND COALESCE(om.membership_status, om.status) = 'active'
    )
  );

-- Update: org admins can update org-scoped competencies only
DO $$ BEGIN
  DROP POLICY IF EXISTS competencies_update_org_admin ON betterat_competencies;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY competencies_update_org_admin ON betterat_competencies
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.organization_id = betterat_competencies.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin', 'manager', 'faculty', 'instructor')
        AND COALESCE(om.membership_status, om.status) = 'active'
    )
  )
  WITH CHECK (
    organization_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.organization_id = betterat_competencies.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin', 'manager', 'faculty', 'instructor')
        AND COALESCE(om.membership_status, om.status) = 'active'
    )
  );

-- Delete: org admins can delete org-scoped competencies only
DO $$ BEGIN
  DROP POLICY IF EXISTS competencies_delete_org_admin ON betterat_competencies;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY competencies_delete_org_admin ON betterat_competencies
  FOR DELETE
  TO authenticated
  USING (
    organization_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.organization_id = betterat_competencies.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin', 'manager', 'faculty', 'instructor')
        AND COALESCE(om.membership_status, om.status) = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- 5. RLS policies for betterat_sub_competencies
-- ---------------------------------------------------------------------------

ALTER TABLE betterat_sub_competencies ENABLE ROW LEVEL SECURITY;

-- Read: anyone authenticated can read all sub-competencies
DO $$ BEGIN
  DROP POLICY IF EXISTS sub_competencies_select_authenticated ON betterat_sub_competencies;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY sub_competencies_select_authenticated ON betterat_sub_competencies
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert: org admins can insert sub-competencies under org-scoped parents
DO $$ BEGIN
  DROP POLICY IF EXISTS sub_competencies_insert_org_admin ON betterat_sub_competencies;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY sub_competencies_insert_org_admin ON betterat_sub_competencies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.organization_id = betterat_sub_competencies.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin', 'manager', 'faculty', 'instructor')
        AND COALESCE(om.membership_status, om.status) = 'active'
    )
  );

-- Update: org admins can update org-scoped sub-competencies
DO $$ BEGIN
  DROP POLICY IF EXISTS sub_competencies_update_org_admin ON betterat_sub_competencies;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY sub_competencies_update_org_admin ON betterat_sub_competencies
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.organization_id = betterat_sub_competencies.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin', 'manager', 'faculty', 'instructor')
        AND COALESCE(om.membership_status, om.status) = 'active'
    )
  )
  WITH CHECK (
    organization_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.organization_id = betterat_sub_competencies.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin', 'manager', 'faculty', 'instructor')
        AND COALESCE(om.membership_status, om.status) = 'active'
    )
  );

-- Delete: org admins can delete org-scoped sub-competencies
DO $$ BEGIN
  DROP POLICY IF EXISTS sub_competencies_delete_org_admin ON betterat_sub_competencies;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY sub_competencies_delete_org_admin ON betterat_sub_competencies
  FOR DELETE
  TO authenticated
  USING (
    organization_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM organization_memberships om
      WHERE om.organization_id = betterat_sub_competencies.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin', 'manager', 'faculty', 'instructor')
        AND COALESCE(om.membership_status, om.status) = 'active'
    )
  );

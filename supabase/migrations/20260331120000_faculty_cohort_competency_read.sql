-- ============================================================================
-- Faculty/Admin read access to cohort members' competency data
-- ============================================================================
-- Allows org admins (admin, faculty, manager roles) to read competency
-- progress, attempts, and reviews for students in their org's cohorts.
--
-- This avoids the cross-table recursion issue from the original policies
-- by only referencing cohort membership (no cross-references between
-- progress/attempts/reviews tables).
-- ============================================================================

-- 1. Faculty can read competency progress for cohort members
CREATE POLICY "faculty_read_cohort_progress_v1"
  ON betterat_competency_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM betterat_org_cohort_members cm
      JOIN betterat_org_cohorts c ON c.id = cm.cohort_id
      JOIN organization_memberships om ON om.organization_id = c.org_id
        AND om.user_id = auth.uid()
        AND COALESCE(om.membership_status, om.status) = 'active'
        AND om.role IN ('owner', 'admin', 'manager', 'faculty', 'instructor')
      WHERE cm.user_id = betterat_competency_progress.user_id
    )
  );

-- 2. Faculty can read competency attempts for cohort members
CREATE POLICY "faculty_read_cohort_attempts_v1"
  ON betterat_competency_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM betterat_org_cohort_members cm
      JOIN betterat_org_cohorts c ON c.id = cm.cohort_id
      JOIN organization_memberships om ON om.organization_id = c.org_id
        AND om.user_id = auth.uid()
        AND COALESCE(om.membership_status, om.status) = 'active'
        AND om.role IN ('owner', 'admin', 'manager', 'faculty', 'instructor')
      WHERE cm.user_id = betterat_competency_attempts.user_id
    )
  );

-- 3. Faculty can read competency reviews for cohort members
CREATE POLICY "faculty_read_cohort_reviews_v1"
  ON betterat_competency_reviews
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM betterat_competency_progress cp
      JOIN betterat_org_cohort_members cm ON cm.user_id = cp.user_id
      JOIN betterat_org_cohorts c ON c.id = cm.cohort_id
      JOIN organization_memberships om ON om.organization_id = c.org_id
        AND om.user_id = auth.uid()
        AND COALESCE(om.membership_status, om.status) = 'active'
        AND om.role IN ('owner', 'admin', 'manager', 'faculty', 'instructor')
      WHERE cp.id = betterat_competency_reviews.progress_id
    )
  );

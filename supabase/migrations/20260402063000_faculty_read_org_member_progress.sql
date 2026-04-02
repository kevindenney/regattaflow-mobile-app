-- Allow org faculty/admins to read competency progress for any org member,
-- not just cohort members. This enables the student detail page to show
-- accurate status/attempts when accessed from the Members screen.

CREATE POLICY "faculty_read_org_member_progress_v1"
ON public.betterat_competency_progress
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM organization_memberships viewer_om
    JOIN organization_memberships student_om
      ON student_om.organization_id = viewer_om.organization_id
      AND student_om.user_id = betterat_competency_progress.user_id
      AND COALESCE(student_om.membership_status, student_om.status) = 'active'
    WHERE viewer_om.user_id = auth.uid()
      AND COALESCE(viewer_om.membership_status, viewer_om.status) = 'active'
      AND viewer_om.role IN ('owner', 'admin', 'manager', 'faculty', 'instructor', 'evaluator', 'preceptor', 'clinical_instructor')
  )
);

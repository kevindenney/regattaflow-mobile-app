-- Allow org faculty/admins to read timeline_steps for members of their organization.
-- This enables the student detail page to show step evidence to faculty reviewers.

CREATE POLICY "faculty_read_org_member_steps_v1"
ON public.timeline_steps
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM organization_memberships viewer_om
    JOIN organization_memberships student_om
      ON student_om.organization_id = viewer_om.organization_id
      AND student_om.user_id = timeline_steps.user_id
      AND COALESCE(student_om.membership_status, student_om.status) = 'active'
    WHERE viewer_om.user_id = auth.uid()
      AND COALESCE(viewer_om.membership_status, viewer_om.status) = 'active'
      AND viewer_om.role IN ('owner', 'admin', 'manager', 'faculty', 'instructor', 'evaluator', 'preceptor', 'clinical_instructor')
  )
);

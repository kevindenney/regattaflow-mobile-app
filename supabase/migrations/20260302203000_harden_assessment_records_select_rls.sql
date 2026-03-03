-- =============================================================================
-- Harden Assessment Records SELECT RLS
--
-- Canonical ownership:
-- - Owns final `assessment_records` SELECT policy set for institution and
--   non-institution workspaces in the 20260302 lane.
-- Override intent:
-- - Replaces baseline `assessment_records_select_org_members` behavior from
--   `20260302110000_programs_core_model.sql` with scoped final policies.
-- =============================================================================

BEGIN;

-- Harden SELECT access on assessment_records for institution workspaces.
-- Institution rules:
-- 1) owners/admins: org-wide access
-- 2) learners/students: only rows tied to their own participant assignment
-- 3) faculty/preceptors/coordinators/instructors: only participants in assigned programs
--
-- Non-institution workspaces keep the prior org-member visibility behavior.

DROP POLICY IF EXISTS "assessment_records_select_org_members" ON public.assessment_records;
DROP POLICY IF EXISTS "assessment_records_select_non_institution_org_members" ON public.assessment_records;
DROP POLICY IF EXISTS "assessment_records_select_institution_owner_admin" ON public.assessment_records;
DROP POLICY IF EXISTS "assessment_records_select_institution_learner_self" ON public.assessment_records;
DROP POLICY IF EXISTS "assessment_records_select_institution_assigned_staff" ON public.assessment_records;

CREATE POLICY "assessment_records_select_non_institution_org_members"
  ON public.assessment_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = assessment_records.organization_id
        AND o.organization_type <> 'institution'
    )
    AND (
      public.is_active_org_member(assessment_records.organization_id)
      OR assessment_records.evaluator_id = auth.uid()
    )
  );

CREATE POLICY "assessment_records_select_institution_owner_admin"
  ON public.assessment_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = assessment_records.organization_id
        AND o.organization_type = 'institution'
    )
    AND public.has_org_role(
      assessment_records.organization_id,
      ARRAY['owner', 'admin']::text[]
    )
  );

CREATE POLICY "assessment_records_select_institution_learner_self"
  ON public.assessment_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = assessment_records.organization_id
        AND o.organization_type = 'institution'
    )
    AND EXISTS (
      SELECT 1
      FROM public.program_participants pp
      WHERE pp.id = assessment_records.participant_id
        AND pp.organization_id = assessment_records.organization_id
        AND pp.user_id = auth.uid()
        AND pp.status IN ('active', 'completed')
    )
  );

CREATE POLICY "assessment_records_select_institution_assigned_staff"
  ON public.assessment_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = assessment_records.organization_id
        AND o.organization_type = 'institution'
    )
    AND (
      assessment_records.evaluator_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.program_participants viewer
        JOIN public.program_participants assessed
          ON assessed.id = assessment_records.participant_id
         AND assessed.organization_id = assessment_records.organization_id
         AND assessed.status IN ('invited', 'active', 'completed')
        WHERE viewer.organization_id = assessment_records.organization_id
          AND viewer.user_id = auth.uid()
          AND viewer.status IN ('active', 'completed')
          AND viewer.role IN ('faculty', 'instructor', 'preceptor', 'coordinator')
          AND viewer.program_id = assessed.program_id
      )
    )
  );

COMMIT;

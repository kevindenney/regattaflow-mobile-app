-- =============================================================================
-- Harden organization invite RLS against role escalation
--
-- Canonical ownership:
-- - Owns canonical final invite table INSERT/UPDATE policies:
--   `organization_invites_insert_org_staff` and
--   `organization_invites_update_org_staff`.
-- Override intent:
-- - Supersedes staging/transitional symbols:
--   `organization_invites_insert_org_staff_base_v1`,
--   `organization_invites_update_org_staff_base_v1`, and
--   `organization_invites_update_org_staff_invitee_transition_v2`.
-- =============================================================================

BEGIN;

DROP POLICY IF EXISTS "organization_invites_insert_org_staff" ON public.organization_invites;
DROP POLICY IF EXISTS "organization_invites_insert_org_staff_base_v1" ON public.organization_invites;
CREATE POLICY "organization_invites_insert_org_staff"
  ON public.organization_invites FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by = auth.uid()
    AND public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager', 'coordinator']::text[]
    )
  );

DROP POLICY IF EXISTS "organization_invites_update_org_staff" ON public.organization_invites;
DROP POLICY IF EXISTS "organization_invites_update_org_staff_base_v1" ON public.organization_invites;
DROP POLICY IF EXISTS "organization_invites_update_org_staff_invitee_transition_v2" ON public.organization_invites;
CREATE POLICY "organization_invites_update_org_staff"
  ON public.organization_invites FOR UPDATE
  TO authenticated
  USING (
    invited_by = auth.uid()
    OR public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager', 'coordinator']::text[]
    )
  )
  WITH CHECK (
    invited_by = auth.uid()
    OR public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager', 'coordinator']::text[]
    )
  );

COMMIT;

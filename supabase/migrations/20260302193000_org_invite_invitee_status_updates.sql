-- =============================================================================
-- Organization invite status updates for invite recipients
--
-- Canonical ownership:
-- - Owns transitional invitee-capable update policy
--   `organization_invites_update_org_staff_invitee_transition_v2`.
-- Override intent:
-- - Transitional policy layer only; superseded by canonical final
--   `organization_invites_update_org_staff` in
--   `20260302213000_harden_org_invite_rls.sql`.
-- =============================================================================

BEGIN;

DROP POLICY IF EXISTS "organization_invites_update_org_staff" ON public.organization_invites;
DROP POLICY IF EXISTS "organization_invites_update_org_staff_base_v1" ON public.organization_invites;
DROP POLICY IF EXISTS "organization_invites_update_org_staff_invitee_transition_v2" ON public.organization_invites;
CREATE POLICY "organization_invites_update_org_staff_invitee_transition_v2"
  ON public.organization_invites FOR UPDATE
  TO authenticated
  USING (
    invited_by = auth.uid()
    OR public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager', 'coordinator']::text[]
    )
    OR (
      invitee_email IS NOT NULL
      AND lower(invitee_email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  )
  WITH CHECK (
    invited_by = auth.uid()
    OR public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager', 'coordinator']::text[]
    )
    OR (
      invitee_email IS NOT NULL
      AND lower(invitee_email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
      AND status IN ('opened', 'accepted', 'declined')
    )
  );

COMMIT;

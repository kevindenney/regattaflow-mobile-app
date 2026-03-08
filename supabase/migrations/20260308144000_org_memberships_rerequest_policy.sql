BEGIN;

DROP POLICY IF EXISTS "organization_memberships_update_own_rejected_to_pending_v1" ON public.organization_memberships;
CREATE POLICY "organization_memberships_update_own_rejected_to_pending_v1"
  ON public.organization_memberships FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND COALESCE(membership_status, status) = 'rejected'
    AND EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = organization_memberships.organization_id
        AND o.join_mode = 'request_to_join'
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'member'
    AND status = 'pending'
    AND membership_status = 'pending'
    AND EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = organization_memberships.organization_id
        AND o.join_mode = 'request_to_join'
    )
  );

COMMENT ON POLICY "organization_memberships_update_own_rejected_to_pending_v1" ON public.organization_memberships
  IS 'Allows members to re-request access by moving their own rejected request back to pending for request_to_join orgs.';

COMMIT;

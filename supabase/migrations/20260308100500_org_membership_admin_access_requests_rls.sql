BEGIN;

-- Keep requester self-read, and additionally allow active org admins/managers/owners
-- to view memberships in their organization (needed for access request review UIs).
DROP POLICY IF EXISTS "organization_memberships_select_own_v1" ON public.organization_memberships;
CREATE POLICY "organization_memberships_select_own_or_org_admin_v2"
  ON public.organization_memberships FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.organization_memberships om
      WHERE om.organization_id = organization_memberships.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin', 'manager')
        AND COALESCE(om.membership_status, om.status) = 'active'
    )
  );

-- Allow active org admins/managers/owners to approve/reject membership requests.
DROP POLICY IF EXISTS "organization_memberships_update_org_admin_v1" ON public.organization_memberships;
CREATE POLICY "organization_memberships_update_org_admin_v1"
  ON public.organization_memberships FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.organization_memberships om
      WHERE om.organization_id = organization_memberships.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin', 'manager')
        AND COALESCE(om.membership_status, om.status) = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.organization_memberships om
      WHERE om.organization_id = organization_memberships.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin', 'manager')
        AND COALESCE(om.membership_status, om.status) = 'active'
    )
  );

COMMENT ON POLICY "organization_memberships_select_own_or_org_admin_v2" ON public.organization_memberships
  IS 'Users can read own memberships; active org owners/admins/managers can read memberships in their org.';

COMMENT ON POLICY "organization_memberships_update_org_admin_v1" ON public.organization_memberships
  IS 'Active org owners/admins/managers can update membership rows in their org (approve/reject flow).';

COMMIT;

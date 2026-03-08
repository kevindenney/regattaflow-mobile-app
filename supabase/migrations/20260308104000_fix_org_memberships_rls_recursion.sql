BEGIN;

CREATE OR REPLACE FUNCTION public.is_org_admin_member(p_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR p_org_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.organization_memberships om
    WHERE om.organization_id = p_org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager')
      AND COALESCE(om.membership_status, om.status) = 'active'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_org_admin_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_org_admin_member(uuid) TO authenticated;

DROP POLICY IF EXISTS "organization_memberships_select_own_or_org_admin_v2" ON public.organization_memberships;
DROP POLICY IF EXISTS "organization_memberships_select_own_v1" ON public.organization_memberships;
CREATE POLICY "organization_memberships_select_own_or_org_admin_v3"
  ON public.organization_memberships FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_org_admin_member(organization_id)
  );

DROP POLICY IF EXISTS "organization_memberships_update_org_admin_v1" ON public.organization_memberships;
CREATE POLICY "organization_memberships_update_org_admin_v2"
  ON public.organization_memberships FOR UPDATE
  TO authenticated
  USING (public.is_org_admin_member(organization_id))
  WITH CHECK (public.is_org_admin_member(organization_id));

COMMENT ON FUNCTION public.is_org_admin_member(uuid)
  IS 'Returns true when current user is an active owner/admin/manager for the organization.';

COMMENT ON POLICY "organization_memberships_select_own_or_org_admin_v3" ON public.organization_memberships
  IS 'Users can read own memberships; active org owners/admins/managers can read memberships in their org.';

COMMENT ON POLICY "organization_memberships_update_org_admin_v2" ON public.organization_memberships
  IS 'Active org owners/admins/managers can update membership rows in their org (approve/reject flow).';

COMMIT;

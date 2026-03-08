BEGIN;

CREATE OR REPLACE FUNCTION public.is_org_active_member(p_org_id uuid)
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
      AND COALESCE(om.membership_status, om.status) = 'active'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_org_active_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_org_active_member(uuid) TO authenticated;

CREATE TABLE IF NOT EXISTS public.betterat_org_cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NULL,
  interest_slug text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.betterat_org_cohort_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES public.betterat_org_cohorts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT betterat_org_cohort_members_unique UNIQUE (cohort_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_betterat_org_cohorts_org_id
  ON public.betterat_org_cohorts (org_id);

CREATE INDEX IF NOT EXISTS idx_betterat_org_cohort_members_cohort_id
  ON public.betterat_org_cohort_members (cohort_id);

CREATE INDEX IF NOT EXISTS idx_betterat_org_cohort_members_user_id
  ON public.betterat_org_cohort_members (user_id);

ALTER TABLE public.betterat_org_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.betterat_org_cohort_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "betterat_org_cohorts_select_active_members_v1" ON public.betterat_org_cohorts;
CREATE POLICY "betterat_org_cohorts_select_active_members_v1"
  ON public.betterat_org_cohorts FOR SELECT
  TO authenticated
  USING (public.is_org_active_member(org_id));

DROP POLICY IF EXISTS "betterat_org_cohorts_insert_admin_v1" ON public.betterat_org_cohorts;
CREATE POLICY "betterat_org_cohorts_insert_admin_v1"
  ON public.betterat_org_cohorts FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_admin_member(org_id));

DROP POLICY IF EXISTS "betterat_org_cohorts_update_admin_v1" ON public.betterat_org_cohorts;
CREATE POLICY "betterat_org_cohorts_update_admin_v1"
  ON public.betterat_org_cohorts FOR UPDATE
  TO authenticated
  USING (public.is_org_admin_member(org_id))
  WITH CHECK (public.is_org_admin_member(org_id));

DROP POLICY IF EXISTS "betterat_org_cohorts_delete_admin_v1" ON public.betterat_org_cohorts;
CREATE POLICY "betterat_org_cohorts_delete_admin_v1"
  ON public.betterat_org_cohorts FOR DELETE
  TO authenticated
  USING (public.is_org_admin_member(org_id));

DROP POLICY IF EXISTS "betterat_org_cohort_members_select_active_members_v1" ON public.betterat_org_cohort_members;
CREATE POLICY "betterat_org_cohort_members_select_active_members_v1"
  ON public.betterat_org_cohort_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.betterat_org_cohorts c
      WHERE c.id = cohort_id
        AND public.is_org_active_member(c.org_id)
    )
  );

DROP POLICY IF EXISTS "betterat_org_cohort_members_insert_admin_v1" ON public.betterat_org_cohort_members;
CREATE POLICY "betterat_org_cohort_members_insert_admin_v1"
  ON public.betterat_org_cohort_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.betterat_org_cohorts c
      WHERE c.id = cohort_id
        AND public.is_org_admin_member(c.org_id)
    )
  );

DROP POLICY IF EXISTS "betterat_org_cohort_members_update_admin_v1" ON public.betterat_org_cohort_members;
CREATE POLICY "betterat_org_cohort_members_update_admin_v1"
  ON public.betterat_org_cohort_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.betterat_org_cohorts c
      WHERE c.id = cohort_id
        AND public.is_org_admin_member(c.org_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.betterat_org_cohorts c
      WHERE c.id = cohort_id
        AND public.is_org_admin_member(c.org_id)
    )
  );

DROP POLICY IF EXISTS "betterat_org_cohort_members_delete_admin_v1" ON public.betterat_org_cohort_members;
CREATE POLICY "betterat_org_cohort_members_delete_admin_v1"
  ON public.betterat_org_cohort_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.betterat_org_cohorts c
      WHERE c.id = cohort_id
        AND public.is_org_admin_member(c.org_id)
    )
  );

COMMENT ON FUNCTION public.is_org_active_member(uuid)
  IS 'Returns true when current user has an active membership in the organization.';

COMMIT;

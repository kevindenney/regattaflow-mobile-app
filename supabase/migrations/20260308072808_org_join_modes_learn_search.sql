BEGIN;

ALTER TABLE IF EXISTS public.organizations
  ADD COLUMN IF NOT EXISTS join_mode text NOT NULL DEFAULT 'invite_only';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'organizations_join_mode_check'
      AND conrelid = 'public.organizations'::regclass
  ) THEN
    ALTER TABLE public.organizations
      ADD CONSTRAINT organizations_join_mode_check
      CHECK (join_mode IN ('invite_only', 'request_to_join', 'open_join'));
  END IF;
END;
$$;

ALTER TABLE IF EXISTS public.organization_memberships
  ADD COLUMN IF NOT EXISTS membership_status text NOT NULL DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'organization_memberships_membership_status_check'
      AND conrelid = 'public.organization_memberships'::regclass
  ) THEN
    ALTER TABLE public.organization_memberships
      ADD CONSTRAINT organization_memberships_membership_status_check
      CHECK (membership_status IN ('pending', 'active', 'rejected'));
  END IF;
END;
$$;

ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organization_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "organizations_select_authenticated_v1" ON public.organizations;
CREATE POLICY "organizations_select_authenticated_v1"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "organization_memberships_select_own_v1" ON public.organization_memberships;
CREATE POLICY "organization_memberships_select_own_v1"
  ON public.organization_memberships FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "organization_memberships_insert_open_join_v1" ON public.organization_memberships;
CREATE POLICY "organization_memberships_insert_open_join_v1"
  ON public.organization_memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'member'
    AND status = 'active'
    AND membership_status = 'active'
    AND EXISTS (
      SELECT 1
      FROM public.organizations o
      WHERE o.id = organization_memberships.organization_id
        AND o.join_mode = 'open_join'
    )
  );

DROP POLICY IF EXISTS "organization_memberships_insert_request_join_v1" ON public.organization_memberships;
CREATE POLICY "organization_memberships_insert_request_join_v1"
  ON public.organization_memberships FOR INSERT
  TO authenticated
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

COMMENT ON POLICY "organization_memberships_insert_open_join_v1" ON public.organization_memberships
  IS 'V1 self-serve join for open_join organizations.';
COMMENT ON POLICY "organization_memberships_insert_request_join_v1" ON public.organization_memberships
  IS 'V1 self-serve request for request_to_join organizations. Admin approval flow TODO.';

COMMIT;

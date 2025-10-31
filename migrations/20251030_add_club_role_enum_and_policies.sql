-- Migration: Add ClubRole enum type and RLS policies
-- Description: Aligns database schema with TypeScript ClubRole taxonomy
-- Related: types/club.ts, services/ClubMemberService.ts

-- ============================================================================
-- CREATE CLUB ROLE ENUM TYPE
-- ============================================================================

-- Create the club_role enum matching TypeScript ClubRole type
CREATE TYPE club_role AS ENUM (
  'admin',
  'race_officer',
  'scorer',
  'communications',
  'treasurer',
  'membership_manager',
  'sailing_manager',
  'race_committee',
  'instructor',
  'secretary',
  'member',
  'guest'
);

COMMENT ON TYPE club_role IS 'Standardized club membership roles with defined permissions and access levels';

-- ============================================================================
-- DROP DEPENDENT POLICIES BEFORE COLUMN TYPE CHANGE
-- ============================================================================

-- These policies reference club_members.role and must be dropped before type change
-- They will be recreated after the migration with the enum type

-- Drop club_classes policies
DROP POLICY IF EXISTS "club_classes_delete" ON public.club_classes;
DROP POLICY IF EXISTS "club_classes_insert" ON public.club_classes;
DROP POLICY IF EXISTS "club_classes_update" ON public.club_classes;

-- Drop club_facilities policies
DROP POLICY IF EXISTS "club_facilities_delete" ON public.club_facilities;
DROP POLICY IF EXISTS "club_facilities_insert" ON public.club_facilities;
DROP POLICY IF EXISTS "club_facilities_update" ON public.club_facilities;

-- Drop club_fleets policies
DROP POLICY IF EXISTS "club_fleets_delete" ON public.club_fleets;
DROP POLICY IF EXISTS "club_fleets_insert" ON public.club_fleets;
DROP POLICY IF EXISTS "club_fleets_update" ON public.club_fleets;

-- Drop club_race_calendar policies
DROP POLICY IF EXISTS "club_race_calendar_delete" ON public.club_race_calendar;
DROP POLICY IF EXISTS "club_race_calendar_insert" ON public.club_race_calendar;
DROP POLICY IF EXISTS "club_race_calendar_update" ON public.club_race_calendar;

-- Drop club_services policies
DROP POLICY IF EXISTS "club_services_delete" ON public.club_services;
DROP POLICY IF EXISTS "club_services_insert" ON public.club_services;
DROP POLICY IF EXISTS "club_services_update" ON public.club_services;

-- ============================================================================
-- MIGRATE LEGACY 'owner' ROLE TO 'admin'
-- ============================================================================

-- Update any existing 'owner' roles to 'admin' before type change
-- Note: 'owner' was a legacy role concept, 'admin' is the standardized equivalent
UPDATE public.club_members
SET role = 'admin'
WHERE role = 'owner';

-- ============================================================================
-- ALTER CLUB_MEMBERS TABLE TO USE ENUM
-- ============================================================================

-- Convert existing text column to enum type
ALTER TABLE public.club_members
  ALTER COLUMN role DROP DEFAULT;

-- Cast existing values to enum (safe after owner->admin migration)
ALTER TABLE public.club_members
  ALTER COLUMN role TYPE club_role USING role::club_role;

ALTER TABLE public.club_members
  ALTER COLUMN role SET DEFAULT 'member'::club_role;

ALTER TABLE public.club_members
  ALTER COLUMN role SET NOT NULL;

-- Add index on role for faster permission queries
CREATE INDEX IF NOT EXISTS idx_club_members_role ON public.club_members(role);

-- Add composite index for club-role lookups
CREATE INDEX IF NOT EXISTS idx_club_members_club_role ON public.club_members(club_id, role);

-- Add index for active members by role
CREATE INDEX IF NOT EXISTS idx_club_members_active_role
  ON public.club_members(club_id, role)
  WHERE is_active = true;

COMMENT ON COLUMN public.club_members.role IS 'Member role determining permissions and access level within the club';

-- ============================================================================
-- ROLE HELPER FUNCTIONS
-- ============================================================================

-- Check if a role has admin access
-- Mirrors TypeScript hasAdminAccess() function
CREATE OR REPLACE FUNCTION has_admin_access(check_role club_role)
RETURNS BOOLEAN
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
  RETURN check_role IN ('admin', 'sailing_manager', 'race_officer');
END;
$$;

COMMENT ON FUNCTION has_admin_access IS 'Returns true if role has administrative access to club management features';

-- Check if a role is a core management role
-- Mirrors TypeScript isManagementRole() function
CREATE OR REPLACE FUNCTION is_management_role(check_role club_role)
RETURNS BOOLEAN
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
  RETURN check_role IN (
    'admin',
    'sailing_manager',
    'race_officer',
    'scorer',
    'communications',
    'treasurer',
    'membership_manager'
  );
END;
$$;

COMMENT ON FUNCTION is_management_role IS 'Returns true if role is part of core club management team';

-- Check if user has specific role in a club
CREATE OR REPLACE FUNCTION user_has_club_role(
  check_user_id UUID,
  check_club_id UUID,
  required_role club_role
)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.club_members
    WHERE user_id = check_user_id
      AND club_id = check_club_id
      AND role = required_role
      AND is_active = true
  );
END;
$$;

COMMENT ON FUNCTION user_has_club_role IS 'Check if a user has a specific role in a club';

-- Check if user has any of several roles in a club
CREATE OR REPLACE FUNCTION user_has_any_club_role(
  check_user_id UUID,
  check_club_id UUID,
  required_roles club_role[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.club_members
    WHERE user_id = check_user_id
      AND club_id = check_club_id
      AND role = ANY(required_roles)
      AND is_active = true
  );
END;
$$;

COMMENT ON FUNCTION user_has_any_club_role IS 'Check if a user has any of the specified roles in a club';

-- Get user's role in a club
CREATE OR REPLACE FUNCTION get_user_club_role(
  check_user_id UUID,
  check_club_id UUID
)
RETURNS club_role
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  user_role club_role;
BEGIN
  SELECT role INTO user_role
  FROM public.club_members
  WHERE user_id = check_user_id
    AND club_id = check_club_id
    AND is_active = true
  LIMIT 1;

  RETURN user_role;
END;
$$;

COMMENT ON FUNCTION get_user_club_role IS 'Get the role of a user in a specific club';

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Drop any existing policies (in case of re-run)
DROP POLICY IF EXISTS "Members can view club members" ON public.club_members;
DROP POLICY IF EXISTS "Members can view own membership" ON public.club_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.club_members;
DROP POLICY IF EXISTS "Membership managers can manage members" ON public.club_members;
DROP POLICY IF EXISTS "Users can request membership" ON public.club_members;

-- Policy: Members can view other members in their clubs
CREATE POLICY "Members can view club members"
  ON public.club_members
  FOR SELECT
  USING (
    -- User is an active member of the same club
    EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = club_members.club_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
    )
  );

-- Policy: Users can always view their own membership
CREATE POLICY "Members can view own membership"
  ON public.club_members
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admin roles can insert/update/delete members
CREATE POLICY "Admins can manage members"
  ON public.club_members
  FOR ALL
  USING (
    -- User has admin access role in this club
    EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = club_members.club_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
        AND has_admin_access(cm.role)
    )
  )
  WITH CHECK (
    -- Same check for insert/update
    EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = club_members.club_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
        AND has_admin_access(cm.role)
    )
  );

-- Policy: Membership managers can manage member records (but not change admin roles)
CREATE POLICY "Membership managers can manage members"
  ON public.club_members
  FOR ALL
  USING (
    -- User is a membership manager in this club
    EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = club_members.club_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
        AND cm.role = 'membership_manager'
    )
    -- Cannot modify admin roles (only admins can do that)
    AND NOT has_admin_access(club_members.role)
  )
  WITH CHECK (
    -- Same restrictions for insert/update
    EXISTS (
      SELECT 1 FROM public.club_members cm
      WHERE cm.club_id = club_members.club_id
        AND cm.user_id = auth.uid()
        AND cm.is_active = true
        AND cm.role = 'membership_manager'
    )
    -- Cannot create admin roles
    AND NOT has_admin_access(club_members.role)
  );

-- Policy: Users can request membership (insert their own pending record)
-- Note: This assumes there's a membership approval workflow
CREATE POLICY "Users can request membership"
  ON public.club_members
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND role = 'guest'
    AND is_active = false  -- Pending approval
  );

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION has_admin_access(club_role) TO authenticated;
GRANT EXECUTE ON FUNCTION is_management_role(club_role) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_club_role(UUID, UUID, club_role) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_any_club_role(UUID, UUID, club_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_club_role(UUID, UUID) TO authenticated;

-- ============================================================================
-- RECREATE DEPENDENT POLICIES WITH ENUM TYPE
-- ============================================================================

-- These policies were dropped earlier and are now recreated using the enum type
-- Note: 'owner' role has been replaced with 'admin' as the standardized role

-- Club Classes Policies
CREATE POLICY "club_classes_insert"
  ON public.club_classes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id::text = club_classes.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = ANY(ARRAY['admin', 'sailing_manager']::club_role[])
    )
  );

CREATE POLICY "club_classes_update"
  ON public.club_classes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id::text = club_classes.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = ANY(ARRAY['admin', 'sailing_manager']::club_role[])
    )
  );

CREATE POLICY "club_classes_delete"
  ON public.club_classes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id::text = club_classes.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = 'admin'::club_role
    )
  );

-- Club Facilities Policies
CREATE POLICY "club_facilities_insert"
  ON public.club_facilities
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id::text = club_facilities.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = ANY(ARRAY['admin', 'sailing_manager']::club_role[])
    )
  );

CREATE POLICY "club_facilities_update"
  ON public.club_facilities
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id::text = club_facilities.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = ANY(ARRAY['admin', 'sailing_manager']::club_role[])
    )
  );

CREATE POLICY "club_facilities_delete"
  ON public.club_facilities
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id::text = club_facilities.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = 'admin'::club_role
    )
  );

-- Club Fleets Policies
CREATE POLICY "club_fleets_insert"
  ON public.club_fleets
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id::text = club_fleets.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = ANY(ARRAY['admin', 'sailing_manager']::club_role[])
    )
  );

CREATE POLICY "club_fleets_update"
  ON public.club_fleets
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id::text = club_fleets.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = ANY(ARRAY['admin', 'sailing_manager']::club_role[])
    )
  );

CREATE POLICY "club_fleets_delete"
  ON public.club_fleets
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id::text = club_fleets.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = 'admin'::club_role
    )
  );

-- Club Race Calendar Policies
CREATE POLICY "club_race_calendar_insert"
  ON public.club_race_calendar
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id::text = club_race_calendar.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = ANY(ARRAY['admin', 'race_officer', 'race_committee']::club_role[])
    )
  );

CREATE POLICY "club_race_calendar_update"
  ON public.club_race_calendar
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id::text = club_race_calendar.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = ANY(ARRAY['admin', 'race_officer', 'race_committee']::club_role[])
    )
  );

CREATE POLICY "club_race_calendar_delete"
  ON public.club_race_calendar
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id::text = club_race_calendar.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = ANY(ARRAY['admin', 'race_officer']::club_role[])
    )
  );

-- Club Services Policies
CREATE POLICY "club_services_insert"
  ON public.club_services
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id::text = club_services.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = ANY(ARRAY['admin', 'sailing_manager']::club_role[])
    )
  );

CREATE POLICY "club_services_update"
  ON public.club_services
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id::text = club_services.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = ANY(ARRAY['admin', 'sailing_manager']::club_role[])
    )
  );

CREATE POLICY "club_services_delete"
  ON public.club_services
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id::text = club_services.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = 'admin'::club_role
    )
  );

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- Verify enum was created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'club_role') THEN
    RAISE EXCEPTION 'club_role enum type was not created';
  END IF;

  RAISE NOTICE 'club_role enum type created successfully';
END $$;

-- Verify column is using enum
DO $$
DECLARE
  col_type TEXT;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_name = 'club_members'
    AND column_name = 'role'
    AND table_schema = 'public';

  IF col_type != 'USER-DEFINED' THEN
    RAISE EXCEPTION 'club_members.role column is not using enum type';
  END IF;

  RAISE NOTICE 'club_members.role column successfully converted to enum';
END $$;

-- Verify RLS policies exist
DO $$
DECLARE
  policy_count INTEGER;
  dependent_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'club_members';

  IF policy_count < 5 THEN
    RAISE WARNING 'Expected at least 5 RLS policies on club_members, found %', policy_count;
  ELSE
    RAISE NOTICE '% RLS policies on club_members created successfully', policy_count;
  END IF;

  -- Verify dependent policies were recreated
  SELECT COUNT(*) INTO dependent_policy_count
  FROM pg_policies
  WHERE tablename IN ('club_classes', 'club_facilities', 'club_fleets', 'club_race_calendar', 'club_services')
    AND policyname LIKE '%insert' OR policyname LIKE '%update' OR policyname LIKE '%delete';

  IF dependent_policy_count < 15 THEN
    RAISE WARNING 'Expected 15 dependent policies, found %', dependent_policy_count;
  ELSE
    RAISE NOTICE '% dependent policies recreated successfully', dependent_policy_count;
  END IF;
END $$;

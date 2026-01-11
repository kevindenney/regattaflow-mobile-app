-- Fix: Practice Sessions RLS Circular Dependency
-- The policies on practice_sessions and practice_session_members reference each other,
-- causing infinite recursion. This fix uses SECURITY DEFINER functions to break the cycle.

-- Step 1: Create helper functions that bypass RLS
CREATE OR REPLACE FUNCTION public.is_practice_session_creator(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM practice_sessions
    WHERE id = p_session_id AND created_by = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_practice_session_member(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM practice_session_members
    WHERE session_id = p_session_id AND user_id = auth.uid()
  );
$$;

-- Step 2: Drop all problematic policies
DROP POLICY IF EXISTS "practice_sessions_member_read" ON practice_sessions;
DROP POLICY IF EXISTS "practice_members_read" ON practice_session_members;
DROP POLICY IF EXISTS "practice_members_creator_delete" ON practice_session_members;

-- Step 3: Recreate policies using the helper functions

-- Practice sessions: Users can read sessions they created OR are members of
CREATE POLICY "practice_sessions_read" ON practice_sessions
  FOR SELECT USING (
    created_by = auth.uid()
    OR public.is_practice_session_member(id)
  );

-- Practice session members: Users can read their own membership OR memberships in sessions they created
CREATE POLICY "practice_members_read" ON practice_session_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_practice_session_creator(session_id)
  );

-- Practice session members: Creators can delete any member from their sessions
CREATE POLICY "practice_members_creator_delete" ON practice_session_members
  FOR DELETE USING (
    public.is_practice_session_creator(session_id)
  );

-- Grant execute on the helper functions to authenticated users
GRANT EXECUTE ON FUNCTION public.is_practice_session_creator(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_practice_session_member(UUID) TO authenticated;

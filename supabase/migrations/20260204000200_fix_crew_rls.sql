-- =============================================================================
-- Fix RLS infinite recursion on crew_thread_members
-- =============================================================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view members of their threads" ON crew_thread_members;
DROP POLICY IF EXISTS "Users can view threads they're a member of" ON crew_threads;

-- Create a security definer function to check thread membership
-- This bypasses RLS when checking membership, preventing infinite recursion
CREATE OR REPLACE FUNCTION is_thread_member(check_thread_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM crew_thread_members
    WHERE thread_id = check_thread_id
    AND user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate crew_threads policy using the security definer function
CREATE POLICY "Users can view threads they're a member of"
  ON crew_threads FOR SELECT
  USING (is_thread_member(id, auth.uid()));

-- Recreate crew_thread_members policy using the security definer function
CREATE POLICY "Users can view members of their threads"
  ON crew_thread_members FOR SELECT
  USING (is_thread_member(thread_id, auth.uid()));

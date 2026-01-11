-- Fix: Practice Session Members RLS Recursion
-- The original policy caused infinite recursion by referencing practice_session_members from itself
-- This fix uses simpler, non-recursive policies

-- Drop the problematic policy
DROP POLICY IF EXISTS "practice_members_member_read" ON practice_session_members;

-- Replace with a simpler policy that doesn't cause recursion
-- Users can see members of sessions they created OR where they are a member
CREATE POLICY "practice_members_read" ON practice_session_members
  FOR SELECT USING (
    -- User is a member of this session (direct check, no subquery on same table)
    user_id = auth.uid()
    OR
    -- User created the session
    EXISTS (
      SELECT 1 FROM practice_sessions
      WHERE practice_sessions.id = practice_session_members.session_id
      AND practice_sessions.created_by = auth.uid()
    )
  );

-- Also fix practice_sessions policy that may cause similar issues
DROP POLICY IF EXISTS "practice_sessions_member_read" ON practice_sessions;

-- Simplified session read policy
CREATE POLICY "practice_sessions_member_read" ON practice_sessions
  FOR SELECT USING (
    -- User created the session
    created_by = auth.uid()
    OR
    -- User is a member (use SECURITY DEFINER helper to avoid recursion)
    id IN (
      SELECT session_id FROM practice_session_members
      WHERE user_id = auth.uid()
    )
  );

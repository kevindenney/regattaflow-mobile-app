-- Simplify Practice Sessions RLS
-- The complex policies with helper functions may be causing issues
-- This migration creates simple, direct policies

-- Drop existing policies on practice_sessions
DROP POLICY IF EXISTS "practice_sessions_read" ON practice_sessions;
DROP POLICY IF EXISTS "practice_sessions_invite_read" ON practice_sessions;

-- Simple policy: creator can always read their sessions
CREATE POLICY "practice_sessions_creator_read" ON practice_sessions
  FOR SELECT USING (created_by = auth.uid());

-- Simple policy: sessions with invite codes are readable by anyone (for joining)
CREATE POLICY "practice_sessions_invite_read" ON practice_sessions
  FOR SELECT USING (invite_code IS NOT NULL);

-- Drop existing policies on practice_session_members
DROP POLICY IF EXISTS "practice_members_read" ON practice_session_members;

-- Simple policy: users can read their own memberships
CREATE POLICY "practice_members_own_read" ON practice_session_members
  FOR SELECT USING (user_id = auth.uid());

-- Simple policy: session creators can read all members of their sessions
CREATE POLICY "practice_members_creator_read" ON practice_session_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM practice_sessions
      WHERE practice_sessions.id = practice_session_members.session_id
      AND practice_sessions.created_by = auth.uid()
    )
  );

-- Drop existing policies on practice_session_focus_areas
DROP POLICY IF EXISTS "focus_areas_read" ON practice_session_focus_areas;

-- Simple policy: creator can read focus areas of their sessions
CREATE POLICY "focus_areas_creator_read" ON practice_session_focus_areas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM practice_sessions
      WHERE practice_sessions.id = practice_session_focus_areas.session_id
      AND practice_sessions.created_by = auth.uid()
    )
  );

-- Drop existing policies on practice_session_drills
DROP POLICY IF EXISTS "session_drills_read" ON practice_session_drills;

-- Simple policy: creator can read drills of their sessions
CREATE POLICY "session_drills_creator_read" ON practice_session_drills
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM practice_sessions
      WHERE practice_sessions.id = practice_session_drills.session_id
      AND practice_sessions.created_by = auth.uid()
    )
  );

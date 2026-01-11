-- Fix infinite recursion in team_race_entry_members RLS policies
-- The original policy queries the same table to check permissions, causing recursion.
-- Solution: Use a SECURITY DEFINER function to bypass RLS for the membership check.

-- =============================================================================
-- HELPER FUNCTION: Check if user is a team member (bypasses RLS)
-- =============================================================================
CREATE OR REPLACE FUNCTION is_team_member(p_team_entry_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_race_entry_members
    WHERE team_entry_id = p_team_entry_id
    AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION is_team_member(UUID, UUID) TO authenticated;

-- =============================================================================
-- DROP OLD POLICIES (they cause recursion)
-- =============================================================================
DROP POLICY IF EXISTS "team_members_member_read" ON team_race_entry_members;
DROP POLICY IF EXISTS "team_members_creator_delete" ON team_race_entry_members;

-- =============================================================================
-- CREATE NEW POLICIES (without recursion)
-- =============================================================================

-- Members can read other members in the same team
-- Uses SECURITY DEFINER function to avoid recursion
CREATE POLICY "team_members_member_read" ON team_race_entry_members
  FOR SELECT USING (
    -- User can read their own membership directly
    user_id = auth.uid()
    -- Or user is a member of the same team (using helper function)
    OR is_team_member(team_entry_id, auth.uid())
    -- Or user is the team creator
    OR EXISTS (
      SELECT 1 FROM team_race_entries
      WHERE team_race_entries.id = team_race_entry_members.team_entry_id
      AND team_race_entries.created_by = auth.uid()
    )
  );

-- Team creator can delete any member (using direct join, no recursion)
CREATE POLICY "team_members_creator_delete" ON team_race_entry_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM team_race_entries
      WHERE team_race_entries.id = team_race_entry_members.team_entry_id
      AND team_race_entries.created_by = auth.uid()
    )
  );

-- =============================================================================
-- ALSO FIX: team_race_checklists policies that reference team_race_entry_members
-- =============================================================================
DROP POLICY IF EXISTS "team_checklists_member_read" ON team_race_checklists;
DROP POLICY IF EXISTS "team_checklists_member_insert" ON team_race_checklists;
DROP POLICY IF EXISTS "team_checklists_member_update" ON team_race_checklists;

-- Members can read checklists
CREATE POLICY "team_checklists_member_read" ON team_race_checklists
  FOR SELECT USING (
    is_team_member(team_entry_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM team_race_entries
      WHERE team_race_entries.id = team_race_checklists.team_entry_id
      AND team_race_entries.created_by = auth.uid()
    )
  );

-- Members can insert checklists
CREATE POLICY "team_checklists_member_insert" ON team_race_checklists
  FOR INSERT WITH CHECK (
    is_team_member(team_entry_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM team_race_entries
      WHERE team_race_entries.id = team_race_checklists.team_entry_id
      AND team_race_entries.created_by = auth.uid()
    )
  );

-- Members can update checklists
CREATE POLICY "team_checklists_member_update" ON team_race_checklists
  FOR UPDATE USING (
    is_team_member(team_entry_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM team_race_entries
      WHERE team_race_entries.id = team_race_checklists.team_entry_id
      AND team_race_entries.created_by = auth.uid()
    )
  );

COMMENT ON FUNCTION is_team_member IS 'Helper function to check team membership without RLS recursion. Uses SECURITY DEFINER to bypass RLS.';

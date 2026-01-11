-- Final fix for team_race_entry_members RLS recursion
-- The is_team_member function still causes recursion because SECURITY DEFINER
-- doesn't bypass RLS by default.
-- Solution: Simplify the policy to avoid ANY self-referential queries.

-- First drop all policies that depend on the function
DROP POLICY IF EXISTS "team_members_member_read" ON team_race_entry_members;
DROP POLICY IF EXISTS "team_checklists_member_read" ON team_race_checklists;
DROP POLICY IF EXISTS "team_checklists_member_insert" ON team_race_checklists;
DROP POLICY IF EXISTS "team_checklists_member_update" ON team_race_checklists;

-- Now drop the problematic function
DROP FUNCTION IF EXISTS is_team_member(UUID, UUID);

-- Drop remaining policies
DROP POLICY IF EXISTS "team_members_member_read" ON team_race_entry_members;
DROP POLICY IF EXISTS "team_members_self_insert" ON team_race_entry_members;
DROP POLICY IF EXISTS "team_members_self_update" ON team_race_entry_members;
DROP POLICY IF EXISTS "team_members_self_delete" ON team_race_entry_members;
DROP POLICY IF EXISTS "team_members_creator_delete" ON team_race_entry_members;

-- =============================================================================
-- NEW SIMPLIFIED POLICIES (no self-referential queries)
-- =============================================================================

-- Users can read their own membership
CREATE POLICY "team_members_read_own" ON team_race_entry_members
  FOR SELECT USING (user_id = auth.uid());

-- Team creators can read all members of their teams
CREATE POLICY "team_members_read_as_creator" ON team_race_entry_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_race_entries
      WHERE team_race_entries.id = team_race_entry_members.team_entry_id
      AND team_race_entries.created_by = auth.uid()
    )
  );

-- Users can insert themselves (joining via invite code)
CREATE POLICY "team_members_insert_self" ON team_race_entry_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own membership
CREATE POLICY "team_members_update_self" ON team_race_entry_members
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own membership (leaving team)
CREATE POLICY "team_members_delete_self" ON team_race_entry_members
  FOR DELETE USING (user_id = auth.uid());

-- Team creator can delete any member
CREATE POLICY "team_members_delete_as_creator" ON team_race_entry_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM team_race_entries
      WHERE team_race_entries.id = team_race_entry_members.team_entry_id
      AND team_race_entries.created_by = auth.uid()
    )
  );

-- =============================================================================
-- FIX team_race_checklists policies (already dropped above)
-- =============================================================================

-- Helper: Check if user is a member via team_race_entries + direct membership
-- This uses a subquery through team_race_entries to avoid recursion
CREATE POLICY "team_checklists_read" ON team_race_checklists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_race_entries te
      LEFT JOIN team_race_entry_members tm ON tm.team_entry_id = te.id AND tm.user_id = auth.uid()
      WHERE te.id = team_race_checklists.team_entry_id
      AND (te.created_by = auth.uid() OR tm.user_id IS NOT NULL)
    )
  );

CREATE POLICY "team_checklists_insert" ON team_race_checklists
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_race_entries te
      LEFT JOIN team_race_entry_members tm ON tm.team_entry_id = te.id AND tm.user_id = auth.uid()
      WHERE te.id = team_race_checklists.team_entry_id
      AND (te.created_by = auth.uid() OR tm.user_id IS NOT NULL)
    )
  );

CREATE POLICY "team_checklists_update" ON team_race_checklists
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_race_entries te
      LEFT JOIN team_race_entry_members tm ON tm.team_entry_id = te.id AND tm.user_id = auth.uid()
      WHERE te.id = team_race_checklists.team_entry_id
      AND (te.created_by = auth.uid() OR tm.user_id IS NOT NULL)
    )
  );

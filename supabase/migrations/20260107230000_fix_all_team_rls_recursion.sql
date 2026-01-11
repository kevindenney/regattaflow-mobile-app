-- Complete RLS fix for all team racing tables
-- The recursion was caused by cross-references between team_race_entries and team_race_entry_members policies
-- Solution: Simplify ALL policies to avoid any cross-table RLS checks

-- =============================================================================
-- DROP ALL EXISTING TEAM POLICIES
-- =============================================================================

-- team_race_entries
DROP POLICY IF EXISTS "team_entries_member_read" ON team_race_entries;
DROP POLICY IF EXISTS "team_entries_invite_read" ON team_race_entries;
DROP POLICY IF EXISTS "team_entries_creator_insert" ON team_race_entries;
DROP POLICY IF EXISTS "team_entries_creator_update" ON team_race_entries;
DROP POLICY IF EXISTS "team_entries_creator_delete" ON team_race_entries;

-- team_race_entry_members
DROP POLICY IF EXISTS "team_members_read_own" ON team_race_entry_members;
DROP POLICY IF EXISTS "team_members_read_as_creator" ON team_race_entry_members;
DROP POLICY IF EXISTS "team_members_insert_self" ON team_race_entry_members;
DROP POLICY IF EXISTS "team_members_update_self" ON team_race_entry_members;
DROP POLICY IF EXISTS "team_members_delete_self" ON team_race_entry_members;
DROP POLICY IF EXISTS "team_members_delete_as_creator" ON team_race_entry_members;

-- team_race_checklists
DROP POLICY IF EXISTS "team_checklists_read" ON team_race_checklists;
DROP POLICY IF EXISTS "team_checklists_insert" ON team_race_checklists;
DROP POLICY IF EXISTS "team_checklists_update" ON team_race_checklists;

-- =============================================================================
-- NEW SIMPLIFIED POLICIES: team_race_entries
-- No references to team_race_entry_members to avoid recursion
-- =============================================================================

-- Creators can read their own entries
CREATE POLICY "entries_read_own" ON team_race_entries
  FOR SELECT USING (created_by = auth.uid());

-- Anyone authenticated can read entries with invite codes (for joining)
CREATE POLICY "entries_read_by_invite" ON team_race_entries
  FOR SELECT USING (invite_code IS NOT NULL);

-- Authenticated users can create entries
CREATE POLICY "entries_insert" ON team_race_entries
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Creators can update their entries
CREATE POLICY "entries_update" ON team_race_entries
  FOR UPDATE USING (created_by = auth.uid());

-- Creators can delete their entries
CREATE POLICY "entries_delete" ON team_race_entries
  FOR DELETE USING (created_by = auth.uid());

-- =============================================================================
-- NEW SIMPLIFIED POLICIES: team_race_entry_members
-- No references to team_race_entries policies to avoid recursion
-- =============================================================================

-- Users can read their own memberships
CREATE POLICY "members_read_own" ON team_race_entry_members
  FOR SELECT USING (user_id = auth.uid());

-- Team creators can read members of their teams
-- This is safe because it only checks team_race_entries.created_by, not any RLS-protected query
CREATE POLICY "members_read_by_creator" ON team_race_entry_members
  FOR SELECT USING (
    team_entry_id IN (
      SELECT id FROM team_race_entries WHERE created_by = auth.uid()
    )
  );

-- Users can insert themselves as members
CREATE POLICY "members_insert" ON team_race_entry_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own membership
CREATE POLICY "members_update" ON team_race_entry_members
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own membership
CREATE POLICY "members_delete_self" ON team_race_entry_members
  FOR DELETE USING (user_id = auth.uid());

-- Team creators can delete any member from their teams
CREATE POLICY "members_delete_by_creator" ON team_race_entry_members
  FOR DELETE USING (
    team_entry_id IN (
      SELECT id FROM team_race_entries WHERE created_by = auth.uid()
    )
  );

-- =============================================================================
-- NEW SIMPLIFIED POLICIES: team_race_checklists
-- =============================================================================

-- Team creators can read checklists for their entries
CREATE POLICY "checklists_read_by_creator" ON team_race_checklists
  FOR SELECT USING (
    team_entry_id IN (
      SELECT id FROM team_race_entries WHERE created_by = auth.uid()
    )
  );

-- Team members can read checklists they belong to
CREATE POLICY "checklists_read_by_member" ON team_race_checklists
  FOR SELECT USING (
    team_entry_id IN (
      SELECT team_entry_id FROM team_race_entry_members WHERE user_id = auth.uid()
    )
  );

-- Team creators can insert checklists
CREATE POLICY "checklists_insert_by_creator" ON team_race_checklists
  FOR INSERT WITH CHECK (
    team_entry_id IN (
      SELECT id FROM team_race_entries WHERE created_by = auth.uid()
    )
  );

-- Team members can insert checklists
CREATE POLICY "checklists_insert_by_member" ON team_race_checklists
  FOR INSERT WITH CHECK (
    team_entry_id IN (
      SELECT team_entry_id FROM team_race_entry_members WHERE user_id = auth.uid()
    )
  );

-- Team creators can update checklists
CREATE POLICY "checklists_update_by_creator" ON team_race_checklists
  FOR UPDATE USING (
    team_entry_id IN (
      SELECT id FROM team_race_entries WHERE created_by = auth.uid()
    )
  );

-- Team members can update checklists
CREATE POLICY "checklists_update_by_member" ON team_race_checklists
  FOR UPDATE USING (
    team_entry_id IN (
      SELECT team_entry_id FROM team_race_entry_members WHERE user_id = auth.uid()
    )
  );

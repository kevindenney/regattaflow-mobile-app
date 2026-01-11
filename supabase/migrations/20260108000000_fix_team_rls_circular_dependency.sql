-- Fix circular dependency between team_race_entries and team_race_entry_members policies
-- The entries_read_by_member policy queries team_race_entry_members
-- The members_read_by_creator policy queries team_race_entries
-- When combined, they create infinite recursion

-- Solution: Remove the cross-table references that cause the cycle
-- Use SECURITY DEFINER functions to bypass RLS for membership checks

-- Step 1: Drop the policies causing recursion
DROP POLICY IF EXISTS "entries_read_by_member" ON team_race_entries;
DROP POLICY IF EXISTS "members_read_by_creator" ON team_race_entry_members;

-- Step 2: Create a SECURITY DEFINER function to safely check team entry ownership
-- This bypasses RLS and prevents recursion
CREATE OR REPLACE FUNCTION get_user_team_entry_ids(p_user_id UUID)
RETURNS SETOF UUID AS $$
  SELECT team_entry_id FROM team_race_entry_members WHERE user_id = p_user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_user_team_entry_ids(UUID) TO authenticated;

-- Step 3: Recreate entries_read_by_member using the safe function
CREATE POLICY "entries_read_by_member" ON team_race_entries
  FOR SELECT USING (
    id IN (SELECT get_user_team_entry_ids(auth.uid()))
  );

-- Step 4: Create function to check if user is team creator
CREATE OR REPLACE FUNCTION is_team_creator(p_team_entry_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_race_entries 
    WHERE id = p_team_entry_id 
    AND created_by = p_user_id
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION is_team_creator(UUID, UUID) TO authenticated;

-- Step 5: Recreate members_read_by_creator using the safe function
CREATE POLICY "members_read_by_creator" ON team_race_entry_members
  FOR SELECT USING (
    is_team_creator(team_entry_id, auth.uid())
  );

COMMENT ON FUNCTION get_user_team_entry_ids IS 'Returns team entry IDs for a user, bypassing RLS to prevent recursion';
COMMENT ON FUNCTION is_team_creator IS 'Checks if user is team creator, bypassing RLS to prevent recursion';

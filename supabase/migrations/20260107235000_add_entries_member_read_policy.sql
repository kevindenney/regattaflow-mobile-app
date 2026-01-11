-- Add missing policy: team members can read entries they belong to
-- This allows users who have joined a team to see the team_race_entries record
CREATE POLICY "entries_read_by_member" ON team_race_entries
  FOR SELECT USING (
    id IN (
      SELECT team_entry_id FROM team_race_entry_members WHERE user_id = auth.uid()
    )
  );

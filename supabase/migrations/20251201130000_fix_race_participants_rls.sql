-- Fix RLS policies for race_participants to allow viewing public and fleet competitors

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "race_participants_public_read" ON race_participants;
DROP POLICY IF EXISTS "race_participants_fleet_read" ON race_participants;
DROP POLICY IF EXISTS "race_participants_select" ON race_participants;

-- Allow anyone to view public participants
CREATE POLICY "race_participants_public_read"
  ON race_participants
  FOR SELECT
  USING (visibility = 'public');

-- Allow authenticated users to view fleet-only participants if they're in the same fleet
CREATE POLICY "race_participants_fleet_read"
  ON race_participants
  FOR SELECT
  USING (
    visibility = 'fleet'
    AND EXISTS (
      SELECT 1 FROM fleet_members
      WHERE fleet_members.fleet_id = race_participants.fleet_id
      AND fleet_members.user_id = auth.uid()
      AND fleet_members.status = 'active'
    )
  );

-- Allow users to view their own registrations regardless of visibility
CREATE POLICY "race_participants_own_read"
  ON race_participants
  FOR SELECT
  USING (user_id = auth.uid());

-- Allow authenticated users to insert their own registrations
CREATE POLICY "race_participants_insert"
  ON race_participants
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Allow users to update their own registrations
CREATE POLICY "race_participants_update"
  ON race_participants
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own registrations
CREATE POLICY "race_participants_delete"
  ON race_participants
  FOR DELETE
  USING (user_id = auth.uid());

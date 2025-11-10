-- Allow authenticated sailors to view other sailors' race timer sessions
-- This enables the Fleet Insights feature to show other fleet members' race data

-- Drop existing restrictive policy if it exists
DROP POLICY IF EXISTS "Users can view their own race timer sessions" ON race_timer_sessions;

-- Create policy allowing sailors to view all race timer sessions
-- This is safe because race data is meant to be shared within the fleet/regatta
CREATE POLICY "Sailors can view all race timer sessions"
ON race_timer_sessions
FOR SELECT
TO authenticated
USING (true);

-- Sailors can only insert/update/delete their own sessions
CREATE POLICY "Sailors can insert their own race timer sessions"
ON race_timer_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sailor_id);

CREATE POLICY "Sailors can update their own race timer sessions"
ON race_timer_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = sailor_id)
WITH CHECK (auth.uid() = sailor_id);

CREATE POLICY "Sailors can delete their own race timer sessions"
ON race_timer_sessions
FOR DELETE
TO authenticated
USING (auth.uid() = sailor_id);

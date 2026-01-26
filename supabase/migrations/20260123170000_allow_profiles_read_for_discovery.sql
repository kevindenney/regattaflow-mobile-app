-- Migration: Allow authenticated users to read all profiles for crew discovery
-- This enables the "Discover" tab in the Crew Finder to show other RegattaFlow users

-- Add a policy to allow authenticated users to view all profiles
CREATE POLICY "Users can view all profiles for discovery"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Note: The existing "Users can view own profile" policy with ALL command
-- handles UPDATE/DELETE/INSERT restrictions appropriately.
-- This new SELECT policy is more permissive but only for reading.

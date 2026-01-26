-- Migration: Allow authenticated users to read all sailor_profiles for crew discovery
-- This enables the "Discover" tab in the Crew Finder to show other users' sailing experience

-- Add a policy to allow authenticated users to view all sailor_profiles
CREATE POLICY "Users can view all sailor profiles for discovery"
  ON sailor_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Note: The existing "Users can read their own sailor profile" policy with SELECT
-- is more restrictive but both policies apply. The new policy allows broader reads
-- while existing INSERT/UPDATE/DELETE restrictions remain in place.

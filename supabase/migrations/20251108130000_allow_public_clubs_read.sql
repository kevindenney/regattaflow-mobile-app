-- Allow public read access to clubs table (for club directory discovery)
-- This enables the "Discover Yacht Clubs" feature to work for all users

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can read clubs" ON clubs;

-- Create policy to allow anyone to read clubs
CREATE POLICY "Public can read clubs" ON clubs
  FOR SELECT
  USING (true);

-- Note: INSERT, UPDATE, DELETE still require authentication and proper permissions

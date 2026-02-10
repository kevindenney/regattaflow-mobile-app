-- Ensure authenticated users can read all rows from the users table for discovery.
-- The 'profiles' table has this policy, but the 'users' table may only allow
-- reading own row (auth.uid() = id). This blocks follow suggestions for
-- Apple/Google OAuth users who only have rows in 'users', not 'profiles'.

-- Drop the old restrictive own-row-only policy if it exists
DROP POLICY IF EXISTS "Users can read own profile" ON users;

-- Ensure the broad discovery policy exists
DROP POLICY IF EXISTS "users_can_see_public_profile_info" ON users;
CREATE POLICY "users_can_see_public_profile_info"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

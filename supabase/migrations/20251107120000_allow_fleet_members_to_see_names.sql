-- Allow users to see basic public info (name, avatar) of other fleet members
-- This enables Fleet Insights to display sailor names properly

-- Drop the restrictive policy that only allows users to see their own row
DROP POLICY IF EXISTS "users_select" ON users;

-- Create a new policy that allows users to see basic public info of all authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'users_can_see_public_profile_info'
  ) THEN
    CREATE POLICY "users_can_see_public_profile_info"
      ON users
      FOR SELECT
      TO authenticated
      USING (true);  -- Allow all authenticated users to see basic user info

    COMMENT ON POLICY "users_can_see_public_profile_info" ON users IS
      'Allows authenticated users to see public profile information (name, avatar) of other users. This is needed for fleet insights, race results, and social features. Email and sensitive data should be handled separately with appropriate RLS policies.';
  END IF;
END $$;

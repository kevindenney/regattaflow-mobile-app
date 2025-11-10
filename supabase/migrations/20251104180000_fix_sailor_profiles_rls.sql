-- Fix RLS policies for sailor_profiles table to resolve 406 errors

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own sailor profile" ON sailor_profiles;
DROP POLICY IF EXISTS "Users can insert their own sailor profile" ON sailor_profiles;
DROP POLICY IF EXISTS "Users can update their own sailor profile" ON sailor_profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON sailor_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON sailor_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON sailor_profiles;

-- Ensure RLS is enabled
ALTER TABLE sailor_profiles ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies (using DO block for idempotency)

DO $$
BEGIN
  -- Allow users to read their own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'sailor_profiles'
    AND policyname = 'Users can read their own sailor profile'
  ) THEN
    CREATE POLICY "Users can read their own sailor profile"
      ON sailor_profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Allow users to insert their own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'sailor_profiles'
    AND policyname = 'Users can insert their own sailor profile'
  ) THEN
    CREATE POLICY "Users can insert their own sailor profile"
      ON sailor_profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Allow users to update their own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'sailor_profiles'
    AND policyname = 'Users can update their own sailor profile'
  ) THEN
    CREATE POLICY "Users can update their own sailor profile"
      ON sailor_profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Allow users to delete their own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'sailor_profiles'
    AND policyname = 'Users can delete their own sailor profile'
  ) THEN
    CREATE POLICY "Users can delete their own sailor profile"
      ON sailor_profiles
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON sailor_profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_sailor_profiles_user_id ON sailor_profiles(user_id);

-- Add comment explaining the policies
COMMENT ON TABLE sailor_profiles IS 'Sailor profile information with RLS policies allowing users to manage their own profiles';

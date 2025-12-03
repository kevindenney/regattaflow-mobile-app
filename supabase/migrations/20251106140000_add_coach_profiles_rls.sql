-- Enable RLS on coach_profiles if not already enabled
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Allow anyone to view active, verified coach profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'coach_profiles'
    AND policyname = 'Anyone can view active verified coaches'
  ) THEN
    CREATE POLICY "Anyone can view active verified coaches"
    ON coach_profiles
    FOR SELECT
    TO authenticated
    USING (is_active = true AND is_verified = true);

    COMMENT ON POLICY "Anyone can view active verified coaches" ON coach_profiles IS
    'Allow all authenticated users to view active, verified coach profiles for booking and sharing';
  END IF;

  -- Allow coaches to view their own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'coach_profiles'
    AND policyname = 'Coaches can view their own profile'
  ) THEN
    CREATE POLICY "Coaches can view their own profile"
    ON coach_profiles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
  END IF;

  -- Allow coaches to update their own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'coach_profiles'
    AND policyname = 'Coaches can update their own profile'
  ) THEN
    CREATE POLICY "Coaches can update their own profile"
    ON coach_profiles
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

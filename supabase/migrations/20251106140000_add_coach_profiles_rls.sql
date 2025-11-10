-- Enable RLS on coach_profiles if not already enabled
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view active, verified coach profiles
CREATE POLICY "Anyone can view active verified coaches"
ON coach_profiles
FOR SELECT
TO authenticated
USING (is_active = true AND is_verified = true);

-- Allow coaches to view their own profile
CREATE POLICY "Coaches can view their own profile"
ON coach_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow coaches to update their own profile
CREATE POLICY "Coaches can update their own profile"
ON coach_profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

COMMENT ON POLICY "Anyone can view active verified coaches" ON coach_profiles IS
'Allow all authenticated users to view active, verified coach profiles for booking and sharing';

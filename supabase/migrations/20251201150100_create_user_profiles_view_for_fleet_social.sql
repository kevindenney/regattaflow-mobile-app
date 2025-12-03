-- Create a view for user profiles that fleet social can join with
-- This solves the PostgREST schema cache issue with auth.users

-- First, check if we have raw_user_meta_data with name
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT
  id,
  COALESCE(
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'name',
    email
  ) AS full_name,
  raw_user_meta_data->>'avatar_url' AS avatar_url,
  email,
  created_at
FROM auth.users;

-- Grant access to authenticated users
GRANT SELECT ON public.user_profiles TO authenticated, anon;

-- Enable RLS (though this is a view of auth.users which is already protected)
ALTER VIEW public.user_profiles SET (security_invoker = true);

COMMENT ON VIEW public.user_profiles IS 'User profile view for fleet social features - exposes safe user data from auth.users';

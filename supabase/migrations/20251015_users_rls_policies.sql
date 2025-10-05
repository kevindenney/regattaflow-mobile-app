-- ============================================================================
-- USERS TABLE RLS POLICIES
-- ============================================================================
-- Enable Row Level Security on the public.users table to ensure users can only
-- access their own data, with proper read/update permissions.

-- Enable RLS on the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Policy: Users can read their own row
DROP POLICY IF EXISTS "Users read own row" ON public.users;
CREATE POLICY "Users read own row"
ON public.users FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can update their own row
DROP POLICY IF EXISTS "Users update own row" ON public.users;
CREATE POLICY "Users update own row"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- Optional: Prevent client-side inserts (if you prefer signup to be handled via service role)
-- Uncomment the following if you want to disable direct client inserts
-- DROP POLICY IF EXISTS "No client inserts" ON public.users;
-- CREATE POLICY "No client inserts"
-- ON public.users FOR INSERT
-- WITH CHECK (false);

-- ============================================================================
-- CONVENIENCE VIEW (Optional)
-- ============================================================================
-- Create a convenient view for users to easily access their own data

DROP VIEW IF EXISTS public.me CASCADE;
CREATE OR REPLACE VIEW public.me AS
SELECT
  id,
  email,
  user_type,
  created_at,
  updated_at,
  onboarding_step,
  onboarding_data
FROM public.users
WHERE id = auth.uid();

-- Grant appropriate permissions on the view
GRANT SELECT ON public.me TO anon;
GRANT SELECT ON public.me TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW public.me IS 'Convenience view for users to access their own profile data';
-- =====================================================
-- Fix club_members RLS policies
-- Allow users to see their own club memberships
-- =====================================================

-- Enable RLS on club_members if not already enabled
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own club memberships" ON public.club_members;
DROP POLICY IF EXISTS "Users can insert own club memberships" ON public.club_members;
DROP POLICY IF EXISTS "Users can update own club memberships" ON public.club_members;

-- Allow users to view their own memberships
CREATE POLICY "Users can view own club memberships"
    ON public.club_members
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert their own memberships
CREATE POLICY "Users can insert own club memberships"
    ON public.club_members
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own memberships
CREATE POLICY "Users can update own club memberships"
    ON public.club_members
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.club_members TO authenticated;
GRANT SELECT ON public.club_members TO anon;

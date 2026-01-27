-- Fix infinite recursion in race_collaborators RLS policies
-- The issue: collaborators_view_each_other policy queries race_collaborators table,
-- which triggers the same policy check, causing infinite recursion.

-- Solution: Create a security definer function that bypasses RLS to check collaborations

-- Step 1: Create helper function to get regatta IDs where user is an accepted collaborator
CREATE OR REPLACE FUNCTION get_user_collaborated_regatta_ids(p_user_id UUID)
RETURNS SETOF UUID AS $$
BEGIN
  -- This runs with SECURITY DEFINER to bypass RLS
  RETURN QUERY
  SELECT rc.regatta_id
  FROM race_collaborators rc
  WHERE rc.user_id = p_user_id
    AND rc.status = 'accepted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 2: Drop the problematic policy
DROP POLICY IF EXISTS collaborators_view_each_other ON race_collaborators;

-- Step 3: Recreate the policy using the helper function
CREATE POLICY collaborators_view_each_other ON race_collaborators
  FOR SELECT
  USING (
    regatta_id IN (SELECT get_user_collaborated_regatta_ids(auth.uid()))
  );

-- Also add policy for users to see pending invites directed at them
-- (so they can see races they've been invited to)
DROP POLICY IF EXISTS users_view_own_pending_invites ON race_collaborators;

CREATE POLICY users_view_own_pending_invites ON race_collaborators
  FOR SELECT
  USING (
    user_id = auth.uid() AND status = 'pending'
  );

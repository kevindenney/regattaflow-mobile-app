-- Fix fleet_members RLS policy to allow users to view their own memberships
-- This fixes the circular dependency where users couldn't see their own fleet memberships

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Members can view fleet roster" ON fleet_members;

-- Create two new policies:
-- 1. Users can always view their own memberships (regardless of fleet)
CREATE POLICY "Users can view own memberships" ON fleet_members
  FOR SELECT USING (user_id = auth.uid());

-- 2. Active members can view other members in their fleets
CREATE POLICY "Members can view fleet roster" ON fleet_members
  FOR SELECT USING (
    user_id = auth.uid() OR  -- Can see own memberships
    EXISTS (
      SELECT 1 FROM fleet_members fm
      WHERE fm.fleet_id = fleet_members.fleet_id
        AND fm.user_id = auth.uid()
        AND fm.status = 'active'
    )
  );

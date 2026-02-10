-- =============================================================================
-- Relax activity_comments INSERT policy
-- Allow any authenticated user to comment (visibility still controlled by SELECT policy)
-- =============================================================================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can comment on followed users' activity" ON activity_comments;

-- Create a simpler policy: any authenticated user can comment
CREATE POLICY "Authenticated users can comment on activity"
  ON activity_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

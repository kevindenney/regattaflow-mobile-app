-- Fix race_messages INSERT policy
--
-- The existing INSERT policy (collaborators_post_messages) requires the user
-- to be the race owner (regattas.created_by) OR an accepted collaborator.
-- This blocks messages for users who can view the race but aren't explicitly
-- in race_collaborators with status='accepted'.
--
-- New policy: any authenticated user can post messages to races they can view.
-- The FK constraint (regatta_id REFERENCES regattas) already prevents posting
-- to non-existent races. SELECT policies control who can read messages.

-- Drop the overly restrictive INSERT policy
DROP POLICY IF EXISTS "collaborators_post_messages" ON race_messages;

-- Replace with a simpler policy: authenticated users can post to any race
-- as long as user_id matches their auth identity
CREATE POLICY "authenticated_users_post_messages" ON race_messages
FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

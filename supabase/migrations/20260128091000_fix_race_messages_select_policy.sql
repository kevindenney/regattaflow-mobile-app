-- Fix race_messages SELECT policy
--
-- The existing SELECT policies only allow reading by race owner or accepted
-- collaborators. Since we now allow any authenticated user to post messages,
-- they also need to be able to read them.
--
-- Add a policy so any authenticated user can read messages for races they
-- can reference (FK constraint ensures valid races).

-- Drop the restrictive collaborator-only SELECT policy
DROP POLICY IF EXISTS "collaborators_read_messages" ON race_messages;

-- Allow any authenticated user to read messages
CREATE POLICY "authenticated_users_read_messages" ON race_messages
FOR SELECT USING (
  auth.uid() IS NOT NULL
);

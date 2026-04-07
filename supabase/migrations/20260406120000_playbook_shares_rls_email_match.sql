-- Allow invitees to read shares matched by their email (for pending invites
-- where shared_with_user_id hasn't been set yet).
-- Uses auth.jwt() instead of auth.users because the authenticated role
-- does not have SELECT on auth.users.
CREATE POLICY "Invitees can read shares by email"
  ON playbook_shares FOR SELECT
  USING (
    shared_with_email = (auth.jwt() ->> 'email')
  );

-- Also allow invitees to UPDATE their own share row (to accept the invite)
-- when matched by email.
CREATE POLICY "Invitees can accept shares by email"
  ON playbook_shares FOR UPDATE
  USING (
    shared_with_email = (auth.jwt() ->> 'email')
  )
  WITH CHECK (
    shared_with_email = (auth.jwt() ->> 'email')
  );

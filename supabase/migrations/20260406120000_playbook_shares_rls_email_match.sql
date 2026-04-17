-- Allow invitees to read shares matched by their email (for pending invites
-- where shared_with_user_id hasn't been set yet).
-- Uses auth.jwt() instead of auth.users because the authenticated role
-- does not have SELECT on auth.users.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Invitees can read shares by email' AND tablename = 'playbook_shares'
  ) THEN
    CREATE POLICY "Invitees can read shares by email"
      ON playbook_shares FOR SELECT
      USING (
        shared_with_email = (auth.jwt() ->> 'email')
      );
  END IF;
END $$;

-- Also allow invitees to UPDATE their own share row (to accept the invite)
-- when matched by email.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Invitees can accept shares by email' AND tablename = 'playbook_shares'
  ) THEN
    CREATE POLICY "Invitees can accept shares by email"
      ON playbook_shares FOR UPDATE
      USING (
        shared_with_email = (auth.jwt() ->> 'email')
      )
      WITH CHECK (
        shared_with_email = (auth.jwt() ->> 'email')
      );
  END IF;
END $$;

-- Replace the shared-read policy on playbooks to also match by email
-- (for pending invites where shared_with_user_id is still null).
-- Also allow pending invites to see the playbook name in SharedWithMeCard.
DROP POLICY IF EXISTS "Shared viewers can read playbook" ON playbooks;

CREATE POLICY "Shared viewers can read playbook"
  ON playbooks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playbook_shares ps
      WHERE ps.playbook_id = playbooks.id
        AND ps.invite_status IN ('pending', 'accepted')
        AND (
          ps.shared_with_user_id = auth.uid()
          OR ps.shared_with_email = (auth.jwt() ->> 'email')
        )
    )
  );

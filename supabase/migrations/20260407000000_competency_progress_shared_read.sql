-- Allow playbook share viewers to read competency progress for playbook owners.
-- This enables the instructor dashboard to show competency coverage per student.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'playbook_share_viewer_read_progress' AND tablename = 'betterat_competency_progress'
  ) THEN
    CREATE POLICY "playbook_share_viewer_read_progress"
      ON betterat_competency_progress FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM playbook_shares ps
          JOIN playbooks p ON p.id = ps.playbook_id
          WHERE p.user_id = betterat_competency_progress.user_id
            AND ps.invite_status IN ('pending', 'accepted')
            AND (
              ps.shared_with_user_id = auth.uid()
              OR ps.shared_with_email = (auth.jwt() ->> 'email')
            )
        )
      );
  END IF;
END $$;

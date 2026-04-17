-- Allow collaborators (not just owners) to read/write step_playbook_links
-- Fix: the original policy only checked ts.user_id = auth.uid(), which blocked
-- collaborators from linking Playbook concepts to shared steps.

DROP POLICY IF EXISTS "Access step playbook links via parent step" ON step_playbook_links;

CREATE POLICY "Access step playbook links via parent step"
  ON step_playbook_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM timeline_steps ts
      WHERE ts.id = step_playbook_links.step_id
        AND (
          ts.user_id = auth.uid()
          OR (auth.uid())::text = ANY(ts.collaborator_user_ids)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM timeline_steps ts
      WHERE ts.id = step_playbook_links.step_id
        AND (
          ts.user_id = auth.uid()
          OR (auth.uid())::text = ANY(ts.collaborator_user_ids)
        )
    )
  );

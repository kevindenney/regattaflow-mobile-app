-- Allow blueprint authors to UPDATE adopted student steps (for saving instructor assessment to metadata).
-- Uses the existing SECURITY DEFINER helper: get_blueprint_author_adopted_step_ids()

CREATE POLICY "Blueprint authors can update adopted step metadata"
  ON timeline_steps
  FOR UPDATE
  USING (
    id IN (SELECT get_blueprint_author_adopted_step_ids(auth.uid()))
  )
  WITH CHECK (
    id IN (SELECT get_blueprint_author_adopted_step_ids(auth.uid()))
  );

-- Blueprint authors can view and comment on adopted student steps.
-- Uses the existing SECURITY DEFINER helper: get_blueprint_author_adopted_step_ids()

-- SELECT: blueprint authors can view comments on adopted steps
CREATE POLICY "Blueprint authors can view comments on adopted steps"
  ON step_comments FOR SELECT
  USING (step_id IN (SELECT get_blueprint_author_adopted_step_ids(auth.uid())));

-- INSERT: blueprint authors can comment on adopted steps
CREATE POLICY "Blueprint authors can comment on adopted steps"
  ON step_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND step_id IN (SELECT get_blueprint_author_adopted_step_ids(auth.uid()))
  );

-- Creator mentoring: allow blueprint authors to update instructor metadata
-- on adopted step copies (for review status, notes, suggested next).
-- The existing SECURITY DEFINER function get_blueprint_author_adopted_step_ids()
-- already scopes access to only steps adopted from the author's blueprints.

DO $$ BEGIN
  CREATE POLICY "Blueprint authors can update adopted step metadata"
    ON timeline_steps
    FOR UPDATE
    USING (id IN (SELECT get_blueprint_author_adopted_step_ids(auth.uid())))
    WITH CHECK (id IN (SELECT get_blueprint_author_adopted_step_ids(auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

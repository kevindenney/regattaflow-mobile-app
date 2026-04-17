-- Server-side cleanup when a blueprint-adopted timeline step is deleted.
--
-- Before this trigger, the client's deleteStep() ran 4 sequential round-trips:
--   1. SELECT source_blueprint_id/source_id/user_id from timeline_steps
--   2. DELETE FROM timeline_steps
--   3. SELECT subscription id from blueprint_subscriptions
--   4. DELETE FROM blueprint_step_actions
--
-- This collapses steps 1, 3, 4 into a single AFTER DELETE trigger so the
-- client only needs to issue the one DELETE. Removing the action row causes
-- the blueprint step to re-surface in the FOR YOU feed, matching prior
-- client behavior exactly.
--
-- Runs SECURITY DEFINER because a subscriber's RLS does not permit deletes
-- from blueprint_step_actions (only "acted-on" inserts are granted); the
-- function is the trusted path that knows the OLD row really was the
-- subscriber's own adopted step.

CREATE OR REPLACE FUNCTION cleanup_blueprint_step_action_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act when the deleted row was adopted from a blueprint
  IF OLD.source_blueprint_id IS NULL OR OLD.source_id IS NULL THEN
    RETURN OLD;
  END IF;

  DELETE FROM blueprint_step_actions
   WHERE source_step_id = OLD.source_id
     AND subscription_id IN (
       SELECT id
         FROM blueprint_subscriptions
        WHERE blueprint_id = OLD.source_blueprint_id
          AND subscriber_id = OLD.user_id
     );

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS timeline_steps_cleanup_blueprint_action ON timeline_steps;

CREATE TRIGGER timeline_steps_cleanup_blueprint_action
AFTER DELETE ON timeline_steps
FOR EACH ROW
EXECUTE FUNCTION cleanup_blueprint_step_action_on_delete();

COMMENT ON FUNCTION cleanup_blueprint_step_action_on_delete() IS
  'AFTER DELETE trigger on timeline_steps. When a blueprint-adopted step is deleted, removes the corresponding blueprint_step_actions row so the source step re-surfaces in the subscriber''s FOR YOU feed.';

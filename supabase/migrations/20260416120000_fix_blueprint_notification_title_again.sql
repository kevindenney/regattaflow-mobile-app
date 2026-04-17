-- Fix: notify_blueprint_subscribers regression.
--
-- Migration 20260324120000 fixed the original trigger to populate the NOT NULL
-- `title` column on social_notifications. Migration 20260413150000
-- (blueprint_interest_migration) later replaced the function to use the
-- curated blueprint_steps join, but inadvertently dropped the title/body/
-- actor_id columns, bringing the NOT NULL violation back. Any INSERT into
-- timeline_steps by a user who owns a published blueprint would fail with:
--   null value in column "title" of relation "social_notifications"
--   violates not-null constraint (SQLSTATE 23502)
--
-- This migration re-applies the 20260324120000 fix on top of the curated
-- blueprint_steps join introduced in 20260413150000.
CREATE OR REPLACE FUNCTION notify_blueprint_subscribers()
RETURNS trigger AS $$
BEGIN
  IF NEW.visibility != 'private' THEN
    INSERT INTO social_notifications (user_id, type, title, body, actor_id, data, created_at)
    SELECT
      bs.subscriber_id,
      'blueprint_new_step',
      'New step in ' || tb.title,
      COALESCE(NEW.title, 'Untitled step'),
      NEW.user_id,
      jsonb_build_object(
        'step_id', NEW.id,
        'step_title', NEW.title,
        'blueprint_id', tb.id,
        'blueprint_title', tb.title,
        'author_id', NEW.user_id
      ),
      now()
    FROM timeline_blueprints tb
    JOIN blueprint_subscriptions bs ON bs.blueprint_id = tb.id
    JOIN blueprint_steps bst ON bst.blueprint_id = tb.id AND bst.step_id = NEW.id
    WHERE tb.user_id = NEW.user_id
      AND tb.is_published = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

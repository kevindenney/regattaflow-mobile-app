-- Fix: notify_blueprint_subscribers trigger was inserting into social_notifications
-- without providing the required `title` column, causing a NOT NULL constraint violation
-- whenever a user with a published blueprint created a new step.

CREATE OR REPLACE FUNCTION notify_blueprint_subscribers()
RETURNS trigger AS $$
BEGIN
  -- Only notify for non-private steps
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
    WHERE tb.user_id = NEW.user_id
      AND tb.interest_id = NEW.interest_id
      AND tb.is_published = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

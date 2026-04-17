-- Support moving a blueprint to a different interest.
-- Adds an audit trail column and fixes the notification trigger to use
-- curated blueprint_steps instead of interest matching.

-- 1. Audit trail: track where a blueprint was moved from
ALTER TABLE timeline_blueprints
  ADD COLUMN IF NOT EXISTS migrated_from_interest_id UUID;

-- 2. Fix notification trigger: only notify for steps explicitly curated into a blueprint
-- Previously matched on interest_id which breaks after migration and
-- also notified for non-curated steps.
CREATE OR REPLACE FUNCTION notify_blueprint_subscribers()
RETURNS trigger AS $$
BEGIN
  IF NEW.visibility != 'private' THEN
    INSERT INTO social_notifications (user_id, type, data, created_at)
    SELECT bs.subscriber_id, 'blueprint_new_step',
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

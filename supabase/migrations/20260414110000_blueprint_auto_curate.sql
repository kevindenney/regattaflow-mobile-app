-- Auto-curate: when enabled, new non-private steps by the blueprint author
-- for the same interest are automatically added to blueprint_steps.

ALTER TABLE timeline_blueprints
  ADD COLUMN IF NOT EXISTS auto_curate BOOLEAN NOT NULL DEFAULT false;

-- Trigger function: on new timeline_step INSERT, if the author has a blueprint
-- for that interest with auto_curate=true, add the step to blueprint_steps.
CREATE OR REPLACE FUNCTION auto_curate_blueprint_step()
RETURNS trigger AS $$
DECLARE
  bp RECORD;
  max_sort INT;
BEGIN
  -- Only auto-curate non-private steps
  IF NEW.visibility = 'private' THEN
    RETURN NEW;
  END IF;

  -- Find any auto-curate blueprints owned by this user for this interest
  FOR bp IN
    SELECT id FROM timeline_blueprints
    WHERE user_id = NEW.user_id
      AND interest_id = NEW.interest_id
      AND auto_curate = true
      AND is_published = true
  LOOP
    -- Get current max sort_order
    SELECT COALESCE(MAX(sort_order), 0) INTO max_sort
    FROM blueprint_steps WHERE blueprint_id = bp.id;

    -- Insert into curated steps (ignore if already exists)
    INSERT INTO blueprint_steps (blueprint_id, step_id, sort_order)
    VALUES (bp.id, NEW.id, max_sort + 1)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to allow re-running
DROP TRIGGER IF EXISTS trg_auto_curate_blueprint_step ON timeline_steps;

CREATE TRIGGER trg_auto_curate_blueprint_step
  AFTER INSERT ON timeline_steps
  FOR EACH ROW
  EXECUTE FUNCTION auto_curate_blueprint_step();

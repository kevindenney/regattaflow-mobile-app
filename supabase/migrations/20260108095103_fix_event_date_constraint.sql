-- Fix event_date NOT NULL constraint
-- Since start_time is now a full timestamp, event_date can be derived from it
-- We'll add a trigger to auto-populate event_date from start_time

-- Option 1: Make event_date nullable (simplest fix)
ALTER TABLE race_events ALTER COLUMN event_date DROP NOT NULL;

-- Option 2: Add a trigger to auto-populate event_date from start_time
CREATE OR REPLACE FUNCTION set_event_date_from_start_time()
RETURNS TRIGGER AS $$
BEGIN
  -- If event_date is not set but start_time is, derive it
  IF NEW.event_date IS NULL AND NEW.start_time IS NOT NULL THEN
    NEW.event_date := DATE(NEW.start_time);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS trigger_set_event_date ON race_events;

-- Create the trigger
CREATE TRIGGER trigger_set_event_date
  BEFORE INSERT OR UPDATE ON race_events
  FOR EACH ROW
  EXECUTE FUNCTION set_event_date_from_start_time();

COMMENT ON COLUMN race_events.event_date IS 'Race date - auto-populated from start_time if not provided';

-- Fix start_time column type
-- The code sends ISO datetime strings but the column was type 'time'
-- Change to timestamptz to accept full datetime values

-- First, we need to handle the conversion carefully
-- The existing data has time values like '14:00:00'
-- We'll convert by combining with event_date if available

-- Step 1: Add a new column with the correct type
ALTER TABLE race_events
  ADD COLUMN IF NOT EXISTS start_time_new TIMESTAMPTZ;

-- Step 2: Migrate existing data by combining event_date + start_time
UPDATE race_events
SET start_time_new = (event_date + start_time)::timestamptz
WHERE start_time IS NOT NULL AND event_date IS NOT NULL;

-- For rows with time but no date, use current date
UPDATE race_events
SET start_time_new = (CURRENT_DATE + start_time)::timestamptz
WHERE start_time IS NOT NULL AND event_date IS NULL AND start_time_new IS NULL;

-- Step 3: Drop the old column and rename the new one
ALTER TABLE race_events DROP COLUMN IF EXISTS start_time;
ALTER TABLE race_events RENAME COLUMN start_time_new TO start_time;

-- Also add end_time if it doesn't exist (for race duration tracking)
ALTER TABLE race_events
  ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;

COMMENT ON COLUMN race_events.start_time IS 'Race start time as full timestamp with timezone';
COMMENT ON COLUMN race_events.end_time IS 'Race end time as full timestamp with timezone';

-- Add watch_schedule column to regattas table
-- This stores the watch rotation schedule for distance/offshore races
ALTER TABLE regattas ADD COLUMN IF NOT EXISTS watch_schedule jsonb;

-- Add a comment for documentation
COMMENT ON COLUMN regattas.watch_schedule IS 'Watch rotation schedule for distance/offshore races. Contains watch groups, crew assignments, and rotation settings.';

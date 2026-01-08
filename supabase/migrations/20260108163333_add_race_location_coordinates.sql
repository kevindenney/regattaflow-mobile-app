-- Add latitude and longitude columns to race_events table
-- Enables storing GPS coordinates for race locations

ALTER TABLE race_events
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);

-- Create partial index for geo queries (only on rows with coordinates)
CREATE INDEX IF NOT EXISTS idx_race_events_coords
ON race_events (latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN race_events.latitude IS 'GPS latitude of race location (decimal degrees)';
COMMENT ON COLUMN race_events.longitude IS 'GPS longitude of race location (decimal degrees)';

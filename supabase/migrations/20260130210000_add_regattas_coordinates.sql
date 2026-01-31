-- Add latitude and longitude columns to regattas table for venue coordinates
-- These are used for weather forecast lookups

ALTER TABLE regattas
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);

-- Add comment explaining the columns
COMMENT ON COLUMN regattas.latitude IS 'Venue latitude for weather forecast lookups';
COMMENT ON COLUMN regattas.longitude IS 'Venue longitude for weather forecast lookups';

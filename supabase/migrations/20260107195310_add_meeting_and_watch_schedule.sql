-- Migration: Add meeting_location and watch_schedule columns to race_events
-- These columns support the new checklist tools:
--   - meeting_location: Crew meeting point with location and time
--   - watch_schedule: Distance racing watch rotation schedule

-- Add meeting_location column
-- Stores: { name: string, lat: number, lng: number, time: string, notes?: string }
ALTER TABLE race_events
  ADD COLUMN IF NOT EXISTS meeting_location JSONB;

-- Add watch_schedule column (for distance racing)
-- Stores: { raceDurationHours, watchLengthHours, watches: [{ name, crew, timeBlocks }] }
ALTER TABLE race_events
  ADD COLUMN IF NOT EXISTS watch_schedule JSONB;

-- Add comment for documentation
COMMENT ON COLUMN race_events.meeting_location IS 'Crew meeting point: { name, lat, lng, time, notes? }';
COMMENT ON COLUMN race_events.watch_schedule IS 'Distance racing watch schedule: { raceDurationHours, watchLengthHours, watches[] }';

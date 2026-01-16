-- Change sailor_race_preparation FK from race_events to regattas
-- This fixes the issue where races exist in regattas but not race_events
-- Root cause: Four Peaks race exists in regattas but not race_events,
-- causing 409 Conflict errors when saving race intentions

-- Drop the existing FK constraint
ALTER TABLE sailor_race_preparation
DROP CONSTRAINT IF EXISTS sailor_race_preparation_race_event_id_fkey;

-- Add new FK constraint referencing regattas instead
-- Note: race_event_id column name stays the same for backwards compatibility
ALTER TABLE sailor_race_preparation
ADD CONSTRAINT sailor_race_preparation_race_event_id_fkey
FOREIGN KEY (race_event_id) REFERENCES regattas(id) ON DELETE CASCADE;

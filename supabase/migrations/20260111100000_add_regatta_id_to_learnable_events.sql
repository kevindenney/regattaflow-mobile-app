-- Add regatta_id column to learnable_events table
-- This fixes the foreign key constraint error when processRaceCompletion
-- is called with a regattas.id instead of a race_events.id
--
-- The raceId passed from PostRaceInterview is actually a regattas.id,
-- but learnable_events.race_event_id references race_events.id.
-- This migration adds a regatta_id column to store the regatta reference.

-- Add regatta_id column
ALTER TABLE learnable_events
ADD COLUMN IF NOT EXISTS regatta_id UUID REFERENCES regattas(id) ON DELETE SET NULL;

-- Create index for regatta_id
CREATE INDEX IF NOT EXISTS idx_learnable_events_regatta ON learnable_events(regatta_id);

-- Comment explaining the relationship
COMMENT ON COLUMN learnable_events.regatta_id IS 'Reference to the regatta this learning came from. May be set even when race_event_id is null, since regattas and race_events are separate tables.';
COMMENT ON COLUMN learnable_events.race_event_id IS 'Reference to the specific race_event if one exists. May be null if only regatta_id is known.';

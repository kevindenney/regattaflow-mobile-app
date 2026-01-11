-- Allow race_documents to link directly to race_events (not just regattas)
-- This fixes the issue where race_events don't have a regatta_id set

-- Add race_event_id column
ALTER TABLE race_documents
ADD COLUMN IF NOT EXISTS race_event_id uuid REFERENCES race_events(id) ON DELETE CASCADE;

-- Make regatta_id nullable (so we can link to either regatta OR race_event)
ALTER TABLE race_documents
ALTER COLUMN regatta_id DROP NOT NULL;

-- Add check constraint to ensure at least one of regatta_id or race_event_id is set
ALTER TABLE race_documents
ADD CONSTRAINT race_documents_must_have_race_ref
CHECK (regatta_id IS NOT NULL OR race_event_id IS NOT NULL);

-- Add index for the new column
CREATE INDEX IF NOT EXISTS idx_race_documents_race_event_id ON race_documents(race_event_id);

-- Comment for documentation
COMMENT ON COLUMN race_documents.race_event_id IS 'Links document to a specific race event (alternative to regatta_id)';

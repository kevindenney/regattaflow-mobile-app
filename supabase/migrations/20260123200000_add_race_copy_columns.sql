-- Migration: Add columns for race timeline copying/sharing
-- Part of Social Sailing feature

-- Add source_regatta_id column to track copied races
ALTER TABLE regattas
ADD COLUMN IF NOT EXISTS source_regatta_id UUID REFERENCES regattas(id) ON DELETE SET NULL;

-- Add is_copy flag to identify copied races
ALTER TABLE regattas
ADD COLUMN IF NOT EXISTS is_copy BOOLEAN DEFAULT false;

-- Create index for looking up copies of a race
CREATE INDEX IF NOT EXISTS idx_regattas_source_regatta_id
ON regattas(source_regatta_id)
WHERE source_regatta_id IS NOT NULL;

-- Comment on columns for documentation
COMMENT ON COLUMN regattas.source_regatta_id IS 'Reference to the original race when this is a copy from another user timeline';
COMMENT ON COLUMN regattas.is_copy IS 'Flag indicating this race was copied from another user timeline';

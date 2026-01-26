-- Add is_public column to fleets table
-- This allows fleets to be discoverable by users who aren't members

ALTER TABLE fleets
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- Add index for efficient querying of public fleets
CREATE INDEX IF NOT EXISTS idx_fleets_is_public ON fleets(is_public) WHERE is_public = true;

-- Add comment explaining the column
COMMENT ON COLUMN fleets.is_public IS 'When true, this fleet is discoverable by non-members in the crew finder';

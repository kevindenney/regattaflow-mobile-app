-- Add 'crew' ownership type to sailor_boats
-- Allows sailors to track boats they crew on (not own)

-- Drop existing constraint
ALTER TABLE sailor_boats
  DROP CONSTRAINT IF EXISTS sailor_boats_ownership_type_check;

-- Add new constraint with 'crew' option
ALTER TABLE sailor_boats
  ADD CONSTRAINT sailor_boats_ownership_type_check
  CHECK (ownership_type IN ('owned', 'co_owned', 'chartered', 'club_boat', 'crew'));

-- Add comment
COMMENT ON COLUMN sailor_boats.ownership_type IS 'How the sailor uses this boat: owned (owner/skipper), co_owned (shared ownership), chartered (rental), club_boat (club-owned), crew (sailing as crew member)';

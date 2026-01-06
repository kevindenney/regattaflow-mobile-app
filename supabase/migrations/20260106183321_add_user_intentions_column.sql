-- Add user_intentions JSONB column to sailor_race_preparation table
-- Stores structured user intentions for race preparation across all detail cards:
-- - arrivalTime: planned arrival at start area
-- - sailSelection: chosen sails from boat inventory
-- - rigIntentions: per-item rig setting intentions
-- - courseSelection: identified course from sailing instructions

ALTER TABLE sailor_race_preparation
ADD COLUMN IF NOT EXISTS user_intentions JSONB DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN sailor_race_preparation.user_intentions IS
  'Structured user intentions for race preparation. Contains arrivalTime, sailSelection, rigIntentions, courseSelection objects.';

-- Create index for potential querying on specific intention fields
CREATE INDEX IF NOT EXISTS idx_sailor_race_preparation_user_intentions
ON sailor_race_preparation USING gin (user_intentions);

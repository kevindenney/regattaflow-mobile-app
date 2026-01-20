-- Rename race_event_id to regatta_id in sailor_race_preparation
-- This clarifies that the column now references the regattas table (not race_events)
-- per migration 20260113220000 which changed the FK target

-- Step 1: Drop the existing FK constraint
ALTER TABLE sailor_race_preparation
DROP CONSTRAINT IF EXISTS sailor_race_preparation_race_event_id_fkey;

-- Step 2: Rename the column for clarity
ALTER TABLE sailor_race_preparation
RENAME COLUMN race_event_id TO regatta_id;

-- Step 3: Add the FK constraint with the new column name
ALTER TABLE sailor_race_preparation
ADD CONSTRAINT sailor_race_preparation_regatta_id_fkey
FOREIGN KEY (regatta_id) REFERENCES regattas(id) ON DELETE CASCADE;

-- Step 4: Update the unique constraint to use the new column name
ALTER TABLE sailor_race_preparation
DROP CONSTRAINT IF EXISTS sailor_race_preparation_race_event_id_sailor_id_key;

ALTER TABLE sailor_race_preparation
ADD CONSTRAINT sailor_race_preparation_regatta_id_sailor_id_key
UNIQUE (regatta_id, sailor_id);

-- Step 5: Update comments for clarity
COMMENT ON COLUMN sailor_race_preparation.regatta_id IS
  'References the regatta this preparation is for. Was previously named race_event_id.';

-- Fix Primary Boat Duplicates Issue
-- Ensures only one boat can be marked as primary per sailor per class

-- ==========================================
-- 1. FIX EXISTING DUPLICATE PRIMARY BOATS
-- ==========================================

-- For each sailor/class combination with multiple primary boats,
-- keep only the most recently created one as primary
WITH duplicate_primaries AS (
  SELECT 
    sailor_id,
    class_id,
    id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY sailor_id, class_id 
      ORDER BY created_at DESC
    ) as row_num
  FROM sailor_boats
  WHERE is_primary = true
)
UPDATE sailor_boats sb
SET is_primary = false
FROM duplicate_primaries dp
WHERE sb.id = dp.id
  AND dp.row_num > 1;  -- Keep the first (most recent), unset the rest

-- ==========================================
-- 2. ENSURE CONSTRAINT IS PROPERLY APPLIED
-- ==========================================

-- Drop and recreate the unique index to ensure it's working
DROP INDEX IF EXISTS idx_sailor_boats_one_primary_per_class;

-- This partial unique index ensures only one primary boat per sailor per class
CREATE UNIQUE INDEX idx_sailor_boats_one_primary_per_class 
  ON sailor_boats (sailor_id, class_id) 
  WHERE is_primary = true;

-- ==========================================
-- 3. VERIFY TRIGGER FUNCTION EXISTS
-- ==========================================

-- Recreate the trigger function to ensure it's working correctly
CREATE OR REPLACE FUNCTION ensure_one_primary_boat()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the boat is being set as primary
  IF NEW.is_primary = true THEN
    -- Unset all other primary boats for this sailor/class combination
    UPDATE sailor_boats
    SET is_primary = false
    WHERE sailor_id = NEW.sailor_id
      AND class_id = NEW.class_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger is properly attached
DROP TRIGGER IF EXISTS ensure_one_primary_boat_trigger ON sailor_boats;
CREATE TRIGGER ensure_one_primary_boat_trigger
  BEFORE INSERT OR UPDATE OF is_primary ON sailor_boats
  FOR EACH ROW 
  EXECUTE FUNCTION ensure_one_primary_boat();

-- ==========================================
-- 4. ADD VALIDATION FUNCTION
-- ==========================================

-- Create a function to validate primary boat state
CREATE OR REPLACE FUNCTION validate_primary_boats()
RETURNS TABLE(
  sailor_id UUID,
  class_id UUID,
  primary_boat_count BIGINT,
  boat_ids TEXT
) AS $$
  SELECT 
    sb.sailor_id,
    sb.class_id,
    COUNT(*) as primary_boat_count,
    STRING_AGG(sb.id::TEXT, ', ') as boat_ids
  FROM sailor_boats sb
  WHERE sb.is_primary = true
  GROUP BY sb.sailor_id, sb.class_id
  HAVING COUNT(*) > 1;
$$ LANGUAGE sql;

COMMENT ON FUNCTION validate_primary_boats() IS 'Checks for sailor/class combinations with multiple primary boats (should return no rows)';

-- ==========================================
-- 5. VERIFICATION
-- ==========================================

-- Log any remaining duplicates (should be none)
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT sailor_id, class_id, COUNT(*) as cnt
    FROM sailor_boats
    WHERE is_primary = true
    GROUP BY sailor_id, class_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE WARNING 'Found % sailor/class combinations with multiple primary boats after migration', duplicate_count;
  ELSE
    RAISE NOTICE 'Primary boat constraint successfully applied. No duplicates found.';
  END IF;
END $$;

-- Clean up duplicate race_events to fix PGRST116 error
-- "Results contain 2 rows, application/vnd.pgrst.object+json requires 1 row"
-- This happens when multiple race_events exist for the same regatta_id

-- Step 1: Identify and log duplicates
DO $$
DECLARE
  duplicate_record RECORD;
  total_duplicates INTEGER := 0;
BEGIN
  RAISE NOTICE '🔍 Checking for duplicate race_events...';

  FOR duplicate_record IN (
    SELECT
      regatta_id,
      COUNT(*) as count,
      array_agg(id ORDER BY created_at DESC) as ids
    FROM race_events
    WHERE regatta_id IS NOT NULL
    GROUP BY regatta_id
    HAVING COUNT(*) > 1
  ) LOOP
    RAISE NOTICE 'Found % duplicates for regatta_id: %', duplicate_record.count, duplicate_record.regatta_id;
    RAISE NOTICE '  IDs: %', duplicate_record.ids;
    total_duplicates := total_duplicates + (duplicate_record.count - 1);
  END LOOP;

  IF total_duplicates > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Total duplicate race_events to remove: %', total_duplicates;
  ELSE
    RAISE NOTICE '✅ No duplicates found';
  END IF;
END $$;

-- Step 2: Keep only the most recent race_event for each regatta_id
WITH ranked_events AS (
  SELECT
    id,
    regatta_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY regatta_id
      ORDER BY created_at DESC
    ) as row_num
  FROM race_events
  WHERE regatta_id IS NOT NULL
),
duplicates_to_delete AS (
  SELECT id FROM ranked_events WHERE row_num > 1
)
DELETE FROM race_events
WHERE id IN (SELECT id FROM duplicates_to_delete);

-- Step 3: Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS race_events_unique_regatta
  ON race_events(regatta_id)
  WHERE regatta_id IS NOT NULL;

-- Step 4: Verify cleanup
DO $$
DECLARE
  remaining_duplicates INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_duplicates
  FROM (
    SELECT regatta_id
    FROM race_events
    WHERE regatta_id IS NOT NULL
    GROUP BY regatta_id
    HAVING COUNT(*) > 1
  ) as dupes;

  IF remaining_duplicates = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Cleanup successful! No duplicate race_events remain.';
    RAISE NOTICE '✅ Unique constraint added: race_events_unique_regatta';
  ELSE
    RAISE WARNING '⚠️  Still found % regatta_ids with duplicates', remaining_duplicates;
  END IF;
END $$;

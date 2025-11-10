-- Universal cleanup: Remove ALL duplicate race marks across ALL races
-- Keeps only the most recent of each unique (race_id, name, mark_type) combination

-- Step 1: Clean up duplicates for all races in a single operation
WITH ranked_marks AS (
  SELECT
    id,
    race_id,
    name,
    mark_type,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY race_id, name, mark_type
      ORDER BY created_at DESC
    ) as row_num
  FROM race_marks
),
duplicates AS (
  SELECT id FROM ranked_marks WHERE row_num > 1
)
DELETE FROM race_marks
WHERE id IN (SELECT id FROM duplicates);

-- Step 2: Add a unique constraint to prevent duplicates in the future
CREATE UNIQUE INDEX IF NOT EXISTS race_marks_unique_per_race
  ON race_marks(race_id, name, mark_type);

-- Step 3: Verify cleanup and report results
DO $$
DECLARE
  race_record RECORD;
  total_races_cleaned INTEGER := 0;
  total_marks_removed INTEGER := 0;
BEGIN
  -- Count races that had duplicates (now cleaned)
  FOR race_record IN (
    SELECT
      re.id,
      re.name,
      COUNT(rm.id) as remaining_marks
    FROM race_events re
    LEFT JOIN race_marks rm ON rm.race_id = re.id
    WHERE re.id IN (
      'f3ff4705-acaf-40be-aaef-865fb42f2a9c',  -- Corinthian 3 & 4
      'a30d8ee5-4473-47bd-bb58-c0e57d5b8ce8',  -- Corinthian 1 & 2
      '23306a87-b6a5-4b1c-9f62-cbfe12aa7d0e',  -- Champ of Champs
      '2d265ad2-30c6-433b-b05f-7dfc77a02879',  -- Croucher 5 & 6
      'f3c3280b-9586-4b18-be64-17b2bfad147b'   -- Champ of Champs Resail
    )
    GROUP BY re.id, re.name
  ) LOOP
    RAISE NOTICE 'Race: % - Remaining marks: %', race_record.name, race_record.remaining_marks;
    total_races_cleaned := total_races_cleaned + 1;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Cleanup complete!';
  RAISE NOTICE 'Races processed: %', total_races_cleaned;
  RAISE NOTICE 'Unique constraint added: race_marks_unique_per_race';
END $$;

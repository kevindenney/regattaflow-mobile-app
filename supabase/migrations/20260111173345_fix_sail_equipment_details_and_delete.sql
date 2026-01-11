-- ============================================================================
-- Fix sail_equipment_details for existing sails and improve delete policy
-- ============================================================================

-- First, ensure equipment_id is the primary key (allows ON CONFLICT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sail_equipment_details_pkey'
  ) THEN
    ALTER TABLE sail_equipment_details ADD PRIMARY KEY (equipment_id);
  END IF;
END $$;

-- Add sail_equipment_details for North Sails
INSERT INTO sail_equipment_details (equipment_id, sailmaker, design_name, material, optimal_wind_range_min, optimal_wind_range_max)
SELECT
  be.id,
  'North Sails',
  CASE
    WHEN be.custom_name LIKE 'A-7+%' THEN 'A-7+'
    WHEN be.custom_name LIKE 'A-8%' THEN 'A-8'
    WHEN be.custom_name LIKE 'J-22%' THEN 'J-22'
    WHEN be.custom_name LIKE 'J-9%' THEN 'J-9'
    ELSE NULL
  END,
  'Dacron',
  CASE
    WHEN be.custom_name LIKE 'A-7+%' THEN 0
    WHEN be.custom_name LIKE 'A-8%' THEN 5
    WHEN be.custom_name LIKE 'J-22%' THEN 8
    WHEN be.custom_name LIKE 'J-9%' THEN 0
    ELSE NULL
  END,
  CASE
    WHEN be.custom_name LIKE 'A-7+%' THEN 12
    WHEN be.custom_name LIKE 'A-8%' THEN 15
    WHEN be.custom_name LIKE 'J-22%' THEN 18
    WHEN be.custom_name LIKE 'J-9%' THEN 10
    ELSE NULL
  END
FROM boat_equipment be
WHERE be.custom_name LIKE 'A-%' OR be.custom_name LIKE 'J-%'
ON CONFLICT (equipment_id) DO UPDATE SET
  sailmaker = EXCLUDED.sailmaker,
  design_name = EXCLUDED.design_name,
  material = EXCLUDED.material,
  optimal_wind_range_min = EXCLUDED.optimal_wind_range_min,
  optimal_wind_range_max = EXCLUDED.optimal_wind_range_max;

-- Add sail_equipment_details for Doyle sails
INSERT INTO sail_equipment_details (equipment_id, sailmaker, design_name, material, optimal_wind_range_min, optimal_wind_range_max)
SELECT
  be.id,
  'Doyle',
  CASE
    WHEN be.custom_name LIKE 'D1%' THEN 'D1'
    WHEN be.custom_name LIKE 'D2%' THEN 'D2'
    ELSE NULL
  END,
  'Dacron',
  CASE WHEN be.custom_name LIKE 'D1%' THEN 0 ELSE 8 END,
  CASE WHEN be.custom_name LIKE 'D1%' THEN 12 ELSE 18 END
FROM boat_equipment be
WHERE be.custom_name LIKE 'D1%' OR be.custom_name LIKE 'D2%'
ON CONFLICT (equipment_id) DO UPDATE SET
  sailmaker = EXCLUDED.sailmaker,
  design_name = EXCLUDED.design_name;

-- Ensure delete policy allows users to delete their own equipment
-- First drop existing policy if it exists
DROP POLICY IF EXISTS "Sailors can delete their own equipment" ON boat_equipment;

-- Create/recreate delete policy
CREATE POLICY "Sailors can delete their own equipment" ON boat_equipment
  FOR DELETE USING (auth.uid() = sailor_id);

-- Also ensure the ALL policy covers delete
DROP POLICY IF EXISTS "Sailors can manage their own equipment" ON boat_equipment;
CREATE POLICY "Sailors can manage their own equipment" ON boat_equipment
  FOR ALL USING (auth.uid() = sailor_id);

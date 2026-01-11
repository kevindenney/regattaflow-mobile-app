-- ============================================================================
-- Fix sail_equipment_details - properly match sail names
-- ============================================================================

-- Insert sail_equipment_details for all sails that mention North Sails
INSERT INTO sail_equipment_details (equipment_id, sailmaker, design_name, material, optimal_wind_range_min, optimal_wind_range_max)
SELECT
  be.id,
  'North Sails',
  CASE
    WHEN be.custom_name ILIKE '%A-7+%' THEN 'A-7+'
    WHEN be.custom_name ILIKE '%A-8%' THEN 'A-8'
    WHEN be.custom_name ILIKE '%MG-15%' THEN 'MG-15'
    WHEN be.custom_name ILIKE '%J-22%' THEN 'J-22'
    WHEN be.custom_name ILIKE '%J-9%' THEN 'J-9'
    WHEN be.custom_name ILIKE '%S-2%' THEN 'S-2'
    ELSE NULL
  END,
  'Dacron',
  CASE
    WHEN be.custom_name ILIKE '%A-7+%' THEN 0
    WHEN be.custom_name ILIKE '%A-8%' THEN 5
    WHEN be.custom_name ILIKE '%MG-15%' THEN 10
    WHEN be.custom_name ILIKE '%J-22%' THEN 8
    WHEN be.custom_name ILIKE '%J-9%' THEN 0
    WHEN be.custom_name ILIKE '%S-2%' THEN 6
    ELSE NULL
  END,
  CASE
    WHEN be.custom_name ILIKE '%A-7+%' THEN 12
    WHEN be.custom_name ILIKE '%A-8%' THEN 15
    WHEN be.custom_name ILIKE '%MG-15%' THEN 20
    WHEN be.custom_name ILIKE '%J-22%' THEN 18
    WHEN be.custom_name ILIKE '%J-9%' THEN 10
    WHEN be.custom_name ILIKE '%S-2%' THEN 16
    ELSE NULL
  END
FROM boat_equipment be
WHERE be.category IN ('mainsail', 'jib', 'genoa', 'spinnaker', 'code_zero')
  AND (be.custom_name ILIKE '%North Sails%' OR be.custom_name ILIKE '%A-7%' OR be.custom_name ILIKE '%A-8%'
       OR be.custom_name ILIKE '%MG-15%' OR be.custom_name ILIKE '%J-9%' OR be.custom_name ILIKE '%J-22%')
ON CONFLICT (equipment_id) DO UPDATE SET
  sailmaker = EXCLUDED.sailmaker,
  design_name = EXCLUDED.design_name,
  material = EXCLUDED.material,
  optimal_wind_range_min = EXCLUDED.optimal_wind_range_min,
  optimal_wind_range_max = EXCLUDED.optimal_wind_range_max;

-- Insert for Doyle sails
INSERT INTO sail_equipment_details (equipment_id, sailmaker, design_name, material, optimal_wind_range_min, optimal_wind_range_max)
SELECT
  be.id,
  'Doyle',
  CASE
    WHEN be.custom_name ILIKE '%D1%' THEN 'D1'
    WHEN be.custom_name ILIKE '%D2%' THEN 'D2'
    ELSE NULL
  END,
  'Dacron',
  CASE WHEN be.custom_name ILIKE '%D1%' THEN 0 ELSE 8 END,
  CASE WHEN be.custom_name ILIKE '%D1%' THEN 12 ELSE 18 END
FROM boat_equipment be
WHERE be.category IN ('mainsail', 'jib', 'genoa', 'spinnaker', 'code_zero')
  AND (be.custom_name ILIKE '%Doyle%' OR be.custom_name ILIKE '%D1%' OR be.custom_name ILIKE '%D2%')
ON CONFLICT (equipment_id) DO UPDATE SET
  sailmaker = EXCLUDED.sailmaker,
  design_name = EXCLUDED.design_name;

-- Insert for Petticrows sails
INSERT INTO sail_equipment_details (equipment_id, sailmaker, design_name, material)
SELECT be.id, 'Petticrows', 'M1', 'Dacron'
FROM boat_equipment be
WHERE be.category IN ('mainsail', 'jib', 'genoa', 'spinnaker', 'code_zero')
  AND be.custom_name ILIKE '%Petticrows%'
ON CONFLICT (equipment_id) DO UPDATE SET sailmaker = EXCLUDED.sailmaker;

-- Insert for Quantum sails
INSERT INTO sail_equipment_details (equipment_id, sailmaker, design_name, material)
SELECT be.id, 'Quantum', 'Q1', 'Dacron'
FROM boat_equipment be
WHERE be.category IN ('mainsail', 'jib', 'genoa', 'spinnaker', 'code_zero')
  AND be.custom_name ILIKE '%Quantum%'
ON CONFLICT (equipment_id) DO UPDATE SET sailmaker = EXCLUDED.sailmaker;

-- For any remaining sails without details, add empty record so view works
INSERT INTO sail_equipment_details (equipment_id)
SELECT be.id
FROM boat_equipment be
LEFT JOIN sail_equipment_details sed ON sed.equipment_id = be.id
WHERE be.category IN ('mainsail', 'jib', 'genoa', 'spinnaker', 'code_zero')
  AND sed.equipment_id IS NULL
ON CONFLICT (equipment_id) DO NOTHING;

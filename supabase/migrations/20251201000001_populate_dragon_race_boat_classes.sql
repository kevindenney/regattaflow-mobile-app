-- Migration: Populate boat_classes for Dragon Championship races
-- This fixes races that have empty boat_classes arrays, preventing tuning guide matching

-- Update Dragon Championship races to include Dragon class info
UPDATE race_events
SET boat_classes = jsonb_build_array(
  jsonb_build_object(
    'id', '130829e3-05dd-4ab3-bea2-e0231c12064a'::uuid,
    'name', 'Dragon'
  )
)
WHERE name LIKE '%Dragon Championship%'
  AND (boat_classes IS NULL OR boat_classes = '[]'::jsonb);

-- Add comment
COMMENT ON COLUMN race_events.boat_classes IS 'Array of boat classes participating in this race. Each element should include id and name.';

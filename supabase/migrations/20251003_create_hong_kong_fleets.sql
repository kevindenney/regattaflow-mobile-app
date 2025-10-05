-- Create Hong Kong Sailing Fleets
-- Creates fleets for major sailing classes in Hong Kong

-- First, ensure all boat classes exist
INSERT INTO boat_classes (name, class_association) VALUES
  ('J/70', 'J/70 International Class Association'),
  ('J/80', 'J/80 Class Association'),
  ('Flying Fifteen', 'Flying Fifteen International'),
  ('Impala', 'Impala Class Association'),
  ('Optimist', 'International Optimist Dinghy Association'),
  ('Laser', 'International Laser Class Association'),
  ('RS Feva', 'RS Feva Class Association'),
  ('IRC', 'Royal Ocean Racing Club'),
  ('Sports Boat', 'RHKYC Sports Boat Fleet')
ON CONFLICT (name) DO NOTHING;

-- Create Hong Kong fleets for each class
WITH class_ids AS (
  SELECT id, name FROM boat_classes WHERE name IN (
    'J/70', 'J/80', 'Flying Fifteen', 'Impala',
    'Optimist', 'Laser', 'RS Feva', 'IRC', 'Sports Boat'
  )
)
INSERT INTO fleets (name, slug, class_id, region, visibility, metadata)
SELECT
  'Hong Kong ' || name || ' Fleet' as name,
  'hk-' || LOWER(REPLACE(REPLACE(name, '/', ''), ' ', '-')) || '-fleet' as slug,
  id as class_id,
  'Hong Kong' as region,
  'public' as visibility,
  jsonb_build_object(
    'primary_club', 'Royal Hong Kong Yacht Club',
    'location', 'Victoria Harbour, Hong Kong',
    'racing_schedule', 'Weekend racing',
    'fleet_size', CASE
      WHEN name = 'Optimist' THEN 45
      WHEN name = 'Laser' THEN 22
      WHEN name = 'RS Feva' THEN 16
      WHEN name = 'J/70' THEN 15
      WHEN name = 'J/80' THEN 12
      WHEN name = 'Impala' THEN 10
      WHEN name = 'Flying Fifteen' THEN 8
      WHEN name = 'Sports Boat' THEN 18
      WHEN name = 'IRC' THEN 35
      ELSE 10
    END
  ) as metadata
FROM class_ids
ON CONFLICT (slug) DO NOTHING;

-- Grant permissions
GRANT ALL ON fleets TO authenticated;

COMMENT ON TABLE fleets IS 'Sailing fleets - groups of sailors in the same class at a location (separate from individual boats)';

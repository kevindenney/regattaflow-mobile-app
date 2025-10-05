-- Create Hong Kong Sailing Fleets
-- Run this manually in Supabase SQL Editor if migrations timeout

-- Ensure boat classes exist
INSERT INTO boat_classes (name, class_association) VALUES
  ('J/70', 'J/70 International Class Association'),
  ('J/80', 'J/80 Class Association'),
  ('Flying Fifteen', 'Flying Fifteen International'),
  ('Impala', 'Impala Class Association'),
  ('Optimist', 'International Optimist Dinghy Association'),
  ('Laser', 'International Laser Class Association'),
  ('RS Feva', 'RS Feva Class Association'),
  ('IRC', 'Royal Ocean Racing Club'),
  ('Sports Boat', 'RHKYC Sports Boat Fleet'),
  ('Pandora', 'Pandora Class Association'),
  ('Ruffian 8.5', 'Ruffian 8.5 Class Association')
ON CONFLICT (name) DO NOTHING;

-- Create Hong Kong J/70 Fleet
INSERT INTO fleets (name, slug, class_id, region, visibility, metadata)
SELECT
  'Hong Kong J/70 Fleet',
  'hk-j70-fleet',
  id,
  'Hong Kong',
  'public',
  '{"primary_club": "Royal Hong Kong Yacht Club", "location": "Victoria Harbour, Hong Kong", "racing_schedule": "Weekend racing", "fleet_size": 15}'::jsonb
FROM boat_classes WHERE name = 'J/70'
ON CONFLICT (slug) DO NOTHING;

-- Create Hong Kong J/80 Fleet
INSERT INTO fleets (name, slug, class_id, region, visibility, metadata)
SELECT
  'Hong Kong J/80 Fleet',
  'hk-j80-fleet',
  id,
  'Hong Kong',
  'public',
  '{"primary_club": "Royal Hong Kong Yacht Club", "location": "Victoria Harbour, Hong Kong", "racing_schedule": "Weekend racing", "fleet_size": 12}'::jsonb
FROM boat_classes WHERE name = 'J/80'
ON CONFLICT (slug) DO NOTHING;

-- Create Hong Kong Flying Fifteen Fleet
INSERT INTO fleets (name, slug, class_id, region, visibility, metadata)
SELECT
  'Hong Kong Flying Fifteen Fleet',
  'hk-flying-fifteen-fleet',
  id,
  'Hong Kong',
  'public',
  '{"primary_club": "Royal Hong Kong Yacht Club", "location": "Victoria Harbour, Hong Kong", "racing_schedule": "Weekend racing", "fleet_size": 8}'::jsonb
FROM boat_classes WHERE name = 'Flying Fifteen'
ON CONFLICT (slug) DO NOTHING;

-- Create Hong Kong Impala Fleet
INSERT INTO fleets (name, slug, class_id, region, visibility, metadata)
SELECT
  'Hong Kong Impala Fleet',
  'hk-impala-fleet',
  id,
  'Hong Kong',
  'public',
  '{"primary_club": "Royal Hong Kong Yacht Club", "location": "Victoria Harbour, Hong Kong", "racing_schedule": "Weekend racing", "fleet_size": 10}'::jsonb
FROM boat_classes WHERE name = 'Impala'
ON CONFLICT (slug) DO NOTHING;

-- Create Hong Kong Optimist Fleet
INSERT INTO fleets (name, slug, class_id, region, visibility, metadata)
SELECT
  'Hong Kong Optimist Fleet',
  'hk-optimist-fleet',
  id,
  'Hong Kong',
  'public',
  '{"primary_club": "Royal Hong Kong Yacht Club", "location": "Victoria Harbour, Hong Kong", "racing_schedule": "Weekend racing", "fleet_size": 45}'::jsonb
FROM boat_classes WHERE name = 'Optimist'
ON CONFLICT (slug) DO NOTHING;

-- Create Hong Kong Laser Fleet
INSERT INTO fleets (name, slug, class_id, region, visibility, metadata)
SELECT
  'Hong Kong Laser Fleet',
  'hk-laser-fleet',
  id,
  'Hong Kong',
  'public',
  '{"primary_club": "Royal Hong Kong Yacht Club", "location": "Victoria Harbour, Hong Kong", "racing_schedule": "Weekend racing", "fleet_size": 22}'::jsonb
FROM boat_classes WHERE name = 'Laser'
ON CONFLICT (slug) DO NOTHING;

-- Create Hong Kong RS Feva Fleet
INSERT INTO fleets (name, slug, class_id, region, visibility, metadata)
SELECT
  'Hong Kong RS Feva Fleet',
  'hk-rs-feva-fleet',
  id,
  'Hong Kong',
  'public',
  '{"primary_club": "Royal Hong Kong Yacht Club", "location": "Victoria Harbour, Hong Kong", "racing_schedule": "Weekend racing", "fleet_size": 16}'::jsonb
FROM boat_classes WHERE name = 'RS Feva'
ON CONFLICT (slug) DO NOTHING;

-- Create Hong Kong IRC Fleet
INSERT INTO fleets (name, slug, class_id, region, visibility, metadata)
SELECT
  'Hong Kong IRC Fleet',
  'hk-irc-fleet',
  id,
  'Hong Kong',
  'public',
  '{"primary_club": "Royal Hong Kong Yacht Club", "location": "Victoria Harbour, Hong Kong", "racing_schedule": "Weekend racing", "fleet_size": 35}'::jsonb
FROM boat_classes WHERE name = 'IRC'
ON CONFLICT (slug) DO NOTHING;

-- Create Hong Kong Sports Boat Fleet
INSERT INTO fleets (name, slug, class_id, region, visibility, metadata)
SELECT
  'Hong Kong Sports Boat Fleet',
  'hk-sports-boat-fleet',
  id,
  'Hong Kong',
  'public',
  '{"primary_club": "Royal Hong Kong Yacht Club", "location": "Victoria Harbour, Hong Kong", "racing_schedule": "Weekend racing", "fleet_size": 18}'::jsonb
FROM boat_classes WHERE name = 'Sports Boat'
ON CONFLICT (slug) DO NOTHING;

-- Create Hong Kong Pandora Fleet
INSERT INTO fleets (name, slug, class_id, region, visibility, metadata)
SELECT
  'Hong Kong Pandora Fleet',
  'hk-pandora-fleet',
  id,
  'Hong Kong',
  'public',
  '{"primary_club": "Royal Hong Kong Yacht Club", "location": "Victoria Harbour, Hong Kong", "racing_schedule": "Weekend racing", "fleet_size": 6}'::jsonb
FROM boat_classes WHERE name = 'Pandora'
ON CONFLICT (slug) DO NOTHING;

-- Create Hong Kong Ruffian 8.5 Fleet
INSERT INTO fleets (name, slug, class_id, region, visibility, metadata)
SELECT
  'Hong Kong Ruffian 8.5 Fleet',
  'hk-ruffian-85-fleet',
  id,
  'Hong Kong',
  'public',
  '{"primary_club": "Royal Hong Kong Yacht Club", "location": "Victoria Harbour, Hong Kong", "racing_schedule": "Weekend racing", "fleet_size": 5}'::jsonb
FROM boat_classes WHERE name = 'Ruffian 8.5'
ON CONFLICT (slug) DO NOTHING;

-- Show all Hong Kong fleets
SELECT id, name, slug, region, metadata->>'fleet_size' as fleet_size
FROM fleets
WHERE region = 'Hong Kong'
ORDER BY name;

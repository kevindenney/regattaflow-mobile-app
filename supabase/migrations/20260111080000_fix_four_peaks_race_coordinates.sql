-- Add coordinates for Four Peaks Race 2026 (Tai Tam Bay, Hong Kong)
UPDATE regattas 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{start_coordinates}',
  '{"lat": 22.2478, "lng": 114.2208}'::jsonb
)
WHERE id = '54097654-0e61-4ff7-8419-6ada84543af9';

-- Update race_type constraint to include match and team racing types
ALTER TABLE regattas DROP CONSTRAINT IF EXISTS regattas_race_type_check;
ALTER TABLE regattas ADD CONSTRAINT regattas_race_type_check
  CHECK (race_type = ANY (ARRAY['fleet'::text, 'distance'::text, 'match'::text, 'team'::text]));

-- Update Tomes Cup to be a team race for testing
UPDATE regattas
SET race_type = 'team'
WHERE name = 'Tomes Cup';

-- Create a race_event for Tomes Cup team race testing
-- First get one of the Tomes Cup regatta IDs
INSERT INTO race_events (
  id,
  name,
  regatta_id,
  event_date,
  start_time,
  status,
  user_id
)
SELECT
  gen_random_uuid(),
  'Tomes Cup - Team Race',
  r.id,
  '2026-01-15'::date,  -- Set to upcoming date
  '14:00:00'::time,
  'planned',
  (SELECT id FROM auth.users LIMIT 1)  -- Assign to first user for visibility
FROM regattas r
WHERE r.name = 'Tomes Cup' AND r.race_type = 'team'
LIMIT 1;

-- Link Tomes Cup team race regatta to demo sailor's season
INSERT INTO season_regattas (season_id, regatta_id, sequence)
SELECT
  'db722ce6-5bb6-42a7-8626-c1b2529f88c6',  -- Winter 2025-2026 season
  r.id,
  14  -- Next sequence number
FROM regattas r
WHERE r.name = 'Tomes Cup' AND r.race_type = 'team'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Update season to correct date range (Winter 2025-2026)
UPDATE seasons 
SET name = 'Winter 2025-2026',
    short_name = 'Winter 25-26',
    year = 2025,
    year_end = 2026,
    start_date = '2025-11-01',
    end_date = '2026-03-31'
WHERE user_id = '51241049-02ed-4e31-b8c6-39af7c9d4d50'
  AND name = 'Winter 2024-2025';

-- Link regattas in the Winter 2025-2026 date range
INSERT INTO season_regattas (season_id, regatta_id, sequence)
SELECT 
  s.id,
  r.id,
  ROW_NUMBER() OVER (ORDER BY r.start_date)::integer
FROM seasons s
CROSS JOIN regattas r
WHERE s.user_id = '51241049-02ed-4e31-b8c6-39af7c9d4d50'
  AND s.name = 'Winter 2025-2026'
  AND r.created_by = '51241049-02ed-4e31-b8c6-39af7c9d4d50'
  AND r.start_date >= '2025-11-01'
  AND r.start_date <= '2026-03-31'
ON CONFLICT DO NOTHING;

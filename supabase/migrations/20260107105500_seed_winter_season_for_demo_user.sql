-- Create Winter 2024-2025 season for demo sailor
INSERT INTO seasons (name, short_name, year, year_end, user_id, start_date, end_date, status)
VALUES ('Winter 2024-2025', 'Winter 24-25', 2024, 2025, '51241049-02ed-4e31-b8c6-39af7c9d4d50', '2024-11-01', '2025-03-31', 'active')
ON CONFLICT DO NOTHING;

-- Link existing regattas to the season
INSERT INTO season_regattas (season_id, regatta_id, sequence)
SELECT 
  s.id,
  r.id,
  ROW_NUMBER() OVER (ORDER BY r.start_date)::integer
FROM seasons s
CROSS JOIN regattas r
WHERE s.user_id = '51241049-02ed-4e31-b8c6-39af7c9d4d50'
  AND s.name = 'Winter 2024-2025'
  AND r.created_by = '51241049-02ed-4e31-b8c6-39af7c9d4d50'
  AND r.start_date >= '2024-11-01'
  AND r.start_date <= '2025-03-31'
ON CONFLICT DO NOTHING;

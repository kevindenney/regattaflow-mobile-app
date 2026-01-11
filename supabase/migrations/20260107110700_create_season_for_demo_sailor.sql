-- Create Winter 2025-2026 season for demo-sailor user (f6f6a7f6-7755-412b-a87b-3a7617721cc7)
INSERT INTO seasons (name, short_name, year, year_end, user_id, start_date, end_date, status)
VALUES ('Winter 2025-2026', 'Winter 25-26', 2025, 2026, 'f6f6a7f6-7755-412b-a87b-3a7617721cc7', '2025-11-01', '2026-03-31', 'active')
ON CONFLICT DO NOTHING;

-- Link regattas created by demo-sailor to their season
INSERT INTO season_regattas (season_id, regatta_id, sequence)
SELECT 
  s.id,
  r.id,
  ROW_NUMBER() OVER (ORDER BY r.start_date)::integer
FROM seasons s
CROSS JOIN regattas r
WHERE s.user_id = 'f6f6a7f6-7755-412b-a87b-3a7617721cc7'
  AND s.name = 'Winter 2025-2026'
  AND r.created_by = 'f6f6a7f6-7755-412b-a87b-3a7617721cc7'
  AND r.start_date >= '2025-11-01'
  AND r.start_date <= '2026-03-31'
ON CONFLICT DO NOTHING;

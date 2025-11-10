-- Add Demo Sailor session to Phyloong 5 & 6 regatta
-- This fixes Fleet Insights so Demo Sailor can see the 4 fleet members' race data

INSERT INTO race_timer_sessions (
  id,
  sailor_id,
  regatta_id,
  start_time,
  end_time,
  duration_seconds,
  track_points,
  notes,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'f6f6a7f6-7755-412b-a87b-3a7617721cc7', -- Demo Sailor user_id
  '758d5a82-d6ce-40d7-b6a8-fb98d2c82f2d', -- Phyloong 5 & 6 regatta_id
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '30 minutes',
  5400, -- 90 minutes in seconds
  '[{"lat": 22.283611, "lon": 114.156944, "timestamp": "2024-11-04T10:00:00Z", "speed": 6.5}, {"lat": 22.284, "lon": 114.157, "timestamp": "2024-11-04T10:05:00Z", "speed": 7.2}, {"lat": 22.285, "lon": 114.158, "timestamp": "2024-11-04T10:10:00Z", "speed": 6.8}]'::jsonb,
  'Overall: Solid race today. Started mid-line on port tack and tacked onto starboard early to get into phase with the right shift.

Start Position: middle

Upwind Leg: Wind was 8-12 knots from the NE, shifting 10-15 degrees. Made good gains staying right of the fleet. Boat speed felt good, especially after adjusting traveler up 1cm.

Downwind Leg: Sailed high angles to stay in pressure. A few boats went lower but we held our lane. Gybed twice cleanly at the lulls.

Mark Roundings: Windward mark was crowded - had to do a wide rounding to avoid a starboard boat. Leeward mark was clean.

Violations/Penalties: None',
  NOW(),
  NOW()
)
RETURNING id, sailor_id, regatta_id;

-- Verify the insert
SELECT
  r.name as regatta_name,
  COUNT(rts.id) as total_sessions,
  COUNT(DISTINCT rts.sailor_id) as unique_sailors,
  STRING_AGG(DISTINCT u.email, ', ' ORDER BY u.email) as sailor_emails
FROM regattas r
LEFT JOIN race_timer_sessions rts ON r.id = rts.regatta_id
LEFT JOIN users u ON rts.sailor_id = u.id
WHERE r.id = '758d5a82-d6ce-40d7-b6a8-fb98d2c82f2d'
GROUP BY r.id, r.name;

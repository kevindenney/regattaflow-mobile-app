-- Change Phyloong 5 & 6 race creator to Demo Sailor
-- This will make the race appear in Demo Sailor's race list

UPDATE regattas
SET created_by = 'f6f6a7f6-7755-412b-a87b-3a7617721cc7' -- Demo Sailor user_id
WHERE id = '758d5a82-d6ce-40d7-b6a8-fb98d2c82f2d' -- Phyloong 5 & 6
RETURNING id, name, created_by;

-- Verify the change
SELECT
  r.name as race_name,
  u.email as creator_email,
  COUNT(rts.id) as total_sessions,
  COUNT(DISTINCT rts.sailor_id) as unique_sailors
FROM regattas r
LEFT JOIN users u ON r.created_by = u.id
LEFT JOIN race_timer_sessions rts ON r.id = rts.regatta_id
WHERE r.id = '758d5a82-d6ce-40d7-b6a8-fb98d2c82f2d'
GROUP BY r.id, r.name, u.email;

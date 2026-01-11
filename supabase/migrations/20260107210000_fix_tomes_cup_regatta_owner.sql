-- Update Tomes Cup regatta to be owned by demo sailor so it shows in their race list
-- The useLiveRaces hook queries regattas.created_by, not race_events.user_id
UPDATE regattas
SET created_by = 'f6f6a7f6-7755-412b-a87b-3a7617721cc7'
WHERE name = 'Tomes Cup'
AND race_type = 'team';

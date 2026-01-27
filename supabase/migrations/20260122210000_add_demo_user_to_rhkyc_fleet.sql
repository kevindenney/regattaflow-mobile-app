-- Add demo user to RHKYC Dragon Fleet for crew finder testing
-- This allows the demo user to see fleet mates as crew suggestions

INSERT INTO fleet_members (fleet_id, user_id, role, status)
VALUES (
  '63422b6f-429a-4557-aab9-2a928316cbe5', -- RHKYC Dragon Fleet
  'f6f6a7f6-7755-412b-a87b-3a7617721cc7', -- Demo sailor user
  'member',
  'active'
)
ON CONFLICT DO NOTHING;

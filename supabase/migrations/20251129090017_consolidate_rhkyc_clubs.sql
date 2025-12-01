-- Consolidate RHKYC clubs and remove duplicate events
-- Primary club to keep: 15621949-7086-418a-8245-0f932e6edd70 (Royal Hong Kong Yacht Club, RHKYC)

-- Step 1: Delete duplicate "Spring Dragon Championship 2025" events (keep oldest: cc938524-773a-4492-a442-cb6d35768984)
DELETE FROM club_events
WHERE id IN (
  '4e4cffa2-1eba-4238-b9c8-7e00cb4cd08c',
  '8c8b1437-0486-4b56-9bb2-9a1f3c8bb898',
  'd8826a0d-9e41-4a15-9865-76dead81d728'
);

-- Step 2: Delete duplicate "J/70 Winter Series - Race 3" events (keep oldest: 59a49951-0767-41a5-8dac-d1f5f30a7f7c)
DELETE FROM club_events
WHERE id IN (
  '724c8b65-2cfa-413d-b7ea-8612cfc83938',
  '708ad74e-409b-41a6-bce8-417e17ac168c',
  'c7dabb40-87f8-4252-a6bc-91cd19699160'
);

-- Step 3: Migrate events from HKRYC (2dc79124-074e-4ae4-a067-ad8d29d9576e) to primary RHKYC
UPDATE club_events
SET club_id = '15621949-7086-418a-8245-0f932e6edd70'
WHERE club_id = '2dc79124-074e-4ae4-a067-ad8d29d9576e';

-- Step 4: Migrate club members from other RHKYC clubs to primary (avoid duplicates)
UPDATE club_members
SET club_id = '15621949-7086-418a-8245-0f932e6edd70'
WHERE club_id IN ('2dc79124-074e-4ae4-a067-ad8d29d9576e', '5928e7c3-6d22-49e1-94a1-7531cffd210b')
AND NOT EXISTS (
  SELECT 1 FROM club_members cm2
  WHERE cm2.club_id = '15621949-7086-418a-8245-0f932e6edd70'
  AND cm2.user_id = club_members.user_id
);

-- Step 5: Delete duplicate club members if any remain
DELETE FROM club_members
WHERE club_id IN (
  '2dc79124-074e-4ae4-a067-ad8d29d9576e',
  '5928e7c3-6d22-49e1-94a1-7531cffd210b'
);

-- Step 6: Delete the duplicate club entries
DELETE FROM clubs
WHERE id IN (
  '2dc79124-074e-4ae4-a067-ad8d29d9576e',
  '5928e7c3-6d22-49e1-94a1-7531cffd210b'
);

-- Step 7: Update the primary RHKYC club with best data
UPDATE clubs
SET
  description = 'Since 1849 RHKYC has staged keelboat, dinghy, offshore and match racing from its harbour clubhouse on Kellett Island. Today it blends classic one-design fleets with foiling programs, a renowned volunteer corps, and Asia-Pacific''s busiest regatta calendar.',
  address = 'Kellett Island, Causeway Bay, Hong Kong',
  phone = '+852 2239 0300',
  email = 'sailing@rhkyc.org.hk',
  contact_person = 'Race Officer',
  membership_type = 'private',
  club_type = 'yacht_club',
  timezone = 'Asia/Hong_Kong',
  updated_at = now()
WHERE id = '15621949-7086-418a-8245-0f932e6edd70';

-- Step 8: Make demo-club user an admin in club_members
UPDATE club_members
SET role = 'admin', updated_at = now()
WHERE club_id = '15621949-7086-418a-8245-0f932e6edd70'
  AND user_id = '8a910b64-e4ff-43e7-950c-6d7d92ec2bec';

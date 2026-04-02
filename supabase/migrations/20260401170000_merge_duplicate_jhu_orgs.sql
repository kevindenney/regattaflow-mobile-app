-- Merge duplicate JHU School of Nursing orgs into canonical org 678e149e
-- Canonical: 678e149e (slug: johns-hopkins, has admin denneyke@gmail.com + emily3 request + templates)
-- Seed:      48361c72 (36 members, 1 cohort, 50 competencies, 1493 progress records)
-- 6 empty dupes to delete

-- Step 1: Move seed memberships to the canonical org
UPDATE organization_memberships
SET organization_id = '678e149e-2abb-422c-ac61-b76756a2150e'
WHERE organization_id = '48361c72-3705-fe99-a34a-3389c0be6692';

-- Step 2: Move seed cohort to canonical org
UPDATE betterat_org_cohorts
SET org_id = '678e149e-2abb-422c-ac61-b76756a2150e'
WHERE org_id = '48361c72-3705-fe99-a34a-3389c0be6692';

-- Step 3: Handle conflicting competencies (#6 and #8 exist in both orgs)
-- Remap progress records from seed competency #6 to canonical competency #6
UPDATE betterat_competency_progress
SET competency_id = '90729a5b-df88-41f0-9dd3-928fa094b3c4'
WHERE competency_id = '6c1e7b0d-049a-e871-c3ff-1cc767b0eb9a';

-- Remap progress records from seed competency #8 to canonical competency #8
UPDATE betterat_competency_progress
SET competency_id = 'e7ed0955-728f-4121-9c23-21a0d1589d94'
WHERE competency_id = '3342fd35-2853-c3a2-a493-0d9b0997393c';

-- Delete the now-orphaned seed duplicates for #6 and #8
DELETE FROM betterat_competencies
WHERE id IN ('6c1e7b0d-049a-e871-c3ff-1cc767b0eb9a', '3342fd35-2853-c3a2-a493-0d9b0997393c');

-- Move remaining seed competencies (the other 48) to canonical org
UPDATE betterat_competencies
SET organization_id = '678e149e-2abb-422c-ac61-b76756a2150e'
WHERE organization_id = '48361c72-3705-fe99-a34a-3389c0be6692';

-- Step 4: Move any org interests
UPDATE organization_interests
SET organization_id = '678e149e-2abb-422c-ac61-b76756a2150e'
WHERE organization_id = '48361c72-3705-fe99-a34a-3389c0be6692';

-- Step 5: Move any invites
UPDATE organization_invites
SET organization_id = '678e149e-2abb-422c-ac61-b76756a2150e'
WHERE organization_id = '48361c72-3705-fe99-a34a-3389c0be6692';

-- Step 6: Delete the now-empty seed org
DELETE FROM organizations WHERE id = '48361c72-3705-fe99-a34a-3389c0be6692';

-- Step 7: Delete the 6 empty duplicates
DELETE FROM organizations WHERE id IN (
  'a1000002-0000-0000-0000-000000000002',
  '173ca34f-0e5e-4d00-863f-db1a733def56',
  'bbcb9f39-9281-4c68-a9ac-cfe5127344cd',
  'dae67621-3278-448e-bc43-6b62f9a583e9',
  '74bee314-157b-4ea9-9900-a390bfea4420',
  '2bf68eea-ebdb-48db-9e90-4619c652b053'
);

-- Step 8: Set proper slug on canonical org
UPDATE organizations
SET slug = 'johns-hopkins-school-of-nursing'
WHERE id = '678e149e-2abb-422c-ac61-b76756a2150e';

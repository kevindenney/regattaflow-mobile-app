-- Add two sample crew members for Dragonfly (International Dragon)
-- Run this in the Supabase SQL Editor

INSERT INTO crew_members (
  sailor_id,
  class_id,
  email,
  name,
  role,
  access_level,
  status,
  notes
) VALUES
(
  'd67f765e-7fe6-4f79-b514-f1b7f9a1ba3f',
  '861d0d69-7f2e-41e8-9f97-0f410c1aa175',
  'sarah.johnson@example.com',
  'Sarah Johnson',
  'trimmer',
  'view',
  'active',
  'Experienced trimmer, specializes in light wind conditions'
),
(
  'd67f765e-7fe6-4f79-b514-f1b7f9a1ba3f',
  '861d0d69-7f2e-41e8-9f97-0f410c1aa175',
  'mike.chen@example.com',
  'Mike Chen',
  'bowman',
  'view',
  'active',
  'Strong bowman, excellent in heavy weather'
)
ON CONFLICT (sailor_id, class_id, email) DO NOTHING
RETURNING id, name, email, role, status;
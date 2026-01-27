-- Migration: Seed test user profiles for crew discovery testing
-- This adds full_name to existing profiles so they appear in the Discover tab

-- Add full_name to existing profiles for crew discovery testing
UPDATE profiles SET full_name = 'Demo Sailor' WHERE email = 'demo-sailor@regattaflow.app' AND full_name IS NULL;
UPDATE profiles SET full_name = 'Demo Club Admin' WHERE email = 'demo-club@regattaflow.app' AND full_name IS NULL;
UPDATE profiles SET full_name = 'Demo Coach' WHERE email = 'demo-coach@regattaflow.app' AND full_name IS NULL;
UPDATE profiles SET full_name = 'Kyle Denney' WHERE email = 'kdenney@me.com' AND full_name IS NULL;
UPDATE profiles SET full_name = 'Kyle E Denney' WHERE email = 'denneyke@gmail.com' AND full_name IS NULL;
UPDATE profiles SET full_name = 'Test User' WHERE email = 'testuser@regattaflow.com' AND full_name IS NULL;
UPDATE profiles SET full_name = 'Test Account' WHERE email = 'test@regattaflow.com' AND full_name IS NULL;

-- Also ensure sailor_profiles exist for these users and have experience_level set
-- (The discovery query joins with sailor_profiles for avatar/experience data)
INSERT INTO sailor_profiles (user_id, avatar_emoji, avatar_color, experience_level)
SELECT p.id, '⛵', '#4A90D9', 'intermediate'
FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM sailor_profiles sp WHERE sp.user_id = p.id)
ON CONFLICT DO NOTHING;

-- Update existing sailor_profiles with experience levels if missing
UPDATE sailor_profiles
SET experience_level = COALESCE(experience_level, 'intermediate'),
    avatar_emoji = COALESCE(avatar_emoji, '⛵'),
    avatar_color = COALESCE(avatar_color, '#4A90D9')
WHERE experience_level IS NULL OR avatar_emoji IS NULL;

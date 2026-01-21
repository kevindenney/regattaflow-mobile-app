-- Add avatar fields to sailor_profiles (emoji only, no photo upload)
-- This supports crew collaboration avatars on race cards

-- Add avatar emoji field (single emoji character)
ALTER TABLE sailor_profiles
ADD COLUMN IF NOT EXISTS avatar_emoji TEXT DEFAULT '⛵';

-- Add avatar background color for initials fallback (hex color)
ALTER TABLE sailor_profiles
ADD COLUMN IF NOT EXISTS avatar_color TEXT DEFAULT '#3B82F6';

-- Add comments for documentation
COMMENT ON COLUMN sailor_profiles.avatar_emoji IS 'Single emoji character for avatar display';
COMMENT ON COLUMN sailor_profiles.avatar_color IS 'Background color for initials fallback (hex format)';

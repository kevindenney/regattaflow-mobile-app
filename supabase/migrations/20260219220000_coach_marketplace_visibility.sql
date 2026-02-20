-- Coach Marketplace Visibility Migration
-- Adds marketplace_visible field to control discovery visibility

-- Add marketplace_visible boolean to coach_profiles
ALTER TABLE coach_profiles
ADD COLUMN IF NOT EXISTS marketplace_visible BOOLEAN DEFAULT TRUE;

-- Add languages field for spoken languages
ALTER TABLE coach_profiles
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT ARRAY['English']::TEXT[];

-- Add professional_title field
ALTER TABLE coach_profiles
ADD COLUMN IF NOT EXISTS professional_title TEXT;

-- Add teaching_modalities (on_water, video_review, remote)
ALTER TABLE coach_profiles
ADD COLUMN IF NOT EXISTS teaching_modalities TEXT[] DEFAULT ARRAY['on_water']::TEXT[];

-- Add boat_classes field (Dragon, Melges, 470, etc.)
ALTER TABLE coach_profiles
ADD COLUMN IF NOT EXISTS boat_classes TEXT[] DEFAULT '{}'::TEXT[];

-- Index for marketplace queries
CREATE INDEX IF NOT EXISTS idx_coach_profiles_marketplace
ON coach_profiles(marketplace_visible, is_active, is_accepting_clients)
WHERE marketplace_visible = TRUE AND is_active = TRUE;

-- Update existing active coaches to be marketplace visible
UPDATE coach_profiles
SET marketplace_visible = TRUE
WHERE is_active = TRUE AND marketplace_visible IS NULL;

-- Comments
COMMENT ON COLUMN coach_profiles.marketplace_visible IS
'Controls whether coach appears in discovery/marketplace results. When FALSE, only existing clients can book.';

COMMENT ON COLUMN coach_profiles.languages IS
'Languages the coach can teach in';

COMMENT ON COLUMN coach_profiles.professional_title IS
'Professional title (e.g., Head Coach, Performance Coach, Tactical Coach)';

COMMENT ON COLUMN coach_profiles.teaching_modalities IS
'Available teaching methods: on_water, video_review, remote, boat_setup, etc.';

COMMENT ON COLUMN coach_profiles.boat_classes IS
'Boat classes the coach specializes in (Dragon, Melges, 470, Laser/ILCA, etc.)';

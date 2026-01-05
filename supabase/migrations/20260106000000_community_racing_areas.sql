-- Community Racing Areas Migration
-- Enables organic discovery and community validation of racing areas

-- ============================================================================
-- 1. Add community-specific columns to venue_racing_areas
-- ============================================================================

-- Add point + radius model for simpler community area creation
ALTER TABLE venue_racing_areas
ADD COLUMN IF NOT EXISTS center_lat NUMERIC,
ADD COLUMN IF NOT EXISTS center_lng NUMERIC,
ADD COLUMN IF NOT EXISTS radius_meters NUMERIC DEFAULT 2000;

-- Add source tracking (official vs community-created)
ALTER TABLE venue_racing_areas
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'official';

-- Add verification status for community areas
ALTER TABLE venue_racing_areas
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'verified';

-- Track who created community areas
ALTER TABLE venue_racing_areas
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Track confirmation count for community validation
ALTER TABLE venue_racing_areas
ADD COLUMN IF NOT EXISTS confirmation_count INTEGER DEFAULT 0;

-- Add constraints after columns exist
ALTER TABLE venue_racing_areas
ADD CONSTRAINT venue_racing_areas_source_check
CHECK (source IN ('official', 'community', 'imported'));

ALTER TABLE venue_racing_areas
ADD CONSTRAINT venue_racing_areas_verification_check
CHECK (verification_status IN ('pending', 'verified', 'disputed'));

-- Migrate existing geometry Points to center_lat/center_lng
UPDATE venue_racing_areas
SET
    center_lat = (geometry->'coordinates'->>1)::NUMERIC,
    center_lng = (geometry->'coordinates'->>0)::NUMERIC,
    radius_meters = COALESCE(radius_meters, 2000)
WHERE geometry->>'type' = 'Point'
  AND center_lat IS NULL;

-- Index for community areas pending verification
CREATE INDEX IF NOT EXISTS idx_venue_racing_areas_community_pending
    ON venue_racing_areas(verification_status, source)
    WHERE source = 'community';

-- Index for spatial queries on center point
CREATE INDEX IF NOT EXISTS idx_venue_racing_areas_center
    ON venue_racing_areas(center_lat, center_lng)
    WHERE center_lat IS NOT NULL AND center_lng IS NOT NULL;

-- ============================================================================
-- 2. Create confirmations table for community validation
-- ============================================================================

CREATE TABLE IF NOT EXISTS venue_racing_area_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    racing_area_id UUID NOT NULL REFERENCES venue_racing_areas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    confirmed_at TIMESTAMPTZ DEFAULT NOW(),
    -- User's GPS location when confirming (validates they're actually there)
    latitude NUMERIC,
    longitude NUMERIC,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(racing_area_id, user_id)
);

-- Index for efficient confirmation counting
CREATE INDEX IF NOT EXISTS idx_confirmations_area
    ON venue_racing_area_confirmations(racing_area_id);

-- ============================================================================
-- 3. Row Level Security for confirmations
-- ============================================================================

ALTER TABLE venue_racing_area_confirmations ENABLE ROW LEVEL SECURITY;

-- Anyone can see confirmations (public transparency)
CREATE POLICY "confirmations_select_all" ON venue_racing_area_confirmations
    FOR SELECT USING (true);

-- Users can only create their own confirmations
CREATE POLICY "confirmations_insert_own" ON venue_racing_area_confirmations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own confirmations
CREATE POLICY "confirmations_delete_own" ON venue_racing_area_confirmations
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 4. Auto-verification trigger
-- ============================================================================

-- Function to check and update verification status
CREATE OR REPLACE FUNCTION check_racing_area_verification()
RETURNS TRIGGER AS $$
DECLARE
    confirmation_threshold INTEGER := 3;
    current_count INTEGER;
BEGIN
    -- Count confirmations for this area
    SELECT COUNT(*) INTO current_count
    FROM venue_racing_area_confirmations
    WHERE racing_area_id = NEW.racing_area_id;

    -- Update the racing area's confirmation count and status
    UPDATE venue_racing_areas
    SET
        confirmation_count = current_count,
        verification_status = CASE
            WHEN source = 'community' AND current_count >= confirmation_threshold THEN 'verified'
            ELSE verification_status
        END
    WHERE id = NEW.racing_area_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on insert
DROP TRIGGER IF EXISTS racing_area_confirmation_trigger ON venue_racing_area_confirmations;
CREATE TRIGGER racing_area_confirmation_trigger
    AFTER INSERT ON venue_racing_area_confirmations
    FOR EACH ROW
    EXECUTE FUNCTION check_racing_area_verification();

-- Trigger on delete (to decrement count)
CREATE OR REPLACE FUNCTION decrement_racing_area_confirmation()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
BEGIN
    -- Count remaining confirmations
    SELECT COUNT(*) INTO current_count
    FROM venue_racing_area_confirmations
    WHERE racing_area_id = OLD.racing_area_id;

    -- Update the count
    UPDATE venue_racing_areas
    SET confirmation_count = current_count
    WHERE id = OLD.racing_area_id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS racing_area_confirmation_delete_trigger ON venue_racing_area_confirmations;
CREATE TRIGGER racing_area_confirmation_delete_trigger
    AFTER DELETE ON venue_racing_area_confirmations
    FOR EACH ROW
    EXECUTE FUNCTION decrement_racing_area_confirmation();

-- ============================================================================
-- 5. Update RLS for venue_racing_areas to allow community creation
-- ============================================================================

-- Allow authenticated users to create community racing areas
DROP POLICY IF EXISTS "racing_areas_insert_community" ON venue_racing_areas;
CREATE POLICY "racing_areas_insert_community" ON venue_racing_areas
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND source = 'community'
        AND created_by = auth.uid()
    );

-- Allow creators to update their own community areas (name, radius, etc.)
DROP POLICY IF EXISTS "racing_areas_update_own" ON venue_racing_areas;
CREATE POLICY "racing_areas_update_own" ON venue_racing_areas
    FOR UPDATE USING (
        source = 'community'
        AND created_by = auth.uid()
    );

-- ============================================================================
-- 6. Helper function for finding nearby racing areas
-- ============================================================================

CREATE OR REPLACE FUNCTION find_nearby_racing_areas(
    lat NUMERIC,
    lng NUMERIC,
    radius_km NUMERIC DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    venue_id TEXT,
    name TEXT,
    center_lat NUMERIC,
    center_lng NUMERIC,
    radius_meters NUMERIC,
    source TEXT,
    verification_status TEXT,
    confirmation_count INTEGER,
    distance_km NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ra.id,
        ra.venue_id,
        ra.name,
        ra.center_lat,
        ra.center_lng,
        ra.radius_meters,
        ra.source,
        ra.verification_status,
        ra.confirmation_count,
        -- Haversine distance calculation
        (6371 * acos(
            cos(radians(lat)) * cos(radians(ra.center_lat)) *
            cos(radians(ra.center_lng) - radians(lng)) +
            sin(radians(lat)) * sin(radians(ra.center_lat))
        )) AS distance_km
    FROM venue_racing_areas ra
    WHERE ra.center_lat IS NOT NULL
      AND ra.center_lng IS NOT NULL
      AND (6371 * acos(
            cos(radians(lat)) * cos(radians(ra.center_lat)) *
            cos(radians(ra.center_lng) - radians(lng)) +
            sin(radians(lat)) * sin(radians(ra.center_lat))
        )) <= radius_km
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 7. Comment documentation
-- ============================================================================

COMMENT ON COLUMN venue_racing_areas.source IS 'Origin of the area: official (admin-created), community (user-created), imported (from external data)';
COMMENT ON COLUMN venue_racing_areas.verification_status IS 'Community validation status: pending (new), verified (3+ confirmations), disputed (flagged)';
COMMENT ON COLUMN venue_racing_areas.confirmation_count IS 'Number of unique sailors who have confirmed this area exists';
COMMENT ON COLUMN venue_racing_areas.center_lat IS 'Latitude of area center (simplified point+radius model)';
COMMENT ON COLUMN venue_racing_areas.center_lng IS 'Longitude of area center (simplified point+radius model)';
COMMENT ON COLUMN venue_racing_areas.radius_meters IS 'Approximate radius of the racing area in meters';

COMMENT ON TABLE venue_racing_area_confirmations IS 'Tracks which sailors have confirmed community-created racing areas';
COMMENT ON FUNCTION find_nearby_racing_areas IS 'Find racing areas within radius_km of given coordinates using Haversine formula';

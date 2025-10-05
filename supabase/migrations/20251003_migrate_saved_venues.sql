-- Migration: Migrate Existing Saved Venues to Sailing Network Schema
-- Populates service_type, location_name, and location_region for existing saved_venues

-- ============================================================================
-- 1. Migrate existing saved_venues to new schema
-- ============================================================================

-- Update existing records with service_type and location data from sailing_venues
UPDATE public.saved_venues sv
SET
  service_type = 'venue', -- All existing records are sailing venues
  location_name = COALESCE(
    v.name,
    v.country  -- Fallback to country if venue name is null
  ),
  location_region = v.region
FROM public.sailing_venues v
WHERE sv.venue_id = v.id
  AND sv.service_type IS NULL; -- Only update records that haven't been migrated

-- ============================================================================
-- 2. Create initial location context for users with saved venues
-- ============================================================================

-- For each user, set their location context to their home venue (if they have one)
-- or their most recently saved venue
INSERT INTO public.user_location_context (
  user_id,
  current_location_name,
  current_location_region,
  current_location_coordinates,
  detection_method,
  last_updated
)
SELECT DISTINCT ON (sv.user_id)
  sv.user_id,
  sv.location_name,
  sv.location_region,
  POINT(v.coordinates_lng, v.coordinates_lat), -- PostGIS point format (lng, lat)
  'manual', -- Default detection method
  NOW()
FROM public.saved_venues sv
JOIN public.sailing_venues v ON sv.venue_id = v.id
WHERE sv.location_name IS NOT NULL
  AND NOT EXISTS (
    -- Don't insert if user already has a location context
    SELECT 1 FROM public.user_location_context ulc
    WHERE ulc.user_id = sv.user_id
  )
ORDER BY
  sv.user_id,
  sv.is_home_venue DESC, -- Prioritize home venue
  sv.created_at DESC;    -- Otherwise use most recent

-- ============================================================================
-- 3. Verification queries (for logging/debugging)
-- ============================================================================

-- Log migration results
DO $$
DECLARE
  total_saved_venues INTEGER;
  migrated_venues INTEGER;
  users_with_context INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_saved_venues FROM public.saved_venues;
  SELECT COUNT(*) INTO migrated_venues FROM public.saved_venues WHERE service_type = 'venue';
  SELECT COUNT(*) INTO users_with_context FROM public.user_location_context;

  RAISE NOTICE 'Sailing Network Migration Complete:';
  RAISE NOTICE '  - Total saved venues: %', total_saved_venues;
  RAISE NOTICE '  - Migrated to service_type=venue: %', migrated_venues;
  RAISE NOTICE '  - Users with location context: %', users_with_context;
END $$;

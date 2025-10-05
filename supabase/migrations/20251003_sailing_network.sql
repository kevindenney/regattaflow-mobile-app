-- Migration: Sailing Network - Unified Places Schema
-- Extends saved_venues to support all service types (yacht clubs, sailmakers, etc.)
-- Adds location context for multi-location sailing networks

-- ============================================================================
-- 1. Extend saved_venues table for all service types
-- ============================================================================

-- Add service type column to distinguish venues, yacht clubs, sailmakers, etc.
ALTER TABLE public.saved_venues
ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'venue';

-- Add location context columns
ALTER TABLE public.saved_venues
ADD COLUMN IF NOT EXISTS location_name TEXT;

ALTER TABLE public.saved_venues
ADD COLUMN IF NOT EXISTS location_region TEXT;

-- Add constraint for valid service types
ALTER TABLE public.saved_venues
ADD CONSTRAINT valid_service_type
CHECK (service_type IN (
  'venue',          -- Sailing venue (regatta location)
  'yacht_club',     -- Yacht club / sailing club
  'sailmaker',      -- Sail loft / sailmaker
  'chandler',       -- Chandlery / marine supply
  'rigger',         -- Rigging service
  'coach',          -- Sailing coach
  'marina',         -- Marina / harbor
  'repair',         -- Boat repair service
  'engine',         -- Engine/motor service
  'clothing',       -- Foul weather gear shop
  'other'           -- Other sailing-related service
));

-- Create indexes for efficient querying by location
CREATE INDEX IF NOT EXISTS idx_saved_venues_location
ON public.saved_venues(user_id, location_name);

CREATE INDEX IF NOT EXISTS idx_saved_venues_location_region
ON public.saved_venues(user_id, location_region);

CREATE INDEX IF NOT EXISTS idx_saved_venues_service_type
ON public.saved_venues(user_id, service_type);

-- ============================================================================
-- 2. User Location Context Table
-- ============================================================================

-- Track user's current location context for automatic location detection
CREATE TABLE IF NOT EXISTS public.user_location_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_location_name TEXT,
  current_location_region TEXT,
  current_location_coordinates POINT, -- PostGIS point (lat, lng)
  detection_method TEXT, -- 'gps' | 'manual' | 'calendar'
  last_updated TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one context per user
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_location_context ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own location context"
  ON public.user_location_context
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own location context"
  ON public.user_location_context
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own location context"
  ON public.user_location_context
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_location_context_user_id
ON public.user_location_context(user_id);

-- ============================================================================
-- 3. Helper Functions
-- ============================================================================

-- Function to get user's saved places grouped by location
CREATE OR REPLACE FUNCTION get_user_locations_summary(p_user_id UUID)
RETURNS TABLE (
  location_name TEXT,
  location_region TEXT,
  saved_count BIGINT,
  has_home_venue BOOLEAN,
  service_types TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sv.location_name,
    sv.location_region,
    COUNT(*)::BIGINT as saved_count,
    BOOL_OR(sv.is_home_venue) as has_home_venue,
    ARRAY_AGG(DISTINCT sv.service_type) as service_types
  FROM public.saved_venues sv
  WHERE sv.user_id = p_user_id
    AND sv.location_name IS NOT NULL
  GROUP BY sv.location_name, sv.location_region
  ORDER BY BOOL_OR(sv.is_home_venue) DESC, COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_locations_summary(UUID) TO authenticated;

-- Function to update user location context
CREATE OR REPLACE FUNCTION update_user_location_context(
  p_user_id UUID,
  p_location_name TEXT,
  p_location_region TEXT,
  p_coordinates POINT,
  p_detection_method TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_location_context (
    user_id,
    current_location_name,
    current_location_region,
    current_location_coordinates,
    detection_method,
    last_updated
  )
  VALUES (
    p_user_id,
    p_location_name,
    p_location_region,
    p_coordinates,
    p_detection_method,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    current_location_name = EXCLUDED.current_location_name,
    current_location_region = EXCLUDED.current_location_region,
    current_location_coordinates = EXCLUDED.current_location_coordinates,
    detection_method = EXCLUDED.detection_method,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_user_location_context(UUID, TEXT, TEXT, POINT, TEXT) TO authenticated;

-- ============================================================================
-- 4. Update saved_venues view to include location context
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.saved_venues_with_details;

-- Recreate view with service type and location
CREATE OR REPLACE VIEW public.saved_venues_with_details AS
SELECT
  sv.id AS saved_venue_id,
  sv.user_id,
  sv.notes,
  sv.is_home_venue,
  sv.service_type,
  sv.location_name,
  sv.location_region,
  sv.created_at AS saved_at,
  sv.updated_at AS saved_updated_at,
  v.id,
  v.name,
  v.country,
  v.region,
  v.venue_type,
  v.coordinates_lat,
  v.coordinates_lng,
  v.created_at AS venue_created_at,
  v.updated_at AS venue_updated_at
FROM public.saved_venues sv
JOIN public.sailing_venues v ON sv.venue_id = v.id;

-- Grant access to the view
GRANT SELECT ON public.saved_venues_with_details TO authenticated;

-- RLS for the view (inherits from saved_venues RLS)
ALTER VIEW public.saved_venues_with_details SET (security_invoker = true);

-- ============================================================================
-- 5. Comments for documentation
-- ============================================================================

COMMENT ON COLUMN public.saved_venues.service_type IS 'Type of sailing service: venue, yacht_club, sailmaker, chandler, rigger, coach, marina, repair, engine, clothing, other';
COMMENT ON COLUMN public.saved_venues.location_name IS 'Location name for grouping (e.g., "Hong Kong", "Perth")';
COMMENT ON COLUMN public.saved_venues.location_region IS 'Geographic region (e.g., "asia-pacific", "oceania")';
COMMENT ON TABLE public.user_location_context IS 'Tracks user''s current location context for automatic venue and service discovery';
COMMENT ON FUNCTION get_user_locations_summary(UUID) IS 'Returns summary of user''s saved places grouped by location';

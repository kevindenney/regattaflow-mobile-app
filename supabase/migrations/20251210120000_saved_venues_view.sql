-- =====================================================
-- Saved Venues Table and View Migration
-- Creates the saved_venues table and saved_venues_with_details view
-- Required by SailingNetworkService and SavedVenueService
-- =====================================================

-- Create saved_venues table if not exists
CREATE TABLE IF NOT EXISTS public.saved_venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    venue_id TEXT NOT NULL,
    
    -- Location context (for places not in sailing_venues table)
    service_type TEXT DEFAULT 'venue',
    location_name TEXT,
    location_region TEXT,
    
    -- User additions
    notes TEXT,
    is_home_venue BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate saves
    UNIQUE(user_id, venue_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_venues_user_id ON public.saved_venues(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_venues_venue_id ON public.saved_venues(venue_id);
CREATE INDEX IF NOT EXISTS idx_saved_venues_home ON public.saved_venues(user_id, is_home_venue) WHERE is_home_venue = true;

-- Enable RLS
ALTER TABLE public.saved_venues ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only access their own saved venues
DROP POLICY IF EXISTS "Users can view own saved venues" ON public.saved_venues;
CREATE POLICY "Users can view own saved venues" ON public.saved_venues
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own saved venues" ON public.saved_venues;
CREATE POLICY "Users can insert own saved venues" ON public.saved_venues
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own saved venues" ON public.saved_venues;
CREATE POLICY "Users can update own saved venues" ON public.saved_venues
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved venues" ON public.saved_venues;
CREATE POLICY "Users can delete own saved venues" ON public.saved_venues
    FOR DELETE USING (auth.uid() = user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_saved_venues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_saved_venues_updated_at ON public.saved_venues;
CREATE TRIGGER trigger_saved_venues_updated_at
    BEFORE UPDATE ON public.saved_venues
    FOR EACH ROW EXECUTE FUNCTION update_saved_venues_updated_at();


-- =====================================================
-- Create saved_venues_with_details view
-- Joins saved_venues with sailing_venues for complete info
-- =====================================================

DROP VIEW IF EXISTS public.saved_venues_with_details;

CREATE OR REPLACE VIEW public.saved_venues_with_details AS
SELECT 
    -- From sailing_venues (or use saved_venues data if venue not found)
    COALESCE(sv.id, s.venue_id) as id,
    s.user_id,
    COALESCE(sv.name, s.location_name, 'Unknown Venue') as name,
    COALESCE(sv.country, 'Unknown') as country,
    COALESCE(sv.region, s.location_region, 'Unknown') as region,
    
    -- Coordinates from sailing_venues
    sv.coordinates_lat,
    sv.coordinates_lng,
    
    -- From saved_venues
    s.id as saved_venue_id,
    s.service_type,
    s.location_name,
    s.location_region,
    s.notes,
    s.is_home_venue,
    s.created_at as saved_at,
    
    -- Venue metadata
    sv.venue_type,
    sv.time_zone
FROM public.saved_venues s
LEFT JOIN public.sailing_venues sv ON sv.id = s.venue_id;

-- Grant access to the view
GRANT SELECT ON public.saved_venues_with_details TO authenticated;

COMMENT ON VIEW public.saved_venues_with_details IS 'User saved venues with full venue details from sailing_venues table';


-- =====================================================
-- User location context table (for SailingNetworkService)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_location_context (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_location_name TEXT,
    current_location_region TEXT,
    current_lat NUMERIC,
    current_lng NUMERIC,
    detection_method TEXT CHECK (detection_method IN ('gps', 'manual', 'calendar')),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_location_context ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Users can view own location context" ON public.user_location_context;
CREATE POLICY "Users can view own location context" ON public.user_location_context
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert own location context" ON public.user_location_context;
CREATE POLICY "Users can upsert own location context" ON public.user_location_context
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own location context" ON public.user_location_context;
CREATE POLICY "Users can update own location context" ON public.user_location_context
    FOR UPDATE USING (auth.uid() = user_id);


-- =====================================================
-- RPC function for getting user locations summary
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_locations_summary(p_user_id UUID)
RETURNS TABLE (
    location_name TEXT,
    location_region TEXT,
    saved_count BIGINT,
    has_home_venue BOOLEAN,
    service_types TEXT[]
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(sv.country, s.location_name) as location_name,
        COALESCE(sv.region, s.location_region) as location_region,
        COUNT(*) as saved_count,
        BOOL_OR(s.is_home_venue) as has_home_venue,
        ARRAY_AGG(DISTINCT s.service_type) as service_types
    FROM public.saved_venues s
    LEFT JOIN public.sailing_venues sv ON sv.id = s.venue_id
    WHERE s.user_id = p_user_id
    GROUP BY COALESCE(sv.country, s.location_name), COALESCE(sv.region, s.location_region)
    ORDER BY saved_count DESC;
END;
$$;

COMMENT ON FUNCTION get_user_locations_summary IS 'Get summary of saved locations grouped by country/region';


-- =====================================================
-- Venue Racing Areas Migration
-- Creates tables for racing area visualization
-- =====================================================

-- =====================================================
-- RACING AREAS TABLE
-- Stores polygons and markers for venue racing areas
-- =====================================================

CREATE TABLE IF NOT EXISTS public.venue_racing_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id TEXT NOT NULL,
    
    -- Area identification
    area_name TEXT NOT NULL,
    area_type TEXT NOT NULL CHECK (area_type IN (
        'racing_area',      -- Main racing water
        'start_line',       -- Start/finish line
        'finish_line',      -- Separate finish line
        'mark',             -- Course mark/buoy
        'gate',             -- Gate between marks
        'prohibited_zone',  -- TSS, military, or other restricted area
        'practice_area',    -- Practice/warm-up area
        'spectator_zone',   -- Area for spectator boats
        'safety_zone'       -- Safety boat station area
    )),
    
    -- GeoJSON geometry - can be Point, LineString, or Polygon
    geometry JSONB NOT NULL,
    
    -- Visual styling
    stroke_color TEXT DEFAULT '#0284c7',
    stroke_width NUMERIC DEFAULT 2,
    fill_color TEXT DEFAULT '#0284c780',
    fill_opacity NUMERIC DEFAULT 0.3,
    
    -- Description and metadata
    description TEXT,
    typical_courses TEXT[],  -- e.g., ['windward_leeward', 'triangle', 'trapezoid']
    classes_used TEXT[],     -- e.g., ['Dragon', 'J/80']
    
    -- For marks/buoys
    mark_name TEXT,          -- Official mark name
    mark_type TEXT,          -- 'inflatable', 'fixed', 'government'
    rounding TEXT,           -- 'port', 'starboard', 'either'
    
    -- For prohibited zones
    restriction_reason TEXT,
    penalty_for_violation TEXT,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_venue_racing_areas_venue_id 
    ON public.venue_racing_areas(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_racing_areas_type 
    ON public.venue_racing_areas(area_type);
CREATE INDEX IF NOT EXISTS idx_venue_racing_areas_active 
    ON public.venue_racing_areas(venue_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.venue_racing_areas ENABLE ROW LEVEL SECURITY;

-- Public read access for all racing areas
CREATE POLICY "venue_racing_areas_select" ON public.venue_racing_areas
    FOR SELECT USING (true);

-- Only authenticated users can insert/update/delete
CREATE POLICY "venue_racing_areas_insert" ON public.venue_racing_areas
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "venue_racing_areas_update" ON public.venue_racing_areas
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "venue_racing_areas_delete" ON public.venue_racing_areas
    FOR DELETE USING (auth.role() = 'authenticated');

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_venue_racing_areas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER venue_racing_areas_updated_at
    BEFORE UPDATE ON public.venue_racing_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_venue_racing_areas_updated_at();

-- =====================================================
-- FLEET INFO TABLE
-- Stores fleet/class information for venues
-- =====================================================

CREATE TABLE IF NOT EXISTS public.venue_fleet_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id TEXT NOT NULL,
    
    -- Fleet identification
    boat_class TEXT NOT NULL,
    class_association TEXT,  -- e.g., 'Hong Kong Dragon Class Association'
    
    -- Activity info
    typical_fleet_size INTEGER,
    racing_frequency TEXT CHECK (racing_frequency IN ('weekly', 'biweekly', 'monthly', 'seasonal', 'annual')),
    active_seasons TEXT[],  -- e.g., ['spring', 'fall'] or ['year_round']
    
    -- Contact info
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    website TEXT,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_venue_fleet_info_venue_id 
    ON public.venue_fleet_info(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_fleet_info_class 
    ON public.venue_fleet_info(boat_class);

-- Enable RLS
ALTER TABLE public.venue_fleet_info ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "venue_fleet_info_select" ON public.venue_fleet_info
    FOR SELECT USING (true);

-- Authenticated write access
CREATE POLICY "venue_fleet_info_insert" ON public.venue_fleet_info
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "venue_fleet_info_update" ON public.venue_fleet_info
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "venue_fleet_info_delete" ON public.venue_fleet_info
    FOR DELETE USING (auth.role() = 'authenticated');

-- Updated at trigger
CREATE TRIGGER venue_fleet_info_updated_at
    BEFORE UPDATE ON public.venue_fleet_info
    FOR EACH ROW
    EXECUTE FUNCTION update_venue_racing_areas_updated_at();

COMMENT ON TABLE public.venue_racing_areas IS 'Racing area geometry and metadata for venue map visualization';
COMMENT ON TABLE public.venue_fleet_info IS 'Active fleet/class information for sailing venues';


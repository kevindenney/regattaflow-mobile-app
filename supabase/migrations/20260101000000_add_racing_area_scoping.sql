-- =====================================================
-- Racing Area Scoping for Venue Knowledge Platform
-- Allows discussions, documents, and insights to be scoped to specific racing areas
-- =====================================================

-- =====================================================
-- 1. ADD RACING AREA SCOPING TO KNOWLEDGE TABLES
-- =====================================================

-- Add racing_area_id to venue_discussions
ALTER TABLE venue_discussions
ADD COLUMN IF NOT EXISTS racing_area_id UUID REFERENCES venue_racing_areas(id) ON DELETE SET NULL;

-- Add racing_area_id to venue_knowledge_documents
ALTER TABLE venue_knowledge_documents
ADD COLUMN IF NOT EXISTS racing_area_id UUID REFERENCES venue_racing_areas(id) ON DELETE SET NULL;

-- Add racing_area_id to venue_knowledge_insights
ALTER TABLE venue_knowledge_insights
ADD COLUMN IF NOT EXISTS racing_area_id UUID REFERENCES venue_racing_areas(id) ON DELETE SET NULL;

-- Create indexes for racing area filtering
CREATE INDEX IF NOT EXISTS idx_venue_discussions_racing_area
    ON venue_discussions(racing_area_id) WHERE racing_area_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_venue_documents_racing_area
    ON venue_knowledge_documents(racing_area_id) WHERE racing_area_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_venue_insights_racing_area
    ON venue_knowledge_insights(racing_area_id) WHERE racing_area_id IS NOT NULL;

-- =====================================================
-- 2. CREATE RACE ROUTES TABLE
-- For distance races that span multiple venues
-- =====================================================

CREATE TABLE IF NOT EXISTS race_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Route identification
    name TEXT NOT NULL,
    slug TEXT UNIQUE,  -- URL-friendly name

    -- Route type
    race_type TEXT NOT NULL CHECK (race_type IN (
        'distance',       -- Long offshore race (e.g., China Coast)
        'offshore',       -- Offshore race
        'coastal',        -- Coastal passage race
        'around_island',  -- Circumnavigation race
        'feeder'          -- Feeder race to main event
    )),

    -- Start and finish venues
    start_venue_id TEXT REFERENCES sailing_venues(id) ON DELETE SET NULL,
    finish_venue_id TEXT REFERENCES sailing_venues(id) ON DELETE SET NULL,

    -- Waypoints (ordered array of venue IDs)
    waypoint_venues TEXT[],

    -- Route geometry for map display (GeoJSON LineString)
    route_geometry JSONB,

    -- Race details
    typical_distance_nm NUMERIC,
    record_time_hours NUMERIC,
    record_holder TEXT,
    record_year INTEGER,

    -- Description and history
    description TEXT,
    first_run_year INTEGER,
    organizing_club TEXT,
    website TEXT,

    -- Scheduling
    typical_month TEXT,  -- e.g., 'October', 'Easter Weekend'
    frequency TEXT CHECK (frequency IN ('annual', 'biennial', 'quadrennial', 'irregular')),

    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for race routes
CREATE INDEX IF NOT EXISTS idx_race_routes_start_venue ON race_routes(start_venue_id);
CREATE INDEX IF NOT EXISTS idx_race_routes_type ON race_routes(race_type);
CREATE INDEX IF NOT EXISTS idx_race_routes_active ON race_routes(is_active) WHERE is_active = true;

-- Generate slug from name
CREATE OR REPLACE FUNCTION generate_race_route_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL THEN
        NEW.slug = lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
        NEW.slug = trim(both '-' from NEW.slug);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER race_routes_generate_slug
    BEFORE INSERT ON race_routes
    FOR EACH ROW
    EXECUTE FUNCTION generate_race_route_slug();

-- Updated at trigger
CREATE TRIGGER race_routes_updated_at
    BEFORE UPDATE ON race_routes
    FOR EACH ROW
    EXECUTE FUNCTION update_venue_racing_areas_updated_at();

-- Enable RLS
ALTER TABLE race_routes ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "race_routes_select" ON race_routes
    FOR SELECT USING (true);

-- Authenticated write access
CREATE POLICY "race_routes_insert" ON race_routes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "race_routes_update" ON race_routes
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "race_routes_delete" ON race_routes
    FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- 3. LINK KNOWLEDGE TO RACE ROUTES
-- =====================================================

-- Add race_route_id to discussions (for distance race discussions)
ALTER TABLE venue_discussions
ADD COLUMN IF NOT EXISTS race_route_id UUID REFERENCES race_routes(id) ON DELETE SET NULL;

-- Add race_route_id to documents
ALTER TABLE venue_knowledge_documents
ADD COLUMN IF NOT EXISTS race_route_id UUID REFERENCES race_routes(id) ON DELETE SET NULL;

-- Add race_route_id to insights
ALTER TABLE venue_knowledge_insights
ADD COLUMN IF NOT EXISTS race_route_id UUID REFERENCES race_routes(id) ON DELETE SET NULL;

-- Create indexes for race route filtering
CREATE INDEX IF NOT EXISTS idx_venue_discussions_race_route
    ON venue_discussions(race_route_id) WHERE race_route_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_venue_documents_race_route
    ON venue_knowledge_documents(race_route_id) WHERE race_route_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_venue_insights_race_route
    ON venue_knowledge_insights(race_route_id) WHERE race_route_id IS NOT NULL;

-- =====================================================
-- 4. SEED HONG KONG RACING AREAS
-- =====================================================

-- Insert Hong Kong racing areas (only if Hong Kong venue exists)
INSERT INTO venue_racing_areas (venue_id, area_name, area_type, description, geometry, typical_courses, classes_used)
SELECT
    'hong-kong',
    area.area_name,
    'racing_area',
    area.description,
    area.geometry,
    area.typical_courses,
    area.classes_used
FROM (VALUES
    (
        'Victoria Harbour',
        'Main harbour racing area between Hong Kong Island and Kowloon. Popular for Sunday club races.',
        '{"type": "Point", "coordinates": [114.1694, 22.2936]}'::JSONB,
        ARRAY['windward_leeward', 'triangle', 'round_the_buoys'],
        ARRAY['Dragon', 'J/80', 'Etchells', 'Sportsboat']
    ),
    (
        'Clearwater Bay',
        'Protected bay on the east side of Hong Kong. Excellent for light wind racing with consistent sea breeze.',
        '{"type": "Point", "coordinates": [114.3012, 22.2700]}'::JSONB,
        ARRAY['windward_leeward', 'triangle'],
        ARRAY['Optimist', 'Laser', '420', '29er']
    ),
    (
        'Port Shelter',
        'Semi-protected waters ideal for cruiser racing. Home to many yacht clubs.',
        '{"type": "Point", "coordinates": [114.2792, 22.3597]}'::JSONB,
        ARRAY['windward_leeward', 'round_the_buoys', 'coastal'],
        ARRAY['IRC', 'HKPN', 'Cruiser']
    ),
    (
        'Middle Island',
        'RHKYC main racing area south of Hong Kong Island. Open water with good wind.',
        '{"type": "Point", "coordinates": [114.1960, 22.2483]}'::JSONB,
        ARRAY['windward_leeward', 'triangle', 'trapezoid'],
        ARRAY['Dragon', 'Etchells', 'J/80']
    ),
    (
        'Lamma',
        'Open water racing area near Lamma Island. More exposed conditions.',
        '{"type": "Point", "coordinates": [114.1169, 22.2108]}'::JSONB,
        ARRAY['coastal', 'distance', 'windward_leeward'],
        ARRAY['IRC', 'HKPN', 'Multihull']
    )
) AS area(area_name, description, geometry, typical_courses, classes_used)
WHERE EXISTS (SELECT 1 FROM sailing_venues WHERE id = 'hong-kong')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. SEED RACE ROUTES
-- =====================================================

INSERT INTO race_routes (
    name, race_type, start_venue_id, finish_venue_id,
    typical_distance_nm, description, typical_month, frequency, organizing_club
) VALUES
    (
        'Around the Island Race',
        'around_island',
        'hong-kong',
        'hong-kong',
        28,
        'Classic circumnavigation of Hong Kong Island. One of Hong Kong''s oldest and most prestigious races.',
        'November',
        'annual',
        'Royal Hong Kong Yacht Club'
    ),
    (
        'China Coast Regatta',
        'distance',
        'hong-kong',
        NULL,  -- Multiple destinations
        NULL,  -- Variable
        'Multi-day offshore racing event along the China coast. Races to various destinations including Sanya.',
        'October',
        'annual',
        'Royal Hong Kong Yacht Club'
    ),
    (
        'Hong Kong to Vietnam Race',
        'offshore',
        'hong-kong',
        NULL,
        700,
        'Offshore passage race from Hong Kong to Vietnam. A true bluewater challenge.',
        'February',
        'biennial',
        'Royal Hong Kong Yacht Club'
    ),
    (
        'Macau Race',
        'coastal',
        'hong-kong',
        NULL,
        35,
        'Short but tactical coastal race from Hong Kong to Macau through busy shipping lanes.',
        'Various',
        'annual',
        'Royal Hong Kong Yacht Club'
    ),
    (
        'South China Sea Race',
        'offshore',
        'hong-kong',
        NULL,
        NULL,
        'Major offshore racing event in the South China Sea. Various courses and destinations.',
        'Easter',
        'annual',
        'Royal Hong Kong Yacht Club'
    ),
    (
        'Four Peaks Race',
        'distance',
        'hong-kong',
        'hong-kong',
        75,
        'Unique multi-sport event combining sailing, running, and cycling around Hong Kong''s four highest peaks.',
        'February',
        'annual',
        'Royal Hong Kong Yacht Club'
    )
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. COMMENTS
-- =====================================================

COMMENT ON COLUMN venue_discussions.racing_area_id IS 'Optional: Scope discussion to a specific racing area within the venue';
COMMENT ON COLUMN venue_discussions.race_route_id IS 'Optional: Link discussion to a specific race route (for distance race discussions)';
COMMENT ON COLUMN venue_knowledge_documents.racing_area_id IS 'Optional: Scope document to a specific racing area';
COMMENT ON COLUMN venue_knowledge_documents.race_route_id IS 'Optional: Link document to a specific race route';
COMMENT ON TABLE race_routes IS 'Race routes for distance/offshore races that may span multiple venues';

-- Add racing_area_id to venue_discussions
ALTER TABLE venue_discussions
ADD COLUMN IF NOT EXISTS racing_area_id UUID REFERENCES venue_racing_areas(id) ON DELETE SET NULL;

-- Add racing_area_id to venue_knowledge_documents
ALTER TABLE venue_knowledge_documents
ADD COLUMN IF NOT EXISTS racing_area_id UUID REFERENCES venue_racing_areas(id) ON DELETE SET NULL;

-- Add racing_area_id to venue_knowledge_insights
ALTER TABLE venue_knowledge_insights
ADD COLUMN IF NOT EXISTS racing_area_id UUID REFERENCES venue_racing_areas(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_venue_discussions_racing_area
    ON venue_discussions(racing_area_id) WHERE racing_area_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_venue_documents_racing_area
    ON venue_knowledge_documents(racing_area_id) WHERE racing_area_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_venue_insights_racing_area
    ON venue_knowledge_insights(racing_area_id) WHERE racing_area_id IS NOT NULL;

-- Create race_routes table
CREATE TABLE IF NOT EXISTS race_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    race_type TEXT NOT NULL CHECK (race_type IN ('distance', 'offshore', 'coastal', 'around_island', 'feeder')),
    start_venue_id TEXT REFERENCES sailing_venues(id) ON DELETE SET NULL,
    finish_venue_id TEXT REFERENCES sailing_venues(id) ON DELETE SET NULL,
    waypoint_venues TEXT[],
    route_geometry JSONB,
    typical_distance_nm NUMERIC,
    record_time_hours NUMERIC,
    record_holder TEXT,
    record_year INTEGER,
    description TEXT,
    first_run_year INTEGER,
    organizing_club TEXT,
    website TEXT,
    typical_month TEXT,
    frequency TEXT CHECK (frequency IN ('annual', 'biennial', 'quadrennial', 'irregular')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE race_routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "race_routes_select" ON race_routes;
CREATE POLICY "race_routes_select" ON race_routes FOR SELECT USING (true);

DROP POLICY IF EXISTS "race_routes_insert" ON race_routes;
CREATE POLICY "race_routes_insert" ON race_routes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "race_routes_update" ON race_routes;
CREATE POLICY "race_routes_update" ON race_routes FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "race_routes_delete" ON race_routes;
CREATE POLICY "race_routes_delete" ON race_routes FOR DELETE USING (auth.role() = 'authenticated');

-- Add race_route_id columns
ALTER TABLE venue_discussions ADD COLUMN IF NOT EXISTS race_route_id UUID REFERENCES race_routes(id) ON DELETE SET NULL;
ALTER TABLE venue_knowledge_documents ADD COLUMN IF NOT EXISTS race_route_id UUID REFERENCES race_routes(id) ON DELETE SET NULL;
ALTER TABLE venue_knowledge_insights ADD COLUMN IF NOT EXISTS race_route_id UUID REFERENCES race_routes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_venue_discussions_race_route ON venue_discussions(race_route_id) WHERE race_route_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_venue_documents_race_route ON venue_knowledge_documents(race_route_id) WHERE race_route_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_venue_insights_race_route ON venue_knowledge_insights(race_route_id) WHERE race_route_id IS NOT NULL;

-- Seed race routes (using correct venue ID: hong-kong-victoria-harbor)
INSERT INTO race_routes (name, race_type, start_venue_id, finish_venue_id, typical_distance_nm, description, typical_month, frequency, organizing_club)
VALUES
    ('Around the Island Race', 'around_island', 'hong-kong-victoria-harbor', 'hong-kong-victoria-harbor', 28, 'Classic circumnavigation of Hong Kong Island.', 'November', 'annual', 'Royal Hong Kong Yacht Club'),
    ('China Coast Regatta', 'distance', 'hong-kong-victoria-harbor', NULL, NULL, 'Multi-day offshore racing along the China coast.', 'October', 'annual', 'Royal Hong Kong Yacht Club'),
    ('Hong Kong to Vietnam Race', 'offshore', 'hong-kong-victoria-harbor', NULL, 700, 'Offshore passage race from Hong Kong to Vietnam.', 'February', 'biennial', 'Royal Hong Kong Yacht Club'),
    ('Macau Race', 'coastal', 'hong-kong-victoria-harbor', NULL, 35, 'Coastal race from Hong Kong to Macau.', 'Various', 'annual', 'Royal Hong Kong Yacht Club'),
    ('South China Sea Race', 'offshore', 'hong-kong-victoria-harbor', NULL, NULL, 'Major offshore racing in the South China Sea.', 'Easter', 'annual', 'Royal Hong Kong Yacht Club'),
    ('Four Peaks Race', 'distance', 'hong-kong-victoria-harbor', 'hong-kong-victoria-harbor', 75, 'Multi-sport event combining sailing, running, and cycling.', 'February', 'annual', 'Royal Hong Kong Yacht Club')
ON CONFLICT DO NOTHING;

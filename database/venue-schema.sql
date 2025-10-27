-- Global Venue Intelligence Database Schema
-- Comprehensive schema for the 147+ sailing venues worldwide
-- Supports GPS-based detection, cultural intelligence, and racing analytics

-- Enable PostGIS for geographic queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- CORE VENUE TABLES
-- ============================================================================

-- Main sailing venues table
CREATE TABLE IF NOT EXISTS sailing_venues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  coordinates GEOGRAPHY(POINT, 4326) NOT NULL, -- PostGIS geography for GPS queries
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  venue_type TEXT CHECK (venue_type IN ('championship', 'premier', 'regional', 'local', 'club')) NOT NULL,
  established_year INTEGER,
  time_zone TEXT NOT NULL,
  data_quality TEXT CHECK (data_quality IN ('verified', 'community', 'estimated')) NOT NULL DEFAULT 'community',

  -- Searchable text vector for full-text search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', name || ' ' || country || ' ' || region)
  ) STORED,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create spatial index for fast geographic queries
CREATE INDEX IF NOT EXISTS sailing_venues_coordinates_idx ON sailing_venues USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS sailing_venues_search_idx ON sailing_venues USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS sailing_venues_region_idx ON sailing_venues (region);
CREATE INDEX IF NOT EXISTS sailing_venues_type_idx ON sailing_venues (venue_type);

-- Yacht clubs associated with venues
CREATE TABLE IF NOT EXISTS yacht_clubs (
  id TEXT PRIMARY KEY,
  venue_id TEXT REFERENCES sailing_venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT,
  founded INTEGER,
  coordinates GEOGRAPHY(POINT, 4326),
  website TEXT,
  prestige_level TEXT CHECK (prestige_level IN ('international', 'national', 'regional', 'local')) NOT NULL DEFAULT 'local',
  membership_type TEXT CHECK (membership_type IN ('private', 'public', 'reciprocal')) NOT NULL DEFAULT 'public',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS yacht_clubs_venue_idx ON yacht_clubs (venue_id);

-- Club facilities
CREATE TABLE IF NOT EXISTS club_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id TEXT REFERENCES yacht_clubs(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- marina, launch_ramp, dry_storage, repair, restaurant, accommodation
  name TEXT NOT NULL,
  available BOOLEAN DEFAULT true,
  reservation_required BOOLEAN DEFAULT false,
  contact_info JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Venue sailing conditions
CREATE TABLE IF NOT EXISTS venue_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id TEXT REFERENCES sailing_venues(id) ON DELETE CASCADE,
  wind_patterns JSONB NOT NULL DEFAULT '[]',
  current_data JSONB DEFAULT '[]',
  tidal_information JSONB,
  typical_conditions JSONB NOT NULL,
  seasonal_variations JSONB DEFAULT '[]',
  hazards JSONB DEFAULT '[]',
  racing_areas JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cultural profiles for venues
CREATE TABLE IF NOT EXISTS cultural_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id TEXT REFERENCES sailing_venues(id) ON DELETE CASCADE,
  primary_languages JSONB NOT NULL DEFAULT '[]',
  sailing_culture JSONB NOT NULL,
  racing_customs JSONB DEFAULT '[]',
  social_protocols JSONB DEFAULT '[]',
  economic_factors JSONB NOT NULL,
  regulatory_environment JSONB NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weather source configurations
CREATE TABLE IF NOT EXISTS weather_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id TEXT REFERENCES sailing_venues(id) ON DELETE CASCADE,
  primary_source JSONB NOT NULL,
  secondary_sources JSONB DEFAULT '[]',
  marine_sources JSONB DEFAULT '[]',
  local_sources JSONB DEFAULT '[]',
  update_frequency INTEGER NOT NULL DEFAULT 6, -- hours
  reliability DECIMAL(3,2) DEFAULT 0.8,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- USER INTERACTION TABLES
-- ============================================================================

-- User venue profiles and history
CREATE TABLE IF NOT EXISTS user_venue_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id TEXT REFERENCES sailing_venues(id) ON DELETE CASCADE,

  -- Venue relationship
  home_venue BOOLEAN DEFAULT false,
  favorited BOOLEAN DEFAULT false,
  visit_count INTEGER DEFAULT 0,
  first_visit TIMESTAMPTZ,
  last_visit TIMESTAMPTZ,

  -- Familiarity and performance
  familiarity_level TEXT CHECK (familiarity_level IN ('expert', 'experienced', 'intermediate', 'novice', 'first_time')) DEFAULT 'first_time',
  racing_history JSONB DEFAULT '{}',

  -- Local connections
  local_contacts JSONB DEFAULT '[]',
  club_memberships JSONB DEFAULT '[]',
  crew_connections JSONB DEFAULT '[]',

  -- User preferences
  preferences JSONB DEFAULT '{}',
  notes TEXT,

  -- Travel planning
  travel_history JSONB DEFAULT '[]',
  upcoming_events JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, venue_id)
);

CREATE INDEX IF NOT EXISTS user_venue_profiles_user_idx ON user_venue_profiles (user_id);
CREATE INDEX IF NOT EXISTS user_venue_profiles_venue_idx ON user_venue_profiles (venue_id);
CREATE INDEX IF NOT EXISTS user_venue_profiles_home_idx ON user_venue_profiles (user_id) WHERE home_venue = true;
CREATE INDEX IF NOT EXISTS user_venue_profiles_favorites_idx ON user_venue_profiles (user_id) WHERE favorited = true;

-- Venue transitions for analytics
CREATE TABLE IF NOT EXISTS venue_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  from_venue_id TEXT REFERENCES sailing_venues(id),
  to_venue_id TEXT REFERENCES sailing_venues(id) NOT NULL,
  transition_type TEXT CHECK (transition_type IN ('first_visit', 'returning', 'traveling', 'relocating')) NOT NULL,
  transition_date TIMESTAMPTZ DEFAULT NOW(),
  adaptation_required BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS venue_transitions_user_idx ON venue_transitions (user_id);
CREATE INDEX IF NOT EXISTS venue_transitions_date_idx ON venue_transitions (transition_date);

-- Venue detection tracking
CREATE TABLE IF NOT EXISTS venue_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id TEXT REFERENCES sailing_venues(id) ON DELETE CASCADE,
  detection_method TEXT CHECK (detection_method IN ('gps', 'network', 'manual')) NOT NULL,
  accuracy_meters INTEGER,
  detected_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate detections within short time frame
  UNIQUE(user_id, venue_id, DATE_TRUNC('hour', detected_at))
);

-- ============================================================================
-- RACING EVENTS AND CALENDAR
-- ============================================================================

-- Global racing events
CREATE TABLE IF NOT EXISTS global_racing_events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  venue_id TEXT REFERENCES sailing_venues(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  registration_deadline DATE,
  event_type TEXT CHECK (event_type IN ('regatta', 'championship', 'qualifier', 'clinic', 'social')) NOT NULL,
  boat_classes TEXT[] DEFAULT '{}',
  entry_fee INTEGER,
  currency TEXT,
  website TEXT,

  -- Event intelligence
  expected_fleet_size INTEGER,
  competition_level TEXT CHECK (competition_level IN ('international', 'national', 'regional', 'club')) NOT NULL,
  conditions TEXT,
  cultural_events JSONB DEFAULT '[]',
  accommodation_info TEXT,

  -- RegattaFlow features
  document_parsing_enabled BOOLEAN DEFAULT true,
  ai_strategy_available BOOLEAN DEFAULT true,
  local_knowledge_level TEXT CHECK (local_knowledge_level IN ('expert', 'good', 'basic', 'limited')) DEFAULT 'basic',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS racing_events_venue_idx ON global_racing_events (venue_id);
CREATE INDEX IF NOT EXISTS racing_events_dates_idx ON global_racing_events (start_date, end_date);
CREATE INDEX IF NOT EXISTS racing_events_type_idx ON global_racing_events (event_type);

-- ============================================================================
-- SCHEMA CREATION FUNCTIONS (for SupabaseVenueService initialization)
-- ============================================================================

-- Function to create venues schema
CREATE OR REPLACE FUNCTION create_venues_schema()
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  -- This function ensures the sailing_venues table exists
  -- The actual table creation is handled by the main schema above
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sailing_venues') THEN
    RAISE EXCEPTION 'sailing_venues table does not exist';
  END IF;

  RETURN 'sailing_venues schema verified';
END;
$$;

-- Function to create clubs schema
CREATE OR REPLACE FUNCTION create_clubs_schema()
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  -- This function ensures the yacht_clubs table exists
  -- The actual table creation is handled by the main schema above
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'yacht_clubs') THEN
    RAISE EXCEPTION 'yacht_clubs table does not exist';
  END IF;

  RETURN 'yacht_clubs schema verified';
END;
$$;

-- Function to create user venue profiles schema
CREATE OR REPLACE FUNCTION create_user_venue_profiles_schema()
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  -- This function ensures the user_venue_profiles table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_venue_profiles') THEN
    RAISE EXCEPTION 'user_venue_profiles table does not exist';
  END IF;

  RETURN 'user_venue_profiles schema verified';
END;
$$;

-- Function to create venue transitions schema
CREATE OR REPLACE FUNCTION create_venue_transitions_schema()
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  -- This function ensures the venue_transitions table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'venue_transitions') THEN
    RAISE EXCEPTION 'venue_transitions table does not exist';
  END IF;

  RETURN 'venue_transitions schema verified';
END;
$$;

-- Function to create racing events schema
CREATE OR REPLACE FUNCTION create_racing_events_schema()
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  -- This function ensures the global_racing_events table exists
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'global_racing_events') THEN
    RAISE EXCEPTION 'global_racing_events table does not exist';
  END IF;

  RETURN 'global_racing_events schema verified';
END;
$$;

-- ============================================================================
-- DATABASE FUNCTIONS FOR GEOGRAPHIC QUERIES
-- ============================================================================

-- Find venues by location (GPS coordinates)
CREATE OR REPLACE FUNCTION find_venues_by_location(
  lat DECIMAL,
  lng DECIMAL,
  radius_km INTEGER DEFAULT 50
) RETURNS TABLE (
  id TEXT,
  name TEXT,
  coordinates_lat DECIMAL,
  coordinates_lng DECIMAL,
  country TEXT,
  region TEXT,
  venue_type TEXT,
  distance_km DECIMAL
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.name,
    ST_Y(v.coordinates::geometry) as coordinates_lat,
    ST_X(v.coordinates::geometry) as coordinates_lng,
    v.country,
    v.region,
    v.venue_type,
    ROUND((ST_Distance(v.coordinates, ST_MakePoint(lng, lat)::geography) / 1000)::numeric, 2) as distance_km
  FROM sailing_venues v
  WHERE ST_DWithin(v.coordinates, ST_MakePoint(lng, lat)::geography, radius_km * 1000)
  ORDER BY v.coordinates <-> ST_MakePoint(lng, lat)::geography
  LIMIT 10;
END;
$$;

-- Get nearby venues for circuit planning
CREATE OR REPLACE FUNCTION get_nearby_venues(
  lat DECIMAL,
  lng DECIMAL,
  max_distance_km INTEGER DEFAULT 500,
  result_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  id TEXT,
  name TEXT,
  coordinates_lat DECIMAL,
  coordinates_lng DECIMAL,
  country TEXT,
  region TEXT,
  venue_type TEXT,
  distance_km DECIMAL
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.name,
    ST_Y(v.coordinates::geometry) as coordinates_lat,
    ST_X(v.coordinates::geometry) as coordinates_lng,
    v.country,
    v.region,
    v.venue_type,
    ROUND((ST_Distance(v.coordinates, ST_MakePoint(lng, lat)::geography) / 1000)::numeric, 2) as distance_km
  FROM sailing_venues v
  WHERE ST_DWithin(v.coordinates, ST_MakePoint(lng, lat)::geography, max_distance_km * 1000)
  ORDER BY v.coordinates <-> ST_MakePoint(lng, lat)::geography
  LIMIT result_limit;
END;
$$;

-- Get venue analytics
CREATE OR REPLACE FUNCTION get_venue_analytics()
RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalVenues', (SELECT COUNT(*) FROM sailing_venues),
    'venuesByType', (
      SELECT json_object_agg(venue_type, count)
      FROM (
        SELECT venue_type, COUNT(*) as count
        FROM sailing_venues
        GROUP BY venue_type
      ) t
    ),
    'venuesByRegion', (
      SELECT json_object_agg(region, count)
      FROM (
        SELECT region, COUNT(*) as count
        FROM sailing_venues
        GROUP BY region
      ) t
    ),
    'topVenuesByVisits', (
      SELECT json_agg(
        json_build_object(
          'venue', row_to_json(v.*),
          'visit_count', p.total_visits
        )
      )
      FROM (
        SELECT venue_id, SUM(visit_count) as total_visits
        FROM user_venue_profiles
        GROUP BY venue_id
        ORDER BY total_visits DESC
        LIMIT 10
      ) p
      JOIN sailing_venues v ON v.id = p.venue_id
    ),
    'recentTransitions', (
      SELECT COUNT(*)
      FROM venue_transitions
      WHERE transition_date > NOW() - INTERVAL '7 days'
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on user-specific tables
ALTER TABLE user_venue_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_detections ENABLE ROW LEVEL SECURITY;

-- Users can only access their own venue profiles
CREATE POLICY "Users can view own venue profiles" ON user_venue_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own venue profiles" ON user_venue_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own venue profiles" ON user_venue_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only access their own transitions
CREATE POLICY "Users can view own transitions" ON venue_transitions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transitions" ON venue_transitions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only access their own detections
CREATE POLICY "Users can view own detections" ON venue_detections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own detections" ON venue_detections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public read access to venue data
CREATE POLICY "Anyone can view venues" ON sailing_venues
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view yacht clubs" ON yacht_clubs
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view club facilities" ON club_facilities
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view venue conditions" ON venue_conditions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view cultural profiles" ON cultural_profiles
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view weather sources" ON weather_sources
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view racing events" ON global_racing_events
  FOR SELECT USING (true);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update user venue profile visit counts
CREATE OR REPLACE FUNCTION increment_visit_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment visit count when last_visit is updated
  IF NEW.last_visit IS DISTINCT FROM OLD.last_visit THEN
    NEW.visit_count = COALESCE(OLD.visit_count, 0) + 1;

    -- Set first_visit if not already set
    IF OLD.first_visit IS NULL THEN
      NEW.first_visit = NEW.last_visit;
    END IF;
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_visit_count
  BEFORE UPDATE ON user_venue_profiles
  FOR EACH ROW EXECUTE FUNCTION increment_visit_count();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER trigger_update_sailing_venues_updated_at
  BEFORE UPDATE ON sailing_venues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_yacht_clubs_updated_at
  BEFORE UPDATE ON yacht_clubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_venue_conditions_updated_at
  BEFORE UPDATE ON venue_conditions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_cultural_profiles_updated_at
  BEFORE UPDATE ON cultural_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_weather_sources_updated_at
  BEFORE UPDATE ON weather_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_racing_events_updated_at
  BEFORE UPDATE ON global_racing_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA INSERTION (for testing)
-- ============================================================================

-- Insert sample venues (this would be expanded to 147+ venues)
INSERT INTO sailing_venues (id, name, coordinates, country, region, venue_type, time_zone, data_quality)
VALUES
  ('hong-kong-victoria-harbor', 'Hong Kong - Victoria Harbor', ST_MakePoint(114.1694, 22.3193)::geography, 'Hong Kong SAR', 'asia-pacific', 'premier', 'Asia/Hong_Kong', 'verified'),
  ('cowes-solent', 'Cowes - The Solent', ST_MakePoint(-1.2982, 50.7612)::geography, 'United Kingdom', 'europe', 'premier', 'Europe/London', 'verified'),
  ('san-francisco-bay', 'San Francisco Bay', ST_MakePoint(-122.4194, 37.7749)::geography, 'United States', 'north-america', 'championship', 'America/Los_Angeles', 'verified')
ON CONFLICT (id) DO NOTHING;

-- Insert sample yacht clubs
INSERT INTO yacht_clubs (id, venue_id, name, short_name, prestige_level, membership_type)
VALUES
  ('rhkyc', 'hong-kong-victoria-harbor', 'Royal Hong Kong Yacht Club', 'RHKYC', 'international', 'private'),
  ('royal-yacht-squadron', 'cowes-solent', 'Royal Yacht Squadron', 'RYS', 'international', 'private'),
  ('st-francis-yacht-club', 'san-francisco-bay', 'St. Francis Yacht Club', 'StFYC', 'international', 'private')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Complete venue information view
CREATE OR REPLACE VIEW venue_intelligence_view AS
SELECT
  v.*,
  ST_Y(v.coordinates::geometry) as latitude,
  ST_X(v.coordinates::geometry) as longitude,

  -- Aggregate yacht clubs
  COALESCE(
    (SELECT json_agg(yc.* ORDER BY yc.prestige_level DESC)
     FROM yacht_clubs yc WHERE yc.venue_id = v.id),
    '[]'::json
  ) as yacht_clubs,

  -- Venue conditions
  (SELECT row_to_json(vc.*) FROM venue_conditions vc WHERE vc.venue_id = v.id) as conditions,

  -- Cultural profile
  (SELECT row_to_json(cp.*) FROM cultural_profiles cp WHERE cp.venue_id = v.id) as cultural_context,

  -- Weather sources
  (SELECT row_to_json(ws.*) FROM weather_sources ws WHERE ws.venue_id = v.id) as weather_sources

FROM sailing_venues v;

COMMENT ON VIEW venue_intelligence_view IS 'Complete venue intelligence data with all related information';
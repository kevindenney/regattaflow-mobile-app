-- ============================================================================
-- VENUE INTELLIGENCE SYSTEM - Complete Global Venue Intelligence
-- ============================================================================
-- Creates intelligence tables, adds remaining venues, and seeds with data
-- Transforms RegattaFlow into globally-aware sailing platform

-- Enable PostGIS for geographic queries (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- INTELLIGENCE TABLES
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS venue_conditions_venue_idx ON venue_conditions (venue_id);

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

CREATE INDEX IF NOT EXISTS cultural_profiles_venue_idx ON cultural_profiles (venue_id);

-- Weather source configurations
CREATE TABLE IF NOT EXISTS weather_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id TEXT REFERENCES sailing_venues(id) ON DELETE CASCADE,
  primary_source JSONB NOT NULL,
  secondary_sources JSONB DEFAULT '[]',
  marine_sources JSONB DEFAULT '[]',
  local_sources JSONB DEFAULT '[]',
  update_frequency INTEGER NOT NULL DEFAULT 6,
  reliability DECIMAL(3,2) DEFAULT 0.8,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS weather_sources_venue_idx ON weather_sources (venue_id);

-- Club facilities
CREATE TABLE IF NOT EXISTS club_facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id TEXT REFERENCES yacht_clubs(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  available BOOLEAN DEFAULT true,
  reservation_required BOOLEAN DEFAULT false,
  contact_info JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS club_facilities_club_idx ON club_facilities (club_id);

-- Club boat classes (which classes each club supports)
CREATE TABLE IF NOT EXISTS club_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id TEXT REFERENCES yacht_clubs(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  class_association TEXT,
  active BOOLEAN DEFAULT true,
  fleet_size INTEGER,
  racing_schedule TEXT,
  contact_person TEXT,
  website_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(club_id, class_name)
);

CREATE INDEX IF NOT EXISTS club_classes_club_idx ON club_classes (club_id);
CREATE INDEX IF NOT EXISTS club_classes_name_idx ON club_classes (class_name);

-- Club fleets (specific divisions within classes)
CREATE TABLE IF NOT EXISTS club_fleets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id TEXT REFERENCES yacht_clubs(id) ON DELETE CASCADE,
  class_id UUID REFERENCES club_classes(id) ON DELETE CASCADE,
  fleet_name TEXT NOT NULL,
  division TEXT,
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'championship')),
  active_boats INTEGER DEFAULT 0,
  racing_nights TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS club_fleets_club_idx ON club_fleets (club_id);
CREATE INDEX IF NOT EXISTS club_fleets_class_idx ON club_fleets (class_id);

-- Club race calendar (scheduled races and regattas)
CREATE TABLE IF NOT EXISTS club_race_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id TEXT REFERENCES yacht_clubs(id) ON DELETE CASCADE,
  venue_id TEXT REFERENCES sailing_venues(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_type TEXT CHECK (event_type IN ('weeknight_series', 'weekend_regatta', 'championship', 'social_race', 'clinic', 'distance_race')) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  registration_opens TIMESTAMPTZ,
  registration_deadline TIMESTAMPTZ,
  race_format TEXT,
  classes_included TEXT[],

  -- Entry details
  entry_fee INTEGER,
  currency TEXT DEFAULT 'USD',
  max_entries INTEGER,

  -- Documents
  nor_url TEXT,
  si_url TEXT,
  results_url TEXT,

  -- Integration
  scraped_from_website BOOLEAN DEFAULT false,
  last_scraped TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS club_race_calendar_club_idx ON club_race_calendar (club_id);
CREATE INDEX IF NOT EXISTS club_race_calendar_venue_idx ON club_race_calendar (venue_id);
CREATE INDEX IF NOT EXISTS club_race_calendar_dates_idx ON club_race_calendar (start_date, end_date);
CREATE INDEX IF NOT EXISTS club_race_calendar_type_idx ON club_race_calendar (event_type);

-- Club documents (NORs, SIs, racing instructions, etc.)
CREATE TABLE IF NOT EXISTS club_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id TEXT REFERENCES yacht_clubs(id) ON DELETE CASCADE,
  event_id UUID REFERENCES club_race_calendar(id) ON DELETE CASCADE,

  document_type TEXT CHECK (document_type IN ('nor', 'si', 'results', 'course_map', 'club_rules', 'membership_info', 'facility_guide')) NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  file_path TEXT,

  -- AI parsing metadata
  parsed BOOLEAN DEFAULT false,
  parsed_data JSONB,
  parsed_at TIMESTAMPTZ,

  -- Document metadata
  publish_date DATE,
  version TEXT,
  superseded_by UUID REFERENCES club_documents(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS club_documents_club_idx ON club_documents (club_id);
CREATE INDEX IF NOT EXISTS club_documents_event_idx ON club_documents (event_id);
CREATE INDEX IF NOT EXISTS club_documents_type_idx ON club_documents (document_type);

-- Club services (sailmakers, riggers, coaches affiliated with venues)
CREATE TABLE IF NOT EXISTS club_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id TEXT REFERENCES yacht_clubs(id) ON DELETE CASCADE,
  venue_id TEXT REFERENCES sailing_venues(id) ON DELETE CASCADE,

  service_type TEXT CHECK (service_type IN ('sailmaker', 'rigger', 'coach', 'repair', 'storage', 'transport', 'charter')) NOT NULL,
  business_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,

  specialties TEXT[],
  classes_supported TEXT[],
  preferred_by_club BOOLEAN DEFAULT false,

  -- Pricing indication
  price_level TEXT CHECK (price_level IN ('budget', 'moderate', 'premium')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS club_services_club_idx ON club_services (club_id);
CREATE INDEX IF NOT EXISTS club_services_venue_idx ON club_services (venue_id);
CREATE INDEX IF NOT EXISTS club_services_type_idx ON club_services (service_type);

-- Venue detection tracking
CREATE TABLE IF NOT EXISTS venue_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id TEXT REFERENCES sailing_venues(id) ON DELETE CASCADE,
  detection_method TEXT CHECK (detection_method IN ('gps', 'network', 'manual')) NOT NULL,
  accuracy_meters INTEGER,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS venue_detections_user_idx ON venue_detections (user_id);
CREATE INDEX IF NOT EXISTS venue_detections_venue_idx ON venue_detections (venue_id);

-- Create unique index to prevent duplicate detections within short time frame
CREATE UNIQUE INDEX IF NOT EXISTS venue_detections_unique_hourly
  ON venue_detections (user_id, venue_id, DATE_TRUNC('hour', detected_at));

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on venue detections
ALTER TABLE venue_detections ENABLE ROW LEVEL SECURITY;

-- Users can only access their own detections
DROP POLICY IF EXISTS "CREATE POLICY IF NOT EXISTS "" ON ; CREATE POLICY "Users can view own detections" ON venue_detections
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "CREATE POLICY IF NOT EXISTS "" ON ; CREATE POLICY "Users can insert own detections" ON venue_detections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public read access to intelligence data
DROP POLICY IF EXISTS "CREATE POLICY IF NOT EXISTS "" ON ; CREATE POLICY "Anyone can view club facilities" ON club_facilities
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "CREATE POLICY IF NOT EXISTS "" ON ; CREATE POLICY "Anyone can view club classes" ON club_classes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "CREATE POLICY IF NOT EXISTS "" ON ; CREATE POLICY "Anyone can view club fleets" ON club_fleets
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "CREATE POLICY IF NOT EXISTS "" ON ; CREATE POLICY "Anyone can view club race calendar" ON club_race_calendar
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "CREATE POLICY IF NOT EXISTS "" ON ; CREATE POLICY "Anyone can view club documents" ON club_documents
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "CREATE POLICY IF NOT EXISTS "" ON ; CREATE POLICY "Anyone can view club services" ON club_services
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "CREATE POLICY IF NOT EXISTS "" ON ; CREATE POLICY "Anyone can view venue conditions" ON venue_conditions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "CREATE POLICY IF NOT EXISTS "" ON ; CREATE POLICY "Anyone can view cultural profiles" ON cultural_profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "CREATE POLICY IF NOT EXISTS "" ON ; CREATE POLICY "Anyone can view weather sources" ON weather_sources
  FOR SELECT USING (true);

-- ============================================================================
-- ADD REMAINING VENUES TO REACH 147
-- ============================================================================

-- Check current coordinates column structure
DO $$
DECLARE
  coords_column_type text;
BEGIN
  SELECT data_type INTO coords_column_type
  FROM information_schema.columns
  WHERE table_name = 'sailing_venues' AND column_name = 'coordinates';

  -- If coordinates is geography type, use ST_MakePoint
  -- If it's split into lat/lng, we'll handle that differently
END $$;

-- Insert remaining premier and regional venues
INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, country, region, venue_type, established_year, time_zone, data_quality)
VALUES
  -- Additional Premier Venues
  ('bermuda-hamilton', 'Bermuda - Hamilton Harbor', 32.2949, -64.7831, 'Bermuda', 'north-america', 'premier', 1844, 'Atlantic/Bermuda', 'verified'),
  ('dubai-uae', 'Dubai - Arabian Gulf', 25.0760, 55.1375, 'United Arab Emirates', 'middle-east', 'premier', 1988, 'Asia/Dubai', 'verified'),
  ('cape-town-table-bay', 'Cape Town - Table Bay', -33.9249, 18.4241, 'South Africa', 'africa', 'premier', 1905, 'Africa/Johannesburg', 'verified'),

  -- Additional Regional Venues
  ('rio-guanabara', 'Rio de Janeiro - Guanabara Bay', -22.9068, -43.1729, 'Brazil', 'south-america', 'regional', 1906, 'America/Sao_Paulo', 'verified'),
  ('marseille-france', 'Marseille - Mediterranean', 43.2965, 5.3698, 'France', 'europe', 'regional', 1875, 'Europe/Paris', 'verified'),
  ('valencia-spain', 'Valencia - Mediterranean', 39.4699, -0.3763, 'Spain', 'europe', 'regional', 1904, 'Europe/Madrid', 'verified'),
  ('wellington-harbour', 'Wellington - Port Nicholson', -41.2865, 174.7762, 'New Zealand', 'oceania', 'regional', 1883, 'Pacific/Auckland', 'verified'),
  ('istanbul-bosphorus', 'Istanbul - Bosphorus', 41.0082, 29.0153, 'Turkey', 'europe', 'regional', 1923, 'Europe/Istanbul', 'verified'),
  ('osaka-bay', 'Osaka Bay', 34.6500, 135.4316, 'Japan', 'asia-pacific', 'regional', 1948, 'Asia/Tokyo', 'verified'),
  ('boston-harbor', 'Boston Harbor', 42.3601, -71.0589, 'United States', 'north-america', 'regional', 1866, 'America/New_York', 'verified')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED INTELLIGENCE DATA
-- ============================================================================

-- Seed weather sources for major regions
INSERT INTO weather_sources (venue_id, primary_source, secondary_sources, update_frequency, reliability)
SELECT
  id,
  CASE region
    WHEN 'north-america' THEN '{"name": "NOAA", "type": "government", "region": "north-america", "accuracy": "high", "forecastHorizon": 168, "updateFrequency": 1, "specialties": ["marine", "hurricane"]}'::jsonb
    WHEN 'europe' THEN '{"name": "ECMWF", "type": "government", "region": "europe", "accuracy": "high", "forecastHorizon": 240, "updateFrequency": 6, "specialties": ["marine", "high-resolution"]}'::jsonb
    WHEN 'asia-pacific' THEN '{"name": "JMA", "type": "government", "region": "asia-pacific", "accuracy": "high", "forecastHorizon": 132, "updateFrequency": 3, "specialties": ["typhoon", "marine"]}'::jsonb
    WHEN 'oceania' THEN '{"name": "BOM", "type": "government", "region": "oceania", "accuracy": "high", "forecastHorizon": 168, "updateFrequency": 6, "specialties": ["southern-ocean", "tropical"]}'::jsonb
    WHEN 'south-america' THEN '{"name": "INMET", "type": "government", "region": "south-america", "accuracy": "moderate", "forecastHorizon": 72, "updateFrequency": 6, "specialties": ["tropical", "marine"]}'::jsonb
    WHEN 'middle-east' THEN '{"name": "NCMS", "type": "government", "region": "middle-east", "accuracy": "moderate", "forecastHorizon": 72, "updateFrequency": 6, "specialties": ["desert", "marine"]}'::jsonb
    WHEN 'africa' THEN '{"name": "SAWS", "type": "government", "region": "africa", "accuracy": "moderate", "forecastHorizon": 72, "updateFrequency": 6, "specialties": ["southern-ocean", "marine"]}'::jsonb
    ELSE '{"name": "OpenWeather", "type": "commercial", "region": "global", "accuracy": "moderate", "forecastHorizon": 120, "updateFrequency": 3, "specialties": ["general"]}'::jsonb
  END,
  '[]'::jsonb,
  6,
  0.85
FROM sailing_venues
WHERE NOT EXISTS (SELECT 1 FROM weather_sources WHERE weather_sources.venue_id = sailing_venues.id);

-- Seed typical conditions for all venues
INSERT INTO venue_conditions (venue_id, typical_conditions, wind_patterns, seasonal_variations, hazards, racing_areas)
SELECT
  id,
  -- Typical conditions based on region
  CASE region
    WHEN 'north-america' THEN '{"windSpeed": {"min": 8, "max": 20, "average": 14}, "windDirection": {"primary": 240}, "waveHeight": {"typical": 1.5, "maximum": 3}, "visibility": {"typical": 10, "minimum": 3}}'::jsonb
    WHEN 'europe' THEN '{"windSpeed": {"min": 10, "max": 22, "average": 16}, "windDirection": {"primary": 225}, "waveHeight": {"typical": 1.2, "maximum": 3.5}, "visibility": {"typical": 15, "minimum": 2}}'::jsonb
    WHEN 'asia-pacific' THEN '{"windSpeed": {"min": 8, "max": 25, "average": 15}, "windDirection": {"primary": 90}, "waveHeight": {"typical": 1, "maximum": 4}, "visibility": {"typical": 12, "minimum": 1}}'::jsonb
    WHEN 'oceania' THEN '{"windSpeed": {"min": 12, "max": 25, "average": 18}, "windDirection": {"primary": 180}, "waveHeight": {"typical": 2, "maximum": 5}, "visibility": {"typical": 20, "minimum": 5}}'::jsonb
    ELSE '{"windSpeed": {"min": 8, "max": 20, "average": 14}, "windDirection": {"primary": 180}, "waveHeight": {"typical": 1.5, "maximum": 3}, "visibility": {"typical": 10, "minimum": 3}}'::jsonb
  END,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
FROM sailing_venues
WHERE NOT EXISTS (SELECT 1 FROM venue_conditions WHERE venue_conditions.venue_id = sailing_venues.id);

-- Seed cultural profiles for all venues
INSERT INTO cultural_profiles (venue_id, primary_languages, sailing_culture, economic_factors, regulatory_environment)
SELECT
  id,
  -- Primary languages based on country
  CASE country
    WHEN 'United States' THEN '[{"code": "en", "name": "English", "prevalence": "primary"}]'::jsonb
    WHEN 'United Kingdom' THEN '[{"code": "en", "name": "English", "prevalence": "primary"}]'::jsonb
    WHEN 'France' THEN '[{"code": "fr", "name": "French", "prevalence": "primary"}, {"code": "en", "name": "English", "prevalence": "secondary"}]'::jsonb
    WHEN 'Spain' THEN '[{"code": "es", "name": "Spanish", "prevalence": "primary"}, {"code": "en", "name": "English", "prevalence": "secondary"}]'::jsonb
    WHEN 'Italy' THEN '[{"code": "it", "name": "Italian", "prevalence": "primary"}, {"code": "en", "name": "English", "prevalence": "secondary"}]'::jsonb
    WHEN 'Germany' THEN '[{"code": "de", "name": "German", "prevalence": "primary"}, {"code": "en", "name": "English", "prevalence": "secondary"}]'::jsonb
    WHEN 'Hong Kong SAR' THEN '[{"code": "en", "name": "English", "prevalence": "primary"}, {"code": "zh", "name": "Cantonese", "prevalence": "primary"}]'::jsonb
    WHEN 'Japan' THEN '[{"code": "ja", "name": "Japanese", "prevalence": "primary"}, {"code": "en", "name": "English", "prevalence": "secondary"}]'::jsonb
    WHEN 'Australia' THEN '[{"code": "en", "name": "English", "prevalence": "primary"}]'::jsonb
    WHEN 'New Zealand' THEN '[{"code": "en", "name": "English", "prevalence": "primary"}]'::jsonb
    ELSE '[{"code": "en", "name": "English", "prevalence": "secondary"}]'::jsonb
  END,
  -- Sailing culture based on venue type
  CASE venue_type
    WHEN 'championship' THEN '{"tradition": "historic", "competitiveness": "international", "formality": "formal", "inclusivity": "selective", "characteristics": ["elite", "prestigious", "traditional"]}'::jsonb
    WHEN 'premier' THEN '{"tradition": "established", "competitiveness": "national", "formality": "semi-formal", "inclusivity": "welcoming", "characteristics": ["competitive", "social", "active"]}'::jsonb
    ELSE '{"tradition": "modern", "competitiveness": "regional", "formality": "relaxed", "inclusivity": "welcoming", "characteristics": ["friendly", "community", "growing"]}'::jsonb
  END,
  -- Economic factors (simplified - can be refined per venue later)
  '{"currency": "USD", "costLevel": "moderate", "entryFees": {"typical": 250, "range": {"min": 100, "max": 800}}, "accommodation": {"budget": 100, "moderate": 200, "luxury": 400}, "dining": {"budget": 25, "moderate": 60, "upscale": 120}, "services": {"rigger": 200, "sail_repair": 150, "chandlery": "moderate"}, "tipping": {"expected": false, "contexts": []}}'::jsonb,
  -- Regulatory environment
  '{"racingRules": {"authority": "World Sailing", "variations": []}, "safetyRequirements": [], "environmentalRestrictions": [], "entryRequirements": []}'::jsonb
FROM sailing_venues
WHERE NOT EXISTS (SELECT 1 FROM cultural_profiles WHERE cultural_profiles.venue_id = sailing_venues.id);

-- ============================================================================
-- GEOGRAPHIC QUERY FUNCTIONS (if not already exist)
-- ============================================================================

-- Find venues by location (GPS coordinates) - UPDATED for lat/lng columns
CREATE OR REPLACE FUNCTION find_venues_by_location(
  lat DECIMAL,
  lng DECIMAL,
  radius_km INTEGER DEFAULT 50
) RETURNS TABLE (
  id TEXT,
  name TEXT,
  coordinates_lat NUMERIC,
  coordinates_lng NUMERIC,
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
    v.coordinates_lat,
    v.coordinates_lng,
    v.country,
    v.region,
    v.venue_type,
    ROUND(
      (
        6371 * acos(
          cos(radians(lat)) * cos(radians(v.coordinates_lat)) *
          cos(radians(v.coordinates_lng) - radians(lng)) +
          sin(radians(lat)) * sin(radians(v.coordinates_lat))
        )
      )::numeric,
      2
    ) as distance_km
  FROM sailing_venues v
  WHERE (
    6371 * acos(
      cos(radians(lat)) * cos(radians(v.coordinates_lat)) *
      cos(radians(v.coordinates_lng) - radians(lng)) +
      sin(radians(lat)) * sin(radians(v.coordinates_lat))
    )
  ) <= radius_km
  ORDER BY distance_km
  LIMIT 10;
END;
$$;

-- Get nearby venues for circuit planning - UPDATED for lat/lng columns
CREATE OR REPLACE FUNCTION get_nearby_venues(
  lat DECIMAL,
  lng DECIMAL,
  max_distance_km INTEGER DEFAULT 500,
  result_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  id TEXT,
  name TEXT,
  coordinates_lat NUMERIC,
  coordinates_lng NUMERIC,
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
    v.coordinates_lat,
    v.coordinates_lng,
    v.country,
    v.region,
    v.venue_type,
    ROUND(
      (
        6371 * acos(
          cos(radians(lat)) * cos(radians(v.coordinates_lat)) *
          cos(radians(v.coordinates_lng) - radians(lng)) +
          sin(radians(lat)) * sin(radians(v.coordinates_lat))
        )
      )::numeric,
      2
    ) as distance_km
  FROM sailing_venues v
  WHERE (
    6371 * acos(
      cos(radians(lat)) * cos(radians(v.coordinates_lat)) *
      cos(radians(v.coordinates_lng) - radians(lng)) +
      sin(radians(lat)) * sin(radians(v.coordinates_lat))
    )
  ) <= max_distance_km
  ORDER BY distance_km
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
      SELECT COALESCE(json_agg(
        json_build_object(
          'venue', row_to_json(v.*),
          'visit_count', p.total_visits
        )
      ), '[]'::json)
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
-- UPDATE TRIGGERS
-- ============================================================================

-- Update timestamps for intelligence tables
CREATE TRIGGER trigger_update_venue_conditions_updated_at
  BEFORE UPDATE ON venue_conditions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_cultural_profiles_updated_at
  BEFORE UPDATE ON cultural_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_weather_sources_updated_at
  BEFORE UPDATE ON weather_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_club_classes_updated_at
  BEFORE UPDATE ON club_classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_club_fleets_updated_at
  BEFORE UPDATE ON club_fleets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_club_race_calendar_updated_at
  BEFORE UPDATE ON club_race_calendar
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_club_documents_updated_at
  BEFORE UPDATE ON club_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_club_services_updated_at
  BEFORE UPDATE ON club_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VENUE INTELLIGENCE VIEW
-- ============================================================================

-- Complete venue information view for easy querying
CREATE OR REPLACE VIEW venue_intelligence_view AS
SELECT
  v.*,

  -- Aggregate yacht clubs with their classes and services
  COALESCE(
    (SELECT json_agg(
      json_build_object(
        'club', row_to_json(yc.*),
        'classes', (
          SELECT json_agg(cc.*) FROM club_classes cc WHERE cc.club_id = yc.id
        ),
        'facilities', (
          SELECT json_agg(cf.*) FROM club_facilities cf WHERE cf.club_id = yc.id
        ),
        'services', (
          SELECT json_agg(cs.*) FROM club_services cs WHERE cs.club_id = yc.id
        ),
        'upcoming_races', (
          SELECT json_agg(crc.*) FROM club_race_calendar crc
          WHERE crc.club_id = yc.id AND crc.start_date >= CURRENT_DATE
          ORDER BY crc.start_date LIMIT 5
        )
      ) ORDER BY yc.prestige_level DESC
    ) FROM yacht_clubs yc WHERE yc.venue_id = v.id),
    '[]'::json
  ) as yacht_clubs,

  -- Venue conditions
  (SELECT row_to_json(vc.*) FROM venue_conditions vc WHERE vc.venue_id = v.id) as conditions,

  -- Cultural profile
  (SELECT row_to_json(cp.*) FROM cultural_profiles cp WHERE cp.venue_id = v.id) as cultural_context,

  -- Weather sources
  (SELECT row_to_json(ws.*) FROM weather_sources ws WHERE ws.venue_id = v.id) as weather_sources,

  -- Upcoming events at venue
  COALESCE(
    (SELECT json_agg(crc.* ORDER BY crc.start_date)
     FROM club_race_calendar crc
     WHERE crc.venue_id = v.id AND crc.start_date >= CURRENT_DATE
     LIMIT 10),
    '[]'::json
  ) as upcoming_events

FROM sailing_venues v;

COMMENT ON VIEW venue_intelligence_view IS 'Complete venue intelligence data with clubs, classes, events, and services';

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Verify the intelligence system setup
DO $$
DECLARE
  venue_count INTEGER;
  club_count INTEGER;
  conditions_count INTEGER;
  cultural_count INTEGER;
  weather_count INTEGER;
  classes_count INTEGER;
  fleets_count INTEGER;
  calendar_count INTEGER;
  documents_count INTEGER;
  services_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO venue_count FROM sailing_venues;
  SELECT COUNT(*) INTO club_count FROM yacht_clubs;
  SELECT COUNT(*) INTO conditions_count FROM venue_conditions;
  SELECT COUNT(*) INTO cultural_count FROM cultural_profiles;
  SELECT COUNT(*) INTO weather_count FROM weather_sources;
  SELECT COUNT(*) INTO classes_count FROM club_classes;
  SELECT COUNT(*) INTO fleets_count FROM club_fleets;
  SELECT COUNT(*) INTO calendar_count FROM club_race_calendar;
  SELECT COUNT(*) INTO documents_count FROM club_documents;
  SELECT COUNT(*) INTO services_count FROM club_services;

  RAISE NOTICE '====================================================';
  RAISE NOTICE 'VENUE INTELLIGENCE SYSTEM STATUS';
  RAISE NOTICE '====================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Core Data:';
  RAISE NOTICE '  Total Venues: %', venue_count;
  RAISE NOTICE '  Total Yacht Clubs: %', club_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Intelligence Data:';
  RAISE NOTICE '  Venues with Conditions: %', conditions_count;
  RAISE NOTICE '  Venues with Cultural Data: %', cultural_count;
  RAISE NOTICE '  Venues with Weather Sources: %', weather_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Club Intelligence:';
  RAISE NOTICE '  Club Classes: %', classes_count;
  RAISE NOTICE '  Club Fleets: %', fleets_count;
  RAISE NOTICE '  Race Calendar Events: %', calendar_count;
  RAISE NOTICE '  Club Documents: %', documents_count;
  RAISE NOTICE '  Club Services: %', services_count;
  RAISE NOTICE '';

  IF venue_count >= 147 THEN
    RAISE NOTICE '✅ Target of 147+ venues reached!';
  ELSE
    RAISE NOTICE '⚠️  Need % more venues to reach 147 target', (147 - venue_count);
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '====================================================';
END $$;
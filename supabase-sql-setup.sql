-- RegattaFlow Venue Intelligence Schema
-- Execute this SQL in your Supabase Dashboard SQL Editor

-- Create sailing_venues table
CREATE TABLE IF NOT EXISTS sailing_venues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  coordinates_lat DECIMAL(10, 8) NOT NULL,
  coordinates_lng DECIMAL(11, 8) NOT NULL,
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  venue_type TEXT CHECK (venue_type IN ('championship', 'premier', 'regional', 'local', 'club')) NOT NULL,
  established_year INTEGER,
  time_zone TEXT NOT NULL,
  data_quality TEXT CHECK (data_quality IN ('verified', 'community', 'estimated')) NOT NULL DEFAULT 'community',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create yacht_clubs table
CREATE TABLE IF NOT EXISTS yacht_clubs (
  id TEXT PRIMARY KEY,
  venue_id TEXT REFERENCES sailing_venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT,
  founded INTEGER,
  coordinates_lat DECIMAL(10, 8),
  coordinates_lng DECIMAL(11, 8),
  website TEXT,
  prestige_level TEXT CHECK (prestige_level IN ('international', 'national', 'regional', 'local')) NOT NULL DEFAULT 'local',
  membership_type TEXT CHECK (membership_type IN ('private', 'public', 'reciprocal')) NOT NULL DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS sailing_venues_region_idx ON sailing_venues (region);
CREATE INDEX IF NOT EXISTS sailing_venues_type_idx ON sailing_venues (venue_type);
CREATE INDEX IF NOT EXISTS yacht_clubs_venue_idx ON yacht_clubs (venue_id);

-- Enable Row Level Security (optional - for user data protection)
ALTER TABLE sailing_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE yacht_clubs ENABLE ROW LEVEL SECURITY;

-- Create public read policies (venues are publicly readable)
CREATE POLICY "Anyone can view venues" ON sailing_venues
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view yacht clubs" ON yacht_clubs
  FOR SELECT USING (true);

-- Insert 12 major global sailing venues
INSERT INTO sailing_venues (id, name, coordinates_lat, coordinates_lng, country, region, venue_type, time_zone, data_quality)
VALUES
  ('hong-kong-victoria-harbor', 'Hong Kong - Victoria Harbor', 22.3193, 114.1694, 'Hong Kong SAR', 'asia-pacific', 'premier', 'Asia/Hong_Kong', 'verified'),
  ('cowes-solent', 'Cowes - The Solent', 50.7612, -1.2982, 'United Kingdom', 'europe', 'premier', 'Europe/London', 'verified'),
  ('san-francisco-bay', 'San Francisco Bay', 37.7749, -122.4194, 'United States', 'north-america', 'championship', 'America/Los_Angeles', 'verified'),
  ('auckland-hauraki-gulf', 'Auckland - Hauraki Gulf', -36.8485, 174.7633, 'New Zealand', 'oceania', 'championship', 'Pacific/Auckland', 'verified'),
  ('porto-cervo-sardinia', 'Porto Cervo - Sardinia', 41.1375, 9.5367, 'Italy', 'europe', 'premier', 'Europe/Rome', 'verified'),
  ('newport-rhode-island', 'Newport - Rhode Island', 41.4901, -71.3128, 'United States', 'north-america', 'championship', 'America/New_York', 'verified'),
  ('sydney-harbor', 'Sydney Harbor', -33.8688, 151.2093, 'Australia', 'oceania', 'premier', 'Australia/Sydney', 'verified'),
  ('kiel-week', 'Kiel - Baltic Sea', 54.3233, 10.1394, 'Germany', 'europe', 'championship', 'Europe/Berlin', 'verified'),
  ('valencia-spain', 'Valencia - Mediterranean', 39.4699, -0.3763, 'Spain', 'europe', 'premier', 'Europe/Madrid', 'verified'),
  ('rio-de-janeiro-guanabara', 'Rio de Janeiro - Guanabara Bay', -22.9068, -43.1729, 'Brazil', 'south-america', 'championship', 'America/Sao_Paulo', 'verified'),
  ('enoshima-japan', 'Enoshima - Sagami Bay', 35.3048, 139.4813, 'Japan', 'asia-pacific', 'championship', 'Asia/Tokyo', 'verified'),
  ('marseille-france', 'Marseille - Mediterranean', 43.2965, 5.3698, 'France', 'europe', 'championship', 'Europe/Paris', 'verified')
ON CONFLICT (id) DO NOTHING;

-- Insert prestigious yacht clubs
INSERT INTO yacht_clubs (id, venue_id, name, short_name, prestige_level, membership_type)
VALUES
  ('rhkyc', 'hong-kong-victoria-harbor', 'Royal Hong Kong Yacht Club', 'RHKYC', 'international', 'private'),
  ('royal-yacht-squadron', 'cowes-solent', 'Royal Yacht Squadron', 'RYS', 'international', 'private'),
  ('st-francis-yacht-club', 'san-francisco-bay', 'St. Francis Yacht Club', 'StFYC', 'international', 'private'),
  ('rnzys', 'auckland-hauraki-gulf', 'Royal New Zealand Yacht Squadron', 'RNZYS', 'international', 'private'),
  ('yccs', 'porto-cervo-sardinia', 'Yacht Club Costa Smeralda', 'YCCS', 'international', 'private'),
  ('nyyc', 'newport-rhode-island', 'New York Yacht Club', 'NYYC', 'international', 'private'),
  ('cyca', 'sydney-harbor', 'Cruising Yacht Club of Australia', 'CYCA', 'international', 'private'),
  ('kieler-yacht-club', 'kiel-week', 'Kieler Yacht-Club', 'KYC', 'international', 'private'),
  ('real-club-nautico-valencia', 'valencia-spain', 'Real Club Náutico de Valencia', 'RCNV', 'national', 'private'),
  ('iate-clube-do-rio', 'rio-de-janeiro-guanabara', 'Iate Clube do Rio de Janeiro', 'ICRJ', 'national', 'private')
ON CONFLICT (id) DO NOTHING;

-- Verification query
SELECT 'RegattaFlow Venue Intelligence Schema deployed successfully! 🚀' as result;
SELECT
  'Venues created: ' || COUNT(*) as venues_count
FROM sailing_venues;
SELECT
  'Yacht clubs created: ' || COUNT(*) as clubs_count
FROM yacht_clubs;
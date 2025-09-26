-- Create sailing_venues table for RegattaFlow Global Venue Intelligence
-- Run this directly in Supabase SQL Editor

-- Create the main sailing venues table
CREATE TABLE IF NOT EXISTS sailing_venues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  coordinates_lng DECIMAL NOT NULL,
  coordinates_lat DECIMAL NOT NULL,
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
  prestige_level TEXT CHECK (prestige_level IN ('international', 'national', 'regional', 'local')) NOT NULL DEFAULT 'local',
  membership_type TEXT CHECK (membership_type IN ('private', 'public', 'reciprocal')) NOT NULL DEFAULT 'public',
  founded INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample venues
INSERT INTO sailing_venues (id, name, coordinates_lng, coordinates_lat, country, region, venue_type, time_zone, established_year, data_quality)
VALUES
  ('hong-kong-victoria-harbor', 'Hong Kong - Victoria Harbor', 114.1694, 22.3193, 'Hong Kong SAR', 'asia-pacific', 'premier', 'Asia/Hong_Kong', 1849, 'verified'),
  ('cowes-solent', 'Cowes - The Solent', -1.2982, 50.7612, 'United Kingdom', 'europe', 'premier', 'Europe/London', 1815, 'verified'),
  ('americas-cup-san-francisco', 'America''s Cup San Francisco Bay', -122.4194, 37.7749, 'United States', 'north-america', 'championship', 'America/Los_Angeles', 2013, 'verified'),
  ('americas-cup-auckland', 'America''s Cup Auckland', 174.7633, -36.8485, 'New Zealand', 'oceania', 'championship', 'Pacific/Auckland', 2000, 'verified'),
  ('olympic-tokyo-enoshima', 'Olympic Sailing Venue - Enoshima', 139.4757, 35.3037, 'Japan', 'asia-pacific', 'championship', 'Asia/Tokyo', 1964, 'verified'),
  ('newport-rhode-island', 'Newport, Rhode Island', -71.3128, 41.4901, 'United States', 'north-america', 'premier', 'America/New_York', 1844, 'verified'),
  ('sydney-harbour', 'Sydney Harbour', 151.2093, -33.8688, 'Australia', 'oceania', 'premier', 'Australia/Sydney', 1862, 'verified'),
  ('chicago-great-lakes', 'Chicago - Great Lakes', -87.6298, 41.8781, 'United States', 'north-america', 'regional', 'America/Chicago', NULL, 'community'),
  ('palma-mallorca', 'Palma de Mallorca', 2.6502, 39.5696, 'Spain', 'europe', 'regional', 'Europe/Madrid', NULL, 'community'),
  ('singapore-marina-bay', 'Singapore - Marina Bay', 103.8198, 1.3521, 'Singapore', 'asia-pacific', 'regional', 'Asia/Singapore', NULL, 'community'),
  ('st-thomas-usvi', 'St. Thomas, US Virgin Islands', -64.9631, 18.3381, 'US Virgin Islands', 'caribbean', 'regional', 'America/Puerto_Rico', 1960, 'verified'),
  ('bvi-tortola', 'British Virgin Islands - Tortola', -64.6208, 18.4207, 'British Virgin Islands', 'caribbean', 'regional', 'America/Puerto_Rico', 1970, 'verified')
ON CONFLICT (id) DO NOTHING;

-- Insert sample yacht clubs
INSERT INTO yacht_clubs (id, venue_id, name, short_name, prestige_level, membership_type, founded)
VALUES
  ('rhkyc', 'hong-kong-victoria-harbor', 'Royal Hong Kong Yacht Club', 'RHKYC', 'international', 'private', 1849),
  ('royal-yacht-squadron', 'cowes-solent', 'Royal Yacht Squadron', 'RYS', 'international', 'private', 1815),
  ('st-francis-yacht-club', 'americas-cup-san-francisco', 'St. Francis Yacht Club', 'StFYC', 'international', 'private', NULL),
  ('royal-new-zealand-yacht-squadron', 'americas-cup-auckland', 'Royal New Zealand Yacht Squadron', 'RNZYS', 'international', 'private', NULL),
  ('enoshima-yacht-club', 'olympic-tokyo-enoshima', 'Enoshima Yacht Club', NULL, 'national', 'public', NULL),
  ('new-york-yacht-club', 'newport-rhode-island', 'New York Yacht Club', 'NYYC', 'international', 'private', 1844),
  ('cruising-yacht-club-australia', 'sydney-harbour', 'Cruising Yacht Club of Australia', 'CYCA', 'international', 'private', 1862),
  ('st-thomas-yacht-club', 'st-thomas-usvi', 'St. Thomas Yacht Club', 'STYC', 'regional', 'private', 1963)
ON CONFLICT (id) DO NOTHING;

-- Verify the data
SELECT COUNT(*) as venue_count FROM sailing_venues;
SELECT COUNT(*) as club_count FROM yacht_clubs;
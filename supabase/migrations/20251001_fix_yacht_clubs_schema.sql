-- ============================================================================
-- FIX YACHT CLUBS SCHEMA AND ADD DATA
-- ============================================================================
-- Drops existing yacht_clubs table if it has wrong schema
-- Recreates with correct TEXT venue_id to match sailing_venues.id

-- Drop existing table if it has UUID venue_id (incompatible with TEXT sailing_venues.id)
DROP TABLE IF EXISTS yacht_clubs CASCADE;

-- Create yacht_clubs table with TEXT venue_id
CREATE TABLE yacht_clubs (
  id TEXT PRIMARY KEY,
  venue_id TEXT NOT NULL REFERENCES sailing_venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT,
  founded INTEGER,
  website TEXT,
  prestige_level TEXT CHECK (prestige_level IN ('international', 'national', 'regional', 'local')) NOT NULL DEFAULT 'local',
  membership_type TEXT CHECK (membership_type IN ('private', 'public', 'reciprocal')) NOT NULL DEFAULT 'public',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS yacht_clubs_venue_idx ON yacht_clubs (venue_id);
CREATE INDEX IF NOT EXISTS yacht_clubs_prestige_idx ON yacht_clubs (prestige_level);

-- Insert yacht clubs for major venues
INSERT INTO yacht_clubs (id, venue_id, name, short_name, prestige_level, membership_type, founded, website)
VALUES
  -- USA Premier Clubs - East Coast
  ('new-york-yacht-club', 'newport-rhode-island-nyyc', 'New York Yacht Club', 'NYYC', 'international', 'private', 1844, 'https://www.nyyc.org'),
  ('eastern-yacht-club', 'marthas-vineyard', 'Eastern Yacht Club', 'EYC', 'national', 'private', 1870, 'https://www.easternyachtclub.org'),
  ('nantucket-yacht-club', 'nantucket-massachusetts', 'Nantucket Yacht Club', 'NYC', 'national', 'private', 1894, 'https://www.nantucketyachtclub.org'),
  ('beverly-yacht-club', 'marion-buzzards-bay', 'Beverly Yacht Club', 'BYC', 'regional', 'private', 1872, 'https://www.beverlyyachtclub.com'),
  ('annapolis-yacht-club', 'annapolis-chesapeake', 'Annapolis Yacht Club', 'AYC', 'national', 'private', 1886, 'https://www.annapolisyc.org'),
  ('chesapeake-bay-yacht-club', 'annapolis-chesapeake', 'Chesapeake Bay Yacht Club', 'CBYC', 'regional', 'public', 1897, NULL),
  ('key-west-yacht-club', 'key-west-florida', 'Key West Yacht Club', 'KWYC', 'regional', 'private', 1953, 'https://www.keywestyachtclub.net'),

  -- USA Premier Clubs - West Coast
  ('san-diego-yacht-club', 'san-diego-california', 'San Diego Yacht Club', 'SDYC', 'international', 'private', 1886, 'https://www.sdyc.org'),
  ('santa-barbara-yacht-club', 'santa-barbara-california', 'Santa Barbara Yacht Club', 'SBYC', 'regional', 'private', 1925, 'https://www.sbyc.org'),
  ('corinthian-yacht-club-sf', 'sausalito-california', 'Corinthian Yacht Club', 'CYC', 'regional', 'private', 1886, 'https://www.cyc.org'),
  ('st-francis-yacht-club', 'sausalito-california', 'St. Francis Yacht Club', 'StFYC', 'international', 'private', 1927, 'https://www.stfyc.com'),
  ('seattle-yacht-club', 'seattle-puget-sound', 'Seattle Yacht Club', 'SYC', 'national', 'private', 1892, 'https://www.seattleyachtclub.org'),

  -- USA Great Lakes
  ('chicago-yacht-club', 'chicago-lake-michigan', 'Chicago Yacht Club', 'CYC', 'national', 'private', 1875, 'https://www.chicagoyachtclub.org'),
  ('columbia-yacht-club', 'chicago-lake-michigan', 'Columbia Yacht Club', 'CoYC', 'regional', 'private', 1892, 'https://www.columbiayachtclub.com'),

  -- Canadian Clubs
  ('royal-vancouver-yacht-club', 'vancouver-english-bay', 'Royal Vancouver Yacht Club', 'RVYC', 'national', 'private', 1903, 'https://www.rvyc.bc.ca'),
  ('royal-nova-scotia-yacht-squadron', 'halifax-nova-scotia', 'Royal Nova Scotia Yacht Squadron', 'RNSYS', 'national', 'private', 1837, 'https://www.rnsys.com'),

  -- European Clubs - Scandinavia
  ('royal-gothenburg-yacht-club', 'gothenburg-sweden', 'Kungliga Göteborgs Segelsällskap', 'KGSS', 'national', 'private', 1877, 'https://www.kgss.se'),
  ('royal-norwegian-yacht-club', 'oslo-fjord', 'Kongelig Norsk Seilforening', 'KNS', 'national', 'private', 1883, 'https://www.kns.no'),
  ('royal-swedish-yacht-club', 'stockholm-archipelago', 'Kungliga Svenska Segelsällskapet', 'KSSS', 'national', 'private', 1830, 'https://www.ksss.se'),

  -- European Clubs - Mediterranean
  ('club-nautico-ibiza', 'ibiza-balearic', 'Club Náutico de Ibiza', 'CNI', 'regional', 'private', 1971, NULL),
  ('yacht-club-antibes', 'antibes-france', 'Yacht Club d''Antibes', 'YCA', 'national', 'private', 1963, 'https://www.ycantibes.com'),
  ('yacht-club-portofino', 'portofino-italy', 'Yacht Club Portofino', 'YCP', 'national', 'private', 1932, NULL),
  ('yacht-club-monaco', 'nice-french-riviera', 'Yacht Club de Monaco', 'YCM', 'international', 'private', 1953, 'https://www.yacht-club-monaco.mc'),

  -- Caribbean Clubs
  ('club-nautico-san-juan', 'puerto-rico-san-juan', 'Club Náutico de San Juan', 'CNSJ', 'regional', 'private', 1940, NULL),
  ('nassau-yacht-club', 'bahamas-nassau', 'Nassau Yacht Club', 'NYC', 'regional', 'private', 1927, NULL),

  -- Pacific Clubs
  ('waikiki-yacht-club', 'honolulu-oahu', 'Waikiki Yacht Club', 'WYC', 'regional', 'private', 1955, 'https://www.waikikiyachtclub.org'),
  ('hawaii-yacht-club', 'honolulu-oahu', 'Hawaii Yacht Club', 'HYC', 'regional', 'private', 1901, 'https://www.hawaiiyachtclub.org');

-- Verify insertion
SELECT COUNT(*) as yacht_clubs_count FROM yacht_clubs;

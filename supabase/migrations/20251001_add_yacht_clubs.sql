-- ============================================================================
-- ADD YACHT CLUBS FOR GLOBAL VENUES
-- ============================================================================
-- Adds yacht clubs for major sailing venues
-- Ensures venue_id matches sailing_venues.id type (TEXT)

-- Create yacht_clubs table if it doesn't exist (with TEXT venue_id)
CREATE TABLE IF NOT EXISTS yacht_clubs (
  id TEXT PRIMARY KEY,
  venue_id TEXT REFERENCES sailing_venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT,
  founded INTEGER,
  website TEXT,
  prestige_level TEXT CHECK (prestige_level IN ('international', 'national', 'regional', 'local')) NOT NULL DEFAULT 'local',
  membership_type TEXT CHECK (membership_type IN ('private', 'public', 'reciprocal')) NOT NULL DEFAULT 'public',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS yacht_clubs_venue_idx ON yacht_clubs (venue_id);

-- Insert yacht clubs for major venues
INSERT INTO yacht_clubs (id, venue_id, name, short_name, prestige_level, membership_type, founded)
VALUES
  -- USA Premier Clubs
  ('new-york-yacht-club', 'newport-rhode-island-nyyc', 'New York Yacht Club', 'NYYC', 'international', 'private', 1844),
  ('eastern-yacht-club', 'marthas-vineyard', 'Eastern Yacht Club', 'EYC', 'national', 'private', 1870),
  ('nantucket-yacht-club', 'nantucket-massachusetts', 'Nantucket Yacht Club', 'NYC', 'national', 'private', 1894),
  ('beverly-yacht-club', 'marion-buzzards-bay', 'Beverly Yacht Club', 'BYC', 'regional', 'private', 1872),
  ('annapolis-yacht-club', 'annapolis-chesapeake', 'Annapolis Yacht Club', 'AYC', 'national', 'private', 1886),
  ('key-west-yacht-club', 'key-west-florida', 'Key West Yacht Club', 'KWYC', 'regional', 'private', 1953),

  -- West Coast Clubs
  ('san-diego-yacht-club', 'san-diego-california', 'San Diego Yacht Club', 'SDYC', 'international', 'private', 1886),
  ('santa-barbara-yacht-club', 'santa-barbara-california', 'Santa Barbara Yacht Club', 'SBYC', 'regional', 'private', 1925),
  ('corinthian-yacht-club-sf', 'sausalito-california', 'Corinthian Yacht Club', 'CYC', 'regional', 'private', 1886),
  ('st-francis-yacht-club', 'sausalito-california', 'St. Francis Yacht Club', 'StFYC', 'international', 'private', 1927),

  -- Canadian Clubs
  ('royal-vancouver-yacht-club', 'vancouver-english-bay', 'Royal Vancouver Yacht Club', 'RVYC', 'national', 'private', 1903),
  ('royal-nova-scotia-yacht-squadron', 'halifax-nova-scotia', 'Royal Nova Scotia Yacht Squadron', 'RNSYS', 'national', 'private', 1837),

  -- European Clubs
  ('royal-gothenburg-yacht-club', 'gothenburg-sweden', 'Kungliga Göteborgs Segelsällskap', 'KGSS', 'national', 'private', 1877),
  ('royal-norwegian-yacht-club', 'oslo-fjord', 'Kongelig Norsk Seilforening', 'KNS', 'national', 'private', 1883),
  ('club-nautico-ibiza', 'ibiza-balearic', 'Club Náutico de Ibiza', 'CNI', 'regional', 'private', 1971),
  ('yacht-club-antibes', 'antibes-france', 'Yacht Club d''Antibes', 'YCA', 'national', 'private', 1963),
  ('yacht-club-portofino', 'portofino-italy', 'Yacht Club Portofino', 'YCP', 'national', 'private', 1932),

  -- Caribbean Clubs
  ('club-nautico-san-juan', 'puerto-rico-san-juan', 'Club Náutico de San Juan', 'CNSJ', 'regional', 'private', 1940),
  ('nassau-yacht-club', 'bahamas-nassau', 'Nassau Yacht Club', 'NYC', 'regional', 'private', 1927),

  -- Pacific Clubs
  ('waikiki-yacht-club', 'honolulu-oahu', 'Waikiki Yacht Club', 'WYC', 'regional', 'private', 1955),
  ('hawaii-yacht-club', 'honolulu-oahu', 'Hawaii Yacht Club', 'HYC', 'regional', 'private', 1901)

ON CONFLICT (id) DO NOTHING;

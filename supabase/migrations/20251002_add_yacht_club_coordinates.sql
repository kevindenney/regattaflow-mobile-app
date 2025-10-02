-- ============================================================================
-- ADD YACHT CLUB COORDINATES
-- ============================================================================
-- Adds coordinate columns to yacht_clubs table so clubs can have their own
-- physical locations instead of using their parent venue's coordinates

-- Add coordinate columns to yacht_clubs table
ALTER TABLE yacht_clubs
ADD COLUMN IF NOT EXISTS coordinates_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS coordinates_lng DOUBLE PRECISION;

-- Create spatial index for yacht club coordinates
CREATE INDEX IF NOT EXISTS yacht_clubs_coordinates_idx
ON yacht_clubs (coordinates_lat, coordinates_lng);

-- Update yacht clubs with actual coordinates
-- These are approximate clubhouse locations near their respective venues

-- USA East Coast
UPDATE yacht_clubs SET coordinates_lat = 41.4901, coordinates_lng = -71.3128 WHERE id = 'new-york-yacht-club'; -- Newport Harbor Station
UPDATE yacht_clubs SET coordinates_lat = 41.3888, coordinates_lng = -70.6394 WHERE id = 'eastern-yacht-club'; -- Marblehead
UPDATE yacht_clubs SET coordinates_lat = 41.2833, coordinates_lng = -70.0995 WHERE id = 'nantucket-yacht-club'; -- Nantucket Harbor
UPDATE yacht_clubs SET coordinates_lat = 41.7001, coordinates_lng = -70.7647 WHERE id = 'beverly-yacht-club'; -- Marion Harbor
UPDATE yacht_clubs SET coordinates_lat = 38.9784, coordinates_lng = -76.4951 WHERE id = 'annapolis-yacht-club'; -- Annapolis Harbor
UPDATE yacht_clubs SET coordinates_lat = 38.9784, coordinates_lng = -76.4951 WHERE id = 'chesapeake-bay-yacht-club'; -- Annapolis area
UPDATE yacht_clubs SET coordinates_lat = 24.5551, coordinates_lng = -81.7800 WHERE id = 'key-west-yacht-club'; -- Key West Harbor

-- USA West Coast
UPDATE yacht_clubs SET coordinates_lat = 32.7157, coordinates_lng = -117.1611 WHERE id = 'san-diego-yacht-club'; -- San Diego Bay
UPDATE yacht_clubs SET coordinates_lat = 34.4208, coordinates_lng = -119.6982 WHERE id = 'santa-barbara-yacht-club'; -- Santa Barbara Harbor
UPDATE yacht_clubs SET coordinates_lat = 37.8591, coordinates_lng = -122.4852 WHERE id = 'corinthian-yacht-club-sf'; -- Sausalito
UPDATE yacht_clubs SET coordinates_lat = 37.8591, coordinates_lng = -122.4852 WHERE id = 'st-francis-yacht-club'; -- San Francisco Bay (near Golden Gate)
UPDATE yacht_clubs SET coordinates_lat = 47.6062, coordinates_lng = -122.3321 WHERE id = 'seattle-yacht-club'; -- Lake Washington

-- USA Great Lakes
UPDATE yacht_clubs SET coordinates_lat = 41.8781, coordinates_lng = -87.6298 WHERE id = 'chicago-yacht-club'; -- Monroe Harbor
UPDATE yacht_clubs SET coordinates_lat = 41.8781, coordinates_lng = -87.6298 WHERE id = 'columbia-yacht-club'; -- Chicago waterfront

-- Canadian Clubs
UPDATE yacht_clubs SET coordinates_lat = 49.2827, coordinates_lng = -123.1207 WHERE id = 'royal-vancouver-yacht-club'; -- Burrard Inlet
UPDATE yacht_clubs SET coordinates_lat = 44.6488, coordinates_lng = -63.5752 WHERE id = 'royal-nova-scotia-yacht-squadron'; -- Halifax Harbor

-- Scandinavian Clubs
UPDATE yacht_clubs SET coordinates_lat = 57.7089, coordinates_lng = 11.9746 WHERE id = 'royal-gothenburg-yacht-club'; -- Gothenburg Harbor
UPDATE yacht_clubs SET coordinates_lat = 59.9139, coordinates_lng = 10.7522 WHERE id = 'royal-norwegian-yacht-club'; -- Oslo Fjord
UPDATE yacht_clubs SET coordinates_lat = 59.3293, coordinates_lng = 18.0686 WHERE id = 'royal-swedish-yacht-club'; -- Stockholm Archipelago

-- Mediterranean Clubs
UPDATE yacht_clubs SET coordinates_lat = 38.9067, coordinates_lng = 1.4206 WHERE id = 'club-nautico-ibiza'; -- Ibiza Harbor
UPDATE yacht_clubs SET coordinates_lat = 43.5804, coordinates_lng = 7.1250 WHERE id = 'yacht-club-antibes'; -- Antibes
UPDATE yacht_clubs SET coordinates_lat = 44.3038, coordinates_lng = 9.2099 WHERE id = 'yacht-club-portofino'; -- Portofino Harbor
UPDATE yacht_clubs SET coordinates_lat = 43.7102, coordinates_lng = 7.2620 WHERE id = 'yacht-club-monaco'; -- Monaco Harbor

-- Caribbean Clubs
UPDATE yacht_clubs SET coordinates_lat = 18.4655, coordinates_lng = -66.1057 WHERE id = 'club-nautico-san-juan'; -- San Juan Harbor
UPDATE yacht_clubs SET coordinates_lat = 25.0443, coordinates_lng = -77.3504 WHERE id = 'nassau-yacht-club'; -- Nassau Harbor

-- Pacific Clubs
UPDATE yacht_clubs SET coordinates_lat = 21.3099, coordinates_lng = -157.8581 WHERE id = 'waikiki-yacht-club'; -- Waikiki
UPDATE yacht_clubs SET coordinates_lat = 21.3099, coordinates_lng = -157.8581 WHERE id = 'hawaii-yacht-club'; -- Honolulu

-- Oceania Clubs (from previous migration if they exist)
UPDATE yacht_clubs SET coordinates_lat = -33.8688, coordinates_lng = 151.2093 WHERE id = 'cruising-yacht-club-australia'; -- Sydney Harbor
UPDATE yacht_clubs SET coordinates_lat = -36.8485, coordinates_lng = 174.7633 WHERE id = 'royal-new-zealand-yacht-squadron'; -- Auckland
UPDATE yacht_clubs SET coordinates_lat = 50.7612, coordinates_lng = -1.2982 WHERE id = 'royal-yacht-squadron'; -- Cowes

-- Add Hong Kong Yacht Club
UPDATE yacht_clubs SET coordinates_lat = 22.3193, coordinates_lng = 114.1694 WHERE id = 'royal-hong-kong-yacht-club';

-- San Francisco duplicate fix
UPDATE yacht_clubs SET coordinates_lat = 37.7749, coordinates_lng = -122.4194 WHERE id = 'st-francis-yacht-club' AND name = 'St. Francis Yacht Club';

-- Verify update
SELECT
  name,
  coordinates_lat,
  coordinates_lng,
  CASE
    WHEN coordinates_lat IS NULL OR coordinates_lng IS NULL THEN 'MISSING'
    ELSE 'OK'
  END as status
FROM yacht_clubs
ORDER BY name;

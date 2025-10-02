-- Fix Royal Hong Kong Yacht Club coordinates to actual Kellett Island location
-- Correct location: Kellett Island, Causeway Bay Typhoon Shelter entrance
-- Coordinates: 22.2845° N, 114.1822° E

UPDATE yacht_clubs
SET
  coordinates_lat = 22.2845,
  coordinates_lng = 114.1822
WHERE short_name = 'RHKYC' OR name LIKE '%Royal Hong Kong%';

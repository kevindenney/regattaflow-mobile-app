-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Function to find sailing venues within radius of GPS coordinates
-- Uses PostGIS for accurate geographic distance calculations
CREATE OR REPLACE FUNCTION venues_within_radius(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  city TEXT,
  country TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  venue_type TEXT,
  distance_km DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.name,
    v.city,
    v.country,
    v.latitude,
    v.longitude,
    v.venue_type,
    -- Calculate distance in kilometers using PostGIS
    ST_Distance(
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      ST_SetSRID(ST_MakePoint(v.longitude, v.latitude), 4326)::geography
    ) / 1000 AS distance_km
  FROM sailing_venues v
  WHERE
    -- Filter to radius using bounding box for performance
    ST_DWithin(
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      ST_SetSRID(ST_MakePoint(v.longitude, v.latitude), 4326)::geography,
      radius_km * 1000  -- Convert km to meters
    )
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comment for documentation
COMMENT ON FUNCTION venues_within_radius IS
'Find sailing venues within a specified radius of GPS coordinates. Returns venues ordered by distance (closest first).';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION venues_within_radius TO authenticated;
GRANT EXECUTE ON FUNCTION venues_within_radius TO anon;

-- Fix find_nearby_racing_areas function to use correct column name (area_name instead of name)
CREATE OR REPLACE FUNCTION find_nearby_racing_areas(
    lat double precision,
    lng double precision,
    radius_km double precision DEFAULT 10
)
RETURNS TABLE(
    id uuid,
    venue_id text,
    area_name text,
    center_lat numeric,
    center_lng numeric,
    radius_meters numeric,
    source text,
    verification_status text,
    confirmation_count integer,
    distance_km double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ra.id,
        ra.venue_id,
        ra.area_name,
        ra.center_lat,
        ra.center_lng,
        ra.radius_meters,
        ra.source,
        ra.verification_status,
        ra.confirmation_count,
        (6371 * acos(
            cos(radians(lat)) * cos(radians(ra.center_lat)) *
            cos(radians(ra.center_lng) - radians(lng)) +
            sin(radians(lat)) * sin(radians(ra.center_lat))
        )) AS distance_km
    FROM venue_racing_areas ra
    WHERE ra.center_lat IS NOT NULL
      AND ra.center_lng IS NOT NULL
      AND (6371 * acos(
            cos(radians(lat)) * cos(radians(ra.center_lat)) *
            cos(radians(ra.center_lng) - radians(lng)) +
            sin(radians(lat)) * sin(radians(ra.center_lat))
        )) <= radius_km
    ORDER BY distance_km ASC;
END;
$$;

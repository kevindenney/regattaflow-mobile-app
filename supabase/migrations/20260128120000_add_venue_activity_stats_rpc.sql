-- RPC function to get aggregated activity stats per venue
-- Used by the Local (venue directory) tab to show post counts and last active times.

CREATE OR REPLACE FUNCTION get_venue_activity_stats()
RETURNS TABLE (
  venue_id TEXT,
  post_count BIGINT,
  last_active_at TIMESTAMPTZ
) AS $$
  SELECT
    v.id AS venue_id,
    COUNT(d.id) AS post_count,
    MAX(d.created_at) AS last_active_at
  FROM sailing_venues v
  LEFT JOIN venue_discussions d ON d.venue_id = v.id
  GROUP BY v.id;
$$ LANGUAGE sql STABLE;

-- =====================================================
-- Community Race Suggestions
-- Adds DB function for community races + expands CHECK constraint
-- =====================================================

-- 1. Update CHECK constraint on suggestion_type to include new types
-- Drop the existing constraint and recreate with expanded values
ALTER TABLE public.race_suggestions_cache
  DROP CONSTRAINT IF EXISTS race_suggestions_cache_suggestion_type_check;

ALTER TABLE public.race_suggestions_cache
  ADD CONSTRAINT race_suggestions_cache_suggestion_type_check
  CHECK (suggestion_type IN (
    'club_event', 'fleet_race', 'pattern_match', 'template', 'similar_sailor',
    'community_race', 'catalog_match', 'previous_year'
  ));

-- 2. Create function to get community races (races from co-members)
CREATE OR REPLACE FUNCTION public.get_community_races(
  p_user_id UUID,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  race_id UUID,
  race_name TEXT,
  start_date TIMESTAMPTZ,
  venue_name TEXT,
  race_type TEXT,
  community_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_clubs AS (
    SELECT club_id
    FROM public.club_members
    WHERE user_id = p_user_id
      AND is_active = true
  ),
  co_members AS (
    SELECT DISTINCT cm.user_id
    FROM public.club_members cm
    INNER JOIN user_clubs uc ON cm.club_id = uc.club_id
    WHERE cm.user_id != p_user_id
      AND cm.is_active = true
  )
  SELECT
    r.id AS race_id,
    r.name AS race_name,
    r.start_date,
    COALESCE(r.start_area_name, (r.metadata->>'venue_name')::TEXT) AS venue_name,
    r.race_type,
    COUNT(DISTINCT r.created_by) AS community_count
  FROM public.regattas r
  INNER JOIN co_members m ON r.created_by = m.user_id
  WHERE r.start_date >= NOW()
  GROUP BY r.id, r.name, r.start_date, r.start_area_name, r.metadata, r.race_type
  ORDER BY community_count DESC, r.start_date ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_community_races(UUID, INT) TO authenticated;

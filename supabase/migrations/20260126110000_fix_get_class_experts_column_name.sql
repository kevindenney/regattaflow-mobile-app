-- Fix: get_class_experts function uses wrong column name
-- sailor_boats table uses 'sailor_id' not 'user_id'

CREATE OR REPLACE FUNCTION get_class_experts(
  target_class_id UUID,
  exclude_user_id UUID DEFAULT NULL,
  result_limit INT DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  avatar_emoji TEXT,
  avatar_color TEXT,
  expert_score INT,
  podium_count INT,
  public_race_count INT,
  recent_activity BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  thirty_days_ago TIMESTAMP := NOW() - INTERVAL '30 days';
  ninety_days_ago TIMESTAMP := NOW() - INTERVAL '90 days';
BEGIN
  RETURN QUERY
  WITH user_boats AS (
    -- Find users who sail this boat class (sailor_id is the user reference)
    SELECT DISTINCT sb.sailor_id AS user_id
    FROM sailor_boats sb
    WHERE sb.class_id = target_class_id
  ),
  race_scores AS (
    -- Calculate score from race results
    SELECT
      r.created_by AS user_id,
      COUNT(*) FILTER (WHERE rr.position <= 3) AS podium_finishes,
      COUNT(*) FILTER (WHERE rr.position <= 10) AS top_10_finishes,
      COUNT(*) AS total_races,
      MAX(r.created_at) AS last_race_date
    FROM regattas r
    JOIN race_results rr ON rr.regatta_id = r.id
    WHERE r.created_by IN (SELECT ub.user_id FROM user_boats ub)
    GROUP BY r.created_by
  ),
  sharing_scores AS (
    -- Calculate score from content sharing
    SELECT
      r.created_by AS user_id,
      COUNT(*) FILTER (WHERE r.content_visibility = 'public') AS public_races,
      COUNT(*) FILTER (WHERE r.prep_notes IS NOT NULL) AS races_with_prep,
      COUNT(*) FILTER (WHERE r.post_race_notes IS NOT NULL) AS races_with_analysis,
      MAX(r.updated_at) AS last_share_date
    FROM regattas r
    WHERE r.created_by IN (SELECT ub.user_id FROM user_boats ub)
    GROUP BY r.created_by
  ),
  combined_scores AS (
    SELECT
      ub.user_id,
      -- Results score
      COALESCE(rs.podium_finishes, 0) * 10 +
      COALESCE(rs.top_10_finishes, 0) * 5 +
      COALESCE(rs.total_races, 0) * 3 +
      -- Sharing score
      COALESCE(ss.public_races, 0) * 5 +
      COALESCE(ss.races_with_prep, 0) * 3 +
      COALESCE(ss.races_with_analysis, 0) * 3 AS base_score,
      COALESCE(rs.podium_finishes, 0) AS podiums,
      COALESCE(ss.public_races, 0) AS public_count,
      -- Recency multiplier
      CASE
        WHEN GREATEST(COALESCE(rs.last_race_date, '1970-01-01'), COALESCE(ss.last_share_date, '1970-01-01')) > thirty_days_ago THEN 1.5
        WHEN GREATEST(COALESCE(rs.last_race_date, '1970-01-01'), COALESCE(ss.last_share_date, '1970-01-01')) > ninety_days_ago THEN 1.2
        ELSE 1.0
      END AS recency_mult,
      GREATEST(COALESCE(rs.last_race_date, '1970-01-01'), COALESCE(ss.last_share_date, '1970-01-01')) > thirty_days_ago AS is_recent
    FROM user_boats ub
    LEFT JOIN race_scores rs ON rs.user_id = ub.user_id
    LEFT JOIN sharing_scores ss ON ss.user_id = ub.user_id
    WHERE (exclude_user_id IS NULL OR ub.user_id != exclude_user_id)
  )
  SELECT
    cs.user_id,
    p.full_name AS user_name,
    sp.avatar_emoji,
    sp.avatar_color,
    (cs.base_score * cs.recency_mult)::INT AS expert_score,
    cs.podiums AS podium_count,
    cs.public_count AS public_race_count,
    cs.is_recent AS recent_activity
  FROM combined_scores cs
  JOIN profiles p ON p.id = cs.user_id
  LEFT JOIN sailor_profiles sp ON sp.user_id = cs.user_id
  WHERE cs.base_score > 0
    AND p.full_name IS NOT NULL
  ORDER BY expert_score DESC
  LIMIT result_limit;
END;
$$;

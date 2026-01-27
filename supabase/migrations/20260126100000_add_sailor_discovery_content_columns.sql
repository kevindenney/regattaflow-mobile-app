-- Migration: Add content sharing columns for Sailor Discovery feature
-- Enables sailors to share prep notes, tuning, and post-race analysis with their fleet/public

-- Pre-race content columns
ALTER TABLE regattas
ADD COLUMN IF NOT EXISTS prep_notes TEXT;

ALTER TABLE regattas
ADD COLUMN IF NOT EXISTS tuning_settings JSONB;

-- Post-race content columns
ALTER TABLE regattas
ADD COLUMN IF NOT EXISTS post_race_notes TEXT;

ALTER TABLE regattas
ADD COLUMN IF NOT EXISTS lessons_learned TEXT[];

-- Visibility control (defaults to fleet-only for privacy)
ALTER TABLE regattas
ADD COLUMN IF NOT EXISTS content_visibility TEXT DEFAULT 'fleet';

-- Add check constraint for visibility values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'regattas_content_visibility_check'
  ) THEN
    ALTER TABLE regattas
    ADD CONSTRAINT regattas_content_visibility_check
    CHECK (content_visibility IN ('private', 'fleet', 'public'));
  END IF;
END $$;

-- Create index for finding races with public content (for Class Experts feature)
CREATE INDEX IF NOT EXISTS idx_regattas_content_visibility_public
ON regattas(content_visibility)
WHERE content_visibility = 'public';

-- Create index for finding races with shareable content
CREATE INDEX IF NOT EXISTS idx_regattas_has_shared_content
ON regattas(created_by, content_visibility)
WHERE (prep_notes IS NOT NULL OR post_race_notes IS NOT NULL);

-- Comments for documentation
COMMENT ON COLUMN regattas.prep_notes IS 'Pre-race preparation notes: equipment fixes, tuning thoughts, strategy ideas';
COMMENT ON COLUMN regattas.tuning_settings IS 'Structured rig settings: mast rake, shroud tension, etc. as JSON';
COMMENT ON COLUMN regattas.post_race_notes IS 'Post-race analysis: what went well, what to improve';
COMMENT ON COLUMN regattas.lessons_learned IS 'Bullet points of key takeaways for quick scanning';
COMMENT ON COLUMN regattas.content_visibility IS 'Who can see shared content: private (collaborators only), fleet (fleet mates), public (anyone)';

-- Function to find sailors preparing for similar races (fuzzy match)
-- Matches on normalized name + date (±1 day) + optional venue
CREATE OR REPLACE FUNCTION find_race_participants(
  race_name TEXT,
  race_date DATE,
  race_venue TEXT DEFAULT NULL,
  exclude_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  regatta_id UUID,
  user_id UUID,
  user_name TEXT,
  avatar_emoji TEXT,
  avatar_color TEXT,
  has_prep_notes BOOLEAN,
  has_post_race_notes BOOLEAN,
  content_visibility TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id AS regatta_id,
    r.created_by,
    p.full_name AS user_name,
    sp.avatar_emoji,
    sp.avatar_color,
    (r.prep_notes IS NOT NULL) AS has_prep_notes,
    (r.post_race_notes IS NOT NULL) AS has_post_race_notes,
    r.content_visibility
  FROM regattas r
  JOIN profiles p ON p.id = r.created_by
  LEFT JOIN sailor_profiles sp ON sp.user_id = r.created_by
  WHERE
    -- Fuzzy name match: normalize and compare
    LOWER(TRIM(r.name)) = LOWER(TRIM(race_name))
    -- Date within ±1 day tolerance
    AND r.start_date BETWEEN (race_date - INTERVAL '1 day') AND (race_date + INTERVAL '1 day')
    -- Exclude requesting user
    AND (exclude_user_id IS NULL OR r.created_by != exclude_user_id)
    -- Only include visible content
    AND r.content_visibility IN ('fleet', 'public')
  ORDER BY r.start_date ASC;
END;
$$;

-- Function to score sailors for Class Expert discovery
-- Score based on results + sharing activity
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
AS $$
DECLARE
  thirty_days_ago TIMESTAMP := NOW() - INTERVAL '30 days';
  ninety_days_ago TIMESTAMP := NOW() - INTERVAL '90 days';
BEGIN
  RETURN QUERY
  WITH user_boats AS (
    -- Find users who sail this boat class
    SELECT DISTINCT sb.user_id
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
    WHERE r.created_by IN (SELECT user_boats.user_id FROM user_boats)
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
    WHERE r.created_by IN (SELECT user_boats.user_id FROM user_boats)
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION find_race_participants TO authenticated;
GRANT EXECUTE ON FUNCTION get_class_experts TO authenticated;

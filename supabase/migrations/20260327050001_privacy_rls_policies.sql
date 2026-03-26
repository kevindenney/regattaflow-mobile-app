-- Migration: RLS policy updates for privacy settings
-- Enforces profile_public, allow_peer_visibility, and allow_follower_sharing
-- from the profiles table.

-- =============================================================================
-- 1. PROFILE VISIBILITY: Replace broad discovery policy with privacy-aware one.
--    The existing "profiles_select_own_v1" policy (own profile) remains.
-- =============================================================================

DROP POLICY IF EXISTS "Users can view all profiles for discovery" ON public.profiles;

CREATE POLICY "Users can view all profiles for discovery"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Public profiles are visible to everyone
    COALESCE(profile_public, true) = true
    -- Followers can always see the profile
    OR EXISTS (
      SELECT 1 FROM user_follows
      WHERE follower_id = auth.uid()
        AND following_id = profiles.id
    )
    -- Co-org-members can always see the profile
    OR EXISTS (
      SELECT 1 FROM organization_memberships om1
      JOIN organization_memberships om2
        ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om2.user_id = profiles.id
    )
  );

-- =============================================================================
-- 2. PEER VISIBILITY OPT-OUT: Replace co-subscriber step policy to check
--    profiles.allow_peer_visibility on the step owner.
-- =============================================================================

DROP POLICY IF EXISTS "Co-subscribers can see peer steps" ON public.timeline_steps;

CREATE POLICY "Co-subscribers can see peer steps"
  ON public.timeline_steps
  FOR SELECT
  USING (
    visibility <> 'private'
    -- Step owner must have peer visibility enabled
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = timeline_steps.user_id
        AND allow_peer_visibility = true
    )
    -- Viewer must be a co-subscriber of the same published blueprint
    AND EXISTS (
      SELECT 1
      FROM public.blueprint_subscriptions my_sub
      JOIN public.blueprint_subscriptions peer_sub
        ON my_sub.blueprint_id = peer_sub.blueprint_id
      JOIN public.timeline_blueprints bp
        ON bp.id = my_sub.blueprint_id
      WHERE my_sub.subscriber_id = auth.uid()
        AND peer_sub.subscriber_id = timeline_steps.user_id
        AND bp.interest_id = timeline_steps.interest_id
        AND bp.is_published = true
    )
  );

-- =============================================================================
-- 3. FOLLOWER SHARING: Replace follower step visibility policy to check
--    profiles.allow_follower_sharing instead of sailor_profiles.
-- =============================================================================

DROP POLICY IF EXISTS "Users can view followed users timeline steps" ON public.timeline_steps;

CREATE POLICY "Users can view followed users timeline steps"
  ON public.timeline_steps
  FOR SELECT
  USING (
    visibility != 'private'
    AND EXISTS (
      SELECT 1 FROM user_follows
      WHERE follower_id = auth.uid()
        AND following_id = timeline_steps.user_id
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = timeline_steps.user_id
        AND allow_follower_sharing = true
    )
  );

-- =============================================================================
-- 4. UPDATE DISCOVERY FUNCTIONS to use profiles.allow_follower_sharing
-- =============================================================================

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
    COALESCE(r.content_visibility, 'fleet')::TEXT AS content_visibility
  FROM regattas r
  JOIN profiles p ON p.id = r.created_by
  LEFT JOIN sailor_profiles sp ON sp.user_id = r.created_by
  WHERE
    LOWER(TRIM(r.name)) = LOWER(TRIM(race_name))
    AND r.start_date BETWEEN (race_date - INTERVAL '1 day') AND (race_date + INTERVAL '1 day')
    AND (exclude_user_id IS NULL OR r.created_by != exclude_user_id)
    -- Use profiles.allow_follower_sharing instead of sailor_profiles
    AND COALESCE(p.allow_follower_sharing, true) = true
  ORDER BY r.start_date ASC;
END;
$$;

DROP FUNCTION IF EXISTS get_class_experts(UUID, UUID, INT);

CREATE FUNCTION get_class_experts(
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
    SELECT DISTINCT sb.user_id
    FROM sailor_boats sb
    WHERE sb.class_id = target_class_id
  ),
  sharing_users AS (
    -- Use profiles.allow_follower_sharing instead of sailor_profiles
    SELECT p.id AS user_id
    FROM profiles p
    WHERE p.id IN (SELECT user_boats.user_id FROM user_boats)
      AND COALESCE(p.allow_follower_sharing, true) = true
  ),
  race_scores AS (
    SELECT
      r.created_by AS user_id,
      COUNT(*) FILTER (WHERE rr.position <= 3) AS podium_finishes,
      COUNT(*) FILTER (WHERE rr.position <= 10) AS top_10_finishes,
      COUNT(*) AS total_races,
      MAX(r.created_at) AS last_race_date
    FROM regattas r
    JOIN race_results rr ON rr.regatta_id = r.id
    WHERE r.created_by IN (SELECT sharing_users.user_id FROM sharing_users)
    GROUP BY r.created_by
  ),
  sharing_scores AS (
    SELECT
      r.created_by AS user_id,
      COUNT(*) AS public_races,
      COUNT(*) FILTER (WHERE r.prep_notes IS NOT NULL) AS races_with_prep,
      COUNT(*) FILTER (WHERE r.post_race_notes IS NOT NULL) AS races_with_analysis,
      MAX(r.updated_at) AS last_share_date
    FROM regattas r
    WHERE r.created_by IN (SELECT sharing_users.user_id FROM sharing_users)
    GROUP BY r.created_by
  ),
  combined_scores AS (
    SELECT
      su.user_id,
      COALESCE(rs.podium_finishes, 0) * 10 +
      COALESCE(rs.top_10_finishes, 0) * 5 +
      COALESCE(rs.total_races, 0) * 3 +
      COALESCE(ss.public_races, 0) * 5 +
      COALESCE(ss.races_with_prep, 0) * 3 +
      COALESCE(ss.races_with_analysis, 0) * 3 AS base_score,
      COALESCE(rs.podium_finishes, 0) AS podiums,
      COALESCE(ss.public_races, 0) AS public_count,
      CASE
        WHEN GREATEST(COALESCE(rs.last_race_date, '1970-01-01'), COALESCE(ss.last_share_date, '1970-01-01')) > thirty_days_ago THEN 1.5
        WHEN GREATEST(COALESCE(rs.last_race_date, '1970-01-01'), COALESCE(ss.last_share_date, '1970-01-01')) > ninety_days_ago THEN 1.2
        ELSE 1.0
      END AS recency_mult,
      GREATEST(COALESCE(rs.last_race_date, '1970-01-01'), COALESCE(ss.last_share_date, '1970-01-01')) > thirty_days_ago AS is_recent
    FROM sharing_users su
    LEFT JOIN race_scores rs ON rs.user_id = su.user_id
    LEFT JOIN sharing_scores ss ON ss.user_id = su.user_id
    WHERE (exclude_user_id IS NULL OR su.user_id != exclude_user_id)
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

GRANT EXECUTE ON FUNCTION find_race_participants TO authenticated;
GRANT EXECUTE ON FUNCTION get_class_experts TO authenticated;

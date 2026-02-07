-- =====================================================
-- Fix communities_with_stats view to include computed post_count
-- The post_count column in the base communities table is not updated
-- so we need to compute it dynamically in the view
-- =====================================================

-- Drop the existing view
DROP VIEW IF EXISTS communities_with_stats;

-- Recreate with computed post_count (explicitly listing columns to override post_count)
CREATE OR REPLACE VIEW communities_with_stats AS
SELECT
  c.id,
  c.name,
  c.slug,
  c.description,
  c.community_type,
  c.category_id,
  c.icon_url,
  c.banner_url,
  c.member_count,
  -- Computed post_count (replaces the static column)
  (
    SELECT COUNT(*)
    FROM venue_discussions vd
    WHERE vd.community_id = c.id
    AND vd.is_public = true
  )::INTEGER as post_count,
  c.created_by,
  c.is_official,
  c.is_verified,
  c.linked_entity_type,
  c.linked_entity_id,
  c.metadata,
  c.created_at,
  c.updated_at,
  c.last_activity_at,
  -- Category info
  cat.display_name as category_name,
  cat.icon as category_icon,
  cat.color as category_color,
  -- Activity stats
  (
    SELECT COUNT(*)
    FROM venue_discussions vd
    WHERE vd.community_id = c.id
    AND vd.created_at > now() - interval '24 hours'
  ) as posts_last_24h,
  (
    SELECT COUNT(DISTINCT cm.user_id)
    FROM community_memberships cm
    WHERE cm.community_id = c.id
    AND cm.joined_at > now() - interval '7 days'
  ) as new_members_7d
FROM communities c
LEFT JOIN community_categories cat ON c.category_id = cat.id;

-- Grant permissions
GRANT SELECT ON communities_with_stats TO authenticated;
GRANT SELECT ON communities_with_stats TO anon;

COMMENT ON VIEW communities_with_stats IS 'Communities with category info and activity stats (computed post_count)';

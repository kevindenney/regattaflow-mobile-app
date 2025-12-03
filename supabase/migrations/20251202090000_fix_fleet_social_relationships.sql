-- Ensure fleet social tables have the foreign keys PostgREST needs for embedding
-- This migration re-creates the key relationships so counts and joins work reliably.

-- Fleet post likes -> fleet posts
ALTER TABLE IF EXISTS fleet_post_likes
  DROP CONSTRAINT IF EXISTS fleet_post_likes_post_id_fkey,
  ADD CONSTRAINT fleet_post_likes_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES fleet_posts(id) ON DELETE CASCADE;

-- Fleet post comments -> fleet posts
ALTER TABLE IF EXISTS fleet_post_comments
  DROP CONSTRAINT IF EXISTS fleet_post_comments_post_id_fkey,
  ADD CONSTRAINT fleet_post_comments_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES fleet_posts(id) ON DELETE CASCADE;

-- Fleet post shares -> fleet posts
ALTER TABLE IF EXISTS fleet_post_shares
  DROP CONSTRAINT IF EXISTS fleet_post_shares_post_id_fkey,
  ADD CONSTRAINT fleet_post_shares_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES fleet_posts(id) ON DELETE CASCADE;

-- Fleet post bookmarks -> fleet posts
ALTER TABLE IF EXISTS fleet_post_bookmarks
  DROP CONSTRAINT IF EXISTS fleet_post_bookmarks_post_id_fkey,
  ADD CONSTRAINT fleet_post_bookmarks_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES fleet_posts(id) ON DELETE CASCADE;

-- Fleet notifications -> fleet posts (nullable link)
ALTER TABLE IF EXISTS fleet_notifications
  DROP CONSTRAINT IF EXISTS fleet_notifications_related_post_id_fkey,
  ADD CONSTRAINT fleet_notifications_related_post_id_fkey
    FOREIGN KEY (related_post_id) REFERENCES fleet_posts(id) ON DELETE CASCADE;

-- Fleet notifications -> fleet post comments (nullable link)
ALTER TABLE IF EXISTS fleet_notifications
  DROP CONSTRAINT IF EXISTS fleet_notifications_related_comment_id_fkey,
  ADD CONSTRAINT fleet_notifications_related_comment_id_fkey
    FOREIGN KEY (related_comment_id) REFERENCES fleet_post_comments(id) ON DELETE CASCADE;

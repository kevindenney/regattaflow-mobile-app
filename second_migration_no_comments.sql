ALTER TABLE IF EXISTS fleet_post_likes
  DROP CONSTRAINT IF EXISTS fleet_post_likes_post_id_fkey,
  ADD CONSTRAINT fleet_post_likes_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES fleet_posts(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS fleet_post_comments
  DROP CONSTRAINT IF EXISTS fleet_post_comments_post_id_fkey,
  ADD CONSTRAINT fleet_post_comments_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES fleet_posts(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS fleet_post_shares
  DROP CONSTRAINT IF EXISTS fleet_post_shares_post_id_fkey,
  ADD CONSTRAINT fleet_post_shares_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES fleet_posts(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS fleet_post_bookmarks
  DROP CONSTRAINT IF EXISTS fleet_post_bookmarks_post_id_fkey,
  ADD CONSTRAINT fleet_post_bookmarks_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES fleet_posts(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS fleet_notifications
  DROP CONSTRAINT IF EXISTS fleet_notifications_related_post_id_fkey,
  ADD CONSTRAINT fleet_notifications_related_post_id_fkey
    FOREIGN KEY (related_post_id) REFERENCES fleet_posts(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS fleet_notifications
  DROP CONSTRAINT IF EXISTS fleet_notifications_related_comment_id_fkey,
  ADD CONSTRAINT fleet_notifications_related_comment_id_fkey
    FOREIGN KEY (related_comment_id) REFERENCES fleet_post_comments(id) ON DELETE CASCADE;
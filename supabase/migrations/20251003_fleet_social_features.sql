-- Fleet Social Features Schema
-- Adds comprehensive social/community features to fleet system

-- Fleet Posts (main social feed content)
CREATE TABLE IF NOT EXISTS fleet_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fleet_id UUID NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL CHECK (post_type IN ('race_result','tuning_guide','check_in','event','announcement','discussion')),
  content TEXT,

  -- Type-specific metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  -- For race_result: { position: 2, race_name: "ABC Regatta", race_date: "2024-03-15", race_id: "uuid" }
  -- For tuning_guide: { document_id: "uuid", title: "Heavy air setup", download_count: 0 }
  -- For check_in: { location_id: "uuid", location_name: "RHKYC", checked_in_users: ["uuid1", "uuid2"] }
  -- For event: { event_id: "uuid", event_name: "Spring Series R3", event_date: "2024-03-20", registration_url: "..." }

  visibility TEXT NOT NULL DEFAULT 'fleet' CHECK (visibility IN ('fleet','public','private')),
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fleet_posts_fleet ON fleet_posts(fleet_id);
CREATE INDEX IF NOT EXISTS idx_fleet_posts_author ON fleet_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_fleet_posts_type ON fleet_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_fleet_posts_created ON fleet_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fleet_posts_pinned ON fleet_posts(is_pinned) WHERE is_pinned = true;

-- Post Likes
CREATE TABLE IF NOT EXISTS fleet_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES fleet_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_fleet_post_likes_post ON fleet_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_fleet_post_likes_user ON fleet_post_likes(user_id);

-- Post Comments
CREATE TABLE IF NOT EXISTS fleet_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES fleet_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES fleet_post_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fleet_post_comments_post ON fleet_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_fleet_post_comments_author ON fleet_post_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_fleet_post_comments_parent ON fleet_post_comments(parent_comment_id);

-- Post Shares (sharing posts to other fleets)
CREATE TABLE IF NOT EXISTS fleet_post_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES fleet_posts(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_fleet_id UUID NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, target_fleet_id)
);

CREATE INDEX IF NOT EXISTS idx_fleet_post_shares_post ON fleet_post_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_fleet_post_shares_target ON fleet_post_shares(target_fleet_id);

-- Bookmarked Posts (users can bookmark important posts)
CREATE TABLE IF NOT EXISTS fleet_post_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES fleet_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_fleet_post_bookmarks_user ON fleet_post_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_fleet_post_bookmarks_post ON fleet_post_bookmarks(post_id);

-- Fleet Notifications (for social interactions)
CREATE TABLE IF NOT EXISTS fleet_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fleet_id UUID NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'new_post','post_like','post_comment','post_share',
    'tuning_guide_posted','race_result_posted','event_created',
    'member_check_in','mention'
  )),

  -- Reference to the related entity
  related_post_id UUID REFERENCES fleet_posts(id) ON DELETE CASCADE,
  related_comment_id UUID REFERENCES fleet_post_comments(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Who triggered the notification

  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fleet_notifications_user ON fleet_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_fleet_notifications_unread ON fleet_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_fleet_notifications_created ON fleet_notifications(created_at DESC);

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

ALTER TABLE fleet_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_notifications ENABLE ROW LEVEL SECURITY;

-- Fleet Posts policies
CREATE POLICY "Fleet members can view posts" ON fleet_posts
  FOR SELECT USING (
    visibility = 'public' OR
    EXISTS (
      SELECT 1 FROM fleet_members
      WHERE fleet_members.fleet_id = fleet_posts.fleet_id
        AND fleet_members.user_id = auth.uid()
        AND fleet_members.status = 'active'
    )
  );

CREATE POLICY "Fleet members can create posts" ON fleet_posts
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM fleet_members
      WHERE fleet_members.fleet_id = fleet_posts.fleet_id
        AND fleet_members.user_id = auth.uid()
        AND fleet_members.status = 'active'
    )
  );

CREATE POLICY "Authors can update their posts" ON fleet_posts
  FOR UPDATE USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can delete their posts" ON fleet_posts
  FOR DELETE USING (author_id = auth.uid());

-- Fleet Post Likes policies
CREATE POLICY "Users can view likes" ON fleet_post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like posts" ON fleet_post_likes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unlike posts" ON fleet_post_likes
  FOR DELETE USING (user_id = auth.uid());

-- Fleet Post Comments policies
CREATE POLICY "Users can view comments" ON fleet_post_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM fleet_posts
      WHERE fleet_posts.id = fleet_post_comments.post_id
        AND (
          fleet_posts.visibility = 'public' OR
          EXISTS (
            SELECT 1 FROM fleet_members
            WHERE fleet_members.fleet_id = fleet_posts.fleet_id
              AND fleet_members.user_id = auth.uid()
              AND fleet_members.status = 'active'
          )
        )
    )
  );

CREATE POLICY "Fleet members can comment on posts" ON fleet_post_comments
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM fleet_posts fp
      JOIN fleet_members fm ON fm.fleet_id = fp.fleet_id
      WHERE fp.id = fleet_post_comments.post_id
        AND fm.user_id = auth.uid()
        AND fm.status = 'active'
    )
  );

CREATE POLICY "Authors can update their comments" ON fleet_post_comments
  FOR UPDATE USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can delete their comments" ON fleet_post_comments
  FOR DELETE USING (author_id = auth.uid());

-- Fleet Post Shares policies
CREATE POLICY "Users can view shares" ON fleet_post_shares
  FOR SELECT USING (
    shared_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM fleet_members
      WHERE fleet_members.fleet_id = fleet_post_shares.target_fleet_id
        AND fleet_members.user_id = auth.uid()
        AND fleet_members.status = 'active'
    )
  );

CREATE POLICY "Fleet members can share posts" ON fleet_post_shares
  FOR INSERT WITH CHECK (shared_by = auth.uid());

-- Fleet Post Bookmarks policies
CREATE POLICY "Users can view their bookmarks" ON fleet_post_bookmarks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can bookmark posts" ON fleet_post_bookmarks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove bookmarks" ON fleet_post_bookmarks
  FOR DELETE USING (user_id = auth.uid());

-- Fleet Notifications policies
CREATE POLICY "Users can view their notifications" ON fleet_notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON fleet_notifications
  FOR INSERT WITH CHECK (true); -- Controlled by service functions

CREATE POLICY "Users can update their notifications" ON fleet_notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- Function to get post counts with aggregated data
CREATE OR REPLACE FUNCTION get_fleet_post_counts(p_post_id UUID)
RETURNS TABLE(likes_count BIGINT, comments_count BIGINT, shares_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM fleet_post_likes WHERE post_id = p_post_id),
    (SELECT COUNT(*) FROM fleet_post_comments WHERE post_id = p_post_id),
    (SELECT COUNT(*) FROM fleet_post_shares WHERE post_id = p_post_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has liked a post
CREATE OR REPLACE FUNCTION user_has_liked_post(p_post_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM fleet_post_likes
    WHERE post_id = p_post_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_fleet_notification(
  p_user_id UUID,
  p_fleet_id UUID,
  p_notification_type TEXT,
  p_actor_id UUID,
  p_related_post_id UUID DEFAULT NULL,
  p_related_comment_id UUID DEFAULT NULL,
  p_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO fleet_notifications (
    user_id, fleet_id, notification_type, actor_id,
    related_post_id, related_comment_id, message
  )
  VALUES (
    p_user_id, p_fleet_id, p_notification_type, p_actor_id,
    p_related_post_id, p_related_comment_id, p_message
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create notification when post is liked
CREATE OR REPLACE FUNCTION notify_on_post_like()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author_id UUID;
  v_fleet_id UUID;
BEGIN
  -- Get post author and fleet
  SELECT author_id, fleet_id INTO v_post_author_id, v_fleet_id
  FROM fleet_posts WHERE id = NEW.post_id;

  -- Don't notify if user likes their own post
  IF v_post_author_id != NEW.user_id THEN
    PERFORM create_fleet_notification(
      v_post_author_id,
      v_fleet_id,
      'post_like',
      NEW.user_id,
      NEW.post_id,
      NULL,
      'liked your post'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_post_liked
  AFTER INSERT ON fleet_post_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_post_like();

-- Trigger to create notification when post is commented
CREATE OR REPLACE FUNCTION notify_on_post_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author_id UUID;
  v_fleet_id UUID;
BEGIN
  -- Get post author and fleet
  SELECT fp.author_id, fp.fleet_id INTO v_post_author_id, v_fleet_id
  FROM fleet_posts fp WHERE fp.id = NEW.post_id;

  -- Don't notify if user comments on their own post
  IF v_post_author_id != NEW.author_id THEN
    PERFORM create_fleet_notification(
      v_post_author_id,
      v_fleet_id,
      'post_comment',
      NEW.author_id,
      NEW.post_id,
      NEW.id,
      'commented on your post'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_post_commented
  AFTER INSERT ON fleet_post_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_post_comment();

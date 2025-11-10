-- Fleet Social Schema
-- Enables fleet-wide social features: posts, comments, likes, bookmarks, and notifications

-- ==========================================
-- FLEET POSTS
-- ==========================================
CREATE TABLE IF NOT EXISTS fleet_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fleet_id UUID NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL CHECK (post_type IN ('race_result', 'tuning_guide', 'check_in', 'event', 'announcement', 'discussion')),
  content TEXT,
  metadata JSONB DEFAULT '{}',
  visibility TEXT NOT NULL DEFAULT 'fleet' CHECK (visibility IN ('fleet', 'public', 'private')),
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fleet_posts
CREATE INDEX IF NOT EXISTS idx_fleet_posts_fleet_id ON fleet_posts(fleet_id);
CREATE INDEX IF NOT EXISTS idx_fleet_posts_author_id ON fleet_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_fleet_posts_created_at ON fleet_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fleet_posts_type ON fleet_posts(post_type);

-- ==========================================
-- POST COMMENTS
-- ==========================================
CREATE TABLE IF NOT EXISTS fleet_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES fleet_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES fleet_post_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fleet_post_comments
CREATE INDEX IF NOT EXISTS idx_fleet_post_comments_post_id ON fleet_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_fleet_post_comments_author_id ON fleet_post_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_fleet_post_comments_parent ON fleet_post_comments(parent_comment_id);

-- ==========================================
-- POST LIKES
-- ==========================================
CREATE TABLE IF NOT EXISTS fleet_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES fleet_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Indexes for fleet_post_likes
CREATE INDEX IF NOT EXISTS idx_fleet_post_likes_post_id ON fleet_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_fleet_post_likes_user_id ON fleet_post_likes(user_id);

-- ==========================================
-- POST SHARES
-- ==========================================
CREATE TABLE IF NOT EXISTS fleet_post_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES fleet_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_fleet_id UUID REFERENCES fleets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fleet_post_shares
CREATE INDEX IF NOT EXISTS idx_fleet_post_shares_post_id ON fleet_post_shares(post_id);
CREATE INDEX IF NOT EXISTS idx_fleet_post_shares_user_id ON fleet_post_shares(user_id);

-- ==========================================
-- POST BOOKMARKS
-- ==========================================
CREATE TABLE IF NOT EXISTS fleet_post_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES fleet_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Indexes for fleet_post_bookmarks
CREATE INDEX IF NOT EXISTS idx_fleet_post_bookmarks_post_id ON fleet_post_bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_fleet_post_bookmarks_user_id ON fleet_post_bookmarks(user_id);

-- ==========================================
-- FLEET NOTIFICATIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS fleet_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fleet_id UUID NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'new_post', 'post_like', 'post_comment', 'post_share',
    'tuning_guide_posted', 'race_result_posted', 'event_created',
    'member_check_in', 'mention'
  )),
  related_post_id UUID REFERENCES fleet_posts(id) ON DELETE CASCADE,
  related_comment_id UUID REFERENCES fleet_post_comments(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fleet_notifications
CREATE INDEX IF NOT EXISTS idx_fleet_notifications_user_id ON fleet_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_fleet_notifications_fleet_id ON fleet_notifications(fleet_id);
CREATE INDEX IF NOT EXISTS idx_fleet_notifications_created_at ON fleet_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fleet_notifications_is_read ON fleet_notifications(is_read);

-- ==========================================
-- RLS POLICIES
-- ==========================================

-- Enable RLS
ALTER TABLE fleet_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_notifications ENABLE ROW LEVEL SECURITY;

-- Fleet Posts Policies
CREATE POLICY "Fleet members can view fleet posts"
  ON fleet_posts FOR SELECT
  USING (
    visibility = 'public'
    OR (visibility = 'fleet' AND EXISTS (
      SELECT 1 FROM fleet_members
      WHERE fleet_members.fleet_id = fleet_posts.fleet_id
      AND fleet_members.user_id = auth.uid()
    ))
    OR (visibility = 'private' AND author_id = auth.uid())
  );

CREATE POLICY "Fleet members can create posts"
  ON fleet_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fleet_members
      WHERE fleet_members.fleet_id = fleet_posts.fleet_id
      AND fleet_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can update their own posts"
  ON fleet_posts FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Authors can delete their own posts"
  ON fleet_posts FOR DELETE
  USING (author_id = auth.uid());

-- Fleet Post Comments Policies
CREATE POLICY "Users can view comments on accessible posts"
  ON fleet_post_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM fleet_posts
      WHERE fleet_posts.id = fleet_post_comments.post_id
      AND (
        fleet_posts.visibility = 'public'
        OR (fleet_posts.visibility = 'fleet' AND EXISTS (
          SELECT 1 FROM fleet_members
          WHERE fleet_members.fleet_id = fleet_posts.fleet_id
          AND fleet_members.user_id = auth.uid()
        ))
        OR fleet_posts.author_id = auth.uid()
      )
    )
  );

CREATE POLICY "Fleet members can comment on posts"
  ON fleet_post_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM fleet_posts
      JOIN fleet_members ON fleet_members.fleet_id = fleet_posts.fleet_id
      WHERE fleet_posts.id = fleet_post_comments.post_id
      AND fleet_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authors can update their own comments"
  ON fleet_post_comments FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Authors can delete their own comments"
  ON fleet_post_comments FOR DELETE
  USING (author_id = auth.uid());

-- Fleet Post Likes Policies
CREATE POLICY "Users can view all likes"
  ON fleet_post_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like accessible posts"
  ON fleet_post_likes FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM fleet_posts
      WHERE fleet_posts.id = fleet_post_likes.post_id
      AND (
        fleet_posts.visibility = 'public'
        OR (fleet_posts.visibility = 'fleet' AND EXISTS (
          SELECT 1 FROM fleet_members
          WHERE fleet_members.fleet_id = fleet_posts.fleet_id
          AND fleet_members.user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Users can unlike their own likes"
  ON fleet_post_likes FOR DELETE
  USING (user_id = auth.uid());

-- Fleet Post Shares Policies
CREATE POLICY "Users can view all shares"
  ON fleet_post_shares FOR SELECT
  USING (true);

CREATE POLICY "Fleet members can share posts"
  ON fleet_post_shares FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Fleet Post Bookmarks Policies
CREATE POLICY "Users can view their own bookmarks"
  ON fleet_post_bookmarks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can bookmark accessible posts"
  ON fleet_post_bookmarks FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM fleet_posts
      WHERE fleet_posts.id = fleet_post_bookmarks.post_id
      AND (
        fleet_posts.visibility = 'public'
        OR (fleet_posts.visibility = 'fleet' AND EXISTS (
          SELECT 1 FROM fleet_members
          WHERE fleet_members.fleet_id = fleet_posts.fleet_id
          AND fleet_members.user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Users can remove their own bookmarks"
  ON fleet_post_bookmarks FOR DELETE
  USING (user_id = auth.uid());

-- Fleet Notifications Policies
CREATE POLICY "Users can view their own notifications"
  ON fleet_notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON fleet_notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON fleet_notifications FOR UPDATE
  USING (user_id = auth.uid());

-- ==========================================
-- TRIGGERS FOR UPDATED_AT
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fleet_posts_updated_at
  BEFORE UPDATE ON fleet_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fleet_post_comments_updated_at
  BEFORE UPDATE ON fleet_post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

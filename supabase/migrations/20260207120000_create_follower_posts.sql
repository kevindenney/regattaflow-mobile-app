-- =============================================================================
-- Create follower_posts table
-- Allows sailors to publish updates to their followers
-- =============================================================================

CREATE TABLE IF NOT EXISTS follower_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_urls TEXT[] DEFAULT '{}',
  linked_race_id UUID REFERENCES regattas(id) ON DELETE SET NULL,
  post_type TEXT NOT NULL DEFAULT 'general'
    CHECK (post_type IN ('general', 'race_recap', 'tip', 'gear_update', 'milestone')),
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_follower_posts_user_id ON follower_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_follower_posts_created_at ON follower_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follower_posts_post_type ON follower_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_follower_posts_linked_race ON follower_posts(linked_race_id) WHERE linked_race_id IS NOT NULL;

-- Enable RLS
ALTER TABLE follower_posts ENABLE ROW LEVEL SECURITY;

-- Owner can CRUD their own posts
CREATE POLICY "Users can insert their own posts"
  ON follower_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON follower_posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON follower_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Followers can read posts from users they follow
-- Also allow users to read their own posts
CREATE POLICY "Users can read posts from followed users and themselves"
  ON follower_posts FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM user_follows
      WHERE user_follows.follower_id = auth.uid()
        AND user_follows.following_id = follower_posts.user_id
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_follower_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_follower_posts_updated_at
  BEFORE UPDATE ON follower_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_follower_posts_updated_at();

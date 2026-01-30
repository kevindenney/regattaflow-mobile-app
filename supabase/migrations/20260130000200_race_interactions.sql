-- Migration: Race Interactions (Likes and Comments)
-- Enables social interactions on races/regattas

-- =============================================================================
-- REGATTA LIKES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS regatta_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_regatta_like UNIQUE(regatta_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_regatta_likes_regatta ON regatta_likes(regatta_id);
CREATE INDEX IF NOT EXISTS idx_regatta_likes_user ON regatta_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_regatta_likes_created ON regatta_likes(created_at DESC);

-- Enable RLS
ALTER TABLE regatta_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can view likes
CREATE POLICY "Anyone can view regatta likes" ON regatta_likes
  FOR SELECT USING (true);

-- Users can like regattas
CREATE POLICY "Users can like regattas" ON regatta_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can remove their own likes
CREATE POLICY "Users can remove their own likes" ON regatta_likes
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- REGATTA COMMENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS regatta_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES regatta_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_regatta_comments_regatta ON regatta_comments(regatta_id);
CREATE INDEX IF NOT EXISTS idx_regatta_comments_user ON regatta_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_regatta_comments_parent ON regatta_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_regatta_comments_created ON regatta_comments(created_at DESC);
-- Index for non-deleted comments
CREATE INDEX IF NOT EXISTS idx_regatta_comments_active
  ON regatta_comments(regatta_id, created_at DESC)
  WHERE is_deleted = false;

-- Enable RLS
ALTER TABLE regatta_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view non-deleted comments
CREATE POLICY "Anyone can view comments" ON regatta_comments
  FOR SELECT USING (is_deleted = false);

-- Users can add comments
CREATE POLICY "Users can add comments" ON regatta_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" ON regatta_comments
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can soft-delete their own comments
CREATE POLICY "Users can delete their own comments" ON regatta_comments
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- ADD COUNTERS TO REGATTAS
-- =============================================================================

ALTER TABLE regattas
  ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- =============================================================================
-- TRIGGER: Update like count
-- =============================================================================

CREATE OR REPLACE FUNCTION update_regatta_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE regattas SET like_count = like_count + 1 WHERE id = NEW.regatta_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE regattas SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.regatta_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_regatta_like_count ON regatta_likes;
CREATE TRIGGER trigger_update_regatta_like_count
  AFTER INSERT OR DELETE ON regatta_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_regatta_like_count();

-- =============================================================================
-- TRIGGER: Update comment count
-- =============================================================================

CREATE OR REPLACE FUNCTION update_regatta_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE regattas SET comment_count = comment_count + 1 WHERE id = NEW.regatta_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE regattas SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.regatta_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle soft delete
    IF OLD.is_deleted = false AND NEW.is_deleted = true THEN
      UPDATE regattas SET comment_count = GREATEST(0, comment_count - 1) WHERE id = NEW.regatta_id;
    ELSIF OLD.is_deleted = true AND NEW.is_deleted = false THEN
      UPDATE regattas SET comment_count = comment_count + 1 WHERE id = NEW.regatta_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_regatta_comment_count ON regatta_comments;
CREATE TRIGGER trigger_update_regatta_comment_count
  AFTER INSERT OR DELETE OR UPDATE OF is_deleted ON regatta_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_regatta_comment_count();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Check if user has liked a regatta
CREATE OR REPLACE FUNCTION has_user_liked_regatta(p_regatta_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM regatta_likes
    WHERE regatta_id = p_regatta_id AND user_id = p_user_id
  );
$$;

-- Get comments for a regatta with user info
CREATE OR REPLACE FUNCTION get_regatta_comments(p_regatta_id UUID)
RETURNS TABLE (
  id UUID,
  content TEXT,
  parent_id UUID,
  created_at TIMESTAMPTZ,
  user_id UUID,
  display_name TEXT,
  avatar_emoji TEXT,
  avatar_color TEXT,
  reply_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    rc.id,
    rc.content,
    rc.parent_id,
    rc.created_at,
    rc.user_id,
    p.full_name as display_name,
    sp.avatar_emoji,
    sp.avatar_color,
    (SELECT COUNT(*) FROM regatta_comments WHERE parent_id = rc.id AND is_deleted = false) as reply_count
  FROM regatta_comments rc
  LEFT JOIN sailor_profiles sp ON sp.user_id = rc.user_id
  LEFT JOIN profiles p ON p.id = rc.user_id
  WHERE rc.regatta_id = p_regatta_id AND rc.is_deleted = false
  ORDER BY rc.created_at ASC;
$$;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE regatta_likes IS 'Likes/kudos on regattas from users';
COMMENT ON TABLE regatta_comments IS 'Threaded comments on regattas';
COMMENT ON COLUMN regattas.like_count IS 'Cached count of likes for performance';
COMMENT ON COLUMN regattas.comment_count IS 'Cached count of comments for performance';

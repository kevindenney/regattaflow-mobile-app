-- Community Knowledge Feed Enhancement
-- Extends the venue_discussions platform (from .skip migration) with:
-- - Post types (tip, question, report, discussion, safety_alert)
-- - Condition tags (wind, tide, wave, current ranges)
-- - Topic tags + join table
-- - Member roles + moderation
-- - Hot score ranking function
-- - View counts, resolved status, accepted answers
-- - Map pin locations on posts

-- ============================================
-- 1. ACTIVATE BASE TABLES (IF NOT EXISTS guards)
-- ============================================

-- Base discussions table
CREATE TABLE IF NOT EXISTS venue_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT,
  category TEXT CHECK (category IN ('general', 'tactics', 'conditions', 'gear', 'services', 'racing', 'safety')),
  is_public BOOLEAN DEFAULT true,
  fleet_id UUID,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS venue_discussion_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES venue_discussions(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES venue_discussion_comments(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS venue_discussion_votes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('discussion', 'comment')),
  target_id UUID NOT NULL,
  vote SMALLINT NOT NULL CHECK (vote IN (-1, 1)),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, target_type, target_id)
);

-- Base indexes
CREATE INDEX IF NOT EXISTS idx_venue_discussions_venue ON venue_discussions(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_discussions_author ON venue_discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_venue_discussions_activity ON venue_discussions(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_venue_discussion_comments_discussion ON venue_discussion_comments(discussion_id);
CREATE INDEX IF NOT EXISTS idx_venue_discussion_comments_parent ON venue_discussion_comments(parent_id) WHERE parent_id IS NOT NULL;

-- ============================================
-- 2. ALTER venue_discussions - Add community feed columns
-- ============================================

-- Post type (tip, question, report, discussion, safety_alert)
ALTER TABLE venue_discussions
  ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'discussion'
  CHECK (post_type IN ('tip', 'question', 'report', 'discussion', 'safety_alert'));

-- Racing area reference
ALTER TABLE venue_discussions
  ADD COLUMN IF NOT EXISTS racing_area_id UUID;

-- Map pin location
ALTER TABLE venue_discussions
  ADD COLUMN IF NOT EXISTS location_lat NUMERIC,
  ADD COLUMN IF NOT EXISTS location_lng NUMERIC,
  ADD COLUMN IF NOT EXISTS location_label TEXT;

-- Engagement & resolution
ALTER TABLE venue_discussions
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepted_answer_id UUID;

-- ============================================
-- 3. CONDITION TAGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS venue_post_condition_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES venue_discussions(id) ON DELETE CASCADE,
  -- Wind conditions
  wind_direction_min INTEGER CHECK (wind_direction_min >= 0 AND wind_direction_min < 360),
  wind_direction_max INTEGER CHECK (wind_direction_max >= 0 AND wind_direction_max < 360),
  wind_speed_min NUMERIC,
  wind_speed_max NUMERIC,
  -- Tide
  tide_phase TEXT CHECK (tide_phase IN ('rising', 'falling', 'high', 'low', 'ebb', 'flood')),
  -- Sea state
  wave_height_min NUMERIC,
  wave_height_max NUMERIC,
  -- Current
  current_speed_min NUMERIC,
  current_speed_max NUMERIC,
  -- Time context
  season TEXT CHECK (season IN ('spring', 'summer', 'autumn', 'winter')),
  time_of_day TEXT CHECK (time_of_day IN ('morning', 'midday', 'afternoon', 'evening')),
  -- Human-readable label
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_condition_tags_discussion ON venue_post_condition_tags(discussion_id);
CREATE INDEX IF NOT EXISTS idx_condition_tags_wind ON venue_post_condition_tags(wind_speed_min, wind_speed_max)
  WHERE wind_speed_min IS NOT NULL;

-- ============================================
-- 4. TOPIC TAGS
-- ============================================

CREATE TABLE IF NOT EXISTS venue_topic_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed topic tags
INSERT INTO venue_topic_tags (name, display_name, icon, color, sort_order) VALUES
  ('tactics', 'Tactics', 'compass-outline', '#2563EB', 1),
  ('currents', 'Currents', 'water-outline', '#0891B2', 2),
  ('safety', 'Safety', 'warning-outline', '#DC2626', 3),
  ('marks', 'Marks', 'flag-outline', '#D97706', 4),
  ('logistics', 'Logistics', 'car-outline', '#059669', 5),
  ('weather', 'Weather', 'cloud-outline', '#7C3AED', 6),
  ('rules', 'Rules', 'book-outline', '#6B7280', 7),
  ('gear', 'Gear', 'construct-outline', '#EA580C', 8)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 5. DISCUSSION-TAG JOIN TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS venue_discussion_tags (
  discussion_id UUID NOT NULL REFERENCES venue_discussions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES venue_topic_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (discussion_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_discussion_tags_tag ON venue_discussion_tags(tag_id);

-- ============================================
-- 6. MEMBER ROLES
-- ============================================

CREATE TABLE IF NOT EXISTS venue_member_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('moderator', 'race_officer', 'coach', 'contributor')),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(venue_id, user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_member_roles_venue ON venue_member_roles(venue_id);
CREATE INDEX IF NOT EXISTS idx_member_roles_user ON venue_member_roles(user_id);

-- ============================================
-- 7. SQL FUNCTIONS
-- ============================================

-- Check if user is a venue member (saved venue OR has race results there OR has a role)
CREATE OR REPLACE FUNCTION is_venue_member(p_user_id UUID, p_venue_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check saved_venues
  IF EXISTS (
    SELECT 1 FROM saved_venues
    WHERE user_id = p_user_id AND venue_id = p_venue_id
  ) THEN
    RETURN true;
  END IF;

  -- Check member roles
  IF EXISTS (
    SELECT 1 FROM venue_member_roles
    WHERE user_id = p_user_id AND venue_id = p_venue_id
  ) THEN
    RETURN true;
  END IF;

  -- For now, allow all authenticated users to post
  -- (race_results check can be added when that join is available)
  IF p_user_id IS NOT NULL THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is a venue moderator
CREATE OR REPLACE FUNCTION is_venue_moderator(p_user_id UUID, p_venue_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM venue_member_roles
    WHERE user_id = p_user_id
    AND venue_id = p_venue_id
    AND role = 'moderator'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate hot score for a discussion
CREATE OR REPLACE FUNCTION calculate_hot_score(
  p_upvotes INTEGER,
  p_comments INTEGER,
  p_views INTEGER,
  p_created_at TIMESTAMPTZ,
  p_pinned BOOLEAN
)
RETURNS NUMERIC AS $$
DECLARE
  age_hours NUMERIC;
  score NUMERIC;
BEGIN
  IF p_pinned THEN
    RETURN 999999999;
  END IF;

  age_hours := EXTRACT(EPOCH FROM (now() - p_created_at)) / 3600.0;
  score := (COALESCE(p_upvotes, 0) * 2 + COALESCE(p_comments, 0) * 3 + LEAST(COALESCE(p_views, 0), 100))
           / POWER(age_hours + 2, 1.5);
  RETURN score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get author's venue stats (race count, avg finish, best finish)
CREATE OR REPLACE FUNCTION get_author_venue_stats(p_author_id UUID, p_venue_id TEXT)
RETURNS TABLE(race_count BIGINT, avg_finish NUMERIC, best_finish INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as race_count,
    ROUND(AVG(rr.position)::NUMERIC, 1) as avg_finish,
    MIN(rr.position)::INTEGER as best_finish
  FROM race_results rr
  JOIN races r ON rr.race_id = r.id
  WHERE rr.sailor_id = p_author_id
  AND r.venue_id = p_venue_id
  AND rr.position IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. NEW INDEXES for community feed
-- ============================================

CREATE INDEX IF NOT EXISTS idx_venue_discussions_post_type ON venue_discussions(post_type);
CREATE INDEX IF NOT EXISTS idx_venue_discussions_racing_area ON venue_discussions(racing_area_id)
  WHERE racing_area_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_venue_discussions_location ON venue_discussions(location_lat, location_lng)
  WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_venue_discussions_view_count ON venue_discussions(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_venue_discussions_resolved ON venue_discussions(is_resolved)
  WHERE post_type = 'question';

-- ============================================
-- 9. ROW LEVEL SECURITY for new tables
-- ============================================

ALTER TABLE venue_post_condition_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_topic_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_discussion_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_member_roles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on base tables if not already
ALTER TABLE venue_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_discussion_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_discussion_votes ENABLE ROW LEVEL SECURITY;

-- Condition tags: public read, author write
CREATE POLICY "Condition tags are readable by all"
  ON venue_post_condition_tags FOR SELECT
  USING (true);

CREATE POLICY "Authors can manage condition tags"
  ON venue_post_condition_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM venue_discussions
      WHERE venue_discussions.id = venue_post_condition_tags.discussion_id
      AND venue_discussions.author_id = auth.uid()
    )
  );

-- Topic tags: public read
CREATE POLICY "Topic tags are readable by all"
  ON venue_topic_tags FOR SELECT
  USING (true);

-- Discussion tags: public read, author write
CREATE POLICY "Discussion tags are readable by all"
  ON venue_discussion_tags FOR SELECT
  USING (true);

CREATE POLICY "Authors can manage discussion tags"
  ON venue_discussion_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM venue_discussions
      WHERE venue_discussions.id = venue_discussion_tags.discussion_id
      AND venue_discussions.author_id = auth.uid()
    )
  );

-- Member roles: public read, moderators write
CREATE POLICY "Member roles are readable by all"
  ON venue_member_roles FOR SELECT
  USING (true);

CREATE POLICY "Moderators can manage roles"
  ON venue_member_roles FOR ALL
  USING (
    is_venue_moderator(auth.uid(), venue_id)
  );

-- Discussions: public read (ensure policy exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'venue_discussions' AND policyname = 'Public discussions are readable by all'
  ) THEN
    CREATE POLICY "Public discussions are readable by all"
      ON venue_discussions FOR SELECT
      USING (is_public = true);
  END IF;
END $$;

-- Discussions: member write with membership check
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'venue_discussions' AND policyname = 'Members can create discussions'
  ) THEN
    CREATE POLICY "Members can create discussions"
      ON venue_discussions FOR INSERT
      WITH CHECK (auth.uid() = author_id);
  END IF;
END $$;

-- Update/delete: author OR moderator
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'venue_discussions' AND policyname = 'Authors or moderators can update discussions'
  ) THEN
    CREATE POLICY "Authors or moderators can update discussions"
      ON venue_discussions FOR UPDATE
      USING (
        auth.uid() = author_id
        OR is_venue_moderator(auth.uid(), venue_id)
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'venue_discussions' AND policyname = 'Authors or moderators can delete discussions'
  ) THEN
    CREATE POLICY "Authors or moderators can delete discussions"
      ON venue_discussions FOR DELETE
      USING (
        auth.uid() = author_id
        OR is_venue_moderator(auth.uid(), venue_id)
      );
  END IF;
END $$;

-- Comments RLS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'venue_discussion_comments' AND policyname = 'Comments on public discussions are readable'
  ) THEN
    CREATE POLICY "Comments on public discussions are readable"
      ON venue_discussion_comments FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM venue_discussions
          WHERE venue_discussions.id = venue_discussion_comments.discussion_id
          AND venue_discussions.is_public = true
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'venue_discussion_comments' AND policyname = 'Users can create comments'
  ) THEN
    CREATE POLICY "Users can create comments"
      ON venue_discussion_comments FOR INSERT
      WITH CHECK (auth.uid() = author_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'venue_discussion_comments' AND policyname = 'Authors can update own comments'
  ) THEN
    CREATE POLICY "Authors can update own comments"
      ON venue_discussion_comments FOR UPDATE
      USING (auth.uid() = author_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'venue_discussion_comments' AND policyname = 'Authors can delete own comments'
  ) THEN
    CREATE POLICY "Authors can delete own comments"
      ON venue_discussion_comments FOR DELETE
      USING (auth.uid() = author_id);
  END IF;
END $$;

-- Votes RLS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'venue_discussion_votes' AND policyname = 'Users can manage own votes'
  ) THEN
    CREATE POLICY "Users can manage own votes"
      ON venue_discussion_votes FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================
-- 10. TRIGGERS (idempotent)
-- ============================================

-- Comment count trigger
CREATE OR REPLACE FUNCTION update_discussion_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE venue_discussions
    SET comment_count = comment_count + 1,
        last_activity_at = now()
    WHERE id = NEW.discussion_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE venue_discussions
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.discussion_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_discussion_comment_count ON venue_discussion_comments;
CREATE TRIGGER trigger_update_discussion_comment_count
AFTER INSERT OR DELETE ON venue_discussion_comments
FOR EACH ROW EXECUTE FUNCTION update_discussion_comment_count();

-- Vote count trigger
CREATE OR REPLACE FUNCTION update_discussion_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'discussion' THEN
      IF OLD.vote = 1 THEN
        UPDATE venue_discussions SET upvotes = GREATEST(0, upvotes - 1) WHERE id = OLD.target_id;
      ELSE
        UPDATE venue_discussions SET downvotes = GREATEST(0, downvotes - 1) WHERE id = OLD.target_id;
      END IF;
    ELSIF OLD.target_type = 'comment' THEN
      IF OLD.vote = 1 THEN
        UPDATE venue_discussion_comments SET upvotes = GREATEST(0, upvotes - 1) WHERE id = OLD.target_id;
      ELSE
        UPDATE venue_discussion_comments SET downvotes = GREATEST(0, downvotes - 1) WHERE id = OLD.target_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.target_type = 'discussion' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.vote = 1 THEN
        UPDATE venue_discussions SET upvotes = upvotes + 1 WHERE id = NEW.target_id;
      ELSE
        UPDATE venue_discussions SET downvotes = downvotes + 1 WHERE id = NEW.target_id;
      END IF;
    ELSIF TG_OP = 'UPDATE' AND OLD.vote != NEW.vote THEN
      IF NEW.vote = 1 THEN
        UPDATE venue_discussions SET upvotes = upvotes + 1, downvotes = GREATEST(0, downvotes - 1) WHERE id = NEW.target_id;
      ELSE
        UPDATE venue_discussions SET downvotes = downvotes + 1, upvotes = GREATEST(0, upvotes - 1) WHERE id = NEW.target_id;
      END IF;
    END IF;
  ELSIF NEW.target_type = 'comment' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.vote = 1 THEN
        UPDATE venue_discussion_comments SET upvotes = upvotes + 1 WHERE id = NEW.target_id;
      ELSE
        UPDATE venue_discussion_comments SET downvotes = downvotes + 1 WHERE id = NEW.target_id;
      END IF;
    ELSIF TG_OP = 'UPDATE' AND OLD.vote != NEW.vote THEN
      IF NEW.vote = 1 THEN
        UPDATE venue_discussion_comments SET upvotes = upvotes + 1, downvotes = GREATEST(0, downvotes - 1) WHERE id = NEW.target_id;
      ELSE
        UPDATE venue_discussion_comments SET downvotes = downvotes + 1, upvotes = GREATEST(0, upvotes - 1) WHERE id = NEW.target_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_vote_counts ON venue_discussion_votes;
CREATE TRIGGER trigger_update_vote_counts
AFTER INSERT OR UPDATE OR DELETE ON venue_discussion_votes
FOR EACH ROW EXECUTE FUNCTION update_discussion_vote_counts();

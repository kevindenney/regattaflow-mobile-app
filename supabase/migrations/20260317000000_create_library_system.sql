-- Library system: user-curated learning resources per interest
-- Users can link external resources (YouTube, courses, books, etc.) to their steps

-- ---------------------------------------------------------------------------
-- 1. user_libraries — one library per user per interest
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_libraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Library',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, interest_id)
);

ALTER TABLE user_libraries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own libraries"
  ON user_libraries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own libraries"
  ON user_libraries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own libraries"
  ON user_libraries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own libraries"
  ON user_libraries FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2. library_resources — individual resource links
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS library_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES user_libraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  resource_type TEXT NOT NULL DEFAULT 'other'
    CHECK (resource_type IN (
      'online_course', 'youtube_channel', 'youtube_video',
      'website', 'book_digital', 'book_physical',
      'social_media', 'cloud_folder', 'other'
    )),
  source_platform TEXT,
  author_or_creator TEXT,
  description TEXT,
  thumbnail_url TEXT,
  capability_goals JSONB NOT NULL DEFAULT '[]',
  tags JSONB NOT NULL DEFAULT '[]',
  sort_order INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE library_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own resources"
  ON library_resources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resources"
  ON library_resources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resources"
  ON library_resources FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resources"
  ON library_resources FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX idx_library_resources_library_id ON library_resources(library_id);
CREATE INDEX idx_library_resources_user_id ON library_resources(user_id);
CREATE INDEX idx_library_resources_type ON library_resources(resource_type);
CREATE INDEX idx_user_libraries_user_interest ON user_libraries(user_id, interest_id);

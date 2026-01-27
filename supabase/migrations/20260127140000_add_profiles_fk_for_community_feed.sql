-- Add direct FK from venue_discussions.author_id to profiles.id
-- so PostgREST can resolve the author join in CommunityFeedService queries.
-- The existing FK to auth.users(id) remains; this adds a parallel FK to profiles.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'venue_discussions_author_profile_fkey'
  ) THEN
    ALTER TABLE venue_discussions
      ADD CONSTRAINT venue_discussions_author_profile_fkey
      FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Same fix for venue_discussion_comments.author_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'venue_discussion_comments_author_profile_fkey'
  ) THEN
    ALTER TABLE venue_discussion_comments
      ADD CONSTRAINT venue_discussion_comments_author_profile_fkey
      FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

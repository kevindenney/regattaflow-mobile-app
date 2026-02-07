-- =====================================================
-- Allow Community-Only Posts Migration
-- Makes venue_id nullable so posts can belong to communities
-- without being tied to a specific sailing venue
-- =====================================================

-- Drop the NOT NULL constraint on venue_id
-- This allows posts to be associated with just a community (e.g., Dragon Worlds)
ALTER TABLE venue_discussions
  ALTER COLUMN venue_id DROP NOT NULL;

-- Add a check constraint to ensure posts have at least one association
-- Either venue_id OR community_id must be set (or both)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'venue_discussions_has_association'
  ) THEN
    ALTER TABLE venue_discussions
      ADD CONSTRAINT venue_discussions_has_association
      CHECK (venue_id IS NOT NULL OR community_id IS NOT NULL);
  END IF;
END $$;

-- Update any existing posts that have community_id but null venue_id
-- (There shouldn't be any, but just in case)
-- This is a no-op if none exist

-- Create a partial index for community-only posts (no venue)
CREATE INDEX IF NOT EXISTS idx_venue_discussions_community_only
  ON venue_discussions(community_id, created_at DESC)
  WHERE venue_id IS NULL AND community_id IS NOT NULL;

-- Update the RLS policy for discussions to handle community-only posts
-- The existing policy checks auth.uid() = author_id which still works

-- Add a comment explaining the dual-association model
COMMENT ON COLUMN venue_discussions.venue_id IS 'Optional venue association. NULL for community-only posts (e.g., race communities without a physical venue).';
COMMENT ON COLUMN venue_discussions.community_id IS 'Optional community association. Posts can have venue_id, community_id, or both.';
COMMENT ON CONSTRAINT venue_discussions_has_association ON venue_discussions IS 'Ensures every post has at least one association (venue or community).';

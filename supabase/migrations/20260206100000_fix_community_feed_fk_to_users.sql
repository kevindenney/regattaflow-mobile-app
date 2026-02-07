-- Fix FK constraints for community feed tables
--
-- Issue: The migration 20260127140000_add_profiles_fk_for_community_feed.sql
-- added FK constraints referencing the `profiles` table, but users are actually
-- stored in the `users` table (as created by firebase-auth-bridge).
--
-- This causes foreign key violations when users try to create comments:
-- "Key is not present in table profiles"
--
-- Fix: Drop the profiles FK and add FK to users table instead.
--
-- IMPORTANT: The CommunityFeedService must also be updated to use
-- `users!author_id` instead of `profiles!author_id` in PostgREST queries.

-- ============================================
-- STEP 1: Drop the incorrect FK constraints
-- ============================================

ALTER TABLE venue_discussions
  DROP CONSTRAINT IF EXISTS venue_discussions_author_profile_fkey;

ALTER TABLE venue_discussion_comments
  DROP CONSTRAINT IF EXISTS venue_discussion_comments_author_profile_fkey;

-- ============================================
-- STEP 2: Add correct FK constraints to users
-- ============================================

-- venue_discussions.author_id -> users(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'venue_discussions_author_users_fkey'
  ) THEN
    ALTER TABLE venue_discussions
      ADD CONSTRAINT venue_discussions_author_users_fkey
      FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- venue_discussion_comments.author_id -> users(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'venue_discussion_comments_author_users_fkey'
  ) THEN
    ALTER TABLE venue_discussion_comments
      ADD CONSTRAINT venue_discussion_comments_author_users_fkey
      FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- STEP 3: Add comments for documentation
-- ============================================

COMMENT ON CONSTRAINT venue_discussions_author_users_fkey ON venue_discussions IS
  'References users table for PostgREST joins (fixed from profiles on 2026-02-06)';

COMMENT ON CONSTRAINT venue_discussion_comments_author_users_fkey ON venue_discussion_comments IS
  'References users table for PostgREST joins (fixed from profiles on 2026-02-06)';

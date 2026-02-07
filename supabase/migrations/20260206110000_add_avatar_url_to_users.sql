-- Add avatar_url column to users table
--
-- The firebase-auth-bridge writes avatar_url but the column didn't exist.
-- This migration adds the column and updates the CommunityFeedService
-- author joins to work correctly.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.users.avatar_url IS
  'User avatar URL, typically from social auth providers (Apple, Google, Firebase)';

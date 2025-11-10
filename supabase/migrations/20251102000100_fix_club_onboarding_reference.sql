-- Fix club_onboarding_sessions to reference yacht_clubs instead of clubs

-- Drop the foreign key constraint if it exists
ALTER TABLE IF EXISTS public.club_onboarding_sessions
  DROP CONSTRAINT IF EXISTS club_onboarding_sessions_club_id_fkey;

-- Change club_id column type to TEXT to match yacht_clubs.id
ALTER TABLE public.club_onboarding_sessions
  ALTER COLUMN club_id TYPE TEXT;

-- Add the correct foreign key constraint
ALTER TABLE public.club_onboarding_sessions
  ADD CONSTRAINT club_onboarding_sessions_club_id_fkey
  FOREIGN KEY (club_id)
  REFERENCES public.yacht_clubs(id)
  ON DELETE SET NULL;

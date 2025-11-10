-- Fix fleets.club_id foreign key to reference clubs table instead of users table
-- Migration: 20251106140000_fix_fleets_club_id_fkey

-- Drop the incorrect foreign key constraint
ALTER TABLE public.fleets
  DROP CONSTRAINT IF EXISTS fleets_club_id_fkey;

-- Add the correct foreign key constraint pointing to clubs table
ALTER TABLE public.fleets
  ADD CONSTRAINT fleets_club_id_fkey
  FOREIGN KEY (club_id)
  REFERENCES public.clubs(id)
  ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_fleets_club_id ON public.fleets(club_id);

-- =====================================================
-- Add foreign key constraint to club_members.club_id
-- This enables PostgREST join syntax: clubs!club_id
-- =====================================================

-- Add foreign key constraint from club_members.club_id to clubs.id
ALTER TABLE public.club_members
  ADD CONSTRAINT club_members_club_id_fkey
  FOREIGN KEY (club_id)
  REFERENCES public.clubs(id)
  ON DELETE CASCADE;

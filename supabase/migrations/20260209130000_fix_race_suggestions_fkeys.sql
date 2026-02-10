-- Fix race_suggestions FK references to point to public.users instead of auth.users
-- This allows PostgREST to join on the users table for display info

ALTER TABLE public.race_suggestions
  DROP CONSTRAINT race_suggestions_suggester_id_fkey,
  DROP CONSTRAINT race_suggestions_race_owner_id_fkey;

ALTER TABLE public.race_suggestions
  ADD CONSTRAINT race_suggestions_suggester_id_fkey FOREIGN KEY (suggester_id) REFERENCES public.users(id),
  ADD CONSTRAINT race_suggestions_race_owner_id_fkey FOREIGN KEY (race_owner_id) REFERENCES public.users(id);

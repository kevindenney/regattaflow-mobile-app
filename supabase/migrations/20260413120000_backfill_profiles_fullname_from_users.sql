-- Backfill: sync profiles.full_name from users.full_name where they diverge
-- Root cause: the previous backfill in 20260413110000 ran but auth.users metadata
-- was stale, so the trigger path (auth → profiles) never propagated the new name.
-- The app-side belt-and-suspenders sync was also added after names were already changed.

UPDATE public.profiles p
SET full_name = u.full_name
FROM public.users u
WHERE p.id = u.id
  AND u.full_name IS NOT NULL
  AND u.full_name <> ''
  AND (p.full_name IS NULL OR p.full_name <> u.full_name);

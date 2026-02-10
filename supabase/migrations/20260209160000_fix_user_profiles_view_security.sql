-- Fix user_profiles view: change from security_invoker to security_definer.
-- With security_invoker = true, the view runs with the calling user's
-- permissions.  The 'authenticated' role does NOT have SELECT on auth.users,
-- so the view silently returns 0 rows for normal API callers.
-- Switching to security_definer (the default) lets the view run as the
-- owner (postgres), which CAN read auth.users.

ALTER VIEW public.user_profiles SET (security_invoker = false);

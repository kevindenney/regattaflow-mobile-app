-- Force PostgREST to reload schema cache so the new
-- "Authenticated users can create notifications" policy takes effect.
-- Also re-grant INSERT to authenticated as a safety measure.

GRANT INSERT ON social_notifications TO authenticated;

NOTIFY pgrst, 'reload schema';

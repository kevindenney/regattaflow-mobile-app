-- Optional cleanup for legacy demo coaches.
-- Safety: this migration is non-destructive unless explicitly enabled.
-- To run cleanup intentionally, execute before migration:
--   SET app.allow_demo_coach_cleanup = 'true';

DO $$
BEGIN
  IF COALESCE(current_setting('app.allow_demo_coach_cleanup', true), 'false') <> 'true' THEN
    RAISE NOTICE 'Skipping demo coach cleanup (set app.allow_demo_coach_cleanup=true to enable).';
    RETURN;
  END IF;

  -- Delete coaching sessions associated with known demo coaches first (FK-safe).
  DELETE FROM coaching_sessions
  WHERE coach_id IN (
    SELECT id
    FROM coach_profiles
    WHERE display_name IN ('Sarah Chen', 'James "Jimmy" Wilson', 'Coach Anderson')
  );

  -- Delete known demo coach profiles by display name.
  DELETE FROM coach_profiles
  WHERE display_name IN ('Sarah Chen', 'James "Jimmy" Wilson', 'Coach Anderson');

  -- Delete known demo coach profiles by seeded test emails.
  DELETE FROM coach_profiles
  WHERE user_id IN (
    SELECT id
    FROM auth.users
    WHERE email IN ('coach-test@regattaflow.com', 'coachkdenney@icloud.com', 'coach.anderson@sailing.com')
  );
END $$;

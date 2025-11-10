-- Add unique constraint on user_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'coach_profiles_user_id_key'
  ) THEN
    ALTER TABLE coach_profiles ADD CONSTRAINT coach_profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Create coach profiles for all users with user_type = 'coach' who don't have one yet
INSERT INTO coach_profiles (user_id, bio, experience_years, is_active, display_name, specializations)
SELECT
  u.id,
  'Experienced sailing coach',
  5,
  true,
  COALESCE(NULLIF(u.full_name, ''), 'Coach'),
  ARRAY['racing', 'technique']::text[]
FROM users u
WHERE u.user_type = 'coach'
AND NOT EXISTS (
  SELECT 1 FROM coach_profiles cp WHERE cp.user_id = u.id
);

-- Create a trigger to automatically create coach profiles when user_type is set to 'coach'
CREATE OR REPLACE FUNCTION create_coach_profile_on_user_type_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_type is being set to 'coach' and no coach_profile exists, create one
  IF NEW.user_type = 'coach' AND (OLD.user_type IS NULL OR OLD.user_type != 'coach') THEN
    INSERT INTO coach_profiles (user_id, bio, experience_years, is_active, display_name, specializations)
    VALUES (
      NEW.id,
      'Experienced sailing coach',
      5,
      true,
      COALESCE(NULLIF(NEW.full_name, ''), 'Coach'),
      ARRAY['racing', 'technique']::text[]
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS create_coach_profile_trigger ON users;

-- Create the trigger
CREATE TRIGGER create_coach_profile_trigger
AFTER INSERT OR UPDATE OF user_type ON users
FOR EACH ROW
EXECUTE FUNCTION create_coach_profile_on_user_type_change();

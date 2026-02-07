-- =====================================================
-- Firebase User Linking Migration
-- Enables Dragon Worlds users to authenticate via Firebase
-- and access RegattaFlow Discuss features
-- =====================================================

-- ============================================
-- 1. ADD firebase_uid TO users TABLE
-- ============================================

-- Add firebase_uid column for linking Firebase accounts
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS firebase_uid TEXT UNIQUE;

-- Index for fast lookup by Firebase UID
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid
  ON users(firebase_uid)
  WHERE firebase_uid IS NOT NULL;

-- ============================================
-- 2. ADD auth_source TO users TABLE
-- ============================================

-- Track where the user originally came from
-- 'native' = RegattaFlow signup
-- 'dragon_worlds' = Firebase bridge from Dragon Worlds app
-- 'google' = Google OAuth
-- 'apple' = Apple OAuth
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS auth_source TEXT DEFAULT 'native';

-- ============================================
-- 3. HELPER FUNCTION: Find or create user from Firebase
-- ============================================

CREATE OR REPLACE FUNCTION find_or_create_firebase_user(
  p_firebase_uid TEXT,
  p_email TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_boat_class TEXT DEFAULT NULL,
  p_club_name TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE (
  user_id UUID,
  is_new_user BOOLEAN,
  supabase_user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_supabase_user_id UUID;
  v_is_new BOOLEAN := false;
BEGIN
  -- First, try to find existing user by firebase_uid
  SELECT id INTO v_user_id
  FROM users
  WHERE firebase_uid = p_firebase_uid;

  IF v_user_id IS NOT NULL THEN
    -- Found by firebase_uid, return existing user
    RETURN QUERY SELECT v_user_id, false, v_user_id;
    RETURN;
  END IF;

  -- Try to find by email (existing RegattaFlow user)
  SELECT id INTO v_user_id
  FROM users
  WHERE LOWER(email) = LOWER(p_email);

  IF v_user_id IS NOT NULL THEN
    -- Link Firebase UID to existing user
    UPDATE users
    SET firebase_uid = p_firebase_uid,
        updated_at = now()
    WHERE id = v_user_id;

    RETURN QUERY SELECT v_user_id, false, v_user_id;
    RETURN;
  END IF;

  -- No existing user found, create new one
  -- Note: The actual Supabase auth.users entry will be created by the Edge Function
  -- This just creates the public.users profile entry
  v_is_new := true;

  -- We'll return NULL for user_id since the Edge Function will create the auth user
  RETURN QUERY SELECT NULL::UUID, true, NULL::UUID;
  RETURN;
END;
$$;

COMMENT ON FUNCTION find_or_create_firebase_user IS
  'Finds an existing user by Firebase UID or email, or indicates a new user needs to be created';

-- ============================================
-- 4. HELPER FUNCTION: Update user profile from Firebase data
-- ============================================

CREATE OR REPLACE FUNCTION update_user_from_firebase(
  p_user_id UUID,
  p_firebase_uid TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_boat_class TEXT DEFAULT NULL,
  p_club_name TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the user profile with Firebase data
  UPDATE users
  SET
    firebase_uid = COALESCE(firebase_uid, p_firebase_uid),
    full_name = COALESCE(full_name, p_full_name),
    avatar_url = COALESCE(avatar_url, p_avatar_url),
    auth_source = CASE
      WHEN auth_source = 'native' AND firebase_uid IS NULL
      THEN 'dragon_worlds'
      ELSE auth_source
    END,
    updated_at = now()
  WHERE id = p_user_id;

  -- If boat_class provided, try to look up and associate
  IF p_boat_class IS NOT NULL THEN
    -- Store in metadata for now, can be processed later
    UPDATE users
    SET metadata = COALESCE(metadata, '{}'::jsonb) ||
        jsonb_build_object('dragon_worlds_boat_class', p_boat_class)
    WHERE id = p_user_id;
  END IF;

  -- If club_name provided, store in metadata
  IF p_club_name IS NOT NULL THEN
    UPDATE users
    SET metadata = COALESCE(metadata, '{}'::jsonb) ||
        jsonb_build_object('dragon_worlds_club', p_club_name)
    WHERE id = p_user_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION update_user_from_firebase IS
  'Updates user profile with data synced from Firebase/Dragon Worlds';

-- ============================================
-- 5. ADD metadata COLUMN IF NOT EXISTS
-- ============================================

-- Ensure users table has metadata column for storing additional info
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================

-- The Edge Function will use service role, so no special grants needed
-- But ensure the functions are accessible
GRANT EXECUTE ON FUNCTION find_or_create_firebase_user TO service_role;
GRANT EXECUTE ON FUNCTION update_user_from_firebase TO service_role;

-- ============================================
-- 7. COMMENTS
-- ============================================

COMMENT ON COLUMN users.firebase_uid IS 'Firebase UID for Dragon Worlds app integration';
COMMENT ON COLUMN users.auth_source IS 'Where the user originally signed up: native, dragon_worlds, google, apple';
COMMENT ON COLUMN users.metadata IS 'Additional user metadata (boat class, club from external apps, etc.)';

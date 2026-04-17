-- Fix profile name sync: trigger on UPDATE + upsert with DO UPDATE
-- Previously the trigger only fired on INSERT and the upsert used DO NOTHING,
-- so name changes in the users table never propagated to profiles.

BEGIN;

-- 1. Update ensure_profile_for_user to use DO UPDATE for full_name
CREATE OR REPLACE FUNCTION public.ensure_profile_for_user(
  p_user_id uuid,
  p_user_email text DEFAULT null,
  p_user_full_name text DEFAULT null
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  profiles_relkind "char";
  has_id boolean;
  has_user_id boolean;
  has_email boolean;
  has_full_name boolean;
  columns_sql text;
  values_sql text;
  conflict_sql text;
  stmt text;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT c.relkind
  INTO profiles_relkind
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'profiles'
  LIMIT 1;

  IF profiles_relkind IS DISTINCT FROM 'r' THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id'
  ) INTO has_id;

  IF NOT has_id THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id'
  ) INTO has_user_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
  ) INTO has_email;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
  ) INTO has_full_name;

  columns_sql := 'id';
  values_sql := '$1';
  conflict_sql := '';

  IF has_user_id THEN
    columns_sql := columns_sql || ', user_id';
    values_sql := values_sql || ', $1';
  END IF;

  IF has_email THEN
    columns_sql := columns_sql || ', email';
    values_sql := values_sql || ', $2';
  END IF;

  IF has_full_name THEN
    columns_sql := columns_sql || ', full_name';
    values_sql := values_sql || ', COALESCE($3, $2, ''User'')';
    -- On conflict, update full_name if a new value is provided
    conflict_sql := 'SET full_name = COALESCE(EXCLUDED.full_name, profiles.full_name)';
  END IF;

  IF conflict_sql = '' THEN
    stmt := format(
      'INSERT INTO public.profiles (%s) VALUES (%s) ON CONFLICT (id) DO NOTHING',
      columns_sql,
      values_sql
    );
  ELSE
    stmt := format(
      'INSERT INTO public.profiles (%s) VALUES (%s) ON CONFLICT (id) DO UPDATE %s',
      columns_sql,
      values_sql,
      conflict_sql
    );
  END IF;

  EXECUTE stmt USING p_user_id, p_user_email, p_user_full_name;
END;
$$;

-- 2. Recreate triggers to fire on both INSERT and UPDATE
DROP TRIGGER IF EXISTS trg_public_users_profile_sync ON public.users;
CREATE TRIGGER trg_public_users_profile_sync
  AFTER INSERT OR UPDATE OF full_name ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_public_users_profile_sync();

-- Also fix auth.users trigger if it exists
DO $$
BEGIN
  IF to_regclass('auth.users') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS trg_auth_users_profile_sync ON auth.users;
    CREATE TRIGGER trg_auth_users_profile_sync
      AFTER INSERT OR UPDATE ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_auth_users_profile_sync();
  END IF;
END;
$$;

-- 3. Backfill: sync any existing mismatches (users.full_name → profiles.full_name)
UPDATE public.profiles p
SET full_name = u.full_name
FROM public.users u
WHERE p.id = u.id
  AND u.full_name IS NOT NULL
  AND u.full_name <> ''
  AND (p.full_name IS NULL OR p.full_name <> u.full_name);

COMMIT;

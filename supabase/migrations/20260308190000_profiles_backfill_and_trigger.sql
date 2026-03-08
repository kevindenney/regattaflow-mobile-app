BEGIN;

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
  END IF;

  stmt := format(
    'INSERT INTO public.profiles (%s) VALUES (%s) ON CONFLICT (id) DO NOTHING',
    columns_sql,
    values_sql
  );

  EXECUTE stmt USING p_user_id, p_user_email, p_user_full_name;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_public_users_profile_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.ensure_profile_for_user(NEW.id, NEW.email, NEW.full_name);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_auth_users_profile_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.ensure_profile_for_user(
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name')
  );
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  profiles_relkind "char";
BEGIN
  SELECT c.relkind
  INTO profiles_relkind
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'profiles'
  LIMIT 1;

  IF profiles_relkind IS NULL THEN
    RAISE NOTICE 'public.profiles not found; skipping profiles backfill/trigger/policy';
    RETURN;
  END IF;

  IF profiles_relkind <> 'r' THEN
    RAISE NOTICE 'public.profiles is relkind=% (not table); skipping profiles backfill/trigger/policy', profiles_relkind;
    RETURN;
  END IF;

  IF to_regclass('public.users') IS NOT NULL THEN
    PERFORM public.ensure_profile_for_user(u.id, u.email, u.full_name)
    FROM public.users u
    WHERE u.id IS NOT NULL;

    DROP TRIGGER IF EXISTS trg_public_users_profile_sync ON public.users;
    CREATE TRIGGER trg_public_users_profile_sync
      AFTER INSERT ON public.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_public_users_profile_sync();

    RAISE NOTICE 'profiles backfill + trigger configured from public.users';
  ELSIF to_regclass('auth.users') IS NOT NULL THEN
    PERFORM public.ensure_profile_for_user(
      u.id,
      u.email,
      COALESCE(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name')
    )
    FROM auth.users u
    WHERE u.id IS NOT NULL;

    DROP TRIGGER IF EXISTS trg_auth_users_profile_sync ON auth.users;
    CREATE TRIGGER trg_auth_users_profile_sync
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_auth_users_profile_sync();

    RAISE NOTICE 'profiles backfill + trigger configured from auth.users';
  END IF;

  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "profiles_select_own_v1" ON public.profiles;
  CREATE POLICY "profiles_select_own_v1"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_profile_for_user(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_public_users_profile_sync() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_auth_users_profile_sync() TO authenticated;

COMMIT;

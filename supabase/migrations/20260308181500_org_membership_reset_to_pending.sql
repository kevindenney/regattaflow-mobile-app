BEGIN;

CREATE OR REPLACE FUNCTION public.admin_reset_org_member_to_pending(
  p_org_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  can_manage boolean;
  has_status boolean;
  has_is_verified boolean;
  has_verified_at boolean;
  has_joined_at boolean;
  update_sql text;
  insert_sql text;
  inserted_values_sql text;
  rows_updated bigint;
BEGIN
  IF p_org_id IS NULL OR p_user_id IS NULL THEN
    RAISE EXCEPTION 'Organization id and user id are required.' USING ERRCODE = '22023';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.organization_memberships om
    WHERE om.organization_id = p_org_id
      AND om.user_id = auth.uid()
      AND lower(coalesce(om.role, '')) IN ('owner', 'admin', 'manager')
      AND coalesce(om.membership_status, om.status) IN ('active', 'verified')
  )
  INTO can_manage;

  IF NOT can_manage THEN
    RAISE EXCEPTION 'Admin access required.' USING ERRCODE = '42501';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organization_memberships'
      AND column_name = 'status'
  ) INTO has_status;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organization_memberships'
      AND column_name = 'is_verified'
  ) INTO has_is_verified;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organization_memberships'
      AND column_name = 'verified_at'
  ) INTO has_verified_at;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organization_memberships'
      AND column_name = 'joined_at'
  ) INTO has_joined_at;

  update_sql :=
    'UPDATE public.organization_memberships '
    || 'SET membership_status = ''pending'', role = ''member'', verification_source = ''invite''';

  IF has_status THEN
    update_sql := update_sql || ', status = ''pending''';
  END IF;
  IF has_is_verified THEN
    update_sql := update_sql || ', is_verified = false';
  END IF;
  IF has_verified_at THEN
    update_sql := update_sql || ', verified_at = null';
  END IF;
  IF has_joined_at THEN
    update_sql := update_sql || ', joined_at = null';
  END IF;

  update_sql := update_sql || ' WHERE organization_id = $1 AND user_id = $2';

  EXECUTE update_sql USING p_org_id, p_user_id;
  GET DIAGNOSTICS rows_updated = ROW_COUNT;

  IF rows_updated > 0 THEN
    RETURN;
  END IF;

  insert_sql :=
    'INSERT INTO public.organization_memberships '
    || '(organization_id, user_id, role, membership_status, verification_source';
  inserted_values_sql :=
    ') VALUES ($1, $2, ''member'', ''pending'', ''invite''';

  IF has_status THEN
    insert_sql := insert_sql || ', status';
    inserted_values_sql := inserted_values_sql || ', ''pending''';
  END IF;
  IF has_is_verified THEN
    insert_sql := insert_sql || ', is_verified';
    inserted_values_sql := inserted_values_sql || ', false';
  END IF;
  IF has_verified_at THEN
    insert_sql := insert_sql || ', verified_at';
    inserted_values_sql := inserted_values_sql || ', null';
  END IF;
  IF has_joined_at THEN
    insert_sql := insert_sql || ', joined_at';
    inserted_values_sql := inserted_values_sql || ', null';
  END IF;

  insert_sql := insert_sql || inserted_values_sql || ')';

  EXECUTE insert_sql USING p_org_id, p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reset_org_member_to_pending(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.admin_reset_org_member_to_pending(uuid, uuid)
  IS 'Org admin utility: resets a membership to pending (request_to_join retest loop).';

COMMIT;

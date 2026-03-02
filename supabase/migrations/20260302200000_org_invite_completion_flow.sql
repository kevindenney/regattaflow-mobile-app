-- =============================================================================
-- Organization invite completion flow hardening
--
-- Canonical ownership:
-- - Owns token lookup/open RPCs and staged invite response compatibility flow:
--   `get_organization_invite_by_token`, `mark_organization_invite_opened`,
--   `map_org_invite_role_v1`, `respond_to_organization_invite_v1`.
-- Override intent:
-- - Versioned compatibility symbols are intentionally retained while canonical
--   unversioned role mapping/response symbols are finalized in
--   `20260302220000_enforce_org_invite_role_issuance.sql`.
-- Compatibility:
-- - Retains `_v1` function names for rollout/backward compatibility.
-- =============================================================================

BEGIN;

ALTER TABLE public.organization_memberships
  DROP CONSTRAINT IF EXISTS organization_memberships_role_check;

ALTER TABLE public.organization_memberships
  ADD CONSTRAINT organization_memberships_role_check
  CHECK (role IN (
    'owner', 'admin', 'manager', 'coordinator', 'faculty', 'preceptor', 'instructor',
    'coach', 'tutor', 'assessor', 'staff', 'volunteer', 'student', 'member', 'guest'
  ));

CREATE OR REPLACE FUNCTION public.map_org_invite_role_v1(
  p_role_key text,
  p_role_label text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN lower(COALESCE(p_role_key, '') || ' ' || COALESCE(p_role_label, '')) LIKE '%owner%' THEN 'owner'
    WHEN lower(COALESCE(p_role_key, '') || ' ' || COALESCE(p_role_label, '')) LIKE '%admin%' THEN 'admin'
    WHEN lower(COALESCE(p_role_key, '') || ' ' || COALESCE(p_role_label, '')) LIKE '%director%'
      OR lower(COALESCE(p_role_key, '') || ' ' || COALESCE(p_role_label, '')) LIKE '%manager%' THEN 'manager'
    WHEN lower(COALESCE(p_role_key, '') || ' ' || COALESCE(p_role_label, '')) LIKE '%coordinator%' THEN 'coordinator'
    WHEN lower(COALESCE(p_role_key, '') || ' ' || COALESCE(p_role_label, '')) LIKE '%faculty%'
      OR lower(COALESCE(p_role_key, '') || ' ' || COALESCE(p_role_label, '')) LIKE '%instructor%' THEN 'faculty'
    WHEN lower(COALESCE(p_role_key, '') || ' ' || COALESCE(p_role_label, '')) LIKE '%preceptor%' THEN 'preceptor'
    WHEN lower(COALESCE(p_role_key, '') || ' ' || COALESCE(p_role_label, '')) LIKE '%assessor%'
      OR lower(COALESCE(p_role_key, '') || ' ' || COALESCE(p_role_label, '')) LIKE '%evaluator%' THEN 'assessor'
    WHEN lower(COALESCE(p_role_key, '') || ' ' || COALESCE(p_role_label, '')) LIKE '%staff%'
      OR lower(COALESCE(p_role_key, '') || ' ' || COALESCE(p_role_label, '')) LIKE '%committee%' THEN 'staff'
    WHEN lower(COALESCE(p_role_key, '') || ' ' || COALESCE(p_role_label, '')) LIKE '%coach%'
      OR lower(COALESCE(p_role_key, '') || ' ' || COALESCE(p_role_label, '')) LIKE '%tutor%' THEN 'coach'
    WHEN lower(COALESCE(p_role_key, '') || ' ' || COALESCE(p_role_label, '')) LIKE '%guest%' THEN 'guest'
    ELSE 'member'
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_organization_invite_by_token(p_invite_token text)
RETURNS public.organization_invites
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text := lower(trim(COALESCE(p_invite_token, '')));
  v_invite public.organization_invites;
BEGIN
  IF v_token = '' THEN
    RETURN NULL;
  END IF;

  SELECT *
  INTO v_invite
  FROM public.organization_invites oi
  WHERE lower(oi.invite_token) = v_token
  LIMIT 1;

  RETURN v_invite;
END;
$$;

REVOKE ALL ON FUNCTION public.get_organization_invite_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_organization_invite_by_token(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.mark_organization_invite_opened(p_invite_token text)
RETURNS public.organization_invites
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text := lower(trim(COALESCE(p_invite_token, '')));
  v_invite public.organization_invites;
BEGIN
  IF v_token = '' THEN
    RETURN NULL;
  END IF;

  UPDATE public.organization_invites oi
  SET
    status = 'opened',
    responded_at = COALESCE(oi.responded_at, now())
  WHERE lower(oi.invite_token) = v_token
    AND oi.status IN ('draft', 'sent')
  RETURNING *
  INTO v_invite;

  IF v_invite.id IS NOT NULL THEN
    RETURN v_invite;
  END IF;

  RETURN public.get_organization_invite_by_token(v_token);
END;
$$;

REVOKE ALL ON FUNCTION public.mark_organization_invite_opened(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_organization_invite_opened(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.respond_to_organization_invite_v1(
  p_invite_token text,
  p_decision text
)
RETURNS public.organization_invites
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text := lower(trim(COALESCE(p_invite_token, '')));
  v_decision text := lower(trim(COALESCE(p_decision, '')));
  v_now timestamptz := now();
  v_user_id uuid := auth.uid();
  v_user_email text := lower(trim(COALESCE(auth.jwt() ->> 'email', '')));
  v_invite public.organization_invites;
  v_role text;
  v_membership_metadata jsonb;
  v_activation_allowed boolean := false;
BEGIN
  IF v_token = '' THEN
    RAISE EXCEPTION 'Invite token is required.';
  END IF;

  IF v_decision NOT IN ('accepted', 'declined') THEN
    RAISE EXCEPTION 'Decision must be accepted or declined.';
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  SELECT *
  INTO v_invite
  FROM public.organization_invites oi
  WHERE lower(oi.invite_token) = v_token
  LIMIT 1
  FOR UPDATE;

  IF v_invite.id IS NULL THEN
    RAISE EXCEPTION 'Invite not found.';
  END IF;

  IF v_invite.status IN ('revoked', 'failed') THEN
    RAISE EXCEPTION 'Invite is no longer active.';
  END IF;

  IF v_invite.invitee_email IS NULL OR lower(trim(v_invite.invitee_email)) <> v_user_email THEN
    RAISE EXCEPTION 'Invite email does not match signed-in user.';
  END IF;

  IF v_invite.status IN ('accepted', 'declined') THEN
    IF v_invite.status = v_decision THEN
      RETURN v_invite;
    END IF;
    RAISE EXCEPTION 'Invite already responded to.';
  END IF;

  IF v_decision = 'accepted' THEN
    v_role := public.map_org_invite_role_v1(v_invite.role_key, v_invite.role_label);
    v_membership_metadata := jsonb_build_object(
      'accepted_invite_id', v_invite.id,
      'accepted_invite_token', v_invite.invite_token,
      'accepted_invite_role_label', v_invite.role_label,
      'accepted_invite_at', v_now
    );

    INSERT INTO public.organization_memberships (
      organization_id,
      user_id,
      role,
      status,
      is_verified,
      verification_source,
      verified_at,
      joined_at,
      metadata
    )
    VALUES (
      v_invite.organization_id,
      v_user_id,
      v_role,
      'active',
      true,
      'invite',
      v_now,
      v_now,
      v_membership_metadata
    )
    ON CONFLICT (organization_id, user_id)
    DO UPDATE
    SET
      role = CASE
        WHEN organization_memberships.status IN ('pending', 'invited', 'inactive', 'rejected')
          THEN EXCLUDED.role
        ELSE organization_memberships.role
      END,
      status = CASE
        WHEN organization_memberships.status IN ('pending', 'invited', 'inactive', 'rejected')
          THEN 'active'
        ELSE organization_memberships.status
      END,
      is_verified = CASE
        WHEN organization_memberships.status IN ('pending', 'invited', 'inactive', 'rejected')
          THEN true
        ELSE organization_memberships.is_verified
      END,
      verification_source = CASE
        WHEN organization_memberships.status IN ('pending', 'invited', 'inactive', 'rejected')
          THEN 'invite'
        ELSE organization_memberships.verification_source
      END,
      verified_at = CASE
        WHEN organization_memberships.status IN ('pending', 'invited', 'inactive', 'rejected')
          THEN v_now
        ELSE organization_memberships.verified_at
      END,
      joined_at = COALESCE(organization_memberships.joined_at, v_now),
      metadata = COALESCE(organization_memberships.metadata, '{}'::jsonb) || v_membership_metadata,
      updated_at = v_now
    RETURNING (
      status IN ('active', 'verified')
    )
    INTO v_activation_allowed;

    IF NOT v_activation_allowed THEN
      RAISE EXCEPTION 'Membership activation failed.';
    END IF;
  END IF;

  UPDATE public.organization_invites oi
  SET
    status = v_decision,
    responded_at = COALESCE(oi.responded_at, v_now)
  WHERE oi.id = v_invite.id
  RETURNING *
  INTO v_invite;

  RETURN v_invite;
END;
$$;

REVOKE ALL ON FUNCTION public.respond_to_organization_invite_v1(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_to_organization_invite_v1(text, text) TO authenticated;

COMMIT;

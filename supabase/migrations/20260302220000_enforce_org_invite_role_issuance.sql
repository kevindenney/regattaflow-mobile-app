-- =============================================================================
-- Enforce organization invite role issuance ceilings by inviter role
--
-- Canonical ownership:
-- - Owns canonical role issuance ceiling enforcement symbols:
--   `map_org_invite_role`, `can_inviter_issue_org_invite_role`,
--   `enforce_org_invite_role_issuance`, trigger
--   `trigger_enforce_org_invite_role_issuance`, and
--   `respond_to_organization_invite`.
-- Override intent:
-- - Finalizes unversioned role mapping/respond symbols that supersede staged
--   compatibility symbols from `20260302200000...`.
-- Compatibility:
-- - `*_v1` counterparts remain in `20260302200000...` intentionally for
--   backward compatibility during rollout.
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.map_org_invite_role(
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
    WHEN lower(COALESCE(p_role_key, '') || ' ' || COALESCE(p_role_label, '')) LIKE '%volunteer%' THEN 'volunteer'
    WHEN lower(COALESCE(p_role_key, '') || ' ' || COALESCE(p_role_label, '')) LIKE '%student%'
      OR lower(COALESCE(p_role_key, '') || ' ' || COALESCE(p_role_label, '')) LIKE '%learner%' THEN 'student'
    WHEN lower(COALESCE(p_role_key, '') || ' ' || COALESCE(p_role_label, '')) LIKE '%guest%' THEN 'guest'
    ELSE 'member'
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_org_membership_role(
  p_organization_id uuid,
  p_user_id uuid
)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT om.role
  FROM public.organization_memberships om
  WHERE om.organization_id = p_organization_id
    AND om.user_id = p_user_id
    AND om.status IN ('active', 'verified')
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_inviter_issue_org_invite_role(
  p_inviter_role text,
  p_target_role text
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE lower(COALESCE(p_inviter_role, ''))
    WHEN 'owner' THEN lower(COALESCE(p_target_role, '')) IN (
      'owner', 'admin', 'manager', 'coordinator', 'faculty', 'preceptor', 'instructor',
      'coach', 'tutor', 'assessor', 'staff', 'volunteer', 'student', 'member', 'guest'
    )
    WHEN 'admin' THEN lower(COALESCE(p_target_role, '')) IN (
      'admin', 'manager', 'coordinator', 'faculty', 'preceptor', 'instructor',
      'coach', 'tutor', 'assessor', 'staff', 'volunteer', 'student', 'member', 'guest'
    )
    WHEN 'manager' THEN lower(COALESCE(p_target_role, '')) IN (
      'manager', 'coordinator', 'faculty', 'preceptor', 'instructor',
      'coach', 'tutor', 'assessor', 'staff', 'volunteer', 'student', 'member', 'guest'
    )
    WHEN 'coordinator' THEN lower(COALESCE(p_target_role, '')) IN (
      'coordinator', 'faculty', 'preceptor', 'instructor',
      'coach', 'tutor', 'assessor', 'staff', 'volunteer', 'student', 'member', 'guest'
    )
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_org_invite_role_issuance()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_target_role text;
  v_inviter_role text;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.organization_id IS NOT DISTINCT FROM OLD.organization_id
     AND NEW.invited_by IS NOT DISTINCT FROM OLD.invited_by
     AND NEW.role_key IS NOT DISTINCT FROM OLD.role_key
     AND NEW.role_label IS NOT DISTINCT FROM OLD.role_label THEN
    RETURN NEW;
  END IF;

  v_target_role := public.map_org_invite_role(NEW.role_key, NEW.role_label);
  v_inviter_role := public.get_org_membership_role(NEW.organization_id, NEW.invited_by);

  IF v_inviter_role IS NULL THEN
    RAISE EXCEPTION 'Invite issuer must be an active organization member.';
  END IF;

  IF NOT public.can_inviter_issue_org_invite_role(v_inviter_role, v_target_role) THEN
    RAISE EXCEPTION 'Inviter role % cannot issue invite role %.', v_inviter_role, v_target_role;
  END IF;

  NEW.metadata := COALESCE(NEW.metadata, '{}'::jsonb)
    || jsonb_build_object(
      'resolved_target_role', v_target_role,
      'inviter_role_at_issue', v_inviter_role
    );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_enforce_org_invite_role_issuance ON public.organization_invites;
CREATE TRIGGER trigger_enforce_org_invite_role_issuance
  BEFORE INSERT OR UPDATE ON public.organization_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_org_invite_role_issuance();

CREATE OR REPLACE FUNCTION public.respond_to_organization_invite(
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
  v_inviter_role text;
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
    v_role := public.map_org_invite_role(v_invite.role_key, v_invite.role_label);
    v_inviter_role := public.get_org_membership_role(v_invite.organization_id, v_invite.invited_by);

    IF v_inviter_role IS NULL THEN
      RAISE EXCEPTION 'Invite issuer is no longer authorized.';
    END IF;

    IF NOT public.can_inviter_issue_org_invite_role(v_inviter_role, v_role) THEN
      RAISE EXCEPTION 'Invite role is not permitted for inviter role.';
    END IF;

    v_membership_metadata := jsonb_build_object(
      'accepted_invite_id', v_invite.id,
      'accepted_invite_token', v_invite.invite_token,
      'accepted_invite_role_label', v_invite.role_label,
      'accepted_invite_at', v_now,
      'resolved_target_role', v_role,
      'inviter_role_at_accept', v_inviter_role
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

REVOKE ALL ON FUNCTION public.respond_to_organization_invite(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_to_organization_invite(text, text) TO authenticated;

COMMIT;

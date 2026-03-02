-- =============================================================================
-- Invite token lookup by invite id for invitee-safe completion
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.get_organization_invite_token_by_id(
  p_invite_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_token text;
BEGIN
  IF p_invite_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF v_email = '' THEN
    RETURN NULL;
  END IF;

  SELECT oi.invite_token
  INTO v_token
  FROM public.organization_invites oi
  WHERE oi.id = p_invite_id
    AND oi.invite_token IS NOT NULL
    AND lower(coalesce(oi.invitee_email, '')) = v_email
    AND oi.status IN ('draft', 'sent', 'opened', 'accepted', 'declined')
  LIMIT 1;

  RETURN v_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_organization_invite_token_by_id(uuid) TO authenticated;

COMMIT;

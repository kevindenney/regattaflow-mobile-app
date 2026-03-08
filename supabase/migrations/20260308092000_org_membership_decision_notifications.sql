-- Org membership decision notifications (approve/reject)
-- Adds new notification enum values and a secure RPC that org admins/managers can call.

ALTER TYPE public.social_notification_type ADD VALUE IF NOT EXISTS 'org_membership_approved';
ALTER TYPE public.social_notification_type ADD VALUE IF NOT EXISTS 'org_membership_rejected';

CREATE OR REPLACE FUNCTION public.notify_org_membership_decision(
  p_target_user_id uuid,
  p_organization_id uuid,
  p_organization_name text,
  p_decision text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type public.social_notification_type;
  v_title text;
  v_body text;
  v_notification_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid decision';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.organization_memberships om
    WHERE om.organization_id = p_organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager')
      AND COALESCE(om.membership_status, om.status) = 'active'
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF p_decision = 'approved' THEN
    v_type := 'org_membership_approved';
    v_title := 'Membership approved';
    v_body := format('Your request to join %s was approved.', COALESCE(NULLIF(p_organization_name, ''), 'this organization'));
  ELSE
    v_type := 'org_membership_rejected';
    v_title := 'Membership request update';
    v_body := format('Your request to join %s was not approved.', COALESCE(NULLIF(p_organization_name, ''), 'this organization'));
  END IF;

  INSERT INTO public.social_notifications (
    user_id,
    type,
    title,
    body,
    data
  ) VALUES (
    p_target_user_id,
    v_type,
    v_title,
    v_body,
    jsonb_build_object(
      'organization_id', p_organization_id,
      'organization_name', p_organization_name,
      'decision', p_decision
    )
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_org_membership_decision(uuid, uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notify_org_membership_decision(uuid, uuid, text, text) TO authenticated;


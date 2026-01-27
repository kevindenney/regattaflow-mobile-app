-- Create Direct Invite Function
-- Allows race owners to invite a specific user directly, creating a pending invite
-- that appears in the target user's timeline immediately.

CREATE OR REPLACE FUNCTION create_direct_invite(
  p_regatta_id UUID,
  p_target_user_id UUID,
  p_access_level TEXT DEFAULT 'view'
)
RETURNS JSON AS $$
DECLARE
  v_owner_id UUID := auth.uid();
  v_collaborator_id UUID;
  v_invite_code TEXT;
  v_target_profile RECORD;
BEGIN
  -- Check if caller owns this regatta
  IF NOT EXISTS (
    SELECT 1 FROM regattas WHERE id = p_regatta_id AND created_by = v_owner_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized to invite to this race');
  END IF;

  -- Check if target user exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = p_target_user_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Target user not found');
  END IF;

  -- Check if target user is already a collaborator on this race
  IF EXISTS (
    SELECT 1 FROM race_collaborators
    WHERE regatta_id = p_regatta_id AND user_id = p_target_user_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'User is already a collaborator on this race');
  END IF;

  -- Get target user's display name from sailor_profiles or profiles
  SELECT sp.full_name AS sailor_name, p.full_name AS profile_name
  INTO v_target_profile
  FROM auth.users u
  LEFT JOIN sailor_profiles sp ON sp.user_id = u.id
  LEFT JOIN profiles p ON p.id = u.id
  WHERE u.id = p_target_user_id;

  -- Create the collaborator record with user_id set immediately
  -- This makes the race appear in the target user's timeline as a pending invite
  INSERT INTO race_collaborators (
    regatta_id,
    user_id,
    invited_by,
    access_level,
    display_name,
    status
  )
  VALUES (
    p_regatta_id,
    p_target_user_id,
    v_owner_id,
    p_access_level,
    COALESCE(v_target_profile.sailor_name, v_target_profile.profile_name),
    'pending'
  )
  RETURNING id INTO v_collaborator_id;

  -- Generate invite code as backup (for sharing via link/message)
  v_invite_code := set_race_collaborator_invite_code(v_collaborator_id);

  RETURN json_build_object(
    'success', true,
    'collaborator_id', v_collaborator_id,
    'invite_code', v_invite_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_direct_invite(UUID, UUID, TEXT) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION create_direct_invite IS 'Creates a pending collaboration invite for a specific user. The race will appear in their timeline with a pending status until they accept or decline.';

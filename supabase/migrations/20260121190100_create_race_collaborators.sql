-- Race Collaborators: who has access to a race card
-- Following the team_race_entries pattern for invite codes and RLS

CREATE TABLE race_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES auth.users(id),
  invite_code TEXT UNIQUE,
  access_level TEXT NOT NULL DEFAULT 'view' CHECK (access_level IN ('view', 'full')),
  display_name TEXT,
  role TEXT,  -- e.g., 'Tactician', 'Trimmer', 'Bowman'
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(regatta_id, user_id)
);

-- Enable RLS
ALTER TABLE race_collaborators ENABLE ROW LEVEL SECURITY;

-- Owner (creator) can manage all collaborators for their races
CREATE POLICY "race_owner_manage_collaborators" ON race_collaborators
FOR ALL USING (
  regatta_id IN (SELECT id FROM regattas WHERE created_by = auth.uid())
);

-- Collaborators can view fellow collaborators on races they're part of
CREATE POLICY "collaborators_view_each_other" ON race_collaborators
FOR SELECT USING (
  regatta_id IN (
    SELECT regatta_id FROM race_collaborators WHERE user_id = auth.uid() AND status = 'accepted'
  )
);

-- Users can update/delete their own collaboration record
CREATE POLICY "users_manage_own_collaboration" ON race_collaborators
FOR ALL USING (user_id = auth.uid());

-- Anyone can view pending invites by invite code (for joining)
CREATE POLICY "anyone_view_by_invite_code" ON race_collaborators
FOR SELECT USING (invite_code IS NOT NULL AND status = 'pending');

-- Enable realtime for live collaboration updates
ALTER PUBLICATION supabase_realtime ADD TABLE race_collaborators;

-- Indexes for efficient queries
CREATE INDEX idx_race_collaborators_regatta_id ON race_collaborators(regatta_id);
CREATE INDEX idx_race_collaborators_user_id ON race_collaborators(user_id);
CREATE INDEX idx_race_collaborators_invite_code ON race_collaborators(invite_code) WHERE invite_code IS NOT NULL;
CREATE INDEX idx_race_collaborators_status ON race_collaborators(status);

-- Function to generate 8-character invite code (matching team pattern)
CREATE OR REPLACE FUNCTION generate_race_collaborator_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to set invite code with retry for uniqueness (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION set_race_collaborator_invite_code(p_collaborator_id UUID)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  max_attempts INTEGER := 10;
  attempts INTEGER := 0;
BEGIN
  LOOP
    new_code := generate_race_collaborator_invite_code();
    BEGIN
      UPDATE race_collaborators SET invite_code = new_code WHERE id = p_collaborator_id;
      RETURN new_code;
    EXCEPTION WHEN unique_violation THEN
      attempts := attempts + 1;
      IF attempts >= max_attempts THEN
        RAISE EXCEPTION 'Could not generate unique invite code';
      END IF;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function to join race via invite code
CREATE OR REPLACE FUNCTION join_race_by_invite_code(
  p_invite_code TEXT,
  p_display_name TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_collaborator race_collaborators%ROWTYPE;
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Find collaborator record with this invite code
  SELECT * INTO v_collaborator
  FROM race_collaborators
  WHERE invite_code = UPPER(p_invite_code)
    AND status = 'pending';

  IF v_collaborator IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invite code');
  END IF;

  -- Check if user is already a collaborator on this race
  IF EXISTS (
    SELECT 1 FROM race_collaborators
    WHERE regatta_id = v_collaborator.regatta_id
    AND user_id = v_user_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Already a collaborator on this race');
  END IF;

  -- Update the collaborator record with the joining user
  UPDATE race_collaborators
  SET user_id = v_user_id,
      display_name = COALESCE(p_display_name, display_name),
      role = COALESCE(p_role, role),
      status = 'accepted',
      joined_at = NOW(),
      invite_code = NULL  -- Clear invite code after use
  WHERE id = v_collaborator.id;

  RETURN json_build_object(
    'success', true,
    'regatta_id', v_collaborator.regatta_id,
    'collaborator_id', v_collaborator.id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Function to create an invite for a race (owner only)
CREATE OR REPLACE FUNCTION create_race_collaborator_invite(
  p_regatta_id UUID,
  p_access_level TEXT DEFAULT 'view',
  p_display_name TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_collaborator_id UUID;
  v_invite_code TEXT;
BEGIN
  -- Check if user owns this regatta
  IF NOT EXISTS (
    SELECT 1 FROM regattas WHERE id = p_regatta_id AND created_by = v_user_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Not authorized to invite to this race');
  END IF;

  -- Create the collaborator record
  INSERT INTO race_collaborators (regatta_id, invited_by, access_level, display_name, role, status)
  VALUES (p_regatta_id, v_user_id, p_access_level, p_display_name, p_role, 'pending')
  RETURNING id INTO v_collaborator_id;

  -- Generate invite code
  v_invite_code := set_race_collaborator_invite_code(v_collaborator_id);

  RETURN json_build_object(
    'success', true,
    'collaborator_id', v_collaborator_id,
    'invite_code', v_invite_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

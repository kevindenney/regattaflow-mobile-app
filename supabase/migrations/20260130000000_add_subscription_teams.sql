-- Migration: Add subscription teams for team-based subscriptions
-- Created: 2026-01-30
--
-- This migration adds support for subscription-level teams, which are different
-- from race-specific teams. These teams allow Team plan subscribers to share
-- their subscription benefits with up to 5 team members.

-- ============================================================================
-- Subscription Teams Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Team',
  max_seats INTEGER NOT NULL DEFAULT 5,
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for owner lookups
CREATE INDEX IF NOT EXISTS idx_subscription_teams_owner_id ON subscription_teams(owner_id);

-- Add index for invite code lookups
CREATE INDEX IF NOT EXISTS idx_subscription_teams_invite_code ON subscription_teams(invite_code);

-- ============================================================================
-- Subscription Team Members Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES subscription_teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('owner', 'member')) DEFAULT 'member',
  status TEXT CHECK (status IN ('pending', 'active')) DEFAULT 'pending',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  UNIQUE(team_id, email)
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_subscription_team_members_team_id ON subscription_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_subscription_team_members_user_id ON subscription_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_team_members_email ON subscription_team_members(email);

-- ============================================================================
-- Add subscription_team_id to profiles table
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_team_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_team_id UUID REFERENCES subscription_teams(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- RLS Policies for subscription_teams
-- ============================================================================

ALTER TABLE subscription_teams ENABLE ROW LEVEL SECURITY;

-- Team owners can do anything with their team
CREATE POLICY "Team owners can manage their teams"
  ON subscription_teams
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Team members can view their team
CREATE POLICY "Team members can view their team"
  ON subscription_teams
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT team_id FROM subscription_team_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================================================
-- RLS Policies for subscription_team_members
-- ============================================================================

ALTER TABLE subscription_team_members ENABLE ROW LEVEL SECURITY;

-- Team owners can manage members
CREATE POLICY "Team owners can manage members"
  ON subscription_team_members
  FOR ALL
  TO authenticated
  USING (
    team_id IN (SELECT id FROM subscription_teams WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    team_id IN (SELECT id FROM subscription_teams WHERE owner_id = auth.uid())
  );

-- Users can view their own membership
CREATE POLICY "Users can view their own membership"
  ON subscription_team_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Users can update their own membership (to accept invites)
CREATE POLICY "Users can accept their own invites"
  ON subscription_team_members
  FOR UPDATE
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND status = 'pending')
  WITH CHECK (status = 'active');

-- ============================================================================
-- Function to generate unique invite code
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_invite_code()
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

-- ============================================================================
-- Function to create team when user subscribes to Team plan
-- ============================================================================

CREATE OR REPLACE FUNCTION create_subscription_team_for_user(p_user_id UUID, p_team_name TEXT DEFAULT 'My Team')
RETURNS UUID AS $$
DECLARE
  v_team_id UUID;
  v_invite_code TEXT;
  v_user_email TEXT;
BEGIN
  -- Generate unique invite code
  LOOP
    v_invite_code := generate_invite_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM subscription_teams WHERE invite_code = v_invite_code);
  END LOOP;

  -- Get user email
  SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;

  -- Create the team
  INSERT INTO subscription_teams (owner_id, name, max_seats, invite_code)
  VALUES (p_user_id, p_team_name, 5, v_invite_code)
  RETURNING id INTO v_team_id;

  -- Add owner as first member
  INSERT INTO subscription_team_members (team_id, user_id, email, role, status, joined_at)
  VALUES (v_team_id, p_user_id, v_user_email, 'owner', 'active', NOW());

  -- Link user profile to team
  UPDATE profiles SET subscription_team_id = v_team_id WHERE id = p_user_id;

  RETURN v_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function to accept a team invite
-- ============================================================================

CREATE OR REPLACE FUNCTION accept_team_invite(p_invite_code TEXT, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_team subscription_teams%ROWTYPE;
  v_member subscription_team_members%ROWTYPE;
  v_user_email TEXT;
  v_seat_count INTEGER;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;

  IF v_user_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Find team by invite code
  SELECT * INTO v_team FROM subscription_teams WHERE invite_code = p_invite_code;

  IF v_team IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid invite code');
  END IF;

  -- Check if user is already a member
  SELECT * INTO v_member FROM subscription_team_members
  WHERE team_id = v_team.id AND (user_id = p_user_id OR email = v_user_email);

  IF v_member IS NOT NULL AND v_member.status = 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already a member of this team');
  END IF;

  -- Check seat availability
  SELECT COUNT(*) INTO v_seat_count FROM subscription_team_members
  WHERE team_id = v_team.id AND status = 'active';

  IF v_seat_count >= v_team.max_seats THEN
    RETURN jsonb_build_object('success', false, 'error', 'Team is full');
  END IF;

  -- If pending invite exists, activate it
  IF v_member IS NOT NULL THEN
    UPDATE subscription_team_members
    SET user_id = p_user_id, status = 'active', joined_at = NOW()
    WHERE id = v_member.id;
  ELSE
    -- Create new membership
    INSERT INTO subscription_team_members (team_id, user_id, email, role, status, joined_at)
    VALUES (v_team.id, p_user_id, v_user_email, 'member', 'active', NOW());
  END IF;

  -- Link user profile to team
  UPDATE profiles SET subscription_team_id = v_team.id WHERE id = p_user_id;

  -- Update user's subscription tier to match team owner's tier
  UPDATE users
  SET subscription_tier = (SELECT subscription_tier FROM users WHERE id = v_team.owner_id),
      subscription_status = (SELECT subscription_status FROM users WHERE id = v_team.owner_id)
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'team_id', v_team.id,
    'team_name', v_team.name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Trigger to update updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_subscription_team_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_teams_updated_at
  BEFORE UPDATE ON subscription_teams
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_team_timestamp();

-- ============================================================================
-- Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON subscription_teams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON subscription_team_members TO authenticated;
GRANT EXECUTE ON FUNCTION create_subscription_team_for_user TO authenticated;
GRANT EXECUTE ON FUNCTION accept_team_invite TO authenticated;

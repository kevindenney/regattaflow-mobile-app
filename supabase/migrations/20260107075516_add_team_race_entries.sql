-- Migration: Add Team Race Entries
-- Purpose: Enable shared race entries for team racing with real-time checklist collaboration
--
-- This creates the infrastructure for team racing collaboration:
-- 1. team_race_entries: Links a race to multiple users as a team
-- 2. team_race_entry_members: Individual team members
-- 3. team_race_checklists: Shared checklist state with real-time sync

-- =============================================================================
-- TABLE: team_race_entries
-- Links a race event to a team with an invite code for joining
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.team_race_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_event_id UUID NOT NULL REFERENCES public.race_events(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  invite_code TEXT UNIQUE, -- 8-character code for joining
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each team can only have one entry per race
  CONSTRAINT unique_team_per_race UNIQUE(race_event_id, team_name)
);

-- Index for finding team entries by race
CREATE INDEX IF NOT EXISTS idx_team_entries_race ON team_race_entries(race_event_id);

-- Index for finding entries by invite code
CREATE INDEX IF NOT EXISTS idx_team_entries_invite_code ON team_race_entries(invite_code) WHERE invite_code IS NOT NULL;

-- =============================================================================
-- TABLE: team_race_entry_members
-- Individual members of a team entry
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.team_race_entry_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_entry_id UUID NOT NULL REFERENCES public.team_race_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  display_name TEXT,
  sail_number TEXT,
  role TEXT CHECK (role IN ('skipper', 'crew')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each user can only be in one team entry once
  CONSTRAINT unique_member_per_entry UNIQUE(team_entry_id, user_id)
);

-- Index for finding team entries by user
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_race_entry_members(user_id);

-- Index for finding members by team entry
CREATE INDEX IF NOT EXISTS idx_team_members_entry ON team_race_entry_members(team_entry_id);

-- =============================================================================
-- TABLE: team_race_checklists
-- Shared checklist state for team entries with real-time sync
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.team_race_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_entry_id UUID NOT NULL REFERENCES public.team_race_entries(id) ON DELETE CASCADE,
  checklist_state JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One checklist state per team entry
  CONSTRAINT unique_checklist_per_entry UNIQUE(team_entry_id)
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.team_race_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_race_entry_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_race_checklists ENABLE ROW LEVEL SECURITY;

-- team_race_entries policies
-- Members and creators can read
CREATE POLICY "team_entries_member_read" ON team_race_entries
  FOR SELECT USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM team_race_entry_members
      WHERE team_race_entry_members.team_entry_id = team_race_entries.id
      AND team_race_entry_members.user_id = auth.uid()
    )
  );

-- Anyone can read by invite code (for joining)
CREATE POLICY "team_entries_invite_read" ON team_race_entries
  FOR SELECT USING (invite_code IS NOT NULL);

-- Creator can insert
CREATE POLICY "team_entries_creator_insert" ON team_race_entries
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Creator can update
CREATE POLICY "team_entries_creator_update" ON team_race_entries
  FOR UPDATE USING (created_by = auth.uid());

-- Creator can delete
CREATE POLICY "team_entries_creator_delete" ON team_race_entries
  FOR DELETE USING (created_by = auth.uid());

-- team_race_entry_members policies
-- Members can read other members in the same team
CREATE POLICY "team_members_member_read" ON team_race_entry_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_race_entry_members AS my_membership
      WHERE my_membership.team_entry_id = team_race_entry_members.team_entry_id
      AND my_membership.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_race_entries
      WHERE team_race_entries.id = team_race_entry_members.team_entry_id
      AND team_race_entries.created_by = auth.uid()
    )
  );

-- Users can insert themselves (joining via invite code)
CREATE POLICY "team_members_self_insert" ON team_race_entry_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own membership
CREATE POLICY "team_members_self_update" ON team_race_entry_members
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own membership (leaving team)
CREATE POLICY "team_members_self_delete" ON team_race_entry_members
  FOR DELETE USING (user_id = auth.uid());

-- Team creator can delete any member
CREATE POLICY "team_members_creator_delete" ON team_race_entry_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM team_race_entries
      WHERE team_race_entries.id = team_race_entry_members.team_entry_id
      AND team_race_entries.created_by = auth.uid()
    )
  );

-- team_race_checklists policies
-- Members can read
CREATE POLICY "team_checklists_member_read" ON team_race_checklists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_race_entry_members
      WHERE team_race_entry_members.team_entry_id = team_race_checklists.team_entry_id
      AND team_race_entry_members.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_race_entries
      WHERE team_race_entries.id = team_race_checklists.team_entry_id
      AND team_race_entries.created_by = auth.uid()
    )
  );

-- Members can insert (create initial checklist)
CREATE POLICY "team_checklists_member_insert" ON team_race_checklists
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_race_entry_members
      WHERE team_race_entry_members.team_entry_id = team_race_checklists.team_entry_id
      AND team_race_entry_members.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_race_entries
      WHERE team_race_entries.id = team_race_checklists.team_entry_id
      AND team_race_entries.created_by = auth.uid()
    )
  );

-- Members can update
CREATE POLICY "team_checklists_member_update" ON team_race_checklists
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM team_race_entry_members
      WHERE team_race_entry_members.team_entry_id = team_race_checklists.team_entry_id
      AND team_race_entry_members.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM team_race_entries
      WHERE team_race_entries.id = team_race_checklists.team_entry_id
      AND team_race_entries.created_by = auth.uid()
    )
  );

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update updated_at timestamp on team_race_entries
CREATE OR REPLACE FUNCTION update_team_entry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_team_entry_updated_at
  BEFORE UPDATE ON team_race_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_team_entry_updated_at();

-- Update updated_at timestamp on team_race_checklists
CREATE TRIGGER trigger_team_checklist_updated_at
  BEFORE UPDATE ON team_race_checklists
  FOR EACH ROW
  EXECUTE FUNCTION update_team_entry_updated_at();

-- Auto-create checklist when team entry is created
CREATE OR REPLACE FUNCTION create_team_checklist()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO team_race_checklists (team_entry_id, checklist_state)
  VALUES (NEW.id, '{}');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_team_checklist
  AFTER INSERT ON team_race_entries
  FOR EACH ROW
  EXECUTE FUNCTION create_team_checklist();

-- Auto-add creator as first team member
CREATE OR REPLACE FUNCTION add_creator_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO team_race_entry_members (team_entry_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'skipper');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_add_creator_as_member
  AFTER INSERT ON team_race_entries
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_member();

-- =============================================================================
-- REALTIME
-- =============================================================================

-- Enable Supabase Realtime for team_race_checklists
-- This allows real-time sync of checklist state between teammates
ALTER PUBLICATION supabase_realtime ADD TABLE team_race_checklists;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Generate a unique 8-character invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- No ambiguous characters
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to set invite code on team entry
CREATE OR REPLACE FUNCTION set_team_invite_code(entry_id UUID)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
BEGIN
  -- Generate unique code
  LOOP
    new_code := generate_invite_code();
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM team_race_entries WHERE invite_code = new_code
    );
  END LOOP;

  -- Update entry with new code
  UPDATE team_race_entries
  SET invite_code = new_code
  WHERE id = entry_id;

  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to join team via invite code
CREATE OR REPLACE FUNCTION join_team_by_invite(
  p_invite_code TEXT,
  p_display_name TEXT DEFAULT NULL,
  p_sail_number TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_team_entry_id UUID;
  v_new_member_id UUID;
BEGIN
  -- Find team entry by invite code
  SELECT id INTO v_team_entry_id
  FROM team_race_entries
  WHERE invite_code = p_invite_code;

  IF v_team_entry_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM team_race_entry_members
    WHERE team_entry_id = v_team_entry_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Already a member of this team';
  END IF;

  -- Add user as member
  INSERT INTO team_race_entry_members (team_entry_id, user_id, display_name, sail_number, role)
  VALUES (v_team_entry_id, auth.uid(), p_display_name, p_sail_number, p_role)
  RETURNING id INTO v_new_member_id;

  RETURN v_new_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION set_team_invite_code(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION join_team_by_invite(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE team_race_entries IS 'Shared race entries for team racing, allowing multiple users to collaborate on race preparation';
COMMENT ON TABLE team_race_entry_members IS 'Individual members of a team race entry';
COMMENT ON TABLE team_race_checklists IS 'Shared checklist state for team racing with real-time sync';
COMMENT ON COLUMN team_race_entries.invite_code IS '8-character code for teammates to join the team entry';
COMMENT ON COLUMN team_race_checklists.checklist_state IS 'JSONB storing completion state: {itemId: {completedBy, completedAt, completedByName}}';

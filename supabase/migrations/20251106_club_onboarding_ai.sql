-- AI-Powered Club Onboarding Migration
-- Adds tables for conversational club setup with ClubOnboardingAgent

-- Club Profiles (main club table)
CREATE TABLE IF NOT EXISTS club_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  club_type TEXT NOT NULL CHECK (club_type IN ('yacht_club', 'class_association', 'regatta_organizer', 'sailing_school')),
  acronym TEXT,
  established DATE,
  website TEXT,
  logo_url TEXT,

  -- Subscription
  subscription_tier TEXT NOT NULL DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'club_pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired')),

  -- Primary venue
  primary_venue_id UUID REFERENCES sailing_venues(id),

  -- Multi-venue support
  is_multi_venue BOOLEAN DEFAULT false,

  -- Racing configuration
  annual_events INTEGER,
  racing_classes TEXT[],
  scoring_systems TEXT[],

  -- Contact information
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  -- Onboarding metadata
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_session_id UUID,
  setup_by_ai BOOLEAN DEFAULT false,

  -- Public profile
  public_profile_visible BOOLEAN DEFAULT true,
  allow_online_registration BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Club Venues (multi-venue relationships)
CREATE TABLE IF NOT EXISTS club_venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES club_profiles(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES sailing_venues(id),

  -- Venue role in multi-venue setup
  role TEXT CHECK (role IN ('headquarters', 'racing', 'marina', 'social', 'training')),
  is_primary BOOLEAN DEFAULT false,

  -- Facility information
  facilities JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(club_id, venue_id)
);

-- Club Staff (race officials and permissions)
CREATE TABLE IF NOT EXISTS club_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES club_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),

  -- Role information
  role TEXT NOT NULL CHECK (role IN ('admin', 'sailing_manager', 'principal_race_officer', 'race_officer', 'secretary', 'volunteer')),
  title TEXT,

  -- Multi-venue assignment
  assigned_venues UUID[],

  -- Permissions (JSONB for flexibility)
  permissions JSONB DEFAULT '{}'::jsonb,

  -- Status
  invitation_sent BOOLEAN DEFAULT false,
  invitation_accepted BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(club_id, user_id)
);

-- Club Onboarding Sessions (AI conversation tracking)
CREATE TABLE IF NOT EXISTS club_onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES club_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- AI agent metadata
  agent_type TEXT DEFAULT 'club_onboarding',
  conversation_history JSONB DEFAULT '[]'::jsonb,
  tools_used TEXT[] DEFAULT ARRAY[]::TEXT[],
  tokens_used INTEGER,

  -- Onboarding progress (0-8 tools completed)
  onboarding_step INTEGER DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT false,

  -- Collected data during onboarding
  venue_ids UUID[],
  detected_context JSONB,
  recommended_setup JSONB,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Club Documents (generated NOR/SI templates)
CREATE TABLE IF NOT EXISTS club_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES club_profiles(id) ON DELETE CASCADE,

  -- Document type
  document_type TEXT NOT NULL CHECK (document_type IN ('notice_of_race', 'sailing_instructions', 'entry_form', 'results_template')),

  -- Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  template_used TEXT,

  -- Metadata
  event_type TEXT,
  boat_classes TEXT[],
  venue_id UUID REFERENCES sailing_venues(id),

  -- AI-generated flag
  ai_generated BOOLEAN DEFAULT false,
  customizations_needed TEXT[],

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_club_profiles_venue ON club_profiles(primary_venue_id);
CREATE INDEX idx_club_profiles_type ON club_profiles(club_type);
CREATE INDEX idx_club_profiles_subscription ON club_profiles(subscription_tier, subscription_status);

CREATE INDEX idx_club_venues_club ON club_venues(club_id);
CREATE INDEX idx_club_venues_venue ON club_venues(venue_id);

CREATE INDEX idx_club_staff_club ON club_staff(club_id);
CREATE INDEX idx_club_staff_user ON club_staff(user_id);
CREATE INDEX idx_club_staff_role ON club_staff(role);

CREATE INDEX idx_club_onboarding_user ON club_onboarding_sessions(user_id);
CREATE INDEX idx_club_onboarding_club ON club_onboarding_sessions(club_id);
CREATE INDEX idx_club_onboarding_completed ON club_onboarding_sessions(onboarding_completed);

CREATE INDEX idx_club_documents_club ON club_documents(club_id);
CREATE INDEX idx_club_documents_type ON club_documents(document_type);

-- RLS Policies

-- Club Profiles
ALTER TABLE club_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club profiles are viewable by everyone"
  ON club_profiles FOR SELECT
  USING (public_profile_visible = true OR auth.uid() IN (
    SELECT user_id FROM club_staff WHERE club_id = club_profiles.id AND active = true
  ));

CREATE POLICY "Club admins can update their club profile"
  ON club_profiles FOR UPDATE
  USING (auth.uid() IN (
    SELECT user_id FROM club_staff
    WHERE club_id = club_profiles.id
    AND role IN ('admin', 'sailing_manager')
    AND active = true
  ));

CREATE POLICY "Authenticated users can create club profiles"
  ON club_profiles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Club Venues
ALTER TABLE club_venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club venues are viewable by club staff"
  ON club_venues FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM club_staff WHERE club_id = club_venues.club_id AND active = true
  ));

CREATE POLICY "Club admins can manage venues"
  ON club_venues FOR ALL
  USING (auth.uid() IN (
    SELECT user_id FROM club_staff
    WHERE club_id = club_venues.club_id
    AND role IN ('admin', 'sailing_manager')
    AND active = true
  ));

-- Club Staff
ALTER TABLE club_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club staff can view other staff"
  ON club_staff FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM club_staff cs2 WHERE cs2.club_id = club_staff.club_id AND cs2.active = true
  ));

CREATE POLICY "Users can view their own staff records"
  ON club_staff FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Club admins can manage staff"
  ON club_staff FOR ALL
  USING (auth.uid() IN (
    SELECT user_id FROM club_staff
    WHERE club_id = club_staff.club_id
    AND role IN ('admin', 'sailing_manager')
    AND active = true
  ));

-- Club Onboarding Sessions
ALTER TABLE club_onboarding_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own onboarding sessions"
  ON club_onboarding_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own onboarding sessions"
  ON club_onboarding_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding sessions"
  ON club_onboarding_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Club Documents
ALTER TABLE club_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club documents are viewable by club staff"
  ON club_documents FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM club_staff WHERE club_id = club_documents.club_id AND active = true
  ));

CREATE POLICY "Club admins can manage documents"
  ON club_documents FOR ALL
  USING (auth.uid() IN (
    SELECT user_id FROM club_staff
    WHERE club_id = club_documents.club_id
    AND role IN ('admin', 'sailing_manager', 'principal_race_officer')
    AND active = true
  ));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_club_profiles_updated_at
  BEFORE UPDATE ON club_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_club_staff_updated_at
  BEFORE UPDATE ON club_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_club_onboarding_sessions_updated_at
  BEFORE UPDATE ON club_onboarding_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_club_documents_updated_at
  BEFORE UPDATE ON club_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE club_profiles IS 'Main club/organization profiles with subscription and configuration';
COMMENT ON TABLE club_venues IS 'Multi-venue relationships for clubs with multiple locations';
COMMENT ON TABLE club_staff IS 'Club staff, race officials, and their permissions';
COMMENT ON TABLE club_onboarding_sessions IS 'AI-powered onboarding conversation tracking';
COMMENT ON TABLE club_documents IS 'Auto-generated race documents (NOR, SI) from templates';

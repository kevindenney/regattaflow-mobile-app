-- ============================================================================
-- COACHING SYSTEM
-- ============================================================================
-- Complete coaching infrastructure with client management, sessions, and feedback
-- Powers coach marketplace and client relationship management

-- ============================================================================
-- COACH PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS coach_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Professional details
  bio TEXT,
  specialties TEXT[], -- ['Dragon', 'Swan 47', 'Match Racing', etc.]
  experience_years INTEGER,
  certifications TEXT[], -- ['US Sailing Level 3', 'RYA Advanced Instructor', etc.]

  -- Availability
  available_for_sessions BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',

  -- Location
  based_at UUID REFERENCES sailing_venues(id),
  available_locations UUID[], -- Array of venue IDs where coach teaches

  -- Stats
  total_sessions INTEGER DEFAULT 0,
  total_clients INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),

  -- Verification
  verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_profiles_user ON coach_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_available ON coach_profiles(available_for_sessions);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_venue ON coach_profiles(based_at);

-- ============================================================================
-- COACHING CLIENTS (Relationship Table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS coaching_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Relationship status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),

  -- Client details
  goals TEXT,
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  primary_boat_class TEXT,

  -- Tracking
  first_session_date TIMESTAMPTZ,
  last_session_date TIMESTAMPTZ,
  total_sessions INTEGER DEFAULT 0,

  -- Notes (private to coach)
  coach_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(coach_id, sailor_id)
);

CREATE INDEX IF NOT EXISTS idx_coaching_clients_coach ON coaching_clients(coach_id);
CREATE INDEX IF NOT EXISTS idx_coaching_clients_sailor ON coaching_clients(sailor_id);
CREATE INDEX IF NOT EXISTS idx_coaching_clients_status ON coaching_clients(status);

-- ============================================================================
-- COACHING SESSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES coaching_clients(id) ON DELETE SET NULL,

  -- Session details
  session_type TEXT NOT NULL CHECK (session_type IN ('on_water', 'video_review', 'strategy', 'boat_setup', 'fitness', 'mental_coaching')),
  duration_minutes INTEGER NOT NULL,

  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),

  -- Location
  venue_id UUID REFERENCES sailing_venues(id),
  location_notes TEXT,

  -- Session focus
  focus_areas TEXT[], -- ['starts', 'upwind technique', 'tactics', etc.]
  goals TEXT,

  -- Session notes
  pre_session_notes TEXT, -- Coach prep notes
  session_notes TEXT, -- During/after session notes
  homework TEXT, -- Practice assignments

  -- Resources
  video_urls TEXT[],
  document_ids UUID[], -- References to documents table

  -- Payment
  fee_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  paid BOOLEAN DEFAULT false,
  payment_date TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coaching_sessions_coach ON coaching_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_sailor ON coaching_sessions(sailor_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_client ON coaching_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_status ON coaching_sessions(status);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_scheduled ON coaching_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_venue ON coaching_sessions(venue_id);

-- ============================================================================
-- SESSION FEEDBACK
-- ============================================================================
CREATE TABLE IF NOT EXISTS session_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES coaching_sessions(id) ON DELETE CASCADE,

  -- From sailor to coach
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,

  -- Specific ratings
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  expertise_rating INTEGER CHECK (expertise_rating >= 1 AND expertise_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),

  -- Progress tracking (sailor self-assessment)
  skill_improvement TEXT CHECK (skill_improvement IN ('significant', 'moderate', 'slight', 'none')),
  confidence_change TEXT CHECK (confidence_change IN ('increased', 'same', 'decreased')),

  -- Would recommend?
  would_recommend BOOLEAN,

  -- Public/private
  public BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(session_id)
);

CREATE INDEX IF NOT EXISTS idx_session_feedback_session ON session_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_session_feedback_rating ON session_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_session_feedback_public ON session_feedback(public) WHERE public = true;

-- ============================================================================
-- SESSION PROGRESS TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS client_progress_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES coaching_clients(id) ON DELETE CASCADE,
  session_id UUID REFERENCES coaching_sessions(id) ON DELETE SET NULL,

  -- Metric type
  metric_type TEXT NOT NULL CHECK (metric_type IN ('race_result', 'skill_assessment', 'boat_handling', 'tactics', 'starts', 'boat_speed', 'fitness')),

  -- Values
  score DECIMAL(5,2), -- Normalized 0-100 score
  raw_value JSONB, -- Store any additional data

  -- Context
  notes TEXT,
  benchmark TEXT, -- What this is measured against

  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_progress_client ON client_progress_metrics(client_id);
CREATE INDEX IF NOT EXISTS idx_client_progress_session ON client_progress_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_client_progress_type ON client_progress_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_client_progress_recorded ON client_progress_metrics(recorded_at);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_progress_metrics ENABLE ROW LEVEL SECURITY;

-- Coach Profiles
DROP POLICY IF EXISTS "Public coach profiles viewable" ON coach_profiles;
CREATE POLICY "Public coach profiles viewable" ON coach_profiles
  FOR SELECT USING (available_for_sessions = true);

DROP POLICY IF EXISTS "Coaches can manage own profile" ON coach_profiles;
CREATE POLICY "Coaches can manage own profile" ON coach_profiles
  FOR ALL USING (user_id = auth.uid());

-- Coaching Clients
DROP POLICY IF EXISTS "Coaches view own clients" ON coaching_clients;
CREATE POLICY "Coaches view own clients" ON coaching_clients
  FOR SELECT USING (coach_id = auth.uid() OR sailor_id = auth.uid());

DROP POLICY IF EXISTS "Coaches manage own clients" ON coaching_clients;
CREATE POLICY "Coaches manage own clients" ON coaching_clients
  FOR ALL USING (coach_id = auth.uid());

-- Coaching Sessions
DROP POLICY IF EXISTS "Participants view sessions" ON coaching_sessions;
CREATE POLICY "Participants view sessions" ON coaching_sessions
  FOR SELECT USING (coach_id = auth.uid() OR sailor_id = auth.uid());

DROP POLICY IF EXISTS "Coaches manage sessions" ON coaching_sessions;
CREATE POLICY "Coaches manage sessions" ON coaching_sessions
  FOR ALL USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "Sailors can book sessions" ON coaching_sessions;
CREATE POLICY "Sailors can book sessions" ON coaching_sessions
  FOR INSERT WITH CHECK (sailor_id = auth.uid());

-- Session Feedback
DROP POLICY IF EXISTS "Participants view feedback" ON session_feedback;
CREATE POLICY "Participants view feedback" ON session_feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coaching_sessions
      WHERE coaching_sessions.id = session_feedback.session_id
      AND (coaching_sessions.coach_id = auth.uid() OR coaching_sessions.sailor_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Public feedback viewable" ON session_feedback;
CREATE POLICY "Public feedback viewable" ON session_feedback
  FOR SELECT USING (public = true);

DROP POLICY IF EXISTS "Sailors create feedback" ON session_feedback;
CREATE POLICY "Sailors create feedback" ON session_feedback
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM coaching_sessions
      WHERE coaching_sessions.id = session_feedback.session_id
      AND coaching_sessions.sailor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Sailors update own feedback" ON session_feedback;
CREATE POLICY "Sailors update own feedback" ON session_feedback
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM coaching_sessions
      WHERE coaching_sessions.id = session_feedback.session_id
      AND coaching_sessions.sailor_id = auth.uid()
    )
  );

-- Client Progress Metrics
DROP POLICY IF EXISTS "Coaches view client progress" ON client_progress_metrics;
CREATE POLICY "Coaches view client progress" ON client_progress_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coaching_clients
      WHERE coaching_clients.id = client_progress_metrics.client_id
      AND coaching_clients.coach_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Sailors view own progress" ON client_progress_metrics;
CREATE POLICY "Sailors view own progress" ON client_progress_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coaching_clients
      WHERE coaching_clients.id = client_progress_metrics.client_id
      AND coaching_clients.sailor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Coaches manage progress metrics" ON client_progress_metrics;
CREATE POLICY "Coaches manage progress metrics" ON client_progress_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM coaching_clients
      WHERE coaching_clients.id = client_progress_metrics.client_id
      AND coaching_clients.coach_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update coaching_clients stats when sessions are created/updated
CREATE OR REPLACE FUNCTION update_coaching_client_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE coaching_clients
    SET
      total_sessions = (
        SELECT COUNT(*)
        FROM coaching_sessions
        WHERE client_id = NEW.client_id
        AND status = 'completed'
      ),
      last_session_date = (
        SELECT MAX(completed_at)
        FROM coaching_sessions
        WHERE client_id = NEW.client_id
        AND status = 'completed'
      ),
      first_session_date = COALESCE(first_session_date, (
        SELECT MIN(completed_at)
        FROM coaching_sessions
        WHERE client_id = NEW.client_id
        AND status = 'completed'
      ))
    WHERE id = NEW.client_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_client_stats ON coaching_sessions;
CREATE TRIGGER trigger_update_client_stats
  AFTER INSERT OR UPDATE ON coaching_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_coaching_client_stats();

-- Update coach profile stats
CREATE OR REPLACE FUNCTION update_coach_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE coach_profiles
    SET
      total_sessions = (
        SELECT COUNT(*)
        FROM coaching_sessions
        WHERE coach_id = NEW.coach_id
        AND status = 'completed'
      ),
      total_clients = (
        SELECT COUNT(DISTINCT sailor_id)
        FROM coaching_clients
        WHERE coach_id = NEW.coach_id
        AND status = 'active'
      ),
      average_rating = (
        SELECT AVG(sf.rating)
        FROM session_feedback sf
        JOIN coaching_sessions cs ON cs.id = sf.session_id
        WHERE cs.coach_id = NEW.coach_id
      ),
      updated_at = NOW()
    WHERE user_id = NEW.coach_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_coach_stats ON coaching_sessions;
CREATE TRIGGER trigger_update_coach_stats
  AFTER INSERT OR UPDATE ON coaching_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_coach_profile_stats();

DROP TRIGGER IF EXISTS trigger_update_coach_stats_feedback ON session_feedback;
CREATE TRIGGER trigger_update_coach_stats_feedback
  AFTER INSERT OR UPDATE ON session_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_coach_profile_stats();

-- Auto-create updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_coach_profiles_updated_at ON coach_profiles;
CREATE TRIGGER trigger_coach_profiles_updated_at
  BEFORE UPDATE ON coach_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_coaching_clients_updated_at ON coaching_clients;
CREATE TRIGGER trigger_coaching_clients_updated_at
  BEFORE UPDATE ON coaching_clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_coaching_sessions_updated_at ON coaching_sessions;
CREATE TRIGGER trigger_coaching_sessions_updated_at
  BEFORE UPDATE ON coaching_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

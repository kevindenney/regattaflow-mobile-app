-- ============================================
-- RACE PARTICIPANTS TABLE
-- Enables fleet connectivity and "Who's Racing?"
-- ============================================

CREATE TABLE IF NOT EXISTS race_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fleet_id UUID REFERENCES fleets(id) ON DELETE SET NULL,

  -- Registration details
  status TEXT NOT NULL DEFAULT 'registered'
    CHECK (status IN ('registered', 'confirmed', 'tentative', 'sailed', 'withdrawn')),
  boat_name TEXT,
  sail_number TEXT,

  -- Privacy control
  visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'fleet', 'private')),

  -- Timestamps
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Additional data
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Constraints
  UNIQUE(regatta_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_race_participants_regatta ON race_participants(regatta_id);
CREATE INDEX idx_race_participants_user ON race_participants(user_id);
CREATE INDEX idx_race_participants_fleet ON race_participants(fleet_id) WHERE fleet_id IS NOT NULL;
CREATE INDEX idx_race_participants_status ON race_participants(status) WHERE status != 'withdrawn';
CREATE INDEX idx_race_participants_visibility ON race_participants(visibility);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_race_participants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER race_participants_updated_at
  BEFORE UPDATE ON race_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_race_participants_updated_at();

-- ============================================
-- RACE DOCUMENTS TABLE
-- Enables race-specific document management
-- ============================================

CREATE TABLE IF NOT EXISTS race_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Document classification
  document_type TEXT NOT NULL DEFAULT 'other'
    CHECK (document_type IN (
      'sailing_instructions',
      'nor',
      'course_diagram',
      'amendment',
      'notam',
      'other'
    )),

  -- Fleet sharing
  shared_with_fleet BOOLEAN NOT NULL DEFAULT false,
  fleet_id UUID REFERENCES fleets(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Additional data
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Constraints
  UNIQUE(regatta_id, document_id)
);

-- Indexes for performance
CREATE INDEX idx_race_documents_regatta ON race_documents(regatta_id);
CREATE INDEX idx_race_documents_document ON race_documents(document_id);
CREATE INDEX idx_race_documents_user ON race_documents(user_id);
CREATE INDEX idx_race_documents_fleet_shared
  ON race_documents(fleet_id, shared_with_fleet)
  WHERE shared_with_fleet = true;
CREATE INDEX idx_race_documents_type ON race_documents(document_type);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE race_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_documents ENABLE ROW LEVEL SECURITY;

-- Race Participants Policies
CREATE POLICY "Public participants visible to all"
  ON race_participants
  FOR SELECT
  TO authenticated
  USING (visibility IN ('public', 'fleet'));

CREATE POLICY "Users can view own registrations"
  ON race_participants
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can register for races"
  ON race_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registrations"
  ON race_participants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own registrations"
  ON race_participants
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Race Documents Policies
CREATE POLICY "Race documents visible to authenticated users"
  ON race_documents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can upload race documents"
  ON race_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own race documents"
  ON race_documents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own race documents"
  ON race_documents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION get_race_participant_count(p_regatta_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM race_participants
    WHERE regatta_id = p_regatta_id
      AND status NOT IN ('withdrawn')
      AND visibility IN ('public', 'fleet')
  );
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_confirmed_participant_count(p_regatta_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM race_participants
    WHERE regatta_id = p_regatta_id
      AND status = 'confirmed'
      AND visibility IN ('public', 'fleet')
  );
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_fleet_participant_count(
  p_regatta_id UUID,
  p_fleet_id UUID
)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM race_participants
    WHERE regatta_id = p_regatta_id
      AND fleet_id = p_fleet_id
      AND status NOT IN ('withdrawn')
  );
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_race_document_count(
  p_regatta_id UUID,
  p_document_type TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
BEGIN
  IF p_document_type IS NULL THEN
    RETURN (
      SELECT COUNT(*)
      FROM race_documents
      WHERE regatta_id = p_regatta_id
    );
  ELSE
    RETURN (
      SELECT COUNT(*)
      FROM race_documents
      WHERE regatta_id = p_regatta_id
        AND document_type = p_document_type
    );
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

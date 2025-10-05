-- Club Event Management System
-- Comprehensive event CRUD with registrations and document publishing

-- =====================================================
-- 1. CLUB EVENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS club_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Information
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('regatta', 'race_series', 'training', 'social', 'meeting', 'maintenance')),

  -- Timing
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  registration_opens TIMESTAMPTZ,
  registration_closes TIMESTAMPTZ,

  -- Location
  venue_id UUID REFERENCES sailing_venues(id),
  location_name TEXT,
  location_coordinates GEOGRAPHY(POINT),

  -- Registration Settings
  max_participants INTEGER,
  min_participants INTEGER,
  allow_waitlist BOOLEAN DEFAULT true,
  registration_fee DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',

  -- Event Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'registration_open', 'registration_closed', 'in_progress', 'completed', 'cancelled')),
  visibility TEXT NOT NULL DEFAULT 'club' CHECK (visibility IN ('public', 'club', 'private')),

  -- Communication
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,

  -- Requirements & Rules
  requirements TEXT[], -- e.g., ['Life jacket required', 'Must have boat insurance']
  boat_classes TEXT[], -- e.g., ['Dragon', 'J/70', 'Laser']

  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_dates CHECK (end_date >= start_date),
  CONSTRAINT valid_registration_dates CHECK (
    (registration_opens IS NULL AND registration_closes IS NULL) OR
    (registration_opens IS NOT NULL AND registration_closes IS NOT NULL AND registration_closes >= registration_opens)
  )
);

-- Indexes for club_events
CREATE INDEX idx_club_events_club_id ON club_events(club_id);
CREATE INDEX idx_club_events_start_date ON club_events(start_date);
CREATE INDEX idx_club_events_status ON club_events(status);
CREATE INDEX idx_club_events_venue_id ON club_events(venue_id);
CREATE INDEX idx_club_events_event_type ON club_events(event_type);

-- =====================================================
-- 2. EVENT REGISTRATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  event_id UUID NOT NULL REFERENCES club_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Registration Details
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'waitlist', 'withdrawn', 'cancelled')),
  registration_type TEXT CHECK (registration_type IN ('competitor', 'crew', 'volunteer', 'spectator', 'official')),

  -- Participant Information
  participant_name TEXT NOT NULL,
  participant_email TEXT NOT NULL,
  participant_phone TEXT,

  -- Boat Information (for competitors)
  boat_id UUID REFERENCES sailor_boats(id),
  boat_class TEXT,
  boat_name TEXT,
  sail_number TEXT,

  -- Crew Information
  crew_count INTEGER DEFAULT 0,
  crew_names TEXT[],

  -- Payment
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded', 'waived')),
  amount_paid DECIMAL(10, 2),
  payment_date TIMESTAMPTZ,
  payment_method TEXT,
  stripe_payment_intent_id TEXT,

  -- Additional Data
  dietary_requirements TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  special_requirements TEXT,
  notes TEXT,

  -- Administrative
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Metadata
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(event_id, user_id)
);

-- Indexes for event_registrations
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX idx_event_registrations_status ON event_registrations(status);
CREATE INDEX idx_event_registrations_boat_id ON event_registrations(boat_id);

-- =====================================================
-- 3. EVENT DOCUMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS event_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  event_id UUID NOT NULL REFERENCES club_events(id) ON DELETE CASCADE,

  -- Document Information
  document_type TEXT NOT NULL CHECK (document_type IN ('nor', 'si', 'results', 'amendment', 'notice', 'course_map', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  version TEXT DEFAULT '1.0',

  -- File Storage
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER, -- in bytes
  mime_type TEXT,

  -- Visibility & Access
  is_public BOOLEAN DEFAULT false,
  requires_registration BOOLEAN DEFAULT false,

  -- Publishing
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES users(id),

  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for event_documents
CREATE INDEX idx_event_documents_event_id ON event_documents(event_id);
CREATE INDEX idx_event_documents_type ON event_documents(document_type);
CREATE INDEX idx_event_documents_public ON event_documents(is_public);

-- =====================================================
-- 4. EVENT COMMUNICATIONS TABLE (Email/Notifications)
-- =====================================================

CREATE TABLE IF NOT EXISTS event_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  event_id UUID NOT NULL REFERENCES club_events(id) ON DELETE CASCADE,

  -- Communication Details
  communication_type TEXT NOT NULL CHECK (communication_type IN ('email', 'sms', 'push', 'announcement')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Recipients
  recipient_filter TEXT CHECK (recipient_filter IN ('all_registered', 'approved_only', 'waitlist', 'specific_users')),
  recipient_user_ids UUID[],

  -- Delivery
  sent_at TIMESTAMPTZ,
  sent_by UUID REFERENCES users(id),
  delivery_status TEXT DEFAULT 'draft' CHECK (delivery_status IN ('draft', 'sending', 'sent', 'failed')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for event_communications
CREATE INDEX idx_event_communications_event_id ON event_communications(event_id);
CREATE INDEX idx_event_communications_status ON event_communications(delivery_status);

-- =====================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE club_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_communications ENABLE ROW LEVEL SECURITY;

-- club_events policies
CREATE POLICY "Public events are viewable by everyone"
  ON club_events FOR SELECT
  USING (visibility = 'public' AND status IN ('published', 'registration_open', 'registration_closed', 'in_progress', 'completed'));

CREATE POLICY "Club members can view club events"
  ON club_events FOR SELECT
  USING (
    visibility = 'club' AND
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = club_events.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.status = 'active'
    )
  );

CREATE POLICY "Club admins can manage events"
  ON club_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = club_events.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('admin', 'race_committee')
        AND club_members.status = 'active'
    )
  );

-- event_registrations policies
CREATE POLICY "Users can view their own registrations"
  ON event_registrations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create registrations"
  ON event_registrations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own pending registrations"
  ON event_registrations FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Club admins can manage registrations"
  ON event_registrations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM club_events
      JOIN club_members ON club_members.club_id = club_events.club_id
      WHERE club_events.id = event_registrations.event_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('admin', 'race_committee')
        AND club_members.status = 'active'
    )
  );

-- event_documents policies
CREATE POLICY "Public documents are viewable by everyone"
  ON event_documents FOR SELECT
  USING (is_public = true);

CREATE POLICY "Registered users can view registration-required documents"
  ON event_documents FOR SELECT
  USING (
    requires_registration = true AND
    EXISTS (
      SELECT 1 FROM event_registrations
      WHERE event_registrations.event_id = event_documents.event_id
        AND event_registrations.user_id = auth.uid()
        AND event_registrations.status IN ('approved', 'pending')
    )
  );

CREATE POLICY "Club admins can manage documents"
  ON event_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM club_events
      JOIN club_members ON club_members.club_id = club_events.club_id
      WHERE club_events.id = event_documents.event_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('admin', 'race_committee')
        AND club_members.status = 'active'
    )
  );

-- event_communications policies
CREATE POLICY "Club admins can manage communications"
  ON event_communications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM club_events
      JOIN club_members ON club_members.club_id = club_events.club_id
      WHERE club_events.id = event_communications.event_id
        AND club_members.user_id = auth.uid()
        AND club_members.role IN ('admin', 'race_committee')
        AND club_members.status = 'active'
    )
  );

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to get event registration stats
CREATE OR REPLACE FUNCTION get_event_registration_stats(event_uuid UUID)
RETURNS TABLE(
  total_registrations BIGINT,
  approved_count BIGINT,
  pending_count BIGINT,
  waitlist_count BIGINT,
  total_paid NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_registrations,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'waitlist') as waitlist_count,
    COALESCE(SUM(amount_paid) FILTER (WHERE payment_status = 'paid'), 0) as total_paid
  FROM event_registrations
  WHERE event_id = event_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-approve registrations if space available
CREATE OR REPLACE FUNCTION auto_approve_registration()
RETURNS TRIGGER AS $$
DECLARE
  event_max_participants INTEGER;
  current_approved_count INTEGER;
BEGIN
  -- Get event max participants
  SELECT max_participants INTO event_max_participants
  FROM club_events
  WHERE id = NEW.event_id;

  -- Count current approved registrations
  SELECT COUNT(*) INTO current_approved_count
  FROM event_registrations
  WHERE event_id = NEW.event_id AND status = 'approved';

  -- Auto-approve if space available and no manual approval required
  IF event_max_participants IS NULL OR current_approved_count < event_max_participants THEN
    NEW.status := 'approved';
    NEW.approved_at := NOW();
  ELSE
    NEW.status := 'waitlist';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_approve_registration
  BEFORE INSERT ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_registration();

-- Function to update event status based on dates
CREATE OR REPLACE FUNCTION update_event_status()
RETURNS void AS $$
BEGIN
  -- Open registration when registration_opens is reached
  UPDATE club_events
  SET status = 'registration_open'
  WHERE status = 'published'
    AND registration_opens IS NOT NULL
    AND registration_opens <= NOW()
    AND (registration_closes IS NULL OR registration_closes > NOW());

  -- Close registration when registration_closes is reached
  UPDATE club_events
  SET status = 'registration_closed'
  WHERE status = 'registration_open'
    AND registration_closes IS NOT NULL
    AND registration_closes <= NOW()
    AND start_date > NOW();

  -- Mark as in progress when event starts
  UPDATE club_events
  SET status = 'in_progress'
  WHERE status IN ('registration_closed', 'published')
    AND start_date <= NOW()
    AND end_date >= NOW();

  -- Mark as completed when event ends
  UPDATE club_events
  SET status = 'completed'
  WHERE status = 'in_progress'
    AND end_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Updated timestamp triggers
CREATE TRIGGER update_club_events_updated_at
  BEFORE UPDATE ON club_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_registrations_updated_at
  BEFORE UPDATE ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_documents_updated_at
  BEFORE UPDATE ON event_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. SAMPLE DATA (for development)
-- =====================================================

-- Insert sample events (will need actual club_id from your database)
-- Uncomment and adjust club_id values as needed
/*
INSERT INTO club_events (
  club_id,
  title,
  description,
  event_type,
  start_date,
  end_date,
  registration_opens,
  registration_closes,
  max_participants,
  registration_fee,
  status,
  visibility,
  boat_classes
) VALUES (
  'your-club-uuid-here',
  'Spring Championship Regatta',
  'Annual spring championship racing series for all classes',
  'regatta',
  NOW() + INTERVAL '30 days',
  NOW() + INTERVAL '32 days',
  NOW(),
  NOW() + INTERVAL '25 days',
  50,
  150.00,
  'registration_open',
  'public',
  ARRAY['Dragon', 'J/70', 'Laser']
);
*/

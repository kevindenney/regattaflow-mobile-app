-- ============================================================================
-- CLUB MEMBERS MANAGEMENT SYSTEM
-- ============================================================================
-- Complete member management for sailing clubs

-- Club Members Table
CREATE TABLE IF NOT EXISTS club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Member Information
  membership_type TEXT NOT NULL CHECK (membership_type IN (
    'full', 'social', 'junior', 'senior', 'family', 'honorary', 'crew', 'guest'
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'active', 'inactive', 'suspended', 'expired', 'rejected'
  )),

  -- Role and Permissions
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN (
    'member', 'race_committee', 'instructor', 'admin', 'treasurer', 'secretary'
  )),

  -- Member Details
  sail_number TEXT,
  boat_name TEXT,
  boat_class TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,

  -- Membership Dates
  joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  last_renewed_date DATE,

  -- Payment Information
  membership_fee DECIMAL(10, 2),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN (
    'unpaid', 'paid', 'partial', 'waived', 'overdue'
  )),
  last_payment_date DATE,
  last_payment_amount DECIMAL(10, 2),

  -- Profile Information
  bio TEXT,
  skills TEXT[],
  certifications TEXT[],
  interests TEXT[],

  -- Communication Preferences
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  newsletter_subscription BOOLEAN DEFAULT true,

  -- Administrative
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  admin_notes TEXT,

  -- Activity Tracking
  total_events_participated INTEGER DEFAULT 0,
  total_races_completed INTEGER DEFAULT 0,
  total_volunteer_hours INTEGER DEFAULT 0,
  last_activity_date TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(club_id, user_id)
);

-- Indexes
CREATE INDEX idx_club_members_club_id ON club_members(club_id);
CREATE INDEX idx_club_members_user_id ON club_members(user_id);
CREATE INDEX idx_club_members_status ON club_members(status);
CREATE INDEX idx_club_members_membership_type ON club_members(membership_type);
CREATE INDEX idx_club_members_role ON club_members(role);
CREATE INDEX idx_club_members_sail_number ON club_members(sail_number);
CREATE INDEX idx_club_members_expiry_date ON club_members(expiry_date);

-- ============================================================================
-- MEMBERSHIP REQUESTS (Pending Approvals)
-- ============================================================================

CREATE TABLE IF NOT EXISTS membership_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Applicant Information
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Request Details
  requested_membership_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'withdrawn'
  )),

  -- Application Data
  application_message TEXT,
  sail_number TEXT,
  boat_information JSONB,
  references TEXT[], -- Names of referees

  -- Decision
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  decision_notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(club_id, user_id)
);

CREATE INDEX idx_membership_requests_club_id ON membership_requests(club_id);
CREATE INDEX idx_membership_requests_status ON membership_requests(status);
CREATE INDEX idx_membership_requests_created_at ON membership_requests(created_at DESC);

-- ============================================================================
-- MEMBER PAYMENT HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS member_payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  member_id UUID NOT NULL REFERENCES club_members(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,

  -- Payment Details
  payment_type TEXT NOT NULL CHECK (payment_type IN (
    'membership_fee', 'renewal', 'event_fee', 'late_fee', 'refund', 'other'
  )),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Payment Method
  payment_method TEXT CHECK (payment_method IN (
    'cash', 'check', 'credit_card', 'bank_transfer', 'stripe', 'other'
  )),
  stripe_payment_intent_id TEXT,
  transaction_reference TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN (
    'pending', 'completed', 'failed', 'refunded'
  )),

  -- Period
  period_start DATE,
  period_end DATE,

  -- Metadata
  notes TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_member_payment_history_member_id ON member_payment_history(member_id);
CREATE INDEX idx_member_payment_history_club_id ON member_payment_history(club_id);
CREATE INDEX idx_member_payment_history_created_at ON member_payment_history(created_at DESC);

-- ============================================================================
-- MEMBER ACTIVITY LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS member_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  member_id UUID NOT NULL REFERENCES club_members(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,

  -- Activity Details
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'event_participation', 'race_completion', 'volunteer_hours',
    'committee_meeting', 'training_session', 'boat_maintenance', 'other'
  )),
  description TEXT NOT NULL,

  -- Event Reference
  event_id UUID REFERENCES club_events(id),

  -- Quantitative Data
  hours DECIMAL(5, 2), -- For volunteer hours
  points INTEGER, -- For scoring systems

  -- Metadata
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_member_activity_log_member_id ON member_activity_log(member_id);
CREATE INDEX idx_member_activity_log_club_id ON member_activity_log(club_id);
CREATE INDEX idx_member_activity_log_activity_date ON member_activity_log(activity_date DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_activity_log ENABLE ROW LEVEL SECURITY;

-- Club Members Policies
CREATE POLICY "Club members can view other members in their club"
  ON club_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.club_id = club_members.club_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
  );

CREATE POLICY "Club admins can manage members"
  ON club_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.club_id = club_members.club_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('admin', 'treasurer', 'secretary')
        AND cm.status = 'active'
    )
  );

CREATE POLICY "Users can view their own membership"
  ON club_members FOR SELECT
  USING (user_id = auth.uid());

-- Membership Requests Policies
CREATE POLICY "Users can create membership requests"
  ON membership_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own requests"
  ON membership_requests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Club admins can view and manage requests"
  ON membership_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.club_id = membership_requests.club_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('admin', 'secretary')
        AND cm.status = 'active'
    )
  );

-- Payment History Policies
CREATE POLICY "Members can view their own payment history"
  ON member_payment_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.id = member_payment_history.member_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Club admins can manage payment history"
  ON member_payment_history FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.club_id = member_payment_history.club_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('admin', 'treasurer')
        AND cm.status = 'active'
    )
  );

-- Activity Log Policies
CREATE POLICY "Members can view their own activity"
  ON member_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.id = member_activity_log.member_id
        AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Club admins can manage activity logs"
  ON member_activity_log FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.club_id = member_activity_log.club_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('admin', 'secretary', 'race_committee')
        AND cm.status = 'active'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get member statistics for a club
CREATE OR REPLACE FUNCTION get_club_member_stats(club_uuid UUID)
RETURNS TABLE(
  total_members BIGINT,
  active_members BIGINT,
  pending_requests BIGINT,
  expired_memberships BIGINT,
  new_this_month BIGINT,
  membership_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM club_members WHERE club_id = club_uuid) as total_members,
    (SELECT COUNT(*) FROM club_members WHERE club_id = club_uuid AND status = 'active') as active_members,
    (SELECT COUNT(*) FROM membership_requests WHERE club_id = club_uuid AND status = 'pending') as pending_requests,
    (SELECT COUNT(*) FROM club_members WHERE club_id = club_uuid AND status = 'expired') as expired_memberships,
    (SELECT COUNT(*) FROM club_members
     WHERE club_id = club_uuid
       AND created_at >= date_trunc('month', CURRENT_DATE)) as new_this_month,
    (SELECT COALESCE(SUM(amount), 0) FROM member_payment_history
     WHERE club_id = club_uuid
       AND status = 'completed'
       AND created_at >= date_trunc('year', CURRENT_DATE)) as membership_revenue;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve membership request
CREATE OR REPLACE FUNCTION approve_membership_request(
  request_uuid UUID,
  approver_uuid UUID,
  assigned_role TEXT DEFAULT 'member'
)
RETURNS UUID AS $$
DECLARE
  new_member_id UUID;
  request_record RECORD;
BEGIN
  -- Get request details
  SELECT * INTO request_record
  FROM membership_requests
  WHERE id = request_uuid AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;

  -- Create club member record
  INSERT INTO club_members (
    club_id,
    user_id,
    membership_type,
    status,
    role,
    sail_number,
    joined_date,
    approved_by,
    approved_at
  ) VALUES (
    request_record.club_id,
    request_record.user_id,
    request_record.requested_membership_type,
    'active',
    assigned_role,
    request_record.sail_number,
    CURRENT_DATE,
    approver_uuid,
    NOW()
  )
  RETURNING id INTO new_member_id;

  -- Update request status
  UPDATE membership_requests
  SET status = 'approved',
      reviewed_by = approver_uuid,
      reviewed_at = NOW()
  WHERE id = request_uuid;

  RETURN new_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject membership request
CREATE OR REPLACE FUNCTION reject_membership_request(
  request_uuid UUID,
  reviewer_uuid UUID,
  reason TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE membership_requests
  SET status = 'rejected',
      reviewed_by = reviewer_uuid,
      reviewed_at = NOW(),
      decision_notes = reason
  WHERE id = request_uuid AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_club_members_updated_at
  BEFORE UPDATE ON club_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_membership_requests_updated_at
  BEFORE UPDATE ON membership_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update member activity stats
CREATE OR REPLACE FUNCTION update_member_activity_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE club_members
  SET last_activity_date = NOW(),
      total_events_participated = CASE
        WHEN NEW.activity_type = 'event_participation' THEN total_events_participated + 1
        ELSE total_events_participated
      END,
      total_races_completed = CASE
        WHEN NEW.activity_type = 'race_completion' THEN total_races_completed + 1
        ELSE total_races_completed
      END,
      total_volunteer_hours = CASE
        WHEN NEW.activity_type = 'volunteer_hours' AND NEW.hours IS NOT NULL
        THEN total_volunteer_hours + NEW.hours::INTEGER
        ELSE total_volunteer_hours
      END
  WHERE id = NEW.member_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_member_activity_stats
  AFTER INSERT ON member_activity_log
  FOR EACH ROW
  EXECUTE FUNCTION update_member_activity_stats();

-- ============================================================================
-- RACE REGISTRATION SYSTEM
-- ============================================================================
-- Complete race entry management with payments, crew, and document requirements

-- ============================================================================
-- RACE ENTRIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS race_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Entry Identity
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  boat_id UUID NOT NULL REFERENCES sailor_boats(id) ON DELETE CASCADE,

  -- Entry Details
  entry_class TEXT NOT NULL, -- 'Dragon', 'IRC A', 'One-Design', etc.
  division TEXT, -- 'Pro', 'Corinthian', 'Youth', etc.
  sail_number TEXT NOT NULL,

  -- Registration Status
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending_payment', 'confirmed', 'waitlist', 'withdrawn', 'rejected')) DEFAULT 'draft',
  entry_number TEXT UNIQUE, -- Assigned by race committee when confirmed

  -- Payment Information
  entry_fee_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  entry_fee_currency TEXT NOT NULL DEFAULT 'USD',
  payment_status TEXT NOT NULL CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded', 'waived')) DEFAULT 'unpaid',
  payment_intent_id TEXT, -- Stripe payment intent ID
  payment_method TEXT, -- 'card', 'bank_transfer', 'cash', 'waived'
  paid_at TIMESTAMPTZ,

  -- Special Requests & Notes
  special_requests TEXT,
  dietary_requirements TEXT,
  equipment_notes TEXT,

  -- Crew Information (stored as references)
  crew_member_ids UUID[] DEFAULT '{}', -- Array of crew_members.id

  -- Document Checklist
  documents_required JSONB DEFAULT '[]', -- [{"type": "crew_list", "required": true, "submitted": false}, ...]
  documents_submitted JSONB DEFAULT '[]', -- [{"type": "crew_list", "url": "...", "submitted_at": "..."}]
  documents_complete BOOLEAN DEFAULT false,

  -- Registration Metadata
  registration_source TEXT, -- 'web', 'mobile', 'admin', 'import'
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  withdrawal_reason TEXT,

  -- Admin Notes
  admin_notes TEXT,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one entry per sailor per regatta
  UNIQUE(regatta_id, sailor_id)
);

CREATE INDEX IF NOT EXISTS idx_race_entries_regatta ON race_entries(regatta_id);
CREATE INDEX IF NOT EXISTS idx_race_entries_sailor ON race_entries(sailor_id);
CREATE INDEX IF NOT EXISTS idx_race_entries_boat ON race_entries(boat_id);
CREATE INDEX IF NOT EXISTS idx_race_entries_status ON race_entries(status);
CREATE INDEX IF NOT EXISTS idx_race_entries_payment_status ON race_entries(payment_status);
CREATE INDEX IF NOT EXISTS idx_race_entries_entry_number ON race_entries(entry_number) WHERE entry_number IS NOT NULL;

-- ============================================================================
-- ENTRY CREW ASSIGNMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS entry_crew_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES race_entries(id) ON DELETE CASCADE,
  crew_member_id UUID NOT NULL REFERENCES crew_members(id) ON DELETE CASCADE,

  -- Assignment Details
  position TEXT NOT NULL, -- 'helmsman', 'tactician', 'trimmer', 'bowman'
  is_skipper BOOLEAN DEFAULT false,
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,

  -- Availability
  available_races INTEGER[], -- Array of race numbers they can attend
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(entry_id, crew_member_id)
);

CREATE INDEX IF NOT EXISTS idx_entry_crew_entry ON entry_crew_assignments(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_crew_member ON entry_crew_assignments(crew_member_id);

-- ============================================================================
-- PAYMENT TRANSACTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS entry_payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES race_entries(id) ON DELETE CASCADE,

  -- Transaction Details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT NOT NULL, -- 'stripe', 'bank_transfer', 'cash', 'waived'

  -- Stripe Integration
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  stripe_customer_id TEXT,

  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'cancelled')) DEFAULT 'pending',

  -- Metadata
  metadata JSONB DEFAULT '{}',
  error_message TEXT,

  -- Timestamps
  processed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_entry ON entry_payment_transactions(entry_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_stripe_intent ON entry_payment_transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON entry_payment_transactions(status);

-- ============================================================================
-- DOCUMENT REQUIREMENTS TEMPLATES
-- ============================================================================
CREATE TABLE IF NOT EXISTS regatta_document_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,

  -- Document Type
  document_type TEXT NOT NULL, -- 'crew_list', 'measurement_certificate', 'insurance', 'racing_resume', etc.
  display_name TEXT NOT NULL,
  description TEXT,

  -- Requirements
  required BOOLEAN DEFAULT true,
  deadline TIMESTAMPTZ, -- Document submission deadline

  -- File Specifications
  accepted_formats TEXT[] DEFAULT '{"pdf", "jpg", "png", "doc", "docx"}',
  max_file_size_mb INTEGER DEFAULT 10,

  -- Template/Instructions
  template_url TEXT,
  instructions TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(regatta_id, document_type)
);

CREATE INDEX IF NOT EXISTS idx_document_requirements_regatta ON regatta_document_requirements(regatta_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Race Entries
ALTER TABLE race_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sailors can view their own entries" ON race_entries;
CREATE POLICY "Sailors can view their own entries"
  ON race_entries FOR SELECT
  USING (auth.uid() = sailor_id);

DROP POLICY IF EXISTS "Sailors can create entries" ON race_entries;
CREATE POLICY "Sailors can create entries"
  ON race_entries FOR INSERT
  WITH CHECK (auth.uid() = sailor_id);

DROP POLICY IF EXISTS "Sailors can update their own entries" ON race_entries;
CREATE POLICY "Sailors can update their own entries"
  ON race_entries FOR UPDATE
  USING (auth.uid() = sailor_id)
  WITH CHECK (auth.uid() = sailor_id);

DROP POLICY IF EXISTS "Race committees can view all entries for their regattas" ON race_entries;
CREATE POLICY "Race committees can view all entries for their regattas"
  ON race_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM regattas
      WHERE regattas.id = race_entries.regatta_id
      AND regattas.organizer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Race committees can update entries for their regattas" ON race_entries;
CREATE POLICY "Race committees can update entries for their regattas"
  ON race_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM regattas
      WHERE regattas.id = race_entries.regatta_id
      AND regattas.organizer_id = auth.uid()
    )
  );

-- Entry Crew Assignments
ALTER TABLE entry_crew_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Entry owners can manage crew assignments" ON entry_crew_assignments;
CREATE POLICY "Entry owners can manage crew assignments"
  ON entry_crew_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM race_entries
      WHERE race_entries.id = entry_crew_assignments.entry_id
      AND race_entries.sailor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Crew members can view their assignments" ON entry_crew_assignments;
CREATE POLICY "Crew members can view their assignments"
  ON entry_crew_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crew_members
      WHERE crew_members.id = entry_crew_assignments.crew_member_id
      AND (crew_members.sailor_id = auth.uid() OR crew_members.user_id = auth.uid())
    )
  );

-- Payment Transactions
ALTER TABLE entry_payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Entry owners can view their payment transactions" ON entry_payment_transactions;
CREATE POLICY "Entry owners can view their payment transactions"
  ON entry_payment_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM race_entries
      WHERE race_entries.id = entry_payment_transactions.entry_id
      AND race_entries.sailor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can create payment transactions" ON entry_payment_transactions;
CREATE POLICY "System can create payment transactions"
  ON entry_payment_transactions FOR INSERT
  WITH CHECK (true); -- Service role only

-- Document Requirements
ALTER TABLE regatta_document_requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view document requirements" ON regatta_document_requirements;
CREATE POLICY "Anyone can view document requirements"
  ON regatta_document_requirements FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Organizers can manage document requirements" ON regatta_document_requirements;
CREATE POLICY "Organizers can manage document requirements"
  ON regatta_document_requirements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM regattas
      WHERE regattas.id = regatta_document_requirements.regatta_id
      AND regattas.organizer_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
DROP TRIGGER IF EXISTS update_race_entries_updated_at ON race_entries;
CREATE TRIGGER update_race_entries_updated_at
  BEFORE UPDATE ON race_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entry_crew_assignments_updated_at ON entry_crew_assignments;
CREATE TRIGGER update_entry_crew_assignments_updated_at
  BEFORE UPDATE ON entry_crew_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entry_payment_transactions_updated_at ON entry_payment_transactions;
CREATE TRIGGER update_entry_payment_transactions_updated_at
  BEFORE UPDATE ON entry_payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-assign entry number when confirmed
CREATE OR REPLACE FUNCTION assign_entry_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  new_entry_number TEXT;
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' AND NEW.entry_number IS NULL THEN
    -- Get next entry number for this regatta
    SELECT COALESCE(MAX(CAST(SUBSTRING(entry_number FROM '[0-9]+') AS INTEGER)), 0) + 1
    INTO next_number
    FROM race_entries
    WHERE regatta_id = NEW.regatta_id
    AND entry_number IS NOT NULL;

    -- Format as "RR-NNN" (Regatta-Number)
    NEW.entry_number = 'E-' || LPAD(next_number::TEXT, 3, '0');
    NEW.confirmed_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS assign_entry_number_trigger ON race_entries;
CREATE TRIGGER assign_entry_number_trigger
  BEFORE UPDATE ON race_entries
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed' AND OLD.status != 'confirmed')
  EXECUTE FUNCTION assign_entry_number();

-- Update payment status when transaction succeeds
CREATE OR REPLACE FUNCTION update_entry_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'succeeded' AND OLD.status != 'succeeded' THEN
    UPDATE race_entries
    SET
      payment_status = 'paid',
      paid_at = NOW(),
      status = CASE
        WHEN status = 'pending_payment' THEN 'confirmed'
        ELSE status
      END
    WHERE id = NEW.entry_id;
  ELSIF NEW.status = 'refunded' AND OLD.status != 'refunded' THEN
    UPDATE race_entries
    SET payment_status = 'refunded'
    WHERE id = NEW.entry_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_entry_payment_status_trigger ON entry_payment_transactions;
CREATE TRIGGER update_entry_payment_status_trigger
  AFTER UPDATE ON entry_payment_transactions
  FOR EACH ROW
  WHEN (NEW.status != OLD.status)
  EXECUTE FUNCTION update_entry_payment_status();

-- Check document completeness
CREATE OR REPLACE FUNCTION check_documents_complete()
RETURNS TRIGGER AS $$
DECLARE
  required_docs JSONB;
  submitted_types TEXT[];
  required_types TEXT[];
  is_complete BOOLEAN;
BEGIN
  -- Get required document types
  SELECT jsonb_agg(document_type)
  INTO required_docs
  FROM regatta_document_requirements
  WHERE regatta_id = NEW.regatta_id
  AND required = true;

  -- Extract required types array
  SELECT ARRAY(SELECT jsonb_array_elements_text(required_docs))
  INTO required_types;

  -- Extract submitted types from documents_submitted
  SELECT ARRAY(SELECT DISTINCT jsonb_array_elements(NEW.documents_submitted)->>'type')
  INTO submitted_types;

  -- Check if all required documents are submitted
  is_complete = required_types <@ submitted_types;

  NEW.documents_complete = is_complete;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_documents_complete_trigger ON race_entries;
CREATE TRIGGER check_documents_complete_trigger
  BEFORE INSERT OR UPDATE OF documents_submitted ON race_entries
  FOR EACH ROW
  EXECUTE FUNCTION check_documents_complete();

-- Grant permissions
GRANT ALL ON race_entries TO authenticated;
GRANT ALL ON entry_crew_assignments TO authenticated;
GRANT ALL ON entry_payment_transactions TO authenticated;
GRANT ALL ON regatta_document_requirements TO authenticated;

-- Comments
COMMENT ON TABLE race_entries IS 'Race registrations with payment and crew management';
COMMENT ON TABLE entry_crew_assignments IS 'Crew member assignments for race entries';
COMMENT ON TABLE entry_payment_transactions IS 'Payment transactions for race entries via Stripe';
COMMENT ON TABLE regatta_document_requirements IS 'Required documents for race registration';

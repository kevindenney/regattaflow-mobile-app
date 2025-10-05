-- Circuit Planning System
-- Multi-venue racing campaign management with logistics optimization

-- Racing Circuits Table
CREATE TABLE IF NOT EXISTS racing_circuits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Circuit Metadata
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'confirmed', 'active', 'completed', 'cancelled')),

  -- Circuit Data (JSONB for flexibility)
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  budget JSONB NOT NULL DEFAULT '{
    "entryFees": 0,
    "travel": 0,
    "accommodation": 0,
    "equipment": 0,
    "meals": 0,
    "visa": 0,
    "contingency": 0,
    "total": 0
  }'::jsonb,

  -- Calculated Metrics
  total_days INTEGER DEFAULT 0,
  total_distance INTEGER DEFAULT 0, -- km
  qualification_impact INTEGER DEFAULT 0, -- percentage
  carbon_footprint INTEGER DEFAULT 0, -- kg CO2

  -- Travel Logistics
  travel_legs JSONB DEFAULT '[]'::jsonb,
  equipment_strategy TEXT CHECK (equipment_strategy IN ('ship', 'charter', 'buy-sell', 'trailer')),

  -- Documents & Notes
  notes TEXT,
  documents JSONB DEFAULT '[]'::jsonb,

  -- Sharing
  shared_with UUID[] DEFAULT ARRAY[]::UUID[],
  is_public BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circuit Events Junction Table (for easier querying)
CREATE TABLE IF NOT EXISTS circuit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circuit_id UUID NOT NULL REFERENCES racing_circuits(id) ON DELETE CASCADE,

  -- Event Details
  venue_id TEXT NOT NULL, -- References sailing_venues.id
  venue_name TEXT NOT NULL,
  country TEXT NOT NULL,
  event_name TEXT NOT NULL,

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Registration
  entry_fee DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  registration_status TEXT CHECK (registration_status IN ('not_registered', 'pending', 'confirmed', 'cancelled')),
  registration_deadline DATE,

  -- Qualification
  is_qualifier BOOLEAN DEFAULT false,
  qualification_points INTEGER DEFAULT 0,

  -- Position in circuit
  sequence_order INTEGER NOT NULL,

  -- Prep Status
  documents_ready BOOLEAN DEFAULT false,
  strategy_ready BOOLEAN DEFAULT false,
  crew_confirmed BOOLEAN DEFAULT false,
  equipment_ready BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visa Requirements Tracking
CREATE TABLE IF NOT EXISTS circuit_visa_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circuit_id UUID NOT NULL REFERENCES racing_circuits(id) ON DELETE CASCADE,

  country TEXT NOT NULL,
  required BOOLEAN DEFAULT false,
  processing_days INTEGER DEFAULT 0,
  cost DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',

  -- Status
  status TEXT DEFAULT 'not_applied' CHECK (status IN ('not_applied', 'applied', 'approved', 'denied')),
  application_date DATE,
  approval_date DATE,
  expiry_date DATE,

  -- Documents
  notes TEXT,
  documents JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(circuit_id, country)
);

-- Accommodation Bookings
CREATE TABLE IF NOT EXISTS circuit_accommodation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circuit_id UUID NOT NULL REFERENCES racing_circuits(id) ON DELETE CASCADE,
  circuit_event_id UUID REFERENCES circuit_events(id) ON DELETE CASCADE,

  -- Accommodation Details
  venue_name TEXT NOT NULL,
  accommodation_type TEXT CHECK (accommodation_type IN ('hotel', 'airbnb', 'yacht_club', 'hostel', 'other')),
  name TEXT,
  address TEXT,

  -- Dates
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INTEGER GENERATED ALWAYS AS (check_out - check_in) STORED,

  -- Cost
  cost_per_night DECIMAL(10, 2),
  total_cost DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',

  -- Booking Status
  status TEXT DEFAULT 'researching' CHECK (status IN ('researching', 'pending', 'confirmed', 'cancelled')),
  confirmation_number TEXT,

  -- Contact
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Equipment Transport Tracking
CREATE TABLE IF NOT EXISTS circuit_equipment_transport (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circuit_id UUID NOT NULL REFERENCES racing_circuits(id) ON DELETE CASCADE,

  -- Transport Details
  method TEXT NOT NULL CHECK (method IN ('ship', 'charter', 'buy-sell', 'trailer', 'fly')),
  from_venue TEXT,
  to_venue TEXT,

  -- Timing
  ship_date DATE,
  estimated_arrival DATE,
  actual_arrival DATE,

  -- Cost
  estimated_cost DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',

  -- Tracking
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'booked', 'in_transit', 'arrived', 'cancelled')),
  tracking_number TEXT,
  carrier TEXT,

  -- Notes
  notes TEXT,
  documents JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_racing_circuits_user_id ON racing_circuits(user_id);
CREATE INDEX idx_racing_circuits_status ON racing_circuits(status);
CREATE INDEX idx_racing_circuits_updated_at ON racing_circuits(updated_at DESC);

CREATE INDEX idx_circuit_events_circuit_id ON circuit_events(circuit_id);
CREATE INDEX idx_circuit_events_venue_id ON circuit_events(venue_id);
CREATE INDEX idx_circuit_events_start_date ON circuit_events(start_date);
CREATE INDEX idx_circuit_events_sequence_order ON circuit_events(circuit_id, sequence_order);

CREATE INDEX idx_circuit_visa_requirements_circuit_id ON circuit_visa_requirements(circuit_id);
CREATE INDEX idx_circuit_accommodation_circuit_id ON circuit_accommodation(circuit_id);
CREATE INDEX idx_circuit_accommodation_dates ON circuit_accommodation(check_in, check_out);
CREATE INDEX idx_circuit_equipment_transport_circuit_id ON circuit_equipment_transport(circuit_id);

-- Row Level Security (RLS)
ALTER TABLE racing_circuits ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_visa_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_accommodation ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_equipment_transport ENABLE ROW LEVEL SECURITY;

-- RLS Policies for racing_circuits
CREATE POLICY "Users can view their own circuits"
  ON racing_circuits FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() = ANY(shared_with)
    OR is_public = true
  );

CREATE POLICY "Users can create their own circuits"
  ON racing_circuits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own circuits"
  ON racing_circuits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own circuits"
  ON racing_circuits FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for circuit_events
CREATE POLICY "Users can view events in their circuits"
  ON circuit_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM racing_circuits
      WHERE racing_circuits.id = circuit_events.circuit_id
        AND (
          racing_circuits.user_id = auth.uid()
          OR auth.uid() = ANY(racing_circuits.shared_with)
          OR racing_circuits.is_public = true
        )
    )
  );

CREATE POLICY "Users can manage events in their circuits"
  ON circuit_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM racing_circuits
      WHERE racing_circuits.id = circuit_events.circuit_id
        AND racing_circuits.user_id = auth.uid()
    )
  );

-- RLS Policies for circuit_visa_requirements
CREATE POLICY "Users can view visa requirements for their circuits"
  ON circuit_visa_requirements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM racing_circuits
      WHERE racing_circuits.id = circuit_visa_requirements.circuit_id
        AND racing_circuits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage visa requirements for their circuits"
  ON circuit_visa_requirements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM racing_circuits
      WHERE racing_circuits.id = circuit_visa_requirements.circuit_id
        AND racing_circuits.user_id = auth.uid()
    )
  );

-- RLS Policies for circuit_accommodation
CREATE POLICY "Users can view accommodation for their circuits"
  ON circuit_accommodation FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM racing_circuits
      WHERE racing_circuits.id = circuit_accommodation.circuit_id
        AND racing_circuits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage accommodation for their circuits"
  ON circuit_accommodation FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM racing_circuits
      WHERE racing_circuits.id = circuit_accommodation.circuit_id
        AND racing_circuits.user_id = auth.uid()
    )
  );

-- RLS Policies for circuit_equipment_transport
CREATE POLICY "Users can view equipment transport for their circuits"
  ON circuit_equipment_transport FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM racing_circuits
      WHERE racing_circuits.id = circuit_equipment_transport.circuit_id
        AND racing_circuits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage equipment transport for their circuits"
  ON circuit_equipment_transport FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM racing_circuits
      WHERE racing_circuits.id = circuit_equipment_transport.circuit_id
        AND racing_circuits.user_id = auth.uid()
    )
  );

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_racing_circuits_updated_at
  BEFORE UPDATE ON racing_circuits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circuit_events_updated_at
  BEFORE UPDATE ON circuit_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circuit_visa_requirements_updated_at
  BEFORE UPDATE ON circuit_visa_requirements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circuit_accommodation_updated_at
  BEFORE UPDATE ON circuit_accommodation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_circuit_equipment_transport_updated_at
  BEFORE UPDATE ON circuit_equipment_transport
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helpful views
CREATE OR REPLACE VIEW circuit_summary AS
SELECT
  rc.id,
  rc.user_id,
  rc.name,
  rc.description,
  rc.status,
  rc.total_days,
  rc.total_distance,
  rc.qualification_impact,
  rc.carbon_footprint,
  (rc.budget->>'total')::decimal as budget_total,
  COUNT(DISTINCT ce.id) as event_count,
  COUNT(DISTINCT CASE WHEN ce.is_qualifier THEN ce.id END) as qualifier_count,
  MIN(ce.start_date) as first_event_date,
  MAX(ce.end_date) as last_event_date,
  rc.created_at,
  rc.updated_at
FROM racing_circuits rc
LEFT JOIN circuit_events ce ON ce.circuit_id = rc.id
GROUP BY rc.id;

-- Grant access to views
GRANT SELECT ON circuit_summary TO authenticated;

-- Add helpful comments
COMMENT ON TABLE racing_circuits IS 'Multi-venue racing campaigns with logistics optimization';
COMMENT ON TABLE circuit_events IS 'Individual events within a racing circuit';
COMMENT ON TABLE circuit_visa_requirements IS 'Visa requirements and status for circuit destinations';
COMMENT ON TABLE circuit_accommodation IS 'Accommodation bookings for circuit events';
COMMENT ON TABLE circuit_equipment_transport IS 'Equipment transport logistics between venues';

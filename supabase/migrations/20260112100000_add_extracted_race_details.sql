-- Migration: Add columns for AI-extracted race details
-- These columns store comprehensive race information extracted from PDFs/NORs

-- Entry & Registration
ALTER TABLE regattas ADD COLUMN IF NOT EXISTS entry_fees JSONB;
COMMENT ON COLUMN regattas.entry_fees IS 'Array of entry fees: [{type, amount, currency}]';

ALTER TABLE regattas ADD COLUMN IF NOT EXISTS entry_deadline TIMESTAMPTZ;
COMMENT ON COLUMN regattas.entry_deadline IS 'Deadline for race entry/registration';

-- Crew & Safety
ALTER TABLE regattas ADD COLUMN IF NOT EXISTS minimum_crew INTEGER;
COMMENT ON COLUMN regattas.minimum_crew IS 'Minimum number of crew members required';

ALTER TABLE regattas ADD COLUMN IF NOT EXISTS crew_requirements TEXT;
COMMENT ON COLUMN regattas.crew_requirements IS 'Specific crew requirements (experience, certifications, etc.)';

ALTER TABLE regattas ADD COLUMN IF NOT EXISTS safety_requirements TEXT;
COMMENT ON COLUMN regattas.safety_requirements IS 'Safety equipment and procedure requirements';

ALTER TABLE regattas ADD COLUMN IF NOT EXISTS retirement_notification TEXT;
COMMENT ON COLUMN regattas.retirement_notification IS 'Requirements for notifying race committee of retirement';

-- Schedule
ALTER TABLE regattas ADD COLUMN IF NOT EXISTS schedule JSONB;
COMMENT ON COLUMN regattas.schedule IS 'Event schedule: [{date, time, event, location, mandatory}]';

-- Course Details
ALTER TABLE regattas ADD COLUMN IF NOT EXISTS prohibited_areas JSONB;
COMMENT ON COLUMN regattas.prohibited_areas IS 'Off-limits areas: [{name, description, coordinates, consequence}]';

ALTER TABLE regattas ADD COLUMN IF NOT EXISTS traffic_separation_schemes JSONB;
COMMENT ON COLUMN regattas.traffic_separation_schemes IS 'Shipping lanes and traffic separation zones to avoid';

ALTER TABLE regattas ADD COLUMN IF NOT EXISTS tide_gates JSONB;
COMMENT ON COLUMN regattas.tide_gates IS 'Optimal tide gate passing times: [{location, optimalTime, notes}]';

ALTER TABLE regattas ADD COLUMN IF NOT EXISTS start_area_name TEXT;
COMMENT ON COLUMN regattas.start_area_name IS 'Name/designation of start area';

ALTER TABLE regattas ADD COLUMN IF NOT EXISTS start_area_description TEXT;
COMMENT ON COLUMN regattas.start_area_description IS 'Description of start line and procedure';

-- Scoring
ALTER TABLE regattas ADD COLUMN IF NOT EXISTS scoring_formula TEXT;
COMMENT ON COLUMN regattas.scoring_formula IS 'Scoring formula description (e.g., IRC, HKPN)';

ALTER TABLE regattas ADD COLUMN IF NOT EXISTS handicap_systems JSONB;
COMMENT ON COLUMN regattas.handicap_systems IS 'Array of handicap systems used';

-- Motoring (distance races)
ALTER TABLE regattas ADD COLUMN IF NOT EXISTS motoring_division_available BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN regattas.motoring_division_available IS 'Whether a motoring division is offered';

ALTER TABLE regattas ADD COLUMN IF NOT EXISTS motoring_division_rules TEXT;
COMMENT ON COLUMN regattas.motoring_division_rules IS 'Rules and penalties for motoring division';

-- Communications
ALTER TABLE regattas ADD COLUMN IF NOT EXISTS vhf_channels JSONB;
COMMENT ON COLUMN regattas.vhf_channels IS 'VHF channels: [{channel, purpose}]';

-- Organization
ALTER TABLE regattas ADD COLUMN IF NOT EXISTS organizing_authority TEXT;
COMMENT ON COLUMN regattas.organizing_authority IS 'Name of organizing authority/club';

ALTER TABLE regattas ADD COLUMN IF NOT EXISTS event_website TEXT;
COMMENT ON COLUMN regattas.event_website IS 'Official event website URL';

ALTER TABLE regattas ADD COLUMN IF NOT EXISTS contact_email TEXT;
COMMENT ON COLUMN regattas.contact_email IS 'Primary contact email for the event';

-- Weather & Conditions
ALTER TABLE regattas ADD COLUMN IF NOT EXISTS expected_conditions TEXT;
COMMENT ON COLUMN regattas.expected_conditions IS 'Expected weather and sea conditions';

ALTER TABLE regattas ADD COLUMN IF NOT EXISTS expected_wind_direction TEXT;
COMMENT ON COLUMN regattas.expected_wind_direction IS 'Expected wind direction';

ALTER TABLE regattas ADD COLUMN IF NOT EXISTS expected_wind_speed_min INTEGER;
COMMENT ON COLUMN regattas.expected_wind_speed_min IS 'Expected minimum wind speed (knots)';

ALTER TABLE regattas ADD COLUMN IF NOT EXISTS expected_wind_speed_max INTEGER;
COMMENT ON COLUMN regattas.expected_wind_speed_max IS 'Expected maximum wind speed (knots)';

-- Insurance & Rules
ALTER TABLE regattas ADD COLUMN IF NOT EXISTS insurance_requirements TEXT;
COMMENT ON COLUMN regattas.insurance_requirements IS 'Insurance requirements for entry';

ALTER TABLE regattas ADD COLUMN IF NOT EXISTS class_rules JSONB;
COMMENT ON COLUMN regattas.class_rules IS 'Array of applicable class rules';

-- Prizes
ALTER TABLE regattas ADD COLUMN IF NOT EXISTS prizes_description TEXT;
COMMENT ON COLUMN regattas.prizes_description IS 'Description of prizes and awards';

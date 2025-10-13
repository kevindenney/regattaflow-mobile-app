-- ============================================================================
-- COMPREHENSIVE RACE STRATEGY FIELDS
-- ============================================================================
-- Adds all fields needed for proper race strategy planning and execution
-- Powers comprehensive race entry interface with AI auto-suggest

-- ============================================================================
-- RACE TIMING & SEQUENCE FIELDS
-- ============================================================================

ALTER TABLE regattas
  -- Warning signals and timing
  ADD COLUMN IF NOT EXISTS warning_signal_time TIME, -- First warning signal (e.g., 10:00:00)
  ADD COLUMN IF NOT EXISTS warning_signal_type TEXT, -- 'sound', 'flag', 'both'
  ADD COLUMN IF NOT EXISTS preparatory_signal_minutes INTEGER DEFAULT 4, -- Usually 4 minutes before start
  ADD COLUMN IF NOT EXISTS class_interval_minutes INTEGER DEFAULT 5, -- Time between class starts

  -- Multiple starts configuration
  ADD COLUMN IF NOT EXISTS total_starts INTEGER, -- Total number of starts (for multiple classes/fleets)
  ADD COLUMN IF NOT EXISTS start_sequence_details JSONB, -- [{class: 'Dragon', warning: '10:00', start: '10:05'}, ...]

  -- Finish timing
  ADD COLUMN IF NOT EXISTS planned_finish_time TIME,
  ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER; -- Race time limit

-- ============================================================================
-- COMMUNICATIONS & RACE CONTROL
-- ============================================================================

ALTER TABLE regattas
  -- VHF Radio (already exists, but adding related fields)
  ADD COLUMN IF NOT EXISTS vhf_backup_channel TEXT, -- Backup radio channel
  ADD COLUMN IF NOT EXISTS safety_channel TEXT DEFAULT 'VHF 16', -- Safety/emergency channel

  -- Race committee positions
  ADD COLUMN IF NOT EXISTS rc_boat_name TEXT, -- Race committee boat name
  ADD COLUMN IF NOT EXISTS rc_boat_position TEXT, -- e.g., 'East end of start line'
  ADD COLUMN IF NOT EXISTS mark_boat_positions JSONB, -- [{mark: 'A', boat: 'Zodiac 1', position: 'Windward'}, ...]

  -- Committee information
  ADD COLUMN IF NOT EXISTS race_officer TEXT, -- Principal Race Officer name
  ADD COLUMN IF NOT EXISTS protest_committee TEXT; -- Protest committee contact

-- ============================================================================
-- COURSE & START AREA DETAILS
-- ============================================================================

ALTER TABLE regattas
  -- Start area
  ADD COLUMN IF NOT EXISTS start_area_name TEXT, -- e.g., 'Victoria Harbour East', 'Starting Area A'
  ADD COLUMN IF NOT EXISTS start_area_description TEXT, -- Detailed description of start area location
  ADD COLUMN IF NOT EXISTS start_line_coordinates JSONB, -- {pin: {lat, lng}, rc: {lat, lng}, bearing: 180}
  ADD COLUMN IF NOT EXISTS start_line_length_meters DECIMAL(6,2), -- Length of start line

  -- Course configurations
  ADD COLUMN IF NOT EXISTS potential_courses JSONB, -- ['Windward/Leeward', 'Triangle', 'Trapezoid', 'Olympic']
  ADD COLUMN IF NOT EXISTS course_selection_criteria TEXT, -- 'Based on wind direction and strength'
  ADD COLUMN IF NOT EXISTS mark_designations JSONB, -- {1: 'A', 2: 'B', 3: 'C', gate_port: 'GP', gate_starboard: 'GS'}
  ADD COLUMN IF NOT EXISTS course_diagram_url TEXT, -- URL to course diagram image
  ADD COLUMN IF NOT EXISTS race_area_boundaries JSONB; -- GeoJSON polygon of racing area

-- ============================================================================
-- RACE RULES & PENALTIES
-- ============================================================================

ALTER TABLE regattas
  -- Scoring system
  ADD COLUMN IF NOT EXISTS scoring_system TEXT DEFAULT 'Low Point', -- 'Low Point', 'Bonus Point', 'Custom'
  ADD COLUMN IF NOT EXISTS scoring_details JSONB, -- {first: 1, second: 2, dnf: 99, dns: 99, discard: 1}

  -- Penalty system
  ADD COLUMN IF NOT EXISTS penalty_system TEXT DEFAULT '720°', -- '720°', 'Scoring', 'Protest', 'One-Turn', 'Two-Turn'
  ADD COLUMN IF NOT EXISTS penalty_details TEXT, -- Additional penalty rules

  -- Special instructions
  ADD COLUMN IF NOT EXISTS special_rules TEXT[], -- ['Rule 42 strictly enforced', 'No spinnakers']
  ADD COLUMN IF NOT EXISTS sailing_instructions_url TEXT, -- URL to SI document
  ADD COLUMN IF NOT EXISTS notice_of_race_url TEXT, -- URL to NOR document
  ADD COLUMN IF NOT EXISTS amendments TEXT[]; -- Race amendments/changes

-- ============================================================================
-- CLASS & FLEET DETAILS
-- ============================================================================

ALTER TABLE regattas
  -- Class/division information
  ADD COLUMN IF NOT EXISTS class_divisions JSONB, -- [{name: 'Dragon', fleet_size: 12}, {name: 'J/70', fleet_size: 8}]
  ADD COLUMN IF NOT EXISTS expected_fleet_size INTEGER, -- Total expected participants
  ADD COLUMN IF NOT EXISTS fleet_size_by_class JSONB, -- {Dragon: 12, 'J/70': 8}

  -- Boat requirements
  ADD COLUMN IF NOT EXISTS boat_requirements TEXT[], -- ['Valid measurement certificate', 'Class legal sails']
  ADD COLUMN IF NOT EXISTS crew_limitations JSONB, -- {min: 2, max: 4, weight_limit_kg: 350}
  ADD COLUMN IF NOT EXISTS equipment_requirements TEXT[]; -- ['Life jackets', 'VHF radio', 'Distress signals']

-- ============================================================================
-- WEATHER & CONDITIONS
-- ============================================================================

ALTER TABLE regattas
  -- Weather planning
  ADD COLUMN IF NOT EXISTS expected_wind_direction INTEGER, -- 0-360 degrees
  ADD COLUMN IF NOT EXISTS expected_wind_speed_min INTEGER, -- knots
  ADD COLUMN IF NOT EXISTS expected_wind_speed_max INTEGER, -- knots
  ADD COLUMN IF NOT EXISTS expected_conditions TEXT, -- 'Light air', 'Moderate breeze', 'Strong winds'

  -- Tide & current
  ADD COLUMN IF NOT EXISTS tide_at_start TEXT, -- 'High tide +2:30', 'Low tide -1:00'
  ADD COLUMN IF NOT EXISTS current_direction INTEGER, -- 0-360 degrees
  ADD COLUMN IF NOT EXISTS current_speed_knots DECIMAL(4,2),

  -- Weather-based decisions
  ADD COLUMN IF NOT EXISTS postponement_wind_min INTEGER, -- Minimum wind for racing
  ADD COLUMN IF NOT EXISTS abandonment_wind_max INTEGER, -- Maximum wind before abandonment
  ADD COLUMN IF NOT EXISTS weather_briefing_time TIME; -- Time of weather briefing

-- ============================================================================
-- TACTICAL & STRATEGIC NOTES
-- ============================================================================

ALTER TABLE regattas
  -- Pre-race strategy
  ADD COLUMN IF NOT EXISTS venue_specific_notes TEXT, -- Local knowledge, venue-specific tactics
  ADD COLUMN IF NOT EXISTS favored_side TEXT, -- 'Left', 'Right', 'Middle', 'TBD'
  ADD COLUMN IF NOT EXISTS layline_strategy TEXT, -- 'Conservative', 'Aggressive', 'Middle third'
  ADD COLUMN IF NOT EXISTS start_strategy TEXT, -- 'Pin end', 'Boat end', 'Middle', 'Flexible'

  -- Historical data
  ADD COLUMN IF NOT EXISTS previous_race_notes TEXT, -- Notes from previous races at this venue
  ADD COLUMN IF NOT EXISTS local_sailor_intel TEXT; -- Tips from local sailors

-- ============================================================================
-- REGISTRATION & LOGISTICS
-- ============================================================================

ALTER TABLE regattas
  -- Entry details
  ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS entry_fee_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS entry_fee_currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS late_entry_allowed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS late_entry_fee_amount DECIMAL(10,2),

  -- Check-in
  ADD COLUMN IF NOT EXISTS check_in_time TIME,
  ADD COLUMN IF NOT EXISTS check_in_location TEXT,
  ADD COLUMN IF NOT EXISTS skipper_briefing_time TIME,
  ADD COLUMN IF NOT EXISTS skipper_briefing_location TEXT,

  -- Facilities
  ADD COLUMN IF NOT EXISTS parking_available BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS parking_notes TEXT,
  ADD COLUMN IF NOT EXISTS launch_ramp_available BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS crane_hoist_available BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS shore_facilities TEXT[]; -- ['Showers', 'Lockers', 'Clubhouse', 'Restaurant']

-- ============================================================================
-- SOCIAL & POST-RACE
-- ============================================================================

ALTER TABLE regattas
  -- Social events
  ADD COLUMN IF NOT EXISTS post_race_social BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS social_event_details TEXT,
  ADD COLUMN IF NOT EXISTS prize_giving_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS prize_giving_location TEXT,

  -- Results & Media
  ADD COLUMN IF NOT EXISTS results_posted_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS results_url TEXT,
  ADD COLUMN IF NOT EXISTS live_tracking_url TEXT,
  ADD COLUMN IF NOT EXISTS event_hashtag TEXT,
  ADD COLUMN IF NOT EXISTS photographer_present BOOLEAN DEFAULT false;

-- ============================================================================
-- AI-GENERATED SUGGESTIONS
-- ============================================================================

ALTER TABLE regattas
  -- AI suggestions based on venue, conditions, and historical data
  ADD COLUMN IF NOT EXISTS ai_suggested_start_strategy JSONB, -- {strategy: 'Pin end bias', confidence: 0.85, reasoning: '...'}
  ADD COLUMN IF NOT EXISTS ai_suggested_course_side JSONB, -- {side: 'left', confidence: 0.75, reasoning: '...'}
  ADD COLUMN IF NOT EXISTS ai_tactical_recommendations TEXT[], -- AI-generated tactical tips
  ADD COLUMN IF NOT EXISTS ai_confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  ADD COLUMN IF NOT EXISTS ai_analysis_timestamp TIMESTAMPTZ; -- When AI analysis was performed

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_regattas_warning_signal_time ON regattas(warning_signal_time);
CREATE INDEX IF NOT EXISTS idx_regattas_registration_deadline ON regattas(registration_deadline);
CREATE INDEX IF NOT EXISTS idx_regattas_expected_fleet_size ON regattas(expected_fleet_size);
CREATE INDEX IF NOT EXISTS idx_regattas_ai_confidence ON regattas(ai_confidence_score DESC);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN regattas.warning_signal_time IS 'First warning signal time for Race 1';
COMMENT ON COLUMN regattas.start_sequence_details IS 'Detailed start sequence for multiple classes/fleets';
COMMENT ON COLUMN regattas.potential_courses IS 'List of possible course configurations based on conditions';
COMMENT ON COLUMN regattas.penalty_system IS 'Penalty system used for rule infractions';
COMMENT ON COLUMN regattas.ai_suggested_start_strategy IS 'AI-generated start strategy based on venue intelligence and conditions';
COMMENT ON COLUMN regattas.ai_tactical_recommendations IS 'AI-generated tactical recommendations for this specific race';

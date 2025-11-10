-- Add NOR (Notice of Race) document fields to regattas table
-- This migration adds comprehensive fields to capture all information from NOR documents

ALTER TABLE regattas
  -- Document Reference Fields
  ADD COLUMN IF NOT EXISTS nor_amendments jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS supplementary_si_url text,

  -- Governing Rules (Section 1 of typical NOR)
  ADD COLUMN IF NOT EXISTS governing_rules jsonb DEFAULT '{}'::jsonb,
  -- Structure: {
  --   "racing_rules_system": "RRS 2021-2024",
  --   "class_rules": "Dragon Class Rules",
  --   "prescriptions": "HKSF Prescriptions",
  --   "additional_documents": ["Document 1", "Document 2"]
  -- }

  -- Eligibility & Entry (Section 2 of typical NOR)
  ADD COLUMN IF NOT EXISTS eligibility_requirements text,
  ADD COLUMN IF NOT EXISTS entry_form_url text,
  ADD COLUMN IF NOT EXISTS entry_deadline timestamp with time zone,
  ADD COLUMN IF NOT EXISTS late_entry_policy text,

  -- Schedule Details (Section 3 of typical NOR)
  ADD COLUMN IF NOT EXISTS event_series_name text,
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS racing_days date[],
  ADD COLUMN IF NOT EXISTS races_per_day integer,
  ADD COLUMN IF NOT EXISTS first_warning_signal time,
  ADD COLUMN IF NOT EXISTS reserve_days date[],

  -- Course Information (Section 4 of typical NOR)
  ADD COLUMN IF NOT EXISTS course_attachment_reference text,
  ADD COLUMN IF NOT EXISTS course_area_designation text,

  -- Scoring System (Section 5 of typical NOR) - Enhanced
  ADD COLUMN IF NOT EXISTS series_races_required integer,
  ADD COLUMN IF NOT EXISTS discards_policy text,

  -- Safety (Section 6 of typical NOR)
  ADD COLUMN IF NOT EXISTS safety_requirements text,
  ADD COLUMN IF NOT EXISTS retirement_notification_requirements text,

  -- Insurance (Section 8 of typical NOR)
  ADD COLUMN IF NOT EXISTS minimum_insurance_coverage numeric(10, 2),
  ADD COLUMN IF NOT EXISTS insurance_policy_reference text,

  -- Prizes (Section 9 of typical NOR)
  ADD COLUMN IF NOT EXISTS prizes_description text,
  ADD COLUMN IF NOT EXISTS prize_presentation_details text;

-- Add helpful comments
COMMENT ON COLUMN regattas.nor_amendments IS 'Array of NOR amendments with url, date, and description';
COMMENT ON COLUMN regattas.supplementary_si_url IS 'URL to supplementary sailing instructions (SSI)';
COMMENT ON COLUMN regattas.governing_rules IS 'JSON object containing racing rules system, class rules, prescriptions, etc.';
COMMENT ON COLUMN regattas.eligibility_requirements IS 'Text description of eligibility requirements for participants';
COMMENT ON COLUMN regattas.entry_form_url IS 'URL to online entry form or registration page';
COMMENT ON COLUMN regattas.entry_deadline IS 'Deadline for entries (may differ from registration_deadline)';
COMMENT ON COLUMN regattas.late_entry_policy IS 'Policy for late entries';
COMMENT ON COLUMN regattas.event_series_name IS 'Name of the event series (e.g., Croucher Series, Phyloong Series)';
COMMENT ON COLUMN regattas.event_type IS 'Type of event (e.g., Championship, Series Race, Practice Race)';
COMMENT ON COLUMN regattas.racing_days IS 'Array of dates when racing will occur (for multi-day events)';
COMMENT ON COLUMN regattas.races_per_day IS 'Maximum number of races scheduled per day';
COMMENT ON COLUMN regattas.first_warning_signal IS 'Time of first warning signal';
COMMENT ON COLUMN regattas.reserve_days IS 'Array of reserve/backup dates';
COMMENT ON COLUMN regattas.course_attachment_reference IS 'Reference to course attachment (e.g., SSI Attachment A)';
COMMENT ON COLUMN regattas.course_area_designation IS 'Designated sailing area (e.g., Port Shelter, Clearwater Bay)';
COMMENT ON COLUMN regattas.series_races_required IS 'Minimum number of races to constitute a series';
COMMENT ON COLUMN regattas.discards_policy IS 'Policy for race discards in series scoring';
COMMENT ON COLUMN regattas.safety_requirements IS 'Safety equipment and check-in requirements';
COMMENT ON COLUMN regattas.retirement_notification_requirements IS 'Requirements for notifying retirement from race';
COMMENT ON COLUMN regattas.minimum_insurance_coverage IS 'Minimum required insurance coverage amount';
COMMENT ON COLUMN regattas.insurance_policy_reference IS 'Reference to insurance policy requirements';
COMMENT ON COLUMN regattas.prizes_description IS 'Description of prizes to be awarded';
COMMENT ON COLUMN regattas.prize_presentation_details IS 'Details about prize presentation (time, location, etc.)';

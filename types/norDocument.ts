/**
 * Notice of Race (NOR) Document Types
 *
 * Types for comprehensive NOR information capture and storage
 */

// =============================================================================
// NOR-Specific Types
// =============================================================================

export interface NORAmendment {
  url?: string;
  date: string;
  description: string;
  version?: string;
}

export interface GoverningRules {
  racing_rules_system?: string; // e.g., "RRS 2021-2024"
  class_rules?: string; // e.g., "Dragon Class Rules"
  prescriptions?: string; // e.g., "HKSF Prescriptions"
  additional_documents?: string[]; // Other applicable documents
}

export interface NORDocumentFields {
  // Document References
  notice_of_race_url?: string;
  sailing_instructions_url?: string;
  supplementary_si_url?: string;
  nor_amendments?: NORAmendment[];

  // Governing Rules (Section 1)
  governing_rules?: GoverningRules;

  // Eligibility & Entry (Section 2)
  eligibility_requirements?: string;
  entry_form_url?: string;
  entry_deadline?: string; // ISO timestamp
  late_entry_policy?: string;

  // Schedule Details (Section 3)
  event_series_name?: string; // e.g., "Croucher Series", "Phyloong Series"
  event_type?: string; // e.g., "Championship", "Series Race"
  racing_days?: string[]; // Array of date strings
  races_per_day?: number;
  first_warning_signal?: string; // Time string
  reserve_days?: string[]; // Array of date strings

  // Course Information (Section 4)
  course_attachment_reference?: string; // e.g., "SSI Attachment A"
  course_area_designation?: string; // e.g., "Port Shelter", "Clearwater Bay"
  potential_courses?: string[];
  course_selection_criteria?: string;
  course_diagram_url?: string;

  // Scoring System (Section 5)
  scoring_system?: string;
  series_races_required?: number;
  discards_policy?: string;

  // Safety (Section 6)
  safety_requirements?: string;
  retirement_notification_requirements?: string;

  // Insurance (Section 8)
  minimum_insurance_coverage?: number;
  insurance_policy_reference?: string;

  // Prizes (Section 9)
  prizes_description?: string;
  prize_presentation_details?: string;
}

// Extended race type that includes all NOR fields
export interface RaceWithNOR extends NORDocumentFields {
  id: string;
  user_id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  venue?: string;
  description?: string;

  // Timing & Sequence (from existing schema)
  warning_signal_time?: string;
  warning_signal_type?: string;
  preparatory_signal_minutes?: number;
  class_interval_minutes?: number;
  total_starts?: number;
  start_sequence_details?: any;
  planned_finish_time?: string;
  time_limit_minutes?: number;

  // Communications & Control
  vhf_channel?: string;
  vhf_backup_channel?: string;
  safety_channel?: string;
  rc_boat_name?: string;
  rc_boat_position?: string;
  mark_boat_positions?: any;
  race_officer?: string;
  protest_committee?: string;

  // Start Area
  start_area_name?: string;
  start_area_description?: string;
  start_line_length_meters?: number;

  // Rules & Penalties
  penalty_system?: string;
  penalty_details?: string;
  special_rules?: string[];

  // Class & Fleet
  class_divisions?: any[];
  expected_fleet_size?: number;

  // Weather & Conditions
  expected_wind_direction?: number;
  expected_wind_speed_min?: number;
  expected_wind_speed_max?: number;
  expected_conditions?: string;
  tide_at_start?: string;

  // Tactical Notes
  venue_specific_notes?: string;
  favored_side?: string;
  layline_strategy?: string;
  start_strategy?: string;

  // Registration & Logistics
  registration_deadline?: string;
  entry_fee_amount?: number;
  entry_fee_currency?: string;
  check_in_time?: string;
  skipper_briefing_time?: string;

  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

// Helper type for NOR extraction from documents
export interface NORExtractionResult {
  confidence: number;
  extracted_fields: Partial<NORDocumentFields>;
  source_document_type: 'NOR' | 'SI' | 'SSI' | 'Amendment' | 'other';
  extraction_notes?: string[];
  missing_fields?: string[];
}

/**
 * Measurement types — structured data extracted from AI conversations
 *
 * These are interest-generic: fitness uses ExerciseMeasurement + HealthMeasurement,
 * sailing uses PerformanceMeasurement, etc. Nutrition has its own dedicated system
 * (see types/nutrition.ts).
 */

// ---------------------------------------------------------------------------
// Measurement category discriminator
// ---------------------------------------------------------------------------

export type MeasurementCategory = 'exercise' | 'health' | 'performance';

// ---------------------------------------------------------------------------
// Exercise measurement (strength, cardio, HIIT, sport)
// ---------------------------------------------------------------------------

export interface ExerciseMeasurement {
  category: 'exercise';
  exercise_name: string;
  sets?: number;
  reps?: number;
  weight_value?: number;
  weight_unit?: 'lbs' | 'kg';
  duration_seconds?: number;
  distance_value?: number;
  distance_unit?: 'miles' | 'km' | 'meters' | 'yards';
  pace?: string; // e.g. "8:30/mi"
  rpe?: number; // 1-10 rate of perceived exertion
  rest_seconds?: number;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Health metric (body weight, blood pressure, sleep, etc.)
// ---------------------------------------------------------------------------

export type HealthMetricType =
  | 'body_weight'
  | 'blood_pressure'
  | 'resting_hr'
  | 'sleep_hours'
  | 'sleep_quality'
  | 'body_fat_pct'
  | 'vo2_max'
  | 'custom';

export interface HealthMeasurement {
  category: 'health';
  metric_type: HealthMetricType;
  metric_name?: string; // for custom type
  value: number;
  secondary_value?: number; // e.g. diastolic for blood pressure
  unit?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Performance metric (generic, for any interest)
// ---------------------------------------------------------------------------

export interface PerformanceMeasurement {
  category: 'performance';
  metric_name: string;
  value: number;
  unit?: string;
  context?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Union type
// ---------------------------------------------------------------------------

export type Measurement =
  | ExerciseMeasurement
  | HealthMeasurement
  | PerformanceMeasurement;

// ---------------------------------------------------------------------------
// Extraction wrapper — provenance tracking for AI-extracted data
// ---------------------------------------------------------------------------

export type MeasurementSource = 'conversation' | 'manual_edit' | 'device_sync';

export interface ExtractedMeasurement {
  id: string;
  measurement: Measurement;
  confidence: number; // 0-1, how confident the AI was in extraction
  source: MeasurementSource;
  extracted_from_text?: string; // the conversation snippet that triggered extraction
  verified: boolean; // user has confirmed/edited this measurement
  timestamp: string; // ISO — when the measurement was taken/mentioned
}

// ---------------------------------------------------------------------------
// Container stored on StepActData.measurements
// ---------------------------------------------------------------------------

export interface StepMeasurements {
  extracted: ExtractedMeasurement[];
  extraction_conversation_id?: string;
  last_extracted_at?: string; // ISO timestamp
}

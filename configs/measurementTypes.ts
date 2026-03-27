/**
 * Per-interest measurement type configurations.
 *
 * Defines which measurement categories to extract from conversations
 * and provides AI extraction hints for each interest.
 */

import type { MeasurementCategory } from '@/types/measurements';

export interface MeasurementTypeConfig {
  interestSlug: string;
  categories: MeasurementCategory[];
  /** Additional prompt text guiding the AI on what to look for */
  extractionHints: string;
  /** Track personal records for exercises */
  prTrackingEnabled?: boolean;
  /** Detect progressive overload patterns */
  progressiveOverloadDetection?: boolean;
}

// ---------------------------------------------------------------------------
// Fitness
// ---------------------------------------------------------------------------

export const FITNESS_MEASUREMENT_CONFIG: MeasurementTypeConfig = {
  interestSlug: 'health-and-fitness',
  categories: ['exercise', 'health'],
  extractionHints: `Look for:
- Exercise names with sets/reps/weight (e.g. "3x5 bench at 185", "did 4 sets of 8 rows at 135")
- Running/cycling with distance/pace/time (e.g. "ran 5K in 26:30", "3 miles at 8:30 pace")
- Duration-based activities (e.g. "30 min yoga", "45 min spin class")
- RPE/effort mentions (e.g. "felt heavy", "RPE 8", "easy day")
- Body weight mentions (e.g. "weighed in at 182")
- Sleep mentions (e.g. "slept 6 hours", "terrible sleep last night")
- Blood pressure, heart rate, or other health metrics
- Rest periods between sets`,
  prTrackingEnabled: true,
  progressiveOverloadDetection: true,
};

// ---------------------------------------------------------------------------
// Sailing
// ---------------------------------------------------------------------------

export const SAILING_MEASUREMENT_CONFIG: MeasurementTypeConfig = {
  interestSlug: 'sail-racing',
  categories: ['performance'],
  extractionHints: `Look for:
- Wind speed and direction (e.g. "15 knots from the south", "gusty 18-22")
- Boat speed / VMG (e.g. "hitting 6.5 knots upwind")
- Race finishing positions (e.g. "finished 3rd", "2nd in fleet")
- Tacking/gybing angles and counts
- Current and tide measurements
- Course distances`,
  prTrackingEnabled: false,
  progressiveOverloadDetection: false,
};

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

const MEASUREMENT_CONFIGS: Record<string, MeasurementTypeConfig> = {
  'health-and-fitness': FITNESS_MEASUREMENT_CONFIG,
  fitness: FITNESS_MEASUREMENT_CONFIG,
  'sail-racing': SAILING_MEASUREMENT_CONFIG,
};

/**
 * Get the measurement config for an interest slug.
 * Returns undefined for interests without measurement extraction.
 */
export function getMeasurementConfig(slug: string): MeasurementTypeConfig | undefined {
  return MEASUREMENT_CONFIGS[slug];
}

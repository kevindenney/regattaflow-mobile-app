/**
 * Step-bound nutrition types — nutrition data stored in StepActData.nutrition.
 *
 * Follows the same pattern as StepMeasurements/ExtractedMeasurement:
 * AI extracts structured food data from conversation, stores in step metadata,
 * user verifies/edits in Review tab.
 */

import type { MealType, NutritionConfidence, NutritionSource } from './nutrition';

// ---------------------------------------------------------------------------
// Single food/drink entry extracted from conversation
// ---------------------------------------------------------------------------

export interface StepNutritionEntry {
  id: string;
  meal_type?: MealType;
  description: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  water_oz?: number;
  confidence: NutritionConfidence;
  source: NutritionSource;
  extracted_from_text?: string; // conversation snippet that triggered extraction
  verified: boolean; // user has confirmed/edited
  timestamp: string; // ISO — when the meal was eaten
}

// ---------------------------------------------------------------------------
// Container stored on StepActData.nutrition
// ---------------------------------------------------------------------------

export interface StepNutrition {
  entries: StepNutritionEntry[];
  extraction_conversation_id?: string;
  last_extracted_at?: string; // ISO timestamp
}

// ---------------------------------------------------------------------------
// Aggregated nutrition from multiple steps (for Reflect/SummaryCard)
// ---------------------------------------------------------------------------

export interface StepNutritionDaySummary {
  day: string; // YYYY-MM-DD
  meal_count: number;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  total_water: number;
  entries: StepNutritionEntry[];
  source_step_ids: string[];
}

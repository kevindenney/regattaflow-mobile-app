/**
 * Nutrition tracking types — dedicated system for daily/ambient food logging
 *
 * Nutrition is NOT step-bound (unlike exercise measurements). Users eat throughout
 * the day, so nutrition has its own table (nutrition_entries) and conversation
 * context type ('nutrition').
 */

// ---------------------------------------------------------------------------
// Meal types
// ---------------------------------------------------------------------------

export type MealType =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'pre_workout'
  | 'post_workout'
  | 'other';

// ---------------------------------------------------------------------------
// Confidence and source
// ---------------------------------------------------------------------------

/** How confident the AI (or user) is in the nutritional values */
export type NutritionConfidence = 'exact' | 'estimated' | 'rough';

/** How this entry was created */
export type NutritionSource = 'conversation' | 'quick_log' | 'photo' | 'manual';

// ---------------------------------------------------------------------------
// Nutrition entry (single meal/snack)
// ---------------------------------------------------------------------------

export interface NutritionEntry {
  id: string;
  user_id: string;
  interest_id: string;
  conversation_id?: string;
  logged_at: string; // ISO timestamp — when the meal was eaten
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
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NutritionEntryCreateInput {
  user_id: string;
  interest_id: string;
  conversation_id?: string;
  logged_at?: string;
  meal_type?: MealType;
  description: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  water_oz?: number;
  confidence?: NutritionConfidence;
  source?: NutritionSource;
}

// ---------------------------------------------------------------------------
// Daily summary (computed at query time, not stored)
// ---------------------------------------------------------------------------

export interface NutritionDaySummary {
  day: string; // YYYY-MM-DD
  meal_count: number;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  total_water: number;
  entries: NutritionEntry[];
}

// ---------------------------------------------------------------------------
// Daily targets (read from manifesto weekly_cadence)
// ---------------------------------------------------------------------------

export interface NutritionTargets {
  calories_daily?: number;
  protein_daily_g?: number;
  carbs_daily_g?: number;
  fat_daily_g?: number;
  fiber_daily_g?: number;
  water_daily_oz?: number;
}

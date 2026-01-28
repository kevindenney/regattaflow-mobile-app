/**
 * Focus Intent Types
 *
 * Type definitions for the Next Race Focus feature.
 * Sailors set one focus after reviewing a race, then evaluate it after the next race.
 */

// ============================================
// Core Types
// ============================================

export type FocusIntentStatus = 'active' | 'evaluated' | 'skipped';
export type FocusIntentSource = 'ai_suggested' | 'manual';

/**
 * A focus intent set by a sailor for their next race
 */
export interface FocusIntent {
  id: string;
  sailorId: string;
  sourceRaceId: string | null;
  targetRaceId: string | null;
  focusText: string;
  phase: string | null;
  source: FocusIntentSource;
  evaluationRating: number | null;
  evaluationNotes: string | null;
  evaluatedAt: string | null;
  status: FocusIntentStatus;
  streakCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating a new focus intent
 */
export interface CreateFocusIntentInput {
  sourceRaceId: string;
  targetRaceId?: string;
  focusText: string;
  phase?: string;
  source: FocusIntentSource;
}

/**
 * Input for evaluating a focus intent
 */
export interface EvaluateFocusIntentInput {
  intentId: string;
  rating: number;
  notes?: string;
}

/**
 * An AI-suggested focus for the next race
 */
export interface FocusSuggestion {
  text: string;
  phase: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

// ============================================
// Database Row Type
// ============================================

export interface FocusIntentRow {
  id: string;
  sailor_id: string;
  source_race_id: string | null;
  target_race_id: string | null;
  focus_text: string;
  phase: string | null;
  source: string;
  evaluation_rating: number | null;
  evaluation_notes: string | null;
  evaluated_at: string | null;
  status: string;
  streak_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// Type Mapper
// ============================================

export function mapRowToFocusIntent(row: FocusIntentRow): FocusIntent {
  return {
    id: row.id,
    sailorId: row.sailor_id,
    sourceRaceId: row.source_race_id,
    targetRaceId: row.target_race_id,
    focusText: row.focus_text,
    phase: row.phase,
    source: row.source as FocusIntentSource,
    evaluationRating: row.evaluation_rating,
    evaluationNotes: row.evaluation_notes,
    evaluatedAt: row.evaluated_at,
    status: row.status as FocusIntentStatus,
    streakCount: row.streak_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

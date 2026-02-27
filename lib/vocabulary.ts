/**
 * BetterAt Vocabulary System
 *
 * Maps universal terms to interest-specific language so the entire app
 * adapts its copy to the user's chosen interest (sail-racing, nursing,
 * drawing, fitness, etc.).
 *
 * The vocabulary is stored in the `betterat_vocabulary` Supabase table and
 * fetched per-interest at runtime. A static fallback for sail-racing is
 * embedded so the app works offline or before the DB call resolves.
 */

import { supabase } from '@/services/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Universal term → interest-specific term */
export type VocabularyMap = Record<string, string>;

// ---------------------------------------------------------------------------
// Fallback (sail-racing defaults)
// ---------------------------------------------------------------------------

export const FALLBACK_VOCABULARY: VocabularyMap = {
  'Learning Event': 'Race',
  'Plan Phase': 'Race Prep',
  'Do Phase': 'On the Water',
  'Review Phase': 'Debrief',
  'Practice': 'Drill Session',
  'Institution': 'Yacht Club',
  'Coach': 'Sailing Coach',
  'Passport': 'Sailor Record',
  'Period': 'Season',
  'Milestone': 'First Win',
  'Skill': 'Tactical Skill',
  'Community': 'Venue / Class Forum',
  'Equipment': 'Boat / Sails',
};

// ---------------------------------------------------------------------------
// Per-interest fallback vocabularies (used when Supabase has no rows)
// ---------------------------------------------------------------------------

const NURSING_VOCABULARY: VocabularyMap = {
  'Learning Event': 'Clinical',
  'Plan Phase': 'Pre-Clinical',
  'Do Phase': 'On Shift',
  'Review Phase': 'Debrief',
  'Practice': 'Skills Lab',
  'Institution': 'Clinical Site',
  'Coach': 'Preceptor',
  'Passport': 'Clinical Portfolio',
  'Period': 'Rotation',
  'Milestone': 'Competency',
  'Skill': 'Clinical Skill',
  'Community': 'Forum',
  'Equipment': 'Clinical Gear',
};

const DRAWING_VOCABULARY: VocabularyMap = {
  'Learning Event': 'Session',
  'Plan Phase': 'Planning',
  'Do Phase': 'In Session',
  'Review Phase': 'Critique',
  'Practice': 'Study Sketch',
  'Institution': 'Studio',
  'Coach': 'Instructor',
  'Passport': 'Portfolio',
  'Period': 'Series',
  'Milestone': 'Portfolio Piece',
  'Skill': 'Technique',
  'Community': 'Critique Group',
  'Equipment': 'Medium & Tools',
};

const FITNESS_VOCABULARY: VocabularyMap = {
  'Learning Event': 'Workout',
  'Plan Phase': 'Pre-Workout',
  'Do Phase': 'Training',
  'Review Phase': 'Recovery',
  'Practice': 'Drill',
  'Institution': 'Gym',
  'Coach': 'Trainer',
  'Passport': 'Training Log',
  'Period': 'Training Block',
  'Milestone': 'PR',
  'Skill': 'Movement',
  'Community': 'Training Group',
  'Equipment': 'Gym Equipment',
};

/** Map of interest slug → client-side fallback vocabulary */
export const INTEREST_FALLBACK_VOCABULARIES: Record<string, VocabularyMap> = {
  'sail-racing': FALLBACK_VOCABULARY,
  nursing: NURSING_VOCABULARY,
  drawing: DRAWING_VOCABULARY,
  fitness: FITNESS_VOCABULARY,
};

/**
 * Get the fallback vocabulary for a given interest slug.
 * Returns the sailing fallback for unknown interests.
 */
export function getFallbackVocabulary(interestSlug?: string | null): VocabularyMap {
  if (!interestSlug) return FALLBACK_VOCABULARY;
  return INTEREST_FALLBACK_VOCABULARIES[interestSlug] ?? FALLBACK_VOCABULARY;
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

/**
 * Fetch the vocabulary mapping for a given interest from Supabase.
 *
 * Returns a `VocabularyMap` keyed by `universal_term` with values of
 * `interest_term`. Falls back to `FALLBACK_VOCABULARY` when the query
 * fails or returns no rows.
 */
export async function fetchVocabulary(interestId: string, interestSlug?: string): Promise<VocabularyMap> {
  const fallback = getFallbackVocabulary(interestSlug);
  try {
    const { data, error } = await supabase
      .from('betterat_vocabulary')
      .select('universal_term, interest_term')
      .eq('interest_id', interestId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('[vocabulary] Supabase query failed, using fallback:', error.message);
      return fallback;
    }

    if (!data || data.length === 0) {
      console.warn('[vocabulary] No rows returned for interest', interestId, '– using fallback');
      return fallback;
    }

    const map: VocabularyMap = {};
    for (const row of data) {
      map[row.universal_term] = row.interest_term;
    }
    return map;
  } catch (err) {
    console.warn('[vocabulary] Unexpected error, using fallback:', err);
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Lookup helper
// ---------------------------------------------------------------------------

/**
 * Translate a universal term into its interest-specific equivalent.
 *
 * Returns the mapped term when found, or the original `term` unchanged so
 * the UI never renders an empty string.
 *
 * @example
 * vocab('Learning Event', vocabulary) // => "Race" (sail-racing)
 * vocab('Learning Event', vocabulary) // => "Clinical Shift" (nursing)
 */
export function vocab(term: string, vocabulary: VocabularyMap): string {
  return vocabulary[term] ?? term;
}

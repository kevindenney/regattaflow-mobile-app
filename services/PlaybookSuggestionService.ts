/**
 * PlaybookSuggestionService — accept / edit / reject handlers for
 * `playbook_suggestions` rows.
 *
 * Every AI write lands in the suggestion queue first with full `provenance`.
 * These handlers apply the suggestion to the matching downstream table:
 *
 *   concept_update      → patches target concept (forks inherited first)
 *   concept_create      → inserts a new personal concept
 *   pattern_detected    → inserts a `playbook_patterns` row
 *   weekly_review       → inserts a `playbook_reviews` row
 *   focus_suggestion    → attaches as `focus_suggestion_md` on newest review
 *   cross_interest_idea → inserts a `step_playbook_links` row for the target step
 *
 * Reject flips status without touching downstream tables. Edit writes the
 * payload back and flips to `edited` — history is preserved by leaving the
 * row in place instead of deleting.
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';
import {
  forkConcept,
  updateConcept,
  createConcept,
  getConceptById,
} from '@/services/PlaybookService';
import type {
  PlaybookSuggestionRecord,
  SuggestionStatus,
} from '@/types/playbook';

const logger = createLogger('PlaybookSuggestionService');

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

async function markStatus(
  id: string,
  status: SuggestionStatus,
  patch?: Partial<{ payload: Record<string, unknown> }>,
): Promise<void> {
  const update: Record<string, unknown> = {
    status,
    resolved_at: status === 'pending' ? null : new Date().toISOString(),
  };
  if (patch?.payload) update.payload = patch.payload;
  const { error } = await supabase
    .from('playbook_suggestions')
    .update(update)
    .eq('id', id);
  if (error) throw error;
}

export async function rejectSuggestion(suggestionId: string): Promise<void> {
  try {
    await markStatus(suggestionId, 'rejected');
  } catch (err) {
    logger.error('Failed to reject suggestion', err);
    throw err;
  }
}

export async function editSuggestion(
  suggestionId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    await markStatus(suggestionId, 'edited', { payload });
  } catch (err) {
    logger.error('Failed to edit suggestion', err);
    throw err;
  }
}

/**
 * Apply a suggestion to the downstream tables, then flip status to 'accepted'.
 * The user is the acting user — used as `updated_by` on concept writes and as
 * the user_id on inserted rows.
 */
export async function acceptSuggestion(
  userId: string,
  suggestion: PlaybookSuggestionRecord,
): Promise<void> {
  try {
    switch (suggestion.kind) {
      case 'concept_update':
        await applyConceptUpdate(userId, suggestion);
        break;
      case 'concept_create':
        await applyConceptCreate(userId, suggestion);
        break;
      case 'pattern_detected':
        await applyPatternDetected(userId, suggestion);
        break;
      case 'weekly_review':
        await applyWeeklyReview(userId, suggestion);
        break;
      case 'focus_suggestion':
        await applyFocusSuggestion(suggestion);
        break;
      case 'cross_interest_idea':
        await applyCrossInterestIdea(suggestion);
        break;
      default:
        logger.warn('Unknown suggestion kind', { kind: suggestion.kind });
    }
    await markStatus(suggestion.id, 'accepted');
  } catch (err) {
    logger.error('Failed to accept suggestion', err);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function applyConceptUpdate(
  userId: string,
  suggestion: PlaybookSuggestionRecord,
): Promise<void> {
  const payload = suggestion.payload as {
    target_concept_id?: string;
    title?: string;
    body_md?: string;
  };
  if (!payload.target_concept_id) {
    throw new Error('concept_update suggestion missing target_concept_id');
  }
  const target = await getConceptById(payload.target_concept_id);
  if (!target) throw new Error('Target concept not found');

  let conceptIdToUpdate = target.id;

  // If the target is a baseline, fork into this playbook first so personal
  // edits never mutate shared baseline rows.
  if (target.origin === 'platform_baseline' || target.origin === 'pathway_baseline') {
    const forked = await forkConcept(userId, suggestion.playbook_id, target.id);
    conceptIdToUpdate = forked.id;
  }

  await updateConcept(userId, conceptIdToUpdate, {
    title: payload.title ?? undefined,
    body_md: payload.body_md ?? undefined,
  });
}

async function applyConceptCreate(
  userId: string,
  suggestion: PlaybookSuggestionRecord,
): Promise<void> {
  const payload = suggestion.payload as {
    title?: string;
    body_md?: string;
    interest_id?: string;
  };
  if (!payload.title || !payload.interest_id) {
    throw new Error('concept_create suggestion missing title or interest_id');
  }
  await createConcept(userId, {
    playbook_id: suggestion.playbook_id,
    origin: 'personal',
    interest_id: payload.interest_id,
    slug: slugify(payload.title),
    title: payload.title,
    body_md: payload.body_md ?? '',
  });
}

async function applyPatternDetected(
  userId: string,
  suggestion: PlaybookSuggestionRecord,
): Promise<void> {
  const payload = suggestion.payload as {
    title?: string;
    body_md?: string;
    evidence?: Array<Record<string, unknown>>;
  };
  if (!payload.title) throw new Error('pattern_detected missing title');
  const { error } = await supabase.from('playbook_patterns').insert({
    playbook_id: suggestion.playbook_id,
    user_id: userId,
    title: payload.title,
    body_md: payload.body_md ?? '',
    evidence: payload.evidence ?? [],
    status: 'active',
  });
  if (error) throw error;
}

async function applyWeeklyReview(
  userId: string,
  suggestion: PlaybookSuggestionRecord,
): Promise<void> {
  const payload = suggestion.payload as {
    period_start?: string;
    period_end?: string;
    summary_md?: string;
    focus_suggestion_md?: string | null;
    updated_pages?: Array<Record<string, unknown>>;
  };
  if (!payload.period_start || !payload.period_end || !payload.summary_md) {
    throw new Error('weekly_review missing required payload fields');
  }
  const { error } = await supabase.from('playbook_reviews').insert({
    playbook_id: suggestion.playbook_id,
    user_id: userId,
    period_start: payload.period_start,
    period_end: payload.period_end,
    summary_md: payload.summary_md,
    focus_suggestion_md: payload.focus_suggestion_md ?? null,
    updated_pages: payload.updated_pages ?? [],
  });
  if (error) throw error;
}

async function applyFocusSuggestion(
  suggestion: PlaybookSuggestionRecord,
): Promise<void> {
  const payload = suggestion.payload as { focus_md?: string };
  if (!payload.focus_md) throw new Error('focus_suggestion missing focus_md');
  // Attach to the newest review row for this playbook.
  const { data: newest, error: fetchErr } = await supabase
    .from('playbook_reviews')
    .select('id')
    .eq('playbook_id', suggestion.playbook_id)
    .order('period_end', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!newest) {
    // Nothing to attach to — silently drop. The suggestion still gets
    // flipped to accepted so it disappears from the queue.
    return;
  }
  const { error } = await supabase
    .from('playbook_reviews')
    .update({ focus_suggestion_md: payload.focus_md })
    .eq('id', newest.id);
  if (error) throw error;
}

async function applyCrossInterestIdea(
  suggestion: PlaybookSuggestionRecord,
): Promise<void> {
  const payload = suggestion.payload as {
    target_step_id?: string;
    item_type?: 'concept' | 'resource' | 'past_learning' | 'qa';
    item_id?: string;
  };
  if (!payload.target_step_id || !payload.item_type || !payload.item_id) {
    throw new Error('cross_interest_idea missing target_step_id / item_type / item_id');
  }
  const { error } = await supabase.from('step_playbook_links').insert({
    step_id: payload.target_step_id,
    item_type: payload.item_type,
    item_id: payload.item_id,
  });
  // Ignore unique-constraint collisions — the user may have already linked
  // this item manually. Surface any other error.
  if (error && error.code !== '23505') throw error;
}

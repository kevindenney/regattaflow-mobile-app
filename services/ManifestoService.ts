/**
 * ManifestoService — CRUD for user interest manifestos.
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';
import type {
  UserInterestManifesto,
  ManifestoUpdateInput,
  WeeklyCadence,
  TrainingMax,
  ManifestoGoal,
} from '@/types/manifesto';

const logger = createLogger('ManifestoService');

/**
 * Get or create a manifesto for a user + interest.
 */
export async function getOrCreateManifesto(
  userId: string,
  interestId: string,
): Promise<UserInterestManifesto> {
  if (!userId?.trim() || !interestId?.trim()) {
    throw new Error('getOrCreateManifesto requires valid userId and interestId');
  }

  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('user_interest_manifesto')
      .select('*')
      .eq('user_id', userId)
      .eq('interest_id', interestId)
      .maybeSingle();

    if (fetchErr) {
      if (fetchErr.code === '42P01' || fetchErr.message?.includes('relation')) {
        logger.warn('user_interest_manifesto table not found — migration may not be applied');
        throw new Error('Manifesto system not yet available');
      }
      throw fetchErr;
    }

    if (existing) return existing as UserInterestManifesto;

    // Auto-create empty manifesto
    const { data: created, error: createErr } = await supabase
      .from('user_interest_manifesto')
      .insert({ user_id: userId, interest_id: interestId, content: '' })
      .select()
      .single();

    if (createErr) throw createErr;
    return created as UserInterestManifesto;
  } catch (err) {
    logger.error('getOrCreateManifesto failed', err);
    throw err;
  }
}

/**
 * Get manifesto for a user + interest (returns null if not found).
 */
export async function getManifesto(
  userId: string,
  interestId: string,
): Promise<UserInterestManifesto | null> {
  try {
    const { data, error } = await supabase
      .from('user_interest_manifesto')
      .select('*')
      .eq('user_id', userId)
      .eq('interest_id', interestId)
      .maybeSingle();

    if (error) {
      if (error.code === '42P01' || error.message?.includes('relation')) return null;
      throw error;
    }

    return (data as UserInterestManifesto) ?? null;
  } catch {
    return null;
  }
}

/**
 * Update a manifesto's content and AI-extracted fields.
 */
export async function updateManifesto(
  manifestoId: string,
  updates: ManifestoUpdateInput,
): Promise<UserInterestManifesto> {
  const { data, error } = await supabase
    .from('user_interest_manifesto')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', manifestoId)
    .select()
    .single();

  if (error) throw error;
  return data as UserInterestManifesto;
}

/**
 * Parse manifesto content with AI to extract philosophies, role models, and cadence.
 * Calls the step-plan-suggest edge function.
 */
export interface ManifestoParseResult {
  philosophies: string[];
  role_models: string[];
  weekly_cadence: WeeklyCadence;
  training_maxes: Record<string, TrainingMax>;
  structured_goals: ManifestoGoal[];
  workout_split: Record<string, string[]>;
}

export async function parseManifestoWithAI(
  content: string,
  interestName: string,
): Promise<ManifestoParseResult> {
  const empty: ManifestoParseResult = {
    philosophies: [],
    role_models: [],
    weekly_cadence: {},
    training_maxes: {},
    structured_goals: [],
    workout_split: {},
  };

  if (!content.trim()) return empty;

  const systemPrompt = `You are an expert coach on the BetterAt platform. The user has written a manifesto describing their vision and approach for ${interestName}.

Extract structured data from their text. Your response must be ONLY valid JSON:

{
  "philosophies": ["Key principle or approach they follow"],
  "role_models": ["People, authors, or programs they reference"],
  "weekly_cadence": { "activity_name": frequency_per_week },
  "training_maxes": { "exercise_name": { "value": 225, "unit": "lbs", "rep_max": 1 } },
  "structured_goals": [{ "id": "uuid", "description": "Bench 225 by June", "target_metric": "bench_press", "target_value": 225, "target_unit": "lbs", "target_date": "2026-06-01", "status": "active" }],
  "workout_split": { "monday": ["chest", "triceps"], "wednesday": ["back", "biceps"] }
}

Guidelines:
- philosophies: Extract distinct principles, methodologies, or approaches (e.g., "Hero Maker approach", "progressive overload")
- role_models: Extract any named people, authors, trainers, coaches, or specific programs/books
- weekly_cadence: Extract any frequency commitments (e.g., { "lift": 4, "cardio": 3 }). Also include nutrition targets if mentioned (e.g., { "calories_daily": 2200, "protein_daily_g": 150 })
- training_maxes: Extract any mentioned personal records, maxes, or current bests (e.g., "I can bench 185 for 5 reps" → { "bench_press": { "value": 185, "unit": "lbs", "rep_max": 5 } })
- structured_goals: Extract any concrete goals with target values and dates. Generate a unique id for each.
- workout_split: Extract any weekly training split (e.g., "Monday: chest and triceps, Tuesday: back and biceps")

If a category has no data, use an empty array/object. Respond with ONLY the JSON.`;

  try {
    const { data, error } = await supabase.functions.invoke('step-plan-suggest', {
      body: { system: systemPrompt, prompt: content, max_tokens: 768 },
    });

    if (error || !data?.text) return empty;

    const cleaned = data.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return empty;

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      philosophies: Array.isArray(parsed.philosophies) ? parsed.philosophies : [],
      role_models: Array.isArray(parsed.role_models) ? parsed.role_models : [],
      weekly_cadence: typeof parsed.weekly_cadence === 'object' ? (parsed.weekly_cadence as WeeklyCadence) : {},
      training_maxes: typeof parsed.training_maxes === 'object' ? parsed.training_maxes : {},
      structured_goals: Array.isArray(parsed.structured_goals) ? parsed.structured_goals : [],
      workout_split: typeof parsed.workout_split === 'object' ? parsed.workout_split : {},
    };
  } catch (err) {
    logger.error('parseManifestoWithAI failed', err);
    return empty;
  }
}

/**
 * Update manifesto training maxes from measurement extraction.
 * Detects new PRs and updates the manifesto automatically.
 */
export async function updateManifestoFromMeasurements(
  userId: string,
  interestId: string,
  exercisePRs: Record<string, { value: number; unit: string; date: string }>,
): Promise<void> {
  try {
    const manifesto = await getManifesto(userId, interestId);
    if (!manifesto) return;

    const existingMaxes = manifesto.training_maxes ?? {};
    let updated = false;

    const newMaxes = { ...existingMaxes };
    for (const [exercise, pr] of Object.entries(exercisePRs)) {
      const existing = existingMaxes[exercise];
      if (!existing || pr.value > existing.value) {
        newMaxes[exercise] = {
          value: pr.value,
          unit: pr.unit as 'lbs' | 'kg',
          date_achieved: pr.date,
          rep_max: 0, // unknown from measurement extraction
        };
        updated = true;
      }
    }

    if (updated) {
      await updateManifesto(manifesto.id, { training_maxes: newMaxes });
      logger.info(`Updated training maxes for manifesto ${manifesto.id}`);
    }
  } catch (err) {
    logger.error('updateManifestoFromMeasurements failed', err);
  }
}

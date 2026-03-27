/**
 * NutritionExtractionService — AI-powered food/drink extraction from conversation.
 *
 * Two modes:
 * - extractNutritionToStep(): stores entries in step metadata (primary path)
 * - extractNutritionFromMessage(): stores entries in nutrition_entries table (legacy/ambient)
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';
import { updateStepMetadata } from '@/services/TimelineStepService';
import { createNutritionEntry } from '@/services/NutritionService';
import type { NutritionEntry, NutritionEntryCreateInput, MealType } from '@/types/nutrition';
import type { StepNutritionEntry, StepNutrition } from '@/types/step-nutrition';
import type { AIConversation } from '@/types/manifesto';

const logger = createLogger('NutritionExtraction');

// Shared system prompt for nutrition extraction
const NUTRITION_EXTRACTION_PROMPT = `You are a nutrition extraction system. Analyze this text and extract any food or drink mentions with estimated nutritional information.

Your response must be ONLY a valid JSON array:
[{
  "meal_type": "breakfast|lunch|dinner|snack|pre_workout|post_workout|other",
  "description": "chicken breast with rice and broccoli",
  "calories": 500,
  "protein_g": 45,
  "carbs_g": 50,
  "fat_g": 10,
  "fiber_g": 5,
  "water_oz": null,
  "confidence": "exact|estimated|rough",
  "logged_at": null
}]

Guidelines:
- Extract ONLY food/drink mentions, not exercise or other data
- If the user provides specific numbers ("500 cal, 40g protein"), use them (confidence: "exact")
- If the user describes food without numbers ("chicken and rice for lunch"), estimate macros (confidence: "estimated")
- If the mention is vague ("ate a big lunch"), provide rough estimates (confidence: "rough")
- For water/drinks: extract water_oz when applicable
- Set meal_type based on context clues (time of day, "for breakfast", "pre-workout shake")
- Set logged_at only if the user specifies a time, otherwise leave null (will default to now)
- Return empty array [] if no food/drink is mentioned
- Be reasonable with estimates — use standard portion sizes`;

// Quick pre-filter: skip text that probably doesn't mention food
const FOOD_KEYWORDS = /\b(ate|eat|eating|had|lunch|dinner|breakfast|snack|shake|protein|calories|cal|meal|food|drank|water|coffee|chicken|rice|eggs|oats|salad|sandwich|burger|pizza|fruit|veggies|broccoli|steak)\b/i;

// ---------------------------------------------------------------------------
// Step-bound extraction (primary path)
// ---------------------------------------------------------------------------

/**
 * Extract nutrition data from a completed conversation and store in step metadata.
 * Runs async after conversation completion — does not block UI.
 */
export async function extractNutritionToStep(
  userId: string,
  interestId: string,
  stepId: string,
  conversation: AIConversation,
): Promise<StepNutritionEntry[]> {
  const messagesBlock = conversation.messages
    .filter((m) => m.role !== 'system')
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n\n');

  if (!messagesBlock.trim() || !FOOD_KEYWORDS.test(messagesBlock)) return [];

  try {
    const { data, error } = await supabase.functions.invoke('step-plan-suggest', {
      body: { system: NUTRITION_EXTRACTION_PROMPT, prompt: messagesBlock, max_tokens: 2048 },
    });

    if (error || !data?.text) return [];

    const cleaned = data.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]) as {
      meal_type?: MealType;
      description: string;
      calories?: number;
      protein_g?: number;
      carbs_g?: number;
      fat_g?: number;
      fiber_g?: number;
      water_oz?: number;
      confidence?: 'exact' | 'estimated' | 'rough';
      logged_at?: string | null;
    }[];

    if (parsed.length === 0) return [];

    const now = new Date().toISOString();
    const entries: StepNutritionEntry[] = parsed.map((item, idx) => ({
      id: `${stepId}-n-${idx}-${Date.now()}`,
      meal_type: item.meal_type,
      description: item.description,
      calories: item.calories,
      protein_g: item.protein_g,
      carbs_g: item.carbs_g,
      fat_g: item.fat_g,
      fiber_g: item.fiber_g,
      water_oz: item.water_oz,
      confidence: item.confidence || 'estimated',
      source: 'conversation' as const,
      extracted_from_text: undefined,
      verified: false,
      timestamp: item.logged_at || now,
    }));

    // Persist to step metadata
    const nutrition: StepNutrition = {
      entries,
      extraction_conversation_id: conversation.id,
      last_extracted_at: now,
    };

    await updateStepMetadata(stepId, { act: { nutrition } }).catch(
      (err) => logger.error('Failed to persist nutrition to step', err),
    );

    logger.info(`Extracted ${entries.length} nutrition entries to step ${stepId}`);
    return entries;
  } catch (err) {
    logger.error('extractNutritionToStep failed', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Table-bound extraction (legacy/ambient)
// ---------------------------------------------------------------------------

export interface ExtractionResult {
  entries: NutritionEntry[];
  summary: string; // human-readable confirmation, e.g. "Logged 500 cal, 40g protein for lunch"
}

/**
 * Extract nutrition data from a single user message and create entries.
 * Called after each user message in a nutrition conversation.
 *
 * Returns created entries + a summary string for inline chat confirmation.
 */
export async function extractNutritionFromMessage(
  userId: string,
  interestId: string,
  conversationId: string,
  messageText: string,
): Promise<ExtractionResult> {
  try {
    const { data, error } = await supabase.functions.invoke('step-plan-suggest', {
      body: { system: NUTRITION_EXTRACTION_PROMPT, prompt: messageText, max_tokens: 2048 },
    });

    if (error || !data?.text) return { entries: [], summary: '' };

    const cleaned = data.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return { entries: [], summary: '' };

    const parsed = JSON.parse(jsonMatch[0]) as {
      meal_type?: MealType;
      description: string;
      calories?: number;
      protein_g?: number;
      carbs_g?: number;
      fat_g?: number;
      fiber_g?: number;
      water_oz?: number;
      confidence?: 'exact' | 'estimated' | 'rough';
      logged_at?: string | null;
    }[];

    if (parsed.length === 0) return { entries: [], summary: '' };

    const created: NutritionEntry[] = [];

    for (const item of parsed) {
      const input: NutritionEntryCreateInput = {
        user_id: userId,
        interest_id: interestId,
        conversation_id: conversationId,
        logged_at: item.logged_at || undefined,
        meal_type: item.meal_type,
        description: item.description,
        calories: item.calories,
        protein_g: item.protein_g,
        carbs_g: item.carbs_g,
        fat_g: item.fat_g,
        fiber_g: item.fiber_g,
        water_oz: item.water_oz,
        confidence: item.confidence || 'estimated',
        source: 'conversation',
      };

      const entry = await createNutritionEntry(input);
      if (entry) created.push(entry);
    }

    // Build confirmation summary
    const summary = buildConfirmationSummary(created);
    logger.info(`Extracted ${created.length} nutrition entries from message`);

    return { entries: created, summary };
  } catch (err) {
    logger.error('extractNutritionFromMessage failed', err);
    return { entries: [], summary: '' };
  }
}

/**
 * Extract nutrition mentions from a training conversation message (ambient capture).
 * Lower priority than dedicated nutrition chat — only fires for explicit food mentions.
 */
export async function extractAmbientNutrition(
  userId: string,
  interestId: string,
  messageText: string,
): Promise<NutritionEntry[]> {
  if (!FOOD_KEYWORDS.test(messageText)) return [];

  const result = await extractNutritionFromMessage(userId, interestId, '', messageText);
  return result.entries;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildConfirmationSummary(entries: NutritionEntry[]): string {
  if (entries.length === 0) return '';

  const parts = entries.map((e) => {
    const macros: string[] = [];
    if (e.calories) macros.push(`${e.calories} cal`);
    if (e.protein_g) macros.push(`${Math.round(e.protein_g)}g protein`);
    const mealLabel = e.meal_type ? ` for ${e.meal_type.replace('_', '-')}` : '';
    return `${e.description}${mealLabel}${macros.length ? ` — ${macros.join(', ')}` : ''}`;
  });

  return `Logged: ${parts.join('; ')}`;
}

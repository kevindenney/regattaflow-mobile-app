/**
 * MeasurementExtractionService — extracts structured measurements from
 * AI conversations. Runs async after conversation completion (like insight
 * extraction). Persists measurements to step metadata.
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';
import { updateStepMetadata } from '@/services/TimelineStepService';
import { getMeasurementConfig } from '@/configs/measurementTypes';
import { updateManifestoFromMeasurements } from '@/services/ManifestoService';
import type { AIConversation } from '@/types/manifesto';
import type {
  ExtractedMeasurement,
  Measurement,
  MeasurementCategory,
} from '@/types/measurements';

const logger = createLogger('MeasurementExtraction');

// ---------------------------------------------------------------------------
// Extract measurements from a completed conversation
// ---------------------------------------------------------------------------

/**
 * Extract structured measurements from a conversation transcript.
 * Persists results to the step's metadata.act.measurements.
 *
 * Call this async — it should not block UI.
 */
export async function extractMeasurements(
  userId: string,
  interestId: string,
  stepId: string,
  conversation: AIConversation,
  interestSlug: string,
): Promise<ExtractedMeasurement[]> {
  const config = getMeasurementConfig(interestSlug);
  if (!config) return [];

  const messagesBlock = conversation.messages
    .filter((m) => m.role !== 'system')
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n\n');

  if (!messagesBlock.trim()) return [];

  const categoryDescriptions = buildCategoryDescriptions(config.categories);

  const systemPrompt = `You are a measurement extraction system. Analyze this training conversation and extract structured quantitative data.

INTEREST: ${interestSlug}
MEASUREMENT CATEGORIES: ${config.categories.join(', ')}

${categoryDescriptions}

EXTRACTION HINTS:
${config.extractionHints}

Your response must be ONLY a valid JSON array:
[{
  "measurement": {
    "category": "${config.categories[0]}",
    ...fields specific to the category
  },
  "confidence": 0.1-1.0,
  "extracted_from_text": "the exact quote or paraphrase that produced this measurement",
  "timestamp": "ISO timestamp (use conversation timestamp if not specified)"
}]

Guidelines:
- Extract ONLY concrete numbers, not vague mentions ("a few sets" → skip, "3 sets" → extract)
- If weight units are ambiguous, default to lbs
- If distance units are ambiguous, default to miles
- Confidence should reflect how explicit the data was:
  - 0.9+ = direct, unambiguous statement ("I did 3x5 bench at 185")
  - 0.7-0.9 = clear but slightly inferred ("bench went well, hit 185 for my working sets" → infer sets from context)
  - 0.5-0.7 = partially inferred ("felt heavy today on bench" → can't extract weight)
- Include the source text snippet for each extraction
- Return empty array [] if no quantitative data is mentioned`;

  try {
    const { data, error } = await supabase.functions.invoke('step-plan-suggest', {
      body: { system: systemPrompt, prompt: messagesBlock, max_tokens: 1024 },
    });

    if (error || !data?.text) return [];

    const cleaned = data.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]) as {
      measurement: Measurement;
      confidence: number;
      extracted_from_text?: string;
      timestamp?: string;
    }[];

    const now = new Date().toISOString();
    const extracted: ExtractedMeasurement[] = parsed.map((item, idx) => ({
      id: `${stepId}-m-${idx}-${Date.now()}`,
      measurement: item.measurement,
      confidence: Math.min(1, Math.max(0.1, item.confidence)),
      source: 'conversation' as const,
      extracted_from_text: item.extracted_from_text,
      verified: false,
      timestamp: item.timestamp || now,
    }));

    // Persist to step metadata
    if (extracted.length > 0) {
      await updateStepMetadata(stepId, {
        act: {
          measurements: {
            extracted,
            extraction_conversation_id: conversation.id,
            last_extracted_at: now,
          },
        },
      }).catch((err) => logger.error('Failed to persist measurements', err));
    }

    logger.info(`Extracted ${extracted.length} measurements from step ${stepId}`);

    // Sync exercise PRs to manifesto (async, don't block)
    if (config.prTrackingEnabled) {
      const exercisePRs: Record<string, { value: number; unit: string; date: string }> = {};
      for (const m of extracted) {
        if (m.measurement.category === 'exercise' && m.measurement.weight_value) {
          const name = m.measurement.exercise_name.toLowerCase();
          if (!exercisePRs[name] || m.measurement.weight_value > exercisePRs[name].value) {
            exercisePRs[name] = {
              value: m.measurement.weight_value,
              unit: m.measurement.weight_unit || 'lbs',
              date: m.timestamp,
            };
          }
        }
      }
      if (Object.keys(exercisePRs).length > 0) {
        updateManifestoFromMeasurements(userId, interestId, exercisePRs).catch(
          (err) => logger.error('Failed to sync PRs to manifesto', err),
        );
      }
    }

    return extracted;
  } catch (err) {
    logger.error('extractMeasurements failed', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Measurement history — aggregate from recent steps
// ---------------------------------------------------------------------------

export interface MeasurementHistorySummary {
  hasData: boolean;
  recentSessions: SessionMeasurementSummary[];
  exercisePRs: Record<string, { value: number; unit: string; date: string }>;
}

interface SessionMeasurementSummary {
  stepId: string;
  date: string;
  measurements: ExtractedMeasurement[];
}

/**
 * Get measurement history from recent completed steps for context injection.
 */
export async function getMeasurementHistory(
  userId: string,
  interestId: string,
  limit = 10,
): Promise<MeasurementHistorySummary> {
  try {
    const { data, error } = await supabase
      .from('timeline_steps')
      .select('id, metadata, completed_at, starts_at')
      .eq('user_id', userId)
      .eq('interest_id', interestId)
      .in('status', ['completed', 'in_progress'])
      .order('completed_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error || !data) return { hasData: false, recentSessions: [], exercisePRs: {} };

    const sessions: SessionMeasurementSummary[] = [];
    const exercisePRs: Record<string, { value: number; unit: string; date: string }> = {};

    for (const step of data) {
      const metadata = step.metadata as Record<string, any> | null;
      const measurements = metadata?.act?.measurements?.extracted as ExtractedMeasurement[] | undefined;

      if (!measurements?.length) continue;

      const date = step.completed_at || step.starts_at || '';
      sessions.push({ stepId: step.id, date, measurements });

      // Track exercise PRs (highest weight for each exercise)
      for (const m of measurements) {
        if (m.measurement.category === 'exercise' && m.measurement.weight_value) {
          const name = m.measurement.exercise_name.toLowerCase();
          const current = exercisePRs[name];
          if (!current || m.measurement.weight_value > current.value) {
            exercisePRs[name] = {
              value: m.measurement.weight_value,
              unit: m.measurement.weight_unit || 'lbs',
              date,
            };
          }
        }
      }
    }

    return {
      hasData: sessions.length > 0,
      recentSessions: sessions,
      exercisePRs,
    };
  } catch (err) {
    logger.error('getMeasurementHistory failed', err);
    return { hasData: false, recentSessions: [], exercisePRs: {} };
  }
}

// ---------------------------------------------------------------------------
// Format for AI prompt injection
// ---------------------------------------------------------------------------

/**
 * Format measurement history into a text block for AI system prompts.
 */
export function formatMeasurementsForPrompt(history: MeasurementHistorySummary): string {
  if (!history.hasData) return '';

  const lines: string[] = ['RECENT TRAINING DATA:'];

  // Recent sessions (last 5 with data)
  const recent = history.recentSessions.slice(0, 5);
  if (recent.length > 0) {
    lines.push('Last sessions:');
    for (const session of recent) {
      const dateStr = session.date ? new Date(session.date).toLocaleDateString() : 'unknown date';
      const summaries = session.measurements
        .map((m) => formatSingleMeasurement(m.measurement))
        .filter(Boolean);
      if (summaries.length > 0) {
        lines.push(`  - ${dateStr}: ${summaries.join(', ')}`);
      }
    }
  }

  // PRs
  const prEntries = Object.entries(history.exercisePRs);
  if (prEntries.length > 0) {
    lines.push(`PRs: ${prEntries.map(([name, pr]) => `${name} ${pr.value}${pr.unit}`).join(', ')}`);
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSingleMeasurement(m: Measurement): string {
  switch (m.category) {
    case 'exercise': {
      const parts: string[] = [m.exercise_name];
      if (m.weight_value) {
        const setsReps = [m.sets && `${m.sets}`, m.reps && `×${m.reps}`].filter(Boolean).join('');
        parts.push(setsReps ? `${setsReps}@${m.weight_value}${m.weight_unit || 'lbs'}` : `${m.weight_value}${m.weight_unit || 'lbs'}`);
      }
      if (m.duration_seconds) {
        const mins = Math.floor(m.duration_seconds / 60);
        const secs = m.duration_seconds % 60;
        parts.push(secs ? `${mins}:${String(secs).padStart(2, '0')}` : `${mins}min`);
      }
      if (m.distance_value) {
        parts.push(`${m.distance_value}${m.distance_unit || 'mi'}`);
      }
      return parts.join(' ');
    }
    case 'health':
      if (m.metric_type === 'blood_pressure' && m.secondary_value) {
        return `BP ${m.value}/${m.secondary_value}`;
      }
      return `${m.metric_name || m.metric_type}: ${m.value}${m.unit || ''}`;
    case 'performance':
      return `${m.metric_name}: ${m.value}${m.unit || ''}`;
    default:
      return '';
  }
}

function buildCategoryDescriptions(categories: MeasurementCategory[]): string {
  const descs: string[] = [];

  if (categories.includes('exercise')) {
    descs.push(`EXERCISE MEASUREMENT FORMAT:
{
  "category": "exercise",
  "exercise_name": "bench press",
  "sets": 3, "reps": 5,
  "weight_value": 185, "weight_unit": "lbs",
  "duration_seconds": null, "distance_value": null, "distance_unit": null,
  "pace": null, "rpe": 8, "rest_seconds": 120,
  "notes": null
}`);
  }

  if (categories.includes('health')) {
    descs.push(`HEALTH MEASUREMENT FORMAT:
{
  "category": "health",
  "metric_type": "body_weight|blood_pressure|resting_hr|sleep_hours|sleep_quality|body_fat_pct|vo2_max|custom",
  "metric_name": null,
  "value": 182, "secondary_value": null,
  "unit": "lbs",
  "notes": null
}`);
  }

  if (categories.includes('performance')) {
    descs.push(`PERFORMANCE MEASUREMENT FORMAT:
{
  "category": "performance",
  "metric_name": "wind_speed",
  "value": 15, "unit": "knots",
  "context": "upwind leg",
  "notes": null
}`);
  }

  return descs.join('\n\n');
}

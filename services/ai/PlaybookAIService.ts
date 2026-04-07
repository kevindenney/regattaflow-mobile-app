/**
 * PlaybookAIService — thin client wrapper around the 6 playbook-* Gemini
 * edge functions. Every method invokes the corresponding function through
 * `invokeAIEdgeFunction` (60s timeout, auth token propagation) and returns
 * the parsed response.
 *
 * The edge functions themselves handle all context gathering; this service
 * just forwards IDs. Context-gathering parallelism lives server-side.
 */

import { invokeAIEdgeFunction } from './invokeAIEdgeFunction';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('PlaybookAIService');

export interface SuggestionsCreatedResponse {
  suggestions_created: number;
  reason?: string;
  error?: string;
}

export interface IngestInboxResponse {
  ingested: number;
  failed: number;
  suggestions_created: number;
  error?: string;
}

export interface RaceConditionsBriefResponse {
  brief_md: string;
  key_points: string[];
  error?: string;
}

export interface RaceConditionsBriefInput {
  interest_id: string;
  weather: {
    wind_speed_kt?: number;
    wind_direction?: string;
    gusts_kt?: number;
    wave_height_m?: number;
    temperature_c?: number;
  };
  tide?: {
    state?: string;
    height_m?: number;
    current_speed_kt?: number;
    current_direction?: string;
  };
  race_title?: string;
  boat_class?: string;
}

export interface PlaybookQASource {
  type: 'concept' | 'resource' | 'debrief';
  id: string;
  label: string;
}

export interface PlaybookQAConceptUpdate {
  concept_id: string;
  title: string;
  new_insight: string;
}

export interface PlaybookQAKnowledgeGap {
  topic: string;
  description: string;
}

export interface PlaybookQAResponse {
  answer_md: string;
  sources: PlaybookQASource[];
  /** Suggested concept updates from compounding Q&A loop */
  concept_updates?: PlaybookQAConceptUpdate[];
  /** Knowledge gaps detected from the question */
  knowledge_gaps?: PlaybookQAKnowledgeGap[];
  error?: string;
}

async function invoke<T>(
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await invokeAIEdgeFunction<T>(name, { body });
  if (error || !data) {
    logger.error(`${name} failed`, error);
    throw new Error(error?.message ?? `${name} failed`);
  }
  return data;
}

export class PlaybookAIService {
  /** Fire after a timeline_steps debrief save. */
  static ingestDebrief(stepId: string): Promise<SuggestionsCreatedResponse> {
    return invoke('playbook-ingest-debrief', { step_id: stepId });
  }

  /** "Ingest now" button on the Raw Inbox card. */
  static ingestInbox(playbookId: string): Promise<IngestInboxResponse> {
    return invoke('playbook-ingest-inbox', { playbook_id: playbookId });
  }

  /** "Generate weekly review" button (or on-open auto-trigger). */
  static generateWeeklyReview(
    playbookId: string,
    periodStart?: string,
    periodEnd?: string,
  ): Promise<SuggestionsCreatedResponse> {
    return invoke('playbook-weekly-review', {
      playbook_id: playbookId,
      period_start: periodStart,
      period_end: periodEnd,
    });
  }

  /** "Detect patterns" button. */
  static detectPatterns(
    playbookId: string,
    lookbackDays?: number,
  ): Promise<SuggestionsCreatedResponse> {
    return invoke('playbook-pattern-detect', {
      playbook_id: playbookId,
      lookback_days: lookbackDays,
    });
  }

  /** Ask-your-Playbook input. Returns the answer synchronously. */
  static ask(playbookId: string, question: string): Promise<PlaybookQAResponse> {
    return invoke('playbook-qa', { playbook_id: playbookId, question });
  }

  /** Cross-interest suggestions for a newly created/edited step. */
  static crossInterest(stepId: string): Promise<SuggestionsCreatedResponse> {
    return invoke('playbook-cross-interest', { step_id: stepId });
  }

  /** Generate a personalized race conditions brief using weather + playbook concepts. */
  static raceConditionsBrief(
    input: RaceConditionsBriefInput,
  ): Promise<RaceConditionsBriefResponse> {
    return invoke('race-conditions-brief', input as unknown as Record<string, unknown>);
  }
}

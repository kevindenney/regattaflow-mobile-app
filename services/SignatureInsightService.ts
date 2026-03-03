import { supabase } from './supabase';
import { logger } from '@/lib/utils/logger';

export type SignatureInsightOutcome = 'pending' | 'accepted' | 'edited' | 'dismissed';

export type SignatureInsightEvent = {
  id: string;
  user_id: string;
  organization_id: string | null;
  interest_id: string;
  race_event_id: string | null;
  checklist_item_id: string | null;
  ai_analysis_id: string | null;
  source_kind: string;
  source_window_start: string | null;
  source_window_end: string | null;
  insight_text: string;
  principle_text: string;
  evidence_text: string;
  confidence_score: number | null;
  outcome: SignatureInsightOutcome;
  edited_principle_text: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  resolved_at: string | null;
};

export type UserPrincipleMemory = {
  id: string;
  user_id: string;
  organization_id: string | null;
  interest_id: string;
  principle_text: string;
  evidence_refs: unknown[];
  confidence_score: number | null;
  times_reinforced: number;
  times_challenged: number;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
};

export class SignatureInsightService {
  async logSignatureInsightEvent(input: {
    userId: string;
    interestId: string;
    insightText: string;
    principleText: string;
    evidenceText: string;
    organizationId?: string | null;
    raceEventId?: string | null;
    checklistItemId?: string | null;
    aiAnalysisId?: string | null;
    sourceKind?: string;
    sourceWindowStart?: string | null;
    sourceWindowEnd?: string | null;
    confidenceScore?: number | null;
    metadata?: Record<string, unknown>;
  }): Promise<SignatureInsightEvent> {
    try {
      const payload = {
        user_id: input.userId,
        organization_id: input.organizationId ?? null,
        interest_id: String(input.interestId || '').trim(),
        race_event_id: input.raceEventId ?? null,
        checklist_item_id: input.checklistItemId ?? null,
        ai_analysis_id: input.aiAnalysisId ?? null,
        source_kind: String(input.sourceKind || 'timeline_step_completion').trim() || 'timeline_step_completion',
        source_window_start: input.sourceWindowStart ?? null,
        source_window_end: input.sourceWindowEnd ?? null,
        insight_text: String(input.insightText || '').trim(),
        principle_text: String(input.principleText || '').trim(),
        evidence_text: String(input.evidenceText || '').trim(),
        confidence_score: typeof input.confidenceScore === 'number' ? input.confidenceScore : null,
        metadata: input.metadata || {},
      };

      const { data, error } = await supabase
        .from('signature_insight_events')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;
      return data as SignatureInsightEvent;
    } catch (error) {
      logger.error('[SignatureInsightService] Failed to log signature insight event', { error, input });
      throw error;
    }
  }

  async listPrincipleMemory(userId: string, interestId: string, limit = 20): Promise<UserPrincipleMemory[]> {
    try {
      const normalizedLimit = Math.max(1, Math.min(200, Math.floor(limit)));
      const { data, error } = await supabase
        .from('user_principle_memory')
        .select('*')
        .eq('user_id', userId)
        .eq('interest_id', interestId)
        .order('last_seen_at', { ascending: false })
        .limit(normalizedLimit);

      if (error) throw error;
      return (data || []) as UserPrincipleMemory[];
    } catch (error) {
      logger.error('[SignatureInsightService] Failed to list principle memory', { error, userId, interestId });
      throw error;
    }
  }

  async listSignatureInsightEvents(userId: string, interestId: string, limit = 20): Promise<SignatureInsightEvent[]> {
    try {
      const normalizedLimit = Math.max(1, Math.min(200, Math.floor(limit)));
      const { data, error } = await supabase
        .from('signature_insight_events')
        .select('*')
        .eq('user_id', userId)
        .eq('interest_id', interestId)
        .order('created_at', { ascending: false })
        .limit(normalizedLimit);

      if (error) throw error;
      return (data || []) as SignatureInsightEvent[];
    } catch (error) {
      logger.error('[SignatureInsightService] Failed to list signature insight events', { error, userId, interestId });
      throw error;
    }
  }

  async applySignatureInsightOutcome(input: {
    eventId: string;
    outcome: Exclude<SignatureInsightOutcome, 'pending'>;
    editedPrincipleText?: string | null;
  }): Promise<SignatureInsightEvent> {
    try {
      const { data, error } = await supabase.rpc('apply_signature_insight_outcome_v1', {
        p_event_id: input.eventId,
        p_outcome: input.outcome,
        p_edited_principle_text: input.editedPrincipleText ?? null,
      });

      if (error) throw error;
      return data as SignatureInsightEvent;
    } catch (error) {
      logger.error('[SignatureInsightService] Failed to apply signature insight outcome', {
        error,
        eventId: input.eventId,
        outcome: input.outcome,
      });
      throw error;
    }
  }
}

export const signatureInsightService = new SignatureInsightService();

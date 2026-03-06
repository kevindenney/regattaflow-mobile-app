import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ClinicalReasoningEvaluationService');

export type ClinicalReasoningScore = {
  competencyId: string;
  level: string;
  strengths: string[];
  improvements: string[];
};

export type ClinicalReasoningEvaluationResult = {
  scores: ClinicalReasoningScore[];
  nextAction: string;
  suggestedCompetencyIds?: string[];
};

export async function evaluateClinicalReasoning(input: {
  artifactId: string;
  competencyIds: string[];
}): Promise<ClinicalReasoningEvaluationResult> {
  const { data, error } = await supabase.functions.invoke('clinical-reasoning-evaluate', {
    body: {
      artifactId: input.artifactId,
      competencyIds: input.competencyIds,
    },
  });

  if (error) {
    logger.error('[evaluateClinicalReasoning] Edge function call failed', { error, input });
    throw error;
  }

  const raw = (data || {}) as any;
  const result = raw.result ?? raw;

  const scores = Array.isArray(result?.scores)
    ? result.scores
      .filter((item: any) => item && typeof item.competencyId === 'string')
      .map((item: any) => ({
        competencyId: item.competencyId,
        level: typeof item.level === 'string' ? item.level : 'unknown',
        strengths: Array.isArray(item.strengths)
          ? item.strengths.filter((entry: any) => typeof entry === 'string')
          : [],
        improvements: Array.isArray(item.improvements)
          ? item.improvements.filter((entry: any) => typeof entry === 'string')
          : [],
      }))
    : [];

  return {
    scores,
    nextAction: typeof result?.nextAction === 'string' ? result.nextAction : 'No next action provided.',
    suggestedCompetencyIds: Array.isArray(result?.suggestedCompetencyIds)
      ? result.suggestedCompetencyIds.filter((item: any) => typeof item === 'string')
      : undefined,
  };
}

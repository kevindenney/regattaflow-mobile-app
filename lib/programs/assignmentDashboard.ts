import type { AssessmentRecord } from '@/services/ProgramService';

export type AssignmentPendingSummary = {
  pendingByEvaluatorId: Record<string, number>;
  totalPending: number;
};

export function buildAssignmentPendingSummary(
  assessments: readonly AssessmentRecord[]
): AssignmentPendingSummary {
  const pendingByEvaluatorId: Record<string, number> = {};
  let totalPending = 0;

  for (const row of assessments) {
    if (row.status === 'finalized') continue;
    if (!row.evaluator_id) continue;
    pendingByEvaluatorId[row.evaluator_id] = (pendingByEvaluatorId[row.evaluator_id] || 0) + 1;
    totalPending += 1;
  }

  return {
    pendingByEvaluatorId,
    totalPending,
  };
}

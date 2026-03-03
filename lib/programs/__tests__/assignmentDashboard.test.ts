import { buildAssignmentPendingSummary } from '../assignmentDashboard';

describe('buildAssignmentPendingSummary', () => {
  it('counts non-finalized assessments by evaluator and total pending', () => {
    const result = buildAssignmentPendingSummary([
      {
        id: 'a1',
        organization_id: 'org',
        evaluator_id: 'coach-1',
        status: 'draft',
      },
      {
        id: 'a2',
        organization_id: 'org',
        evaluator_id: 'coach-1',
        status: 'submitted',
      },
      {
        id: 'a3',
        organization_id: 'org',
        evaluator_id: 'coach-2',
        status: 'reviewed',
      },
      {
        id: 'a4',
        organization_id: 'org',
        evaluator_id: 'coach-2',
        status: 'finalized',
      },
      {
        id: 'a5',
        organization_id: 'org',
        evaluator_id: '',
        status: 'draft',
      },
    ] as any);

    expect(result.pendingByEvaluatorId).toEqual({
      'coach-1': 2,
      'coach-2': 1,
    });
    expect(result.totalPending).toBe(3);
  });
});

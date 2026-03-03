import {
  COACH_HOME_P95_BUDGET_MS,
  profileCoachHomeStep,
  summarizeCoachHomeProfile,
} from '../coachHomeProfiling';

describe('coachHomeProfiling helpers', () => {
  it('records step duration samples', async () => {
    const samples: Array<{ step: any; durationMs: number }> = [];
    const value = await profileCoachHomeStep('core_queries', async () => 42, samples as any);

    expect(value).toBe(42);
    expect(samples).toHaveLength(1);
    expect(samples[0].step).toBe('core_queries');
    expect(samples[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it('marks budget exceeded when total duration is over threshold', () => {
    const summary = summarizeCoachHomeProfile(
      [
        { step: 'core_queries', durationMs: 300 },
        { step: 'assigned_program_preview', durationMs: 250 },
        { step: 'derive_retention_metrics', durationMs: 100 },
      ],
      COACH_HOME_P95_BUDGET_MS
    );

    expect(summary.totalMs).toBe(650);
    expect(summary.budgetExceeded).toBe(true);
    expect(summary.budgetMs).toBe(600);
  });
});

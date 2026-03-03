import {
  buildCoachSignatureInsight,
  buildCoachReminders,
  buildCoachWeeklyRecap,
  computeDailyStreak,
  countActiveDaysWithin,
} from '../retentionLoop';

describe('coach retention loop helpers', () => {
  it('computes consecutive daily streak ending today', () => {
    const now = new Date('2026-03-03T15:00:00.000Z');
    const streak = computeDailyStreak(
      [
        '2026-03-03T01:00:00.000Z',
        '2026-03-02T10:00:00.000Z',
        '2026-03-01T12:00:00.000Z',
      ],
      now
    );

    expect(streak).toBe(3);
  });

  it('counts unique active days within a rolling window', () => {
    const now = new Date('2026-03-03T15:00:00.000Z');
    const activeDays = countActiveDaysWithin(
      [
        '2026-03-03T10:00:00.000Z',
        '2026-03-03T12:00:00.000Z',
        '2026-03-01T12:00:00.000Z',
        '2026-02-20T12:00:00.000Z',
      ],
      7,
      now
    );

    expect(activeDays).toBe(2);
  });

  it('builds reminder chips for overdue, due today, and unread threads', () => {
    const reminders = buildCoachReminders({
      overdueAssessments: 2,
      dueTodayAssessments: 1,
      unreadThreads: 3,
    });

    expect(reminders).toHaveLength(3);
    expect(reminders[0].id).toBe('overdue-assessments');
    expect(reminders[0].severity).toBe('warning');
    expect(reminders[1].href).toBe('/assessments?status=all&focus=due_today');
    expect(reminders[2].href).toBe('/communications?focus=unread');
  });

  it('normalizes weekly recap fields', () => {
    const recap = buildCoachWeeklyRecap({
      completedActions: 5.8,
      pendingActions: -3,
      activeDays: 4.2,
      trendDelta: Number.NaN,
    });

    expect(recap.completedActions).toBe(5);
    expect(recap.pendingActions).toBe(0);
    expect(recap.activeDays).toBe(4);
    expect(recap.trendDelta).toBeNull();
    expect(recap.signatureInsight.skill).toBeTruthy();
    expect(recap.signatureInsight.evidence).toBeTruthy();
    expect(recap.signatureInsight.principle).toBeTruthy();
  });

  it('builds a stable signature insight from weekly recap stats', () => {
    const insight = buildCoachSignatureInsight({
      completedActions: 6,
      pendingActions: 2,
      activeDays: 5,
      trendDelta: 0.9,
    });

    expect(insight.skill).toContain('consistent execution');
    expect(insight.evidence).toContain('6');
    expect(insight.principle).toContain('Close one high-value assessment block');
  });
});

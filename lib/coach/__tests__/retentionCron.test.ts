import { buildCoachRetentionDeliveries } from '../retentionCron';

describe('buildCoachRetentionDeliveries', () => {
  it('creates reminders and weekly recap rows per evaluator', () => {
    const now = new Date('2026-03-03T15:00:00.000Z');
    const rows = [
      {
        organization_id: 'org-1',
        evaluator_id: 'user-1',
        status: 'draft',
        evidence: { due_at: '2026-03-02T10:00:00.000Z' },
        created_at: '2026-03-01T10:00:00.000Z',
      },
      {
        organization_id: 'org-1',
        evaluator_id: 'user-1',
        status: 'submitted',
        evidence: { due_at: '2026-03-03T16:00:00.000Z' },
        assessed_at: '2026-03-03T09:00:00.000Z',
        created_at: '2026-03-03T09:00:00.000Z',
      },
    ];

    const deliveries = buildCoachRetentionDeliveries(rows, now);

    expect(deliveries).toHaveLength(2);
    expect(deliveries.some((row) => row.delivery_type === 'reminders')).toBe(true);
    expect(deliveries.some((row) => row.delivery_type === 'weekly_recap')).toBe(true);
  });

  it('skips reminders when no due items are found but still emits weekly recap', () => {
    const now = new Date('2026-03-03T15:00:00.000Z');
    const rows = [
      {
        organization_id: 'org-1',
        evaluator_id: 'user-2',
        status: 'reviewed',
        assessed_at: '2026-03-02T09:00:00.000Z',
        created_at: '2026-03-02T09:00:00.000Z',
      },
    ];

    const deliveries = buildCoachRetentionDeliveries(rows, now);

    expect(deliveries).toHaveLength(1);
    expect(deliveries[0].delivery_type).toBe('weekly_recap');
  });
});

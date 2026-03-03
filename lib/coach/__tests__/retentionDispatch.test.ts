import {
  hasPendingChannel,
  isCompleteWeeklyRecapPayload,
  isFullyDispatched,
  RetentionDispatchRow,
} from '@/lib/coach/retentionDispatch';

describe('retentionDispatch helpers', () => {
  it('accepts complete weekly recap payloads', () => {
    expect(
      isCompleteWeeklyRecapPayload({
        completedActions: 5,
        pendingActions: 2,
        activeDays: 4,
        trendDelta: 1.25,
      })
    ).toBe(true);

    expect(
      isCompleteWeeklyRecapPayload({
        completedActions: 0,
        pendingActions: 0,
        activeDays: 0,
        trendDelta: null,
      })
    ).toBe(true);
  });

  it('rejects incomplete weekly recap payloads', () => {
    expect(
      isCompleteWeeklyRecapPayload({
        completedActions: 5,
        pendingActions: 2,
        trendDelta: 1.25,
      })
    ).toBe(false);

    expect(
      isCompleteWeeklyRecapPayload({
        completedActions: '5',
        pendingActions: 2,
        activeDays: 4,
        trendDelta: 1.25,
      } as any)
    ).toBe(false);
  });

  it('treats channel timestamps as idempotent gates', () => {
    const base: RetentionDispatchRow = {
      id: 'row-1',
      delivery_type: 'weekly_recap',
      payload: {},
      in_app_dispatched_at: null,
      push_dispatched_at: null,
      email_dispatched_at: null,
    };

    expect(hasPendingChannel(base, 'in_app')).toBe(true);
    expect(hasPendingChannel(base, 'push')).toBe(true);
    expect(hasPendingChannel(base, 'email')).toBe(true);

    const inAppDone: RetentionDispatchRow = {
      ...base,
      in_app_dispatched_at: '2026-03-03T14:30:00.000Z',
    };
    expect(hasPendingChannel(inAppDone, 'in_app')).toBe(false);
    expect(hasPendingChannel(inAppDone, 'push')).toBe(true);

    const pushDone: RetentionDispatchRow = {
      ...base,
      push_dispatched_at: '2026-03-03T14:31:00.000Z',
    };
    expect(hasPendingChannel(pushDone, 'push')).toBe(false);
    expect(hasPendingChannel(pushDone, 'email')).toBe(true);

    const emailDone: RetentionDispatchRow = {
      ...base,
      email_dispatched_at: '2026-03-03T14:32:00.000Z',
    };
    expect(hasPendingChannel(emailDone, 'email')).toBe(false);
    expect(hasPendingChannel(emailDone, 'in_app')).toBe(true);
  });

  it('keeps retries idempotent by channel once dispatch timestamp is set', () => {
    const firstAttempt: RetentionDispatchRow = {
      id: 'row-retry',
      delivery_type: 'reminders',
      payload: {},
      in_app_dispatched_at: '2026-03-03T14:30:00.000Z',
      push_dispatched_at: null,
      email_dispatched_at: null,
    };
    expect(hasPendingChannel(firstAttempt, 'in_app')).toBe(false);
    expect(hasPendingChannel(firstAttempt, 'push')).toBe(true);
    expect(hasPendingChannel(firstAttempt, 'email')).toBe(true);

    const secondAttempt: RetentionDispatchRow = {
      ...firstAttempt,
      push_dispatched_at: '2026-03-03T14:31:00.000Z',
    };
    expect(hasPendingChannel(secondAttempt, 'in_app')).toBe(false);
    expect(hasPendingChannel(secondAttempt, 'push')).toBe(false);
    expect(hasPendingChannel(secondAttempt, 'email')).toBe(true);

    const finalAttempt: RetentionDispatchRow = {
      ...secondAttempt,
      email_dispatched_at: '2026-03-03T14:32:00.000Z',
    };
    expect(hasPendingChannel(finalAttempt, 'in_app')).toBe(false);
    expect(hasPendingChannel(finalAttempt, 'push')).toBe(false);
    expect(hasPendingChannel(finalAttempt, 'email')).toBe(false);
    expect(isFullyDispatched(finalAttempt)).toBe(true);
  });

  it('marks delivery complete only when all channels are dispatched', () => {
    expect(
      isFullyDispatched({
        in_app_dispatched_at: '2026-03-03T14:30:00.000Z',
        push_dispatched_at: '2026-03-03T14:30:00.000Z',
        email_dispatched_at: '2026-03-03T14:30:00.000Z',
      })
    ).toBe(true);

    expect(
      isFullyDispatched({
        in_app_dispatched_at: '2026-03-03T14:30:00.000Z',
        push_dispatched_at: null,
        email_dispatched_at: '2026-03-03T14:30:00.000Z',
      })
    ).toBe(false);
  });
});

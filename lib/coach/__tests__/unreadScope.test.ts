import { resolveCoachUnreadThreadCount } from '../unreadScope';

describe('resolveCoachUnreadThreadCount', () => {
  it('scopes unread totals to assigned programs when assignments exist', () => {
    const total = resolveCoachUnreadThreadCount(
      {
        'prog-1': 2,
        'prog-2': 3,
        'prog-3': 4,
      },
      ['prog-1', 'prog-3']
    );

    expect(total).toBe(6);
  });

  it('falls back to aggregate unread totals when no assigned programs are available', () => {
    const total = resolveCoachUnreadThreadCount(
      {
        'prog-1': 2,
        'prog-2': 3,
      },
      []
    );

    expect(total).toBe(5);
  });

  it('deduplicates assigned ids and ignores invalid values', () => {
    const total = resolveCoachUnreadThreadCount(
      {
        'prog-1': 2,
      },
      ['prog-1', 'prog-1', '', '   ']
    );

    expect(total).toBe(2);
  });
});

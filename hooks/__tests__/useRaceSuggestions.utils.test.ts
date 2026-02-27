import {
  EMPTY_SUGGESTIONS,
  shouldPreservePreviousSuggestions,
} from '@/hooks/useRaceSuggestions.utils';

describe('useRaceSuggestions utils', () => {
  it('exports an empty suggestions object with zero total', () => {
    expect(EMPTY_SUGGESTIONS.total).toBe(0);
    expect(EMPTY_SUGGESTIONS.clubRaces).toEqual([]);
    expect(EMPTY_SUGGESTIONS.templates).toEqual([]);
  });

  it('preserves previous suggestions only for fast-timeout empty payload', () => {
    const previous = {
      ...EMPTY_SUGGESTIONS,
      total: 2,
      clubRaces: [
        {
          id: 'c1',
          type: 'club_event' as const,
          confidenceScore: 0.9,
          raceData: { raceName: 'Club Race' },
          reason: 'Upcoming event',
          canAddDirectly: true,
        },
      ],
    };

    const incomingEmpty = { ...EMPTY_SUGGESTIONS };
    const incomingNonEmpty = {
      ...EMPTY_SUGGESTIONS,
      total: 1,
      templates: [
        {
          id: 't1',
          type: 'template' as const,
          confidenceScore: 0.6,
          raceData: { raceName: 'Template Race' },
          reason: 'Template',
          canAddDirectly: true,
        },
      ],
    };

    expect(shouldPreservePreviousSuggestions(true, incomingEmpty, previous)).toBe(true);
    expect(shouldPreservePreviousSuggestions(false, incomingEmpty, previous)).toBe(false);
    expect(shouldPreservePreviousSuggestions(true, incomingNonEmpty, previous)).toBe(false);
    expect(shouldPreservePreviousSuggestions(true, incomingEmpty, null)).toBe(false);
  });
});

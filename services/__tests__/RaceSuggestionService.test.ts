jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    functions: {
      invoke: jest.fn(),
    },
  },
}));
jest.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));
jest.mock('../fleetService', () => ({
  fleetService: {
    getFleetsForUser: jest.fn(),
    getFleetUpcomingRaces: jest.fn(),
  },
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { raceSuggestionService } = require('../RaceSuggestionService');

describe('RaceSuggestionService.getSuggestionsForUser', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns empty suggestions instead of throwing when sources fail', async () => {
    const service = raceSuggestionService as any;

    const cacheSpy = jest
      .spyOn(service, 'getCachedSuggestions')
      .mockRejectedValue(new Error('cache unavailable'));
    const freshSpy = jest
      .spyOn(service, 'generateFreshSuggestions')
      .mockRejectedValue(new Error('generation unavailable'));

    const result = await raceSuggestionService.getSuggestionsForUser('user-1');

    expect(cacheSpy).toHaveBeenCalledTimes(2); // retry wrapper
    expect(freshSpy).toHaveBeenCalledTimes(2); // retry wrapper
    expect(result).toEqual({
      clubRaces: [],
      fleetRaces: [],
      communityRaces: [],
      catalogMatches: [],
      previousYearRaces: [],
      patterns: [],
      templates: [],
      total: 0,
    });
  });

  it('retries fresh generation once and returns recovered suggestions', async () => {
    const service = raceSuggestionService as any;

    jest.spyOn(service, 'getCachedSuggestions').mockResolvedValue({
      clubRaces: [],
      fleetRaces: [],
      communityRaces: [],
      catalogMatches: [],
      previousYearRaces: [],
      patterns: [],
      templates: [],
      total: 0,
    });

    const freshSpy = jest
      .spyOn(service, 'generateFreshSuggestions')
      .mockRejectedValueOnce(new Error('transient failure'))
      .mockResolvedValueOnce({
        clubRaces: [
          {
            id: 'club-1',
            type: 'club_event',
            confidenceScore: 0.9,
            raceData: { raceName: 'Harbor Regatta' },
            reason: 'Upcoming event at your club',
            canAddDirectly: true,
          },
        ],
        fleetRaces: [],
        communityRaces: [],
        catalogMatches: [],
        previousYearRaces: [],
        patterns: [],
        templates: [],
        total: 1,
      });

    const result = await raceSuggestionService.getSuggestionsForUser('user-2');

    expect(freshSpy).toHaveBeenCalledTimes(2);
    expect(result.total).toBe(1);
    expect(result.clubRaces[0]?.raceData?.raceName).toBe('Harbor Regatta');
  });
});

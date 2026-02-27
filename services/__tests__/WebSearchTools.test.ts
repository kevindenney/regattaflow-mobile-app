type MockResponse = {
  data?: any[];
  error?: any;
};

const responseQueues: Record<string, MockResponse[]> = {};

function queueResponse(table: string, response: MockResponse) {
  if (!responseQueues[table]) {
    responseQueues[table] = [];
  }
  responseQueues[table].push(response);
}

function popResponse(table: string): MockResponse {
  const queue = responseQueues[table] || [];
  if (queue.length === 0) {
    return { data: [], error: null };
  }
  return queue.shift() || { data: [], error: null };
}

function clearQueues() {
  Object.keys(responseQueues).forEach((key) => {
    responseQueues[key] = [];
  });
}

function createQueryBuilder(table: string) {
  const builder: any = {};

  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.ilike = jest.fn(() => builder);
  builder.in = jest.fn(() => builder);
  builder.or = jest.fn(() => builder);
  builder.gte = jest.fn(() => builder);
  builder.lte = jest.fn(() => builder);
  builder.order = jest.fn(() => builder);
  builder.limit = jest.fn(() => builder);

  builder.then = (resolve: (value: any) => void, reject?: (reason?: any) => void) => {
    const next = popResponse(table);
    return Promise.resolve({
      data: next.data || [],
      error: next.error || null,
    }).then(resolve, reject);
  };

  return builder;
}

const mockFrom = jest.fn((table: string) => createQueryBuilder(table));

jest.mock('../supabase', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
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

describe('WebSearchTools', () => {
  beforeEach(() => {
    clearQueues();
    mockFrom.mockClear();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-25T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns indexed sail-number details when external results exist', async () => {
    queueResponse('external_race_results', {
      data: [
        {
          sail_number: 'D59',
          boat_class: 'Dragon',
          owner_name: 'Alex Helm',
          yacht_club: 'Royal YC',
          fleet_name: 'Dragon Gold Fleet',
          regatta_name: 'Winter Series',
          race_date: '2026-01-10',
        },
      ],
      error: null,
    });

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createSearchSailNumberOnlineTool } = require('../agents/WebSearchTools');
    const tool = createSearchSailNumberOnlineTool();

    const result = await tool.execute({
      sail_number: 'd 59',
      class_name: 'Dragon',
    });

    expect(result.found_data).toBe(true);
    expect(result.owner_name).toBe('Alex Helm');
    expect(result.home_club).toBe('Royal YC');
    expect(result.fleet_name).toBe('Dragon Gold Fleet');
    expect(result.race_results_count).toBe(1);
    expect(result.recent_regattas).toEqual(['Winter Series']);
  });

  it('returns upcoming calendar events for class/location search', async () => {
    queueResponse('external_regattas', {
      data: [
        {
          event_name: 'Spring Cup',
          start_date: '2026-03-01',
          end_date: '2026-03-03',
          location: 'San Diego',
          source: 'class_calendar',
        },
        {
          event_name: 'Past Event',
          start_date: '2025-01-10',
          location: 'San Diego',
        },
      ],
      error: null,
    });

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createSearchRacingCalendarTool } = require('../agents/WebSearchTools');
    const tool = createSearchRacingCalendarTool();

    const result = await tool.execute({
      class_name: 'J/70',
      location: 'San Diego',
      year: 2026,
    });

    expect(result.found_calendar).toBe(true);
    expect(result.events_count).toBe(1);
    expect(result.events[0].name).toBe('Spring Cup');
  });

  it('returns fleet details across club and class lookups', async () => {
    queueResponse('yacht_clubs', {
      data: [{ id: 'club-1', name: 'Bay Yacht Club', website: 'https://club.test' }],
      error: null,
    });
    queueResponse('clubs', { data: [], error: null });
    queueResponse('boat_classes', {
      data: [{ id: 'class-1', name: 'Dragon' }],
      error: null,
    });
    queueResponse('fleets', {
      data: [
        {
          id: 'fleet-1',
          name: 'Dragon A Fleet',
          club_id: 'club-1',
          class_id: 'class-1',
          member_count: 22,
          fleet_captain: 'Skipper Lee',
        },
      ],
      error: null,
    });

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createSearchFleetOnlineTool } = require('../agents/WebSearchTools');
    const tool = createSearchFleetOnlineTool();

    const result = await tool.execute({
      class_name: 'Dragon',
      club_name: 'Bay Yacht Club',
    });

    expect(result.found_fleet).toBe(true);
    expect(result.fleet_name).toBe('Dragon A Fleet');
    expect(result.member_count).toBe(22);
    expect(result.fleet_captain).toBe('Skipper Lee');
    expect(result.website_url).toBe('https://club.test');
  });

  it('gracefully handles sail-number source failure', async () => {
    queueResponse('external_race_results', {
      data: [],
      error: { message: 'permission denied' },
    });

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createSearchSailNumberOnlineTool } = require('../agents/WebSearchTools');
    const tool = createSearchSailNumberOnlineTool();

    const result = await tool.execute({
      sail_number: 'D59',
      class_name: 'Dragon',
    });

    expect(result.found_data).toBe(false);
    expect(result.natural_language).toContain('couldn’t find strong matches');
  });
});

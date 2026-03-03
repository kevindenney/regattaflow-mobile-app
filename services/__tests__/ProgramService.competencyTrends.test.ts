const mockFrom = jest.fn();

jest.mock('../supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { programService } = require('../ProgramService');

type QueryResult<T> = {
  data: T;
  error: null;
};

function createAsyncQueryChain<T>(resultData: T) {
  const result: QueryResult<T> = {
    data: resultData,
    error: null,
  };

  const chain: any = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    in: jest.fn(() => chain),
    not: jest.fn(() => chain),
    order: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    then: (onFulfilled: (value: QueryResult<T>) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
    catch: (onRejected: (reason: unknown) => unknown) =>
      Promise.resolve(result).catch(onRejected),
  };

  return chain;
}

function getWeekStartIso(value: Date): string {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diffToMonday = (day + 6) % 7;
  date.setDate(date.getDate() - diffToMonday);
  return date.toISOString();
}

describe('ProgramService competency trend logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-02T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('computes 8-week buckets and latest-vs-previous delta correctly', async () => {
    const assessmentRows = [
      {
        competency_id: 'comp-1',
        score: 5,
        assessed_at: '2026-02-25T12:00:00.000Z',
        created_at: '2026-02-25T12:00:00.000Z',
      },
      {
        competency_id: 'comp-1',
        score: 3,
        assessed_at: '2026-02-24T12:00:00.000Z',
        created_at: '2026-02-24T12:00:00.000Z',
      },
      {
        competency_id: 'comp-1',
        score: 2,
        assessed_at: '2026-02-17T12:00:00.000Z',
        created_at: '2026-02-17T12:00:00.000Z',
      },
      {
        competency_id: 'comp-1',
        score: 1,
        assessed_at: '2025-12-01T12:00:00.000Z',
        created_at: '2025-12-01T12:00:00.000Z',
      },
    ];

    const assessmentChain = createAsyncQueryChain(assessmentRows);
    const competencyChain = createAsyncQueryChain([
      { id: 'comp-1', title: 'Clinical Judgment' },
    ]);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'assessment_records') return assessmentChain;
      if (table === 'betterat_competencies') return competencyChain;
      throw new Error(`Unexpected table: ${table}`);
    });

    const trends = await programService.listCompetencyProgressTrendsForEvaluator(
      'org-1',
      'eval-1',
      { weeks: 8, limitCompetencies: 5 }
    );

    expect(trends).toHaveLength(1);
    const trend = trends[0];
    const latestWeek = getWeekStartIso(new Date('2026-02-25T12:00:00.000Z'));
    const previousWeek = getWeekStartIso(new Date('2026-02-17T12:00:00.000Z'));

    expect(trend.competency_id).toBe('comp-1');
    expect(trend.latest_period_start).toBe(latestWeek);
    expect(trend.latest_average_score).toBe(4);
    expect(trend.previous_average_score).toBe(2);
    expect(trend.delta_from_previous).toBe(2);
    expect(trend.total_assessments).toBe(3);
    expect(trend.points).toEqual([
      {
        periodStart: previousWeek,
        averageScore: 2,
        assessmentCount: 1,
      },
      {
        periodStart: latestWeek,
        averageScore: 4,
        assessmentCount: 2,
      },
    ]);
  });

  it('orders competencies by most recent activity and applies limitCompetencies', async () => {
    const assessmentRows = [
      {
        competency_id: 'comp-new',
        score: 4,
        assessed_at: '2026-03-01T12:00:00.000Z',
        created_at: '2026-03-01T12:00:00.000Z',
      },
      {
        competency_id: 'comp-mid',
        score: 4,
        assessed_at: '2026-02-20T12:00:00.000Z',
        created_at: '2026-02-20T12:00:00.000Z',
      },
      {
        competency_id: 'comp-old',
        score: 4,
        assessed_at: '2026-02-10T12:00:00.000Z',
        created_at: '2026-02-10T12:00:00.000Z',
      },
    ];

    const assessmentChain = createAsyncQueryChain(assessmentRows);
    const competencyChain = createAsyncQueryChain([
      { id: 'comp-new', title: 'Newest' },
      { id: 'comp-mid', title: 'Middle' },
      { id: 'comp-old', title: 'Oldest' },
    ]);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'assessment_records') return assessmentChain;
      if (table === 'betterat_competencies') return competencyChain;
      throw new Error(`Unexpected table: ${table}`);
    });

    const trends = await programService.listCompetencyProgressTrendsForEvaluator(
      'org-1',
      'eval-1',
      { weeks: 8, limitCompetencies: 2 }
    );

    expect(trends).toHaveLength(2);
    expect(trends.map((row: { competency_id: string }) => row.competency_id)).toEqual([
      'comp-new',
      'comp-mid',
    ]);
  });

  it('classifies due assessments as due today vs overdue', async () => {
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);

    const dueTodayIso = new Date(startOfToday.getTime() + 12 * 60 * 60 * 1000).toISOString();
    const overdueIso = new Date(startOfToday.getTime() - 60 * 60 * 1000).toISOString();
    const futureIso = new Date(startOfToday.getTime() + 26 * 60 * 60 * 1000).toISOString();

    const assessmentRows = [
      {
        id: 'a-1',
        evidence: { due_at: dueTodayIso },
        assessed_at: null,
        created_at: '2026-03-01T12:00:00.000Z',
      },
      {
        id: 'a-2',
        evidence: { due_at: overdueIso },
        assessed_at: null,
        created_at: '2026-03-01T12:00:00.000Z',
      },
      {
        id: 'a-3',
        evidence: { due_at: futureIso },
        assessed_at: null,
        created_at: '2026-03-01T12:00:00.000Z',
      },
      {
        id: 'a-4',
        evidence: {},
        assessed_at: null,
        created_at: futureIso,
      },
    ];

    const assessmentChain = createAsyncQueryChain(assessmentRows);
    mockFrom.mockImplementation((table: string) => {
      if (table === 'assessment_records') return assessmentChain;
      throw new Error(`Unexpected table: ${table}`);
    });

    const summary = await programService.getEvaluatorDueAssessmentSummary('org-1', 'eval-1');

    expect(summary.totalDue).toBe(4);
    expect(summary.dueToday).toBe(1);
    expect(summary.overdue).toBe(1);
  });
});

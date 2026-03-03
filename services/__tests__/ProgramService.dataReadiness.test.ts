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
    neq: jest.fn(() => chain),
    in: jest.fn(() => chain),
    ilike: jest.fn(() => chain),
    gte: jest.fn(() => chain),
    lte: jest.fn(() => chain),
    not: jest.fn(() => chain),
    order: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    maybeSingle: jest.fn(async () => result),
    then: (onFulfilled: (value: QueryResult<T>) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
    catch: (onRejected: (reason: unknown) => unknown) =>
      Promise.resolve(result).catch(onRejected),
  };

  return chain;
}

describe('ProgramService data readiness queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-02T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('counts only RLS-visible participant rows in active lifecycle statuses', async () => {
    const participantChain = createAsyncQueryChain([
      { program_id: 'prog-1', status: 'active' },
      { program_id: 'prog-1', status: 'completed' },
      { program_id: 'prog-1', status: 'withdrawn' },
      { program_id: 'prog-2', status: 'invited' },
      { program_id: 'prog-2', status: 'inactive' },
      { program_id: null, status: 'active' },
    ]);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'program_participants') return participantChain;
      throw new Error(`Unexpected table: ${table}`);
    });

    const counts = await programService.getProgramParticipantCounts('org-1');

    expect(counts).toEqual({
      'prog-1': 2,
      'prog-2': 1,
    });
  });

  it('treats missing optional thread read rows as unread while honoring visible message subset', async () => {
    const messageChain = createAsyncQueryChain([
      { thread_id: 'thread-1', created_at: '2026-03-02T11:00:00.000Z' },
      { thread_id: 'thread-1', created_at: '2026-03-01T11:00:00.000Z' },
      { thread_id: 'thread-2', created_at: '2026-03-02T10:00:00.000Z' },
      { thread_id: 'thread-archived', created_at: '2026-03-02T10:45:00.000Z' },
      { thread_id: null, created_at: '2026-03-02T10:30:00.000Z' },
    ]);
    const threadChain = createAsyncQueryChain([
      { id: 'thread-1' },
      { id: 'thread-2' },
      // thread-archived intentionally omitted to simulate archived/invisible thread
    ]);
    const readsChain = createAsyncQueryChain([
      { thread_id: 'thread-1', last_read_at: '2026-03-02T12:00:00.000Z' },
      // thread-2 intentionally absent to simulate optional join/read row not visible
    ]);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'communication_messages') return messageChain;
      if (table === 'communication_threads') return threadChain;
      if (table === 'communication_thread_reads') return readsChain;
      throw new Error(`Unexpected table: ${table}`);
    });

    const unreadThreadIds = await programService.listUnreadThreadIds('org-1', 'user-1');

    expect(unreadThreadIds).toEqual(['thread-2']);
    expect(threadChain.eq).toHaveBeenCalledWith('is_archived', false);
  });

  it('supports optional program-scoped unread thread derivation', async () => {
    const messageChain = createAsyncQueryChain([
      { thread_id: 'thread-1', created_at: '2026-03-02T11:00:00.000Z' },
      { thread_id: 'thread-2', created_at: '2026-03-02T10:00:00.000Z' },
    ]);
    const threadChain = createAsyncQueryChain([
      { id: 'thread-2' },
    ]);
    const readsChain = createAsyncQueryChain([]);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'communication_messages') return messageChain;
      if (table === 'communication_threads') return threadChain;
      if (table === 'communication_thread_reads') return readsChain;
      throw new Error(`Unexpected table: ${table}`);
    });

    const unreadThreadIds = await programService.listUnreadThreadIds('org-1', 'user-1', 800, 'prog-2');

    expect(unreadThreadIds).toEqual(['thread-2']);
    expect(threadChain.eq).toHaveBeenCalledWith('program_id', 'prog-2');
  });

  it('falls back to default competency title when optional competency rows are not visible', async () => {
    const assessmentChain = createAsyncQueryChain([
      {
        competency_id: 'comp-hidden',
        score: 4,
        assessed_at: '2026-03-01T09:00:00.000Z',
        created_at: '2026-03-01T09:00:00.000Z',
      },
      {
        competency_id: 'comp-hidden',
        score: 2,
        assessed_at: '2026-02-21T09:00:00.000Z',
        created_at: '2026-02-21T09:00:00.000Z',
      },
    ]);
    const competencyChain = createAsyncQueryChain([]);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'assessment_records') return assessmentChain;
      if (table === 'betterat_competencies') return competencyChain;
      throw new Error(`Unexpected table: ${table}`);
    });

    const trends = await programService.listCompetencyProgressTrendsForEvaluator('org-1', 'eval-1', {
      weeks: 8,
      limitCompetencies: 5,
    });

    expect(trends).toHaveLength(1);
    expect(trends[0].competency_id).toBe('comp-hidden');
    expect(trends[0].competency_title).toBe('Competency');
    expect(trends[0].total_assessments).toBe(2);
  });
});

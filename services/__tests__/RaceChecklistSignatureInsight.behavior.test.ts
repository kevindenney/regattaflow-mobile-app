const mockFrom = jest.fn();
const mockLogSignatureInsightEvent = jest.fn();

jest.mock('../supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

jest.mock('@/services/SignatureInsightService', () => ({
  signatureInsightService: {
    logSignatureInsightEvent: (...args: unknown[]) => mockLogSignatureInsightEvent(...args),
  },
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  serializeError: jest.fn((value: unknown) => String(value ?? '')),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { RaceChecklistService } = require('../RaceChecklistService');

type QueryResult<T> = { data: T; error: any };

function createAwaitableChain<T>(result: QueryResult<T>) {
  const chain: any = {
    update: jest.fn(() => chain),
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    or: jest.fn(() => chain),
    order: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    in: jest.fn(() => chain),
    single: jest.fn(() => Promise.resolve(result)),
    maybeSingle: jest.fn(() => Promise.resolve(result)),
    then: (onFulfilled: (value: QueryResult<T>) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
    catch: (onRejected: (reason: unknown) => unknown) => Promise.resolve(result).catch(onRejected),
  };
  return chain;
}

function buildChecklistRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'item-1',
    sailor_id: 'user-1',
    race_event_id: 'race-event-1',
    phase: 'review',
    category: 'learning',
    title: 'Debrief start sequence',
    description: null,
    status: 'completed',
    completed_at: '2026-03-03T10:00:00.000Z',
    outcome_rating: null,
    outcome_notes: null,
    source: 'manual',
    source_learning_event_id: null,
    is_personalized: false,
    personalization_reason: null,
    confidence_score: null,
    template_item_id: null,
    sort_order: 1,
    created_at: '2026-03-03T10:00:00.000Z',
    updated_at: '2026-03-03T10:00:00.000Z',
    ...overrides,
  };
}

describe('RaceChecklistService signature insight behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not emit signature insight when AI analysis is unavailable', async () => {
    const checklistChain = createAwaitableChain({ data: buildChecklistRow(), error: null });
    const raceEventChain = createAwaitableChain({ data: { id: 'race-event-1', regatta_id: 'regatta-1' }, error: null });
    const sessionChain = createAwaitableChain({ data: [], error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'race_checklist_items') return checklistChain;
      if (table === 'race_events') return raceEventChain;
      if (table === 'race_timer_sessions') return sessionChain;
      throw new Error(`Unexpected table: ${table}`);
    });

    await RaceChecklistService.updateChecklistStatus('item-1', 'completed', { interestId: 'nursing' });

    expect(mockLogSignatureInsightEvent).not.toHaveBeenCalled();
  });

  it('emits signature insight when AI analysis exists and no matching dismissed principle', async () => {
    const checklistChain = createAwaitableChain({ data: buildChecklistRow(), error: null });
    const raceEventChain = createAwaitableChain({ data: { id: 'race-event-1', regatta_id: 'regatta-1' }, error: null });
    const sessionChain = createAwaitableChain({ data: [{ id: 'session-1', regatta_id: 'regatta-1', race_id: null, start_time: '2026-03-03T09:00:00.000Z' }], error: null });
    const analysisChain = createAwaitableChain({
      data: [{ id: 'ai-1', timer_session_id: 'session-1', confidence_score: 0.86, overall_summary: 'You maintained lane discipline and improved mark exits.', created_at: '2026-03-03T10:05:00.000Z' }],
      error: null,
    });
    const dismissedCheckChain = createAwaitableChain({ data: [], error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'race_checklist_items') return checklistChain;
      if (table === 'race_events') return raceEventChain;
      if (table === 'race_timer_sessions') return sessionChain;
      if (table === 'ai_coach_analysis') return analysisChain;
      if (table === 'signature_insight_events') return dismissedCheckChain;
      throw new Error(`Unexpected table: ${table}`);
    });

    await RaceChecklistService.updateChecklistStatus('item-1', 'completed', { interestId: 'drawing' });

    expect(mockLogSignatureInsightEvent).toHaveBeenCalledTimes(1);
    const input = mockLogSignatureInsightEvent.mock.calls[0][0];
    expect(input.interestId).toBe('drawing');
    expect(input.sourceKind).toBe('timeline_step_completion');
    expect(input.aiAnalysisId).toBe('ai-1');
  });
});

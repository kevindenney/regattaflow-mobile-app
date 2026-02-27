const mockGetDocumentAsync = jest.fn();
const mockFrom = jest.fn();

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: (...args: unknown[]) => mockGetDocumentAsync(...args),
}));

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}));

jest.mock('@/services/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
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

describe('AIStrategyService.selectDocumentAndGenerateStrategy', () => {
  let AIStrategyService: any;

  beforeAll(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    AIStrategyService = require('../aiService').AIStrategyService;
  });

  beforeEach(() => {
    mockGetDocumentAsync.mockReset();
    mockFrom.mockReset();
    jest.restoreAllMocks();
  });

  it('throws when document selection is canceled', async () => {
    mockGetDocumentAsync.mockResolvedValue({ canceled: true, assets: [] });

    await expect(
      AIStrategyService.selectDocumentAndGenerateStrategy({ tier: 'pro' }, 'user-1')
    ).rejects.toThrow('Document selection canceled');
  });

  it('returns course+strategy and persists IDs when workflow succeeds', async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file:///tmp/race.pdf',
          name: 'race.pdf',
          mimeType: 'application/pdf',
        },
      ],
    });

    const parseSpy = jest
      .spyOn(AIStrategyService, 'parseSailingInstructions')
      .mockResolvedValue({
        course_name: 'Harbor Course',
        racing_area: 'Inner Harbor',
        venue_id: 'venue-1',
        marks: [{ id: 'M1', name: 'Start', type: 'start', coordinates: [114.1, 22.3] }],
        start_line: { coordinates: [[114.1, 22.3]], bearing: 0, length_meters: 100 },
        finish_line: { coordinates: [[114.2, 22.4]], bearing: 0, length_meters: 100 },
        course_configurations: [],
        restrictions: [],
        wind_conditions: { expected_direction: 90, expected_speed_range: [8, 14], shift_probability: 0.2 },
        tide_information: { high_tide: 'n/a', low_tide: 'n/a', current_direction: 180, max_speed_knots: 1 },
        safety_information: [],
        protest_procedures: [],
        extracted_at: new Date(),
        confidence_score: 90,
      });

    const generateSpy = jest
      .spyOn(AIStrategyService, 'generateRaceStrategy')
      .mockResolvedValue({
        id: undefined,
        course_id: '',
        venue_id: 'venue-1',
        user_id: 'user-1',
        strategy_type: 'pro',
        pre_start_plan: { positioning: 'Own committee boat end', timing: '', risk_assessment: '', alternatives: [] },
        upwind_strategy: { favored_side: 'left', tack_plan: 'Protect shifts', layline_approach: '', shift_management: '' },
        downwind_strategy: { gybe_plan: '', pressure_seeking: '', wave_sailing: '' },
        mark_roundings: [],
        contingency_plans: [],
        equipment_recommendations: { sail_selection: [], boat_setup: [], crew_assignments: [] },
        confidence_score: 0.83,
        created_at: new Date(),
        updated_at: new Date(),
      });

    mockFrom
      .mockReturnValueOnce({
        insert: () => ({
          select: () => ({
            single: async () => ({ data: { id: 'course-db-id' }, error: null }),
          }),
        }),
      })
      .mockReturnValueOnce({
        insert: () => ({
          select: () => ({
            single: async () => ({ data: { id: 'strategy-db-id' }, error: null }),
          }),
        }),
      });

    const result = await AIStrategyService.selectDocumentAndGenerateStrategy(
      { tier: 'pro' },
      'user-1'
    );

    expect(parseSpy).toHaveBeenCalledWith(
      'file:///tmp/race.pdf',
      undefined,
      expect.objectContaining({
        fileName: 'race.pdf',
        mimeType: 'application/pdf',
      })
    );
    expect(generateSpy).toHaveBeenCalled();
    expect(result.course.id).toBe('course-db-id');
    expect(result.strategy.id).toBe('strategy-db-id');
  });

  it('falls back to race_id persistence when regatta_id column is unavailable', async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/race.pdf', name: 'race.pdf', mimeType: 'application/pdf' }],
    });

    jest.spyOn(AIStrategyService, 'parseSailingInstructions').mockResolvedValue({
      course_name: 'Fallback Course',
      racing_area: 'Harbor',
      venue_id: 'venue-2',
      marks: [{ id: 'M1', name: 'Start', type: 'start', coordinates: [114.1, 22.3] }],
      start_line: { coordinates: [[114.1, 22.3]], bearing: 0, length_meters: 100 },
      finish_line: { coordinates: [[114.2, 22.4]], bearing: 0, length_meters: 100 },
      course_configurations: [],
      restrictions: [],
      wind_conditions: { expected_direction: 90, expected_speed_range: [8, 14], shift_probability: 0.2 },
      tide_information: { high_tide: 'n/a', low_tide: 'n/a', current_direction: 180, max_speed_knots: 1 },
      safety_information: [],
      protest_procedures: [],
      extracted_at: new Date(),
      confidence_score: 90,
    });

    jest.spyOn(AIStrategyService, 'generateRaceStrategy').mockResolvedValue({
      id: undefined,
      course_id: '',
      venue_id: 'venue-2',
      user_id: 'user-2',
      strategy_type: 'pro',
      pre_start_plan: { positioning: 'Start clear', timing: '', risk_assessment: '', alternatives: [] },
      upwind_strategy: { favored_side: 'right', tack_plan: 'Cover fleet', layline_approach: '', shift_management: '' },
      downwind_strategy: { gybe_plan: '', pressure_seeking: '', wave_sailing: '' },
      mark_roundings: [],
      contingency_plans: [],
      equipment_recommendations: { sail_selection: [], boat_setup: [], crew_assignments: [] },
      confidence_score: 0.7,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const primaryUpsert = jest.fn().mockReturnValue({
      select: () => ({
        single: async () => ({
          data: null,
          error: { code: '42703', message: 'column race_strategies.regatta_id does not exist' },
        }),
      }),
    });
    const fallbackUpsert = jest.fn().mockReturnValue({
      select: () => ({
        single: async () => ({ data: { id: 'strategy-fallback-id' }, error: null }),
      }),
    });

    mockFrom
      .mockReturnValueOnce({
        insert: () => ({
          select: () => ({
            single: async () => ({ data: { id: 'course-id-2' }, error: null }),
          }),
        }),
      })
      .mockReturnValueOnce({ upsert: primaryUpsert })
      .mockReturnValueOnce({ upsert: fallbackUpsert });

    const result = await AIStrategyService.selectDocumentAndGenerateStrategy(
      { tier: 'pro', regattaId: 'regatta-123' },
      'user-2'
    );

    expect(primaryUpsert).toHaveBeenCalled();
    expect(fallbackUpsert).toHaveBeenCalled();
    expect(result.strategy.id).toBe('strategy-fallback-id');
  });

  it('continues and returns generated objects when course/strategy persistence fail', async () => {
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/race.pdf', name: 'race.pdf', mimeType: 'application/pdf' }],
    });

    jest.spyOn(AIStrategyService, 'parseSailingInstructions').mockResolvedValue({
      course_name: 'No Persist Course',
      racing_area: 'Open Water',
      venue_id: 'venue-3',
      marks: [{ id: 'M1', name: 'Start', type: 'start', coordinates: [114.1, 22.3] }],
      start_line: { coordinates: [[114.1, 22.3]], bearing: 0, length_meters: 100 },
      finish_line: { coordinates: [[114.2, 22.4]], bearing: 0, length_meters: 100 },
      course_configurations: [],
      restrictions: [],
      wind_conditions: { expected_direction: 90, expected_speed_range: [8, 14], shift_probability: 0.2 },
      tide_information: { high_tide: 'n/a', low_tide: 'n/a', current_direction: 180, max_speed_knots: 1 },
      safety_information: [],
      protest_procedures: [],
      extracted_at: new Date(),
      confidence_score: 90,
    });

    jest.spyOn(AIStrategyService, 'generateRaceStrategy').mockResolvedValue({
      id: undefined,
      course_id: '',
      venue_id: 'venue-3',
      user_id: 'user-3',
      strategy_type: 'pro',
      pre_start_plan: { positioning: 'Protect line', timing: '', risk_assessment: '', alternatives: [] },
      upwind_strategy: { favored_side: 'middle', tack_plan: 'Stay in pressure', layline_approach: '', shift_management: '' },
      downwind_strategy: { gybe_plan: '', pressure_seeking: '', wave_sailing: '' },
      mark_roundings: [],
      contingency_plans: [],
      equipment_recommendations: { sail_selection: [], boat_setup: [], crew_assignments: [] },
      confidence_score: 0.6,
      created_at: new Date(),
      updated_at: new Date(),
    });

    mockFrom
      .mockReturnValueOnce({
        insert: () => ({
          select: () => ({
            single: async () => ({ data: null, error: { code: 'XX000', message: 'course save failed' } }),
          }),
        }),
      })
      .mockReturnValueOnce({
        insert: () => ({
          select: () => ({
            single: async () => ({ data: null, error: { code: 'XX000', message: 'strategy save failed' } }),
          }),
        }),
      });

    const result = await AIStrategyService.selectDocumentAndGenerateStrategy(
      { tier: 'pro' },
      'user-3'
    );

    expect(result.course.course_name).toBe('No Persist Course');
    expect(result.strategy.user_id).toBe('user-3');
    expect(result.course.id).toBeUndefined();
    expect(result.strategy.id).toBeUndefined();
  });
});

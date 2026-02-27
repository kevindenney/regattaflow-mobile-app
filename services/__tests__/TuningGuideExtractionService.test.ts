const mockInvoke = jest.fn();
const mockEq = jest.fn();
const mockFrom = jest.fn();
const mockUpdatePayloads: Record<string, unknown>[] = [];

jest.mock('../supabase', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
    from: (...args: unknown[]) => mockFrom(...args),
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
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { tuningGuideExtractionService } = require('../TuningGuideExtractionService');

describe('TuningGuideExtractionService', () => {
  beforeEach(() => {
    mockInvoke.mockReset();
    mockEq.mockReset();
    mockFrom.mockReset();
    mockUpdatePayloads.length = 0;

    mockEq.mockResolvedValue({ error: null });
    mockFrom.mockImplementation(() => ({
      update: (payload: Record<string, unknown>) => {
        mockUpdatePayloads.push(payload);
        return { eq: mockEq };
      },
    }));
  });

  it('uses extract-pdf-text + text contract for pdf extraction and stores completed content', async () => {
    mockInvoke
      .mockResolvedValueOnce({ data: { text: 'Extracted PDF text body' }, error: null }) // extract-pdf-text
      .mockResolvedValueOnce({
        data: {
          success: true,
          races: [{ raceName: 'Dragon Spring Cup', courseDescription: 'Harbor course' }],
        },
        error: null,
      }); // extract-race-details

    const result = await tuningGuideExtractionService.extractContent(
      'guide-1',
      'https://example.com/guide.pdf',
      'pdf'
    );

    expect(mockInvoke).toHaveBeenNthCalledWith(
      1,
      'extract-pdf-text',
      expect.objectContaining({
        body: { url: 'https://example.com/guide.pdf' },
      })
    );
    expect(mockInvoke).toHaveBeenNthCalledWith(
      2,
      'extract-race-details',
      expect.objectContaining({
        body: { text: 'Extracted PDF text body' },
      })
    );
    expect(result.fullText).toContain('Harbor course');

    expect(mockUpdatePayloads.some((payload) => payload.extraction_status === 'processing')).toBe(true);
    expect(
      mockUpdatePayloads.some(
        (payload) =>
          payload.extraction_status === 'completed' &&
          typeof payload.extracted_content === 'string'
      )
    ).toBe(true);
  });

  it('uses url contract for link/doc extraction path', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: {
        success: true,
        text: 'General tuning notes',
      },
      error: null,
    });

    const result = await tuningGuideExtractionService.extractContent(
      'guide-2',
      'https://example.com/tuning-guide',
      'link'
    );

    expect(mockInvoke).toHaveBeenCalledWith(
      'extract-race-details',
      expect.objectContaining({
        body: { url: 'https://example.com/tuning-guide' },
      })
    );
    expect(result.fullText).toContain('General tuning notes');
  });
});

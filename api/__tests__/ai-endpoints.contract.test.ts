type MockReq = {
  method: string;
  headers?: Record<string, string | undefined>;
  query?: Record<string, string>;
  body?: unknown;
  auth?: { userId: string; clubId: string | null };
  supabase?: unknown;
};

type MockRes = {
  statusCode: number;
  headers: Record<string, string>;
  payload: unknown;
  setHeader: jest.Mock;
  status: jest.Mock;
  json: jest.Mock;
};

function createMockRes(): MockRes {
  const res: MockRes = {
    statusCode: 200,
    headers: {},
    payload: undefined,
    setHeader: jest.fn((key: string, value: string) => {
      res.headers[key] = value;
      return res;
    }),
    status: jest.fn((code: number) => {
      res.statusCode = code;
      return res;
    }),
    json: jest.fn((payload: unknown) => {
      res.payload = payload;
      return res;
    }),
  };
  return res;
}

const withAuthFactory = (handler: (req: MockReq, res: MockRes) => Promise<void> | void) =>
  async (req: MockReq, res: MockRes) => {
    const authHeader = req.headers?.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    req.auth = { userId: 'user-1', clubId: 'club-1' };
    req.supabase = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { organization_type: 'club' },
          error: null,
        }),
      })),
    };
    await handler(req, res);
  };

jest.mock('../middleware/auth', () => ({
  withAuth: (handler: (req: MockReq, res: MockRes) => Promise<void> | void) => withAuthFactory(handler),
}));

jest.mock('../../services/ai/ClaudeClient', () => ({
  ClaudeClient: jest.fn().mockImplementation(() => ({
    createMessage: jest.fn().mockResolvedValue({ text: '', tokensIn: 0, tokensOut: 0 }),
  })),
}));

jest.mock('../../services/ai/AIActivityLogger', () => ({
  AIActivityLogger: jest.fn().mockImplementation(() => ({
    logActivity: jest.fn().mockResolvedValue(undefined),
    logNotification: jest.fn().mockResolvedValue(undefined),
    logDocument: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../../services/ai/ContextResolvers', () => ({
  resolveClubSummary: jest.fn().mockResolvedValue({}),
  resolveRaceContext: jest.fn().mockResolvedValue({ clubId: 'club-1' }),
  resolveEventContext: jest.fn().mockResolvedValue({ clubId: 'club-1' }),
}));

jest.mock('../../services/ai/PromptBuilder', () => ({
  buildSupportPrompt: jest.fn().mockReturnValue({ system: '', messages: [] }),
  buildRaceCommsPrompt: jest.fn().mockReturnValue({ system: '', messages: [] }),
  buildEventDocumentPrompt: jest.fn().mockReturnValue({ system: '', messages: [] }),
}));

jest.mock('../../services/ai/OutputValidator', () => ({
  parseSupportReply: jest.fn().mockReturnValue({ reply: 'ok' }),
  parseRaceComms: jest.fn().mockReturnValue({ email: 'ok', sms: 'ok', notice_board: 'ok', urgency: 'normal' }),
  parseDocumentDraft: jest.fn().mockReturnValue({ title: 'ok', markdown: 'ok', sections: [] }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const raceCommsDraftHandler = require('../ai/races/[id]/comms/draft').default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const eventDocumentDraftHandler = require('../ai/events/[id]/documents/draft').default;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const clubSupportHandler = require('../ai/club/support').default;

describe('AI endpoint method/auth contracts', () => {
  const ALLOWED_STRICT_SMOKE_STATUSES = [405, 401, 403];

  const endpoints = [
    { name: 'race comms draft', handler: raceCommsDraftHandler, query: { id: 'race-1' }, body: {} },
    { name: 'event document draft', handler: eventDocumentDraftHandler, query: { id: 'event-1' }, body: {} },
    { name: 'club support', handler: clubSupportHandler, query: {}, body: { message: 'help' } },
  ];

  it.each(endpoints)('$name GET returns method/auth guard status and not 500', async ({ handler, query, body }) => {
    const req: MockReq = {
      method: 'GET',
      headers: { authorization: 'Bearer token' },
      query,
      body,
    };
    const res = createMockRes();

    await handler(req, res);

    expect(ALLOWED_STRICT_SMOKE_STATUSES).toContain(res.statusCode);
    expect(res.statusCode).not.toBe(500);
  });

  it.each(endpoints)('$name GET unauthenticated returns 405/401/403 and never 500', async ({ handler, query, body }) => {
    const req: MockReq = {
      method: 'GET',
      headers: {},
      query,
      body,
    };
    const res = createMockRes();

    await handler(req, res);

    expect(ALLOWED_STRICT_SMOKE_STATUSES).toContain(res.statusCode);
    expect(res.statusCode).not.toBe(500);
  });

  it.each(endpoints)('$name POST unauthenticated returns 405/401/403 and never 500', async ({ handler, query, body }) => {
    const req: MockReq = {
      method: 'POST',
      headers: {},
      query,
      body,
    };
    const res = createMockRes();

    await handler(req, res);

    expect(ALLOWED_STRICT_SMOKE_STATUSES).toContain(res.statusCode);
    expect(res.statusCode).not.toBe(500);
  });
});

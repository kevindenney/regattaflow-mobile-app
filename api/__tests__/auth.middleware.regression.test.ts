import type { VercelRequest, VercelResponse } from '@vercel/node';

const mockCreateClient = jest.fn();

jest.mock('expo/virtual/env', () => ({ env: process.env }), { virtual: true });
jest.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

const { withAuth } = require('../middleware/auth');

type MockSupabase = {
  auth: {
    getUser: jest.Mock;
  };
  from: jest.Mock;
};

type QueueResult = {
  data: any;
  error: any;
};

function createSupabaseMock(options: {
  getUserResult: QueueResult;
  queryResultsByTable?: Record<string, QueueResult[]>;
}): MockSupabase {
  const queryResultsByTable = options.queryResultsByTable || {};
  const from = jest.fn((table: string) => {
    const queue = queryResultsByTable[table] || [];
    const builder: any = {
      select: jest.fn(() => builder),
      eq: jest.fn(() => builder),
      in: jest.fn(() => builder),
      limit: jest.fn(() => builder),
      maybeSingle: jest.fn(async () => queue.shift() || { data: null, error: null }),
    };
    return builder;
  });

  return {
    auth: {
      getUser: jest.fn(async () => options.getUserResult),
    },
    from,
  };
}

function createReq(authHeader?: string): VercelRequest {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  } as unknown as VercelRequest;
}

function createRes() {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  return {
    status,
    json,
  } as unknown as VercelResponse & { status: jest.Mock; json: jest.Mock };
}

describe('api/middleware/auth withAuth regression', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  });

  it('returns 401 when bearer token is missing', async () => {
    const handler = jest.fn();
    const wrapped = withAuth(handler);
    const req = createReq(undefined);
    const res = createRes();

    await wrapped(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(mockCreateClient).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });

  it('returns 401 when bearer token is missing even if auth env is not configured', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    const handler = jest.fn();
    const wrapped = withAuth(handler);
    const req = createReq(undefined);
    const res = createRes();

    await wrapped(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(mockCreateClient).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });

  it('returns 500 when bearer token exists but auth env is missing', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    const handler = jest.fn();
    const wrapped = withAuth(handler);
    const req = createReq('Bearer any-token');
    const res = createRes();

    await wrapped(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server auth is not configured' });
    expect(mockCreateClient).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', async () => {
    const supabase = createSupabaseMock({
      getUserResult: {
        data: { user: null },
        error: { message: 'invalid token' },
      },
    });
    mockCreateClient.mockReturnValueOnce(supabase);

    const handler = jest.fn();
    const wrapped = withAuth(handler);
    const req = createReq('Bearer invalid-token');
    const res = createRes();

    await wrapped(req, res);

    expect(mockCreateClient).toHaveBeenCalledTimes(1);
    expect(supabase.auth.getUser).toHaveBeenCalledWith('invalid-token');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('returns 403 when requireClub is enabled and user has no club membership', async () => {
    const supabase = createSupabaseMock({
      getUserResult: {
        data: { user: { id: 'user-no-club', email: 'no-club@example.com' } },
        error: null,
      },
      queryResultsByTable: {
        users: [
          { data: null, error: null },
          { data: null, error: null },
          { data: null, error: null },
        ],
        organization_memberships: [{ data: null, error: null }],
        club_staff: [{ data: null, error: null }],
      },
    });
    mockCreateClient.mockReturnValueOnce(supabase);

    const handler = jest.fn();
    const wrapped = withAuth(handler, { requireClub: true });
    const req = createReq('Bearer valid-no-club-token');
    const res = createRes();

    await wrapped(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Organization context required' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('executes handler when token is valid and club membership resolves', async () => {
    const supabase = createSupabaseMock({
      getUserResult: {
        data: { user: { id: 'user-with-club', email: 'with-club@example.com' } },
        error: null,
      },
      queryResultsByTable: {
        users: [
          { data: null, error: null },
          { data: null, error: null },
          { data: null, error: null },
        ],
        organization_memberships: [
          { data: { organization_id: 'club-123', status: 'active' }, error: null },
        ],
      },
    });
    mockCreateClient.mockReturnValueOnce(supabase);

    const handler = jest.fn((req: any, res: any) => {
      res.status(200).json({ ok: true, userId: req.auth.userId, clubId: req.auth.clubId });
    });
    const wrapped = withAuth(handler, { requireClub: true });
    const req = createReq('Bearer valid-token');
    const res = createRes();

    await wrapped(req, res);

    expect(handler).toHaveBeenCalledTimes(1);
    const authedReq = handler.mock.calls[0][0];
    expect(authedReq.auth).toEqual({
      userId: 'user-with-club',
      email: 'with-club@example.com',
      clubId: 'club-123',
    });
    expect(authedReq.supabase).toBe(supabase);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      userId: 'user-with-club',
      clubId: 'club-123',
    });
  });
});

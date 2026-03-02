import type { VercelRequest, VercelResponse } from '@vercel/node';

const mockCreateClient = jest.fn();

jest.mock('expo/virtual/env', () => ({ env: process.env }), { virtual: true });
jest.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

const { withAuth } = require('../middleware/auth');

type QueryResult = { data: any; error: any };

type MockSupabase = {
  auth: { getUser: jest.Mock };
  from: jest.Mock;
};

function createSupabaseMock(options: {
  userId: string;
  email?: string | null;
  queryResultsByTable?: Record<string, QueryResult[]>;
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
      getUser: jest.fn(async () => ({
        data: { user: { id: options.userId, email: options.email ?? null } },
        error: null,
      })),
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

describe('api/middleware/auth withAuth club resolution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  });

  it('uses metadata organization id path from users record', async () => {
    const supabase = createSupabaseMock({
      userId: 'user-1',
      email: 'sailor@example.com',
      queryResultsByTable: {
        users: [{ data: { active_organization_id: 'club-1' }, error: null }],
      },
    });
    mockCreateClient.mockReturnValueOnce(supabase);

    const handler = jest.fn((req: any, res: any) => {
      res.status(200).json({ clubId: req.auth.clubId, userId: req.auth.userId });
    });
    const wrapped = withAuth(handler, { requireClub: true });
    const req = createReq('Bearer token-1');
    const res = createRes();

    await wrapped(req, res);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ clubId: 'club-1', userId: 'user-1' });
    expect(supabase.from).not.toHaveBeenCalledWith('organization_memberships');
  });

  it('falls back to membership path when users metadata org id is unavailable', async () => {
    const supabase = createSupabaseMock({
      userId: 'user-2',
      email: 'coach@example.com',
      queryResultsByTable: {
        users: [
          { data: null, error: null },
          { data: null, error: null },
          { data: null, error: null },
        ],
        organization_memberships: [
          { data: { organization_id: 'club-fallback', status: 'active' }, error: null },
        ],
      },
    });
    mockCreateClient.mockReturnValueOnce(supabase);

    const handler = jest.fn((req: any, res: any) => {
      res.status(200).json({ clubId: req.auth.clubId });
    });
    const wrapped = withAuth(handler, { requireClub: true });
    const req = createReq('Bearer token-2');
    const res = createRes();

    await wrapped(req, res);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ clubId: 'club-fallback' });
    expect(supabase.from).toHaveBeenCalledWith('organization_memberships');
  });

  it('allows no-club path when requireClub is false and rejects when requireClub is true', async () => {
    const queryResultsByTable = {
      users: [
        { data: null, error: null },
        { data: null, error: null },
        { data: null, error: null },
      ],
      organization_memberships: [{ data: null, error: null }],
      club_staff: [{ data: null, error: null }],
    };

    const allowSupabase = createSupabaseMock({
      userId: 'user-3',
      email: 'noclub@example.com',
      queryResultsByTable: {
        users: [...queryResultsByTable.users],
        organization_memberships: [...queryResultsByTable.organization_memberships],
        club_staff: [...queryResultsByTable.club_staff],
      },
    });
    mockCreateClient.mockReturnValueOnce(allowSupabase);

    const allowHandler = jest.fn((req: any, res: any) => {
      res.status(200).json({ clubId: req.auth.clubId });
    });
    const allowWrapped = withAuth(allowHandler, { requireClub: false });
    await allowWrapped(createReq('Bearer token-3'), createRes());

    expect(allowHandler).toHaveBeenCalledTimes(1);
    expect(allowHandler.mock.calls[0][0].auth.clubId).toBeNull();

    const denySupabase = createSupabaseMock({
      userId: 'user-3',
      email: 'noclub@example.com',
      queryResultsByTable: {
        users: [...queryResultsByTable.users],
        organization_memberships: [...queryResultsByTable.organization_memberships],
        club_staff: [...queryResultsByTable.club_staff],
      },
    });
    mockCreateClient.mockReturnValueOnce(denySupabase);

    const denyHandler = jest.fn();
    const denyWrapped = withAuth(denyHandler, { requireClub: true });
    const denyRes = createRes();
    await denyWrapped(createReq('Bearer token-3'), denyRes);

    expect(denyHandler).not.toHaveBeenCalled();
    expect(denyRes.status).toHaveBeenCalledWith(403);
    expect(denyRes.json).toHaveBeenCalledWith({ error: 'Organization context required' });
  });
});

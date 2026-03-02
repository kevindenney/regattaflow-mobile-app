import type { VercelRequest, VercelResponse } from '@vercel/node';

type QueueResult = {
  data: any;
  error: any;
};

type TableQueues = {
  select?: QueueResult[];
  maybeSingle?: QueueResult[];
  insertMaybeSingle?: QueueResult[];
  upsert?: QueueResult[];
};

type MockSupabase = {
  auth: {
    getUser: jest.Mock;
  };
  from: jest.Mock;
};

const mockCreateClient = jest.fn();

jest.mock('expo/virtual/env', () => ({ env: process.env }), { virtual: true });
jest.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

function popQueueResult(
  table: string,
  key: keyof TableQueues,
  queuesByTable: Record<string, TableQueues>,
  fallback: QueueResult
): QueueResult {
  const tableQueues = queuesByTable[table];
  if (!tableQueues) return fallback;
  const queue = tableQueues[key];
  if (!queue || queue.length === 0) return fallback;
  return queue.shift() as QueueResult;
}

function createSupabaseMock(options: {
  getUserResult: QueueResult;
  queuesByTable?: Record<string, TableQueues>;
}): MockSupabase {
  const queuesByTable = options.queuesByTable || {};

  const from = jest.fn((table: string) => {
    let mode: 'select' | 'insert' = 'select';
    const builder: any = {
      select: jest.fn(() => builder),
      eq: jest.fn(() => builder),
      in: jest.fn(() => builder),
      limit: jest.fn(() => builder),
      maybeSingle: jest.fn(async () => {
        if (mode === 'insert') {
          return popQueueResult(table, 'insertMaybeSingle', queuesByTable, { data: null, error: null });
        }
        return popQueueResult(table, 'maybeSingle', queuesByTable, { data: null, error: null });
      }),
      insert: jest.fn(() => {
        mode = 'insert';
        return builder;
      }),
      upsert: jest.fn(async () => {
        return popQueueResult(table, 'upsert', queuesByTable, { data: null, error: null });
      }),
      then: (resolve: (value: QueueResult) => unknown, reject?: (reason: unknown) => unknown) => {
        const next = popQueueResult(table, 'select', queuesByTable, { data: [], error: null });
        return Promise.resolve(next).then(resolve, reject);
      },
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

function createReq(args: {
  method: string;
  authorization?: string;
  query?: Record<string, string>;
}): VercelRequest {
  return {
    method: args.method,
    headers: args.authorization ? { authorization: args.authorization } : {},
    query: args.query || {},
  } as unknown as VercelRequest;
}

function createRes() {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    payload: undefined as unknown,
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
  return res as VercelResponse & {
    statusCode: number;
    headers: Record<string, string>;
    payload: any;
    status: jest.Mock;
    json: jest.Mock;
    setHeader: jest.Mock;
  };
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const workspaceHandler = require('../club/workspace').default;

describe('club workspace bootstrap API contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  });

  it('allows authenticated non-club users to GET without requireClub and returns no workspace', async () => {
    const supabase = createSupabaseMock({
      getUserResult: {
        data: { user: { id: 'user-non-club', email: 'sailor@example.com' } },
        error: null,
      },
      queuesByTable: {
        users: {
          // withAuth resolveClubId attempts
          maybeSingle: [
            { data: null, error: null },
            { data: null, error: null },
            { data: null, error: null },
            // handler user profile lookup
            { data: { id: 'user-non-club', email: 'sailor@example.com', full_name: 'Sailor', user_type: 'sailor' }, error: null },
          ],
        },
        organization_memberships: {
          maybeSingle: [{ data: null, error: null }],
        },
        club_staff: {
          maybeSingle: [{ data: null, error: null }],
          select: [{ data: [], error: null }],
        },
        clubs: {
          maybeSingle: [{ data: null, error: null }],
        },
        club_members: {
          select: [{ data: [], error: null }],
        },
      },
    });
    mockCreateClient.mockReturnValueOnce(supabase);

    const req = createReq({
      method: 'GET',
      authorization: 'Bearer valid-token',
    });
    const res = createRes();

    await workspaceHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload).toEqual({
      club: null,
      created: false,
      membership: null,
    });
  });

  it('POST ensure path creates a workspace for club users when missing and returns created=true', async () => {
    const insertedClubId = 'club-profile-1';
    const supabase = createSupabaseMock({
      getUserResult: {
        data: { user: { id: 'user-club', email: 'clubowner@example.com' } },
        error: null,
      },
      queuesByTable: {
        users: {
          // withAuth resolveClubId attempts
          maybeSingle: [
            { data: null, error: null },
            { data: null, error: null },
            { data: null, error: null },
            // handler user profile lookup
            { data: { id: 'user-club', email: 'clubowner@example.com', full_name: 'Harbor Club', user_type: 'club' }, error: null },
          ],
        },
        organization_memberships: {
          maybeSingle: [{ data: null, error: null }],
        },
        club_staff: {
          maybeSingle: [{ data: null, error: null }],
          select: [{ data: [], error: null }],
          upsert: [{ data: null, error: null }],
        },
        clubs: {
          maybeSingle: [{ data: null, error: null }],
        },
        club_members: {
          select: [{ data: [], error: null }],
        },
        club_profiles: {
          insertMaybeSingle: [
            {
              data: {
                id: insertedClubId,
                organization_name: 'Harbor Club',
                club_name: null,
                contact_email: 'clubowner@example.com',
                onboarding_completed: false,
              },
              error: null,
            },
          ],
        },
      },
    });
    mockCreateClient.mockReturnValueOnce(supabase);

    const req = createReq({
      method: 'POST',
      authorization: 'Bearer valid-token',
      query: {},
    });
    const res = createRes();

    await workspaceHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload.created).toBe(true);
    expect(res.payload.club).toBeTruthy();
    expect(res.payload.club.id).toBe(insertedClubId);
    expect(res.payload.membership).toEqual({
      role: 'admin',
      source: 'owner',
    });
  });

  it('returns method guard for unsupported verbs', async () => {
    const supabase = createSupabaseMock({
      getUserResult: {
        data: { user: { id: 'user-1', email: 'user@example.com' } },
        error: null,
      },
      queuesByTable: {
        users: {
          maybeSingle: [{ data: null, error: null }],
        },
      },
    });
    mockCreateClient.mockReturnValueOnce(supabase);

    const req = createReq({
      method: 'DELETE',
      authorization: 'Bearer valid-token',
    });
    const res = createRes();

    await workspaceHandler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe('GET,POST');
    expect(res.payload).toEqual({ error: 'Method not allowed' });
  });
});

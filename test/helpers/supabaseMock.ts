/**
 * Reusable Supabase mock utilities for service-layer tests.
 *
 * Provides a chainable query builder that mirrors the Supabase PostgREST API
 * so tests can assert on query composition and control returned data/errors.
 */

type QueryResult = { data: any; error: any; count?: number | null };

/** Create a chainable query builder that resolves to `result` on terminal call. */
function createQueryBuilder(result: QueryResult) {
  const builder: Record<string, jest.Mock> = {};

  const chainMethods = [
    'select', 'insert', 'update', 'upsert', 'delete',
    'eq', 'neq', 'in', 'is', 'gt', 'lt', 'gte', 'lte',
    'like', 'ilike', 'contains', 'containedBy',
    'order', 'limit', 'range', 'filter',
    'not', 'or', 'match', 'textSearch',
  ];

  for (const method of chainMethods) {
    builder[method] = jest.fn().mockReturnValue(builder);
  }

  // Terminal methods resolve with the result
  builder.single = jest.fn().mockResolvedValue(result);
  builder.maybeSingle = jest.fn().mockResolvedValue(result);
  builder.then = jest.fn((resolve) => resolve(result));

  // Make builder itself thenable (so `await query` works)
  (builder as any)[Symbol.toStringTag] = 'SupabaseMockBuilder';

  // Override select/insert/update/upsert/delete to still be chainable
  // but also act as terminal when awaited (via .then on the builder proxy)
  const proxy = new Proxy(builder, {
    get(target, prop) {
      if (prop === 'then') {
        // Makes `await supabase.from(...).select(...)` resolve to result
        return (resolve: (v: QueryResult) => void, reject: (e: any) => void) =>
          Promise.resolve(result).then(resolve, reject);
      }
      return target[prop as string];
    },
  });

  return proxy;
}

/** Return a successful Supabase response. */
export function mockSupabaseResponse(data: any, count?: number | null): QueryResult {
  return { data, error: null, count: count ?? null };
}

/** Return a Supabase error response. */
export function mockSupabaseError(
  message: string,
  code = 'PGRST000',
): QueryResult {
  return { data: null, error: { message, code } };
}

/**
 * Configure `supabase.from(table)` to return a chainable builder that
 * resolves to the given result.
 *
 * Usage:
 *   setupSupabaseFrom(supabase, 'timeline_steps', mockSupabaseResponse([...]));
 */
export function setupSupabaseFrom(
  supabaseMock: { from: jest.Mock },
  table: string,
  result: QueryResult,
) {
  const builder = createQueryBuilder(result);
  supabaseMock.from.mockImplementation((t: string) => {
    if (t === table) return builder;
    // Fall through to a default empty builder for other tables
    return createQueryBuilder(mockSupabaseResponse(null));
  });
  return builder;
}

/**
 * Configure `supabase.from()` to handle multiple tables.
 *
 * Usage:
 *   setupSupabaseFromMulti(supabase, {
 *     timeline_steps: mockSupabaseResponse([...]),
 *     users: mockSupabaseResponse({ id: '1' }),
 *   });
 */
export function setupSupabaseFromMulti(
  supabaseMock: { from: jest.Mock },
  tableResults: Record<string, QueryResult>,
) {
  const builders: Record<string, any> = {};
  for (const [table, result] of Object.entries(tableResults)) {
    builders[table] = createQueryBuilder(result);
  }
  supabaseMock.from.mockImplementation((t: string) => {
    return builders[t] ?? createQueryBuilder(mockSupabaseResponse(null));
  });
  return builders;
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer, type AuthContext } from '../services/mcp/server';
import { normalizeTier, isFeatureAvailable } from '../lib/subscriptions/sailorTiers';

// ---------------------------------------------------------------------------
// Auth helpers (mirrors api/middleware/auth.ts)
// ---------------------------------------------------------------------------

function extractBearerToken(header?: string): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

async function resolveClubId(supabase: ReturnType<typeof createClient>, userId: string): Promise<string | null> {
  const selects = [
    'active_organization_id, organization_id, club_id',
    'organization_id, club_id',
    'club_id',
  ];

  for (const fields of selects) {
    const { data, error } = await supabase
      .from('users')
      .select(fields)
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      const code = String(error?.code ?? '');
      const msg = String(error?.message ?? '').toLowerCase();
      if (['42703', 'PGRST204', 'PGRST205'].includes(code) || msg.includes('column')) continue;
      break;
    }

    const row = (data || {}) as Record<string, unknown>;
    const candidate = row.active_organization_id ?? row.organization_id ?? row.club_id ?? null;
    if (candidate && typeof candidate === 'string') return candidate;
  }

  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('organization_id')
    .eq('user_id', userId)
    .in('status', ['active', 'verified'])
    .limit(1)
    .maybeSingle();

  return membership?.organization_id ?? null;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only POST is supported in stateless mode
  if (req.method === 'GET' || req.method === 'DELETE') {
    res.status(405).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Method not allowed.' },
      id: null,
    });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Method not allowed.' },
      id: null,
    });
    return;
  }

  // --- Authenticate ---
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(500).json({ error: 'Server auth is not configured' });
    return;
  }

  // Dev token auth: allows local testing without a user JWT.
  // Set MCP_DEV_TOKEN env var and pass it as the bearer token.
  // Optionally pass X-Impersonate-User header with a user ID.
  const devToken = process.env.MCP_DEV_TOKEN;
  const isDevMode = devToken && token === devToken;

  let userId: string;
  let userEmail: string | null;
  let supabase: ReturnType<typeof createClient>;

  if (isDevMode) {
    // Dev mode: use service role key to bypass RLS
    supabase = createClient(supabaseUrl, serviceRoleKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const impersonate = req.headers['x-impersonate-user'] as string | undefined;
    // Default to MCP_DEV_USER_ID env var or the impersonate header
    const devUserId = impersonate || process.env.MCP_DEV_USER_ID;
    if (!devUserId) {
      res.status(400).json({
        error: 'Dev mode requires MCP_DEV_USER_ID env var or X-Impersonate-User header',
      });
      return;
    }
    userId = devUserId;
    userEmail = process.env.MCP_DEV_USER_EMAIL ?? null;
  } else {
    // Normal user JWT auth
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    userId = userData.user.id;
    userEmail = userData.user.email ?? null;
  }

  const clubId = await resolveClubId(supabase, userId);

  // --- Resolve subscription tier ---
  let tier: ReturnType<typeof normalizeTier> = 'pro'; // dev mode defaults to pro
  if (!isDevMode) {
    const { data: userRow } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', userId)
      .maybeSingle();

    tier = normalizeTier(userRow?.subscription_tier);
  }

  const auth: AuthContext = {
    userId,
    email: userEmail,
    clubId,
    tier,
  };

  // --- Create MCP server + transport ---
  const server = createMcpServer(supabase, auth);

  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);

    res.on('close', () => {
      transport.close();
      server.close();
    });
  } catch (error) {
    console.error('MCP request error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      });
    }
  }
}

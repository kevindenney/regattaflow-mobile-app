import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type AuthContext = {
  userId: string;
  email: string | null;
  clubId: string | null;
};

export type AuthenticatedRequest = VercelRequest & {
  supabase: SupabaseClient;
  auth: AuthContext;
};

type AuthOptions = {
  requireClub?: boolean;
};

type Handler = (req: AuthenticatedRequest, res: VercelResponse) => Promise<void> | void;

const MISSING_COLUMN_CODES = new Set(['42703', 'PGRST204', 'PGRST205']);

const isMissingColumnError = (error: any): boolean => {
  const code = String(error?.code ?? '');
  const message = String(error?.message ?? '').toLowerCase();
  return MISSING_COLUMN_CODES.has(code) || message.includes('column');
};

const extractBearerToken = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) return null;
  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
};

const resolveClubId = async (supabase: SupabaseClient, userId: string): Promise<string | null> => {
  const userSelects = [
    'active_organization_id, organization_id, club_id',
    'organization_id, club_id',
    'club_id',
  ];

  for (const fields of userSelects) {
    const { data, error } = await supabase
      .from('users')
      .select(fields)
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      if (isMissingColumnError(error)) {
        continue;
      }
      break;
    }

    const candidate =
      data?.active_organization_id ??
      data?.organization_id ??
      data?.club_id ??
      null;
    if (candidate && typeof candidate === 'string') {
      return candidate;
    }
  }

  const membership = await supabase
    .from('organization_memberships')
    .select('organization_id, status')
    .eq('user_id', userId)
    .in('status', ['active', 'verified'])
    .limit(1)
    .maybeSingle();

  if (!membership.error && membership.data?.organization_id) {
    return membership.data.organization_id;
  }

  const legacyClub = await supabase
    .from('club_staff')
    .select('club_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (!legacyClub.error && legacyClub.data?.club_id) {
    return legacyClub.data.club_id;
  }

  return null;
};

export const withAuth = (handler: Handler, options: AuthOptions = {}) => {
  return async (req: VercelRequest, res: VercelResponse) => {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      res.status(500).json({ error: 'Server auth is not configured' });
      return;
    }

    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const clubId = await resolveClubId(supabase, userData.user.id);
    if (options.requireClub && !clubId) {
      res.status(403).json({ error: 'Organization context required' });
      return;
    }

    const authedReq = req as AuthenticatedRequest;
    authedReq.supabase = supabase;
    authedReq.auth = {
      userId: userData.user.id,
      email: userData.user.email ?? null,
      clubId,
    };

    await handler(authedReq, res);
  };
};

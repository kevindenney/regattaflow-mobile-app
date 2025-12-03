/**
 * Public Notices API
 * Returns public notices for a regatta - NO AUTH REQUIRED
 * 
 * GET /api/public/regattas/[regattaId]/notices
 * 
 * Query params:
 *   - limit: Number of notices to return (default: 20)
 *   - priority: Filter by priority ('urgent' | 'important' | 'normal')
 */

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface PublicNotice {
  id: string;
  title: string;
  content: string;
  priority: 'urgent' | 'important' | 'normal';
  published_at: string;
  expires_at: string | null;
  attachments: {
    name: string;
    url: string;
    type: string;
  }[];
  author: string | null;
}

export interface PublicNoticesResponse {
  regatta: {
    id: string;
    name: string;
  };
  notices: PublicNotice[];
  metadata: {
    total_count: number;
    has_more: boolean;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for public access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { regattaId } = req.query;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const priority = req.query.priority as string | undefined;

  if (!regattaId || typeof regattaId !== 'string') {
    return res.status(400).json({ error: 'Missing regattaId parameter' });
  }

  try {
    // Fetch regatta info
    const { data: regatta, error: regattaError } = await supabase
      .from('regattas')
      .select('id, name')
      .eq('id', regattaId)
      .single();

    if (regattaError || !regatta) {
      return res.status(404).json({ error: 'Regatta not found' });
    }

    // Fetch public notices
    let noticesQuery = supabase
      .from('race_notices')
      .select(`
        id,
        title,
        content,
        priority,
        published_at,
        expires_at,
        attachments,
        visibility,
        users (
          full_name
        )
      `)
      .eq('regatta_id', regattaId)
      .eq('visibility', 'public')
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(limit + 1); // Fetch one extra to check if there's more

    if (priority) {
      noticesQuery = noticesQuery.eq('priority', priority);
    }

    const { data: notices, error: noticesError } = await noticesQuery;

    if (noticesError) {
      console.error('Error fetching notices:', noticesError);
      return res.status(500).json({ error: 'Failed to fetch notices' });
    }

    // Filter out expired notices
    const now = new Date();
    const validNotices = (notices || []).filter((n: any) => {
      if (!n.expires_at) return true;
      return new Date(n.expires_at) > now;
    });

    const hasMore = validNotices.length > limit;
    const returnedNotices = validNotices.slice(0, limit);

    const formattedNotices: PublicNotice[] = returnedNotices.map((n: any) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      priority: n.priority || 'normal',
      published_at: n.published_at,
      expires_at: n.expires_at,
      attachments: n.attachments || [],
      author: n.users?.full_name || null,
    }));

    const response: PublicNoticesResponse = {
      regatta: {
        id: regatta.id,
        name: regatta.name,
      },
      notices: formattedNotices,
      metadata: {
        total_count: formattedNotices.length,
        has_more: hasMore,
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Public notices API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


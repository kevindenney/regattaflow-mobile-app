/**
 * Public Regatta Info API
 * Returns regatta overview information - NO AUTH REQUIRED
 * 
 * GET /api/public/regattas/[regattaId]
 */

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface PublicRegattaInfo {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  venue: string | null;
  venue_coordinates: { lat: number; lng: number } | null;
  club: {
    id: string;
    name: string;
    logo_url: string | null;
    website: string | null;
  } | null;
  classes: string[];
  entry_fee: number | null;
  currency: string | null;
  registration_status: 'not_open' | 'open' | 'closed' | 'full';
  registration_deadline: string | null;
  entry_count: number;
  max_entries: number | null;
  status: string;
  contact_email: string | null;
  documents: {
    id: string;
    title: string;
    type: 'nor' | 'si' | 'amendment' | 'other';
    url: string;
    published_at: string;
  }[];
  links: {
    results: string;
    schedule: string;
    notices: string;
    entries: string;
  };
  qr_codes: {
    landing: string;
    results: string;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for public access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { regattaId } = req.query;

  if (!regattaId || typeof regattaId !== 'string') {
    return res.status(400).json({ error: 'Missing regattaId parameter' });
  }

  try {
    // Fetch regatta with club info
    const { data: regatta, error: regattaError } = await supabase
      .from('regattas')
      .select(`
        id,
        name,
        description,
        start_date,
        end_date,
        venue,
        venue_latitude,
        venue_longitude,
        boat_classes,
        entry_fee,
        currency,
        registration_open,
        registration_close,
        max_entries,
        status,
        contact_email,
        clubs (
          id,
          club_name,
          logo_url,
          website
        )
      `)
      .eq('id', regattaId)
      .single();

    if (regattaError || !regatta) {
      return res.status(404).json({ error: 'Regatta not found' });
    }

    // Count entries
    const { count: entryCount } = await supabase
      .from('race_entries')
      .select('*', { count: 'exact', head: true })
      .eq('regatta_id', regattaId)
      .in('status', ['confirmed', 'pending']);

    // Fetch public documents
    const { data: documents } = await supabase
      .from('regatta_documents')
      .select('id, title, document_type, url, published_at')
      .eq('regatta_id', regattaId)
      .eq('visibility', 'public')
      .order('published_at', { ascending: false });

    // Determine registration status
    const now = new Date();
    let registrationStatus: 'not_open' | 'open' | 'closed' | 'full' = 'not_open';
    
    if (regatta.registration_open && regatta.registration_close) {
      const openDate = new Date(regatta.registration_open);
      const closeDate = new Date(regatta.registration_close);
      
      if (now < openDate) {
        registrationStatus = 'not_open';
      } else if (now > closeDate) {
        registrationStatus = 'closed';
      } else if (regatta.max_entries && (entryCount || 0) >= regatta.max_entries) {
        registrationStatus = 'full';
      } else {
        registrationStatus = 'open';
      }
    }

    // Build base URL
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.EXPO_PUBLIC_API_URL || 'https://regattaflow.com';

    const response: PublicRegattaInfo = {
      id: regatta.id,
      name: regatta.name,
      description: regatta.description,
      start_date: regatta.start_date,
      end_date: regatta.end_date,
      venue: regatta.venue,
      venue_coordinates: regatta.venue_latitude && regatta.venue_longitude 
        ? { lat: regatta.venue_latitude, lng: regatta.venue_longitude }
        : null,
      club: regatta.clubs ? {
        id: (regatta.clubs as any).id,
        name: (regatta.clubs as any).club_name,
        logo_url: (regatta.clubs as any).logo_url,
        website: (regatta.clubs as any).website,
      } : null,
      classes: regatta.boat_classes || [],
      entry_fee: regatta.entry_fee,
      currency: regatta.currency,
      registration_status: registrationStatus,
      registration_deadline: regatta.registration_close,
      entry_count: entryCount || 0,
      max_entries: regatta.max_entries,
      status: regatta.status,
      contact_email: regatta.contact_email,
      documents: (documents || []).map((d: any) => ({
        id: d.id,
        title: d.title,
        type: d.document_type || 'other',
        url: d.url,
        published_at: d.published_at,
      })),
      links: {
        results: `${baseUrl}/p/results/${regattaId}`,
        schedule: `${baseUrl}/p/schedule/${regattaId}`,
        notices: `${baseUrl}/p/notices/${regattaId}`,
        entries: `${baseUrl}/p/entries/${regattaId}`,
      },
      qr_codes: {
        landing: `${baseUrl}/api/public/qr?url=${encodeURIComponent(`${baseUrl}/p/${regattaId}`)}`,
        results: `${baseUrl}/api/public/qr?url=${encodeURIComponent(`${baseUrl}/p/results/${regattaId}`)}`,
      },
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Public regatta API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


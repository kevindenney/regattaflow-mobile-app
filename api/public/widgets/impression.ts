/**
 * Widget Impression Tracking API
 * Records widget impressions for analytics
 * 
 * POST /api/public/widgets/impression
 */

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, clubId, regattaId, domain, path, widgetToken } = req.body;

    // Basic validation
    if (!type) {
      return res.status(400).json({ error: 'Missing widget type' });
    }

    // Get IP and user agent
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    const referrer = req.headers['referer'] || null;

    // Log the impression
    await supabase.from('public_access_log').insert({
      resource_type: 'widget',
      resource_id: widgetToken || null,
      regatta_id: regattaId || null,
      club_id: clubId || null,
      ip_address: typeof ip === 'string' ? ip.split(',')[0].trim() : null,
      user_agent: userAgent,
      referrer: referrer,
      widget_token: widgetToken,
      embedding_domain: domain,
    });

    // If we have a widget token, increment the impression count
    if (widgetToken) {
      await supabase.rpc('increment_widget_impressions', { 
        widget_token_param: widgetToken 
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Widget impression tracking error:', error);
    // Don't fail the request - impressions are non-critical
    return res.status(200).json({ success: true });
  }
}


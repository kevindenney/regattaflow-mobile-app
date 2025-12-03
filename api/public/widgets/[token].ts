/**
 * Widget Configuration API
 * Returns widget configuration and data for embedding
 * 
 * GET /api/public/widgets/[token]
 */

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Missing widget token' });
  }

  try {
    // Fetch widget configuration
    const { data: widget, error: widgetError } = await supabase
      .from('club_widgets')
      .select(`
        id,
        club_id,
        regatta_id,
        widget_type,
        name,
        theme,
        accent_color,
        width,
        height,
        border_radius,
        show_branding,
        custom_css,
        filters,
        allowed_domains,
        active,
        clubs (
          id,
          club_name,
          logo_url
        ),
        regattas (
          id,
          name,
          start_date,
          end_date,
          venue
        )
      `)
      .eq('embed_token', token)
      .single();

    if (widgetError || !widget) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    if (!widget.active) {
      return res.status(403).json({ error: 'Widget is disabled' });
    }

    // Check domain whitelist if configured
    const origin = req.headers.origin;
    if (widget.allowed_domains && widget.allowed_domains.length > 0 && origin) {
      const domain = new URL(origin).hostname;
      const allowed = widget.allowed_domains.some((d: string) => 
        d === domain || domain.endsWith(`.${d}`)
      );
      
      if (!allowed) {
        return res.status(403).json({ error: 'Domain not allowed for this widget' });
      }
    }

    // Increment embed count
    await supabase
      .from('club_widgets')
      .update({
        embed_count: (widget as any).embed_count + 1,
        last_embedded_at: new Date().toISOString(),
      })
      .eq('id', widget.id);

    // Return widget configuration
    return res.status(200).json({
      id: widget.id,
      type: widget.widget_type,
      name: widget.name,
      config: {
        theme: widget.theme,
        accentColor: widget.accent_color,
        width: widget.width,
        height: widget.height,
        borderRadius: widget.border_radius,
        showBranding: widget.show_branding,
        customCSS: widget.custom_css,
        filters: widget.filters,
      },
      club: widget.clubs ? {
        id: (widget.clubs as any).id,
        name: (widget.clubs as any).club_name,
        logo: (widget.clubs as any).logo_url,
      } : null,
      regatta: widget.regattas ? {
        id: (widget.regattas as any).id,
        name: (widget.regattas as any).name,
        startDate: (widget.regattas as any).start_date,
        endDate: (widget.regattas as any).end_date,
        venue: (widget.regattas as any).venue,
      } : null,
    });
  } catch (error) {
    console.error('Widget API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


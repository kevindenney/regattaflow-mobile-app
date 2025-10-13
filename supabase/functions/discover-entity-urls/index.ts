/**
 * Discover Entity URLs Edge Function
 * Uses Anthropic Claude to suggest official website URLs for sailing entities
 * This runs server-side to protect API keys
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

interface DiscoverRequest {
  entities: {
    clubs?: Array<{ name: string; confidence: number }>;
    boatClasses?: Array<{ name: string; confidence: number }>;
    classAssociations?: string[];
  };
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { entities } = (await req.json()) as DiscoverRequest;

    const discovered: Array<{ url: string; type: string; source: string; confidence: number }> = [];

    // Build search queries
    const searches: Array<{ query: string; type: string; entity: string }> = [];

    entities.clubs?.forEach((club) => {
      if (club.confidence > 0.7) {
        searches.push({
          query: `${club.name} yacht club website`,
          type: 'club',
          entity: club.name,
        });
      }
    });

    entities.boatClasses?.forEach((boatClass) => {
      if (boatClass.confidence > 0.7) {
        searches.push({
          query: `${boatClass.name} class association website`,
          type: 'class',
          entity: boatClass.name,
        });
      }
    });

    entities.classAssociations?.forEach((assoc) => {
      searches.push({
        query: `${assoc} website`,
        type: 'class',
        entity: assoc,
      });
    });

    // Use Claude to suggest likely URLs based on entity names (limit to 5)
    for (const search of searches.slice(0, 5)) {
      const prompt = `What is the most likely official website URL for: "${search.entity}"?

Context: This is a ${search.type === 'club' ? 'yacht club' : 'boat class association'}.

Return ONLY the URL, nothing else. If you're not confident, return "UNKNOWN".

Examples:
- "Royal Hong Kong Yacht Club" → https://www.rhkyc.org.hk
- "San Diego Yacht Club" → https://www.sdyc.org
- "International Dragon Class" → https://intdragon.net
- "J/70 Class" → https://www.j70.org`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 100,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.content[0];
        if (content.type === 'text') {
          const url = content.text.trim();
          if (url !== 'UNKNOWN' && url.startsWith('http')) {
            discovered.push({
              url,
              type: search.type,
              source: search.entity,
              confidence: 0.8,
            });
          }
        }
      }
    }

    return new Response(JSON.stringify({ discovered }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * weather-proxy
 *
 * Server-side proxy for Open-Meteo weather and marine APIs.
 * Eliminates CORS issues from browser and enables server-side caching.
 *
 * Input: { endpoint: 'forecast' | 'marine', params: Record<string, string> }
 * Returns: The raw Open-Meteo JSON response.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

const ENDPOINTS: Record<string, string> = {
  forecast: 'https://api.open-meteo.com/v1/forecast',
  marine: 'https://marine-api.open-meteo.com/v1/marine',
};

// Simple in-memory cache (edge functions are short-lived, but helps with burst requests)
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { endpoint, params } = await req.json();

    if (!endpoint || !ENDPOINTS[endpoint]) {
      return new Response(
        JSON.stringify({ error: `Invalid endpoint. Use: ${Object.keys(ENDPOINTS).join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!params || typeof params !== 'object') {
      return new Response(
        JSON.stringify({ error: 'params object required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const searchParams = new URLSearchParams(params);
    const url = `${ENDPOINTS[endpoint]}?${searchParams}`;

    // Check cache
    const cacheKey = url;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return new Response(
        JSON.stringify(cached.data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } },
      );
    }

    // Fetch from Open-Meteo
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'BetterAt/1.0 (Sailing Weather Proxy)',
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Open-Meteo returned ${response.status}`, upstream_status: response.status }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const data = await response.json();

    // Cache the result
    cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL });

    // Evict old entries (keep cache bounded)
    if (cache.size > 100) {
      const now = Date.now();
      for (const [key, entry] of cache) {
        if (entry.expiresAt < now) cache.delete(key);
      }
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' } },
    );
  } catch (error: unknown) {
    const message = error instanceof Error
      ? (error.name === 'AbortError' ? 'Upstream timeout' : error.message)
      : 'Internal error';
    console.error('weather-proxy error:', error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

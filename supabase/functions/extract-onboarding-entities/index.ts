/**
 * Extract Onboarding Entities Edge Function
 * Uses Anthropic Claude to extract sailing entities from free-form text
 * This runs server-side to protect API keys
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

interface ExtractRequest {
  text: string;
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

    const { text } = (await req.json()) as ExtractRequest;

    if (!text || !text.trim()) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Call Anthropic API
    const prompt = `You are an expert at extracting sailing-related information from text.

Extract the following entities from this text and return them in a structured JSON format:

<text>
${text}
</text>

Extract:
1. **clubs**: Yacht club names (e.g., "Royal Hong Kong Yacht Club", "SDYC")
2. **venues**: Sailing venues or locations
3. **boatClasses**: Boat classes (e.g., "Dragon", "J/70", "Laser")
4. **sailNumbers**: Sail numbers (e.g., "D59", "USA 123", "59")
5. **boatNames**: Boat names (e.g., "Dragonfly", "Sea Breeze")
6. **role**: Is the person an "owner", "crew", or "both"?
7. **crewMembers**: Names of crew members with optional positions
8. **sailMakers**, **hullMakers**, **mastMakers**, **rigMakers**: Equipment manufacturers
9. **classAssociations**: Class associations mentioned
10. **urls**: Any URLs found, categorized as 'club', 'class', 'calendar', or 'unknown'

For each entity, include a confidence score (0-1).

Return ONLY valid JSON in this exact format:
{
  "clubs": [{"name": "string", "confidence": 0.95}],
  "venues": [{"name": "string", "location": "string", "confidence": 0.9}],
  "boatClasses": [{"name": "string", "confidence": 0.95}],
  "sailNumbers": [{"number": "string", "boatClass": "string", "confidence": 0.9}],
  "boatNames": [{"name": "string", "sailNumber": "string", "confidence": 0.85}],
  "role": "owner" | "crew" | "both",
  "crewMembers": [{"name": "string", "position": "string"}],
  "sailMakers": ["string"],
  "hullMakers": ["string"],
  "mastMakers": ["string"],
  "rigMakers": ["string"],
  "classAssociations": ["string"],
  "urls": [{"url": "string", "type": "club" | "class" | "calendar" | "unknown", "confidence": 0.9}]
}

Important:
- Normalize boat class names (e.g., "j70" → "J/70", "dragons" → "Dragon")
- Extract sail numbers with their class prefix if mentioned (e.g., "D59" for Dragon 59)
- Identify URL types based on content/path (e.g., ".../dragon" likely = class)
- If information is ambiguous, use lower confidence scores
- Return empty arrays for missing data, not null`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return new Response(JSON.stringify({ error: 'AI extraction failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.content[0];

    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const entities = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify({
        ...entities,
        originalText: text,
        urls: entities.urls || [],
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
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

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

/**
 * Lightweight Race Info Extraction
 * For quick extraction during sailor onboarding
 * Extracts: race name, date, time, location, marks
 */

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, type } = await req.json();

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No text provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      console.error('[extract-race-info] ANTHROPIC_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use a quick, focused prompt for fast extraction
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: `Extract key race information from this sailing document (${type === 'si_nor' ? 'Sailing Instructions/Notice of Race' : 'racing calendar'}).

Document:
${text.substring(0, 4000)}

Return ONLY a JSON object with these fields (set null if not found):
{
  "raceName": "string - full race/regatta name",
  "date": "string - YYYY-MM-DD format if possible",
  "startTime": "string - HH:MM format if possible",
  "location": "string - venue/location name",
  "marks": ["array of mark names mentioned"],
  "courseDescription": "string - brief course layout description",
  "windLimits": "string - any wind restrictions mentioned",
  "organizer": "string - organizing club/authority"
}

Return ONLY valid JSON, no other text.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[extract-race-info] Claude API error:', response.status, errorText.substring(0, 200));
      return new Response(
        JSON.stringify({ success: false, error: 'AI extraction failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    let content = result.content[0].text.trim();

    // Clean markdown code fences
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Parse JSON
    let extracted;
    try {
      extracted = JSON.parse(content);
    } catch (parseError) {
      console.error('[extract-race-info] JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse extraction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        extracted,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[extract-race-info] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


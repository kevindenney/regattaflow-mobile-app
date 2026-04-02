import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { callGemini } from '../_shared/gemini.ts';

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

    // Use Gemini Flash for fast extraction
    const prompt = `Extract key race information from this sailing document (${type === 'si_nor' ? 'Sailing Instructions/Notice of Race' : 'racing calendar'}).

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

Return ONLY valid JSON, no other text.`;

    let content: string;
    try {
      content = await callGemini({
        userContent: [{ text: prompt }],
        maxOutputTokens: 1024,
        temperature: 0,
      });
      content = content.trim();
    } catch (aiError: any) {
      console.error('[extract-race-info] Gemini API error:', aiError.message);
      return new Response(
        JSON.stringify({ success: false, error: 'AI extraction failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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


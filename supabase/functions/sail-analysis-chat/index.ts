import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { complete } from '../_shared/ai/provider.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, imageBase64, mediaType = 'image/jpeg', max_tokens = 2048 } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({ error: 'prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return new Response(
        JSON.stringify({ error: 'imageBase64 is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call AI with image + text
    let text: string;
    try {
      const result = await complete({
        task: 'analysis',
        messages: [{
          role: 'user',
          content: [
            { type: 'inline_data', mimeType: mediaType, data: imageBase64 },
            { type: 'text', text: prompt },
          ],
        }],
        maxOutputTokens: Math.min(Number(max_tokens) || 2048, 4096),
        temperature: 0.2,
      });
      text = result.text;
    } catch (aiError: any) {
      return new Response(
        JSON.stringify({ error: 'AI request failed', details: aiError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * inspiration-extract
 *
 * Accepts inspiring content (URL, pasted text, or free-form description)
 * and returns a structured extraction: proposed interest, blueprint steps,
 * cross-interest overlaps, and a source summary.
 *
 * Input:
 *   {
 *     content_type: 'url' | 'text' | 'description',
 *     content: string,
 *     user_existing_interest_slugs: string[]
 *   }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { complete } from '../_shared/ai/provider.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { authenticate, extractJson } from '../_shared/playbook.ts';

// ---------------------------------------------------------------------------
// URL content fetching (reuses extract-url-metadata via internal call)
// ---------------------------------------------------------------------------

async function fetchUrlContent(
  url: string,
  authHeader: string,
): Promise<{ title: string | null; body_text: string | null }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const resp = await fetch(
    `${supabaseUrl}/functions/v1/extract-url-metadata`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({ url }),
    },
  );
  if (!resp.ok) {
    console.warn(`[inspiration-extract] URL metadata fetch failed: ${resp.status}`);
    return { title: null, body_text: null };
  }
  const meta = await resp.json();
  return {
    title: meta.title ?? null,
    body_text: meta.body_text ?? null,
  };
}

// ---------------------------------------------------------------------------
// Extraction prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an expert skill analyst and learning plan designer.

Given inspiring content about someone's pursuit, activity, or competition, extract:

1. A proposed INTEREST (the skill/pursuit this represents)
2. A sequenced BLUEPRINT of 8–15 learning steps to develop the needed skills
3. Cross-references to the user's existing interests where skills overlap

IMPORTANT RULES:
- Step categories must be one of: general, nutrition, strength, cardio, hiit, sport, race_day_check, reading
- Use "general" for skills that don't fit other categories (navigation, knot-tying, gear prep, etc.)
- Use "sport" for sport-specific drills and skills
- Use "strength" or "cardio" for fitness-oriented steps
- Use "reading" for research/study steps
- Keep step titles actionable and concise (under 60 chars)
- Sub-steps should be concrete, specific actions (3–6 per step)
- Reasoning should explain WHY this step matters in the learning sequence
- Icon names must be valid Ionicons names. Pick the most SPECIFIC icon for the domain. Good examples:
  Sports/outdoors: bicycle, car-sport, boat, football, tennisball, golf, fish, trail-sign
  Fitness: barbell, fitness, body, walk, footsteps
  Creative: brush, color-palette, musical-notes, camera, film, easel
  Tech: code-slash, hardware-chip, laptop, globe, server
  Navigation: compass, map, navigate, location
  Medical: medkit, heart, pulse, bandage
  Education: school, library, book
  Food: restaurant, nutrition, cafe, wine, beer
  Music: musical-notes, headset, mic, radio
  Always prefer filled icons over outline variants for the interest icon.
- Accent colors should be hex codes evocative of the domain
- Suggested domain slug should be one of: sports-outdoors, creative-arts, healthcare, education-learning, technology, professional, music, agriculture-environment, crafts, other

Respond with ONLY a JSON object matching this schema:
{
  "proposed_interest": {
    "name": "string (2-4 words)",
    "slug": "string (kebab-case)",
    "description": "string (1-2 sentences)",
    "suggested_domain_slug": "string",
    "accent_color": "#hex",
    "icon_name": "string (Ionicons)"
  },
  "blueprint": {
    "title": "string (learning plan title)",
    "description": "string (1-2 sentences)",
    "steps": [
      {
        "title": "string",
        "description": "string",
        "category": "string (from allowed list)",
        "order": 1,
        "sub_steps": ["string"],
        "reasoning": "string",
        "estimated_duration_days": 7,
        "cross_interest_slugs": ["string (only slugs from user's existing interests)"]
      }
    ]
  },
  "source_summary": "string (2-3 sentence summary of the inspiring content)",
  "existing_interest_overlaps": [
    { "slug": "string", "relevance": "string (1 sentence)" }
  ],
  "confidence": 0.9
}`;

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Helper to attach CORS headers to any response
  const withCors = (resp: Response): Response => {
    const headers = new Headers(resp.headers);
    for (const [k, v] of Object.entries(corsHeaders)) {
      headers.set(k, v);
    }
    return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers });
  };

  try {
    const auth = await authenticate(req);
    if (auth instanceof Response) return withCors(auth);

    const body = await req.json();
    const { content_type, content, user_existing_interest_slugs = [] } = body;

    if (!content_type || !content) {
      return new Response(JSON.stringify({ error: 'content_type and content are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!['url', 'text', 'description'].includes(content_type)) {
      return new Response(JSON.stringify({ error: 'content_type must be url, text, or description' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve content to analyzable text
    let analyzableContent = content;
    let sourceTitle: string | null = null;

    if (content_type === 'url') {
      const authHeader = req.headers.get('Authorization') ?? '';
      const urlContent = await fetchUrlContent(content, authHeader);
      sourceTitle = urlContent.title;

      if (urlContent.body_text) {
        analyzableContent = `Source URL: ${content}\nTitle: ${urlContent.title ?? 'Unknown'}\n\nContent:\n${urlContent.body_text}`;
      } else {
        // URL fetch failed — fall back to just the URL
        analyzableContent = `Source URL: ${content}\nTitle: ${urlContent.title ?? 'Unknown'}\n\n(Could not fetch full page content. Analyze based on the URL and title.)`;
      }
    }

    // Build the user message
    const interestContext =
      user_existing_interest_slugs.length > 0
        ? `\n\nThe user's existing interests: ${user_existing_interest_slugs.join(', ')}`
        : '\n\nThe user has no existing interests yet.';

    const userMessage = `Here is the inspiring content the user wants to learn from:\n\n---\n${analyzableContent}\n---${interestContext}\n\nExtract a structured learning plan from this content.`;

    // Call AI
    const { text } = await complete({
      task: 'extraction',
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
      maxOutputTokens: 4096,
    });

    const extraction = extractJson(text);

    // Validate minimum structure
    if (
      !extraction ||
      typeof extraction !== 'object' ||
      !('proposed_interest' in extraction) ||
      !('blueprint' in extraction)
    ) {
      console.error('[inspiration-extract] Invalid extraction shape:', text.slice(0, 500));
      return new Response(
        JSON.stringify({ error: 'AI extraction returned invalid structure. Please try again.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Attach source title if we fetched it
    if (sourceTitle && extraction.proposed_interest) {
      (extraction as Record<string, unknown>).source_title = sourceTitle;
    }

    return new Response(JSON.stringify(extraction), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[inspiration-extract] Error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

/**
 * race-conditions-brief
 *
 * Generates a personalized race conditions brief using Gemini.
 * Combines weather/tide data with the user's Playbook concepts
 * to produce actionable, personal tactical advice.
 *
 * Input: {
 *   interest_id: string,
 *   weather: { wind_speed_kt, wind_direction, gusts_kt?, wave_height_m?, temperature_c? },
 *   tide: { state, height_m, current_speed_kt?, current_direction? },
 *   race_title?: string,
 *   boat_class?: string,
 * }
 *
 * Returns: { brief_md: string, key_points: string[] }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { callGemini, extractJson } from '../_shared/gemini.ts';
import {
  authenticate,
  corsHeaders,
  jsonResponse,
} from '../_shared/playbook.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const auth = await authenticate(req);
    if (auth instanceof Response) return auth;
    const { userId, supabase } = auth;

    const body = await req.json();
    const { interest_id, weather, tide, race_title, boat_class } = body;

    if (!interest_id || !weather) {
      return jsonResponse({ error: 'interest_id and weather required' }, 400);
    }

    // Find the user's playbook for this interest
    const { data: playbook } = await supabase
      .from('playbooks')
      .select('id')
      .eq('user_id', userId)
      .eq('interest_id', interest_id)
      .maybeSingle();

    // Load relevant concepts (personal + baselines)
    let conceptsContext = '(No playbook concepts yet — give generic sailing advice)';
    if (playbook) {
      const { data: concepts = [] } = await supabase
        .from('playbook_concepts')
        .select('title, body_md')
        .or(
          `playbook_id.eq.${playbook.id},and(playbook_id.is.null,interest_id.eq.${interest_id})`,
        )
        .limit(15);

      if (concepts && concepts.length > 0) {
        conceptsContext = (concepts as { title: string; body_md: string }[])
          .map((c) => `### ${c.title}\n${(c.body_md || '').slice(0, 600)}`)
          .join('\n\n');
      }
    }

    // Load recent debriefs with similar conditions for pattern matching
    const windSpeed = weather.wind_speed_kt || 0;
    const { data: recentSteps = [] } = await supabase
      .from('timeline_steps')
      .select('title, metadata')
      .eq('user_id', userId)
      .eq('interest_id', interest_id)
      .order('starts_at', { ascending: false })
      .limit(10);

    const debriefSnippets = (recentSteps ?? [])
      .filter(
        (s: { metadata?: Record<string, unknown> }) =>
          (s.metadata as Record<string, unknown>)?.review,
      )
      .slice(0, 3)
      .map(
        (s: { title: string; metadata: Record<string, unknown> }) =>
          `- ${s.title}: ${JSON.stringify((s.metadata as Record<string, unknown>).review).slice(0, 300)}`,
      )
      .join('\n');

    const system = `You are a sailing coach writing a pre-race conditions brief for a sailor. You know this sailor's personal knowledge base (their Playbook concepts) and their recent race debriefs.

Your brief should be:
1. PERSONAL — reference specific concepts from their Playbook when relevant (e.g., "Based on your 'Heavy Air Downwind' notes, you'll want...")
2. ACTIONABLE — specific settings, tactics, and decisions, not generic advice
3. CONCISE — 3-5 short paragraphs max, bullet points welcome
4. HONEST — if conditions are outside their documented experience, say so

Return ONLY a JSON object:
{
  "brief_md": "<markdown brief — personal, tactical, actionable>",
  "key_points": ["<3-5 one-line takeaways for quick reference>"]
}`;

    const conditionsBlock = [
      `Wind: ${weather.wind_speed_kt || '?'}kt from ${weather.wind_direction || '?'}`,
      weather.gusts_kt ? `Gusts: ${weather.gusts_kt}kt` : null,
      weather.wave_height_m ? `Waves: ${weather.wave_height_m}m` : null,
      weather.temperature_c ? `Temp: ${weather.temperature_c}°C` : null,
      tide ? `Tide: ${tide.state || '?'} at ${tide.height_m || '?'}m` : null,
      tide?.current_speed_kt
        ? `Current: ${tide.current_speed_kt}kt ${tide.current_direction || ''}`
        : null,
    ]
      .filter(Boolean)
      .join('\n');

    const userPrompt = `${race_title ? `RACE: ${race_title}\n` : ''}${boat_class ? `BOAT: ${boat_class}\n` : ''}
CONDITIONS:
${conditionsBlock}

SAILOR'S PLAYBOOK CONCEPTS:
${conceptsContext}

${debriefSnippets ? `RECENT DEBRIEFS IN SIMILAR CONDITIONS:\n${debriefSnippets}` : ''}`;

    const aiText = await callGemini({
      system,
      userContent: [{ text: userPrompt }],
      maxOutputTokens: 1000,
      temperature: 0.4,
    });

    let parsed: { brief_md?: string; key_points?: string[] } = {};
    try {
      parsed = extractJson(aiText);
    } catch {
      parsed = { brief_md: aiText, key_points: [] };
    }

    return jsonResponse({
      brief_md: parsed.brief_md || aiText,
      key_points: parsed.key_points || [],
    });
  } catch (err) {
    console.error('race-conditions-brief error', err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'Internal error' },
      500,
    );
  }
});

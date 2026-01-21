import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

/**
 * Generate Race Briefing Edge Function
 * AI-powered generation of strategic race briefings
 * Works for both fleet racing and distance racing
 */

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { race, weather, raceType } = await req.json();

    if (!race) {
      return new Response(
        JSON.stringify({ error: 'No race data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context for the AI
    const raceContext = buildRaceContext(race, weather, raceType);

    // Generate strategy using Claude
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4096,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: `You are an expert sailing tactician helping a sailor prepare for a race. Generate strategic recommendations based on the race conditions.

RACE CONTEXT:
${raceContext}

Generate a strategic briefing with the following JSON structure:

{
  "keyPoints": [
    {
      "title": string,  // Short title (e.g., "Start Strategy", "First Beat", "Tide Window")
      "content": string,  // Detailed recommendation (1-2 sentences)
      "priority": "critical" | "important" | "consider"
    }
  ],
  "decisionPoints": [
    {
      "question": string,  // Decision to make (e.g., "Which end of the start line?")
      "options": string[]  // 2-3 options to consider
    }
  ],
  "warnings": string[]  // Important warnings or hazards to be aware of
}

GUIDELINES:
${raceType === 'distance' ? `
- This is a DISTANCE RACE (offshore/passage racing)
- Focus on: route optimization, tide gates, weather windows, pacing strategy
- Consider: VMG routing, when to push vs. conserve, crew rotation if applicable
- Include timing recommendations for key waypoints
- Warn about shipping lanes, navigation hazards, weather changes
` : `
- This is a FLEET RACE (buoy racing)
- Focus on: start strategy, upwind/downwind tactics, mark roundings, fleet positioning
- Consider: current effects, wind shifts, favored side of the course
- Include recommendations for each phase of the race
- Warn about crowd management, tide effects at marks
`}

Generate 3-5 key points, 2-3 decision points, and 1-3 warnings based on the conditions.
Be specific and actionable - avoid generic advice. Reference the actual conditions provided.

Return ONLY valid JSON, no other text.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-race-briefing] Anthropic API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate briefing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      console.error('[generate-race-briefing] No content in response');
      return new Response(
        JSON.stringify({ error: 'No strategy generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    let strategy;
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      strategy = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('[generate-race-briefing] Failed to parse strategy:', parseError);
      // Return a basic strategy if parsing fails
      strategy = {
        keyPoints: [
          {
            title: 'Assess Conditions',
            content: 'Check wind direction and speed before the start. Position for clear air.',
            priority: 'critical',
          },
        ],
        decisionPoints: [
          {
            question: 'Start line bias?',
            options: ['Pin end', 'Boat end', 'Middle'],
          },
        ],
        warnings: ['Always maintain situational awareness'],
      };
    }

    return new Response(
      JSON.stringify({ strategy }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[generate-race-briefing] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Build race context string for the AI prompt
 */
function buildRaceContext(race: any, weather: any, raceType: string): string {
  const lines: string[] = [];
  
  lines.push(`Race: ${race.name}`);
  lines.push(`Type: ${raceType === 'distance' ? 'Distance/Offshore Race' : 'Fleet Race'}`);
  lines.push(`Date: ${race.start_date}`);
  lines.push(`Venue: ${race.metadata?.venue_name || 'Unknown'}`);
  
  // Weather conditions
  const wind = weather?.wind || race.metadata?.wind;
  if (wind) {
    lines.push(`Wind: ${wind.direction} ${wind.speedMin || wind.speed}-${wind.speedMax || wind.speed} knots`);
  }
  
  const tide = weather?.tide || race.metadata?.tide;
  if (tide) {
    lines.push(`Tide: ${tide.state}${tide.height ? ` (${tide.height}m)` : ''}${tide.direction ? `, flowing ${tide.direction}` : ''}`);
  }
  
  // Race-specific info
  if (race.warning_signal_time) {
    lines.push(`First Warning: ${race.warning_signal_time}`);
  }
  
  if (raceType === 'distance') {
    // Distance race specific
    if (race.total_distance_nm) {
      lines.push(`Total Distance: ${race.total_distance_nm} nm`);
    }
    if (race.time_limit_hours) {
      lines.push(`Time Limit: ${race.time_limit_hours} hours`);
    }
    if (race.route_waypoints?.length) {
      lines.push(`Waypoints: ${race.route_waypoints.map((w: any) => w.name).join(' → ')}`);
    }
    if (race.racing_area_description) {
      lines.push(`Course: ${race.racing_area_description}`);
    }
  } else {
    // Fleet race specific
    if (race.start_sequence_details?.length) {
      const classes = race.start_sequence_details.map((s: any) => s.class).join(', ');
      lines.push(`Classes: ${classes}`);
    }
    if (race.start_strategy) {
      lines.push(`Start Notes: ${race.start_strategy}`);
    }
    if (race.favored_side) {
      lines.push(`Favored Side: ${race.favored_side}`);
    }
    if (race.potential_courses?.length) {
      lines.push(`Possible Courses: ${race.potential_courses.join(', ')}`);
    }
  }
  
  // Venue notes
  if (race.venue_specific_notes) {
    lines.push(`Venue Notes: ${race.venue_specific_notes}`);
  }
  
  // Prohibited areas
  if (race.prohibited_areas?.length) {
    lines.push(`Prohibited Areas: ${race.prohibited_areas.map((a: any) => a.name).join(', ')}`);
  }
  
  return lines.join('\n');
}


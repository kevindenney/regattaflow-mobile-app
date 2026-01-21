import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RaceAnalysisRequest {
  timerSessionId: string;
  force?: boolean;
}

/**
 * Race Analysis Edge Function
 *
 * Authenticates the user, validates the race session,
 * and triggers AI-powered race analysis using Claude with Skills.
 */
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract authorization token
    const authHeader = req.headers.get('authorization');

    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create TWO Supabase clients:
    // 1. Client with user context for auth verification
    // 2. Service role client for database operations (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Client for auth verification (uses user's JWT)
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Client for database operations (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      console.error('User present:', !!user);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { timerSessionId, force = false }: RaceAnalysisRequest = await req.json();

    if (!timerSessionId) {
      console.error('Missing timerSessionId in request body');
      return new Response(
        JSON.stringify({ error: 'timerSessionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch race session and verify ownership (use admin client to bypass RLS)
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('race_timer_sessions')
      .select('id, sailor_id, end_time, auto_analyzed')
      .eq('id', timerSessionId)
      .single();

    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Race session not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (session.sailor_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'You are not allowed to analyze this race' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!session.end_time) {
      return new Response(
        JSON.stringify({ error: 'Race has not finished yet' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing analysis
    const { data: existingAnalysis } = await supabaseAdmin
      .from('ai_coach_analysis')
      .select('*')
      .eq('timer_session_id', timerSessionId)
      .maybeSingle();

    if (existingAnalysis && !force) {
      return new Response(
        JSON.stringify({
          success: true,
          analysis: existingAnalysis,
          message: 'Analysis already exists',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch race data for analysis (simplified - no complex joins)
    const { data: raceData, error: raceError } = await supabaseAdmin
      .from('race_timer_sessions')
      .select('*')
      .eq('id', timerSessionId)
      .single();

    if (raceError || !raceData) {
      console.error('Race data error:', raceError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch race data', details: raceError?.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Optionally fetch course data if course_id exists
    let courseData = null;
    if (raceData.course_id) {
      const { data: course } = await supabaseAdmin
        .from('race_courses')
        .select('name, course_type')
        .eq('id', raceData.course_id)
        .maybeSingle();
      courseData = course;
    }

    // Merge course data into raceData for prompt
    const enrichedRaceData = { ...raceData, race_courses: courseData };

    // Fetch sailor's past learnings for personalized analysis
    const { data: pastLearnings } = await supabaseAdmin
      .from('learnable_events')
      .select('title, action_text, outcome, event_type, conditions_context')
      .eq('sailor_id', user.id)
      .eq('nudge_eligible', true)
      .eq('dismissed', false)
      .order('created_at', { ascending: false })
      .limit(10);

    // Call Claude API for race analysis
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: 'Anthropic API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = buildRaceAnalysisPrompt(enrichedRaceData, pastLearnings || []);

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error status:', claudeResponse.status);
      console.error('Claude API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate analysis', details: `Claude API returned ${claudeResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const claudeResult = await claudeResponse.json();
    const analysisText = claudeResult.content?.[0]?.text || '';

    // Parse the analysis and save to database
    const analysis = parseAnalysisResult(analysisText);

    // Delete existing analysis if force regenerate
    if (existingAnalysis) {
      await supabaseAdmin
        .from('ai_coach_analysis')
        .delete()
        .eq('timer_session_id', timerSessionId);
    }

    // Insert new analysis - use columns that match the actual database schema
    const { data: savedAnalysis, error: saveError } = await supabaseAdmin
      .from('ai_coach_analysis')
      .insert({
        timer_session_id: timerSessionId,
        overall_summary: analysis.overall_summary,
        start_analysis: analysis.start_analysis,
        upwind_analysis: analysis.upwind_analysis,
        downwind_analysis: analysis.downwind_analysis,
        tactical_decisions: analysis.tactical_decisions,
        boat_handling: analysis.boat_handling,
        recommendations: analysis.recommendations,
        confidence_score: analysis.confidence_score,
        model_used: 'claude-3-haiku-20240307',
        analysis_version: '1.0',
      })
      .select()
      .single();

    if (saveError) {
      console.error('Save error:', saveError);
      console.error('Save error details:', JSON.stringify(saveError, null, 2));
      return new Response(
        JSON.stringify({ error: 'Failed to save analysis', details: saveError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark session as analyzed
    await supabaseAdmin
      .from('race_timer_sessions')
      .update({ auto_analyzed: true })
      .eq('id', timerSessionId);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: savedAnalysis,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Format past learnings for inclusion in prompt
 */
function formatPastLearnings(learnings: any[]): string {
  if (!learnings || learnings.length === 0) {
    return '';
  }

  const formattedLearnings = learnings.map(l => {
    const outcomeEmoji = l.outcome === 'positive' ? '✅' : l.outcome === 'negative' ? '⚠️' : '📝';
    return `${outcomeEmoji} ${l.title}: ${l.action_text}`;
  }).join('\n');

  return `
Sailor's Past Learnings:
The following are insights and learnings this sailor has noted from previous races.
Reference these in your analysis when relevant, especially if patterns repeat or progress is evident.

${formattedLearnings}

`;
}

/**
 * Format phase ratings for inclusion in prompt (legacy format)
 */
function formatPhaseRatings(phaseRatings: any): string {
  if (!phaseRatings || Object.keys(phaseRatings).length === 0) {
    return '';
  }

  const phaseLabels: Record<string, string> = {
    prestart: 'Pre-start',
    start: 'Start',
    upwind: 'Upwind',
    windwardMark: 'Windward Mark',
    downwind: 'Downwind',
    leewardMark: 'Leeward Mark',
  };

  const phaseOrder = ['prestart', 'start', 'upwind', 'windwardMark', 'downwind', 'leewardMark'];

  const formattedPhases = phaseOrder
    .filter(phase => phaseRatings[phase]?.rating)
    .map(phase => {
      const rating = phaseRatings[phase].rating;
      const note = phaseRatings[phase].note || '';
      const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      return `- ${phaseLabels[phase]}: ${stars} (${rating}/5)${note ? ` - "${note}"` : ''}`;
    })
    .join('\n');

  if (!formattedPhases) {
    return '';
  }

  return `
Sailor's Self-Assessment by Phase:
The sailor rated each phase of the race immediately after finishing.
Use these self-assessments to guide your analysis - validate their perceptions or gently challenge where needed.

${formattedPhases}

`;
}

/**
 * Format debrief interview responses for inclusion in prompt
 */
function formatDebriefResponses(debriefResponses: any): string {
  if (!debriefResponses || Object.keys(debriefResponses).length === 0) {
    return '';
  }

  // Question ID to human-readable label mapping
  const questionLabels: Record<string, string> = {
    // Prep
    prep_equipment_rating: 'Equipment setup rating',
    prep_sail_choice: 'Right sail choice',
    prep_notes: 'Prep notes',
    // Pre-start
    prestart_routine_rating: 'Pre-start routine rating',
    prestart_line_sight: 'Got good line sight',
    prestart_clear_air: 'Clear air location',
    prestart_favored_end: 'Favored end',
    // Start
    start_position: 'Start position',
    start_speed: 'Speed at line',
    start_timing: 'Start timing',
    start_notes: 'Start notes',
    // Upwind
    upwind_rating: 'Upwind rating',
    upwind_tack_count: 'Tack count',
    upwind_in_phase: 'Sailed in phase',
    upwind_shift_awareness: 'Shift awareness',
    upwind_lane: 'Lane position',
    upwind_notes: 'Upwind notes',
    // Marks
    marks_windward_approach: 'Windward mark approach',
    marks_layline_timing: 'Layline judgment',
    marks_leeward_rounding: 'Leeward mark rounding',
    marks_notes: 'Mark notes',
    // Downwind
    downwind_rating: 'Downwind rating',
    downwind_jibe_count: 'Jibe count',
    downwind_angle: 'Angles sailed',
    downwind_pressure: 'Connected pressure',
    downwind_notes: 'Downwind notes',
    // Rules
    rules_situations: 'Had rule situations',
    rules_penalty_taken: 'Took penalty',
    rules_protest_filed: 'Filed protest',
    rules_description: 'Incident description',
    // Finish
    finish_approach: 'Finish approach',
    finish_overall_rating: 'Overall race rating',
    finish_key_learning: 'Key learning',
    finish_work_on: 'Focus for next race',
  };

  // Phase groupings
  const phases = [
    { id: 'prep', title: 'Preparation', keys: ['prep_equipment_rating', 'prep_sail_choice', 'prep_notes'] },
    { id: 'prestart', title: 'Pre-Start', keys: ['prestart_routine_rating', 'prestart_line_sight', 'prestart_clear_air', 'prestart_favored_end'] },
    { id: 'start', title: 'Start', keys: ['start_position', 'start_speed', 'start_timing', 'start_notes'] },
    { id: 'upwind', title: 'Upwind', keys: ['upwind_rating', 'upwind_tack_count', 'upwind_in_phase', 'upwind_shift_awareness', 'upwind_lane', 'upwind_notes'] },
    { id: 'marks', title: 'Marks', keys: ['marks_windward_approach', 'marks_layline_timing', 'marks_leeward_rounding', 'marks_notes'] },
    { id: 'downwind', title: 'Downwind', keys: ['downwind_rating', 'downwind_jibe_count', 'downwind_angle', 'downwind_pressure', 'downwind_notes'] },
    { id: 'rules', title: 'Rules', keys: ['rules_situations', 'rules_penalty_taken', 'rules_protest_filed', 'rules_description'] },
    { id: 'finish', title: 'Finish & Overall', keys: ['finish_approach', 'finish_overall_rating', 'finish_key_learning', 'finish_work_on'] },
  ];

  const formattedSections: string[] = [];

  for (const phase of phases) {
    const phaseResponses = phase.keys
      .filter(key => debriefResponses[key] !== null && debriefResponses[key] !== undefined && debriefResponses[key] !== '')
      .map(key => {
        const value = debriefResponses[key];
        const label = questionLabels[key] || key;
        // Format value based on type
        if (typeof value === 'boolean') {
          return `  - ${label}: ${value ? 'Yes' : 'No'}`;
        } else if (typeof value === 'number') {
          // Rating (1-5) shown as stars
          if (key.includes('rating') || key === 'upwind_shift_awareness' || key === 'marks_layline_timing') {
            const stars = '★'.repeat(value) + '☆'.repeat(5 - value);
            return `  - ${label}: ${stars} (${value}/5)`;
          }
          return `  - ${label}: ${value}`;
        } else if (Array.isArray(value)) {
          return `  - ${label}: ${value.join(', ')}`;
        }
        return `  - ${label}: ${value}`;
      });

    if (phaseResponses.length > 0) {
      formattedSections.push(`${phase.title}:\n${phaseResponses.join('\n')}`);
    }
  }

  if (formattedSections.length === 0) {
    return '';
  }

  return `
Sailor's Structured Debrief:
The sailor completed a guided post-race interview covering all phases of the race.
Use this detailed self-assessment to inform your analysis.

${formattedSections.join('\n\n')}

`;
}

/**
 * Build a comprehensive prompt for race analysis
 */
function buildRaceAnalysisPrompt(raceData: any, pastLearnings: any[] = []): string {
  const courseName = raceData.race_courses?.name || 'Unknown Course';
  const duration = raceData.end_time
    ? (new Date(raceData.end_time).getTime() - new Date(raceData.start_time).getTime()) / 1000 / 60
    : 0;

  const learningsContext = formatPastLearnings(pastLearnings);
  // Use new debrief responses if available, fall back to legacy phase ratings
  const debriefContext = formatDebriefResponses(raceData.debrief_responses);
  const phaseRatingsContext = debriefContext || formatPhaseRatings(raceData.phase_ratings);

  return `You are an expert sailing coach analyzing a completed race. Provide detailed performance analysis.

Race Details:
- Course: ${courseName}
- Duration: ${duration.toFixed(1)} minutes
- Wind Conditions: ${raceData.wind_speed_knots || 'Unknown'} knots from ${raceData.wind_direction_degrees || 'Unknown'}°
- Weather: ${raceData.weather_description || 'Not recorded'}
${phaseRatingsContext}${learningsContext}
Analyze this race and provide feedback. Pay special attention to the sailor's self-assessments above - your analysis should:
1. Validate their perceptions where appropriate
2. Offer specific insights on phases they rated lower or mentioned issues
3. Suggest ways to build on phases they rated higher or mentioned success
4. Reference their key learnings and focus areas for next race
5. Reference past learnings when relevant, noting improvement or recurring issues

Format your response as a JSON object with these exact fields:
{
  "overall_summary": "<2-3 sentence summary of race performance>",
  "start_analysis": "<analysis of start execution, line bias, timing>",
  "upwind_analysis": "<analysis of upwind legs, tacking, wind shifts>",
  "downwind_analysis": "<analysis of downwind legs, jibing, angles>",
  "tactical_decisions": "<analysis of key tactical choices during the race>",
  "boat_handling": "<analysis of maneuvers, smoothness, technique>",
  "recommendations": ["<actionable improvement 1>", "<actionable improvement 2>", "<actionable improvement 3>"],
  "confidence_score": <number 0.0-1.0 indicating confidence in this analysis>
}`;
}

/**
 * Parse Claude's response into structured analysis
 */
function parseAnalysisResult(text: string): any {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse JSON:', e);
  }

  // Fallback: return a basic structure matching the database schema
  return {
    overall_summary: text.substring(0, 500) || 'Race completed. Detailed analysis pending.',
    start_analysis: 'Analysis pending',
    upwind_analysis: 'Analysis pending',
    downwind_analysis: 'Analysis pending',
    tactical_decisions: 'Analysis pending',
    boat_handling: 'Analysis pending',
    recommendations: ['Review race recording', 'Compare to previous performances'],
    confidence_score: 0.5,
  };
}

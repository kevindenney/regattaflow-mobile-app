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
  console.log('Race analysis request received');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== Race Analysis Request ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);

    // Log all headers (sanitized)
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'authorization') {
        headers[key] = value ? `Bearer ${value.substring(7, 27)}...` : 'missing';
      } else {
        headers[key] = value;
      }
    });
    console.log('Headers:', JSON.stringify(headers, null, 2));

    // Extract authorization token
    const authHeader = req.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    console.log('Auth header value (first 30 chars):', authHeader?.substring(0, 30));

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

    console.log('Supabase URL:', supabaseUrl);
    console.log('Anon key present:', !!supabaseAnonKey);
    console.log('Service key present:', !!supabaseServiceKey);

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
    console.log('Verifying user authentication...');
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

    console.log('User authenticated:', user.id);

    // Parse request body
    const { timerSessionId, force = false }: RaceAnalysisRequest = await req.json();
    console.log('Request body parsed - timerSessionId:', timerSessionId, 'force:', force);

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

    console.log('Race data fetched successfully');

    // Fetch sailor's past learnings for personalized analysis
    const { data: pastLearnings } = await supabaseAdmin
      .from('learnable_events')
      .select('title, action_text, outcome, event_type, conditions_context')
      .eq('sailor_id', user.id)
      .eq('nudge_eligible', true)
      .eq('dismissed', false)
      .order('created_at', { ascending: false })
      .limit(10);

    console.log('Fetched past learnings:', pastLearnings?.length || 0);

    // Call Claude API for race analysis
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: 'Anthropic API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calling Claude API for race analysis...');

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

    console.log('Claude API response received');

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

    console.log('Analysis saved successfully:', savedAnalysis?.id);

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
 * Format phase ratings for inclusion in prompt
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
 * Build a comprehensive prompt for race analysis
 */
function buildRaceAnalysisPrompt(raceData: any, pastLearnings: any[] = []): string {
  const courseName = raceData.race_courses?.name || 'Unknown Course';
  const duration = raceData.end_time
    ? (new Date(raceData.end_time).getTime() - new Date(raceData.start_time).getTime()) / 1000 / 60
    : 0;

  const learningsContext = formatPastLearnings(pastLearnings);
  const phaseRatingsContext = formatPhaseRatings(raceData.phase_ratings);

  return `You are an expert sailing coach analyzing a completed race. Provide detailed performance analysis.

Race Details:
- Course: ${courseName}
- Duration: ${duration.toFixed(1)} minutes
- Wind Conditions: ${raceData.wind_speed_knots || 'Unknown'} knots from ${raceData.wind_direction_degrees || 'Unknown'}°
- Weather: ${raceData.weather_description || 'Not recorded'}
${phaseRatingsContext}${learningsContext}
Analyze this race and provide feedback. Pay special attention to the sailor's self-assessments above - your analysis should:
1. Validate their perceptions where appropriate
2. Offer specific insights on phases they rated lower
3. Suggest ways to build on phases they rated higher
4. Reference past learnings when relevant, noting improvement or recurring issues

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

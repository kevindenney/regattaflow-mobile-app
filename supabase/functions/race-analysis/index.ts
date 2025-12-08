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

    // Fetch race data for analysis
    const { data: raceData, error: raceError } = await supabaseAdmin
      .from('race_timer_sessions')
      .select(`
        *,
        race_courses (
          name,
          course_type,
          race_marks (*)
        )
      `)
      .eq('id', timerSessionId)
      .single();

    if (raceError || !raceData) {
      console.error('Race data error:', raceError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch race data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Claude API for race analysis
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: 'Anthropic API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calling Claude API for race analysis...');

    const prompt = buildRaceAnalysisPrompt(raceData);

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-latest', // Switched from Sonnet 4 (75% cost savings)
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate analysis' }),
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

    // Insert new analysis
    const { data: savedAnalysis, error: saveError } = await supabaseAdmin
      .from('ai_coach_analysis')
      .insert({
        timer_session_id: timerSessionId,
        sailor_id: user.id,
        overall_performance_score: analysis.overall_performance_score,
        strengths: analysis.strengths,
        areas_for_improvement: analysis.areas_for_improvement,
        key_takeaways: analysis.key_takeaways,
        start_analysis: analysis.start_analysis,
        upwind_analysis: analysis.upwind_analysis,
        mark_rounding_analysis: analysis.mark_rounding_analysis,
        downwind_analysis: analysis.downwind_analysis,
        finish_analysis: analysis.finish_analysis,
        tactical_decisions: analysis.tactical_decisions,
        wind_usage: analysis.wind_usage,
        boat_handling: analysis.boat_handling,
        race_strategy: analysis.race_strategy,
        improvement_suggestions: analysis.improvement_suggestions,
        comparison_to_best_practices: analysis.comparison_to_best_practices,
        personalized_drills: analysis.personalized_drills,
        next_race_focus_areas: analysis.next_race_focus_areas,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Save error:', saveError);
      return new Response(
        JSON.stringify({ error: 'Failed to save analysis' }),
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
 * Build a comprehensive prompt for race analysis
 */
function buildRaceAnalysisPrompt(raceData: any): string {
  const courseName = raceData.race_courses?.name || 'Unknown Course';
  const duration = raceData.end_time
    ? (new Date(raceData.end_time).getTime() - new Date(raceData.start_time).getTime()) / 1000 / 60
    : 0;

  return `You are an expert sailing coach analyzing a completed race. Provide detailed performance analysis.

Race Details:
- Course: ${courseName}
- Duration: ${duration.toFixed(1)} minutes
- Wind Conditions: ${raceData.wind_speed_knots || 'Unknown'} knots from ${raceData.wind_direction_degrees || 'Unknown'}°
- Weather: ${raceData.weather_description || 'Not recorded'}

Please analyze this race across the following dimensions:

1. Overall Performance (provide a score from 1-10)
2. Start Analysis - execution quality, line bias recognition, timing
3. Upwind Performance - VMG, tacking decisions, wind shifts
4. Mark Roundings - technique, positioning, speed retention
5. Downwind Performance - angles, jibing, wave usage
6. Finish - approach strategy, timing
7. Tactical Decisions - laylines, positioning, risk management
8. Wind Usage - shift recognition, advantageous positioning
9. Boat Handling - smoothness, speed through maneuvers
10. Race Strategy - overall game plan execution

Format your response as a structured JSON object with these exact fields:
{
  "overall_performance_score": <number 1-10>,
  "strengths": [<array of strings>],
  "areas_for_improvement": [<array of strings>],
  "key_takeaways": [<array of strings>],
  "start_analysis": "<detailed text>",
  "upwind_analysis": "<detailed text>",
  "mark_rounding_analysis": "<detailed text>",
  "downwind_analysis": "<detailed text>",
  "finish_analysis": "<detailed text>",
  "tactical_decisions": "<detailed text>",
  "wind_usage": "<detailed text>",
  "boat_handling": "<detailed text>",
  "race_strategy": "<detailed text>",
  "improvement_suggestions": [<array of actionable suggestions>],
  "comparison_to_best_practices": "<text>",
  "personalized_drills": [<array of drill descriptions>],
  "next_race_focus_areas": [<array of focus areas>]
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

  // Fallback: return a basic structure
  return {
    overall_performance_score: 5,
    strengths: ['Completed the race'],
    areas_for_improvement: ['Data analysis pending'],
    key_takeaways: ['Review race video and telemetry'],
    start_analysis: text.substring(0, 500),
    upwind_analysis: 'Analysis pending',
    mark_rounding_analysis: 'Analysis pending',
    downwind_analysis: 'Analysis pending',
    finish_analysis: 'Analysis pending',
    tactical_decisions: 'Analysis pending',
    wind_usage: 'Analysis pending',
    boat_handling: 'Analysis pending',
    race_strategy: 'Analysis pending',
    improvement_suggestions: ['Review full analysis'],
    comparison_to_best_practices: 'Pending',
    personalized_drills: [],
    next_race_focus_areas: [],
  };
}

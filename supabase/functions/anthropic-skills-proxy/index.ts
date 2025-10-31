import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk@^0.32.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const anthropic = new Anthropic({ apiKey });
    const { action, ...params } = await req.json();

    let result;

    switch (action) {
      case 'list_skills':
        result = await anthropic.beta.skills.list({
          betas: ['skills-2025-10-02'],
          ...params
        } as any);
        break;

      case 'get_skill':
        if (!params.skill_id) {
          throw new Error('skill_id required for get_skill action');
        }
        result = await anthropic.beta.skills.retrieve(
          params.skill_id,
          { betas: ['skills-2025-10-02'] } as any
        );
        break;

      case 'create_skill':
        if (!params.name || !params.description) {
          throw new Error('name and description required for create_skill action');
        }
        // Note: File upload requires special handling
        // For now, this endpoint doesn't support creating skills with files
        // Use the Anthropic CLI for uploading skills with files
        return new Response(
          JSON.stringify({
            error: 'Creating skills with files not supported via proxy. Use Anthropic CLI instead.',
            suggestion: 'Pre-upload your skills using the Anthropic CLI, then reference them by ID'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in anthropic-skills-proxy:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

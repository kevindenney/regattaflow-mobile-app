/**
 * Step Plan Suggest Edge Function
 *
 * Dedicated AI endpoint for enriched step planning suggestions.
 * Accepts a system prompt and user message separately.
 * Uses Gemini Flash (free tier) for fast responses.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import {
  callGemini,
  anthropicToGeminiParts,
  anthropicToGeminiRole,
  GeminiMessage,
} from '../_shared/gemini.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { system, prompt, messages: rawMessages, max_tokens = 768 } = await req.json();

    // Support either a `messages` array (multi-turn chat) or a single `prompt` string.
    const anthropicMessages: { role: string; content: string | { type: string; [key: string]: unknown }[] }[] =
      Array.isArray(rawMessages) && rawMessages.length > 0
        ? rawMessages
        : prompt && typeof prompt === 'string'
          ? [{ role: 'user', content: prompt }]
          : [];

    if (anthropicMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'prompt or messages is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Convert Anthropic message format → Gemini format
    const geminiMessages: GeminiMessage[] = anthropicMessages.map((msg) => ({
      role: anthropicToGeminiRole(msg.role),
      parts: anthropicToGeminiParts(msg.content),
    }));

    // Call Gemini Flash with system prompt support
    let text: string;
    try {
      text = await callGemini({
        system: system || undefined,
        messages: geminiMessages,
        maxOutputTokens: Math.min(max_tokens, 4096),
      });
    } catch (aiError: any) {
      console.error('Gemini API error:', aiError.message);
      return new Response(
        JSON.stringify({ error: 'AI service unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ text }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Step plan suggest error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

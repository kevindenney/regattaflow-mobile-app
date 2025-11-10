import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk@^0.32.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ClubOnboardingRequest = {
  messages: ChatMessage[];
  skillId?: string | null;
  model?: string;
  max_tokens?: number;
  temperature?: number;
};

const formatMessages = (messages: ChatMessage[]): Anthropic.MessageParam[] => {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json();
    const {
      messages,
      skillId,
      model = "claude-3-5-haiku-latest",
      max_tokens = 2048,
      temperature = 0.4,
    }: ClubOnboardingRequest = body;

    const resolvedSkillId = skillId ?? Deno.env.get("CLAUDE_SKILL_CLUB_ONBOARDING_ID") ?? null;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const anthropic = new Anthropic({ apiKey });

    const anthropicMessages = formatMessages(messages);
    const hasSkill = typeof resolvedSkillId === "string" && resolvedSkillId.length > 0;

    const response = await anthropic.beta.messages.create({
      model,
      max_tokens,
      temperature,
      betas: hasSkill ? ["skills-2025-10-02"] : undefined,
      ...(hasSkill && {
        container: {
          skills: [{
            type: "custom",
            skill_id: resolvedSkillId!,
            version: "latest",
          }],
        },
      }),
      messages: anthropicMessages,
    } as Anthropic.Beta.MessageCreateParams);

    const textBlocks = (response.content as Array<{ type: string; text?: string }>)
      .filter((block) => block.type === "text" && typeof block.text === "string")
      .map((block) => block.text!.trim())
      .filter(Boolean);

    const combinedText = textBlocks.join("\n\n").trim();

    return new Response(
      JSON.stringify({
        success: true,
        message: combinedText,
        raw: response,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("club-onboarding error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

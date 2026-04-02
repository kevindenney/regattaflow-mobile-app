import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk@^0.32.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ClubOnboardingRequest = {
  messages: ChatMessage[];
  interestSlug?: string;
  organizationLabel?: string;
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

const COMPLETE_SETUP_TOOL: Anthropic.Tool = {
  name: "complete_setup",
  description:
    "Call this tool when you have gathered enough information to create the organization. You need at minimum: the organization name and a brief description of what they do.",
  input_schema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description: "The organization/studio name",
      },
      description: {
        type: "string",
        description: "Brief description of what they do/teach",
      },
      program_name: {
        type: "string",
        description:
          "Name of their first program/curriculum, if discussed (optional)",
      },
      program_description: {
        type: "string",
        description: "Brief description of the program, if discussed (optional)",
      },
      expected_students: {
        type: "number",
        description: "Expected number of students/members (optional)",
      },
    },
    required: ["name", "description"],
  },
};

const buildSystemPrompt = (
  orgLabel: string,
  interestSlug?: string,
): string => {
  const interestName = interestSlug
    ? interestSlug
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

  return `You are an onboarding specialist for BetterAt, a deliberate practice platform. You're helping a new user set up their ${orgLabel}.

Your job is to have a brief, friendly conversation to gather key details about their ${orgLabel}. Ask one or two questions at a time, not all at once.

Information to gather:
1. ${orgLabel} name (they may have already provided this)
2. Brief description of what they do/teach
3. How many members/students they expect
4. Any specific programs or curricula they want to set up

${interestName ? `The user selected "${interestName}" as their interest area. Tailor your questions accordingly.` : ""}

Keep responses concise (2-3 sentences). Be warm and professional.

IMPORTANT: Once you have enough information (at minimum: the name and what they do), call the complete_setup tool with the gathered details. Include a friendly wrap-up message in your text response alongside the tool call.

Do NOT ask for website URLs or try to scrape anything. Focus on the conversational setup.`;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
      interestSlug,
      organizationLabel = "organization",
      model = "claude-haiku-4-5-20251001",
      max_tokens = 2048,
      temperature = 0.4,
    }: ClubOnboardingRequest = body;

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
    const systemPrompt = buildSystemPrompt(organizationLabel, interestSlug);

    const response = await anthropic.messages.create({
      model,
      max_tokens,
      temperature,
      system: systemPrompt,
      tools: [COMPLETE_SETUP_TOOL],
      messages: anthropicMessages,
    });

    // Extract text blocks
    const textBlocks = response.content
      .filter(
        (block): block is Anthropic.TextBlock => block.type === "text",
      )
      .map((block) => block.text.trim())
      .filter(Boolean);

    const combinedText = textBlocks.join("\n\n").trim();

    // Check for tool use (complete_setup)
    const toolUseBlock = response.content.find(
      (block): block is Anthropic.ToolUseBlock =>
        block.type === "tool_use" && block.name === "complete_setup",
    );

    if (toolUseBlock) {
      return new Response(
        JSON.stringify({
          success: true,
          message: combinedText,
          complete: true,
          orgData: toolUseBlock.input,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: combinedText,
        complete: false,
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

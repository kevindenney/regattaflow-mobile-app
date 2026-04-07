/**
 * Shared Gemini Flash helper for Supabase Edge Functions.
 *
 * Wraps the Google Generative Language REST API (Gemini 2.0 Flash).
 * Free tier: 15 RPM, 1500 RPD, 1M tokens/day.
 */

const GEMINI_MODEL = 'gemini-2.5-flash';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

export interface GeminiOptions {
  /** System instruction (equivalent to Anthropic's system param) */
  system?: string;
  /** Multi-turn conversation history */
  messages?: GeminiMessage[];
  /** Shorthand for single-turn: user content parts */
  userContent?: GeminiPart[];
  /** Max output tokens (default 1024) */
  maxOutputTokens?: number;
  /** Temperature (default: not set, uses model default) */
  temperature?: number;
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Call Gemini Flash and return the text response.
 * Retries once on 429 (rate limit) with a 2s backoff.
 */
export async function callGemini(options: GeminiOptions): Promise<string> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not configured');

  const url = `${BASE_URL}:generateContent?key=${apiKey}`;

  // Build contents array
  let contents: GeminiMessage[];
  if (options.messages && options.messages.length > 0) {
    contents = options.messages;
  } else if (options.userContent) {
    contents = [{ role: 'user', parts: options.userContent }];
  } else {
    throw new Error('callGemini: must provide messages or userContent');
  }

  // Build request body
  const body: Record<string, unknown> = { contents };

  if (options.system) {
    body.systemInstruction = { parts: [{ text: options.system }] };
  }

  // Disable thinking by default — gemini-2.5-flash otherwise consumes the
  // maxOutputTokens budget on internal reasoning and can return an empty
  // response, especially on smaller budgets. Callers almost always want plain
  // output (JSON extraction, short suggestions, etc.).
  const generationConfig: Record<string, unknown> = {
    thinkingConfig: { thinkingBudget: 0 },
  };
  if (options.maxOutputTokens) generationConfig.maxOutputTokens = options.maxOutputTokens;
  if (options.temperature !== undefined) generationConfig.temperature = options.temperature;
  body.generationConfig = generationConfig;

  // Call with retry on 429
  let response = await doFetch(url, body);
  if (response.status === 429) {
    await sleep(2000);
    response = await doFetch(url, body);
  }

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errText}`);
  }

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts
    ?.filter((p: GeminiPart) => p.text)
    .map((p: GeminiPart) => p.text)
    .join('') ?? '';

  if (!text) {
    const finishReason = result?.candidates?.[0]?.finishReason;
    if (finishReason === 'SAFETY') {
      throw new Error('Gemini blocked response due to safety filters');
    }
    throw new Error('Gemini returned empty response');
  }

  return text;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function doFetch(url: string, body: Record<string, unknown>): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Conversion helpers (Anthropic format → Gemini format)
// ---------------------------------------------------------------------------

/**
 * Convert Anthropic message content to Gemini parts.
 * Handles both string content and multi-block content arrays.
 */
export function anthropicToGeminiParts(
  content: string | { type: string; [key: string]: unknown }[],
): GeminiPart[] {
  if (typeof content === 'string') {
    return [{ text: content }];
  }

  return content.map(block => {
    if (block.type === 'text') {
      return { text: block.text as string };
    }
    if (block.type === 'image') {
      const source = block.source as { media_type: string; data: string };
      return { inlineData: { mimeType: source.media_type, data: source.data } };
    }
    if (block.type === 'document') {
      const source = block.source as { media_type: string; data: string };
      return { inlineData: { mimeType: source.media_type, data: source.data } };
    }
    // Fallback: treat as text
    return { text: JSON.stringify(block) };
  });
}

/**
 * Convert Anthropic role to Gemini role.
 */
export function anthropicToGeminiRole(role: string): 'user' | 'model' {
  return role === 'assistant' ? 'model' : 'user';
}

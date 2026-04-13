/**
 * Gemini provider adapter.
 *
 * Extracted from the original _shared/gemini.ts — same REST API approach,
 * wrapped behind the AIProvider interface.
 */

import type {
  AIProvider,
  CompletionRequest,
  CompletionResponse,
  ContentPart,
  Message,
} from '../types.ts';

// ---------------------------------------------------------------------------
// Gemini-specific types
// ---------------------------------------------------------------------------

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiMessage {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toGeminiParts(content: string | ContentPart[]): GeminiPart[] {
  if (typeof content === 'string') {
    return [{ text: content }];
  }
  return content.map(part => {
    if (part.type === 'text') return { text: part.text };
    return { inlineData: { mimeType: part.mimeType, data: part.data } };
  });
}

function toGeminiMessages(messages: Message[]): GeminiMessage[] {
  return messages.map(m => ({
    role: m.role === 'assistant' ? 'model' as const : 'user' as const,
    parts: toGeminiParts(m.content),
  }));
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  private apiKey: string;
  private modelId: string;

  constructor(modelId: string) {
    const key = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!key) throw new Error('GOOGLE_AI_API_KEY environment variable is not set');
    this.apiKey = key;
    this.modelId = modelId;
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelId}`;
    const endpoint = `${baseUrl}:generateContent?key=${this.apiKey}`;

    const contents = toGeminiMessages(request.messages);

    const body: Record<string, unknown> = { contents };

    if (request.system) {
      body.systemInstruction = { parts: [{ text: request.system }] };
    }

    // Disable thinking by default — gemini-2.5-flash consumes the
    // maxOutputTokens budget on internal reasoning and can return empty.
    const generationConfig: Record<string, unknown> = {
      thinkingConfig: { thinkingBudget: 0 },
    };
    if (request.maxOutputTokens) {
      generationConfig.maxOutputTokens = request.maxOutputTokens;
    }
    if (request.temperature !== undefined) {
      generationConfig.temperature = request.temperature;
    }
    if (request.responseFormat === 'json') {
      generationConfig.responseMimeType = 'application/json';
    }
    body.generationConfig = generationConfig;

    // Call with retry on 429
    let response = await this.doFetch(endpoint, body);
    if (response.status === 429) {
      await sleep(2000);
      response = await this.doFetch(endpoint, body);
    }

    if (!response.ok) {
      throw new Error(`Gemini API request failed with status ${response.status}`);
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

    const usage = result?.usageMetadata;

    return {
      text,
      provider: this.name,
      model: this.modelId,
      usage: usage
        ? {
            inputTokens: usage.promptTokenCount ?? 0,
            outputTokens: usage.candidatesTokenCount ?? 0,
          }
        : undefined,
    };
  }

  private doFetch(url: string, body: Record<string, unknown>): Promise<Response> {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
}

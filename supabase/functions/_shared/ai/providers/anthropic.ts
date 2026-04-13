/**
 * Anthropic provider adapter.
 *
 * Uses the REST API directly (no SDK needed in Deno).
 */

import type {
  AIProvider,
  CompletionRequest,
  CompletionResponse,
  ContentPart,
  Message,
} from '../types.ts';

// ---------------------------------------------------------------------------
// Anthropic-specific types
// ---------------------------------------------------------------------------

interface AnthropicContentBlock {
  type: 'text';
  text: string;
}

interface AnthropicImageBlock {
  type: 'image';
  source: { type: 'base64'; media_type: string; data: string };
}

interface AnthropicDocumentBlock {
  type: 'document';
  source: { type: 'base64'; media_type: string; data: string };
}

type AnthropicContent = string | (AnthropicContentBlock | AnthropicImageBlock | AnthropicDocumentBlock)[];

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: AnthropicContent;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toAnthropicContent(content: string | ContentPart[]): AnthropicContent {
  if (typeof content === 'string') return content;

  return content.map(part => {
    if (part.type === 'text') {
      return { type: 'text' as const, text: part.text };
    }
    // Determine block type based on mime type
    if (part.mimeType.startsWith('image/')) {
      return {
        type: 'image' as const,
        source: { type: 'base64' as const, media_type: part.mimeType, data: part.data },
      };
    }
    return {
      type: 'document' as const,
      source: { type: 'base64' as const, media_type: part.mimeType, data: part.data },
    };
  });
}

function toAnthropicMessages(messages: Message[]): AnthropicMessage[] {
  return messages.map(m => ({
    role: m.role,
    content: toAnthropicContent(m.content),
  }));
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';
  private apiKey: string;
  private modelId: string;

  constructor(modelId: string) {
    const key = Deno.env.get('ANTHROPIC_API_KEY');
    if (!key) throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    this.apiKey = key;
    this.modelId = modelId;
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const body: Record<string, unknown> = {
      model: this.modelId,
      max_tokens: request.maxOutputTokens ?? 1024,
      messages: toAnthropicMessages(request.messages),
    };

    if (request.system) {
      body.system = request.system;
    }
    if (request.temperature !== undefined) {
      body.temperature = request.temperature;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API request failed with status ${response.status}`);
    }

    const result = await response.json();

    const text = result.content
      ?.filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text)
      .join('') ?? '';

    if (!text) {
      throw new Error('Anthropic returned empty response');
    }

    return {
      text,
      provider: this.name,
      model: this.modelId,
      usage: result.usage
        ? {
            inputTokens: result.usage.input_tokens ?? 0,
            outputTokens: result.usage.output_tokens ?? 0,
          }
        : undefined,
    };
  }
}

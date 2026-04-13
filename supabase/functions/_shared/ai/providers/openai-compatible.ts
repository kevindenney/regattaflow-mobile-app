/**
 * OpenAI-compatible provider adapter.
 *
 * Works with: Ollama, vLLM, LM Studio, Groq, Together AI, OpenAI,
 * and any server exposing the /v1/chat/completions endpoint.
 *
 * Configuration:
 *   AI_LOCAL_URL   — base URL (default: http://localhost:11434/v1)
 *   AI_LOCAL_MODEL — model name (default: llama3.2)
 *   OPENAI_API_KEY — optional API key (needed for OpenAI, Groq, Together; not for Ollama)
 */

import type {
  AIProvider,
  CompletionRequest,
  CompletionResponse,
  ContentPart,
  Message,
} from '../types.ts';
import { getLocalModel, getLocalUrl } from '../config.ts';

// ---------------------------------------------------------------------------
// OpenAI-format types
// ---------------------------------------------------------------------------

interface OAITextPart {
  type: 'text';
  text: string;
}

interface OAIImagePart {
  type: 'image_url';
  image_url: { url: string };
}

type OAIContent = string | (OAITextPart | OAIImagePart)[];

interface OAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: OAIContent;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toOAIContent(content: string | ContentPart[]): OAIContent {
  if (typeof content === 'string') return content;

  return content.map(part => {
    if (part.type === 'text') {
      return { type: 'text' as const, text: part.text };
    }
    // Inline data → data URI for vision
    return {
      type: 'image_url' as const,
      image_url: { url: `data:${part.mimeType};base64,${part.data}` },
    };
  });
}

function toOAIMessages(request: CompletionRequest): OAIMessage[] {
  const messages: OAIMessage[] = [];

  if (request.system) {
    messages.push({ role: 'system', content: request.system });
  }

  for (const m of request.messages) {
    messages.push({
      role: m.role,
      content: toOAIContent(m.content),
    });
  }

  return messages;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export class OpenAICompatibleProvider implements AIProvider {
  readonly name = 'openai-compatible';
  private baseUrl: string;
  private modelId: string;
  private apiKey: string | undefined;

  constructor(modelId?: string) {
    this.baseUrl = getLocalUrl();
    this.modelId = modelId ?? getLocalModel();
    try {
      this.apiKey = Deno.env.get('OPENAI_API_KEY');
    } catch {
      // Permission denied or not set — fine for Ollama
    }
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const body: Record<string, unknown> = {
      model: this.modelId,
      messages: toOAIMessages(request),
    };

    if (request.maxOutputTokens) {
      body.max_tokens = request.maxOutputTokens;
    }
    if (request.temperature !== undefined) {
      body.temperature = request.temperature;
    }
    if (request.responseFormat === 'json') {
      body.response_format = { type: 'json_object' };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const endpoint = `${this.baseUrl}/chat/completions`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(
        `OpenAI-compatible API request failed with status ${response.status}`,
      );
    }

    const result = await response.json();
    const text = result.choices?.[0]?.message?.content ?? '';

    if (!text) {
      throw new Error('OpenAI-compatible provider returned empty response');
    }

    return {
      text,
      provider: this.name,
      model: this.modelId,
      usage: result.usage
        ? {
            inputTokens: result.usage.prompt_tokens ?? 0,
            outputTokens: result.usage.completion_tokens ?? 0,
          }
        : undefined,
    };
  }
}

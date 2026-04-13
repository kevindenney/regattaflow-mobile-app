/**
 * Shared types for the provider-agnostic AI completion layer.
 */

// ---------------------------------------------------------------------------
// Content parts (supports text + vision/document inline data)
// ---------------------------------------------------------------------------

export interface TextPart {
  type: 'text';
  text: string;
}

export interface InlineDataPart {
  type: 'inline_data';
  mimeType: string;
  data: string; // base64
}

export type ContentPart = TextPart | InlineDataPart;

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export interface Message {
  role: 'user' | 'assistant';
  content: string | ContentPart[];
}

// ---------------------------------------------------------------------------
// Request / Response
// ---------------------------------------------------------------------------

export interface CompletionRequest {
  /** Task identifier for model routing (e.g. 'extraction', 'chat', 'analysis') */
  task?: string;
  /** System instruction */
  system?: string;
  /** Conversation messages */
  messages: Message[];
  /** Max output tokens (default: provider/model default) */
  maxOutputTokens?: number;
  /** Temperature (default: provider/model default) */
  temperature?: number;
  /** Hint for response format — not all providers/models support JSON mode */
  responseFormat?: 'text' | 'json';
}

export interface CompletionResponse {
  text: string;
  provider: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

// ---------------------------------------------------------------------------
// Provider interface
// ---------------------------------------------------------------------------

export interface AIProvider {
  readonly name: string;
  complete(request: CompletionRequest): Promise<CompletionResponse>;
}

// ---------------------------------------------------------------------------
// Model registry types
// ---------------------------------------------------------------------------

export type ProviderName = 'gemini' | 'anthropic' | 'openai-compatible';

export interface ModelDefinition {
  id: string;
  provider: ProviderName;
  displayName: string;
  costPer1MInput: number;
  costPer1MOutput: number;
  maxOutputTokens: number;
  contextWindow: number;
}

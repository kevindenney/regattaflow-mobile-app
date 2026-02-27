import { supabase } from '../supabase';

export type ClaudeModel = 'claude-3-5-sonnet-20240620' | 'claude-3-haiku-20240307';

export interface ClaudeRequest {
  model: ClaudeModel;
  system?: string;
  messages: ClaudeMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface ClaudeMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ClaudeResponse {
  text: string;
  tokensIn: number;
  tokensOut: number;
  raw: any;
}

export class ClaudeClient {
  protected readonly apiUrl = 'supabase.functions.race-coaching-chat';

  constructor(_apiKey?: string) {}

  async createMessage(request: ClaudeRequest): Promise<ClaudeResponse> {
    const start = Date.now();
    const promptSections: string[] = [];

    if (request.system) {
      promptSections.push(request.system);
    }
    for (const msg of request.messages) {
      promptSections.push(`[${msg.role}] ${msg.content}`);
    }
    const prompt = promptSections.join('\n\n').trim();

    const { data, error } = await supabase.functions.invoke('race-coaching-chat', {
      body: {
        prompt,
        max_tokens: request.maxTokens ?? 1024,
      },
    });
    if (error) {
      throw new Error(`Claude API error: ${error.message}`);
    }

    const text = typeof data?.text === 'string' ? data.text.trim() : '';

    const durationMs = Date.now() - start;
    return {
      text,
      tokensIn: 0,
      tokensOut: 0,
      raw: { provider: 'race-coaching-chat', modelRequested: request.model, durationMs, response: data },
    };
  }
}

import Constants from 'expo-constants';

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
  protected readonly apiKey: string;
  protected readonly apiUrl = 'https://api.anthropic.com/v1/messages';

  constructor(apiKey?: string) {
    // Try to get API key from multiple sources
    // Priority: explicit parameter > expo-constants > env vars
    const finalApiKey =
      apiKey ||
      Constants?.expoConfig?.extra?.anthropicApiKey ||
      process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ||
      process.env.ANTHROPIC_API_KEY;

    if (!finalApiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured. Please set EXPO_PUBLIC_ANTHROPIC_API_KEY in your .env file.');
    }
    this.apiKey = finalApiKey;
  }

  async createMessage(request: ClaudeRequest): Promise<ClaudeResponse> {
    const start = Date.now();
    const body = {
      model: request.model,
      system: request.system ?? undefined,
      messages: request.messages.map(msg => ({
        role: msg.role,
        content: [{ type: 'text', text: msg.content }],
      })),
      max_tokens: request.maxTokens ?? 1024,
      temperature: request.temperature ?? 0.4,
    };

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Claude API error (${response.status}): ${errorBody}`);
    }

    const json = await response.json();
    const text = Array.isArray(json.content)
      ? json.content.map((item: any) => item.text ?? '').join('\n').trim()
      : json.content?.text ?? '';

    const durationMs = Date.now() - start;
    return {
      text,
      tokensIn: json?.usage?.input_tokens ?? 0,
      tokensOut: json?.usage?.output_tokens ?? 0,
      raw: { ...json, durationMs },
    };
  }
}

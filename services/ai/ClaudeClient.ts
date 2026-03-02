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

  private isNodeRuntime(): boolean {
    return typeof process !== 'undefined' && Boolean(process.versions?.node);
  }

  private async invokeRaceCoachingEdgeFunction(
    functionName: string,
    body: Record<string, unknown>
  ): Promise<{ data: any; error: any }> {
    if (!this.isNodeRuntime()) {
      const sailingEdgeModulePath = '../domain/sailingEdgeFunctions';
      const { invokeSailingEdgeFunction } = await import(sailingEdgeModulePath);
      return invokeSailingEdgeFunction(functionName, { body });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return {
        data: null,
        error: {
          message:
            'Missing SUPABASE_URL/EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for server AI invocation',
        },
      };
    }

    const edgeUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/${functionName}`;

    try {
      const response = await fetch(edgeUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const rawText = await response.text();
      const parsed = rawText ? JSON.parse(rawText) : null;

      if (!response.ok) {
        return {
          data: null,
          error: {
            message: `Edge function ${functionName} failed (${response.status})`,
            detail: parsed,
          },
        };
      }

      return { data: parsed, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error?.message ?? `Edge function ${functionName} invocation failed`,
        },
      };
    }
  }

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

    const { data, error } = await this.invokeRaceCoachingEdgeFunction('race-coaching-chat', {
      prompt,
      max_tokens: request.maxTokens ?? 1024,
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

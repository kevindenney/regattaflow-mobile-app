import { getAICircuitBreaker, CircuitOpenError } from '@/lib/utils/aiCircuitBreaker';
import { shouldTriggerFallback, activateFallbackMode } from '@/lib/utils/aiFallback';
import { invokeAIEdgeFunction, AI_EDGE_FUNCTION_TIMEOUT_MS } from './invokeAIEdgeFunction';

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

export interface ClaudeRawResponse {
  provider: string;
  modelRequested: string;
  durationMs: number;
  response: unknown;
}

export interface ClaudeResponse {
  text: string;
  tokensIn: number;
  tokensOut: number;
  raw: ClaudeRawResponse;
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
  ): Promise<{ data: unknown; error: { message: string; detail?: unknown } | null }> {
    if (!this.isNodeRuntime()) {
      return invokeAIEdgeFunction(functionName, { body });
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
        signal: AbortSignal.timeout(AI_EDGE_FUNCTION_TIMEOUT_MS),
      });

      const rawText = await response.text();
      let parsed: unknown = null;
      if (rawText) {
        try {
          parsed = JSON.parse(rawText);
        } catch {
          parsed = null;
        }
      }

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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : `Edge function ${functionName} invocation failed`;
      return {
        data: null,
        error: { message },
      };
    }
  }

  async createMessage(request: ClaudeRequest): Promise<ClaudeResponse> {
    const breaker = getAICircuitBreaker();

    return breaker.execute(async () => {
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
        const apiError = new Error(`Claude API error: ${error.message}`);
        // Sync circuit breaker state with global fallback mode
        if (shouldTriggerFallback(apiError)) {
          activateFallbackMode(error.message);
        }
        throw apiError;
      }

      const dataObj = data !== null && typeof data === 'object' ? data as Record<string, unknown> : {};
      const text = typeof dataObj.text === 'string' ? dataObj.text.trim() : '';

      const durationMs = Date.now() - start;
      return {
        text,
        tokensIn: 0,
        tokensOut: 0,
        raw: { provider: 'race-coaching-chat', modelRequested: request.model, durationMs, response: data },
      };
    });
  }
}

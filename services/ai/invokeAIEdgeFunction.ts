/**
 * Invoke a Supabase Edge Function with a timeout tuned for AI workloads.
 *
 * The default Supabase client uses a 30 s global fetch timeout, which is fine
 * for database queries but too aggressive for AI/LLM edge functions that may
 * take longer to respond.  This helper bypasses the global wrapper and uses a
 * dedicated 60 s timeout (configurable per-call).
 */

import { supabase } from '@/services/supabase';
import { fetchWithTimeout } from '@/lib/utils/fetchWithTimeout';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('invokeAIEdgeFunction');

/** Default timeout for AI edge function calls (60 seconds). */
export const AI_EDGE_FUNCTION_TIMEOUT_MS = 60_000;

interface InvokeOptions {
  body?: unknown;
  headers?: Record<string, string>;
  /** Override the default 60 s timeout. */
  timeoutMs?: number;
}

/**
 * Call a Supabase Edge Function with a longer timeout suitable for AI/LLM
 * workloads.  Returns the same `{ data, error }` shape as
 * `supabase.functions.invoke`.
 */
export async function invokeAIEdgeFunction<T = any>(
  functionName: string,
  options?: InvokeOptions,
): Promise<{ data: T | null; error: any }> {
  const timeoutMs = options?.timeoutMs ?? AI_EDGE_FUNCTION_TIMEOUT_MS;

  try {
    // Resolve the project URL from the existing Supabase client.
    // supabase.functions.url is not publicly typed but we can construct it.
    const supabaseUrl = (supabase as any).supabaseUrl ?? (supabase as any).restUrl?.replace('/rest/v1', '');
    if (!supabaseUrl) {
      return { data: null, error: { message: 'Unable to resolve Supabase URL for edge function invocation' } };
    }

    const edgeUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/${functionName}`;

    // Grab the current session token so the edge function inherits auth.
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    const anonKey = (supabase as any).supabaseKey ?? '';

    const response = await fetchWithTimeout(edgeUrl, {
      method: 'POST',
      timeout: timeoutMs,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken || anonKey}`,
        apikey: anonKey,
        ...options?.headers,
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    const rawText = await response.text();
    let parsed: any = null;
    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
      // Non-JSON response – treat as plain text.
      parsed = rawText;
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

    return { data: parsed as T, error: null };
  } catch (error: any) {
    const isTimeout = error?.name === 'AbortError';
    logger.error(
      `[invokeAIEdgeFunction] ${functionName} failed${isTimeout ? ' (timeout)' : ''}:`,
      error?.message,
    );
    return {
      data: null,
      error: {
        message: isTimeout
          ? `AI edge function ${functionName} timed out after ${timeoutMs}ms`
          : error?.message ?? `Edge function ${functionName} invocation failed`,
      },
    };
  }
}

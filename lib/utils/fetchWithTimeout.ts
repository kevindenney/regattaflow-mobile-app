/**
 * Fetch wrapper that enforces a request timeout via AbortController.
 *
 * Usage:
 *   const res = await fetchWithTimeout('https://example.com/api', { timeout: 15_000 });
 *
 * If the caller already provides a `signal` in the init options, the request
 * will abort when *either* the caller's signal or the timeout fires first.
 */

/** Default timeout applied when no explicit value is provided (30 seconds). */
export const DEFAULT_FETCH_TIMEOUT_MS = 30_000;

export interface FetchWithTimeoutInit extends RequestInit {
  /** Timeout in milliseconds. Defaults to {@link DEFAULT_FETCH_TIMEOUT_MS}. */
  timeout?: number;
}

/**
 * Returns true if the error is an AbortError (request cancelled due to
 * component unmount, navigation, or React Query cancellation).
 * These are expected and should be silently ignored rather than logged.
 */
export function isAbortError(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof DOMException && error.name === 'AbortError') return true;
  if (error instanceof Error && error.name === 'AbortError') return true;
  const msg = (error as { message?: string })?.message;
  if (typeof msg === 'string' && msg.includes('AbortError')) return true;
  const detail = (error as { details?: string })?.details;
  if (typeof detail === 'string' && detail.includes('AbortError')) return true;
  return false;
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: FetchWithTimeoutInit,
): Promise<Response> {
  const { timeout = DEFAULT_FETCH_TIMEOUT_MS, ...fetchInit } = init ?? {};

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // If the caller supplied their own signal, propagate its abort.
  const externalSignal = fetchInit.signal;
  const onExternalAbort = externalSignal ? () => controller.abort() : undefined;
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort!, { once: true });
    }
  }

  try {
    return await fetch(input, { ...fetchInit, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
    // Remove the listener to avoid retaining references after the fetch completes
    if (externalSignal && onExternalAbort) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}

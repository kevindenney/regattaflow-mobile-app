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

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: FetchWithTimeoutInit,
): Promise<Response> {
  const { timeout = DEFAULT_FETCH_TIMEOUT_MS, ...fetchInit } = init ?? {};

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // If the caller supplied their own signal, propagate its abort.
  const externalSignal = fetchInit.signal;
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  try {
    return await fetch(input, { ...fetchInit, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

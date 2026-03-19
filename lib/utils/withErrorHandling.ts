/**
 * Standardized error handling wrapper for service methods.
 *
 * Eliminates silent failures by ensuring every caught error is logged
 * with context, while allowing services to declare their fallback strategy.
 *
 * Usage:
 *   // Throw on error (default)
 *   const result = await withErrorHandling(
 *     () => supabase.from('races').select('*'),
 *     { service: 'RaceService', method: 'listRaces' }
 *   );
 *
 *   // Return fallback on error
 *   const result = await withErrorHandling(
 *     () => supabase.from('races').select('*'),
 *     { service: 'RaceService', method: 'listRaces', fallback: [] }
 *   );
 *
 *   // Return null on error
 *   const result = await withErrorHandling(
 *     () => fetchWeather(lat, lng),
 *     { service: 'WeatherService', method: 'getWeather', fallback: null }
 *   );
 */

import { createLogger, serializeError } from './logger';

const errorLogger = createLogger('ErrorHandler');

interface ErrorHandlingOptions<F> {
  /** Service name for log context */
  service: string;
  /** Method name for log context */
  method: string;
  /** If provided, return this value instead of throwing. Omit to throw. */
  fallback?: F;
  /** Extra context to include in log output */
  context?: Record<string, unknown>;
  /** Log level: 'error' (default) or 'warn' for expected/non-critical failures */
  level?: 'error' | 'warn';
}

/**
 * Wraps an async operation with standardized error logging and fallback behavior.
 *
 * - When `fallback` is NOT provided: logs the error and re-throws it.
 * - When `fallback` IS provided: logs the error and returns the fallback value.
 *
 * This ensures no error is ever silently swallowed.
 */
export async function withErrorHandling<T, F = never>(
  fn: () => Promise<T>,
  options: ErrorHandlingOptions<F> & { fallback: F },
): Promise<T | F>;
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  options: Omit<ErrorHandlingOptions<never>, 'fallback'>,
): Promise<T>;
export async function withErrorHandling<T, F>(
  fn: () => Promise<T>,
  options: ErrorHandlingOptions<F>,
): Promise<T | F> {
  const { service, method, context, level = 'error' } = options;
  const tag = `${service}.${method}`;

  try {
    return await fn();
  } catch (error: unknown) {
    const logPayload = {
      ...serializeError(error),
      ...(context ? { context } : {}),
    };

    if (level === 'warn') {
      errorLogger.warn(`[${tag}] Operation failed`, logPayload);
    } else {
      errorLogger.error(`[${tag}] Operation failed`, logPayload);
    }

    if ('fallback' in options) {
      return options.fallback as F;
    }

    throw error;
  }
}

/**
 * Wraps a Supabase query result, checking the `error` field and applying
 * the same standardized logging/fallback behavior.
 *
 * Usage:
 *   const data = await withSupabaseError(
 *     supabase.from('races').select('*'),
 *     { service: 'RaceService', method: 'listRaces', fallback: [] }
 *   );
 */
export async function withSupabaseError<T, F = never>(
  query: PromiseLike<{ data: T; error: { message: string; code?: string; details?: string } | null }>,
  options: ErrorHandlingOptions<F> & { fallback: F },
): Promise<T | F>;
export async function withSupabaseError<T>(
  query: PromiseLike<{ data: T; error: { message: string; code?: string; details?: string } | null }>,
  options: Omit<ErrorHandlingOptions<never>, 'fallback'>,
): Promise<T>;
export async function withSupabaseError<T, F>(
  query: PromiseLike<{ data: T; error: { message: string; code?: string; details?: string } | null }>,
  options: ErrorHandlingOptions<F>,
): Promise<T | F> {
  const { service, method, context, level = 'error' } = options;
  const tag = `${service}.${method}`;

  const { data, error } = await query;

  if (error) {
    const logPayload = {
      code: error.code,
      message: error.message,
      details: error.details,
      ...(context ? { context } : {}),
    };

    if (level === 'warn') {
      errorLogger.warn(`[${tag}] Supabase error`, logPayload);
    } else {
      errorLogger.error(`[${tag}] Supabase error`, logPayload);
    }

    if ('fallback' in options) {
      return options.fallback as F;
    }

    throw new Error(`[${tag}] ${error.message}`);
  }

  return data;
}

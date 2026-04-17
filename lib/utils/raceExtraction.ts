import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('raceExtraction');

/** AI extraction can take 15-60s for large NORs; use a generous timeout */
const EXTRACTION_TIMEOUT_MS = 120_000;

export interface NormalizedRaceExtractionResult {
  success: boolean;
  data?: any;
  error?: string;
  confidence?: number;
  partialExtraction?: boolean;
  missingFields?: string;
}

export interface RaceExtractionOptions {
  /** Use the lean per-race schema for season calendars (50-200+ races) */
  compactMode?: boolean;
  /** ISO YYYY-MM-DD — used as the cutoff when includePast is false. Defaults to today server-side. */
  currentDate?: string;
  /** When false, races before currentDate are excluded. Defaults to true. */
  includePast?: boolean;
}

const MAX_TEXT_LENGTH = 1_000_000;

export async function extractRaceDetailsFromText(
  text: string,
  options: RaceExtractionOptions = {},
): Promise<NormalizedRaceExtractionResult> {
  if (!text || text.trim().length === 0) {
    return {
      success: false,
      error: 'No text provided for extraction',
    };
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return {
      success: false,
      error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH.toLocaleString()} characters`,
    };
  }

  try {
    // Use direct fetch with extended timeout instead of supabase.functions.invoke
    // because the global Supabase client has a 30s timeout which is too short for AI extraction
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EXTRACTION_TIMEOUT_MS);

    // Get current auth token for authenticated requests
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token || supabaseKey;

    const response = await fetch(`${supabaseUrl}/functions/v1/extract-race-details`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'apikey': supabaseKey || '',
      },
      body: JSON.stringify({
        text: text.trim(),
        compactMode: options.compactMode ?? false,
        currentDate: options.currentDate,
        includePast: options.includePast ?? true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      logger.error('extract-race-details HTTP error', {
        status: response.status,
        body: errorBody.substring(0, 500),
        textLength: text.trim().length,
      });
      return {
        success: false,
        error: response.status === 504
          ? 'The extraction service timed out. Try with a shorter document.'
          : 'The extraction service encountered an error. Please try again.',
      };
    }

    const data = await response.json();

    if (!data) {
      return {
        success: false,
        error: 'Race detail extraction returned no data',
      };
    }

    const confidence = typeof data?.overallConfidence === 'number'
      ? data.overallConfidence
      : typeof data?.confidence === 'number'
        ? data.confidence
        : undefined;

    return {
      success: data?.success !== false,
      data,
      confidence,
      partialExtraction: Boolean(data?.partialExtraction),
      missingFields:
        typeof data?.missingFields === 'string'
          ? data.missingFields
          : undefined,
      error: data?.error,
    };
  } catch (err: any) {
    const isAbort = err?.name === 'AbortError';
    logger.error('extract-race-details failed', {
      message: err?.message,
      textLength: text.trim().length,
    });

    return {
      success: false,
      error: isAbort
        ? 'The extraction service timed out. Try with a shorter document.'
        : 'Could not reach the extraction service. Check your connection and try again.',
    };
  }
}

import { supabase } from '@/services/supabase';

export interface NormalizedRaceExtractionResult {
  success: boolean;
  data?: any;
  error?: string;
  confidence?: number;
  partialExtraction?: boolean;
  missingFields?: string;
}

const MAX_TEXT_LENGTH = 1_000_000;

export async function extractRaceDetailsFromText(text: string): Promise<NormalizedRaceExtractionResult> {
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

  const { data, error } = await supabase.functions.invoke('extract-race-details', {
    body: { text: text.trim() },
  });

  if (error) {
    return {
      success: false,
      error: error?.message ?? 'Race detail extraction failed',
    };
  }

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
}

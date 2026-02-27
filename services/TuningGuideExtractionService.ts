/**
 * Tuning Guide Extraction Service
 * Handles OCR and content extraction from tuning guide PDFs and images using Anthropic Claude
 *
 * NOTE: OCR extraction temporarily disabled for web compatibility
 * - Anthropic SDK requires Node.js environment
 * - Search and read operations still work with already-extracted content
 * TODO: Move extraction to backend API endpoint for web support
 */

import { supabase } from './supabase';
import { createLogger } from '@/lib/utils/logger';

// NOTE: Anthropic SDK disabled for web compatibility
// NOTE: extraction must run server-side (Edge Function) with server-only ANTHROPIC_API_KEY.

// const genAI = new Anthropic({
//   apiKey: ANTHROPIC_API_KEY,
//   allowInBrowser: false // Deprecated placeholder from old client-side setup
// });

export interface ExtractedSection {
  title: string;
  content: string;
  conditions?: {
    windSpeed?: string;
    seaState?: string;
    points?: string; // upwind, downwind, reaching
  };
  settings?: {
    [key: string]: string | number;
  };
}

export interface ExtractionResult {
  fullText: string;
  sections: ExtractedSection[];
  metadata?: {
    sailmaker?: string;
    year?: number;
    boatClass?: string;
  };
}

class TuningGuideExtractionService {
  private readonly logger = createLogger('TuningGuideExtractionService');
  private readonly requestTimeoutMs = 90_000;
  private readonly maxAttempts = 2;

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async withRetry<T>(label: string, fn: () => Promise<T>, attempts = this.maxAttempts): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        this.logger.warn(`[${label}] attempt failed`, {
          attempt,
          attempts,
          message: error instanceof Error ? error.message : String(error),
        });
        if (attempt < attempts) {
          await this.delay(250 * attempt);
        }
      }
    }
    throw lastError instanceof Error ? lastError : new Error(`${label} failed`);
  }

  private async invokeFunctionWithTimeout<T = any>(fnName: string, body: Record<string, unknown>): Promise<T> {
    const invokePromise = supabase.functions.invoke(fnName, { body }) as Promise<{ data: T; error: any }>;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`${fnName} timed out after ${this.requestTimeoutMs}ms`)), this.requestTimeoutMs);
    });
    try {
      const { data, error } = await Promise.race([invokePromise, timeoutPromise]);
      if (error) {
        throw new Error(error.message || `${fnName} invocation failed`);
      }
      return data;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  private normalizeText(input: string): string {
    return input
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#(\d+);/g, (_, num: string) => String.fromCharCode(parseInt(num, 10)))
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async fetchUrlText(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch source URL: ${response.status} ${response.statusText}`);
    }
    const text = await response.text();
    return this.normalizeText(text);
  }

  private deriveSectionsFromRacePayload(raw: any): ExtractedSection[] {
    const races = Array.isArray(raw?.races) ? raw.races : raw ? [raw] : [];
    const sections: ExtractedSection[] = [];

    races.forEach((race: any, idx: number) => {
      if (!race || typeof race !== 'object') return;
      const lines: string[] = [];
      if (race.raceName) lines.push(`Race: ${race.raceName}`);
      if (race.raceSeriesName) lines.push(`Series: ${race.raceSeriesName}`);
      if (race.courseDescription) lines.push(`Course: ${race.courseDescription}`);
      if (race.venue) lines.push(`Venue: ${race.venue}`);
      if (race.warningSignalTime) lines.push(`Warning: ${race.warningSignalTime}`);
      if (Array.isArray(race.routeWaypoints) && race.routeWaypoints.length > 0) {
        lines.push(`Waypoints: ${race.routeWaypoints.map((wp: any) => wp?.name).filter(Boolean).join(' -> ')}`);
      }
      if (lines.length > 0) {
        sections.push({
          title: race.raceName || `Extracted Race ${idx + 1}`,
          content: lines.join('\n'),
        });
      }
    });

    return sections;
  }

  private normalizeExtractionResult(raw: any): ExtractionResult {
    const payload = raw?.success && raw?.races ? raw : raw;
    const racePayload = Array.isArray(payload?.races) && payload.races.length > 0 ? payload.races[0] : payload;
    const fullText =
      typeof payload?.fullText === 'string'
        ? payload.fullText
        : typeof payload?.text === 'string'
          ? payload.text
          : typeof racePayload?.courseDescription === 'string'
            ? racePayload.courseDescription
            : typeof racePayload?.raceName === 'string'
              ? racePayload.raceName
              : JSON.stringify(payload ?? {});

    const sections = Array.isArray(payload?.sections)
      ? (payload.sections as ExtractedSection[]).filter((section) => Boolean(section?.title || section?.content))
      : this.deriveSectionsFromRacePayload(payload);

    const metadata =
      payload?.metadata && typeof payload.metadata === 'object'
        ? {
            sailmaker: typeof payload.metadata.sailmaker === 'string' ? payload.metadata.sailmaker : undefined,
            year: typeof payload.metadata.year === 'number' ? payload.metadata.year : undefined,
            boatClass: typeof payload.metadata.boatClass === 'string' ? payload.metadata.boatClass : undefined,
          }
        : undefined;

    return {
      fullText,
      sections,
      metadata,
    };
  }

  private async extractViaEdgeFunction(
    guideId: string,
    fileUrl: string,
    fileType: 'pdf' | 'image' | 'link' | 'doc'
  ): Promise<ExtractionResult> {
    await this.updateExtractionStatus(guideId, 'processing');
    try {
      const extractionPayload = await this.withRetry<any>('extract-race-details', async () => {
        if (fileType === 'pdf') {
          const pdf = await this.invokeFunctionWithTimeout<{ text?: string }>('extract-pdf-text', { url: fileUrl });
          const extractedText = typeof pdf?.text === 'string' ? pdf.text.trim() : '';
          if (!extractedText) {
            throw new Error('extract-pdf-text returned empty text');
          }
          return this.invokeFunctionWithTimeout('extract-race-details', { text: extractedText });
        }

        if (fileType === 'link' || fileType === 'doc') {
          return this.invokeFunctionWithTimeout('extract-race-details', { url: fileUrl });
        }

        // For image sources we attempt URL extraction first, then plain text fallback.
        try {
          return await this.invokeFunctionWithTimeout('extract-race-details', { url: fileUrl });
        } catch {
          const fallbackText = await this.fetchUrlText(fileUrl);
          return this.invokeFunctionWithTimeout('extract-race-details', { text: fallbackText });
        }
      });

      const extracted = this.normalizeExtractionResult(extractionPayload);
      if (!extracted.fullText && extracted.sections.length === 0) {
        throw new Error('No content returned from extraction service');
      }

      await this.storeExtractedContent(guideId, extracted);
      return extracted;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Edge extraction failed';
      await this.updateExtractionStatus(guideId, 'failed', message);
      throw new Error(message);
    }
  }

  /**
   * Extract content from a PDF tuning guide
   */
  async extractFromPDF(pdfUrl: string, guideId: string): Promise<ExtractionResult> {
    return this.extractViaEdgeFunction(guideId, pdfUrl, 'pdf');
  }

  /**
   * Extract content from an image tuning guide
   */
  async extractFromImage(imageUrl: string, guideId: string): Promise<ExtractionResult> {
    return this.extractViaEdgeFunction(guideId, imageUrl, 'image');
  }

  /**
   * Extract content from any guide type
   */
  async extractContent(guideId: string, fileUrl: string, fileType: string): Promise<ExtractionResult> {
    if (fileType === 'pdf') {
      return this.extractFromPDF(fileUrl, guideId);
    } else if (fileType === 'image') {
      return this.extractFromImage(fileUrl, guideId);
    } else if (fileType === 'link' || fileType === 'doc') {
      return this.extractViaEdgeFunction(guideId, fileUrl, fileType);
    } else {
      // Fallback to URL extraction for unknown types rather than hard-failing the user.
      return this.extractViaEdgeFunction(guideId, fileUrl, 'link');
    }
  }

  /**
   * Search extracted content
   */
  async searchExtractedContent(
    query: string,
    classId?: string,
    sailorId?: string
  ): Promise<any[]> {
    const { data, error } = await supabase.rpc('search_tuning_guides', {
      search_query: query,
      p_class_id: classId,
      p_sailor_id: sailorId,
    });

    if (error) {
      this.logger.error('Error searching guides:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get extraction status for a guide
   */
  async getExtractionStatus(guideId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error?: string;
    extractedAt?: string;
  }> {
    const { data, error } = await supabase
      .from('tuning_guides')
      .select('extraction_status, extraction_error, extracted_at')
      .eq('id', guideId)
      .single();

    if (error) {
      throw error;
    }

    return {
      status: data.extraction_status,
      error: data.extraction_error,
      extractedAt: data.extracted_at,
    };
  }

  // Helper methods
  private async storeExtractedContent(
    guideId: string,
    extractedData: ExtractionResult
  ): Promise<void> {
    const { error } = await supabase
      .from('tuning_guides')
      .update({
        extracted_content: extractedData.fullText,
        extracted_sections: extractedData.sections,
        extraction_status: 'completed',
        extracted_at: new Date().toISOString(),
      })
      .eq('id', guideId);

    if (error) {
      throw error;
    }
  }

  private async updateExtractionStatus(
    guideId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('tuning_guides')
      .update({
        extraction_status: status,
        extraction_error: errorMessage,
      })
      .eq('id', guideId);

    if (error) {
      this.logger.error('Error updating extraction status:', error);
    }
  }

}

export const tuningGuideExtractionService = new TuningGuideExtractionService();

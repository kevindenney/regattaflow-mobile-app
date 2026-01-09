/**
 * Document Extraction Service
 *
 * Handles extraction of race data from uploaded documents (NOR, SI)
 * and updates the corresponding race_events with extracted information.
 */

import { supabase } from './supabase';
import { createLogger } from '@/lib/utils/logger';
import type { RaceDocumentType } from './RaceDocumentService';
import type { ComprehensiveRaceData } from './agents/ComprehensiveRaceExtractionAgent';

const logger = createLogger('DocumentExtractionService');

export interface ExtractionResult {
  success: boolean;
  extractedFields?: string[];
  data?: ComprehensiveRaceData;
  error?: string;
  confidence?: number;
}

export interface ExtractAndUpdateParams {
  documentUrl: string;
  documentId: string;
  raceId: string;
  documentType: RaceDocumentType;
}

export interface ExtractFromTextParams {
  text: string;
  documentId: string;
  raceId: string;
  documentType: RaceDocumentType;
}

class DocumentExtractionService {
  /**
   * Extract data from a document URL and update the race event
   */
  async extractAndUpdateRace(params: ExtractAndUpdateParams): Promise<ExtractionResult> {
    const { documentUrl, documentId, raceId, documentType } = params;

    logger.debug('Starting extraction', { documentUrl, documentId, raceId, documentType });

    // For Supabase storage URLs (private bucket), generate a signed URL
    let accessibleUrl = documentUrl;
    if (documentUrl.includes('supabase.co/storage/v1/object/public/documents/')) {
      // This is a "public" URL but bucket is private - need signed URL
      // Extract the file path from the URL
      const pathMatch = documentUrl.match(/\/storage\/v1\/object\/public\/documents\/(.+)/);
      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1]);
        logger.debug('Generating signed URL for private bucket', { filePath });

        const { data: signedUrlData, error: signedError } = await supabase.storage
          .from('documents')
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (signedError) {
          logger.error('Failed to generate signed URL', { error: signedError });
        } else if (signedUrlData?.signedUrl) {
          accessibleUrl = signedUrlData.signedUrl;
          logger.debug('Using signed URL for extraction', { signedUrl: accessibleUrl.substring(0, 100) + '...' });
        }
      }
    }

    try {
      // Update extraction status to 'processing'
      await this.updateExtractionStatus(raceId, 'processing');

      // Call the Edge Function with URL parameter (use accessible URL for private buckets)
      const extractionResult = await this.callExtractionEdgeFunction(accessibleUrl);

      if (!extractionResult.success) {
        await this.updateExtractionStatus(raceId, 'failed');
        return {
          success: false,
          error: extractionResult.error || 'Extraction failed',
        };
      }

      // Log the raw extraction result for debugging
      logger.debug('Raw extraction result', {
        success: extractionResult.success,
        hasRaces: !!extractionResult.races,
        racesLength: extractionResult.races?.length,
        hasData: !!extractionResult.data,
        dataKeys: extractionResult.data ? Object.keys(extractionResult.data) : [],
      });

      // Get the race data (first race if multi-race document)
      const raceData = extractionResult.races?.[0] || extractionResult.data;

      if (!raceData) {
        logger.error('No race data in extraction result', { extractionResult });
        await this.updateExtractionStatus(raceId, 'failed');
        return {
          success: false,
          error: 'No race data found in extraction result',
        };
      }

      logger.debug('Extracted race data', {
        venue: raceData.venue,
        raceDate: raceData.raceDate,
        warningSignalTime: raceData.warningSignalTime,
        raceType: raceData.raceType,
        dataKeys: Object.keys(raceData),
      });

      // Map extracted data to race_events fields and update
      const updateFields = this.mapToRaceEventUpdate(raceData);
      const extractedFieldNames = Object.keys(updateFields).filter(
        (key) => updateFields[key] !== null && updateFields[key] !== undefined
      );

      logger.debug('Mapped fields for update', { updateFields, extractedFieldNames });

      // Update the race event with extracted data
      const updateResult = await this.updateRaceEvent(raceId, updateFields);

      if (!updateResult.success) {
        await this.updateExtractionStatus(raceId, 'failed');
        return {
          success: false,
          error: updateResult.error || 'Failed to update race event',
        };
      }

      // Update extraction status to 'completed'
      await this.updateExtractionStatus(raceId, 'completed');

      // Link source document if not already linked
      await this.linkSourceDocument(raceId, documentId, documentUrl);

      // Store extraction result in document's ai_analysis for persistence
      await this.storeExtractionInDocument(documentId, raceData, extractionResult.overallConfidence);

      logger.debug('Extraction completed successfully', {
        raceId,
        extractedFields: extractedFieldNames.length,
      });

      return {
        success: true,
        extractedFields: extractedFieldNames,
        data: raceData,
        confidence: extractionResult.overallConfidence,
      };
    } catch (error: any) {
      logger.error('Extraction error', { error, raceId, documentUrl });
      await this.updateExtractionStatus(raceId, 'failed');
      return {
        success: false,
        error: error.message || 'Unexpected error during extraction',
      };
    }
  }

  /**
   * Extract data from pasted text content and update the race event
   * Used as fallback when URL-based extraction fails (e.g., PDFs)
   */
  async extractFromText(params: ExtractFromTextParams): Promise<ExtractionResult> {
    const { text, documentId, raceId, documentType } = params;

    logger.debug('Starting text extraction', { textLength: text.length, documentId, raceId, documentType });

    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: 'No text content provided',
      };
    }

    try {
      // Update extraction status to 'processing'
      await this.updateExtractionStatus(raceId, 'processing');

      // Call the Edge Function with text parameter
      const extractionResult = await this.callExtractionEdgeFunctionWithText(text.trim());

      if (!extractionResult.success) {
        await this.updateExtractionStatus(raceId, 'failed');
        return {
          success: false,
          error: extractionResult.error || 'Text extraction failed',
        };
      }

      // Get the race data (first race if multi-race document)
      const raceData = extractionResult.races?.[0] || extractionResult.data;

      if (!raceData) {
        await this.updateExtractionStatus(raceId, 'failed');
        return {
          success: false,
          error: 'No race data found in extracted text',
        };
      }

      // Map extracted data to race_events fields and update
      const updateFields = this.mapToRaceEventUpdate(raceData);
      const extractedFieldNames = Object.keys(updateFields).filter(
        (key) => updateFields[key] !== null && updateFields[key] !== undefined
      );

      logger.debug('Mapped fields from text', { updateFields, extractedFieldNames });

      // Update the race event with extracted data
      const updateResult = await this.updateRaceEvent(raceId, updateFields);

      if (!updateResult.success) {
        await this.updateExtractionStatus(raceId, 'failed');
        return {
          success: false,
          error: updateResult.error || 'Failed to update race event',
        };
      }

      // Update extraction status to 'completed'
      await this.updateExtractionStatus(raceId, 'completed');

      // Link source document reference
      await this.linkSourceDocumentFromText(raceId, documentId);

      // Store extraction result in document's ai_analysis for persistence
      await this.storeExtractionInDocument(documentId, raceData, extractionResult.overallConfidence);

      logger.debug('Text extraction completed successfully', {
        raceId,
        extractedFields: extractedFieldNames.length,
      });

      return {
        success: true,
        extractedFields: extractedFieldNames,
        data: raceData,
        confidence: extractionResult.overallConfidence,
      };
    } catch (error: any) {
      logger.error('Text extraction error', { error, raceId, textLength: text.length });
      await this.updateExtractionStatus(raceId, 'failed');
      return {
        success: false,
        error: error.message || 'Unexpected error during text extraction',
      };
    }
  }

  /**
   * Call the extract-race-details Edge Function with URL parameter
   * For PDF URLs, first extracts text via extract-pdf-text, then processes
   */
  private async callExtractionEdgeFunction(url: string): Promise<{
    success: boolean;
    races?: ComprehensiveRaceData[];
    data?: ComprehensiveRaceData;
    overallConfidence?: number;
    error?: string;
  }> {
    const authToken = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

    if (!authToken || !supabaseUrl) {
      return { success: false, error: 'Missing Supabase configuration' };
    }

    // Check if this is a PDF URL - need to extract text first
    const isPdf = url.toLowerCase().endsWith('.pdf') ||
      url.toLowerCase().includes('.pdf?') ||
      url.toLowerCase().includes('/pdf/');

    if (isPdf) {
      logger.debug('PDF URL detected, extracting text first', { url });

      // Step 1: Extract text from PDF
      const pdfTextResult = await this.extractTextFromPdfUrl(url);

      if (!pdfTextResult.success || !pdfTextResult.text) {
        return {
          success: false,
          error: pdfTextResult.error || 'Failed to extract text from PDF',
        };
      }

      logger.debug('PDF text extracted', { textLength: pdfTextResult.text.length });

      // Step 2: Extract race details from text
      return this.callExtractionEdgeFunctionWithText(pdfTextResult.text);
    }

    // Non-PDF URL - call extract-race-details directly
    const functionUrl = `${supabaseUrl}/functions/v1/extract-race-details`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || `API error: ${response.status}`,
        };
      }

      logger.debug('Edge function URL response', {
        success: result.success,
        hasRaces: !!result.races,
        racesLength: result.races?.length,
        overallConfidence: result.overallConfidence,
      });

      // Edge function returns 'races' array, map races[0] to data for compatibility
      return {
        success: result.success,
        races: result.races,
        data: result.races?.[0] || result.data,
        overallConfidence: result.overallConfidence,
        error: result.error,
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timed out' };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract text from a PDF URL using the extract-pdf-text Edge Function
   */
  private async extractTextFromPdfUrl(pdfUrl: string): Promise<{
    success: boolean;
    text?: string;
    error?: string;
  }> {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const authToken = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!authToken || !supabaseUrl) {
      return { success: false, error: 'Missing Supabase configuration' };
    }

    const functionUrl = `${supabaseUrl}/functions/v1/extract-pdf-text`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for PDF extraction

      logger.debug('Calling extract-pdf-text', { pdfUrl });

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: pdfUrl }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || `PDF extraction error: ${response.status}`,
        };
      }

      return {
        success: true,
        text: result.text,
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'PDF extraction timed out' };
      }
      logger.error('PDF text extraction failed', { error, pdfUrl });
      return { success: false, error: error.message };
    }
  }

  /**
   * Call the extract-race-details Edge Function with text content directly
   */
  private async callExtractionEdgeFunctionWithText(text: string): Promise<{
    success: boolean;
    races?: ComprehensiveRaceData[];
    data?: ComprehensiveRaceData;
    overallConfidence?: number;
    error?: string;
  }> {
    const functionUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/extract-race-details`;
    const authToken = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!authToken) {
      return { success: false, error: 'Missing Supabase anon key' };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }), // Send text instead of URL
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || `API error: ${response.status}`,
        };
      }

      logger.debug('Edge function text response', {
        success: result.success,
        hasRaces: !!result.races,
        racesLength: result.races?.length,
        overallConfidence: result.overallConfidence,
      });

      // Edge function returns 'races' array, map races[0] to data for compatibility
      return {
        success: result.success,
        races: result.races,
        data: result.races?.[0] || result.data,
        overallConfidence: result.overallConfidence,
        error: result.error,
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timed out' };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Map ComprehensiveRaceData to race_events update fields
   */
  private mapToRaceEventUpdate(data: ComprehensiveRaceData): Record<string, any> {
    const update: Record<string, any> = {};

    // Basic info
    if (data.venue) update.location = data.venue;
    if (data.raceName) update.name = data.raceName;

    // VHF Channel - prefer primary channel, fallback to first in array
    if (data.vhfChannel) {
      update.vhf_channel = data.vhfChannel;
    } else if (data.vhfChannels && data.vhfChannels.length > 0) {
      update.vhf_channel = data.vhfChannels[0].channel;
    }

    // Race type
    if (data.raceType) {
      update.race_type = data.raceType;
    }

    // Start time - try multiple sources
    if (data.warningSignalTime) {
      update.start_time = this.parseTimeToTimestamp(data.warningSignalTime, data.raceDate);
    } else if (data.startSequence && data.startSequence.length > 0) {
      update.start_time = this.parseTimeToTimestamp(data.startSequence[0].warning, data.raceDate);
    }

    // Course info
    if (data.racingAreaName) update.racing_area_name = data.racingAreaName;
    if (data.classDivisions && data.classDivisions.length > 0) {
      update.boat_class = data.classDivisions[0].name;
    }
    if (data.expectedFleetSize) update.expected_fleet_size = data.expectedFleetSize;
    if (data.potentialCourses && data.potentialCourses.length > 0) {
      update.course_type = data.potentialCourses[0];
    }

    // Distance racing fields
    if (data.raceType === 'distance') {
      if (data.totalDistanceNm) update.total_distance_nm = data.totalDistanceNm;
      if (data.timeLimitHours) update.time_limit_hours = data.timeLimitHours;
      if (data.startFinishSameLocation !== undefined) {
        update.start_finish_same_location = data.startFinishSameLocation;
      }
      if (data.routeWaypoints && data.routeWaypoints.length > 0) {
        update.route_waypoints = data.routeWaypoints;
      }
      if (data.racingAreaDescription) {
        update.route_description = data.racingAreaDescription;
      }
    }

    // GPS coordinates from course marks or racing area
    if (data.marks && data.marks.length > 0) {
      // Use first mark with coordinates as race location approximation
      const firstMark = data.marks.find(m => m.latitude && m.longitude);
      if (firstMark) {
        update.latitude = firstMark.latitude;
        update.longitude = firstMark.longitude;
      }
    }

    // Notes - combine venue-specific notes and description
    const notes: string[] = [];
    if (data.description) notes.push(data.description);
    if (data.venueSpecificNotes) notes.push(data.venueSpecificNotes);
    if (notes.length > 0) update.notes = notes.join('\n\n');

    // Series info
    if (data.eventSeriesName) {
      update.race_series = data.eventSeriesName;
    }

    return update;
  }

  /**
   * Parse a time string to a full timestamp
   */
  private parseTimeToTimestamp(time: string, date?: string): string | null {
    if (!time) return null;

    // Handle various time formats: "0840hrs", "08:40", "0840"
    let hours: number;
    let minutes: number;

    const match = time.match(/(\d{1,2}):?(\d{2})/);
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
    } else {
      return null;
    }

    // If we have a date, combine them
    if (date) {
      try {
        const dateObj = new Date(date);
        dateObj.setHours(hours, minutes, 0, 0);
        return dateObj.toISOString();
      } catch {
        // Fall through to time-only return
      }
    }

    // Return just the time in HH:MM format
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * Update race event with extracted data
   */
  private async updateRaceEvent(
    raceId: string,
    updateFields: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    if (Object.keys(updateFields).length === 0) {
      return { success: true }; // Nothing to update
    }

    try {
      // First try to update race_events (for race event IDs)
      const { error: eventError } = await supabase
        .from('race_events')
        .update(updateFields)
        .eq('id', raceId);

      if (eventError) {
        // May not be a race_event, try regattas
        const { error: regattaError } = await supabase
          .from('regattas')
          .update({
            name: updateFields.name,
            venue: updateFields.location,
            notes: updateFields.notes,
          })
          .eq('id', raceId);

        if (regattaError) {
          logger.error('Failed to update race', { eventError, regattaError });
          return { success: false, error: 'Failed to update race record' };
        }
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update extraction status on the race event
   */
  private async updateExtractionStatus(
    raceId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed'
  ): Promise<void> {
    try {
      await supabase
        .from('race_events')
        .update({ extraction_status: status })
        .eq('id', raceId);
    } catch (error) {
      logger.warn('Failed to update extraction status', { error, raceId, status });
    }
  }

  /**
   * Link source document reference to the race
   */
  private async linkSourceDocument(
    raceId: string,
    documentId: string,
    documentUrl: string
  ): Promise<void> {
    try {
      // Get current source_documents
      const { data: race } = await supabase
        .from('race_events')
        .select('source_documents')
        .eq('id', raceId)
        .single();

      const sourceDocuments = (race?.source_documents as any[]) || [];

      // Add new document reference if not already present
      if (!sourceDocuments.some((doc: any) => doc.id === documentId)) {
        sourceDocuments.push({
          id: documentId,
          url: documentUrl,
          extractedAt: new Date().toISOString(),
        });

        await supabase
          .from('race_events')
          .update({ source_documents: sourceDocuments })
          .eq('id', raceId);
      }
    } catch (error) {
      logger.warn('Failed to link source document', { error, raceId, documentId });
    }
  }

  /**
   * Link source document reference from text-based extraction
   */
  private async linkSourceDocumentFromText(
    raceId: string,
    documentId: string
  ): Promise<void> {
    try {
      // Get current source_documents
      const { data: race } = await supabase
        .from('race_events')
        .select('source_documents')
        .eq('id', raceId)
        .single();

      const sourceDocuments = (race?.source_documents as any[]) || [];

      // Add new document reference if not already present
      if (!sourceDocuments.some((doc: any) => doc.id === documentId)) {
        sourceDocuments.push({
          id: documentId,
          source: 'text', // Mark as text-based extraction
          extractedAt: new Date().toISOString(),
        });

        await supabase
          .from('race_events')
          .update({ source_documents: sourceDocuments })
          .eq('id', raceId);
      }
    } catch (error) {
      logger.warn('Failed to link source document from text', { error, raceId, documentId });
    }
  }

  /**
   * Store extraction result in the document's ai_analysis field for persistence
   */
  private async storeExtractionInDocument(
    documentId: string,
    data: ComprehensiveRaceData,
    confidence?: number
  ): Promise<void> {
    try {
      if (!data) {
        logger.warn('No data to store in document', { documentId });
        return;
      }

      const aiAnalysis = {
        extractedAt: new Date().toISOString(),
        confidence,
        raceData: data,
      };

      // Validate JSON serialization
      let serializedSize = 0;
      try {
        const serialized = JSON.stringify(aiAnalysis);
        serializedSize = serialized.length;
        logger.debug('Storing extraction in document', {
          documentId,
          dataKeys: data ? Object.keys(data).length : 0,
          venue: data.venue,
          raceDate: data.raceDate,
          serializedSize,
        });
      } catch (serializeError) {
        logger.error('Failed to serialize extraction data', { serializeError, documentId });
        return;
      }

      const { data: updateResult, error } = await supabase
        .from('documents')
        .update({
          ai_analysis: aiAnalysis,
          used_for_extraction: true,
          extraction_timestamp: new Date().toISOString(),
        })
        .eq('id', documentId)
        .select('id, ai_analysis');

      if (error) {
        logger.error('Supabase error storing extraction', { error, documentId });
      } else {
        logger.debug('Stored extraction in document', {
          documentId,
          updatedRows: updateResult?.length || 0,
          storedKeys: updateResult?.[0]?.ai_analysis ? Object.keys(updateResult[0].ai_analysis) : [],
        });
      }
    } catch (error) {
      logger.warn('Failed to store extraction in document', { error, documentId });
    }
  }

  /**
   * Get stored extraction data from a document
   */
  async getStoredExtraction(documentId: string): Promise<ExtractionResult | null> {
    try {
      const { data: doc, error } = await supabase
        .from('documents')
        .select('ai_analysis')
        .eq('id', documentId)
        .single();

      if (error || !doc?.ai_analysis) {
        return null;
      }

      const aiAnalysis = doc.ai_analysis as {
        extractedAt?: string;
        confidence?: number;
        raceData?: ComprehensiveRaceData;
      };

      if (!aiAnalysis.raceData) {
        return null;
      }

      return {
        success: true,
        data: aiAnalysis.raceData,
        confidence: aiAnalysis.confidence,
        extractedFields: Object.keys(aiAnalysis.raceData).filter(
          (key) => aiAnalysis.raceData?.[key as keyof ComprehensiveRaceData] != null
        ),
      };
    } catch (error) {
      logger.warn('Error getting stored extraction', { error, documentId });
      return null;
    }
  }
}

export const documentExtractionService = new DocumentExtractionService();

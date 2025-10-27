/**
 * Comprehensive Race Extraction Agent
 * AI-powered extraction of all race details from freeform text
 * Handles sailing instructions, race documents, or any text with race information
 */

import { supabase } from '@/services/supabase';

export interface ComprehensiveRaceData {
  // Basic Information
  raceName: string;
  raceDate: string;
  venue: string;
  description?: string;

  // Timing & Sequence
  warningSignalTime?: string;
  warningSignalType?: string;
  preparatoryMinutes?: number;
  classIntervalMinutes?: number;
  totalStarts?: number;
  startSequence?: Array<{ class: string; warning: string; start: string }>;
  plannedFinishTime?: string;
  timeLimitMinutes?: number;

  // Communications & Control
  vhfChannel?: string;
  vhfBackupChannel?: string;
  safetyChannel?: string;
  rcBoatName?: string;
  rcBoatPosition?: string;
  markBoats?: Array<{ mark: string; boat: string; position: string }>;
  raceOfficer?: string;
  protestCommittee?: string;

  // Course & Start Area
  startAreaName?: string;
  startAreaDescription?: string;
  startLineLength?: number;
  potentialCourses?: string[];
  courseSelectionCriteria?: string;
  courseDiagramUrl?: string;

  // Race Rules & Penalties
  scoringSystem?: string;
  penaltySystem?: string;
  penaltyDetails?: string;
  specialRules?: string[];
  sailingInstructionsUrl?: string;
  noticeOfRaceUrl?: string;

  // Class & Fleet
  classDivisions?: Array<{ name: string; fleet_size: number }>;
  expectedFleetSize?: number;

  // Weather & Conditions
  expectedWindDirection?: number;
  expectedWindSpeedMin?: number;
  expectedWindSpeedMax?: number;
  expectedConditions?: string;
  tideAtStart?: string;

  // Tactical Notes
  venueSpecificNotes?: string;
  favoredSide?: string;
  laylineStrategy?: string;
  startStrategy?: string;

  // Registration & Logistics
  registrationDeadline?: string;
  entryFeeAmount?: number;
  entryFeeCurrency?: string;
  checkInTime?: string;
  skipperBriefingTime?: string;

  // GPS Coordinates & Course Layout (NEW - from enhanced Skills extraction)
  marks?: Array<{
    name: string;
    latitude: number; // decimal degrees
    longitude: number; // decimal degrees
    type: string; // "windward", "leeward", "start", "finish", "wing", "gate"
    color?: string;
    shape?: string;
  }>;

  racingArea?: {
    type: 'rectangle' | 'polygon';
    bounds: {
      north: number; // decimal degrees
      south: number;
      east: number;
      west: number;
    };
  };

  distances?: {
    beat?: { distance: number; unit: string }; // e.g., { distance: 1.2, unit: "nm" }
    run?: { distance: number; unit: string };
  };
}

export class ComprehensiveRaceExtractionAgent {
  /**
   * Extract comprehensive race details from freeform text
   */
  async extractRaceDetails(text: string): Promise<{
    success: boolean;
    data?: ComprehensiveRaceData;
    error?: string;
    confidence?: number;
  }> {
    try {
      console.log('[ComprehensiveRaceExtractionAgent] Starting extraction...');
      console.log('[ComprehensiveRaceExtractionAgent] Text length:', text.length);
      console.log('[ComprehensiveRaceExtractionAgent] Text preview:', text.substring(0, 100));

      // Call Supabase Edge Function with timeout
      console.log('[ComprehensiveRaceExtractionAgent] Invoking edge function...');
      console.log('[ComprehensiveRaceExtractionAgent] Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);

      // Use anon key for edge function calls (edge functions handle their own auth)
      // Note: Edge functions have access to user context via the Authorization header
      // but for public operations like extraction, we use the anon key
      const authToken = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      console.log('[ComprehensiveRaceExtractionAgent] Using anon key for edge function auth');
      console.log('[ComprehensiveRaceExtractionAgent] Auth token present:', !!authToken);
      console.log('[ComprehensiveRaceExtractionAgent] Auth token length:', authToken?.length);
      if (!authToken) {
        throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY not found in environment variables');
      }

      // Use direct fetch instead of supabase.functions.invoke() due to timeout issues
      const functionUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/extract-race-details`;
      console.log('[ComprehensiveRaceExtractionAgent] Function URL:', functionUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('[ComprehensiveRaceExtractionAgent] Aborting request after 60 seconds');
        controller.abort();
      }, 60000); // Increased to 60 seconds for large documents

      try {
        const requestStart = Date.now();
        console.log('[ComprehensiveRaceExtractionAgent] Sending fetch request...');
        console.log('[ComprehensiveRaceExtractionAgent] Text length:', text.length, 'characters');

        const requestBody = JSON.stringify({ text });
        console.log('[ComprehensiveRaceExtractionAgent] Request body length:', requestBody.length);

        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: requestBody,
          signal: controller.signal,
        });

        console.log('[ComprehensiveRaceExtractionAgent] Fetch completed without throwing');

        clearTimeout(timeoutId);
        const requestDuration = Date.now() - requestStart;
        console.log('[ComprehensiveRaceExtractionAgent] Response received in', requestDuration, 'ms');
        console.log('[ComprehensiveRaceExtractionAgent] Response status:', response.status);

        // Parse response body first (even for 400 errors, as they may contain partial data)
        let result;
        try {
          result = await response.json();
          console.log('[ComprehensiveRaceExtractionAgent] Edge function response:', result);
        } catch (jsonError: any) {
          console.error('[ComprehensiveRaceExtractionAgent] Failed to parse JSON response:', jsonError);
          throw new Error(`Failed to parse response: ${jsonError.message}`);
        }

        // Check if response is not OK but has partial data (400 with partialData)
        if (!response.ok) {
          console.warn('[ComprehensiveRaceExtractionAgent] Response not OK, status:', response.status);

          // If we have partial data despite the error, treat it as a partial success
          if (result.partialData && Object.keys(result.partialData).length > 0) {
            console.log('[ComprehensiveRaceExtractionAgent] Found partial data in error response, treating as partial success');
            return {
              success: true,
              data: result.partialData as ComprehensiveRaceData,
              confidence: 0.5,
              partialExtraction: true,
              missingFields: result.error,
            };
          }

          // No partial data, throw error
          throw new Error(`Edge function returned ${response.status}: ${result.error || 'Unknown error'}`);
        }

        if (!result.success) {
          console.warn('[ComprehensiveRaceExtractionAgent] Extraction incomplete:', result.error);

          // If we have partial data, return it as a success so user can fill in missing fields
          if (result.partialData && Object.keys(result.partialData).length > 0) {
            console.log('[ComprehensiveRaceExtractionAgent] Returning partial data for user completion');
            return {
              success: true,
              data: result.partialData as ComprehensiveRaceData,
              confidence: 0.5, // Lower confidence since data is incomplete
              partialExtraction: true,
              missingFields: result.error, // Include error message about missing fields
            };
          }

          return {
            success: false,
            error: result.error || 'Failed to extract race details',
          };
        }

        console.log('[ComprehensiveRaceExtractionAgent] Extraction successful:', {
          fieldsExtracted: Object.keys(result.data).length,
          confidence: result.confidence,
        });

        return {
          success: true,
          data: result.data as ComprehensiveRaceData,
          confidence: result.confidence,
        };
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        console.error('[ComprehensiveRaceExtractionAgent] Fetch error:', fetchError);

        let errorMessage = fetchError.message || 'Failed to call edge function';
        if (fetchError.name === 'AbortError') {
          errorMessage = 'Request timed out after 60 seconds. The document may be too large or complex. Try with less text or a simpler document.';
        }

        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error: any) {
      console.error('[ComprehensiveRaceExtractionAgent] Error:', error);

      return {
        success: false,
        error: error.message || 'Failed to extract race details',
      };
    }
  }

  /**
   * Enhance partial race data with AI suggestions
   * (Future feature - placeholder for now)
   */
  async enhanceWithSuggestions(
    partialData: Partial<ComprehensiveRaceData>,
    venueId?: string
  ): Promise<Partial<ComprehensiveRaceData>> {
    // TODO: Implement AI enhancement based on venue intelligence
    // - Suggest typical start times for venue
    // - Suggest VHF channels based on venue
    // - Suggest tactical notes based on venue conditions
    // - Suggest favored side based on historical data
    return partialData;
  }
}

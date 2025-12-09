/**
 * Comprehensive Race Extraction Agent
 * AI-powered extraction of all race details from freeform text
 * Handles sailing instructions, race documents, or any text with race information
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

export interface ComprehensiveRaceData {
  // Race Type - determines UI and strategy approach
  raceType?: 'fleet' | 'distance';  // 'fleet' = buoy racing, 'distance' = offshore/passage
  
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
  vhfChannel?: string;  // Legacy single channel (deprecated, use vhfChannels)
  vhfBackupChannel?: string;
  safetyChannel?: string;
  vhfChannels?: Array<{
    channel: string;
    purpose: string;      // e.g., "Inner Starting Line", "Outer Starting Line", "Safety", "Race Committee"
    classes?: string[];   // Which classes use this channel, e.g., ["Dragon", "J/80", "Fast Fleet"]
  }>;
  rcBoatName?: string;
  rcBoatPosition?: string;
  markBoats?: Array<{ mark: string; boat: string; position: string }>;
  raceOfficer?: string;
  protestCommittee?: string;

  // Course & Start Area
  startAreaName?: string;  // Legacy single start area (deprecated)
  startAreaDescription?: string;
  startLineLength?: number;
  
  // Multiple Start Lines (for races with Inner/Outer lines, different class starts)
  startLines?: Array<{
    name: string;           // "Inner Starting Line", "Outer Starting Line"
    description?: string;   // How to start (e.g., "west to east between IDM and ODM")
    classes: string[];      // Which classes use this line ["Dragon", "J/80", "Etchells"]
    vhfChannel?: string;    // VHF channel for this line
    marks?: {
      starboardEnd?: string; // e.g., "Starter's Box", "Kellett VIII"
      portEnd?: string;      // e.g., "ODM", "orange inflatable buoy"
    };
    direction?: string;     // e.g., "W-E"
    startTimes?: Array<{    // Start times for classes on this line
      class: string;
      flag: string;
      time: string;
    }>;
  }>;
  
  potentialCourses?: string[];
  courseSelectionCriteria?: string;
  courseDiagramUrl?: string;
  
  // Racing Area (overall geographic bounds)
  racingAreaName?: string;        // e.g., "Hong Kong Island"
  racingAreaDescription?: string; // e.g., "Hong Kong Island to Starboard"
  approximateDistance?: string;   // e.g., "26nm"
  
  // Prohibited Areas (TSS, military zones, etc.)
  prohibitedAreas?: Array<{
    name: string;
    description?: string;
    coordinates?: Array<{ lat: number; lng: number }>;
    consequence?: string;  // e.g., "disqualified without a hearing"
  }>;
  
  // Course Gates
  gates?: Array<{
    name: string;           // e.g., "Stanley Bay GATE"
    description?: string;
    orientation?: string;   // e.g., "SE-NW"
    portMark?: string;
    starboardMark?: string;
    canShortenHere?: boolean;
  }>;
  
  // Finish Area
  finishAreaName?: string;
  finishAreaDescription?: string;
  finishAreaCoordinates?: { lat: number; lng: number };

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

  // NOR Document Fields
  supplementarySIUrl?: string;
  norAmendments?: Array<{ url?: string; date: string; description: string }>;

  // Governing Rules
  racingRulesSystem?: string;
  classRules?: string;
  prescriptions?: string;
  additionalDocuments?: string[];

  // Eligibility & Entry
  eligibilityRequirements?: string;
  entryFormUrl?: string;
  entryDeadline?: string;
  lateEntryPolicy?: string;

  // Schedule Details
  eventSeriesName?: string;
  eventType?: string;
  racingDays?: string[];
  racesPerDay?: number;
  firstWarningSignal?: string;
  reserveDays?: string[];

  // Enhanced Course Information
  courseAttachmentReference?: string;
  courseAreaDesignation?: string;

  // Enhanced Scoring
  seriesRacesRequired?: number;
  discardsPolicy?: string;

  // Safety
  safetyRequirements?: string;
  retirementNotificationRequirements?: string;

  // Insurance
  minimumInsuranceCoverage?: number;
  insurancePolicyReference?: string;

  // Prizes
  prizesDescription?: string;
  prizePresentationDetails?: string;

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

  // ============================================
  // Distance Racing Fields (when raceType === 'distance')
  // ============================================
  
  // Route waypoints for distance/offshore races
  routeWaypoints?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    type: 'start' | 'waypoint' | 'gate' | 'finish';
    required: boolean;
    passingSide?: 'port' | 'starboard' | 'either';
    notes?: string;  // e.g., "Leave to port", "Rounding mark"
  }>;
  
  // Total race distance in nautical miles
  totalDistanceNm?: number;
  
  // Time limit in hours for distance races
  timeLimitHours?: number;
  
  // Whether start and finish are at same location (circumnavigation vs point-to-point)
  startFinishSameLocation?: boolean;
  
  // Tide gates - optimal timing windows based on tidal currents
  tideGates?: Array<{
    location: string;
    optimalPassingTime: string;  // ISO time or relative time
    currentDirection: 'favorable' | 'adverse';
    notes?: string;
  }>;
  
  // Shipping/traffic separation schemes to avoid or navigate
  trafficSeparationSchemes?: Array<{
    name: string;
    crossingStrategy?: string;
    coordinates?: Array<{ lat: number; lng: number }>;
  }>;
}

const logger = createLogger('ComprehensiveRaceExtractionAgent');
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
      logger.debug('[ComprehensiveRaceExtractionAgent] Starting extraction...');
      logger.debug('[ComprehensiveRaceExtractionAgent] Text length:', text.length);
      logger.debug('[ComprehensiveRaceExtractionAgent] Text preview:', text.substring(0, 100));

      // Call Supabase Edge Function with timeout
      logger.debug('[ComprehensiveRaceExtractionAgent] Invoking edge function...');
      logger.debug('[ComprehensiveRaceExtractionAgent] Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);

      // Use anon key for edge function calls (edge functions handle their own auth)
      // Note: Edge functions have access to user context via the Authorization header
      // but for public operations like extraction, we use the anon key
      const authToken = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      logger.debug('[ComprehensiveRaceExtractionAgent] Using anon key for edge function auth');
      logger.debug('[ComprehensiveRaceExtractionAgent] Auth token present:', !!authToken);
      logger.debug('[ComprehensiveRaceExtractionAgent] Auth token length:', authToken?.length);
      if (!authToken) {
        throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY not found in environment variables');
      }

      // Use direct fetch instead of supabase.functions.invoke() due to timeout issues
      const functionUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/extract-race-details`;
      logger.debug('[ComprehensiveRaceExtractionAgent] Function URL:', functionUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('[ComprehensiveRaceExtractionAgent] Aborting request after 60 seconds');
        controller.abort();
      }, 60000); // Increased to 60 seconds for large documents

      try {
        const requestStart = Date.now();
        logger.debug('[ComprehensiveRaceExtractionAgent] Sending fetch request...');
        logger.debug('[ComprehensiveRaceExtractionAgent] Text length:', text.length, 'characters');

        const requestBody = JSON.stringify({ text });
        logger.debug('[ComprehensiveRaceExtractionAgent] Request body length:', requestBody.length);

        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: requestBody,
          signal: controller.signal,
        });

        logger.debug('[ComprehensiveRaceExtractionAgent] Fetch completed without throwing');

        clearTimeout(timeoutId);
        const requestDuration = Date.now() - requestStart;
        logger.debug('[ComprehensiveRaceExtractionAgent] Response received in', requestDuration, 'ms');
        logger.debug('[ComprehensiveRaceExtractionAgent] Response status:', response.status);

        // Parse response body first (even for 400 errors, as they may contain partial data)
        let result;
        try {
          result = await response.json();
          logger.debug('[ComprehensiveRaceExtractionAgent] Edge function response:', result);
        } catch (jsonError: any) {
          console.error('[ComprehensiveRaceExtractionAgent] Failed to parse JSON response:', jsonError);
          throw new Error(`Failed to parse response: ${jsonError.message}`);
        }

        // Check if response is not OK but has partial data (400 with partialData)
        if (!response.ok) {
          console.warn('[ComprehensiveRaceExtractionAgent] Response not OK, status:', response.status);

          // If we have partial data despite the error, treat it as a partial success
          if (result.partialData && Object.keys(result.partialData).length > 0) {
            logger.debug('[ComprehensiveRaceExtractionAgent] Found partial data in error response, treating as partial success');
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
            logger.debug('[ComprehensiveRaceExtractionAgent] Returning partial data for user completion');
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

        logger.debug('[ComprehensiveRaceExtractionAgent] Extraction successful:', {
          confidence: result.confidence || result.overallConfidence,
        });

        // Handle multi-race response (new edge function format)
        if (result.multipleRaces && result.races && result.races.length > 0) {
          logger.debug('[ComprehensiveRaceExtractionAgent] Multi-race extraction detected:', result.races.length, 'races');
          // Return the multi-race data structure directly
          // The caller (ComprehensiveRaceEntry) will handle showing MultiRaceSelectionScreen
          return {
            success: true,
            data: result as any, // Pass through the full multi-race structure
            confidence: result.overallConfidence,
          };
        }

        // Handle single-race response (legacy format or single race in new format)
        const singleRaceData = result.data || (result.races && result.races.length === 1 ? result.races[0] : null);

        if (!singleRaceData) {
          return {
            success: false,
            error: 'No race data found in extraction result',
          };
        }

        return {
          success: true,
          data: singleRaceData as ComprehensiveRaceData,
          confidence: result.confidence || result.overallConfidence,
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

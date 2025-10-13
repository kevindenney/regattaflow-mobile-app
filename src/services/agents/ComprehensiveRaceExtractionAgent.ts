/**
 * Comprehensive Race Extraction Agent
 * AI-powered extraction of all race details from freeform text
 * Handles sailing instructions, race documents, or any text with race information
 */

import { supabase } from '@/src/services/supabase';

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

      // Call Supabase Edge Function instead of Anthropic SDK directly
      console.log('[ComprehensiveRaceExtractionAgent] Invoking edge function...');
      const { data, error } = await supabase.functions.invoke('extract-race-details', {
        body: { text },
      });

      console.log('[ComprehensiveRaceExtractionAgent] Edge function response:', { data, error });

      if (error) {
        console.error('[ComprehensiveRaceExtractionAgent] Edge function error:', error);
        throw new Error(error.message || 'Edge function invocation failed');
      }

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Failed to extract race details',
        };
      }

      console.log('[ComprehensiveRaceExtractionAgent] Extraction successful:', {
        fieldsExtracted: Object.keys(data.data).length,
        confidence: data.confidence,
      });

      return {
        success: true,
        data: data.data as ComprehensiveRaceData,
        confidence: data.confidence,
      };
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

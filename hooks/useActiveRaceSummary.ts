/**
 * useActiveRaceSummary Hook
 *
 * Computes a normalized summary of the currently active race.
 * Handles multiple data sources: selected race, next race, or demo race.
 */

import { useMemo } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface ActiveRaceSummary {
  id: string;
  name: string;
  series?: string;
  venue?: string;
  startTime?: string;
  warningSignal?: string;
  cleanRegatta?: boolean;
  lastUpdated?: string | null;
}

export interface DemoRace {
  id: string;
  name: string;
  venue: string;
  date: string;
  startTime?: string;
  critical_details?: {
    warning_signal?: string;
  };
}

export interface CurrentVenue {
  name?: string;
}

export interface UseActiveRaceSummaryParams {
  /** Selected race data from database */
  selectedRaceData: {
    id?: string;
    name?: string;
    start_date?: string;
    date?: string;
    venue_name?: string;
    updated_at?: string;
    metadata?: {
      race_name?: string;
      series_name?: string;
      series?: string;
      event_name?: string;
      venue_name?: string;
      warning_signal?: string;
      first_warning?: string;
      signal_time?: string;
      clean_regatta?: boolean;
      updated_at?: string;
      start_time?: string;
    };
  } | null;
  /** Next race from dashboard data */
  nextRace: {
    id?: string;
    name?: string;
    title?: string;
    series?: string;
    event?: string;
    venue?: string;
    date?: string;
    startTime?: string;
    warningSignal?: string;
    cleanRegatta?: boolean;
    updated_at?: string;
  } | null;
  /** Selected demo race */
  selectedDemoRace: DemoRace | null;
  /** Current detected venue */
  currentVenue: CurrentVenue | null;
}

export interface UseActiveRaceSummaryReturn {
  /** Normalized active race summary */
  activeRace: ActiveRaceSummary | null;
}

/**
 * Hook for computing active race summary
 */
export function useActiveRaceSummary({
  selectedRaceData,
  nextRace,
  selectedDemoRace,
  currentVenue,
}: UseActiveRaceSummaryParams): UseActiveRaceSummaryReturn {
  const activeRace = useMemo((): ActiveRaceSummary | null => {
    // Priority 1: Selected race data from database
    if (selectedRaceData?.id) {
      const metadata = selectedRaceData.metadata || {};
      const startTime = selectedRaceData.start_date || selectedRaceData.date || metadata?.start_time;
      return {
        id: selectedRaceData.id,
        name: selectedRaceData.name || metadata?.race_name || 'Upcoming Race',
        series: metadata?.series_name || metadata?.series || metadata?.event_name || 'Corinthian Series',
        venue: metadata?.venue_name || selectedRaceData.venue_name || currentVenue?.name || 'Port Shelter',
        startTime: typeof startTime === 'string' ? startTime : startTime ? new Date(startTime as unknown as string).toISOString() : undefined,
        warningSignal: metadata?.warning_signal || metadata?.first_warning || metadata?.signal_time || nextRace?.startTime || '13:36',
        cleanRegatta: metadata?.clean_regatta !== false,
        lastUpdated: metadata?.updated_at || selectedRaceData.updated_at || null,
      };
    }

    // Priority 2: Next race from dashboard
    if (nextRace?.id) {
      return {
        id: nextRace.id,
        name: nextRace.name || nextRace.title || 'Upcoming Race',
        series: nextRace.series || nextRace.event || 'Corinthian Series',
        venue: nextRace.venue || currentVenue?.name || 'Port Shelter',
        startTime: nextRace.date || nextRace.startTime,
        warningSignal: nextRace.warningSignal || nextRace.startTime || '13:36',
        cleanRegatta: nextRace.cleanRegatta ?? true,
        lastUpdated: nextRace.updated_at || null,
      };
    }

    // Priority 3: Demo race
    if (selectedDemoRace) {
      return {
        id: selectedDemoRace.id,
        name: selectedDemoRace.name,
        series: 'Demo Series',
        venue: selectedDemoRace.venue,
        startTime: selectedDemoRace.date,
        warningSignal: selectedDemoRace.critical_details?.warning_signal || selectedDemoRace.startTime,
        cleanRegatta: true,
        lastUpdated: null,
      };
    }

    return null;
  }, [
    // Selected race data fields
    selectedRaceData?.id,
    selectedRaceData?.name,
    selectedRaceData?.start_date,
    selectedRaceData?.date,
    selectedRaceData?.venue_name,
    selectedRaceData?.updated_at,
    selectedRaceData?.metadata?.race_name,
    selectedRaceData?.metadata?.series_name,
    selectedRaceData?.metadata?.series,
    selectedRaceData?.metadata?.event_name,
    selectedRaceData?.metadata?.venue_name,
    selectedRaceData?.metadata?.warning_signal,
    selectedRaceData?.metadata?.first_warning,
    selectedRaceData?.metadata?.signal_time,
    selectedRaceData?.metadata?.clean_regatta,
    selectedRaceData?.metadata?.updated_at,
    selectedRaceData?.metadata?.start_time,
    // Next race fields
    nextRace?.id,
    nextRace?.name,
    nextRace?.title,
    nextRace?.series,
    nextRace?.event,
    nextRace?.venue,
    nextRace?.date,
    nextRace?.startTime,
    nextRace?.warningSignal,
    nextRace?.cleanRegatta,
    nextRace?.updated_at,
    // Demo race fields
    selectedDemoRace?.id,
    selectedDemoRace?.name,
    selectedDemoRace?.venue,
    selectedDemoRace?.date,
    selectedDemoRace?.startTime,
    selectedDemoRace?.critical_details?.warning_signal,
    // Current venue
    currentVenue?.name,
  ]);

  return { activeRace };
}

export default useActiveRaceSummary;

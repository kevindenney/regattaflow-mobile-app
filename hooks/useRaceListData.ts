/**
 * useRaceListData Hook
 *
 * Computes derived race list data including:
 * - Past race IDs for result fetching
 * - Normalized live races with metadata merged
 * - Safe recent races (enriched > live > fallback)
 * - Next race calculation from timeline
 * - Preview text for header display
 */

import { useMemo } from 'react';
import { getDemoRaceStartDateISO, getDemoRaceStartTimeLabel } from '@/lib/demo/demoDate';

// =============================================================================
// TYPES
// =============================================================================

export interface LiveRace {
  id?: string;
  start_date?: string;
  date?: string;
  startTime?: string;
  warning_signal_time?: string;
  venue?: string;
  wind?: unknown;
  tide?: unknown;
  weatherStatus?: string;
  weatherError?: string;
  strategy?: unknown;
  critical_details?: unknown;
  isDemo?: boolean;
  metadata?: {
    venue_name?: string;
    wind?: unknown;
    tide?: unknown;
    weatherStatus?: string;
    weatherError?: string;
    strategy?: unknown;
    critical_details?: unknown;
  };
}

// =============================================================================
// DEMO RACE (shown when user has no races)
// =============================================================================

/**
 * Demo race shown in CardGrid when user has no real races.
 * Allows users to explore the UI before adding their first race.
 *
 * Note: No `created_by` field, so delete/edit menu won't appear.
 */
export const DEMO_RACE: LiveRace = {
  id: 'demo-race',
  start_date: getDemoRaceStartDateISO(7, 11, 0),
  date: getDemoRaceStartDateISO(7, 11, 0),
  startTime: getDemoRaceStartTimeLabel(11, 0),
  venue: 'Your Local Yacht Club',
  isDemo: true,
  metadata: {
    venue_name: 'Your Local Yacht Club',
  },
};

export interface UseRaceListDataParams {
  /** Live races from real-time subscription */
  liveRaces: LiveRace[] | null | undefined;
  /** Enriched races with weather data */
  enrichedRaces: LiveRace[] | null | undefined;
  /** Recent races from dashboard data (fallback) */
  recentRaces: unknown;
}

export interface UseRaceListDataReturn {
  /** IDs of past races for result fetching */
  pastRaceIds: string[];
  /** Live races with metadata merged into top-level fields */
  normalizedLiveRaces: LiveRace[];
  /** Safe recent races (prioritizes enriched > live > fallback) */
  safeRecentRaces: LiveRace[];
  /** Next upcoming race from timeline */
  safeNextRace: LiveRace;
  /** Preview text for header (e.g., "Today", "Tomorrow", "in 3 days") */
  nextRacePreview: string | null;
  /** Whether there are real (non-demo) races */
  hasRealRaces: boolean;
  /** Most recent race (first in list) */
  recentRace: LiveRace | null;
}

/**
 * Hook for computing race list derived data
 */
export function useRaceListData({
  liveRaces,
  enrichedRaces,
  recentRaces,
}: UseRaceListDataParams): UseRaceListDataReturn {
  // Get past race IDs for fetching results
  const pastRaceIds = useMemo((): string[] => {
    const now = new Date();
    return (liveRaces || [])
      .filter((race) => {
        const raceDate = new Date(race.start_date || race.date || '');
        return raceDate < now;
      })
      .map((race) => race.id)
      .filter((id): id is string => Boolean(id));
  }, [liveRaces]);

  // Normalize live races with metadata merged
  const normalizedLiveRaces = useMemo((): LiveRace[] => {
    if (!liveRaces || liveRaces.length === 0) {
      return [];
    }

    return liveRaces.map((regatta) => {
      const metadata = regatta?.metadata ?? {};
      // Extract time from start_date using UTC to match how Edit Form stores/reads it
      const derivedStartTime =
        regatta?.startTime ??
        regatta?.warning_signal_time ??
        (regatta?.start_date
          ? (() => {
              const d = new Date(regatta.start_date);
              const hours = d.getUTCHours().toString().padStart(2, '0');
              const minutes = d.getUTCMinutes().toString().padStart(2, '0');
              return `${hours}:${minutes}`;
            })()
          : undefined);

      return {
        ...regatta,
        venue: regatta?.venue ?? metadata?.venue_name ?? 'Venue TBD',
        date: regatta?.date ?? regatta?.start_date,
        startTime: derivedStartTime,
        wind: regatta?.wind ?? metadata?.wind,
        tide: regatta?.tide ?? metadata?.tide,
        weatherStatus: regatta?.weatherStatus ?? metadata?.weatherStatus,
        weatherError: regatta?.weatherError ?? metadata?.weatherError,
        strategy: regatta?.strategy ?? metadata?.strategy,
        critical_details: regatta?.critical_details ?? metadata?.critical_details,
      };
    });
  }, [liveRaces]);

  // Safe recent races - prioritize enriched > live > fallback
  const safeRecentRaces = useMemo((): LiveRace[] => {
    if (enrichedRaces && enrichedRaces.length > 0) {
      return enrichedRaces;
    }
    if (normalizedLiveRaces.length > 0) {
      return normalizedLiveRaces;
    }
    return Array.isArray(recentRaces) ? (recentRaces as LiveRace[]) : [];
  }, [enrichedRaces, normalizedLiveRaces, recentRaces]);

  // Calculate next race from timeline
  const safeNextRace = useMemo((): LiveRace => {
    if (safeRecentRaces.length === 0) return {};

    const now = new Date();
    const nextRaceIndex = safeRecentRaces.findIndex((race) => {
      const raceDateTime = new Date(race.date || race.start_date || '');
      // Race is "upcoming" if estimated end time (start + 3 hours) is still in the future
      const raceEndEstimate = new Date(raceDateTime.getTime() + 3 * 60 * 60 * 1000);
      return raceEndEstimate > now;
    });

    return nextRaceIndex >= 0 ? safeRecentRaces[nextRaceIndex] : {};
  }, [safeRecentRaces]);

  // Calculate next race preview text for header
  const nextRacePreview = useMemo((): string | null => {
    if (!safeNextRace?.date) return null;
    const daysUntil = Math.ceil(
      (new Date(safeNextRace.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    if (daysUntil > 0 && daysUntil <= 7) return `in ${daysUntil} days`;
    return null;
  }, [safeNextRace?.date]);

  // Derived values
  const recentRace = safeRecentRaces.length > 0 ? safeRecentRaces[0] : null;
  const hasRealRaces = safeRecentRaces.length > 0 || !!safeNextRace?.id;

  return {
    pastRaceIds,
    normalizedLiveRaces,
    safeRecentRaces,
    safeNextRace,
    nextRacePreview,
    hasRealRaces,
    recentRace,
  };
}

export default useRaceListData;

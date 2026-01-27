/**
 * Hook to fetch race type and data for strategy configuration
 *
 * Returns race type and data needed to generate dynamic strategy sections
 * (e.g., leg sections for distance races, peak sections for Four Peaks)
 */

import { createLogger } from '@/lib/utils/logger';
import { getStrategyPhasesAndSections } from '@/lib/strategy';
import { supabase } from '@/services/supabase';
import type {
  DistanceRaceData,
  PhaseInfo,
  RaceType,
  StrategySectionMeta,
} from '@/types/raceStrategy';
import { FOUR_PEAKS, FOUR_PEAKS_DEFAULT_LEGS } from '@/types/multiActivitySchedule';
import { useCallback, useEffect, useMemo, useState } from 'react';

const logger = createLogger('useRaceTypeStrategy');

/**
 * Four Peaks race ID (hardcoded for now, could be detected by name)
 */
const FOUR_PEAKS_RACE_ID = 'd19657dd-722c-423b-a07b-8060e5a57f31';
const FOUR_PEAKS_RACE_NAME = 'Four Peaks Race';

interface UseRaceTypeStrategyResult {
  /** The race type (fleet, distance, match, team) */
  raceType: RaceType;
  /** Data for generating dynamic sections (legs, peaks, etc.) */
  raceData: DistanceRaceData | undefined;
  /** All phases for this race type (static + dynamic) */
  phases: PhaseInfo[];
  /** All sections for this race type (static + dynamic) */
  sections: StrategySectionMeta[];
  /** Loading state */
  isLoading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Refresh the data */
  refetch: () => Promise<void>;
}

/**
 * Check if a race is the Four Peaks race
 */
function isFourPeaksRace(raceId: string | undefined, raceName: string | undefined): boolean {
  if (raceId === FOUR_PEAKS_RACE_ID) return true;
  if (raceName?.toLowerCase().includes('four peaks')) return true;
  if (raceName?.toLowerCase().includes('4 peaks')) return true;
  return false;
}

/**
 * Build distance race data from fetched regatta data
 */
function buildDistanceRaceData(
  regatta: {
    race_type: string | null;
    route_waypoints: unknown;
    total_distance_nm: number | null;
    time_limit_hours: number | null;
    name: string | null;
  } | null,
  raceId: string | undefined,
  raceName: string | undefined
): DistanceRaceData | undefined {
  if (!regatta || regatta.race_type !== 'distance') {
    return undefined;
  }

  // Check if this is Four Peaks race
  if (isFourPeaksRace(raceId, raceName || regatta.name || undefined)) {
    return {
      legs: FOUR_PEAKS_DEFAULT_LEGS.map((leg) => ({
        legNumber: leg.legNumber,
        name: leg.name,
        startLocation: leg.startLocation,
        endLocation: leg.endLocation,
        estimatedDurationHours: leg.estimatedDurationHours,
        followedByPeak: leg.followedByPeak,
      })),
      peaks: FOUR_PEAKS.map((peak) => ({
        id: peak.id,
        name: peak.name,
        location: peak.location,
        estimatedClimbHours: peak.estimatedClimbHours,
      })),
      routeWaypoints: regatta.route_waypoints as DistanceRaceData['routeWaypoints'],
      totalDistanceNm: regatta.total_distance_nm ?? undefined,
      timeLimitHours: regatta.time_limit_hours ?? undefined,
    };
  }

  // Generic distance race - use route waypoints if available
  const waypoints = regatta.route_waypoints as DistanceRaceData['routeWaypoints'];

  return {
    routeWaypoints: waypoints,
    totalDistanceNm: regatta.total_distance_nm ?? undefined,
    timeLimitHours: regatta.time_limit_hours ?? undefined,
  };
}

/**
 * Hook to fetch race type and generate strategy configuration
 *
 * @param raceId - The regatta ID
 * @param raceName - Optional race name (used to detect Four Peaks)
 * @returns Strategy configuration including phases and sections
 */
export function useRaceTypeStrategy(
  raceId: string | undefined,
  raceName?: string
): UseRaceTypeStrategyResult {
  const [raceType, setRaceType] = useState<RaceType>('fleet');
  const [raceData, setRaceData] = useState<DistanceRaceData | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRaceType = useCallback(async () => {
    if (!raceId) {
      setRaceType('fleet');
      setRaceData(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First check if this is Four Peaks by ID or name (optimization)
      if (isFourPeaksRace(raceId, raceName)) {
        logger.debug('[useRaceTypeStrategy] Detected Four Peaks race');
        setRaceType('distance');
        setRaceData({
          legs: FOUR_PEAKS_DEFAULT_LEGS.map((leg) => ({
            legNumber: leg.legNumber,
            name: leg.name,
            startLocation: leg.startLocation,
            endLocation: leg.endLocation,
            estimatedDurationHours: leg.estimatedDurationHours,
            followedByPeak: leg.followedByPeak,
          })),
          peaks: FOUR_PEAKS.map((peak) => ({
            id: peak.id,
            name: peak.name,
            location: peak.location,
            estimatedClimbHours: peak.estimatedClimbHours,
          })),
        });
        setIsLoading(false);
        return;
      }

      // Fetch race type and data from database
      const { data: regatta, error: fetchError } = await supabase
        .from('regattas')
        .select('race_type, route_waypoints, total_distance_nm, time_limit_hours, name')
        .eq('id', raceId)
        .single();

      if (fetchError) {
        logger.warn('[useRaceTypeStrategy] Error fetching race type:', fetchError);
        // Default to fleet racing on error
        setRaceType('fleet');
        setRaceData(undefined);
        setIsLoading(false);
        return;
      }

      const type = (regatta?.race_type as RaceType) || 'fleet';
      setRaceType(type);

      // Build distance race data if applicable
      if (type === 'distance') {
        const distanceData = buildDistanceRaceData(regatta, raceId, raceName);
        setRaceData(distanceData);
      } else {
        setRaceData(undefined);
      }
    } catch (err) {
      logger.error('[useRaceTypeStrategy] Unexpected error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch race type'));
      setRaceType('fleet');
      setRaceData(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [raceId, raceName]);

  useEffect(() => {
    fetchRaceType();
  }, [fetchRaceType]);

  // Generate phases and sections based on race type and data
  const { phases, sections } = useMemo(() => {
    return getStrategyPhasesAndSections(raceType, raceData);
  }, [raceType, raceData]);

  return {
    raceType,
    raceData,
    phases,
    sections,
    isLoading,
    error,
    refetch: fetchRaceType,
  };
}

/**
 * Helper to check if a race type has leg-based strategy
 */
export function isLegBasedRace(raceType: RaceType): boolean {
  return raceType === 'distance';
}

/**
 * Helper to check if a race type has peak sections (Four Peaks)
 */
export function hasPeakSections(raceData: DistanceRaceData | undefined): boolean {
  return !!raceData?.peaks && raceData.peaks.length > 0;
}

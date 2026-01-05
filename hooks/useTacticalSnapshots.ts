/**
 * useTacticalSnapshots Hook
 *
 * Computes tactical data snapshots from race weather, conditions, and boat data.
 * Groups related useMemo calculations for wind, current, and boat parameters.
 */

import { useMemo } from 'react';
import {
  pickNumeric,
  normalizeDirection,
  normalizeCurrentType,
  extractWindSnapshot,
  extractCurrentSnapshot,
  type TacticalWindSnapshot,
  type TacticalCurrentSnapshot,
} from '@/lib/races';

// =============================================================================
// TYPES
// =============================================================================

export interface WindSnapshot {
  speed: number;
  direction: number;
  gust?: number;
  forecast?: unknown;
}

export interface CurrentSnapshot {
  speed: number;
  direction: number;
  type?: 'flood' | 'ebb' | 'slack';
}

export interface SelectedRaceWeather {
  wind?: TacticalWindSnapshot;
  current?: TacticalCurrentSnapshot;
}

export interface RaceDataForTactical {
  metadata?: Record<string, any>;
  start_date?: string;
  wind?: any;
  current?: any;
}

export interface EnrichedRaceData {
  wind?: any;
  current?: any;
  tide?: any;
}

export interface DemoRaceData {
  wind?: any;
  current?: any;
  tide?: any;
}

export interface RaceWeatherData {
  wind?: {
    direction?: number;
    speedMin?: number;
    speedMax?: number;
  };
  tide?: {
    direction?: number;
    state?: string;
  };
}

export interface GpsPosition {
  speed?: number;
  [key: string]: unknown;
}

export interface UseTacticalSnapshotsParams {
  /** Selected race data */
  selectedRaceData: RaceDataForTactical | null;
  /** Matched enriched race from weather enrichment */
  matchedEnrichedRace: EnrichedRaceData | null;
  /** Race weather from useRaceWeather hook */
  raceWeather: RaceWeatherData | null;
  /** Selected demo race (when in demo mode) */
  selectedDemoRace: DemoRaceData | null;
  /** Current GPS position */
  gpsPosition: GpsPosition | null;
}

export interface UseTacticalSnapshotsReturn {
  /** Combined weather data for the selected race */
  selectedRaceWeather: SelectedRaceWeather | null;
  /** Processed wind snapshot */
  windSnapshot: WindSnapshot | null;
  /** Processed current snapshot */
  currentSnapshot: CurrentSnapshot | null;
  /** Boat draft from metadata */
  boatDraftValue: number | null;
  /** Boat length from metadata */
  boatLengthValue: number | null;
  /** Minutes until race start */
  timeToStartMinutes: number | null;
  /** Current boat speed in knots */
  boatSpeedKnots: number | undefined;
}

/**
 * Hook for computing tactical snapshots from race data
 */
export function useTacticalSnapshots({
  selectedRaceData,
  matchedEnrichedRace,
  raceWeather,
  selectedDemoRace,
  gpsPosition,
}: UseTacticalSnapshotsParams): UseTacticalSnapshotsReturn {
  // Compute selected race weather from multiple sources
  const selectedRaceWeather = useMemo<SelectedRaceWeather | null>(() => {
    const metadata = (selectedRaceData?.metadata || {}) as Record<string, any>;

    const windCandidates: any[] = [];
    const currentCandidates: any[] = [];
    const tideCandidates: any[] = [];

    // Collect wind candidates
    if (metadata.weather?.wind) windCandidates.push(metadata.weather.wind);
    if (metadata.wind) windCandidates.push(metadata.wind);
    if (metadata.expected_wind_direction || metadata.expected_wind_speed) {
      windCandidates.push({
        direction: metadata.expected_wind_direction,
        speed: metadata.expected_wind_speed,
        speedMin:
          metadata.expected_wind_speed_min ??
          metadata.expected_wind_min ??
          metadata.wind_speed_min,
        speedMax:
          metadata.expected_wind_speed_max ??
          metadata.expected_wind_max ??
          metadata.wind_speed_max,
        gust: metadata.expected_wind_gust ?? metadata.wind_gust,
      });
    }
    if ((selectedRaceData as any)?.wind) windCandidates.push((selectedRaceData as any).wind);
    if (matchedEnrichedRace?.wind) windCandidates.push(matchedEnrichedRace.wind);
    if (raceWeather?.wind) {
      windCandidates.push({
        direction: raceWeather.wind.direction,
        speedMin: raceWeather.wind.speedMin,
        speedMax: raceWeather.wind.speedMax,
      });
    }
    if (!selectedRaceData && selectedDemoRace?.wind) {
      windCandidates.push(selectedDemoRace.wind);
    }

    // Collect current candidates
    if (metadata.weather?.current) currentCandidates.push(metadata.weather.current);
    if (metadata.current) currentCandidates.push(metadata.current);
    if (metadata.current_conditions) currentCandidates.push(metadata.current_conditions);
    if ((selectedRaceData as any)?.current) currentCandidates.push((selectedRaceData as any).current);
    if (matchedEnrichedRace?.current) currentCandidates.push(matchedEnrichedRace.current);
    if (!selectedRaceData && selectedDemoRace?.current) {
      currentCandidates.push(selectedDemoRace.current);
    }
    if (metadata.expected_current_direction || metadata.expected_current_speed) {
      currentCandidates.push({
        direction: metadata.expected_current_direction,
        speed: metadata.expected_current_speed,
        type: metadata.expected_current_state,
      });
    }

    // Collect tide candidates
    if (metadata.weather?.tide) tideCandidates.push(metadata.weather.tide);
    if (metadata.tide) tideCandidates.push(metadata.tide);
    if (matchedEnrichedRace?.tide) tideCandidates.push(matchedEnrichedRace.tide);
    if (raceWeather?.tide) {
      tideCandidates.push({
        direction: raceWeather.tide.direction,
        state: raceWeather.tide.state,
      });
    }
    if (!selectedRaceData && selectedDemoRace?.tide) {
      tideCandidates.push(selectedDemoRace.tide);
    }
    if (metadata.expected_tide_direction || metadata.expected_tide_state) {
      tideCandidates.push({
        direction: metadata.expected_tide_direction,
        state: metadata.expected_tide_state,
      });
    }

    // Allow tide metadata to act as a fallback current reference
    tideCandidates.forEach((tide) => {
      if (!tide) return;
      currentCandidates.push({
        direction: tide.direction,
        type: tide.type ?? tide.state,
        speed: tide.speed ?? tide.knots ?? tide.rate,
      });
    });

    // Extract first valid wind snapshot
    let windSnapshotResult: TacticalWindSnapshot | undefined;
    for (const candidate of windCandidates) {
      const snapshot = extractWindSnapshot(candidate);
      if (snapshot) {
        windSnapshotResult = snapshot;
        break;
      }
    }

    // Extract first valid current snapshot
    let currentSnapshotResult: TacticalCurrentSnapshot | undefined;
    for (const candidate of currentCandidates) {
      const snapshot = extractCurrentSnapshot(candidate);
      if (snapshot) {
        currentSnapshotResult = snapshot;
        break;
      }
    }

    if (!windSnapshotResult && !currentSnapshotResult) {
      return null;
    }

    return {
      wind: windSnapshotResult,
      current: currentSnapshotResult,
    };
  }, [
    matchedEnrichedRace,
    raceWeather?.wind,
    raceWeather?.tide,
    selectedDemoRace,
    selectedRaceData,
  ]);

  // Compute wind snapshot with additional processing
  const windSnapshot = useMemo<WindSnapshot | null>(() => {
    if (!selectedRaceWeather?.wind) {
      return null;
    }

    const speed = pickNumeric([
      selectedRaceWeather.wind.speed,
      (selectedRaceWeather.wind as any).speedMin,
      (selectedRaceWeather.wind as any).speedMax,
    ]);
    const direction = normalizeDirection(selectedRaceWeather.wind.direction);

    if (speed === null || direction === null) {
      return null;
    }

    return {
      speed,
      direction,
      gust: pickNumeric([
        selectedRaceWeather.wind.gust,
        (selectedRaceWeather.wind as any).gustMax,
        (selectedRaceWeather.wind as any).speedMax,
      ]) ?? undefined,
      forecast: (selectedRaceWeather.wind as any).forecast,
    };
  }, [selectedRaceWeather]);

  // Compute current snapshot with additional processing
  const currentSnapshot = useMemo<CurrentSnapshot | null>(() => {
    if (!selectedRaceWeather?.current) {
      return null;
    }

    const speed = pickNumeric([
      selectedRaceWeather.current.speed,
      (selectedRaceWeather.current as any).knots,
      (selectedRaceWeather.current as any).speedMin,
      (selectedRaceWeather.current as any).speedMax,
    ]);
    const direction = normalizeDirection(selectedRaceWeather.current.direction);

    if (speed === null || direction === null) {
      return null;
    }

    return {
      speed,
      direction,
      type: normalizeCurrentType(selectedRaceWeather.current.type),
    };
  }, [selectedRaceWeather]);

  // Compute boat draft from metadata
  const boatDraftValue = useMemo<number | null>(() => {
    const metadata = selectedRaceData?.metadata;
    if (!metadata) return null;

    return pickNumeric([
      metadata.boat_draft,
      metadata.draft,
      metadata.keel_depth,
      metadata.draft_meters,
    ]);
  }, [selectedRaceData]);

  // Compute boat length from metadata
  const boatLengthValue = useMemo<number | null>(() => {
    const metadata = selectedRaceData?.metadata;
    if (!metadata) return null;

    return pickNumeric([
      metadata.boat_length,
      metadata.loa,
      metadata.length_overall,
      metadata.lwl,
    ]);
  }, [selectedRaceData]);

  // Compute time to start in minutes
  const timeToStartMinutes = useMemo<number | null>(() => {
    if (!selectedRaceData?.start_date) return null;
    const startTime = new Date(selectedRaceData.start_date).getTime();
    if (!Number.isFinite(startTime)) {
      return null;
    }
    const diffMinutes = (startTime - Date.now()) / (1000 * 60);
    return Number.isFinite(diffMinutes) ? diffMinutes : null;
  }, [selectedRaceData?.start_date]);

  // Compute boat speed from GPS
  const boatSpeedKnots = useMemo<number | undefined>(() => {
    if (!gpsPosition || typeof gpsPosition.speed !== 'number') {
      return undefined;
    }
    return gpsPosition.speed;
  }, [gpsPosition]);

  return {
    selectedRaceWeather,
    windSnapshot,
    currentSnapshot,
    boatDraftValue,
    boatLengthValue,
    timeToStartMinutes,
    boatSpeedKnots,
  };
}

export default useTacticalSnapshots;

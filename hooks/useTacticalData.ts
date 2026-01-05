/**
 * Tactical Data Hook
 *
 * Encapsulates weather and tactical data extraction for racing.
 * Provides normalized wind/current snapshots and race timing calculations.
 */

import { useMemo } from 'react';
import {
  TacticalWindSnapshot,
  TacticalCurrentSnapshot,
  normalizeDirection,
  pickNumeric,
  normalizeCurrentType,
} from '@/lib/races';

export interface TacticalDataOptions {
  /** Weather data for the selected race */
  weatherData?: {
    wind?: any;
    current?: any;
    tide?: any;
  } | null;
  /** Selected race data with metadata */
  raceData?: any | null;
  /** GPS position data */
  gpsPosition?: {
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
  } | null;
}

export interface ExtendedWindSnapshot extends TacticalWindSnapshot {
  forecast?: any;
}

export interface TacticalDataReturn {
  /** Normalized wind conditions */
  windSnapshot: ExtendedWindSnapshot | null;
  /** Normalized current/tide conditions */
  currentSnapshot: TacticalCurrentSnapshot | null;
  /** Tide data snapshot */
  tideSnapshot: any | null;
  /** Boat draft from metadata */
  boatDraft: number | null;
  /** Boat length from metadata */
  boatLength: number | null;
  /** Minutes until race start (negative = past start) */
  timeToStartMinutes: number | null;
  /** Seconds until race start */
  timeToStartSeconds: number | null;
  /** Current boat speed in knots */
  boatSpeedKnots: number | undefined;
  /** Weather data for environment updates */
  environmentData: {
    wind?: {
      speed: number;
      direction: number;
      gust?: number;
      forecast?: any;
    };
    current?: {
      speed: number;
      direction: number;
      type?: 'flood' | 'ebb' | 'slack';
      strength: 'strong' | 'moderate' | 'weak';
    };
    tide?: any;
  } | null;
}

/**
 * Hook for tactical data extraction and normalization
 */
export function useTacticalData(options: TacticalDataOptions): TacticalDataReturn {
  const { weatherData, raceData, gpsPosition } = options;

  // Extract wind snapshot from weather data
  const windSnapshot = useMemo<ExtendedWindSnapshot | null>(() => {
    if (!weatherData?.wind) {
      return null;
    }

    const wind = weatherData.wind;
    const speed = pickNumeric([
      wind.speed,
      wind.speedMin,
      wind.speedMax,
    ]);
    const direction = normalizeDirection(wind.direction);

    if (speed === null || direction === null) {
      return null;
    }

    return {
      speed,
      direction,
      gust: pickNumeric([wind.gust, wind.gustMax, wind.speedMax]) ?? undefined,
      forecast: wind.forecast,
    };
  }, [weatherData?.wind]);

  // Extract current snapshot from weather data
  const currentSnapshot = useMemo<TacticalCurrentSnapshot | null>(() => {
    if (!weatherData?.current) {
      return null;
    }

    const current = weatherData.current;
    const speed = pickNumeric([
      current.speed,
      current.knots,
      current.speedMin,
      current.speedMax,
    ]);
    const direction = normalizeDirection(current.direction);

    if (speed === null || direction === null) {
      return null;
    }

    return {
      speed,
      direction,
      type: normalizeCurrentType(current.type),
    };
  }, [weatherData?.current]);

  // Tide snapshot
  const tideSnapshot = useMemo(() => {
    return weatherData?.tide ?? null;
  }, [weatherData?.tide]);

  // Boat draft from metadata
  const boatDraft = useMemo(() => {
    const metadata = raceData?.metadata;
    if (!metadata) return null;

    return pickNumeric([
      metadata.boat_draft,
      metadata.draft,
      metadata.keel_depth,
      metadata.draft_meters,
    ]);
  }, [raceData?.metadata]);

  // Boat length from metadata
  const boatLength = useMemo(() => {
    const metadata = raceData?.metadata;
    if (!metadata) return null;

    return pickNumeric([
      metadata.boat_length,
      metadata.loa,
      metadata.length_overall,
      metadata.lwl,
    ]);
  }, [raceData?.metadata]);

  // Time to start in minutes
  const timeToStartMinutes = useMemo(() => {
    if (!raceData?.start_date) return null;
    const startTime = new Date(raceData.start_date).getTime();
    if (!Number.isFinite(startTime)) {
      return null;
    }
    const diffMinutes = (startTime - Date.now()) / (1000 * 60);
    return Number.isFinite(diffMinutes) ? diffMinutes : null;
  }, [raceData?.start_date]);

  // Time to start in seconds
  const timeToStartSeconds = useMemo(() => {
    if (timeToStartMinutes === null || timeToStartMinutes === undefined) {
      return null;
    }
    return Math.round(timeToStartMinutes * 60);
  }, [timeToStartMinutes]);

  // Boat speed from GPS
  const boatSpeedKnots = useMemo(() => {
    if (!gpsPosition || typeof gpsPosition.speed !== 'number') {
      return undefined;
    }
    return gpsPosition.speed;
  }, [gpsPosition?.speed]);

  // Formatted environment data for race conditions store
  const environmentData = useMemo(() => {
    if (!windSnapshot && !currentSnapshot) {
      return null;
    }

    const result: TacticalDataReturn['environmentData'] = {};

    if (windSnapshot) {
      result.wind = {
        speed: windSnapshot.speed,
        direction: windSnapshot.direction,
        gust: windSnapshot.gust,
        forecast: windSnapshot.forecast,
      };
    }

    if (currentSnapshot) {
      const strength =
        currentSnapshot.speed >= 1.5
          ? 'strong'
          : currentSnapshot.speed >= 0.7
            ? 'moderate'
            : 'weak';

      result.current = {
        speed: currentSnapshot.speed,
        direction: currentSnapshot.direction,
        type: currentSnapshot.type,
        strength,
      };
    }

    if (tideSnapshot) {
      result.tide = tideSnapshot;
    }

    return result;
  }, [windSnapshot, currentSnapshot, tideSnapshot]);

  return {
    windSnapshot,
    currentSnapshot,
    tideSnapshot,
    boatDraft,
    boatLength,
    timeToStartMinutes,
    timeToStartSeconds,
    boatSpeedKnots,
    environmentData,
  };
}

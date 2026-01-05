/**
 * useRaceBriefData Hook
 *
 * Computes race brief data including countdown, weather summary, and tide summary.
 * Uses memoization with ref-based caching to prevent unnecessary re-renders.
 */

import { useMemo, useRef, useState, useEffect } from 'react';
import { calculateCountdown } from '@/constants/mockData';

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

export interface RaceBriefData extends ActiveRaceSummary {
  countdown?: {
    days: number;
    hours: number;
    minutes: number;
  };
  weatherSummary?: string;
  tideSummary?: string;
}

export interface RaceWeather {
  wind?: {
    speed?: number;
    speedMin?: number;
    speedMax?: number;
    direction?: string;
    directionCardinal?: string;
  };
  tide?: {
    state?: string;
    phase?: string;
    height?: number;
  };
}

export interface DemoRace {
  wind: {
    direction: string;
    speedMin: number;
    speedMax: number;
  };
  tide: {
    state: string;
    height: number;
  };
}

export interface UseRaceBriefDataParams {
  /** Active race summary */
  activeRace: ActiveRaceSummary | null;
  /** Race weather data */
  raceWeather: RaceWeather | null;
  /** Selected race data with metadata */
  selectedRaceData: {
    metadata?: {
      wind_summary?: string;
      wind_direction?: string;
      wind_speed?: string;
      tide_summary?: string;
    };
  } | null;
  /** Next race from dashboard */
  nextRace: {
    wind_summary?: string;
    wind_direction?: string;
    wind_speed?: string;
    tide_summary?: string;
  } | null;
  /** Selected demo race */
  selectedDemoRace: DemoRace | null;
}

export interface UseRaceBriefDataReturn {
  /** Computed race brief data */
  raceBrief: RaceBriefData | null;
  /** Current minute timestamp (for countdown updates) */
  currentMinute: number;
}

/**
 * Hook for computing race brief data
 */
export function useRaceBriefData({
  activeRace,
  raceWeather,
  selectedRaceData,
  nextRace,
  selectedDemoRace,
}: UseRaceBriefDataParams): UseRaceBriefDataReturn {
  // Stabilize countdown - only update every minute to prevent constant re-renders
  const [currentMinute, setCurrentMinute] = useState(() => Math.floor(Date.now() / 60000));

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMinute(Math.floor(Date.now() / 60000));
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Ref-based caching to prevent unnecessary object recreation
  const lastRaceBriefRef = useRef<RaceBriefData | null>(null);
  const lastRaceBriefKeyRef = useRef<string | null>(null);

  const raceBrief = useMemo((): RaceBriefData | null => {
    if (!activeRace) {
      return null;
    }

    const startISO = activeRace.startTime;
    const countdown = startISO ? calculateCountdown(startISO) : undefined;

    // Compute weather summary from various sources
    const weatherSummary = ((): string | undefined => {
      if (raceWeather?.wind) {
        const min = raceWeather.wind.speedMin ?? raceWeather.wind.speed ?? 0;
        const max = raceWeather.wind.speedMax ?? raceWeather.wind.speed ?? min;
        const direction = raceWeather.wind.direction ?? raceWeather.wind.directionCardinal;
        if (min && max) {
          return `${direction ?? ''} ${Math.round(min)}-${Math.round(max)} kt`.trim();
        }
        if (direction) {
          return `${direction}`;
        }
      }

      const metadata = (selectedRaceData?.metadata || nextRace || {}) as Record<string, unknown>;
      if (metadata?.wind_summary) {
        return metadata.wind_summary as string;
      }
      if (metadata?.wind_direction && metadata?.wind_speed) {
        return `${metadata.wind_direction} ${metadata.wind_speed}`;
      }

      if (selectedDemoRace) {
        return `${selectedDemoRace.wind.direction} ${selectedDemoRace.wind.speedMin}-${selectedDemoRace.wind.speedMax} kt`;
      }

      return undefined;
    })();

    // Compute tide summary from various sources
    const tideSummary = ((): string | undefined => {
      if (raceWeather?.tide) {
        const state = raceWeather.tide.state || raceWeather.tide.phase;
        const height = raceWeather.tide.height;
        if (state || height) {
          return `${state ? state.replace(/_/g, ' ') : ''}${height ? ` • ${height.toFixed(1)} m` : ''}`.trim();
        }
      }
      const metadata = (selectedRaceData?.metadata || {}) as Record<string, unknown>;
      if (metadata?.tide_summary) {
        return metadata.tide_summary as string;
      }
      if (selectedDemoRace) {
        return `${selectedDemoRace.tide.state} • ${selectedDemoRace.tide.height} m`;
      }
      return undefined;
    })();

    const nextBrief: RaceBriefData = {
      ...activeRace,
      countdown,
      weatherSummary,
      tideSummary,
    };

    // Use ref-based caching to return same object if unchanged
    const briefKey = JSON.stringify(nextBrief);
    if (lastRaceBriefKeyRef.current === briefKey && lastRaceBriefRef.current) {
      return lastRaceBriefRef.current;
    }

    lastRaceBriefKeyRef.current = briefKey;
    lastRaceBriefRef.current = nextBrief;
    return nextBrief;
  }, [
    // Active race fields
    activeRace?.id,
    activeRace?.name,
    activeRace?.series,
    activeRace?.venue,
    activeRace?.startTime,
    activeRace?.warningSignal,
    activeRace?.cleanRegatta,
    activeRace?.lastUpdated,
    currentMinute,
    // Weather fields
    raceWeather?.wind?.direction,
    raceWeather?.wind?.speedMin,
    raceWeather?.wind?.speedMax,
    raceWeather?.wind?.directionCardinal,
    raceWeather?.wind?.speed,
    raceWeather?.tide?.state,
    raceWeather?.tide?.height,
    raceWeather?.tide?.phase,
    // Metadata fields
    selectedRaceData?.metadata?.wind_summary,
    selectedRaceData?.metadata?.wind_direction,
    selectedRaceData?.metadata?.wind_speed,
    selectedRaceData?.metadata?.tide_summary,
    // Demo race fields
    selectedDemoRace?.wind?.direction,
    selectedDemoRace?.wind?.speedMin,
    selectedDemoRace?.wind?.speedMax,
    selectedDemoRace?.tide?.state,
    selectedDemoRace?.tide?.height,
    // Next race fields
    nextRace?.wind_summary,
    nextRace?.wind_direction,
    nextRace?.wind_speed,
    nextRace?.tide_summary,
  ]);

  return { raceBrief, currentMinute };
}

export default useRaceBriefData;

/**
 * useForecastCheck Hook
 *
 * Manages weather forecast checking, snapshot capture, and AI analysis
 * for the race prep checklist.
 */

import { useState, useCallback, useMemo } from 'react';
import { useRacePreparation } from './useRacePreparation';
import { useRaceWeatherForecast, RaceWeatherForecastData } from './useRaceWeatherForecast';
import { ForecastCheckService } from '@/services/ForecastCheckService';
import type {
  ForecastSnapshot,
  ForecastAnalysis,
  ForecastIntention,
} from '@/types/raceIntentions';
import type { SailingVenue } from '@/lib/types/global-venues';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useForecastCheck');

interface UseForecastCheckOptions {
  /** Race event ID */
  raceEventId: string | null;
  /** Venue for weather lookup */
  venue: SailingVenue | null;
  /** Race date (ISO string or YYYY-MM-DD) */
  raceDate: string | null;
  /** Race start time (e.g., "10:30") - combined with raceDate for accurate timing */
  raceStartTime?: string | null;
  /** Expected race duration in minutes (for forecast window) */
  expectedDurationMinutes?: number;
  /** Whether to enable the hook */
  enabled?: boolean;
}

interface UseForecastCheckReturn {
  // Current forecast data
  /** Live forecast data from weather service */
  currentForecast: RaceWeatherForecastData | null;
  /** Whether forecast is loading */
  isLoadingForecast: boolean;
  /** Error loading forecast */
  forecastError: Error | null;

  // Snapshot history
  /** Previously saved snapshots (max 3) */
  snapshots: ForecastSnapshot[];
  /** Most recent AI analysis */
  latestAnalysis: ForecastAnalysis | null;
  /** When user last checked the forecast */
  lastCheckedAt: string | null;

  // Actions
  /** Capture a new snapshot and analyze changes */
  captureSnapshot: () => Promise<{
    snapshot: ForecastSnapshot;
    analysis: ForecastAnalysis | null;
  }>;
  /** Whether a snapshot capture is in progress */
  isCapturing: boolean;
  /** Error from capture attempt */
  captureError: Error | null;

  // Computed helpers
  /** Whether there are any saved snapshots */
  hasSnapshots: boolean;
  /** Whether there are changes since last snapshot */
  hasChanges: boolean;
  /** Overall change level */
  changeLevel: 'stable' | 'minor_change' | 'significant_change' | null;
  /** Quick summary without AI */
  quickSummary: {
    hasChanges: boolean;
    windDelta: number;
    directionChanged: boolean;
    trendChanged: boolean;
  };
}

/**
 * Combine date string and time string into a proper ISO datetime
 * @param date - Date string (YYYY-MM-DD or ISO)
 * @param time - Time string (HH:MM or HH:MM:SS)
 * @returns Combined ISO datetime string
 */
function combineDateAndTime(date: string | null, time: string | null | undefined): string | null {
  if (!date) return null;

  // If date already includes time (ISO format), use it as-is
  if (date.includes('T')) {
    return date;
  }

  // If we have a separate time, combine them
  if (time) {
    // Normalize time to HH:MM:SS format
    const normalizedTime = time.includes(':')
      ? (time.split(':').length === 2 ? `${time}:00` : time)
      : '00:00:00';
    return `${date}T${normalizedTime}`;
  }

  // Default to midnight if no time provided
  return `${date}T00:00:00`;
}

/**
 * Hook to manage forecast checking for race preparation
 */
export function useForecastCheck({
  raceEventId,
  venue,
  raceDate,
  raceStartTime,
  expectedDurationMinutes = 90,
  enabled = true,
}: UseForecastCheckOptions): UseForecastCheckReturn {
  // Get preparation state (includes intentions with forecastCheck)
  const { intentions, updateIntentions } = useRacePreparation({
    raceEventId,
    autoSave: true,
  });

  // Combine date and time for accurate forecast window
  const combinedDateTime = combineDateAndTime(raceDate, raceStartTime);

  logger.debug('[useForecastCheck] Combined datetime:', {
    raceDate,
    raceStartTime,
    combinedDateTime,
    expectedDurationMinutes,
  });

  // Get current live forecast
  const {
    data: currentForecast,
    loading: isLoadingForecast,
    error: forecastError,
  } = useRaceWeatherForecast(
    venue,
    combinedDateTime,
    enabled && !!venue && !!combinedDateTime,
    expectedDurationMinutes
  );

  // Local state for capture operation
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<Error | null>(null);

  // Extract forecast intention from intentions
  const forecastIntention = intentions?.forecastCheck;

  /**
   * Capture a new snapshot of the current forecast
   */
  const captureSnapshot = useCallback(async (): Promise<{
    snapshot: ForecastSnapshot;
    analysis: ForecastAnalysis | null;
  }> => {
    if (!currentForecast?.raceWindow) {
      throw new Error('No forecast data available to capture');
    }
    if (!venue) {
      throw new Error('Venue is required to capture snapshot');
    }
    if (!raceEventId) {
      throw new Error('Race event ID is required');
    }

    setIsCapturing(true);
    setCaptureError(null);

    try {
      // 1. Create snapshot from current forecast
      const snapshot = ForecastCheckService.createSnapshot(
        raceEventId,
        venue,
        currentForecast
      );

      // 2. Get existing snapshots
      const existingSnapshots = forecastIntention?.snapshots || [];

      // 3. Analyze changes if there's a previous snapshot
      let analysis: ForecastAnalysis | null = null;
      if (existingSnapshots.length > 0) {
        const previousSnapshot = existingSnapshots[existingSnapshots.length - 1];
        analysis = await ForecastCheckService.analyzeChanges(
          previousSnapshot,
          snapshot,
          venue.name,
          raceDate || new Date().toISOString()
        );
      }

      // 4. Update snapshots list (FIFO, max 3)
      const updatedSnapshots = ForecastCheckService.addSnapshotToIntention(
        forecastIntention,
        snapshot
      );

      // 5. Persist to intentions
      updateIntentions({
        forecastCheck: {
          snapshots: updatedSnapshots,
          latestAnalysis: analysis || forecastIntention?.latestAnalysis,
          lastCheckedAt: new Date().toISOString(),
        },
      });

      logger.info('Forecast snapshot captured', {
        snapshotId: snapshot.id,
        totalSnapshots: updatedSnapshots.length,
        hasAnalysis: !!analysis,
      });

      return { snapshot, analysis };
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error capturing snapshot');
      setCaptureError(err);
      logger.error('Error capturing forecast snapshot', { error: err });
      throw err;
    } finally {
      setIsCapturing(false);
    }
  }, [
    currentForecast,
    venue,
    raceEventId,
    raceDate,
    forecastIntention,
    updateIntentions,
  ]);

  // Computed values
  const snapshots = useMemo(
    () => forecastIntention?.snapshots || [],
    [forecastIntention?.snapshots]
  );

  const hasSnapshots = snapshots.length > 0;

  const quickSummary = useMemo(
    () => ForecastCheckService.getQuickChangeSummary(snapshots),
    [snapshots]
  );

  const hasChanges = useMemo(() => {
    if (!forecastIntention?.latestAnalysis) return false;
    return forecastIntention.latestAnalysis.alertLevel !== 'stable';
  }, [forecastIntention?.latestAnalysis]);

  const changeLevel = forecastIntention?.latestAnalysis?.alertLevel || null;

  return {
    // Current forecast
    currentForecast,
    isLoadingForecast,
    forecastError: forecastError ? new Error(String(forecastError)) : null,

    // Snapshot history
    snapshots,
    latestAnalysis: forecastIntention?.latestAnalysis || null,
    lastCheckedAt: forecastIntention?.lastCheckedAt || null,

    // Actions
    captureSnapshot,
    isCapturing,
    captureError,

    // Computed
    hasSnapshots,
    hasChanges,
    changeLevel,
    quickSummary,
  };
}

export type { UseForecastCheckOptions, UseForecastCheckReturn };

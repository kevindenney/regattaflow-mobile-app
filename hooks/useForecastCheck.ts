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
  regattaId: string | null;
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
 * Compute the UTC offset (in ms) that a given timezone has at the given instant.
 * Returns positive values for zones east of UTC (e.g. +8h = 28_800_000 for HKT).
 */
function getTimezoneOffsetMs(utcMs: number, timeZone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date(utcMs));
    const obj: Record<string, number> = {};
    for (const p of parts) {
      if (p.type !== 'literal') obj[p.type] = parseInt(p.value, 10);
    }
    const hour = obj.hour === 24 ? 0 : obj.hour;
    const asIfUtc = Date.UTC(obj.year, obj.month - 1, obj.day, hour, obj.minute, obj.second);
    return asIfUtc - utcMs;
  } catch {
    return 0;
  }
}

/**
 * Estimate a UTC offset (in ms) from a longitude when no IANA timezone is known.
 * Earth rotates 15° per hour, so longitude / 15 gives a rough offset accurate
 * to within ~1 hour for most venues — good enough for hourly forecast sampling
 * and far better than falling back to the browser's local timezone (which can
 * be off by 8+ hours for a user viewing a race in another country).
 */
function estimateOffsetMsFromLongitude(lng: number | null | undefined): number | null {
  if (lng == null || Number.isNaN(lng)) return null;
  const hours = Math.round(lng / 15);
  return hours * 60 * 60 * 1000;
}

/**
 * Combine date string and time string into a proper ISO datetime, interpreting
 * the wall-clock time in the venue's timezone (not the browser's local TZ).
 *
 * This matters for users viewing races in a venue whose timezone differs from
 * their own — e.g. a Hong Kong race viewed from PDT must be anchored to HKT,
 * otherwise the forecast is fetched for the wrong real-world instant.
 *
 * App convention: ISO strings from the DB (e.g. "2026-04-11T12:55:00+00:00")
 * store the venue-local wall clock in the UTC fields — they are NOT real UTC
 * instants. So we extract Y/M/D/H/M using UTC getters, then reinterpret in the
 * venue timezone. This matches how `extract24HourTime` reads the same strings.
 *
 * @param date - Date string (YYYY-MM-DD or ISO)
 * @param time - Time string (HH:MM or HH:MM:SS)
 * @param timeZone - IANA timezone of the venue (e.g. "Asia/Hong_Kong")
 * @param lngFallback - Venue longitude used to estimate an offset when timeZone is missing
 * @returns Combined ISO datetime string in UTC (with Z suffix)
 */
function combineDateAndTime(
  date: string | null,
  time: string | null | undefined,
  timeZone: string | null | undefined,
  lngFallback?: number | null,
): string | null {
  if (!date) return null;

  let y: number;
  let m: number;
  let d: number;
  let hh = 0;
  let mm = 0;
  let ss = 0;

  if (date.includes('T')) {
    // ISO timestamp — extract wall-clock components via UTC getters per the
    // app convention (see extract24HourTime in useEnrichedRaces). Do NOT pass
    // the string to new Date() for local interpretation.
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return null;
    y = parsed.getUTCFullYear();
    m = parsed.getUTCMonth() + 1;
    d = parsed.getUTCDate();
    hh = parsed.getUTCHours();
    mm = parsed.getUTCMinutes();
    ss = parsed.getUTCSeconds();
  } else {
    const [yStr, mStr, dStr] = date.split('-');
    y = parseInt(yStr, 10);
    m = parseInt(mStr, 10);
    d = parseInt(dStr, 10);
    if (!y || !m || !d) return null;
  }

  // An explicit raceStartTime (e.g. "12:55") overrides whatever was on the ISO
  // date — callers treat it as the authoritative wall-clock start.
  if (time && time.includes(':')) {
    const parts = time.split(':').map((v) => parseInt(v, 10));
    hh = parts[0] || 0;
    mm = parts[1] || 0;
    ss = parts[2] || 0;
  }

  // Treat the wall clock as if it were UTC, then subtract the venue's
  // timezone offset at that moment to get the real UTC instant.
  const naiveUtcMs = Date.UTC(y, m - 1, d, hh, mm, ss);

  if (timeZone) {
    const offsetMs = getTimezoneOffsetMs(naiveUtcMs, timeZone);
    return new Date(naiveUtcMs - offsetMs).toISOString();
  }

  // No IANA zone — estimate from longitude (15°/hr). This is accurate to
  // within ~1 hour, which is acceptable for hourly forecast sampling and far
  // safer than falling back to the browser's local time (which can be off by
  // many hours when viewing a race in a different country).
  const lngOffsetMs = estimateOffsetMsFromLongitude(lngFallback);
  if (lngOffsetMs != null) {
    return new Date(naiveUtcMs - lngOffsetMs).toISOString();
  }

  // Last-resort fallback: browser local time (legacy behavior).
  return new Date(y, m - 1, d, hh, mm, ss).toISOString();
}

/**
 * Hook to manage forecast checking for race preparation
 */
export function useForecastCheck({
  regattaId,
  venue,
  raceDate,
  raceStartTime,
  expectedDurationMinutes = 90,
  enabled = true,
}: UseForecastCheckOptions): UseForecastCheckReturn {
  // Get preparation state (includes intentions with forecastCheck)
  const { intentions, updateIntentions } = useRacePreparation({
    regattaId,
    autoSave: true,
  });

  // Combine date and time for accurate forecast window, anchoring the wall
  // clock to the VENUE's timezone (not the browser's local TZ). If the venue
  // has no IANA timezone, estimate from longitude — a 1-hour approximation is
  // acceptable for hourly forecast sampling and far safer than falling back to
  // the browser's local clock.
  const venueLng = Array.isArray(venue?.coordinates)
    ? (venue?.coordinates as any)[0]
    : (venue as any)?.coordinates?.lng ?? null;
  const combinedDateTime = combineDateAndTime(
    raceDate,
    raceStartTime,
    venue?.timeZone,
    typeof venueLng === 'number' ? venueLng : null,
  );

  logger.debug('[useForecastCheck] Combined datetime:', {
    raceDate,
    raceStartTime,
    venueTimeZone: venue?.timeZone,
    venueLng,
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
    if (!regattaId) {
      throw new Error('Race event ID is required');
    }

    setIsCapturing(true);
    setCaptureError(null);

    try {
      // 1. Create snapshot from current forecast
      const snapshot = ForecastCheckService.createSnapshot(
        regattaId,
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
    regattaId,
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

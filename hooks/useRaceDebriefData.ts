/**
 * useRaceDebriefData Hook
 *
 * Extracts and parses debrief data from race metadata.
 * Includes GPS track and split times for post-race analysis.
 */

import { useMemo } from 'react';
import { parseGpsTrack, parseSplitTimes, type GPSPoint, type DebriefSplitTime } from '@/lib/races';

// =============================================================================
// TYPES
// =============================================================================

export interface UseRaceDebriefDataParams {
  /** Selected race data with metadata */
  selectedRaceData: {
    gps_track?: unknown;
    split_times?: unknown;
    metadata?: {
      gps_track?: unknown;
      split_times?: unknown;
    };
  } | null;
  /** Time to start in minutes (for calculating seconds) */
  timeToStartMinutes: number | null | undefined;
}

export interface UseRaceDebriefDataReturn {
  /** Parsed GPS track points */
  currentGpsTrack: GPSPoint[];
  /** Parsed split times */
  currentSplitTimes: DebriefSplitTime[];
  /** Time to start in seconds */
  timeToStartSeconds: number | null;
}

/**
 * Hook for extracting race debrief data
 */
export function useRaceDebriefData({
  selectedRaceData,
  timeToStartMinutes,
}: UseRaceDebriefDataParams): UseRaceDebriefDataReturn {
  // Parse GPS track from metadata
  const currentGpsTrack = useMemo((): GPSPoint[] => {
    const metadataTrack = selectedRaceData?.metadata?.gps_track ?? selectedRaceData?.gps_track;
    const parsed = parseGpsTrack(metadataTrack);
    return parsed ?? []; // Don't show mock data - return empty array if no real track
  }, [selectedRaceData]);

  // Parse split times from metadata
  const currentSplitTimes = useMemo((): DebriefSplitTime[] => {
    const metadataSplits = selectedRaceData?.metadata?.split_times ?? selectedRaceData?.split_times;
    const parsed = parseSplitTimes(metadataSplits);
    return parsed ?? []; // Don't show mock data - return empty array if no real splits
  }, [selectedRaceData]);

  // Convert time to start from minutes to seconds
  const timeToStartSeconds = useMemo((): number | null => {
    if (timeToStartMinutes === null || timeToStartMinutes === undefined) {
      return null;
    }
    return Math.round(timeToStartMinutes * 60);
  }, [timeToStartMinutes]);

  return {
    currentGpsTrack,
    currentSplitTimes,
    timeToStartSeconds,
  };
}

export default useRaceDebriefData;

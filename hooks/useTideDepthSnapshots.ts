/**
 * useTideDepthSnapshots Hook
 *
 * Calculates tide and depth snapshots from race metadata.
 * Used for displaying water conditions in racing views.
 */

import { useMemo } from 'react';
import { pickNumeric } from '@/lib/races';

// =============================================================================
// TYPES
// =============================================================================

export interface TideSnapshot {
  height: number;
  trend: 'rising' | 'falling' | 'slack';
  rate: number;
  range: number;
}

export interface DepthSnapshot {
  current: number;
  minimum: number;
  trend: number;
  clearance: number;
}

export interface UseTideDepthSnapshotsParams {
  /** Selected race data with metadata */
  selectedRaceData: { metadata?: Record<string, any> } | null | undefined;
  /** User's boat draft value */
  boatDraftValue: number | null | undefined;
  /** Current draft from race conditions store */
  currentDraft: number | null | undefined;
}

export interface UseTideDepthSnapshotsReturn {
  /** Effective boat draft (computed from available values) */
  effectiveDraft: number;
  /** Tide snapshot from race metadata */
  tideSnapshot: TideSnapshot | null;
  /** Depth snapshot from race metadata */
  depthSnapshot: DepthSnapshot | null;
}

/**
 * Hook for calculating tide and depth snapshots
 */
export function useTideDepthSnapshots({
  selectedRaceData,
  boatDraftValue,
  currentDraft,
}: UseTideDepthSnapshotsParams): UseTideDepthSnapshotsReturn {
  // Calculate effective draft
  const effectiveDraft = useMemo(
    () => boatDraftValue ?? currentDraft ?? 2.5,
    [boatDraftValue, currentDraft]
  );

  // Calculate tide snapshot from metadata
  const tideSnapshot = useMemo((): TideSnapshot | null => {
    const metadata = selectedRaceData?.metadata as Record<string, any> | undefined;
    if (!metadata) return null;

    const height = pickNumeric([
      metadata.tide_height,
      metadata.tide?.height,
      metadata.tideHeight,
    ]) ?? 0;

    const range = pickNumeric([
      metadata.tide_range,
      metadata.tide?.range,
    ]) ?? 0;

    const trendRaw = metadata.tide_trend ?? metadata.tide?.trend ?? metadata.tide_state;
    const trend: 'rising' | 'falling' | 'slack' = typeof trendRaw === 'string'
      ? trendRaw.toLowerCase().includes('rise')
        ? 'rising'
        : trendRaw.toLowerCase().includes('fall')
          ? 'falling'
          : 'slack'
      : 'slack';

    return {
      height,
      trend,
      rate: 0,
      range,
    };
  }, [selectedRaceData]);

  // Calculate depth snapshot from metadata
  const depthSnapshot = useMemo((): DepthSnapshot | null => {
    const metadata = selectedRaceData?.metadata as Record<string, any> | undefined;
    const draft = boatDraftValue ?? currentDraft ?? 2.5;

    const depthCurrent = pickNumeric([
      metadata?.depth_current,
      metadata?.depth,
      metadata?.water_depth,
      metadata?.bathymetry_depth,
    ]);

    if (depthCurrent === null) {
      return null;
    }

    const depthMinimum = pickNumeric([
      metadata?.depth_minimum,
      metadata?.depth_min,
      metadata?.shoal_depth,
    ]) ?? depthCurrent - 1;

    return {
      current: depthCurrent,
      minimum: depthMinimum,
      trend: 0,
      clearance: depthCurrent - draft,
    };
  }, [selectedRaceData, boatDraftValue, currentDraft]);

  return {
    effectiveDraft,
    tideSnapshot,
    depthSnapshot,
  };
}

export default useTideDepthSnapshots;

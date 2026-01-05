/**
 * useNextMarkData Hook
 *
 * Calculates next mark data including position, distance, and bearing.
 * Used for tactical overlay and quick actions during racing.
 */

import { useMemo } from 'react';
import { TacticalCalculations } from '@/components/races/TacticalDataOverlay';

const { calculateDistance, calculateBearing } = TacticalCalculations;

// =============================================================================
// TYPES
// =============================================================================

export interface RaceMark {
  name?: string;
  mark_name?: string;
  latitude?: number;
  longitude?: number;
  coordinates?: { lat?: number; lng?: number };
  position?: { lat?: number; lng?: number };
}

export interface GPSPosition {
  latitude?: number;
  longitude?: number;
}

export interface UseNextMarkDataParams {
  /** Array of race marks */
  raceMarks: RaceMark[] | null | undefined;
  /** Current GPS position */
  gpsPosition: GPSPosition | null | undefined;
}

export interface NextMarkCalculation {
  name: string;
  latitude: number;
  longitude: number;
}

export interface OverlayNextMark {
  name: string;
  latitude: number;
  longitude: number;
}

export interface QuickActionNextMark {
  name: string;
  distance: number;
  bearing: number;
}

export interface UseNextMarkDataReturn {
  /** Base next mark calculation data */
  nextMarkForCalculations: NextMarkCalculation | null;
  /** Next mark data for overlay display */
  overlayNextMark: OverlayNextMark | undefined;
  /** Next mark data for quick actions (includes distance/bearing) */
  quickActionNextMark: QuickActionNextMark | undefined;
}

/**
 * Hook for calculating next mark data for racing
 */
export function useNextMarkData({
  raceMarks,
  gpsPosition,
}: UseNextMarkDataParams): UseNextMarkDataReturn {
  // Calculate the next mark position from race marks
  const nextMarkForCalculations = useMemo((): NextMarkCalculation | null => {
    if (!raceMarks || raceMarks.length === 0) {
      return null;
    }

    const mark = raceMarks[0];
    const lat = mark.latitude ?? mark.coordinates?.lat ?? mark.position?.lat;
    const lng = mark.longitude ?? mark.coordinates?.lng ?? mark.position?.lng;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return null;
    }

    return {
      name: mark.name || mark.mark_name || 'Mark 1',
      latitude: lat,
      longitude: lng,
    };
  }, [raceMarks]);

  // Format for overlay display
  const overlayNextMark = useMemo((): OverlayNextMark | undefined => {
    if (!nextMarkForCalculations) return undefined;
    return {
      latitude: nextMarkForCalculations.latitude,
      longitude: nextMarkForCalculations.longitude,
      name: nextMarkForCalculations.name,
    };
  }, [nextMarkForCalculations]);

  // Calculate distance and bearing for quick actions
  const quickActionNextMark = useMemo((): QuickActionNextMark | undefined => {
    if (!nextMarkForCalculations) {
      return undefined;
    }

    if (!gpsPosition || typeof gpsPosition.latitude !== 'number' || typeof gpsPosition.longitude !== 'number') {
      return {
        name: nextMarkForCalculations.name,
        distance: 0,
        bearing: 0,
      };
    }

    const distanceMeters = calculateDistance(
      gpsPosition.latitude,
      gpsPosition.longitude,
      nextMarkForCalculations.latitude,
      nextMarkForCalculations.longitude
    );

    const bearing = calculateBearing(
      gpsPosition.latitude,
      gpsPosition.longitude,
      nextMarkForCalculations.latitude,
      nextMarkForCalculations.longitude
    );

    return {
      name: nextMarkForCalculations.name,
      distance: distanceMeters / 1852, // Convert to nautical miles
      bearing,
    };
  }, [gpsPosition, nextMarkForCalculations]);

  return {
    nextMarkForCalculations,
    overlayNextMark,
    quickActionNextMark,
  };
}

export default useNextMarkData;

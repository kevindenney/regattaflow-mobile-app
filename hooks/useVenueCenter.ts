/**
 * useVenueCenter Hook
 *
 * Computes venue center coordinates from race metadata or marks.
 * Falls back to first mark with coordinates if metadata doesn't have venue location.
 */

import { useMemo } from 'react';
import { pickNumeric } from '@/lib/races';

// =============================================================================
// TYPES
// =============================================================================

export interface RaceMark {
  latitude?: number;
  longitude?: number;
  coordinates?: { lat?: number; lng?: number };
  position?: { lat?: number; lng?: number };
}

export interface UseVenueCenterParams {
  /** Selected race data with metadata */
  selectedRaceData: {
    metadata?: Record<string, unknown>;
  } | null;
  /** Race marks array */
  selectedRaceMarks: RaceMark[];
}

export interface VenueCenterCoords {
  latitude: number;
  longitude: number;
}

export interface UseVenueCenterReturn {
  /** Venue center coordinates */
  venueCenter: VenueCenterCoords | null;
}

/**
 * Hook for computing venue center coordinates
 */
export function useVenueCenter({
  selectedRaceData,
  selectedRaceMarks,
}: UseVenueCenterParams): UseVenueCenterReturn {
  const venueCenter = useMemo((): VenueCenterCoords | null => {
    const metadata = (selectedRaceData?.metadata || {}) as Record<string, unknown>;

    // First try to get from metadata
    const venueMeta = metadata.venue as Record<string, unknown> | undefined;
    const startLineMeta = metadata.start_line as Record<string, unknown> | undefined;

    const lat = pickNumeric([
      metadata.venue_lat as number | undefined,
      metadata.latitude as number | undefined,
      venueMeta?.lat as number | undefined,
      startLineMeta?.center_lat as number | undefined,
      metadata.center_lat as number | undefined,
    ]);
    const lng = pickNumeric([
      metadata.venue_lng as number | undefined,
      metadata.longitude as number | undefined,
      venueMeta?.lng as number | undefined,
      startLineMeta?.center_lng as number | undefined,
      metadata.center_lng as number | undefined,
    ]);

    if (lat !== null && lng !== null) {
      return { latitude: lat, longitude: lng };
    }

    // Fall back to first mark with coordinates
    const markWithCoords = selectedRaceMarks.find((mark) => {
      const markLat = mark.latitude ?? mark.coordinates?.lat ?? mark.position?.lat;
      const markLng = mark.longitude ?? mark.coordinates?.lng ?? mark.position?.lng;
      return typeof markLat === 'number' && typeof markLng === 'number';
    });

    if (markWithCoords) {
      const markLat = markWithCoords.latitude ?? markWithCoords.coordinates?.lat ?? markWithCoords.position?.lat;
      const markLng = markWithCoords.longitude ?? markWithCoords.coordinates?.lng ?? markWithCoords.position?.lng;
      if (typeof markLat === 'number' && typeof markLng === 'number') {
        return { latitude: markLat, longitude: markLng };
      }
    }

    return null;
  }, [selectedRaceData, selectedRaceMarks]);

  return { venueCenter };
}

export default useVenueCenter;

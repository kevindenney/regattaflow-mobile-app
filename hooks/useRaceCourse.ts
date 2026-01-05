/**
 * useRaceCourse Hook
 *
 * Builds a structured course object from race marks and metadata.
 * Computes start line, legs, distances, and leg types (upwind/downwind/reach).
 */

import { useMemo } from 'react';
import { TacticalCalculations } from '@/components/races/TacticalDataOverlay';
import { pickNumeric } from '@/lib/races';
import type { Course } from '@/stores/raceConditionsStore';

// =============================================================================
// TYPES
// =============================================================================

export interface RaceMark {
  id?: string;
  mark_name?: string;
  name?: string;
  mark_type?: string;
  type?: string;
  markType?: string;
  latitude?: number;
  longitude?: number;
  coordinates?: { lat?: number; lng?: number };
  position?: { lat?: number; lng?: number };
  rounding?: 'port' | 'starboard';
  rounding_type?: 'port' | 'starboard';
  roundingType?: 'port' | 'starboard';
}

export interface WindSnapshot {
  direction?: number | null;
}

export interface UseRaceCourseParams {
  /** Selected race ID */
  selectedRaceId: string | null;
  /** Selected race data with metadata */
  selectedRaceData: {
    name?: string;
    start_date?: string;
    metadata?: Record<string, unknown>;
  } | null;
  /** Race marks array */
  selectedRaceMarks: RaceMark[];
  /** Wind snapshot for leg type calculation */
  windSnapshot: WindSnapshot | null;
}

export interface UseRaceCourseReturn {
  /** Computed race course object */
  raceCourseForConsole: Course | null;
}

type MarkType = 'start-pin' | 'start-boat' | 'windward' | 'leeward' | 'offset' | 'finish';

interface ProcessedMark {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  type: MarkType;
  rounding?: 'port' | 'starboard';
}

/**
 * Hook for building race course data structure
 */
export function useRaceCourse({
  selectedRaceId,
  selectedRaceData,
  selectedRaceMarks,
  windSnapshot,
}: UseRaceCourseParams): UseRaceCourseReturn {
  const raceCourseForConsole = useMemo((): Course | null => {
    if (!selectedRaceData && (!selectedRaceMarks || selectedRaceMarks.length === 0)) {
      return null;
    }

    const metadata = (selectedRaceData?.metadata || {}) as Record<string, unknown>;

    // Process marks into normalized format
    const marks = (selectedRaceMarks || [])
      .map((mark, index): ProcessedMark | null => {
        const lat = mark.latitude ?? mark.coordinates?.lat ?? mark.position?.lat;
        const lng = mark.longitude ?? mark.coordinates?.lng ?? mark.position?.lng;

        if (typeof lat !== 'number' || typeof lng !== 'number') {
          return null;
        }

        const rawType = (mark.mark_type || mark.type || mark.markType || '') as string;
        const lowerType = rawType.toLowerCase();
        const lowerName = (mark.mark_name || mark.name || '').toLowerCase();

        let normalizedType: MarkType = 'windward';

        if (lowerType.includes('start') && (lowerType.includes('pin') || lowerName.includes('pin'))) {
          normalizedType = 'start-pin';
        } else if (
          lowerType.includes('start') &&
          (lowerType.includes('boat') || lowerType.includes('committee') || lowerName.includes('committee'))
        ) {
          normalizedType = 'start-boat';
        } else if (lowerType.includes('leeward') || lowerType.includes('gate')) {
          normalizedType = 'leeward';
        } else if (lowerType.includes('offset')) {
          normalizedType = 'offset';
        } else if (lowerType.includes('finish')) {
          normalizedType = 'finish';
        } else if (lowerType.includes('windward') || lowerName.includes('weather')) {
          normalizedType = 'windward';
        }

        const rounding = (mark.rounding || mark.rounding_type || mark.roundingType) as
          | 'port'
          | 'starboard'
          | undefined;

        return {
          id: mark.id ?? `mark-${index}`,
          name: mark.mark_name || mark.name || `Mark ${index + 1}`,
          position: { lat, lng },
          type: normalizedType,
          rounding,
        };
      })
      .filter((m): m is ProcessedMark => m !== null);

    if (marks.length === 0) {
      return null;
    }

    // Build start line from metadata or marks
    let startLine: Course['startLine'] | undefined;
    const startLineMeta = (metadata.start_line || metadata.startLine) as Record<string, unknown> | undefined;

    const resolveCoordinate = (value: unknown): number | null => {
      const candidate = value as Record<string, unknown> | number | null | undefined;
      return pickNumeric([
        candidate as number | null | undefined,
        (candidate as Record<string, unknown>)?.lat as number | undefined,
        (candidate as Record<string, unknown>)?.lng as number | undefined,
        (candidate as Record<string, unknown>)?.latitude as number | undefined,
        (candidate as Record<string, unknown>)?.longitude as number | undefined,
      ]);
    };

    if (startLineMeta && typeof startLineMeta === 'object') {
      const slm = startLineMeta as Record<string, unknown>;
      const portMeta = slm.port as Record<string, unknown> | undefined;
      const starboardMeta = slm.starboard as Record<string, unknown> | undefined;

      const portLat = resolveCoordinate(slm.port_lat ?? portMeta?.lat ?? portMeta?.latitude);
      const portLng = resolveCoordinate(slm.port_lng ?? portMeta?.lng ?? portMeta?.longitude);
      const starboardLat = resolveCoordinate(
        slm.starboard_lat ?? starboardMeta?.lat ?? starboardMeta?.latitude
      );
      const starboardLng = resolveCoordinate(
        slm.starboard_lng ?? starboardMeta?.lng ?? starboardMeta?.longitude
      );

      if (
        portLat !== null &&
        portLng !== null &&
        starboardLat !== null &&
        starboardLng !== null
      ) {
        const heading = TacticalCalculations.calculateBearing(
          portLat,
          portLng,
          starboardLat,
          starboardLng
        );
        const lengthMeters = TacticalCalculations.calculateDistance(
          portLat,
          portLng,
          starboardLat,
          starboardLng
        );
        startLine = {
          port: { latitude: portLat, longitude: portLng },
          starboard: { latitude: starboardLat, longitude: starboardLng },
          centerLat: (portLat + starboardLat) / 2,
          centerLon: (portLng + starboardLng) / 2,
          heading,
          length: lengthMeters,
        };
      }
    }

    // Fallback: derive start line from marks
    if (!startLine) {
      const portMark = marks.find((mark) => mark.type === 'start-pin');
      const starboardMark = marks.find((mark) => mark.type === 'start-boat');

      if (portMark && starboardMark) {
        const heading = TacticalCalculations.calculateBearing(
          portMark.position.lat,
          portMark.position.lng,
          starboardMark.position.lat,
          starboardMark.position.lng
        );
        const lengthMeters = TacticalCalculations.calculateDistance(
          portMark.position.lat,
          portMark.position.lng,
          starboardMark.position.lat,
          starboardMark.position.lng
        );

        startLine = {
          port: { latitude: portMark.position.lat, longitude: portMark.position.lng },
          starboard: { latitude: starboardMark.position.lat, longitude: starboardMark.position.lng },
          centerLat: (portMark.position.lat + starboardMark.position.lat) / 2,
          centerLon: (portMark.position.lng + starboardMark.position.lng) / 2,
          heading,
          length: lengthMeters,
        };
      }
    }

    // Build legs array
    const legs = marks.slice(0, -1).map((mark, index) => {
      const next = marks[index + 1];
      const heading = TacticalCalculations.calculateBearing(
        mark.position.lat,
        mark.position.lng,
        next.position.lat,
        next.position.lng
      );
      const distanceMeters = TacticalCalculations.calculateDistance(
        mark.position.lat,
        mark.position.lng,
        next.position.lat,
        next.position.lng
      );
      const distanceNm = distanceMeters / 1852;

      // Determine leg type based on wind direction
      let type: 'upwind' | 'downwind' | 'reach' = 'reach';
      if (windSnapshot?.direction !== undefined && windSnapshot?.direction !== null) {
        const angleDiff = Math.abs((heading - windSnapshot.direction + 360) % 360);
        if (angleDiff < 60 || angleDiff > 300) {
          type = 'upwind';
        } else if (angleDiff > 120 && angleDiff < 240) {
          type = 'downwind';
        }
      } else if (index === 0) {
        type = 'upwind';
      } else if (index % 2 === 1) {
        type = 'downwind';
      }

      return {
        id: `leg-${index}`,
        name: `${mark.name} → ${next.name}`,
        from: mark.id,
        to: next.id,
        type,
        distance: Number.isFinite(distanceNm) ? distanceNm : 0,
        heading,
        estimatedTime: undefined,
      };
    });

    const totalDistance = legs.reduce((sum, leg) => sum + (leg.distance ?? 0), 0);
    const laps = pickNumeric([
      metadata.laps as number | undefined,
      metadata.course_laps as number | undefined,
      metadata.race_laps as number | undefined,
    ]) ?? undefined;

    return {
      id: selectedRaceId ?? 'race-course',
      name: selectedRaceData?.name ?? 'Race Course',
      marks,
      legs,
      startTime: selectedRaceData?.start_date ? new Date(selectedRaceData.start_date) : undefined,
      startLine,
      distance: totalDistance,
      laps,
    } as Course;
  }, [selectedRaceData, selectedRaceMarks, selectedRaceId, windSnapshot]);

  return { raceCourseForConsole };
}

export default useRaceCourse;

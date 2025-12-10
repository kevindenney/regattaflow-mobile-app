/**
 * useVenueRacingAreas Hook
 * Fetches racing area geometry from venue_racing_areas table
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';

export interface RacingAreaGeometry {
  type: 'Point' | 'LineString' | 'Polygon';
  coordinates: number[] | number[][] | number[][][];
}

export interface VenueRacingArea {
  id: string;
  venueId: string;
  areaName: string;
  areaType: 'racing_area' | 'start_line' | 'finish_line' | 'mark' | 'gate' | 'prohibited_zone' | 'practice_area' | 'spectator_zone' | 'safety_zone';
  geometry: RacingAreaGeometry;
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  fillOpacity: number;
  description?: string;
  typicalCourses?: string[];
  classesUsed?: string[];
  markName?: string;
  markType?: string;
  rounding?: 'port' | 'starboard' | 'either';
  restrictionReason?: string;
  penaltyForViolation?: string;
}

export interface UseVenueRacingAreasResult {
  areas: VenueRacingArea[];
  racingAreas: VenueRacingArea[];
  marks: VenueRacingArea[];
  prohibitedZones: VenueRacingArea[];
  startFinishLines: VenueRacingArea[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch racing areas for a venue
 */
export function useVenueRacingAreas(venueId?: string): UseVenueRacingAreasResult {
  const [areas, setAreas] = useState<VenueRacingArea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAreas = useCallback(async () => {
    if (!venueId) {
      setAreas([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('venue_racing_areas')
        .select('*')
        .eq('venue_id', venueId)
        .eq('is_active', true)
        .order('area_type', { ascending: true });

      if (queryError) {
        throw new Error(queryError.message);
      }

      const transformedAreas: VenueRacingArea[] = (data || []).map((row: any) => ({
        id: row.id,
        venueId: row.venue_id,
        areaName: row.area_name,
        areaType: row.area_type,
        geometry: row.geometry,
        strokeColor: row.stroke_color || '#0284c7',
        strokeWidth: row.stroke_width || 2,
        fillColor: row.fill_color || '#0284c780',
        fillOpacity: row.fill_opacity || 0.3,
        description: row.description,
        typicalCourses: row.typical_courses,
        classesUsed: row.classes_used,
        markName: row.mark_name,
        markType: row.mark_type,
        rounding: row.rounding,
        restrictionReason: row.restriction_reason,
        penaltyForViolation: row.penalty_for_violation,
      }));

      setAreas(transformedAreas);
    } catch (err: any) {
      console.error('[useVenueRacingAreas] Error loading areas:', err);
      setError(err.message || 'Failed to load racing areas');
    } finally {
      setIsLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    loadAreas();
  }, [loadAreas]);

  // Filter by type
  const racingAreas = areas.filter(a => a.areaType === 'racing_area' || a.areaType === 'practice_area');
  const marks = areas.filter(a => a.areaType === 'mark' || a.areaType === 'gate');
  const prohibitedZones = areas.filter(a => a.areaType === 'prohibited_zone');
  const startFinishLines = areas.filter(a => a.areaType === 'start_line' || a.areaType === 'finish_line');

  return {
    areas,
    racingAreas,
    marks,
    prohibitedZones,
    startFinishLines,
    isLoading,
    error,
    refresh: loadAreas,
  };
}

export default useVenueRacingAreas;


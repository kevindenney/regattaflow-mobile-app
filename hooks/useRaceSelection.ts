/**
 * Race Selection Hook
 *
 * Encapsulates race selection state and detail loading logic.
 * Provides selected race data, marks, and loading states.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useRaceSelection');

export interface RaceMarkData {
  id: string;
  mark_name: string;
  mark_type: string;
  latitude: number;
  longitude: number;
  sequence_order: number;
}

export interface UseRaceSelectionOptions {
  /** Initial race ID from URL params or saved state */
  initialRaceId?: string | null;
  /** Available races to select from (for fallback lookup) */
  races?: any[];
  /** Key to trigger reload (increment to force refresh) */
  reloadKey?: number;
}

export interface UseRaceSelectionReturn {
  /** Currently selected race ID */
  selectedRaceId: string | null;
  /** Set selected race ID */
  setSelectedRaceId: (id: string | null) => void;
  /** Whether a race is currently selected */
  hasActiveRace: boolean;
  /** Full race data for selected race */
  selectedRaceData: any | null;
  /** Update selected race data (for optimistic updates) */
  setSelectedRaceData: React.Dispatch<React.SetStateAction<any | null>>;
  /** Course marks for selected race */
  selectedRaceMarks: RaceMarkData[];
  /** Whether race detail is loading */
  loadingRaceDetail: boolean;
  /** Whether user has manually selected a race */
  hasManuallySelected: boolean;
  /** Mark that user has manually selected */
  setHasManuallySelected: (value: boolean) => void;
  /** Force reload race details */
  triggerRaceDetailReload: () => void;
}

/**
 * Hook to manage race selection and detail loading
 */
export function useRaceSelection(
  options: UseRaceSelectionOptions = {}
): UseRaceSelectionReturn {
  const { initialRaceId = null, races = [], reloadKey = 0 } = options;

  // Selection state
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(initialRaceId);
  const [selectedRaceData, setSelectedRaceData] = useState<any>(null);
  const [selectedRaceMarks, setSelectedRaceMarks] = useState<RaceMarkData[]>([]);
  const [loadingRaceDetail, setLoadingRaceDetail] = useState(false);
  const [hasManuallySelected, setHasManuallySelected] = useState(false);
  const [raceDetailReloadKey, setRaceDetailReloadKey] = useState(0);

  const hasActiveRace = selectedRaceId !== null;

  const triggerRaceDetailReload = useCallback(() => {
    setRaceDetailReloadKey((prev) => prev + 1);
  }, []);

  // Fetch race detail when selection changes
  useEffect(() => {
    const fetchRaceDetail = async () => {
      const selectionAtStart = selectedRaceId;
      logger.debug('📥 FETCHING RACE DETAILS for:', selectedRaceId);

      if (!selectedRaceId) {
        logger.debug('No selectedRaceId, clearing data');
        setSelectedRaceData(null);
        setSelectedRaceMarks([]);
        return;
      }

      // Check if race is in local list first (might be fallback data)
      const localRace = races.find((r: any) => r.id === selectedRaceId);
      if (localRace && !localRace.id?.includes('-')) {
        // Local race data with non-UUID ID (likely fallback)
        logger.debug('📦 Using local race data (fallback):', localRace.name);
        setLoadingRaceDetail(false);
        setSelectedRaceData(localRace);
        setSelectedRaceMarks([]);
        return;
      }

      setLoadingRaceDetail(true);
      try {
        logger.debug('Querying database for race ID:', selectedRaceId);
        const { data, error } = await supabase
          .from('regattas')
          .select('*')
          .eq('id', selectedRaceId)
          .single();

        if (error) {
          logger.warn('⚠️ Database fetch failed, checking local data');
          if (localRace) {
            logger.debug('📦 Using local race data as fallback:', localRace.name);
            setLoadingRaceDetail(false);
            setSelectedRaceData(localRace);
            setSelectedRaceMarks([]);
            return;
          }
          throw error;
        }

        // Ignore stale results if selection changed during fetch
        if (selectionAtStart !== selectedRaceId) {
          logger.debug(
            '⏭️ Ignoring stale fetch result for',
            data?.name,
            'selection changed to',
            selectedRaceId
          );
          return;
        }

        setSelectedRaceData(data);

        // Try to find associated race_event for marks
        const { data: raceEvent } = await supabase
          .from('race_events')
          .select('id')
          .eq('regatta_id', selectedRaceId)
          .maybeSingle();

        if (raceEvent) {
          const { data: marksData, error: marksError } = await supabase
            .from('race_marks')
            .select('*')
            .eq('race_id', raceEvent.id)
            .order('name', { ascending: true });

          if (!marksError && marksData) {
            const convertedMarks: RaceMarkData[] = marksData.map((mark: any) => ({
              id: mark.id,
              mark_name: mark.name,
              mark_type: mark.mark_type,
              latitude: mark.latitude,
              longitude: mark.longitude,
              sequence_order: 0,
            }));

            // Deduplicate marks
            const uniqueMarks = convertedMarks.filter((mark, index, self) => {
              const markKey = `${mark.mark_name}:${mark.mark_type}`;
              return (
                index ===
                self.findIndex((m) => `${m.mark_name}:${m.mark_type}` === markKey)
              );
            });

            if (uniqueMarks.length < convertedMarks.length) {
              logger.warn(
                `⚠️ Deduplicated marks: ${convertedMarks.length} -> ${uniqueMarks.length}`
              );
            }

            setSelectedRaceMarks(uniqueMarks);
            logger.debug('Marks loaded:', uniqueMarks.length);
          }
        }
      } catch (error) {
        logger.error('❌ Error fetching race detail:', error);
        setSelectedRaceData(null);
        setSelectedRaceMarks([]);
      } finally {
        setLoadingRaceDetail(false);
        logger.debug('🏁 Fetch complete');
      }
    };

    fetchRaceDetail();
  }, [selectedRaceId, raceDetailReloadKey, reloadKey, races]);

  return {
    selectedRaceId,
    setSelectedRaceId,
    hasActiveRace,
    selectedRaceData,
    setSelectedRaceData,
    selectedRaceMarks,
    loadingRaceDetail,
    hasManuallySelected,
    setHasManuallySelected,
    triggerRaceDetailReload,
  };
}

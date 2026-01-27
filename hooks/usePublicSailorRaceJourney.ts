/**
 * usePublicSailorRaceJourney Hook
 *
 * Fetches all data needed to display another sailor's race journey:
 * - Sailor profile (avatar, name)
 * - Race details
 * - Race preparation (strategy, intentions, checklist progress)
 * - Race results
 *
 * Used by the SailorRaceJourneyScreen for the full-screen detailed view.
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { sailorRacePreparationService, SailorRacePreparation } from '@/services/SailorRacePreparationService';
import { RaceIntentions } from '@/types/raceIntentions';
import { TuningSettings } from '@/hooks/useRegattaContent';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('usePublicSailorRaceJourney');

/**
 * Sailor profile for display
 */
export interface SailorProfile {
  id: string;
  full_name: string;
  avatar_emoji?: string;
  avatar_color?: string;
}

/**
 * Race data structure
 */
export interface RaceData {
  id: string;
  name: string;
  race_series?: string;
  start_date: string;
  start_time?: string;
  venue_name?: string;
  boat_class?: string;
  content_visibility?: string;
  prep_notes?: string;
  tuning_settings?: TuningSettings;
  post_race_notes?: string;
  lessons_learned?: string[];
  metadata?: Record<string, any>;
}

/**
 * Race result data
 */
export interface RaceResult {
  id: string;
  race_id: string;
  position?: number;
  total_boats?: number;
  notes?: string;
  rating_change?: number;
}

/**
 * Checklist completion summary
 */
export interface ChecklistSummary {
  totalItems: number;
  completedItems: number;
  percentage: number;
}

/**
 * Complete journey data structure
 */
export interface SailorRaceJourneyData {
  sailorProfile: SailorProfile | null;
  race: RaceData | null;
  preparation: SailorRacePreparation | null;
  intentions: RaceIntentions | null;
  raceResults: RaceResult[] | null;
  checklistSummary: ChecklistSummary | null;
}

export interface UsePublicSailorRaceJourneyResult extends SailorRaceJourneyData {
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Calculate checklist completion summary from intentions
 */
function calculateChecklistSummary(intentions: RaceIntentions | null): ChecklistSummary | null {
  if (!intentions?.checklistCompletions) {
    return null;
  }

  const completions = intentions.checklistCompletions;
  const totalItems = Object.keys(completions).length;
  const completedItems = Object.values(completions).filter(
    (c) => c.completed || c.status === 'completed'
  ).length;

  if (totalItems === 0) {
    return null;
  }

  return {
    totalItems,
    completedItems,
    percentage: Math.round((completedItems / totalItems) * 100),
  };
}

/**
 * Hook to fetch a public sailor's race journey data
 */
export function usePublicSailorRaceJourney(
  sailorId: string | null,
  raceId: string | null
): UsePublicSailorRaceJourneyResult {
  const [data, setData] = useState<SailorRaceJourneyData>({
    sailorProfile: null,
    race: null,
    preparation: null,
    intentions: null,
    raceResults: null,
    checklistSummary: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!sailorId || !raceId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel for efficiency
      const [profileResult, raceResult, preparationResult, resultsResult] = await Promise.all([
        // Fetch sailor profile
        (async () => {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .eq('id', sailorId)
            .single();

          if (profileError) throw profileError;

          // Fetch avatar data from sailor_profiles
          const { data: sailorProfileData } = await supabase
            .from('sailor_profiles')
            .select('avatar_emoji, avatar_color')
            .eq('user_id', sailorId)
            .single();

          return {
            ...profileData,
            avatar_emoji: sailorProfileData?.avatar_emoji,
            avatar_color: sailorProfileData?.avatar_color,
          } as SailorProfile;
        })(),

        // Fetch race data - check visibility
        (async () => {
          const { data: raceData, error: raceError } = await supabase
            .from('regattas')
            .select(
              `id, name, race_series, start_date, start_time, venue_name, boat_class,
               content_visibility, prep_notes, tuning_settings, post_race_notes,
               lessons_learned, metadata`
            )
            .eq('id', raceId)
            .eq('created_by', sailorId)
            .single();

          if (raceError) throw raceError;

          // Check visibility - only allow public or fleet races to be viewed
          if (raceData.content_visibility === 'private') {
            throw new Error('This race is private');
          }

          return raceData as RaceData;
        })(),

        // Fetch preparation data using service
        sailorRacePreparationService.getPreparation(raceId, sailorId),

        // Fetch race results
        (async () => {
          const { data: resultsData, error: resultsError } = await supabase
            .from('race_results')
            .select('id, race_id, position, total_boats, notes, rating_change')
            .eq('race_id', raceId)
            .eq('user_id', sailorId);

          if (resultsError) throw resultsError;
          return resultsData as RaceResult[];
        })(),
      ]);

      const intentions = preparationResult?.user_intentions || null;
      const checklistSummary = calculateChecklistSummary(intentions);

      setData({
        sailorProfile: profileResult,
        race: raceResult,
        preparation: preparationResult,
        intentions,
        raceResults: resultsResult,
        checklistSummary,
      });
    } catch (err) {
      logger.error('Error fetching sailor race journey:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [sailorId, raceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

export default usePublicSailorRaceJourney;

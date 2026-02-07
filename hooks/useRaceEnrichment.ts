/**
 * useRaceEnrichment Hook
 *
 * Lazy-loads full race enrichment data (prep notes, tuning settings,
 * post-race notes, lessons learned) only when triggered by user interaction.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useRaceEnrichment');

// =============================================================================
// TYPES
// =============================================================================

export interface RaceEnrichmentData {
  prepNotes: string | null;
  tuningSettings: Record<string, any> | null;
  postRaceNotes: string | null;
  lessonsLearned: string[] | null;
}

// =============================================================================
// QUERY KEYS
// =============================================================================

export const raceEnrichmentKeys = {
  all: ['race-enrichment'] as const,
  race: (raceId: string) => [...raceEnrichmentKeys.all, raceId] as const,
};

// =============================================================================
// HOOK
// =============================================================================

/**
 * Lazy enrichment hook — only fetches when `enabled` is true.
 * Call with enabled=false initially, then set to true when user taps an indicator pill.
 */
export function useRaceEnrichment(raceId: string, enabled: boolean) {
  return useQuery({
    queryKey: raceEnrichmentKeys.race(raceId),
    queryFn: async (): Promise<RaceEnrichmentData> => {
      const { data, error } = await supabase
        .from('regattas')
        .select('prep_notes, tuning_settings, post_race_notes, lessons_learned')
        .eq('id', raceId)
        .single();

      if (error) {
        logger.error('Error fetching race enrichment:', error);
        throw error;
      }

      return {
        prepNotes: data?.prep_notes || null,
        tuningSettings: data?.tuning_settings || null,
        postRaceNotes: data?.post_race_notes || null,
        lessonsLearned: data?.lessons_learned || null,
      };
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes — enrichment data rarely changes
    gcTime: 30 * 60 * 1000,
  });
}

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

export interface RaceResultEntry {
  race_number: number;
  position: number;
  fleet_size: number;
  key_moment?: string;
}

export interface RaceEnrichmentData {
  prepNotes: string | null;
  tuningSettings: Record<string, any> | null;
  postRaceNotes: string | null;
  lessonsLearned: string[] | null;
  // Race results from timer sessions
  position: number | null;
  fleetSize: number | null;
  raceCount: number | null;
  raceResults: RaceResultEntry[] | null;
  // Phase ratings from debrief
  phaseRatings: Record<string, number> | null;
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
      // Skip demo race IDs that aren't valid UUIDs
      if (raceId.startsWith('demo-')) {
        return {
          prepNotes: null, tuningSettings: null, postRaceNotes: null, lessonsLearned: null,
          position: null, fleetSize: null, raceCount: null, raceResults: null, phaseRatings: null,
        };
      }

      // Fetch regatta data and timer session in parallel
      const [regattaResult, timerResult] = await Promise.all([
        supabase
          .from('regattas')
          .select('prep_notes, tuning_settings, post_race_notes, lessons_learned')
          .eq('id', raceId)
          .single(),
        supabase
          .from('race_timer_sessions')
          .select('position, fleet_size, race_count, race_results, phase_ratings')
          .eq('regatta_id', raceId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (regattaResult.error) {
        logger.error('Error fetching race enrichment:', regattaResult.error);
        throw regattaResult.error;
      }

      if (timerResult.error) {
        logger.warn('Error fetching timer session (non-fatal):', timerResult.error);
      }

      const data = regattaResult.data;
      const timer = timerResult.data;

      return {
        prepNotes: data?.prep_notes || null,
        tuningSettings: data?.tuning_settings || null,
        postRaceNotes: data?.post_race_notes || null,
        lessonsLearned: data?.lessons_learned || null,
        position: timer?.position ?? null,
        fleetSize: timer?.fleet_size ?? null,
        raceCount: timer?.race_count ?? null,
        raceResults: timer?.race_results as RaceResultEntry[] | null ?? null,
        phaseRatings: timer?.phase_ratings as Record<string, number> | null ?? null,
      };
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes — enrichment data rarely changes
    gcTime: 30 * 60 * 1000,
  });
}

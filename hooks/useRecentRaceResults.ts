/**
 * useRecentRaceResults Hook
 *
 * Fetches the sailor's last ~6 race positions for sparkline display.
 * Queries race_timer_sessions where self_reported_position IS NOT NULL,
 * ordered by start_time desc, excluding the current race.
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';

export interface RecentRacePosition {
  raceId: string;
  raceName: string;
  date: string;
  position: number;
  fleetSize: number;
}

interface UseRecentRaceResultsResult {
  recentResults: RecentRacePosition[];
  averagePosition: number | null;
  isLoading: boolean;
}

export function useRecentRaceResults(
  userId?: string,
  currentRaceId?: string,
  limit: number = 6
): UseRecentRaceResultsResult {
  const [recentResults, setRecentResults] = useState<RecentRacePosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchRecentResults() {
      if (!userId) {
        setRecentResults([]);
        return;
      }

      setIsLoading(true);

      try {
        let query = supabase
          .from('race_timer_sessions')
          .select('regatta_id, start_time, self_reported_position, self_reported_fleet_size')
          .eq('sailor_id', userId)
          .not('self_reported_position', 'is', null)
          .not('self_reported_fleet_size', 'is', null)
          .order('start_time', { ascending: false })
          .limit(limit + 1); // fetch one extra in case we need to filter current race

        if (currentRaceId) {
          query = query.neq('regatta_id', currentRaceId);
        }

        const { data, error } = await query.limit(limit);

        if (error) {
          console.warn('[useRecentRaceResults] Query error:', error);
          if (isMounted) setRecentResults([]);
          return;
        }

        if (!isMounted) return;

        const results: RecentRacePosition[] = (data || []).map((row) => ({
          raceId: row.regatta_id,
          raceName: '', // Not needed for sparkline
          date: row.start_time,
          position: row.self_reported_position as number,
          fleetSize: row.self_reported_fleet_size as number,
        }));

        // Reverse so oldest is first (left side of sparkline)
        results.reverse();

        setRecentResults(results);
      } catch (err) {
        console.error('[useRecentRaceResults] Error:', err);
        if (isMounted) setRecentResults([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchRecentResults();

    return () => {
      isMounted = false;
    };
  }, [userId, currentRaceId, limit]);

  // Compute average position
  const averagePosition =
    recentResults.length > 0
      ? Math.round(
          (recentResults.reduce((sum, r) => sum + r.position, 0) / recentResults.length) * 10
        ) / 10
      : null;

  return { recentResults, averagePosition, isLoading };
}

export default useRecentRaceResults;

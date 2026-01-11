/**
 * Hook to get race position within a series/season and day
 *
 * Returns position like "Race 10 of 13" for series
 * and "Race 2 today" for multiple races on the same day
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';

export interface RaceSeriesPositionData {
  /** Position within the series (1-indexed) */
  seriesPosition?: number;
  /** Total races in the series */
  seriesTotalRaces?: number;
  /** Name of the series/season */
  seriesName?: string;
  /** Position within races on the same day (1-indexed) */
  dayPosition?: number;
  /** Total races on the same day */
  dayTotalRaces?: number;
  /** Whether there are multiple races on this day */
  isMultiRaceDay: boolean;
}

interface UseRaceSeriesPositionOptions {
  raceId: string;
  raceDate: string;
  seasonId?: string | null;
  enabled?: boolean;
}

/**
 * Get race position within series and day
 */
export function useRaceSeriesPosition({
  raceId,
  raceDate,
  seasonId,
  enabled = true,
}: UseRaceSeriesPositionOptions) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['raceSeriesPosition', raceId, seasonId, raceDate, user?.id],
    queryFn: async (): Promise<RaceSeriesPositionData> => {
      const result: RaceSeriesPositionData = {
        isMultiRaceDay: false,
      };

      // Get series position if we have a season
      if (seasonId) {
        // Get all races in this season, ordered by date
        const { data: seasonRaces, error: seasonError } = await supabase
          .from('race_events')
          .select('id, start_time, name')
          .eq('season_id', seasonId)
          .order('start_time', { ascending: true });

        if (!seasonError && seasonRaces && seasonRaces.length > 0) {
          // Find position of current race
          const position = seasonRaces.findIndex(r => r.id === raceId) + 1;
          if (position > 0) {
            result.seriesPosition = position;
            result.seriesTotalRaces = seasonRaces.length;
          }
        }

        // Get season name
        const { data: season } = await supabase
          .from('seasons')
          .select('name')
          .eq('id', seasonId)
          .single();

        if (season) {
          result.seriesName = season.name;
        }
      }

      // Get day position - count races on the same day for this user
      if (user?.id && raceDate) {
        const dayStart = raceDate.split('T')[0]; // Get date portion

        const { data: dayRaces, error: dayError } = await supabase
          .from('race_events')
          .select('id, start_time')
          .eq('user_id', user.id)
          .gte('start_time', `${dayStart}T00:00:00`)
          .lt('start_time', `${dayStart}T23:59:59`)
          .order('start_time', { ascending: true });

        if (!dayError && dayRaces && dayRaces.length > 1) {
          result.isMultiRaceDay = true;
          result.dayTotalRaces = dayRaces.length;

          // Find position of current race in day's races
          const dayPosition = dayRaces.findIndex(r => r.id === raceId) + 1;
          if (dayPosition > 0) {
            result.dayPosition = dayPosition;
          }
        }
      }

      return result;
    },
    enabled: enabled && !!raceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

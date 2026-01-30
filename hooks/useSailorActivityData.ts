/**
 * useSailorActivityData - Hook for fetching sailor activity data for charts
 *
 * Aggregates race data by month for the past 12 months to display
 * Strava-style activity charts on sailor profiles.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { startOfMonth, subMonths, format, parseISO } from 'date-fns';

export interface MonthlyActivity {
  month: string; // Format: 'Jan', 'Feb', etc.
  fullMonth: string; // Format: '2024-01'
  races: number;
  wins: number;
  podiums: number;
}

export interface SailorActivityData {
  monthlyActivity: MonthlyActivity[];
  totalRaces: number;
  totalWins: number;
  totalPodiums: number;
  mostActiveMonth: MonthlyActivity | null;
}

/**
 * Fetch and aggregate sailor activity data
 */
async function fetchSailorActivity(userId: string): Promise<SailorActivityData> {
  const now = new Date();
  const twelveMonthsAgo = subMonths(startOfMonth(now), 11);

  // Fetch regattas for the past 12 months
  const { data: regattas, error } = await supabase
    .from('regattas')
    .select('id, start_date, result_position, fleet_size')
    .eq('created_by', userId)
    .gte('start_date', twelveMonthsAgo.toISOString())
    .order('start_date', { ascending: true });

  if (error) {
    throw error;
  }

  // Initialize monthly data for the past 12 months
  const monthlyData: Map<string, MonthlyActivity> = new Map();

  for (let i = 11; i >= 0; i--) {
    const monthDate = subMonths(startOfMonth(now), i);
    const fullMonth = format(monthDate, 'yyyy-MM');
    const monthLabel = format(monthDate, 'MMM');

    monthlyData.set(fullMonth, {
      month: monthLabel,
      fullMonth,
      races: 0,
      wins: 0,
      podiums: 0,
    });
  }

  // Aggregate race data
  let totalRaces = 0;
  let totalWins = 0;
  let totalPodiums = 0;

  for (const regatta of regattas || []) {
    const raceDate = parseISO(regatta.start_date);
    const fullMonth = format(raceDate, 'yyyy-MM');

    const monthActivity = monthlyData.get(fullMonth);
    if (monthActivity) {
      monthActivity.races += 1;
      totalRaces += 1;

      // Check for win (position 1)
      if (regatta.result_position === 1) {
        monthActivity.wins += 1;
        totalWins += 1;
      }

      // Check for podium (position 1, 2, or 3)
      if (regatta.result_position && regatta.result_position <= 3) {
        monthActivity.podiums += 1;
        totalPodiums += 1;
      }
    }
  }

  // Convert map to array (preserves chronological order)
  const monthlyActivity = Array.from(monthlyData.values());

  // Find most active month
  const mostActiveMonth = monthlyActivity.reduce<MonthlyActivity | null>(
    (max, current) => {
      if (!max || current.races > max.races) {
        return current;
      }
      return max;
    },
    null
  );

  return {
    monthlyActivity,
    totalRaces,
    totalWins,
    totalPodiums,
    mostActiveMonth,
  };
}

/**
 * Hook for fetching sailor activity data
 */
export function useSailorActivityData(userId: string) {
  return useQuery({
    queryKey: ['sailor-activity', userId],
    queryFn: () => fetchSailorActivity(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

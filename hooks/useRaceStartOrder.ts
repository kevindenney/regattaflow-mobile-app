/**
 * Hook to get start order information for a race
 *
 * Returns the fleet's position in the start sequence,
 * time to warning signal, and class flag color.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';

export interface RaceStartOrderData {
  /** Position in the start sequence (1-indexed) */
  startOrder: number;
  /** Total number of fleets starting */
  totalFleets: number;
  /** Class flag color/identifier */
  classFlag?: string;
  /** Fleet name */
  fleetName?: string;
  /** Planned warning time (ISO string) */
  plannedWarningTime?: string;
  /** Planned start time (ISO string) */
  plannedStartTime?: string;
  /** Minutes until warning signal */
  timeToWarningMinutes?: number;
  /** Minutes until start */
  timeToStartMinutes?: number;
  /** Current status of the fleet start */
  status: string;
}

interface UseRaceStartOrderOptions {
  /** The race event ID */
  raceId: string;
  /** User's fleet name (to match in schedule) */
  fleetName?: string;
  /** User's boat class (to match in schedule) */
  boatClass?: string;
  /** Race date for finding relevant schedules */
  raceDate: string;
  /** Regatta ID if known */
  regattaId?: string | null;
  enabled?: boolean;
}

/**
 * Calculate minutes until a target time
 */
function calculateMinutesUntil(targetTime: string): number {
  const target = new Date(targetTime);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60)));
}

/**
 * Get start order information for a race
 */
export function useRaceStartOrder({
  raceId,
  fleetName,
  boatClass,
  raceDate,
  regattaId,
  enabled = true,
}: UseRaceStartOrderOptions) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['raceStartOrder', raceId, fleetName, boatClass, raceDate, regattaId],
    queryFn: async (): Promise<RaceStartOrderData | null> => {
      // First, try to find a schedule for this race's regatta
      let scheduleId: string | null = null;

      if (regattaId) {
        // Query schedules for the regatta on the race date
        const raceDay = raceDate.split('T')[0];
        const { data: schedules } = await supabase
          .from('race_start_schedules')
          .select('id')
          .eq('regatta_id', regattaId)
          .gte('scheduled_date', `${raceDay}T00:00:00`)
          .lt('scheduled_date', `${raceDay}T23:59:59`)
          .limit(1);

        if (schedules && schedules.length > 0) {
          scheduleId = schedules[0].id;
        }
      }

      if (!scheduleId) {
        return null;
      }

      // Get all fleet entries for this schedule
      const { data: entries, error } = await supabase
        .from('fleet_start_entries')
        .select('*')
        .eq('schedule_id', scheduleId)
        .order('start_order');

      if (error || !entries || entries.length === 0) {
        return null;
      }

      // Find the user's fleet entry
      // Match by fleet name or boat class (case-insensitive)
      const userEntry = entries.find(e => {
        if (fleetName && e.fleet_name?.toLowerCase() === fleetName.toLowerCase()) {
          return true;
        }
        if (boatClass && e.fleet_name?.toLowerCase() === boatClass.toLowerCase()) {
          return true;
        }
        return false;
      });

      if (!userEntry) {
        // If we can't find user's specific fleet, return the first entry as reference
        // This at least shows the schedule exists
        return null;
      }

      // Calculate time to warning and start
      let timeToWarningMinutes: number | undefined;
      let timeToStartMinutes: number | undefined;

      if (userEntry.planned_warning_time) {
        timeToWarningMinutes = calculateMinutesUntil(userEntry.planned_warning_time);
      }
      if (userEntry.planned_start_time) {
        timeToStartMinutes = calculateMinutesUntil(userEntry.planned_start_time);
      }

      return {
        startOrder: userEntry.start_order,
        totalFleets: entries.length,
        classFlag: userEntry.class_flag || undefined,
        fleetName: userEntry.fleet_name,
        plannedWarningTime: userEntry.planned_warning_time || undefined,
        plannedStartTime: userEntry.planned_start_time || undefined,
        timeToWarningMinutes,
        timeToStartMinutes,
        status: userEntry.status,
      };
    },
    enabled: enabled && !!raceId && (!!fleetName || !!boatClass),
    staleTime: 30 * 1000, // 30 seconds - refresh often for timing accuracy
    refetchInterval: 60 * 1000, // Refetch every minute to update countdown
  });
}

/**
 * useUserActivityData - Activity data for profile sheet
 *
 * Provides race counts, training sessions, and sparkline data
 * for the Tufte-style profile popup
 */

import { useAuth } from '@/providers/AuthProvider';
import api from '@/services/apiService';
import { useEffect, useState } from 'react';

export interface UserActivityData {
  upcomingRacesCount: number;
  trainingSessionsThisWeek: number;
  activityData: number[];  // 14-day counts for sparkline
  monthlyTotal: number;
  monthlyVsAvg: number;
  loading: boolean;
  error: Error | null;
}

export function useUserActivityData(): UserActivityData {
  const { user } = useAuth();
  const [data, setData] = useState<UserActivityData>({
    upcomingRacesCount: 0,
    trainingSessionsThisWeek: 0,
    activityData: [],
    monthlyTotal: 0,
    monthlyVsAvg: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!user?.id) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchActivityData = async () => {
      try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Calculate date ranges
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const twoWeeksAgo = new Date(today);
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

        // Fetch upcoming races count
        const { data: racesData, error: racesError } = await api.supabase
          .from('regattas')
          .select('id', { count: 'exact' })
          .eq('created_by', user.id)
          .gte('start_date', today.toISOString());

        if (racesError) throw racesError;

        // Fetch training sessions this week
        const { data: weekSessions, error: weekError } = await api.supabase
          .from('race_timer_sessions')
          .select('id', { count: 'exact' })
          .eq('sailor_id', user.id)
          .gte('start_time', weekAgo.toISOString());

        if (weekError) throw weekError;

        // Fetch sessions for sparkline (last 14 days)
        const { data: recentSessions, error: recentError } = await api.supabase
          .from('race_timer_sessions')
          .select('start_time')
          .eq('sailor_id', user.id)
          .gte('start_time', twoWeeksAgo.toISOString())
          .order('start_time', { ascending: true });

        if (recentError) throw recentError;

        // Build sparkline data (session count per day for last 14 days)
        const dailyCounts: number[] = Array(14).fill(0);
        (recentSessions || []).forEach(session => {
          const sessionDate = new Date(session.start_time);
          const dayIndex = Math.floor(
            (sessionDate.getTime() - twoWeeksAgo.getTime()) / (24 * 60 * 60 * 1000)
          );
          if (dayIndex >= 0 && dayIndex < 14) {
            dailyCounts[dayIndex]++;
          }
        });

        // Fetch this month's total
        const { data: monthSessions, error: monthError } = await api.supabase
          .from('race_timer_sessions')
          .select('id', { count: 'exact' })
          .eq('sailor_id', user.id)
          .gte('start_time', monthStart.toISOString());

        if (monthError) throw monthError;

        // Fetch last month's total for comparison
        const { data: lastMonthSessions, error: lastMonthError } = await api.supabase
          .from('race_timer_sessions')
          .select('id', { count: 'exact' })
          .eq('sailor_id', user.id)
          .gte('start_time', lastMonthStart.toISOString())
          .lt('start_time', lastMonthEnd.toISOString());

        if (lastMonthError) throw lastMonthError;

        const monthlyTotal = monthSessions?.length || 0;
        const lastMonthTotal = lastMonthSessions?.length || 0;

        // Calculate days elapsed in current month for fair comparison
        const daysInMonth = today.getDate();
        const daysInLastMonth = lastMonthEnd.getDate();
        const normalizedLastMonth = Math.round((lastMonthTotal / daysInLastMonth) * daysInMonth);
        const monthlyVsAvg = monthlyTotal - normalizedLastMonth;

        setData({
          upcomingRacesCount: racesData?.length || 0,
          trainingSessionsThisWeek: weekSessions?.length || 0,
          activityData: dailyCounts,
          monthlyTotal,
          monthlyVsAvg,
          loading: false,
          error: null,
        });
      } catch (err) {
        setData(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err : new Error('Failed to load activity data'),
        }));
      }
    };

    fetchActivityData();
  }, [user?.id]);

  return data;
}

export default useUserActivityData;

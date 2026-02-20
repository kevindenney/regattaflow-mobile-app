/**
 * Sailor-specific hooks for coaching session data
 *
 * These hooks query coaching data from the sailor's perspective,
 * using sailor_id rather than coach_id. This ensures sailors who
 * are not coaches still see their own sessions and stats.
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import type { CoachingSession } from '@/services/CoachingService';

const SAILOR_COACHING_KEYS = {
  upcomingSessions: (sailorId: string) => ['sailor', 'coaching-sessions', 'upcoming', sailorId],
  recentSessions: (sailorId: string) => ['sailor', 'coaching-sessions', 'recent', sailorId],
  stats: (sailorId: string) => ['sailor', 'coaching-stats', sailorId],
};

/**
 * Fetch upcoming coaching sessions for the current sailor.
 * Queries coaching_sessions where sailor_id = current user,
 * status in ('scheduled', 'confirmed', 'pending'), and scheduled_at >= now.
 * Joins coach_profiles for coach display_name and profile_photo_url.
 */
export function useSailorUpcomingSessions(limit: number = 10) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<CoachingSession[]>({
    queryKey: SAILOR_COACHING_KEYS.upcomingSessions(userId || ''),
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('coaching_sessions')
        .select(`
          *,
          coach:coach_profiles!coaching_sessions_coach_id_fkey(
            id,
            display_name,
            profile_photo_url:profile_image_url
          )
        `)
        .eq('sailor_id', userId)
        .in('status', ['scheduled', 'confirmed', 'pending'])
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('[useSailorUpcomingSessions] Query error:', error.message);
        throw error;
      }

      return (data ?? []) as unknown as CoachingSession[];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch recent completed coaching sessions for the current sailor.
 * Queries coaching_sessions where sailor_id = current user and status = 'completed'.
 * Joins coach_profiles and session_feedback.
 */
export function useSailorRecentSessions(limit: number = 10) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<CoachingSession[]>({
    queryKey: SAILOR_COACHING_KEYS.recentSessions(userId || ''),
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('coaching_sessions')
        .select(`
          *,
          coach:coach_profiles!coaching_sessions_coach_id_fkey(
            id,
            display_name,
            profile_photo_url:profile_image_url
          ),
          feedback:session_feedback(
            id,
            session_id,
            rating,
            feedback_text
          )
        `)
        .eq('sailor_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[useSailorRecentSessions] Query error:', error.message);
        throw error;
      }

      // Normalize feedback from array to single object (Supabase returns arrays for joins)
      const normalized = (data ?? []).map((session: any) => ({
        ...session,
        feedback: Array.isArray(session.feedback) ? session.feedback[0] ?? null : session.feedback,
      }));

      return normalized as unknown as CoachingSession[];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

export interface SailorCoachingStats {
  coachCount: number;
  upcomingSessions: number;
  completedSessions: number;
  totalHours: number;
}

/**
 * Fetch coaching stats for the current sailor.
 * Returns coach count (active coaching_clients), upcoming session count,
 * completed session count, and total hours from coaching_sessions.
 */
export function useSailorCoachingStats() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<SailorCoachingStats | null>({
    queryKey: SAILOR_COACHING_KEYS.stats(userId || ''),
    queryFn: async () => {
      if (!userId) return null;

      // Run queries in parallel for performance
      const [clientsResult, upcomingResult, completedResult] = await Promise.all([
        // Count active coaching relationships
        supabase
          .from('coaching_clients')
          .select('id', { count: 'exact', head: true })
          .eq('sailor_id', userId)
          .eq('status', 'active'),

        // Count upcoming sessions
        supabase
          .from('coaching_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('sailor_id', userId)
          .in('status', ['scheduled', 'confirmed', 'pending'])
          .gte('scheduled_at', new Date().toISOString()),

        // Count completed sessions and sum hours
        supabase
          .from('coaching_sessions')
          .select('duration_minutes')
          .eq('sailor_id', userId)
          .eq('status', 'completed'),
      ]);

      if (clientsResult.error) {
        console.error('[useSailorCoachingStats] coaching_clients query error:', clientsResult.error.message);
      }
      if (upcomingResult.error) {
        console.error('[useSailorCoachingStats] upcoming query error:', upcomingResult.error.message);
      }
      if (completedResult.error) {
        console.error('[useSailorCoachingStats] completed query error:', completedResult.error.message);
      }

      const completedSessions = completedResult.data ?? [];
      const totalMinutes = completedSessions.reduce(
        (sum, s) => sum + (s.duration_minutes || 0),
        0
      );

      return {
        coachCount: clientsResult.count ?? 0,
        upcomingSessions: upcomingResult.count ?? 0,
        completedSessions: completedSessions.length,
        totalHours: parseFloat((totalMinutes / 60).toFixed(1)),
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Advanced hooks for Coach data with React Query
 *
 * These hooks provide cached, optimized access to coach-related data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCoachWorkspace as useCoachWorkspaceBasic } from './useCoachWorkspace';
import { COACH_QUERY_KEYS } from '@/providers/CoachWorkspaceProvider';
import { coachingService, CoachingSession, CoachingClient, CoachEarningsSummary } from '@/services/CoachingService';

/**
 * Hook to get coach's upcoming sessions with React Query caching
 * @param limit - Maximum number of sessions to fetch
 */
export function useUpcomingCoachSessions(limit: number = 10) {
  const { coachId } = useCoachWorkspaceBasic();

  return useQuery({
    queryKey: COACH_QUERY_KEYS.sessions(coachId || '', 'upcoming'),
    queryFn: async () => {
      if (!coachId) return [];
      return await coachingService.getUpcomingSessions(coachId, limit);
    },
    enabled: !!coachId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to get coach's recent completed sessions
 */
export function useRecentCoachSessions(limit: number = 10) {
  const { coachId } = useCoachWorkspaceBasic();

  return useQuery({
    queryKey: COACH_QUERY_KEYS.sessions(coachId || '', 'recent'),
    queryFn: async () => {
      if (!coachId) return [];
      return await coachingService.getRecentSessions(coachId, limit);
    },
    enabled: !!coachId,
  });
}

/**
 * Hook to get all coach sessions (for sailors viewing as clients)
 */
export function useCoachSessions(status?: 'scheduled' | 'completed' | 'pending') {
  return useQuery({
    queryKey: ['sailor', 'coach-sessions', status],
    queryFn: async () => {
      return await coachingService.getSailorSessions(status);
    },
    retry: 1,
  });
}

/**
 * Hook to get coach's clients/roster
 */
export function useCoachClients(status?: 'active' | 'inactive' | 'completed') {
  const { coachId } = useCoachWorkspaceBasic();

  return useQuery({
    queryKey: COACH_QUERY_KEYS.clients(coachId || '', status),
    queryFn: async () => {
      if (!coachId) return [];
      return await coachingService.getClients(coachId, status);
    },
    enabled: !!coachId,
  });
}

/**
 * Hook to get coach metrics and statistics
 */
export function useCoachMetrics() {
  const { coachId } = useCoachWorkspaceBasic();

  return useQuery({
    queryKey: COACH_QUERY_KEYS.stats(coachId || ''),
    queryFn: async () => {
      if (!coachId) return null;
      return await coachingService.getCoachStats(coachId);
    },
    enabled: !!coachId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get coach earnings summary
 */
export function useCoachEarningsSummary() {
  const { coachId } = useCoachWorkspaceBasic();

  return useQuery<CoachEarningsSummary | null>({
    queryKey: COACH_QUERY_KEYS.earnings(coachId || ''),
    queryFn: async () => {
      if (!coachId) return null;
      return await coachingService.getCoachEarningsSummary(coachId);
    },
    enabled: !!coachId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook to discover coaches (for sailor persona)
 */
export function useCoachSpotlights(filters?: {
  minRating?: number;
  availability?: 'next_7_days' | 'next_30_days' | 'flexible';
  specializations?: string[];
}) {
  return useQuery({
    queryKey: [...COACH_QUERY_KEYS.coachSpotlights(), filters],
    queryFn: async () => {
      return await coachingService.discoverCoaches(filters);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for coaching resources (static content)
 */
export function useCoachResources() {
  return useQuery({
    queryKey: COACH_QUERY_KEYS.resources(),
    queryFn: async () => {
      // Placeholder for future CMS integration
      return [
        {
          id: 'resource-1',
          title: 'Five drills to teach start line time-on-distance intuition',
          category: 'Training Plans',
          readTime: '7 min read',
        },
        {
          id: 'resource-2',
          title: 'Using polar overlays to accelerate heavy-air coaching blocks',
          category: 'Analytics Playbook',
          readTime: '5 min read',
        },
        {
          id: 'resource-3',
          title: 'Checklist: Post-regatta debrief templates that drive retention',
          category: 'Client Success',
          readTime: '4 min read',
        },
      ];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook to create a coaching session
 */
export function useCreateCoachSession() {
  const queryClient = useQueryClient();
  const { coachId } = useCoachWorkspaceBasic();

  return useMutation({
    mutationFn: async (sessionData: Partial<CoachingSession>) => {
      return await coachingService.createSession(sessionData);
    },
    onSuccess: () => {
      if (coachId) {
        queryClient.invalidateQueries({ queryKey: COACH_QUERY_KEYS.sessions(coachId, 'upcoming') });
        queryClient.invalidateQueries({ queryKey: COACH_QUERY_KEYS.stats(coachId) });
      }
    },
  });
}

/**
 * Hook to update a coaching session
 */
export function useUpdateCoachSession() {
  const queryClient = useQueryClient();
  const { coachId } = useCoachWorkspaceBasic();

  return useMutation({
    mutationFn: async ({ sessionId, updates }: { sessionId: string; updates: Partial<CoachingSession> }) => {
      return await coachingService.updateSession(sessionId, updates);
    },
    onSuccess: () => {
      if (coachId) {
        queryClient.invalidateQueries({ queryKey: COACH_QUERY_KEYS.sessions(coachId, 'upcoming') });
        queryClient.invalidateQueries({ queryKey: COACH_QUERY_KEYS.sessions(coachId, 'recent') });
      }
    },
  });
}

/**
 * Hook to complete a coaching session
 */
export function useCompleteCoachSession() {
  const queryClient = useQueryClient();
  const { coachId } = useCoachWorkspaceBasic();

  return useMutation({
    mutationFn: async ({
      sessionId,
      completionData
    }: {
      sessionId: string;
      completionData: {
        sessionNotes?: string;
        homework?: string;
        rating?: number;
      }
    }) => {
      return await coachingService.completeSession(sessionId, completionData);
    },
    onSuccess: () => {
      if (coachId) {
        queryClient.invalidateQueries({ queryKey: COACH_QUERY_KEYS.sessions(coachId, 'upcoming') });
        queryClient.invalidateQueries({ queryKey: COACH_QUERY_KEYS.sessions(coachId, 'recent') });
        queryClient.invalidateQueries({ queryKey: COACH_QUERY_KEYS.stats(coachId) });
      }
    },
  });
}

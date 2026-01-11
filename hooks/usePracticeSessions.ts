/**
 * usePracticeSessions Hook
 *
 * Fetches upcoming and past practice sessions for the current user.
 * Uses TanStack Query for caching and refetching.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { practiceSessionService } from '@/services/PracticeSessionService';
import {
  PracticeSession,
  CreatePracticeSessionInput,
  LogPracticeInput,
} from '@/types/practice';

// Query keys
export const PRACTICE_QUERY_KEYS = {
  all: ['practice-sessions'] as const,
  upcoming: () => [...PRACTICE_QUERY_KEYS.all, 'upcoming'] as const,
  past: () => [...PRACTICE_QUERY_KEYS.all, 'past'] as const,
  session: (id: string) => [...PRACTICE_QUERY_KEYS.all, id] as const,
};

interface UsePracticeSessionsOptions {
  upcomingLimit?: number;
  pastLimit?: number;
}

interface UsePracticeSessionsReturn {
  // Data
  upcomingSessions: PracticeSession[];
  pastSessions: PracticeSession[];

  // Loading states
  isLoading: boolean;
  isLoadingUpcoming: boolean;
  isLoadingPast: boolean;
  isCreating: boolean;

  // Errors
  error: Error | null;
  upcomingError: Error | null;
  pastError: Error | null;

  // Actions
  createSession: (input: CreatePracticeSessionInput) => Promise<PracticeSession>;
  logPractice: (input: LogPracticeInput) => Promise<PracticeSession>;
  refreshUpcoming: () => void;
  refreshPast: () => void;
  refreshAll: () => void;
}

/**
 * Hook to fetch and manage practice sessions lists
 */
export function usePracticeSessions(
  options: UsePracticeSessionsOptions = {}
): UsePracticeSessionsReturn {
  const { upcomingLimit = 10, pastLimit = 20 } = options;
  const queryClient = useQueryClient();

  // Fetch upcoming sessions
  const {
    data: upcomingSessions = [],
    isLoading: isLoadingUpcoming,
    error: upcomingError,
    refetch: refreshUpcoming,
  } = useQuery({
    queryKey: PRACTICE_QUERY_KEYS.upcoming(),
    queryFn: () => practiceSessionService.getUpcomingSessions(upcomingLimit),
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch past sessions
  const {
    data: pastSessions = [],
    isLoading: isLoadingPast,
    error: pastError,
    refetch: refreshPast,
  } = useQuery({
    queryKey: PRACTICE_QUERY_KEYS.past(),
    queryFn: () => practiceSessionService.getPastSessions(pastLimit),
    staleTime: 60 * 1000, // 1 minute
  });

  // Create session mutation
  const createMutation = useMutation({
    mutationFn: (input: CreatePracticeSessionInput) =>
      practiceSessionService.createSession(input),
    onSuccess: (newSession) => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: PRACTICE_QUERY_KEYS.upcoming() });
      // Add to cache immediately
      queryClient.setQueryData<PracticeSession[]>(
        PRACTICE_QUERY_KEYS.upcoming(),
        (old = []) => [newSession, ...old]
      );
    },
  });

  // Log practice mutation
  const logMutation = useMutation({
    mutationFn: (input: LogPracticeInput) => practiceSessionService.logPractice(input),
    onSuccess: (newSession) => {
      // Invalidate past sessions
      queryClient.invalidateQueries({ queryKey: PRACTICE_QUERY_KEYS.past() });
      // Add to cache immediately
      queryClient.setQueryData<PracticeSession[]>(
        PRACTICE_QUERY_KEYS.past(),
        (old = []) => [newSession, ...old]
      );
    },
  });

  // Refresh all sessions
  const refreshAll = () => {
    refreshUpcoming();
    refreshPast();
  };

  return {
    // Data
    upcomingSessions,
    pastSessions,

    // Loading states
    isLoading: isLoadingUpcoming || isLoadingPast,
    isLoadingUpcoming,
    isLoadingPast,
    isCreating: createMutation.isPending || logMutation.isPending,

    // Errors
    error: (upcomingError || pastError) as Error | null,
    upcomingError: upcomingError as Error | null,
    pastError: pastError as Error | null,

    // Actions
    createSession: createMutation.mutateAsync,
    logPractice: logMutation.mutateAsync,
    refreshUpcoming: () => refreshUpcoming(),
    refreshPast: () => refreshPast(),
    refreshAll,
  };
}

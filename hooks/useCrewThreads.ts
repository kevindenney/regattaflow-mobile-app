/**
 * useCrewThreads Hook
 *
 * Fetches and manages the user's crew threads.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import {
  CrewThreadService,
  CrewThread,
  CreateThreadInput,
  ThreadType,
} from '@/services/CrewThreadService';

export type { CrewThread, ThreadType };
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useCrewThreads');

export const CREW_THREADS_QUERY_KEY = 'crew-threads';
export const CREW_THREAD_UNREAD_COUNT_KEY = 'crew-threads-unread-count';

interface UseCrewThreadsReturn {
  threads: CrewThread[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createThread: (input: CreateThreadInput) => Promise<CrewThread | null>;
  isCreating: boolean;
  updateThread: (threadId: string, updates: { name?: string; avatarEmoji?: string }) => Promise<boolean>;
  deleteThread: (threadId: string) => Promise<boolean>;
  leaveThread: (threadId: string) => Promise<boolean>;
}

export function useCrewThreads(): UseCrewThreadsReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch threads
  const {
    data: threads = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [CREW_THREADS_QUERY_KEY, user?.id],
    queryFn: () => CrewThreadService.getMyThreads(),
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Create thread mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateThreadInput) => CrewThreadService.createThread(input),
    onSuccess: (newThread) => {
      if (newThread) {
        queryClient.setQueryData(
          [CREW_THREADS_QUERY_KEY, user?.id],
          (old: CrewThread[] | undefined) => [newThread, ...(old || [])]
        );
      }
    },
  });

  // Update thread mutation
  const updateMutation = useMutation({
    mutationFn: ({
      threadId,
      updates,
    }: {
      threadId: string;
      updates: { name?: string; avatarEmoji?: string };
    }) => CrewThreadService.updateThread(threadId, updates),
    onSuccess: (success, { threadId, updates }) => {
      if (success) {
        queryClient.setQueryData(
          [CREW_THREADS_QUERY_KEY, user?.id],
          (old: CrewThread[] | undefined) =>
            (old || []).map((t) =>
              t.id === threadId ? { ...t, ...updates } : t
            )
        );
      }
    },
  });

  // Delete thread mutation
  const deleteMutation = useMutation({
    mutationFn: (threadId: string) => CrewThreadService.deleteThread(threadId),
    onSuccess: (success, threadId) => {
      if (success) {
        queryClient.setQueryData(
          [CREW_THREADS_QUERY_KEY, user?.id],
          (old: CrewThread[] | undefined) =>
            (old || []).filter((t) => t.id !== threadId)
        );
      }
    },
  });

  // Leave thread mutation
  const leaveMutation = useMutation({
    mutationFn: (threadId: string) => CrewThreadService.leaveThread(threadId),
    onSuccess: (success, threadId) => {
      if (success) {
        queryClient.setQueryData(
          [CREW_THREADS_QUERY_KEY, user?.id],
          (old: CrewThread[] | undefined) =>
            (old || []).filter((t) => t.id !== threadId)
        );
      }
    },
  });

  return {
    threads,
    isLoading,
    error: error instanceof Error ? error : null,
    refetch,
    createThread: async (input: CreateThreadInput) => {
      const result = await createMutation.mutateAsync(input);
      return result;
    },
    isCreating: createMutation.isPending,
    updateThread: async (threadId: string, updates) => {
      return updateMutation.mutateAsync({ threadId, updates });
    },
    deleteThread: async (threadId: string) => {
      return deleteMutation.mutateAsync(threadId);
    },
    leaveThread: async (threadId: string) => {
      return leaveMutation.mutateAsync(threadId);
    },
  };
}

/**
 * Hook to get total unread message count across all threads
 */
export function useCrewThreadsUnreadCount(): {
  unreadCount: number;
  isLoading: boolean;
  refetch: () => void;
} {
  const { user } = useAuth();

  const {
    data: unreadCount = 0,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [CREW_THREAD_UNREAD_COUNT_KEY, user?.id],
    queryFn: () => CrewThreadService.getTotalUnreadCount(),
    enabled: !!user?.id,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Poll every minute for new messages
  });

  return { unreadCount, isLoading, refetch };
}

export default useCrewThreads;

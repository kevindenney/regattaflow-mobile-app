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
  const userId = user?.id;
  const queryClient = useQueryClient();

  // Fetch threads
  const {
    data: threads = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [CREW_THREADS_QUERY_KEY, userId],
    queryFn: () => CrewThreadService.getMyThreads(),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  // Create thread mutation
  const createMutation = useMutation({
    mutationFn: ({ input }: { input: CreateThreadInput; userId: string }) =>
      CrewThreadService.createThread(input),
    onSuccess: (newThread, variables) => {
      if (newThread) {
        queryClient.setQueryData(
          [CREW_THREADS_QUERY_KEY, variables.userId],
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
      userId: string;
    }) => CrewThreadService.updateThread(threadId, updates),
    onSuccess: (success, { threadId, updates, userId }) => {
      if (success) {
        queryClient.setQueryData(
          [CREW_THREADS_QUERY_KEY, userId],
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
    mutationFn: ({ threadId }: { threadId: string; userId: string }) =>
      CrewThreadService.deleteThread(threadId),
    onSuccess: (success, variables) => {
      if (success) {
        queryClient.setQueryData(
          [CREW_THREADS_QUERY_KEY, variables.userId],
          (old: CrewThread[] | undefined) =>
            (old || []).filter((t) => t.id !== variables.threadId)
        );
      }
    },
  });

  // Leave thread mutation
  const leaveMutation = useMutation({
    mutationFn: ({ threadId }: { threadId: string; userId: string }) =>
      CrewThreadService.leaveThread(threadId),
    onSuccess: (success, variables) => {
      if (success) {
        queryClient.setQueryData(
          [CREW_THREADS_QUERY_KEY, variables.userId],
          (old: CrewThread[] | undefined) =>
            (old || []).filter((t) => t.id !== variables.threadId)
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
      if (!userId) return null;
      const result = await createMutation.mutateAsync({ input, userId });
      return result;
    },
    isCreating: createMutation.isPending,
    updateThread: async (threadId: string, updates) => {
      if (!userId) return false;
      return updateMutation.mutateAsync({ threadId, updates, userId });
    },
    deleteThread: async (threadId: string) => {
      if (!userId) return false;
      return deleteMutation.mutateAsync({ threadId, userId });
    },
    leaveThread: async (threadId: string) => {
      if (!userId) return false;
      return leaveMutation.mutateAsync({ threadId, userId });
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
  const userId = user?.id;

  const {
    data: unreadCount = 0,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [CREW_THREAD_UNREAD_COUNT_KEY, userId],
    queryFn: () => CrewThreadService.getTotalUnreadCount(),
    enabled: !!userId,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Poll every minute for new messages
  });

  return { unreadCount, isLoading, refetch };
}

export default useCrewThreads;

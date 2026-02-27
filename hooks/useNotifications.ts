/**
 * useNotifications - Hook for social notifications
 */

import { useCallback, useEffect, useRef } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { NotificationService, type SocialNotification } from '@/services/NotificationService';

const PAGE_SIZE = 20;

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const subscriptionRunIdRef = useRef(0);
  const activeUserIdRef = useRef<string | null>(user?.id ?? null);

  useEffect(() => {
    activeUserIdRef.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    return () => {
      subscriptionRunIdRef.current += 1;
    };
  }, []);

  // Fetch notifications with pagination
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['social-notifications', user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      if (!user?.id) return { notifications: [], hasMore: false };
      return NotificationService.getNotifications(user.id, {
        limit: PAGE_SIZE,
        offset: pageParam,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Subscribe to realtime notifications via centralized NotificationService
  useEffect(() => {
    if (!user?.id) return;
    const runId = ++subscriptionRunIdRef.current;
    const targetUserId = user.id;
    const canCommit = () =>
      runId === subscriptionRunIdRef.current && activeUserIdRef.current === targetUserId;

    const unsubscribe = NotificationService.subscribeToNotifications(
      user.id,
      () => {
        if (!canCommit()) return;
        queryClient.invalidateQueries({
          queryKey: ['social-notifications', targetUserId],
        });
        queryClient.invalidateQueries({
          queryKey: ['unread-notification-count', targetUserId],
        });
      }
    );

    return () => {
      if (subscriptionRunIdRef.current === runId) {
        subscriptionRunIdRef.current += 1;
      }
      unsubscribe();
    };
  }, [user?.id, queryClient]);

  // Flatten pages
  const notifications: SocialNotification[] =
    data?.pages.flatMap((page) => page.notifications) || [];

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: ({ notificationId, userId }: { notificationId: string; userId: string }) => {
      return NotificationService.markAsRead(userId, notificationId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['social-notifications', variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['unread-notification-count', variables.userId],
      });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) => {
      return NotificationService.markAllAsRead(userId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['social-notifications', variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: ['unread-notification-count', variables.userId],
      });
    },
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: ({ notificationId, userId }: { notificationId: string; userId: string }) => {
      return NotificationService.deleteNotification(userId, notificationId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['social-notifications', variables.userId],
      });
    },
  });

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      await markReadMutation.mutateAsync({ notificationId, userId: user.id });
    },
    [markReadMutation, user?.id]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) throw new Error('Not authenticated');
    await markAllReadMutation.mutateAsync({ userId: user.id });
  }, [markAllReadMutation, user?.id]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      await deleteMutation.mutateAsync({ notificationId, userId: user.id });
    },
    [deleteMutation, user?.id]
  );

  return {
    notifications,
    isLoading,
    error,
    hasMore: hasNextPage || false,
    loadMore,
    isLoadingMore: isFetchingNextPage,
    refresh: refetch,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}

/**
 * Hook for unread notification count only
 */
export function useUnreadNotificationCount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const subscriptionRunIdRef = useRef(0);
  const activeUserIdRef = useRef<string | null>(user?.id ?? null);

  useEffect(() => {
    activeUserIdRef.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    return () => {
      subscriptionRunIdRef.current += 1;
    };
  }, []);

  const { data: unreadCount = 0, isLoading } = useQuery({
    queryKey: ['unread-notification-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      return NotificationService.getUnreadCount(user.id);
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  // Subscribe to realtime count updates
  useEffect(() => {
    if (!user?.id) return;
    const runId = ++subscriptionRunIdRef.current;
    const targetUserId = user.id;
    const canCommit = () =>
      runId === subscriptionRunIdRef.current && activeUserIdRef.current === targetUserId;

    const unsubscribe = NotificationService.subscribeToNotifications(
      user.id,
      () => {
        if (!canCommit()) return;
        queryClient.invalidateQueries({
          queryKey: ['unread-notification-count', targetUserId],
        });
      }
    );

    return () => {
      if (subscriptionRunIdRef.current === runId) {
        subscriptionRunIdRef.current += 1;
      }
      unsubscribe();
    };
  }, [user?.id, queryClient]);

  return {
    unreadCount,
    isLoading,
  };
}

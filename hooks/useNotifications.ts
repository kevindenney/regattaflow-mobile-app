/**
 * useNotifications - Hook for social notifications
 */

import { useCallback, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { NotificationService, type SocialNotification } from '@/services/NotificationService';
import { supabase } from '@/services/supabase';

const PAGE_SIZE = 20;

export function useNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'social_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Invalidate and refetch on new notification
          queryClient.invalidateQueries({
            queryKey: ['social-notifications', user.id],
          });
          queryClient.invalidateQueries({
            queryKey: ['unread-notification-count', user.id],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Flatten pages
  const notifications: SocialNotification[] =
    data?.pages.flatMap((page) => page.notifications) || [];

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      return NotificationService.markAsRead(user.id, notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['social-notifications', user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['unread-notification-count', user?.id],
      });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error('Not authenticated');
      return NotificationService.markAllAsRead(user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['social-notifications', user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['unread-notification-count', user?.id],
      });
    },
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: (notificationId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      return NotificationService.deleteNotification(user.id, notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['social-notifications', user?.id],
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
      await markReadMutation.mutateAsync(notificationId);
    },
    [markReadMutation]
  );

  const markAllAsRead = useCallback(async () => {
    await markAllReadMutation.mutateAsync();
  }, [markAllReadMutation]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      await deleteMutation.mutateAsync(notificationId);
    },
    [deleteMutation]
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

  const { data: unreadCount = 0, isLoading } = useInfiniteQuery({
    queryKey: ['unread-notification-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      return NotificationService.getUnreadCount(user.id);
    },
    initialPageParam: 0,
    getNextPageParam: () => undefined,
    enabled: !!user?.id,
    staleTime: 30 * 1000,
    select: (data) => data.pages[0] || 0,
  });

  // Subscribe to realtime count updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notification-count:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'social_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ['unread-notification-count', user.id],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return {
    unreadCount,
    isLoading,
  };
}

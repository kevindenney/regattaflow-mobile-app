/**
 * useFollowersList - Hook for fetching followers or following list
 */

import { useState, useCallback, useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { SailorProfileService } from '@/services/SailorProfileService';
import { CrewFinderService } from '@/services/CrewFinderService';

const PAGE_SIZE = 50;

interface UserListItem {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  avatarEmoji?: string;
  avatarColor?: string;
  isFollowing: boolean;
}

export function useFollowersList(
  userId: string,
  type: 'followers' | 'following'
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['user-list', type, userId],
    queryFn: async ({ pageParam = 0 }) => {
      if (type === 'followers') {
        return SailorProfileService.getFollowers(userId, user?.id, {
          limit: PAGE_SIZE,
          offset: pageParam,
        });
      } else {
        return SailorProfileService.getFollowing(userId, user?.id, {
          limit: PAGE_SIZE,
          offset: pageParam,
        });
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Flatten pages and update followed IDs
  const users: UserListItem[] =
    data?.pages.flatMap((page) => page.users) || [];

  useEffect(() => {
    const ids = new Set(
      users.filter((u) => u.isFollowing).map((u) => u.userId)
    );
    setFollowedIds(ids);
  }, [users]);

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      await CrewFinderService.followUser(user.id, targetUserId);
      return targetUserId;
    },
    onSuccess: (targetUserId) => {
      setFollowedIds((prev) => new Set([...prev, targetUserId]));
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] });
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      await CrewFinderService.unfollowUser(user.id, targetUserId);
      return targetUserId;
    },
    onSuccess: (targetUserId) => {
      setFollowedIds((prev) => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] });
    },
  });

  // Toggle follow
  const toggleFollow = useCallback(
    async (targetUserId: string) => {
      if (followedIds.has(targetUserId)) {
        await unfollowMutation.mutateAsync(targetUserId);
      } else {
        await followMutation.mutateAsync(targetUserId);
      }
    },
    [followedIds, followMutation, unfollowMutation]
  );

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    users,
    isLoading,
    error,
    hasMore: hasNextPage || false,
    loadMore,
    isLoadingMore: isFetchingNextPage,
    refresh,
    toggleFollow,
    isFollowing: (uid: string) => followedIds.has(uid),
  };
}

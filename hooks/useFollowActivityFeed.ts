/**
 * useFollowActivityFeed Hook
 *
 * Fetches activity feed data from followed sailors and clubs.
 * Returns race activity (upcoming races, race results, insights) from followed users.
 */

import { useCallback, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { CrewFinderService, PublicRacePreview } from '@/services/CrewFinderService';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useFollowActivityFeed');
const PAGE_SIZE = 20;

/**
 * Activity item in the feed
 */
export interface ActivityItem {
  id: string;
  type: 'race_upcoming' | 'race_result' | 'club_post';
  timestamp: string;
  // For race activities
  race?: PublicRacePreview;
  // For club posts (future)
  clubPost?: {
    id: string;
    clubId: string;
    clubName: string;
    title: string;
    content: string;
    createdAt: string;
  };
}

/**
 * Feed state
 */
export interface FollowActivityFeedResult {
  /** Activity items in the feed */
  items: ActivityItem[];
  /** Whether initial data is loading */
  isLoading: boolean;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Whether currently loading more items */
  isLoadingMore: boolean;
  /** Load the next page of items */
  loadMore: () => void;
  /** Refresh the feed */
  refresh: () => Promise<void>;
  /** Error message if any */
  error: string | null;
  /** Number of users being followed */
  followingCount: number;
  /** Whether user follows anyone */
  hasFollowing: boolean;
}

/**
 * Query keys for caching
 */
export const followActivityFeedKeys = {
  all: ['follow-activity-feed'] as const,
  feed: (userId: string) => [...followActivityFeedKeys.all, 'feed', userId] as const,
};

/**
 * Hook to fetch activity feed from followed users
 */
export function useFollowActivityFeed(): FollowActivityFeedResult {
  const { user, isGuest } = useAuth();
  const queryClient = useQueryClient();

  const userId = user?.id;

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: followActivityFeedKeys.feed(userId ?? 'anonymous'),
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId || isGuest) {
        return {
          items: [],
          hasMore: false,
          followingCount: 0,
        };
      }

      logger.info('[useFollowActivityFeed] Fetching page', { userId, offset: pageParam });

      // Get races from followed users
      const result = await CrewFinderService.getFollowedUsersRaces({
        userId,
        limit: PAGE_SIZE,
        offset: pageParam,
      });

      // Transform races to activity items
      const items: ActivityItem[] = result.races.map((race) => ({
        id: `race-${race.id}`,
        type: race.isPast ? 'race_result' : 'race_upcoming',
        timestamp: race.createdAt,
        race,
      }));

      return {
        items,
        hasMore: result.hasMore,
        followingCount: result.followingCount,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
    enabled: !!userId && !isGuest,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Flatten all pages into a single list
  const items = useMemo<ActivityItem[]>(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.items);
  }, [data]);

  // Get following count from first page
  const followingCount = data?.pages[0]?.followingCount ?? 0;

  // Load more handler
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Refresh handler
  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    items,
    isLoading,
    hasMore: hasNextPage ?? false,
    isLoadingMore: isFetchingNextPage,
    loadMore,
    refresh,
    error: error ? (error as Error).message : null,
    followingCount,
    hasFollowing: followingCount > 0,
  };
}

export default useFollowActivityFeed;

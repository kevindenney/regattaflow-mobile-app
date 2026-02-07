/**
 * useWatchFeed Hook
 *
 * Merges the existing follow activity feed (race items) with follower posts
 * into a single, time-sorted feed for the Watch tab.
 */

import { useMemo } from 'react';
import { useFollowActivityFeed, type ActivityItem } from './useFollowActivityFeed';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { FollowerPostService, type FollowerPost } from '@/services/FollowerPostService';
import { CrewFinderService } from '@/services/CrewFinderService';

// =============================================================================
// TYPES
// =============================================================================

export interface WatchFeedItem {
  id: string;
  type: 'race_upcoming' | 'race_result' | 'follower_post';
  timestamp: string;
  /** Present for race-type items */
  race?: ActivityItem['race'];
  /** Present for follower_post items */
  post?: FollowerPost;
}

// =============================================================================
// QUERY KEYS
// =============================================================================

export const watchFeedKeys = {
  all: ['watch-feed'] as const,
  posts: (userId: string) => [...watchFeedKeys.all, 'posts', userId] as const,
};

const POSTS_PAGE_SIZE = 20;

// =============================================================================
// HOOK
// =============================================================================

export function useWatchFeed() {
  const { user, isGuest } = useAuth();
  const userId = user?.id;

  // 1. Existing race activity feed
  const raceFeed = useFollowActivityFeed();

  // 2. Follower posts feed
  const {
    data: postsData,
    isLoading: postsLoading,
    fetchNextPage: fetchMorePosts,
    hasNextPage: hasMorePosts,
    isFetchingNextPage: isFetchingMorePosts,
    refetch: refetchPosts,
  } = useInfiniteQuery({
    queryKey: watchFeedKeys.posts(userId ?? 'anonymous'),
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId || isGuest) {
        return { posts: [], hasMore: false };
      }

      // Get the IDs of users this person follows
      const followingIds = await CrewFinderService.getFollowingIds(userId);
      // Include the user's own posts
      const allUserIds = [...followingIds, userId];

      return FollowerPostService.getFollowerPosts(allUserIds, POSTS_PAGE_SIZE, pageParam);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * POSTS_PAGE_SIZE;
    },
    initialPageParam: 0,
    enabled: !!userId && !isGuest,
    staleTime: 5 * 60 * 1000,
  });

  // Flatten posts pages
  const followerPosts = useMemo<FollowerPost[]>(() => {
    if (!postsData?.pages) return [];
    return postsData.pages.flatMap((page) => page.posts);
  }, [postsData]);

  // 3. Merge both sources into a single sorted list
  const items = useMemo<WatchFeedItem[]>(() => {
    const raceItems: WatchFeedItem[] = raceFeed.items.map((item) => ({
      id: item.id,
      type: item.type as 'race_upcoming' | 'race_result',
      timestamp: item.timestamp,
      race: item.race,
    }));

    const postItems: WatchFeedItem[] = followerPosts.map((post) => ({
      id: `post-${post.id}`,
      type: 'follower_post' as const,
      timestamp: post.createdAt,
      post,
    }));

    // Merge and sort descending by timestamp
    return [...raceItems, ...postItems].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [raceFeed.items, followerPosts]);

  // Combined loading state
  const isLoading = raceFeed.isLoading || postsLoading;

  // Refresh all sources
  const refresh = async () => {
    await Promise.all([raceFeed.refresh(), refetchPosts()]);
  };

  return {
    items,
    isLoading,
    error: raceFeed.error,
    hasFollowing: raceFeed.hasFollowing,
    followingCount: raceFeed.followingCount,
    refresh,
    // Race feed pagination
    hasMoreRaces: raceFeed.hasMore,
    loadMoreRaces: raceFeed.loadMore,
    isLoadingMoreRaces: raceFeed.isLoadingMore,
    // Post feed pagination
    hasMorePosts: hasMorePosts ?? false,
    loadMorePosts: () => {
      if (hasMorePosts && !isFetchingMorePosts) fetchMorePosts();
    },
    isLoadingMorePosts: isFetchingMorePosts,
  };
}

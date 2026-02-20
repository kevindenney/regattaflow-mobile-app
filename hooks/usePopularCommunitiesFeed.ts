/**
 * usePopularCommunitiesFeed Hook
 *
 * Composes usePopularCommunities to get top community IDs, then calls
 * CommunityFeedService.getJoinedCommunitiesFeed() via useInfiniteQuery
 * to fetch popular community posts for users who haven't joined any communities.
 */

import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { usePopularCommunities } from '@/hooks/useCommunities';
import { CommunityFeedService } from '@/services/venue/CommunityFeedService';
import type { FeedSortType, PostType } from '@/types/community-feed';

const PAGE_SIZE = 20;

export const popularCommunitiesFeedKeys = {
  all: ['popular-communities-feed'] as const,
  feed: (communityIds: string[], filters?: {
    sort?: FeedSortType;
    postType?: PostType;
  }) => [...popularCommunitiesFeedKeys.all, 'feed', communityIds, filters] as const,
};

export function usePopularCommunitiesFeed(options: {
  sort?: FeedSortType;
  postType?: PostType;
  enabled?: boolean;
} = {}) {
  const { sort = 'hot', postType, enabled = true } = options;

  const { data: popularCommunities, isLoading: isLoadingCommunities } =
    usePopularCommunities(10);

  const communityIds = useMemo(
    () => popularCommunities?.map((c) => c.id) ?? [],
    [popularCommunities],
  );

  const feedQuery = useInfiniteQuery({
    queryKey: popularCommunitiesFeedKeys.feed(communityIds, { sort, postType }),
    queryFn: async ({ pageParam = 0 }) => {
      return CommunityFeedService.getJoinedCommunitiesFeed({
        communityIds,
        sort,
        postType,
        page: pageParam,
        limit: PAGE_SIZE,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: enabled && communityIds.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  const posts = useMemo(() => {
    if (!feedQuery.data?.pages) return [];
    return feedQuery.data.pages.flatMap((page) => page.data);
  }, [feedQuery.data?.pages]);

  return {
    posts,
    isLoading: isLoadingCommunities || feedQuery.isLoading,
    isLoadingCommunities,
    isFetchingNextPage: feedQuery.isFetchingNextPage,
    hasNextPage: feedQuery.hasNextPage ?? false,
    fetchNextPage: feedQuery.fetchNextPage,
    refetch: feedQuery.refetch,
    error: feedQuery.error,
  };
}

export default usePopularCommunitiesFeed;

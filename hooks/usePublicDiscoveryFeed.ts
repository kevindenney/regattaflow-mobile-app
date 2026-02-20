/**
 * usePublicDiscoveryFeed Hook
 *
 * Wraps CrewFinderService.getPublicRaces() in useInfiniteQuery for the
 * discovery feed shown to guests and users who haven't followed anyone.
 * No auth required — always enabled.
 */

import { useCallback, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { CrewFinderService, PublicRacePreview } from '@/services/CrewFinderService';
import { useAuth } from '@/providers/AuthProvider';

const PAGE_SIZE = 20;

export const publicDiscoveryFeedKeys = {
  all: ['public-discovery-feed'] as const,
  feed: () => [...publicDiscoveryFeedKeys.all, 'feed'] as const,
};

export interface PublicDiscoveryFeedResult {
  races: PublicRacePreview[];
  isLoading: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  refresh: () => Promise<void>;
  error: string | null;
}

export function usePublicDiscoveryFeed(): PublicDiscoveryFeedResult {
  const { user } = useAuth();

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: publicDiscoveryFeedKeys.feed(),
    queryFn: async ({ pageParam = 0 }) => {
      return CrewFinderService.getPublicRaces({
        limit: PAGE_SIZE,
        offset: pageParam,
        excludeUserId: user?.id,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const races = useMemo<PublicRacePreview[]>(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.races);
  }, [data]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    races,
    isLoading,
    hasMore: hasNextPage ?? false,
    isLoadingMore: isFetchingNextPage,
    loadMore,
    refresh,
    error: error ? (error as Error).message : null,
  };
}

export default usePublicDiscoveryFeed;

/**
 * useSailorRaceHistory - Hook for fetching sailor's race history (paginated)
 */

import { useCallback, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  SailorProfileService,
  type SailorRaceSummary,
} from '@/services/SailorProfileService';
import { createLogger } from '@/lib/utils/logger';

const PAGE_SIZE = 10;
const logger = createLogger('useSailorRaceHistory');

export function useSailorRaceHistory(
  userId: string,
  options?: { pastOnly?: boolean; upcomingOnly?: boolean }
) {
  const { pastOnly, upcomingOnly } = options || {};
  const historyFetchRunRef = useRef(0);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['sailor-race-history', userId, pastOnly, upcomingOnly],
    queryFn: async ({ pageParam = 0 }) => {
      const run = ++historyFetchRunRef.current;
      logger.info('[diagnostic] race history query start', {
        run,
        userId,
        pageParam,
        pastOnly: !!pastOnly,
        upcomingOnly: !!upcomingOnly,
      });
      const result = await SailorProfileService.getRaceHistory(userId, {
        limit: PAGE_SIZE,
        offset: pageParam,
        pastOnly,
        upcomingOnly,
      });
      logger.info('[diagnostic] race history query result', {
        run,
        userId,
        pageParam,
        raceCount: result.races.length,
        hasMore: result.hasMore,
      });
      return result;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    initialPageParam: 0,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Flatten pages to single array
  const races: SailorRaceSummary[] =
    data?.pages.flatMap((page) => page.races) || [];

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
    error,
    hasMore: hasNextPage || false,
    loadMore,
    isLoadingMore: isFetchingNextPage,
    refresh,
  };
}

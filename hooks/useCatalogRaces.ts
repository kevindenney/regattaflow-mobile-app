/**
 * useCatalogRaces — React Query hooks for the public catalog races
 *
 * Provides hooks for browsing, searching, following, and fetching
 * discussion counts for catalog races.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  useQuery,
} from '@tanstack/react-query';
import { CatalogRaceService } from '@/services/CatalogRaceService';
import { useAuth } from '@/providers/AuthProvider';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const catalogRaceKeys = {
  all: ['catalog-races'] as const,
  list: () => [...catalogRaceKeys.all, 'list'] as const,
  featured: () => [...catalogRaceKeys.all, 'featured'] as const,
  search: (query: string) => [...catalogRaceKeys.all, 'search', query] as const,
  detail: (slug: string) => [...catalogRaceKeys.all, 'detail', slug] as const,
  detailById: (id: string) => [...catalogRaceKeys.all, 'detail-id', id] as const,
  byVenue: (venueId: string) => [...catalogRaceKeys.all, 'venue', venueId] as const,
  followed: () => [...catalogRaceKeys.all, 'followed'] as const,
  discussionCounts: (ids: string[]) => [...catalogRaceKeys.all, 'discussion-counts', ids] as const,
};

// ============================================================================
// BROWSE & SEARCH
// ============================================================================

/**
 * Get all catalog races
 */
export function useCatalogRaces() {
  return useQuery({
    queryKey: catalogRaceKeys.list(),
    queryFn: () => CatalogRaceService.getAllRaces(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get featured catalog races
 */
export function useFeaturedCatalogRaces() {
  return useQuery({
    queryKey: catalogRaceKeys.featured(),
    queryFn: () => CatalogRaceService.getFeaturedRaces(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Search catalog races
 */
export function useSearchCatalogRaces(query: string) {
  return useQuery({
    queryKey: catalogRaceKeys.search(query),
    queryFn: () => CatalogRaceService.searchRaces(query),
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 60 * 2,
  });
}

// ============================================================================
// DETAIL
// ============================================================================

/**
 * Get a single catalog race by slug
 */
export function useCatalogRaceBySlug(slug: string, enabled = true) {
  return useQuery({
    queryKey: catalogRaceKeys.detail(slug),
    queryFn: () => CatalogRaceService.getRaceBySlug(slug),
    enabled: enabled && !!slug,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Get a single catalog race by ID
 */
export function useCatalogRaceById(id: string, enabled = true) {
  return useQuery({
    queryKey: catalogRaceKeys.detailById(id),
    queryFn: () => CatalogRaceService.getRaceById(id),
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Get races by venue
 */
export function useCatalogRacesByVenue(venueId: string) {
  return useQuery({
    queryKey: catalogRaceKeys.byVenue(venueId),
    queryFn: () => CatalogRaceService.getRacesByVenue(venueId),
    enabled: !!venueId,
    staleTime: 1000 * 60 * 5,
  });
}

// ============================================================================
// SAVED / FOLLOWED RACES (mirrors useSavedVenues pattern)
// ============================================================================

export interface UseSavedCatalogRacesReturn {
  followedRaceIds: Set<string>;
  isLoading: boolean;
  error: string | null;
  followRace: (raceId: string) => Promise<void>;
  unfollowRace: (raceId: string) => Promise<void>;
  isRaceFollowed: (raceId: string) => boolean;
  refreshFollowed: () => Promise<void>;
}

export function useSavedCatalogRaces(): UseSavedCatalogRacesReturn {
  const { user } = useAuth();
  const [followedRaceIds, setFollowedRaceIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const fetchRunIdRef = useRef(0);
  const activeUserIdRef = useRef<string | null>(user?.id ?? null);

  useEffect(() => {
    activeUserIdRef.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      fetchRunIdRef.current += 1;
    };
  }, []);

  const fetchFollowed = useCallback(async () => {
    const runId = ++fetchRunIdRef.current;
    const targetUserId = user?.id ?? null;
    const canCommit = () =>
      isMountedRef.current &&
      runId === fetchRunIdRef.current &&
      activeUserIdRef.current === targetUserId;

    if (!targetUserId) {
      if (!canCommit()) return;
      setFollowedRaceIds(new Set());
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!canCommit()) return;
    setIsLoading(true);
    setError(null);
    try {
      const ids = await CatalogRaceService.getFollowedRaceIds();
      if (!canCommit()) return;
      setFollowedRaceIds(ids);
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'message' in err
          ? (err as { message: string }).message
          : 'Failed to fetch followed races';
      if (!canCommit()) return;
      setError(message);
    } finally {
      if (!canCommit()) return;
      setIsLoading(false);
    }
  }, [user]);

  const followRace = useCallback(async (raceId: string) => {
    const targetUserId = user?.id ?? null;
    if (!targetUserId) throw new Error('Must be logged in');
    await CatalogRaceService.followRace(raceId);
    if (!isMountedRef.current || activeUserIdRef.current !== targetUserId) return;
    await fetchFollowed();
  }, [user, fetchFollowed]);

  const unfollowRace = useCallback(async (raceId: string) => {
    const targetUserId = user?.id ?? null;
    if (!targetUserId) throw new Error('Must be logged in');
    await CatalogRaceService.unfollowRace(raceId);
    if (!isMountedRef.current || activeUserIdRef.current !== targetUserId) return;
    await fetchFollowed();
  }, [user, fetchFollowed]);

  const isRaceFollowed = useCallback((raceId: string) => {
    return followedRaceIds.has(raceId);
  }, [followedRaceIds]);

  useEffect(() => {
    void fetchFollowed();
  }, [fetchFollowed]);

  return {
    followedRaceIds,
    isLoading,
    error,
    followRace,
    unfollowRace,
    isRaceFollowed,
    refreshFollowed: fetchFollowed,
  };
}

// ============================================================================
// DISCUSSION COUNTS
// ============================================================================

/**
 * Batch fetch discussion counts for a set of race IDs
 */
export function useRaceDiscussionCounts(raceIds: string[]) {
  return useQuery({
    queryKey: catalogRaceKeys.discussionCounts(raceIds),
    queryFn: () => CatalogRaceService.getDiscussionCounts(raceIds),
    enabled: raceIds.length > 0,
    staleTime: 1000 * 60 * 2,
  });
}

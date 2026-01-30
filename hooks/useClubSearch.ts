/**
 * useClubSearch - Hook for searching and filtering clubs
 *
 * Provides:
 * - Club search with query
 * - Filter by location/boat class
 * - Join/leave functionality
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { ClubDiscoveryService } from '@/services/ClubDiscoveryService';
import type { ClubSearchResult } from '@/components/search/ClubSearchRow';

interface UseClubSearchOptions {
  query?: string;
  filter?: string | null;
  location?: string;
  countryCode?: string;
  boatClassId?: string;
  limit?: number;
}

export function useClubSearch(options: UseClubSearchOptions = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { query = '', filter, location, countryCode, boatClassId, limit = 50 } = options;
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());

  // Fetch clubs
  const {
    data,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ['club-search', query, filter, location, countryCode, boatClassId],
    queryFn: async () => {
      // Use ClubDiscoveryService to search clubs
      const clubs = await ClubDiscoveryService.searchClubs({
        query: query || undefined,
        region: location,
        countryCode,
        boatClassId,
        limit,
      });
      return clubs;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch user's joined clubs to check membership
  const { data: userClubs } = useQuery({
    queryKey: ['user-clubs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return ClubDiscoveryService.getUserClubs(user.id);
    },
    enabled: !!user?.id,
  });

  // Update joined IDs when user clubs load
  useEffect(() => {
    if (userClubs) {
      setJoinedIds(new Set(userClubs.map((c: any) => c.id)));
    }
  }, [userClubs]);

  // Transform to ClubSearchResult format
  const clubs: ClubSearchResult[] = useMemo(() => {
    if (!data) return [];

    return data.map((club: any) => ({
      id: club.id,
      name: club.name,
      description: club.description,
      location: club.region || club.location,
      logoUrl: club.logoUrl,
      memberCount: club.memberCount || 0,
      boatClassName: club.boatClassName,
      isJoined: joinedIds.has(club.id),
      source: club.source as 'platform' | 'directory' | undefined,
    }));
  }, [data, joinedIds]);

  // Join mutation
  const joinMutation = useMutation({
    mutationFn: async (clubId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      await ClubDiscoveryService.joinClub(user.id, clubId);
      return clubId;
    },
    onSuccess: (clubId) => {
      setJoinedIds((prev) => new Set([...prev, clubId]));
      queryClient.invalidateQueries({ queryKey: ['user-clubs', user?.id] });
    },
  });

  // Leave mutation
  const leaveMutation = useMutation({
    mutationFn: async (clubId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      await ClubDiscoveryService.leaveClub(user.id, clubId);
      return clubId;
    },
    onSuccess: (clubId) => {
      setJoinedIds((prev) => {
        const next = new Set(prev);
        next.delete(clubId);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: ['user-clubs', user?.id] });
    },
  });

  // Toggle join
  const toggleJoin = useCallback(
    async (clubId: string) => {
      if (joinedIds.has(clubId)) {
        await leaveMutation.mutateAsync(clubId);
      } else {
        await joinMutation.mutateAsync(clubId);
      }
    },
    [joinedIds, joinMutation, leaveMutation]
  );

  // Refresh
  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    clubs,
    isLoading,
    error,
    refresh,
    toggleJoin,
    joinedIds,
    isJoined: (clubId: string) => joinedIds.has(clubId),
    isToggling: joinMutation.isPending || leaveMutation.isPending,
  };
}

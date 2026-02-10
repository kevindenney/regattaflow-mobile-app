/**
 * useSailorSuggestions - Hook for Strava-style sailor suggestions
 *
 * Provides:
 * - Algorithm-based suggestions
 * - Search filtering
 * - Follow/unfollow functionality
 * - Follow state tracking
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { CrewFinderService, type SimilarSailor } from '@/services/CrewFinderService';
import type { SailorSuggestion } from '@/components/search/SailorSuggestionCard';

interface UseSailorSuggestionsOptions {
  limit?: number;
}

export function useSailorSuggestions(
  searchQuery: string = '',
  options: UseSailorSuggestionsOptions = {}
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { limit = 50 } = options;
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

  // Fetch similar sailors
  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['sailor-suggestions', user?.id],
    queryFn: async (): Promise<SimilarSailor[]> => {
      if (!user?.id) return [];
      return CrewFinderService.getSimilarSailors(user.id, { limit });
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Initialize followed IDs from the data
  useEffect(() => {
    if (data) {
      const ids = new Set(
        data.filter((s) => s.isFollowing).map((s) => s.userId)
      );
      setFollowedIds(ids);
    }
  }, [data]);

  // Transform to suggestions and filter by search
  const suggestions: SailorSuggestion[] = useMemo(() => {
    if (!data) return [];

    let filtered = data;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = data.filter(
        (s) =>
          s.fullName.toLowerCase().includes(query) ||
          s.similarityReasons.some((r) => r.toLowerCase().includes(query))
      );
    }

    // Transform to SailorSuggestion format
    return filtered.map((sailor) => ({
      userId: sailor.userId,
      fullName: sailor.fullName,
      avatarEmoji: sailor.avatarEmoji,
      avatarColor: sailor.avatarColor,
      similarityReason: sailor.similarityReasons[0],
      followerCount: sailor.similarityScore, // Use score as proxy
    }));
  }, [data, searchQuery]);

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      await CrewFinderService.followUser(user.id, targetUserId);
      return targetUserId;
    },
    onSuccess: (targetUserId) => {
      setFollowedIds((prev) => new Set([...prev, targetUserId]));
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['discovery-feed'] });
      queryClient.invalidateQueries({ queryKey: ['sailor-suggestions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['watch-feed'] });
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
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['discovery-feed'] });
      queryClient.invalidateQueries({ queryKey: ['sailor-suggestions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['watch-feed'] });
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

  // Refresh
  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    suggestions,
    isLoading,
    error,
    refresh,
    toggleFollow,
    followedIds,
    isFollowing: (userId: string) => followedIds.has(userId),
    isToggling:
      followMutation.isPending || unfollowMutation.isPending,
  };
}

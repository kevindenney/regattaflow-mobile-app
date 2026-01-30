/**
 * useSailorFullProfile - Hook for fetching complete sailor profile data
 *
 * Used on sailor profile pages to fetch all profile details including
 * stats, achievements, boats, and follow status.
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import {
  SailorProfileService,
  type FullSailorProfile,
} from '@/services/SailorProfileService';
import { CrewFinderService } from '@/services/CrewFinderService';

export function useSailorFullProfile(userId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch full profile data
  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['sailor-full-profile', userId],
    queryFn: () => SailorProfileService.getFullProfile(userId, user?.id),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      await CrewFinderService.followUser(user.id, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sailor-full-profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] });
    },
  });

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      await CrewFinderService.unfollowUser(user.id, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sailor-full-profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['following', user?.id] });
    },
  });

  // Toggle follow
  const toggleFollow = useCallback(async () => {
    if (!profile) return;

    if (profile.isFollowing) {
      await unfollowMutation.mutateAsync();
    } else {
      await followMutation.mutateAsync();
    }
  }, [profile, followMutation, unfollowMutation]);

  // Check if viewing own profile
  const isOwnProfile = user?.id === userId;

  return {
    profile,
    isLoading,
    error,
    refetch,
    toggleFollow,
    isFollowing: profile?.isFollowing ?? false,
    isOwnProfile,
    isToggling: followMutation.isPending || unfollowMutation.isPending,
  };
}

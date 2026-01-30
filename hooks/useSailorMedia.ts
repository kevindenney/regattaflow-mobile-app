/**
 * useSailorMedia - Hook for fetching sailor media gallery
 *
 * Fetches photos and videos for sailor profiles.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  SailorProfileService,
  type SailorMedia,
} from '@/services/SailorProfileService';

export function useSailorMedia(userId: string, options?: { featuredOnly?: boolean }) {
  const queryClient = useQueryClient();

  const { data: media = [], isLoading, error, refetch } = useQuery({
    queryKey: ['sailor-media', userId, options?.featuredOnly],
    queryFn: () =>
      SailorProfileService.getMedia(userId, {
        featuredOnly: options?.featuredOnly,
      }),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Add media mutation
  const addMediaMutation = useMutation({
    mutationFn: (mediaData: {
      mediaUrl: string;
      thumbnailUrl?: string;
      mediaType?: 'image' | 'video';
      regattaId?: string;
      caption?: string;
      isFeatured?: boolean;
    }) => SailorProfileService.addMedia(userId, mediaData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sailor-media', userId] });
    },
  });

  // Delete media mutation
  const deleteMediaMutation = useMutation({
    mutationFn: (mediaId: string) =>
      SailorProfileService.deleteMedia(userId, mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sailor-media', userId] });
    },
  });

  // Set featured mutation
  const setFeaturedMutation = useMutation({
    mutationFn: ({ mediaId, featured }: { mediaId: string; featured: boolean }) =>
      SailorProfileService.setFeaturedMedia(userId, mediaId, featured),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sailor-media', userId] });
    },
  });

  return {
    media,
    isLoading,
    error,
    refetch,
    addMedia: addMediaMutation.mutateAsync,
    deleteMedia: deleteMediaMutation.mutateAsync,
    setFeatured: setFeaturedMutation.mutateAsync,
    isAddingMedia: addMediaMutation.isPending,
    isDeletingMedia: deleteMediaMutation.isPending,
  };
}

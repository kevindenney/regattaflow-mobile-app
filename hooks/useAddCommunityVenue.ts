/**
 * useAddCommunityVenue Hook
 *
 * React Query mutation hook for creating community venues.
 * Wraps CommunityVenueCreationService.createCommunityVenue()
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CommunityVenueCreationService,
  type CreateCommunityVenueParams,
  type SailingVenue,
} from '@/services/venue/CommunityVenueCreationService';
import { useAuth } from '@/providers/AuthProvider';

export interface UseAddCommunityVenueOptions {
  onSuccess?: (venue: SailingVenue) => void;
  onError?: (error: Error) => void;
}

export function useAddCommunityVenue(options?: UseAddCommunityVenueOptions) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: CreateCommunityVenueParams): Promise<SailingVenue> => {
      if (!user) {
        throw new Error('You must be signed in to add a venue');
      }
      return CommunityVenueCreationService.createCommunityVenue(params);
    },
    onSuccess: (venue) => {
      // Invalidate venue-related queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      queryClient.invalidateQueries({ queryKey: ['venue-directory'] });
      queryClient.invalidateQueries({ queryKey: ['sailing-venues'] });

      options?.onSuccess?.(venue);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });

  return {
    addVenue: mutation.mutate,
    addVenueAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    createdVenue: mutation.data,
    reset: mutation.reset,
  };
}

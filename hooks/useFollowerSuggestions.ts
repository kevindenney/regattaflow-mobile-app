/**
 * useFollowerSuggestions
 *
 * TanStack React Query hook for fetching and mutating follower race suggestions.
 * Returns pending suggestions for a race with accept/dismiss mutations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import {
  FollowerSuggestionService,
  type FollowerSuggestion,
  type SuggestionCategory,
  type CreateFollowerSuggestionInput,
} from '@/services/FollowerSuggestionService';

// =============================================================================
// QUERY KEYS
// =============================================================================

export const FOLLOWER_SUGGESTIONS_KEYS = {
  all: ['follower-suggestions'] as const,
  forRace: (raceId: string) => [...FOLLOWER_SUGGESTIONS_KEYS.all, raceId] as const,
  pendingCount: (raceId: string) => [...FOLLOWER_SUGGESTIONS_KEYS.all, 'count', raceId] as const,
  mySent: (raceId: string) => [...FOLLOWER_SUGGESTIONS_KEYS.all, 'sent', raceId] as const,
};

// =============================================================================
// MAIN HOOK — Race owner view
// =============================================================================

export function useFollowerSuggestions(raceId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = FOLLOWER_SUGGESTIONS_KEYS.forRace(raceId ?? '');

  // Fetch all suggestions for the race
  const {
    data: allSuggestions = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => FollowerSuggestionService.getSuggestionsForRace(raceId!),
    enabled: !!raceId && !!user?.id,
    staleTime: 30 * 1000,
  });

  // Only pending suggestions
  const suggestions = allSuggestions.filter((s) => s.status === 'pending');
  const count = suggestions.length;

  // Accepted suggestions
  const acceptedSuggestions = allSuggestions.filter((s) => s.status === 'accepted');

  // Accepted suggestions grouped by category
  const acceptedByCategory = acceptedSuggestions.reduce<Record<SuggestionCategory, FollowerSuggestion[]>>(
    (acc, s) => {
      if (!acc[s.category]) acc[s.category] = [];
      acc[s.category].push(s);
      return acc;
    },
    {} as Record<SuggestionCategory, FollowerSuggestion[]>
  );

  // Accept mutation
  const acceptMutation = useMutation({
    mutationFn: (suggestionId: string) =>
      FollowerSuggestionService.acceptSuggestion(suggestionId),
    onSuccess: (success, suggestionId) => {
      if (success) {
        queryClient.setQueryData<FollowerSuggestion[]>(queryKey, (old = []) =>
          old.map((s) =>
            s.id === suggestionId ? { ...s, status: 'accepted' as const } : s
          )
        );
      }
    },
  });

  // Dismiss mutation
  const dismissMutation = useMutation({
    mutationFn: (suggestionId: string) =>
      FollowerSuggestionService.dismissSuggestion(suggestionId),
    onSuccess: (success, suggestionId) => {
      if (success) {
        queryClient.setQueryData<FollowerSuggestion[]>(queryKey, (old = []) =>
          old.map((s) =>
            s.id === suggestionId ? { ...s, status: 'dismissed' as const } : s
          )
        );
      }
    },
  });

  return {
    suggestions,
    count,
    acceptedSuggestions,
    acceptedByCategory,
    isLoading,
    error: error instanceof Error ? error : null,
    refetch,
    acceptSuggestion: acceptMutation.mutateAsync,
    dismissSuggestion: dismissMutation.mutateAsync,
    isAccepting: acceptMutation.isPending,
    isDismissing: dismissMutation.isPending,
  };
}

// =============================================================================
// SUBMIT HOOK — Follower submitting a suggestion
// =============================================================================

export function useSubmitFollowerSuggestion() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: CreateFollowerSuggestionInput) =>
      FollowerSuggestionService.createSuggestion(input),
    onSuccess: (newSuggestion) => {
      if (newSuggestion) {
        queryClient.invalidateQueries({
          queryKey: FOLLOWER_SUGGESTIONS_KEYS.forRace(newSuggestion.raceId),
        });
        queryClient.invalidateQueries({
          queryKey: FOLLOWER_SUGGESTIONS_KEYS.mySent(newSuggestion.raceId),
        });
      }
    },
  });

  return {
    submitSuggestion: mutation.mutateAsync,
    isSubmitting: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error : null,
  };
}

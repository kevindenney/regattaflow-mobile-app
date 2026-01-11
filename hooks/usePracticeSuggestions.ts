/**
 * usePracticeSuggestions Hook
 *
 * Hook for fetching AI-generated practice suggestions based on learning profile.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { PracticeSuggestionService } from '@/services/ai/PracticeSuggestionService';
import type { PracticeSuggestion, SuggestionContext, SkillArea } from '@/types/practice';

// Query keys
export const PRACTICE_SUGGESTIONS_KEYS = {
  all: ['practice-suggestions'] as const,
  list: (userId: string) => [...PRACTICE_SUGGESTIONS_KEYS.all, 'list', userId] as const,
  forSkill: (skillArea: SkillArea) =>
    [...PRACTICE_SUGGESTIONS_KEYS.all, 'skill', skillArea] as const,
};

/**
 * Hook for fetching practice suggestions for the current user
 */
export function usePracticeSuggestions(context?: SuggestionContext) {
  const { user } = useAuth();

  const {
    data: suggestions,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: PRACTICE_SUGGESTIONS_KEYS.list(user?.id || ''),
    queryFn: () => {
      if (!user?.id) {
        return [];
      }
      return PracticeSuggestionService.generateSuggestions(user.id, context);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  return {
    suggestions: suggestions || [],
    isLoading,
    error,
    refetch,
    // Computed
    topSuggestion: suggestions?.[0] || null,
    hasSuggestions: (suggestions?.length || 0) > 0,
  };
}

/**
 * Hook for getting a suggestion for a specific skill area
 */
export function useSuggestionForSkillArea(skillArea: SkillArea, context?: SuggestionContext) {
  const {
    data: suggestion,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: PRACTICE_SUGGESTIONS_KEYS.forSkill(skillArea),
    queryFn: () => PracticeSuggestionService.getSuggestionForSkillArea(skillArea, context),
    staleTime: 5 * 60 * 1000,
  });

  return {
    suggestion,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for regenerating suggestions with new context
 */
export function useRegenerateSuggestions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (context?: SuggestionContext) => {
      if (!user?.id) throw new Error('User not authenticated');
      return PracticeSuggestionService.generateSuggestions(user.id, context);
    },
    onSuccess: (data) => {
      // Update the cache with new suggestions
      if (user?.id) {
        queryClient.setQueryData(PRACTICE_SUGGESTIONS_KEYS.list(user.id), data);
      }
    },
  });

  return {
    regenerate: mutation.mutate,
    regenerateAsync: mutation.mutateAsync,
    isRegenerating: mutation.isPending,
    error: mutation.error,
  };
}

export default usePracticeSuggestions;

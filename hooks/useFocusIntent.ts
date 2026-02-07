/**
 * useFocusIntent Hook
 *
 * React Query hooks for managing sailor focus intents.
 * Provides access to active intents, evaluation, and suggestion generation.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { FocusIntentService } from '@/services/FocusIntentService';
import type {
  FocusIntent,
  CreateFocusIntentInput,
  FocusSuggestion,
} from '@/types/focusIntent';

// Query keys
const FOCUS_INTENT_KEYS = {
  all: ['focus-intents'] as const,
  active: (sailorId: string) =>
    [...FOCUS_INTENT_KEYS.all, 'active', sailorId] as const,
  fromRace: (sailorId: string, sourceRaceId: string) =>
    [...FOCUS_INTENT_KEYS.all, 'from-race', sailorId, sourceRaceId] as const,
  forRace: (sailorId: string, targetRaceId: string) =>
    [...FOCUS_INTENT_KEYS.all, 'for-race', sailorId, targetRaceId] as const,
  suggestions: (sailorId: string, raceId: string) =>
    [...FOCUS_INTENT_KEYS.all, 'suggestions', sailorId, raceId] as const,
  progress: (sailorId: string) =>
    [...FOCUS_INTENT_KEYS.all, 'progress', sailorId] as const,
};

/**
 * Hook to get the current active (unevaluated) focus intent
 */
export function useActiveFocusIntent() {
  const { user } = useAuth();
  const sailorId = user?.id;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: sailorId ? FOCUS_INTENT_KEYS.active(sailorId) : ['no-user'],
    queryFn: async () => {
      if (!sailorId) return null;
      return FocusIntentService.getActiveIntent(sailorId);
    },
    enabled: !!sailorId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    activeIntent: data ?? null,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get the focus intent set from a specific race (the intent set during that race's review)
 */
export function useFocusIntentFromRace(sourceRaceId: string | undefined) {
  const { user } = useAuth();
  const sailorId = user?.id;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: sailorId && sourceRaceId
      ? FOCUS_INTENT_KEYS.fromRace(sailorId, sourceRaceId)
      : ['no-user'],
    queryFn: async () => {
      if (!sailorId || !sourceRaceId) return null;
      return FocusIntentService.getIntentFromRace(sailorId, sourceRaceId);
    },
    enabled: !!sailorId && !!sourceRaceId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    intent: data ?? null,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get the focus intent applicable to a specific race (prep tab)
 */
export function useFocusIntentForRace(targetRaceId: string | undefined) {
  const { user } = useAuth();
  const sailorId = user?.id;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: sailorId && targetRaceId
      ? FOCUS_INTENT_KEYS.forRace(sailorId, targetRaceId)
      : ['no-user'],
    queryFn: async () => {
      if (!sailorId || !targetRaceId) return null;
      return FocusIntentService.getIntentForRace(sailorId, targetRaceId);
    },
    enabled: !!sailorId && !!targetRaceId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    focusIntent: data ?? null,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get AI-generated focus suggestions for the review tab
 */
export function useFocusSuggestions(raceId: string | undefined) {
  const { user } = useAuth();
  const sailorId = user?.id;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: sailorId && raceId
      ? FOCUS_INTENT_KEYS.suggestions(sailorId, raceId)
      : ['no-user'],
    queryFn: async () => {
      if (!sailorId || !raceId) return [];
      return FocusIntentService.generateSuggestions(sailorId, raceId);
    },
    enabled: !!sailorId && !!raceId,
    staleTime: 1000 * 60 * 30, // 30 minutes - suggestions don't change often
  });

  return {
    suggestions: (data ?? []) as FocusSuggestion[],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get focus progress summary
 */
export function useFocusProgress() {
  const { user } = useAuth();
  const sailorId = user?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: sailorId ? FOCUS_INTENT_KEYS.progress(sailorId) : ['no-user'],
    queryFn: async () => {
      if (!sailorId) return null;
      return FocusIntentService.getProgressSummary(sailorId);
    },
    enabled: !!sailorId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    progress: data ?? null,
    isLoading,
    error,
  };
}

/**
 * Hook to get focus history (recent evaluated intents)
 */
export function useFocusHistory(limit = 10) {
  const { user } = useAuth();
  const sailorId = user?.id;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: sailorId ? [...FOCUS_INTENT_KEYS.all, 'history', sailorId, limit] : ['no-user'],
    queryFn: async () => {
      if (!sailorId) return [];
      return FocusIntentService.getRecentEvaluations(sailorId, limit);
    },
    enabled: !!sailorId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    history: data ?? [],
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for creating a new focus intent (mutation)
 */
export function useSetFocusIntent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sailorId = user?.id;

  const mutation = useMutation({
    mutationFn: async (input: CreateFocusIntentInput) => {
      if (!sailorId) throw new Error('Not authenticated');
      return FocusIntentService.createIntent(sailorId, input);
    },
    onSuccess: (newIntent) => {
      if (!sailorId) return;

      // Update active intent cache
      queryClient.setQueryData(
        FOCUS_INTENT_KEYS.active(sailorId),
        newIntent,
      );

      // Update from-race cache if source race is set
      if (newIntent.sourceRaceId) {
        queryClient.setQueryData(
          FOCUS_INTENT_KEYS.fromRace(sailorId, newIntent.sourceRaceId),
          newIntent,
        );
      }

      // Invalidate progress
      queryClient.invalidateQueries({
        queryKey: FOCUS_INTENT_KEYS.progress(sailorId),
      });
    },
  });

  return {
    setFocus: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook for dismissing (skipping) a focus intent without evaluation (mutation)
 */
export function useDismissFocusIntent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sailorId = user?.id;

  const mutation = useMutation({
    mutationFn: async (intentId: string) => {
      return FocusIntentService.dismissIntent(intentId);
    },
    onSuccess: () => {
      if (!sailorId) return;

      // Invalidate active intent (it's now skipped)
      queryClient.invalidateQueries({
        queryKey: FOCUS_INTENT_KEYS.active(sailorId),
      });

      // Invalidate all focus intent queries to refresh
      queryClient.invalidateQueries({
        queryKey: FOCUS_INTENT_KEYS.all,
      });
    },
  });

  return {
    dismiss: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook for evaluating a focus intent (mutation)
 */
export function useEvaluateFocusIntent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sailorId = user?.id;

  const mutation = useMutation({
    mutationFn: async (input: { intentId: string; rating: number; notes?: string }) => {
      return FocusIntentService.evaluateIntent(input);
    },
    onSuccess: () => {
      if (!sailorId) return;

      // Invalidate active intent (it's now evaluated)
      queryClient.invalidateQueries({
        queryKey: FOCUS_INTENT_KEYS.active(sailorId),
      });

      // Invalidate progress
      queryClient.invalidateQueries({
        queryKey: FOCUS_INTENT_KEYS.progress(sailorId),
      });

      // Invalidate all focus intent queries to refresh
      queryClient.invalidateQueries({
        queryKey: FOCUS_INTENT_KEYS.all,
      });
    },
  });

  return {
    evaluate: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}

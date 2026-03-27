/**
 * useManifesto — React Query hook for user interest manifesto.
 */

import { useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import {
  getOrCreateManifesto,
  updateManifesto,
  parseManifestoWithAI,
} from '@/services/ManifestoService';
import type { ManifestoUpdateInput } from '@/types/manifesto';

const MANIFESTO_KEY = 'manifesto';

export function useManifesto(interestId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = [MANIFESTO_KEY, user?.id, interestId];

  const query = useQuery({
    queryKey,
    queryFn: () => getOrCreateManifesto(user!.id, interestId!),
    enabled: !!user?.id && !!interestId,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: ManifestoUpdateInput) => {
      if (!query.data?.id) throw new Error('No manifesto loaded');
      return updateManifesto(query.data.id, updates);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
  });

  return {
    manifesto: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}

/**
 * Hook for debounced manifesto content saving + AI parsing.
 */
export function useManifestoAutoSave(interestId: string | undefined, interestName: string) {
  const { manifesto, updateAsync } = useManifesto(interestId);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const parseTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const saveContent = useCallback(
    (content: string) => {
      if (!manifesto?.id) return;

      // Debounce save (800ms)
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        updateAsync({ content }).catch(() => {});
      }, 800);

      // Debounce AI parse (2000ms — slower since it's AI)
      if (parseTimerRef.current) clearTimeout(parseTimerRef.current);
      parseTimerRef.current = setTimeout(async () => {
        try {
          const extracted = await parseManifestoWithAI(content, interestName);
          await updateAsync({
            content,
            philosophies: extracted.philosophies,
            role_models: extracted.role_models,
            weekly_cadence: extracted.weekly_cadence,
            training_maxes: extracted.training_maxes,
            structured_goals: extracted.structured_goals,
            workout_split: extracted.workout_split,
          });
        } catch {
          // Silently fail AI parse — content is already saved
        }
      }, 2000);
    },
    [manifesto?.id, updateAsync, interestName],
  );

  return { manifesto, saveContent };
}

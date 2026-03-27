/**
 * useNutrition — TanStack Query hooks for nutrition data.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import {
  getTodaySummary,
  getWeeklySummary,
  getDailyTargets,
  getStepNutritionToday,
  getStepNutritionHistory,
} from '@/services/NutritionService';
import type { NutritionDaySummary, NutritionTargets } from '@/types/nutrition';
import type { StepNutritionDaySummary } from '@/types/step-nutrition';

const STALE_TIME = 30_000; // 30 seconds — nutrition changes frequently during logging

export function useNutritionToday(interestId: string | undefined) {
  const { user } = useAuth();
  return useQuery<NutritionDaySummary>({
    queryKey: ['nutrition', 'today', user?.id, interestId],
    queryFn: () => getTodaySummary(user!.id, interestId!),
    enabled: !!user?.id && !!interestId,
    staleTime: STALE_TIME,
  });
}

export function useNutritionWeekly(interestId: string | undefined) {
  const { user } = useAuth();
  return useQuery<NutritionDaySummary[]>({
    queryKey: ['nutrition', 'weekly', user?.id, interestId],
    queryFn: () => getWeeklySummary(user!.id, interestId!),
    enabled: !!user?.id && !!interestId,
    staleTime: STALE_TIME * 2,
  });
}

export function useNutritionTargets(interestId: string | undefined) {
  const { user } = useAuth();
  return useQuery<NutritionTargets>({
    queryKey: ['nutrition', 'targets', user?.id, interestId],
    queryFn: () => getDailyTargets(user!.id, interestId!),
    enabled: !!user?.id && !!interestId,
    staleTime: 60_000 * 5, // targets change rarely
  });
}

// ---------------------------------------------------------------------------
// Step-based nutrition hooks (primary — reads from step metadata)
// ---------------------------------------------------------------------------

export function useStepNutritionToday(interestId: string | undefined) {
  const { user } = useAuth();
  return useQuery<StepNutritionDaySummary>({
    queryKey: ['nutrition', 'step-today', user?.id, interestId],
    queryFn: () => getStepNutritionToday(user!.id, interestId!),
    enabled: !!user?.id && !!interestId,
    staleTime: STALE_TIME,
  });
}

export function useStepNutritionWeekly(interestId: string | undefined) {
  const { user } = useAuth();
  return useQuery<StepNutritionDaySummary[]>({
    queryKey: ['nutrition', 'step-weekly', user?.id, interestId],
    queryFn: () => getStepNutritionHistory(user!.id, interestId!),
    enabled: !!user?.id && !!interestId,
    staleTime: STALE_TIME * 2,
  });
}

/**
 * Invalidate nutrition queries — call after creating/updating entries.
 */
export function useInvalidateNutrition() {
  const queryClient = useQueryClient();

  return {
    invalidateToday: (_interestId: string) => {
      queryClient.invalidateQueries({ queryKey: ['nutrition', 'today'] });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition'] });
    },
  };
}

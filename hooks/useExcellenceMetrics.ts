/**
 * useExcellenceMetrics Hook
 *
 * React Query hook for accessing and managing excellence metrics.
 * Provides phase mastery scores, framework adoption, and outcome tracking.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { ExcellenceMetricsService } from '@/services/ExcellenceMetricsService';
import type {
  ExcellenceMetrics,
  PhaseMasteryScores,
  FrameworkScores,
  OutcomeMetrics,
  FocusRecommendation,
} from '@/types/excellenceFramework';

// Query keys
const EXCELLENCE_METRICS_KEYS = {
  all: ['excellence-metrics'] as const,
  metrics: (sailorId: string, seasonId?: string | null) =>
    [...EXCELLENCE_METRICS_KEYS.all, sailorId, seasonId ?? 'all-time'] as const,
  mastery: (sailorId: string, seasonId?: string | null) =>
    [...EXCELLENCE_METRICS_KEYS.metrics(sailorId, seasonId), 'mastery'] as const,
  framework: (sailorId: string, seasonId?: string | null) =>
    [...EXCELLENCE_METRICS_KEYS.metrics(sailorId, seasonId), 'framework'] as const,
  outcomes: (sailorId: string, seasonId?: string | null) =>
    [...EXCELLENCE_METRICS_KEYS.metrics(sailorId, seasonId), 'outcomes'] as const,
  comparison: (sailorId: string, currentSeasonId: string, previousSeasonId: string) =>
    [...EXCELLENCE_METRICS_KEYS.all, 'comparison', sailorId, currentSeasonId, previousSeasonId] as const,
};

/**
 * Hook for accessing excellence metrics
 */
export function useExcellenceMetrics(seasonId?: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sailorId = user?.id;

  // Fetch metrics
  const {
    data: metrics,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: sailorId ? EXCELLENCE_METRICS_KEYS.metrics(sailorId, seasonId) : ['no-user'],
    queryFn: async () => {
      if (!sailorId) return null;
      return ExcellenceMetricsService.getExcellenceMetrics(sailorId, seasonId);
    },
    enabled: !!sailorId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Refresh metrics mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      if (!sailorId) throw new Error('Not authenticated');
      return ExcellenceMetricsService.refreshMetrics(sailorId, seasonId || undefined);
    },
    onSuccess: (newMetrics) => {
      queryClient.setQueryData(
        EXCELLENCE_METRICS_KEYS.metrics(sailorId!, seasonId),
        newMetrics
      );
    },
  });

  // Helper to refresh metrics
  const refresh = () => refreshMutation.mutateAsync();

  // Computed values
  const phaseMastery = metrics?.phaseMastery || {
    prep: 0,
    launch: 0,
    start: 0,
    upwind: 0,
    downwind: 0,
    markRounding: 0,
    finish: 0,
    review: 0,
  };

  const frameworkScores = metrics?.frameworkScores || {
    puffResponse: 0,
    delayedTack: 0,
    windShiftAwareness: 0,
    gettingInPhase: 0,
    tacticalPositioning: 0,
    boatHandling: 0,
  };

  const outcomes = metrics?.outcomes || {
    racesCompleted: 0,
    averagePosition: 0,
    positionTrend: 'stable' as const,
    bestFinish: 0,
    recentResults: [],
  };

  const focusRecommendations = metrics?.focusRecommendations || [];

  // Calculate overall score (weighted average of phase mastery)
  const overallScore = Math.round(
    (phaseMastery.prep +
      phaseMastery.launch +
      phaseMastery.start +
      phaseMastery.upwind +
      phaseMastery.downwind +
      phaseMastery.markRounding +
      phaseMastery.finish +
      phaseMastery.review) /
      8
  );

  // Find lowest phases (areas to improve)
  const phaseEntries = Object.entries(phaseMastery) as [keyof PhaseMasteryScores, number][];
  const sortedPhases = [...phaseEntries].sort((a, b) => a[1] - b[1]);
  const weakestPhases = sortedPhases.slice(0, 3);
  const strongestPhases = sortedPhases.slice(-3).reverse();

  return {
    // Data
    metrics,
    phaseMastery,
    frameworkScores,
    outcomes,
    focusRecommendations,
    overallScore,
    weakestPhases,
    strongestPhases,

    // State
    isLoading,
    isRefreshing: refreshMutation.isPending,
    error,

    // Actions
    refresh,
    refetch,
  };
}

/**
 * Hook for phase mastery scores only
 */
export function usePhaseMastery(seasonId?: string | null) {
  const { user } = useAuth();
  const sailorId = user?.id;

  const {
    data: mastery,
    isLoading,
    error,
  } = useQuery({
    queryKey: sailorId ? EXCELLENCE_METRICS_KEYS.mastery(sailorId, seasonId) : ['no-user'],
    queryFn: async () => {
      if (!sailorId) return null;
      return ExcellenceMetricsService.calculatePhaseMastery(sailorId, seasonId || undefined);
    },
    enabled: !!sailorId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    mastery,
    isLoading,
    error,
  };
}

/**
 * Hook for framework scores only
 */
export function useFrameworkScores(seasonId?: string | null) {
  const { user } = useAuth();
  const sailorId = user?.id;

  const {
    data: scores,
    isLoading,
    error,
  } = useQuery({
    queryKey: sailorId ? EXCELLENCE_METRICS_KEYS.framework(sailorId, seasonId) : ['no-user'],
    queryFn: async () => {
      if (!sailorId) return null;
      return ExcellenceMetricsService.calculateFrameworkScores(sailorId, seasonId || undefined);
    },
    enabled: !!sailorId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    scores,
    isLoading,
    error,
  };
}

/**
 * Hook for outcome metrics only
 */
export function useOutcomeMetrics(seasonId?: string | null) {
  const { user } = useAuth();
  const sailorId = user?.id;

  const {
    data: outcomes,
    isLoading,
    error,
  } = useQuery({
    queryKey: sailorId ? EXCELLENCE_METRICS_KEYS.outcomes(sailorId, seasonId) : ['no-user'],
    queryFn: async () => {
      if (!sailorId) return null;
      return ExcellenceMetricsService.calculateOutcomeMetrics(sailorId, seasonId || undefined);
    },
    enabled: !!sailorId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    outcomes,
    isLoading,
    error,
  };
}

/**
 * Hook for comparing metrics between seasons
 */
export function useMetricsComparison(currentSeasonId: string, previousSeasonId: string) {
  const { user } = useAuth();
  const sailorId = user?.id;

  const {
    data: comparison,
    isLoading,
    error,
  } = useQuery({
    queryKey: sailorId
      ? EXCELLENCE_METRICS_KEYS.comparison(sailorId, currentSeasonId, previousSeasonId)
      : ['no-user'],
    queryFn: async () => {
      if (!sailorId) return null;
      return ExcellenceMetricsService.compareMetrics(
        sailorId,
        currentSeasonId,
        previousSeasonId
      );
    },
    enabled: !!sailorId && !!currentSeasonId && !!previousSeasonId,
    staleTime: 1000 * 60 * 30, // 30 minutes - comparisons don't change often
  });

  return {
    comparison,
    isLoading,
    error,
  };
}

/**
 * Hook for focus recommendations
 */
export function useFocusRecommendations() {
  const { metrics, isLoading, error } = useExcellenceMetrics();

  const recommendations = metrics?.focusRecommendations || [];
  const highPriority = recommendations.filter((r) => r.priority === 'high');
  const mediumPriority = recommendations.filter((r) => r.priority === 'medium');
  const lowPriority = recommendations.filter((r) => r.priority === 'low');

  return {
    recommendations,
    highPriority,
    mediumPriority,
    lowPriority,
    hasHighPriority: highPriority.length > 0,
    isLoading,
    error,
  };
}

export default useExcellenceMetrics;

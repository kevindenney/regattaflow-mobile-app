/**
 * useAIInsights — React Query hook for AI interest insights.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { getActiveInsights, getInsightsByType, dismissInsight } from '@/services/AIMemoryService';

const INSIGHTS_KEY = 'ai-insights';

export function useAIInsights(interestId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = [INSIGHTS_KEY, user?.id, interestId];

  const query = useQuery({
    queryKey,
    queryFn: () => getActiveInsights(user!.id, interestId!),
    enabled: !!user?.id && !!interestId,
  });

  const dismissMutation = useMutation({
    mutationFn: (insightId: string) => dismissInsight(insightId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    insights: query.data ?? [],
    isLoading: query.isLoading,
    dismiss: dismissMutation.mutate,
    refetch: query.refetch,
  };
}

export function useAIInsightsByType(interestId: string | undefined) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: [INSIGHTS_KEY, 'by-type', user?.id, interestId],
    queryFn: () => getInsightsByType(user!.id, interestId!),
    enabled: !!user?.id && !!interestId,
  });

  return {
    insightsByType: query.data ?? null,
    isLoading: query.isLoading,
  };
}

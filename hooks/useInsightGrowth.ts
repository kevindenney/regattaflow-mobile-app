/**
 * useInsightGrowth — derived insight counts for "AI is getting smarter" visibility.
 */

import { useMemo } from 'react';
import { useAIInsights } from '@/hooks/useAIInsights';

export function useInsightGrowth(interestId: string | undefined) {
  const { insights, isLoading } = useAIInsights(interestId);

  const { total, newThisWeek } = useMemo(() => {
    if (!insights.length) return { total: 0, newThisWeek: 0 };

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoIso = weekAgo.toISOString();

    return {
      total: insights.length,
      newThisWeek: insights.filter((i) => i.created_at > weekAgoIso).length,
    };
  }, [insights]);

  return { total, newThisWeek, isLoading };
}

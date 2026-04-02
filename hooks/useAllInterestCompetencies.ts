/**
 * useAllInterestCompetencies — Fetches competency progress for the
 * currently active interest, grouped by category with achievement %.
 *
 * Each interest tab shows only its own competency matrix.
 * Returns empty when the active interest has no competencies defined.
 */

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { useInterest, type Interest } from '@/providers/InterestProvider';
import {
  getUserCompetencyProgress,
  getCompetencyDashboardSummary,
} from '@/services/competencyService';
import type {
  CompetencyWithProgress,
  CompetencyDashboardSummary,
  CompetencyStatus,
} from '@/types/competency';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useAllInterestCompetencies');

export interface CategoryAchievement {
  category: string;
  total: number;
  completed: number;
  percent: number;
  competencies: CompetencyWithProgress[];
}

export interface InterestCompetencyData {
  interest: Interest;
  competencies: CompetencyWithProgress[];
  summary: CompetencyDashboardSummary | null;
  categories: CategoryAchievement[];
}

export interface UseAllInterestCompetenciesResult {
  data: InterestCompetencyData[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
  /** Aggregated totals across all interests */
  aggregate: {
    total: number;
    completed: number;
    percent: number;
    byStatus: Record<CompetencyStatus, number>;
  };
}

const EMPTY_STATUS_COUNTS: Record<CompetencyStatus, number> = {
  not_started: 0,
  learning: 0,
  practicing: 0,
  checkoff_ready: 0,
  validated: 0,
  competent: 0,
};

function buildCategories(competencies: CompetencyWithProgress[]): CategoryAchievement[] {
  const map = new Map<string, { items: CompetencyWithProgress[]; completed: number; total: number }>();

  for (const c of competencies) {
    let bucket = map.get(c.category);
    if (!bucket) {
      bucket = { items: [], completed: 0, total: 0 };
      map.set(c.category, bucket);
    }
    bucket.items.push(c);
    bucket.total += 1;
    const s = c.progress?.status;
    if (s === 'validated' || s === 'competent') {
      bucket.completed += 1;
    }
  }

  return Array.from(map.entries()).map(([category, b]) => ({
    category,
    total: b.total,
    completed: b.completed,
    percent: b.total > 0 ? Math.round((b.completed / b.total) * 100) : 0,
    competencies: b.items.sort((a, b2) => a.sort_order - b2.sort_order),
  }));
}

export function useAllInterestCompetencies(): UseAllInterestCompetenciesResult {
  const { user } = useAuth();
  const { currentInterest, loading: interestLoading } = useInterest();
  const userId = user?.id;

  // Scope to the currently active interest so each interest tab
  // shows only its own competency matrix.
  const effectiveInterests = useMemo(() => {
    if (currentInterest) return [currentInterest];
    return [];
  }, [currentInterest]);

  // Create parallel queries for each interest's competency progress
  const progressQueries = useQueries({
    queries: effectiveInterests.map((interest) => ({
      queryKey: ['competency-progress', userId, interest.id],
      queryFn: () => getUserCompetencyProgress(userId!, interest.id),
      enabled: Boolean(userId),
    })),
  });

  const summaryQueries = useQueries({
    queries: effectiveInterests.map((interest) => ({
      queryKey: ['competency-summary', userId, interest.id],
      queryFn: () => getCompetencyDashboardSummary(userId!, interest.id),
      enabled: Boolean(userId),
    })),
  });

  const isLoading = interestLoading || progressQueries.some((q) => q.isLoading) || summaryQueries.some((q) => q.isLoading);
  const error = progressQueries.find((q) => q.error)?.error ?? summaryQueries.find((q) => q.error)?.error ?? null;

  // Build a stable dependency key from all query data
  const progressDataKey = progressQueries.map((q) => q.dataUpdatedAt).join(',');
  const summaryDataKey = summaryQueries.map((q) => q.dataUpdatedAt).join(',');

  // Build the result data — filter to only interests with competencies
  const data = useMemo<InterestCompetencyData[]>(() => {
    const results: InterestCompetencyData[] = [];

    for (let i = 0; i < effectiveInterests.length; i++) {
      const interest = effectiveInterests[i];
      const competencies = progressQueries[i]?.data ?? [];

      if (competencies.length === 0) continue;

      results.push({
        interest,
        competencies,
        summary: summaryQueries[i]?.data ?? null,
        categories: buildCategories(competencies),
      });
    }

    return results;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveInterests, progressDataKey, summaryDataKey]);

  // Aggregate across all interests
  const aggregate = useMemo(() => {
    const byStatus = { ...EMPTY_STATUS_COUNTS };
    let total = 0;
    let completed = 0;

    for (const d of data) {
      if (d.summary) {
        total += d.summary.total;
        completed += d.summary.byStatus.validated + d.summary.byStatus.competent;
        for (const status of Object.keys(byStatus) as CompetencyStatus[]) {
          byStatus[status] += d.summary.byStatus[status] ?? 0;
        }
      }
    }

    return {
      total,
      completed,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      byStatus,
    };
  }, [data]);

  const refresh = () => {
    logger.info('Refreshing all interest competencies');
    for (const q of progressQueries) q.refetch();
    for (const q of summaryQueries) q.refetch();
  };

  return { data, isLoading, error, refresh, aggregate };
}

/**
 * useCompetencyProgress — Fetches the current user's competency progress
 * for the active interest. Returns all competencies with their status.
 */

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { useInterest } from '@/providers/InterestProvider';
import {
  getUserCompetencyProgress,
  getCompetencyDashboardSummary,
  logAttempt,
} from '@/services/competencyService';
import type {
  CompetencyWithProgress,
  CompetencyDashboardSummary,
  LogAttemptPayload,
  CompetencyStatus,
  CompetencyCategory,
} from '@/types/competency';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useCompetencyProgress');

interface UseCompetencyProgressResult {
  competencies: CompetencyWithProgress[];
  summary: CompetencyDashboardSummary | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
  logNewAttempt: (payload: LogAttemptPayload) => Promise<void>;
  isLoggingAttempt: boolean;
  getByCategory: (category: CompetencyCategory) => CompetencyWithProgress[];
  getByStatus: (status: CompetencyStatus) => CompetencyWithProgress[];
}

export function useCompetencyProgress(): UseCompetencyProgressResult {
  const { user } = useAuth();
  const { currentInterest } = useInterest();
  const queryClient = useQueryClient();

  const userId = user?.id;
  const interestId = currentInterest?.id;
  const enabled = Boolean(userId && interestId);

  // Fetch all competencies with progress
  const progressQuery = useQuery<CompetencyWithProgress[], Error>({
    queryKey: ['competency-progress', userId, interestId],
    queryFn: () => {
      logger.info('Fetching competency progress', { userId, interestId });
      return getUserCompetencyProgress(userId!, interestId!);
    },
    enabled,
  });

  // Fetch dashboard summary
  const summaryQuery = useQuery<CompetencyDashboardSummary, Error>({
    queryKey: ['competency-summary', userId, interestId],
    queryFn: () => {
      logger.info('Fetching competency dashboard summary', { userId, interestId });
      return getCompetencyDashboardSummary(userId!, interestId!);
    },
    enabled,
  });

  // Mutation for logging a new attempt
  const attemptMutation = useMutation<void, Error, LogAttemptPayload>({
    mutationFn: async (payload) => {
      logger.info('Logging new attempt', { competencyId: payload.competency_id });
      await logAttempt(userId!, payload);
    },
    onSuccess: () => {
      logger.info('Attempt logged successfully, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['competency-progress', userId, interestId] });
      queryClient.invalidateQueries({ queryKey: ['competency-summary', userId, interestId] });
    },
    onError: (error) => {
      logger.error('Failed to log attempt', { error: error.message });
    },
  });

  const competencies = progressQuery.data ?? [];

  // Filter helpers
  const getByCategory = useMemo(() => {
    return (category: CompetencyCategory): CompetencyWithProgress[] =>
      competencies.filter((c) => c.category === category);
  }, [competencies]);

  const getByStatus = useMemo(() => {
    return (status: CompetencyStatus): CompetencyWithProgress[] =>
      competencies.filter((c) => c.progress?.status === status);
  }, [competencies]);

  const refresh = () => {
    logger.info('Refreshing competency progress and summary');
    queryClient.invalidateQueries({ queryKey: ['competency-progress', userId, interestId] });
    queryClient.invalidateQueries({ queryKey: ['competency-summary', userId, interestId] });
  };

  const logNewAttempt = async (payload: LogAttemptPayload): Promise<void> => {
    await attemptMutation.mutateAsync(payload);
  };

  return {
    competencies,
    summary: summaryQuery.data ?? null,
    isLoading: progressQuery.isLoading || summaryQuery.isLoading,
    error: progressQuery.error ?? summaryQuery.error ?? null,
    refresh,
    logNewAttempt,
    isLoggingAttempt: attemptMutation.isPending,
    getByCategory,
    getByStatus,
  };
}

export default useCompetencyProgress;

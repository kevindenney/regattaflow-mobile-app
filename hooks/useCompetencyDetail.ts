/**
 * useCompetencyDetail — Fetches detailed information for a single competency
 * including all attempts, reviews, and the sign-off chain state.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import {
  getCompetencyDetail,
  submitPreceptorValidation,
  validateCompetency,
  submitFacultyReview,
} from '@/services/competencyService';
import type {
  CompetencyDetail,
  PreceptorValidationPayload,
  FacultyReviewPayload,
} from '@/types/competency';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useCompetencyDetail');

interface UseCompetencyDetailResult {
  detail: CompetencyDetail | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
  // Preceptor actions
  submitValidation: (payload: PreceptorValidationPayload) => Promise<void>;
  markValidated: (progressId: string) => Promise<void>;
  // Faculty actions
  submitReview: (payload: FacultyReviewPayload) => Promise<void>;
}

export function useCompetencyDetail(competencyId: string | undefined): UseCompetencyDetailResult {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const userId = user?.id;
  const enabled = Boolean(userId && competencyId);

  // Fetch competency detail
  const detailQuery = useQuery<CompetencyDetail, Error>({
    queryKey: ['competency-detail', userId, competencyId],
    queryFn: () => {
      logger.info('Fetching competency detail', { userId, competencyId });
      return getCompetencyDetail(userId!, competencyId!);
    },
    enabled,
  });

  // Helper to invalidate related queries after mutations
  const invalidateRelatedQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['competency-detail', userId, competencyId] });
    queryClient.invalidateQueries({ queryKey: ['competency-progress', userId] });
    queryClient.invalidateQueries({ queryKey: ['competency-summary', userId] });
  };

  // Mutation: submit preceptor validation
  const preceptorValidationMutation = useMutation<void, Error, PreceptorValidationPayload>({
    mutationFn: (payload) => {
      logger.info('Submitting preceptor validation', { competencyId });
      return submitPreceptorValidation(payload);
    },
    onSuccess: () => {
      logger.info('Preceptor validation submitted successfully');
      invalidateRelatedQueries();
    },
    onError: (error) => {
      logger.error('Failed to submit preceptor validation', { error: error.message });
    },
  });

  // Mutation: mark validated
  const markValidatedMutation = useMutation<void, Error, string>({
    mutationFn: (progressId) => {
      logger.info('Marking competency as validated', { progressId });
      return validateCompetency(progressId);
    },
    onSuccess: () => {
      logger.info('Competency marked as validated');
      invalidateRelatedQueries();
    },
    onError: (error) => {
      logger.error('Failed to mark competency as validated', { error: error.message });
    },
  });

  // Mutation: submit faculty review
  const facultyReviewMutation = useMutation<void, Error, FacultyReviewPayload>({
    mutationFn: (payload) => {
      logger.info('Submitting faculty review', { competencyId });
      return submitFacultyReview(payload);
    },
    onSuccess: () => {
      logger.info('Faculty review submitted successfully');
      invalidateRelatedQueries();
    },
    onError: (error) => {
      logger.error('Failed to submit faculty review', { error: error.message });
    },
  });

  const refresh = () => {
    logger.info('Refreshing competency detail', { competencyId });
    invalidateRelatedQueries();
  };

  const submitValidationFn = async (payload: PreceptorValidationPayload): Promise<void> => {
    await preceptorValidationMutation.mutateAsync(payload);
  };

  const markValidatedFn = async (progressId: string): Promise<void> => {
    await markValidatedMutation.mutateAsync(progressId);
  };

  const submitReviewFn = async (payload: FacultyReviewPayload): Promise<void> => {
    await facultyReviewMutation.mutateAsync(payload);
  };

  return {
    detail: detailQuery.data ?? null,
    isLoading: detailQuery.isLoading,
    error: detailQuery.error ?? null,
    refresh,
    submitValidation: submitValidationFn,
    markValidated: markValidatedFn,
    submitReview: submitReviewFn,
  };
}

export default useCompetencyDetail;

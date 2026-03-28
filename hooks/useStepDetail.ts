/**
 * useStepDetail — React Query hooks for single step detail + metadata updates.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStepById, updateStepMetadata } from '@/services/TimelineStepService';
import type { TimelineStepRecord } from '@/types/timeline-steps';
import type { StepMetadata } from '@/types/step-detail';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const KEYS = {
  stepDetail: (stepId: string) => ['timeline-steps', 'detail', stepId] as const,
};

// ---------------------------------------------------------------------------
// 1. Fetch a single step
// ---------------------------------------------------------------------------

export function useStepDetail(stepId: string | undefined) {
  return useQuery<TimelineStepRecord, Error>({
    queryKey: KEYS.stepDetail(stepId ?? ''),
    queryFn: () => getStepById(stepId!),
    enabled: Boolean(stepId),
    retry: (failureCount, error) => {
      // Don't retry "not found" errors — step was likely deleted
      if (error?.message?.includes('not found')) return false;
      return failureCount < 2;
    },
  });
}

// ---------------------------------------------------------------------------
// 2. Update step metadata (deep merge)
// ---------------------------------------------------------------------------

export function useUpdateStepMetadata(stepId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<
    TimelineStepRecord,
    Error,
    Partial<StepMetadata>
  >({
    mutationFn: (partialMetadata) => {
      if (!stepId?.trim()) throw new Error('No step ID');
      return updateStepMetadata(stepId, partialMetadata);
    },
    retry: false,
    onSuccess: (updatedStep) => {
      // Set the detail query data directly — no broad invalidation needed.
      // The list query doesn't display metadata, so invalidating it only
      // causes unnecessary re-renders across all cards.
      queryClient.setQueryData(KEYS.stepDetail(stepId!), updatedStep);
    },
  });
}

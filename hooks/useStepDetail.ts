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
  const queryClient = useQueryClient();

  // `temp-` ids are client-generated placeholders for optimistic step-create.
  // Skip the network call entirely — the synthetic record lives in the cache
  // and will be swapped for the real row once the RPC returns.
  const isTempId = typeof stepId === 'string' && stepId.startsWith('temp-');

  return useQuery<TimelineStepRecord, Error>({
    queryKey: KEYS.stepDetail(stepId ?? ''),
    queryFn: () => getStepById(stepId!),
    enabled: Boolean(stepId) && !isTempId,
    // Tapping a step in the carousel reads from the same row already loaded
    // by useMyTimeline. Treat that as fresh for 30s so we don't trigger a
    // redundant background fetch on every tap. The detail cache is also
    // primed by useMyTimeline; this stops the auto-refetch dance after.
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    // Fallback: if the detail cache hasn't been primed yet (e.g. step opened
    // from a search result before the timeline list loaded), scan any cached
    // list query and surface the matching record while the network call runs.
    placeholderData: () => {
      if (!stepId) return undefined;
      const lists = queryClient.getQueriesData<TimelineStepRecord[]>({
        queryKey: ['timeline-steps'],
      });
      for (const [, list] of lists) {
        if (!Array.isArray(list)) continue;
        const match = list.find((s) => s?.id === stepId);
        if (match) return match;
      }
      return undefined;
    },
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

/**
 * useTimelineSteps — React Query hooks for timeline step operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import {
  getUserTimeline,
  getFollowedUsersTimelines,
  getCollaboratedSteps,
  getStepById,
  createStep,
  updateStep,
  deleteStep,
  adoptStep,
  createStepsFromCourse,
} from '@/services/TimelineStepService';
import type { CourseToTimelineOptions } from '@/services/TimelineStepService';
import type {
  TimelineStepRecord,
  CreateTimelineStepInput,
  UpdateTimelineStepInput,
} from '@/types/timeline-steps';
import { PlaybookAIService } from '@/services/ai/PlaybookAIService';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const KEYS = {
  myTimeline: (interestId?: string | string[] | null) =>
    ['timeline-steps', 'mine', interestId ? (Array.isArray(interestId) ? [...interestId].sort().join(',') : interestId) : 'all'] as const,
  userTimeline: (userId: string, interestId?: string | null) =>
    ['timeline-steps', userId, interestId ?? 'all'] as const,
  followedTimelines: (interestId?: string | null) =>
    ['timeline-steps', 'following', interestId ?? 'all'] as const,
  collaborated: (interestId?: string | null) =>
    ['timeline-steps', 'collaborated', interestId ?? 'all'] as const,
  stepDetail: (stepId: string) =>
    ['timeline-steps', 'detail', stepId] as const,
};

// ---------------------------------------------------------------------------
// 1. Current user's timeline
// ---------------------------------------------------------------------------

export function useMyTimeline(interestId?: string | string[] | null) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<TimelineStepRecord[], Error>({
    queryKey: KEYS.myTimeline(interestId),
    queryFn: () => getUserTimeline(userId!, interestId),
    enabled: Boolean(userId),
    // Prevent refetch when window regains focus (e.g. returning from share dialog / mail app).
    // Without this, the refetch creates new array references that cascade through
    // interestFilteredRaces → cardGridRaces → initialRaceIndex, causing the card
    // carousel to briefly jump to index 0.
    refetchOnWindowFocus: false,
    staleTime: 30_000, // 30s — manual pull-to-refresh still works
  });
}

// ---------------------------------------------------------------------------
// 2. Another user's visible timeline
// ---------------------------------------------------------------------------

export function useUserTimeline(userId: string | undefined, interestId?: string | null) {
  return useQuery<TimelineStepRecord[], Error>({
    queryKey: KEYS.userTimeline(userId ?? '', interestId),
    queryFn: () => getUserTimeline(userId!, interestId),
    enabled: Boolean(userId),
  });
}

// ---------------------------------------------------------------------------
// 3. Followed users' timelines
// ---------------------------------------------------------------------------

export function useFollowedTimelines(interestId?: string | null) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<TimelineStepRecord[], Error>({
    queryKey: KEYS.followedTimelines(interestId),
    queryFn: () => getFollowedUsersTimelines(userId!, interestId),
    enabled: Boolean(userId),
  });
}

// ---------------------------------------------------------------------------
// 3b. Steps where the current user is a collaborator
// ---------------------------------------------------------------------------

export function useCollaboratedSteps(interestId?: string | null) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<TimelineStepRecord[], Error>({
    queryKey: KEYS.collaborated(interestId),
    queryFn: () => getCollaboratedSteps(userId!, interestId),
    enabled: Boolean(userId),
  });
}

// ---------------------------------------------------------------------------
// 3c. Single step by ID
// ---------------------------------------------------------------------------

export function useStepById(stepId: string | undefined) {
  return useQuery<TimelineStepRecord, Error>({
    queryKey: KEYS.stepDetail(stepId ?? ''),
    queryFn: () => getStepById(stepId!),
    enabled: Boolean(stepId),
  });
}

// ---------------------------------------------------------------------------
// 4. Create step mutation
// ---------------------------------------------------------------------------

export function useCreateStep() {
  const queryClient = useQueryClient();

  return useMutation<TimelineStepRecord, Error, CreateTimelineStepInput>({
    mutationFn: createStep,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['timeline-steps', variables.user_id] });
      queryClient.invalidateQueries({ queryKey: KEYS.myTimeline() });
      // Fire cross-interest suggestions for the new step (fire-and-forget)
      PlaybookAIService.crossInterest(data.id).catch(() => {});
    },
  });
}

// ---------------------------------------------------------------------------
// 5. Update step mutation
// ---------------------------------------------------------------------------

export function useUpdateStep() {
  const queryClient = useQueryClient();

  return useMutation<
    TimelineStepRecord,
    Error,
    { stepId: string; input: UpdateTimelineStepInput }
  >({
    mutationFn: ({ stepId, input }) => updateStep(stepId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline-steps'] });
    },
  });
}

// ---------------------------------------------------------------------------
// 6. Delete step mutation
// ---------------------------------------------------------------------------

export function useDeleteStep() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteStep,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline-steps'] });
    },
  });
}

// ---------------------------------------------------------------------------
// 7. Adopt step mutation (copy from another user)
// ---------------------------------------------------------------------------

export function useAdoptStep() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<
    TimelineStepRecord,
    Error,
    { sourceStepId: string; interestId: string }
  >({
    mutationFn: ({ sourceStepId, interestId }) => {
      if (!user?.id) throw new Error('Must be logged in to adopt a step');
      return adoptStep(user.id, sourceStepId, interestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline-steps'] });
    },
  });
}

// ---------------------------------------------------------------------------
// 8. Create steps from course lessons
// ---------------------------------------------------------------------------

export function useCreateStepsFromCourse() {
  const queryClient = useQueryClient();

  return useMutation<
    TimelineStepRecord[],
    Error,
    CourseToTimelineOptions
  >({
    mutationFn: createStepsFromCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline-steps'] });
    },
  });
}

/**
 * useTimelineSteps — React Query hooks for timeline step operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import {
  getUserTimeline,
  getFollowedUsersTimelines,
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

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const KEYS = {
  myTimeline: (interestId?: string | null) =>
    ['timeline-steps', 'mine', interestId ?? 'all'] as const,
  userTimeline: (userId: string, interestId?: string | null) =>
    ['timeline-steps', userId, interestId ?? 'all'] as const,
  followedTimelines: (interestId?: string | null) =>
    ['timeline-steps', 'following', interestId ?? 'all'] as const,
  stepDetail: (stepId: string) =>
    ['timeline-steps', 'detail', stepId] as const,
};

// ---------------------------------------------------------------------------
// 1. Current user's timeline
// ---------------------------------------------------------------------------

export function useMyTimeline(interestId?: string | null) {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<TimelineStepRecord[], Error>({
    queryKey: KEYS.myTimeline(interestId),
    queryFn: () => getUserTimeline(userId!, interestId),
    enabled: Boolean(userId),
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
// 3b. Single step by ID
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['timeline-steps', variables.user_id] });
      queryClient.invalidateQueries({ queryKey: KEYS.myTimeline() });
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

/**
 * useBlueprint — React Query hooks for blueprint operations
 *
 * Provides hooks for publishing, subscribing, and consuming blueprints.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import {
  createBlueprint,
  updateBlueprint,
  deleteBlueprint,
  getBlueprintBySlug,
  getBlueprintById,
  getUserBlueprints,
  getBlueprintSteps,
  getOrganizationBlueprints,
  subscribe,
  unsubscribe,
  getSubscription,
  getMySubscriptions,
  getNewStepsForSubscriber,
  markStepAction,
} from '@/services/BlueprintService';
import { adoptStep } from '@/services/TimelineStepService';
import type {
  BlueprintRecord,
  CreateBlueprintInput,
  UpdateBlueprintInput,
  BlueprintWithAuthor,
  BlueprintSubscriptionRecord,
  BlueprintNewStep,
} from '@/types/blueprint';
import type { TimelineStepRecord } from '@/types/timeline-steps';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const keys = {
  all: ['blueprints'] as const,
  bySlug: (slug: string) => ['blueprints', 'slug', slug] as const,
  byId: (id: string) => ['blueprints', 'id', id] as const,
  userBlueprints: (userId: string) => ['blueprints', 'user', userId] as const,
  steps: (blueprintId: string) => ['blueprints', 'steps', blueprintId] as const,
  subscriptions: (userId: string) => ['blueprint-subscriptions', userId] as const,
  subscription: (userId: string, blueprintId: string) =>
    ['blueprint-subscriptions', userId, blueprintId] as const,
  newSteps: (userId: string, interestId?: string | null) =>
    ['blueprint-new-steps', userId, interestId] as const,
  orgBlueprints: (orgId: string) => ['blueprints', 'org', orgId] as const,
};

// ---------------------------------------------------------------------------
// Blueprint queries
// ---------------------------------------------------------------------------

export function useBlueprint(slug?: string | null) {
  return useQuery<BlueprintWithAuthor | null>({
    queryKey: keys.bySlug(slug ?? ''),
    queryFn: () => getBlueprintBySlug(slug!),
    enabled: !!slug,
  });
}

export function useBlueprintById(blueprintId?: string | null) {
  return useQuery<BlueprintRecord | null>({
    queryKey: keys.byId(blueprintId ?? ''),
    queryFn: () => getBlueprintById(blueprintId!),
    enabled: !!blueprintId,
  });
}

export function useUserBlueprints() {
  const { user } = useAuth();
  return useQuery<BlueprintRecord[]>({
    queryKey: keys.userBlueprints(user?.id ?? ''),
    queryFn: () => getUserBlueprints(user!.id),
    enabled: !!user?.id,
  });
}

export function useBlueprintSteps(blueprintId?: string | null) {
  return useQuery<TimelineStepRecord[]>({
    queryKey: keys.steps(blueprintId ?? ''),
    queryFn: () => getBlueprintSteps(blueprintId!),
    enabled: !!blueprintId,
  });
}

export function useOrganizationBlueprints(orgId?: string | null) {
  return useQuery<BlueprintRecord[]>({
    queryKey: keys.orgBlueprints(orgId ?? ''),
    queryFn: () => getOrganizationBlueprints(orgId!),
    enabled: !!orgId,
  });
}

// ---------------------------------------------------------------------------
// Subscription queries
// ---------------------------------------------------------------------------

export function useMySubscriptions() {
  const { user } = useAuth();
  return useQuery<BlueprintSubscriptionRecord[]>({
    queryKey: keys.subscriptions(user?.id ?? ''),
    queryFn: () => getMySubscriptions(user!.id),
    enabled: !!user?.id,
  });
}

export function useBlueprintSubscription(blueprintId?: string | null) {
  const { user } = useAuth();
  return useQuery<BlueprintSubscriptionRecord | null>({
    queryKey: keys.subscription(user?.id ?? '', blueprintId ?? ''),
    queryFn: () => getSubscription(user!.id, blueprintId!),
    enabled: !!user?.id && !!blueprintId,
  });
}

export function useNewBlueprintSteps(interestId?: string | null) {
  const { user } = useAuth();
  return useQuery<BlueprintNewStep[]>({
    queryKey: keys.newSteps(user?.id ?? '', interestId),
    queryFn: () => getNewStepsForSubscriber(user!.id, interestId),
    enabled: !!user?.id,
  });
}

// ---------------------------------------------------------------------------
// Blueprint mutations
// ---------------------------------------------------------------------------

export function useCreateBlueprint() {
  const queryClient = useQueryClient();
  return useMutation<BlueprintRecord, Error, CreateBlueprintInput>({
    mutationFn: createBlueprint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
    },
  });
}

export function useUpdateBlueprint() {
  const queryClient = useQueryClient();
  return useMutation<
    BlueprintRecord,
    Error,
    { blueprintId: string; updates: UpdateBlueprintInput }
  >({
    mutationFn: ({ blueprintId, updates }) => updateBlueprint(blueprintId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
    },
  });
}

export function useDeleteBlueprint() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteBlueprint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Subscription mutations
// ---------------------------------------------------------------------------

export function useSubscribe() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<BlueprintSubscriptionRecord, Error, string>({
    mutationFn: (blueprintId: string) => {
      if (!user?.id) throw new Error('Must be logged in to subscribe');
      return subscribe(user.id, blueprintId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blueprint-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: keys.all });
    },
  });
}

export function useUnsubscribe() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (blueprintId: string) => {
      if (!user?.id) throw new Error('Must be logged in');
      return unsubscribe(user.id, blueprintId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blueprint-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: keys.all });
    },
  });
}

// ---------------------------------------------------------------------------
// Step action mutations (adopt / dismiss from blueprint feed)
// ---------------------------------------------------------------------------

export function useAdoptBlueprintStep() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<
    TimelineStepRecord,
    Error,
    { sourceStepId: string; interestId: string; subscriptionId: string }
  >({
    mutationFn: async ({ sourceStepId, interestId, subscriptionId }) => {
      if (!user?.id) throw new Error('Must be logged in');

      // Adopt the step (creates copy in user's timeline)
      const adopted = await adoptStep(user.id, sourceStepId, interestId);

      // Mark as adopted in blueprint tracking
      await markStepAction(subscriptionId, sourceStepId, 'adopted', adopted.id);

      return adopted;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline-steps'] });
      queryClient.invalidateQueries({ queryKey: ['blueprint-new-steps'] });
    },
  });
}

export function useDismissBlueprintStep() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { subscriptionId: string; sourceStepId: string }>({
    mutationFn: async ({ subscriptionId, sourceStepId }) => {
      await markStepAction(subscriptionId, sourceStepId, 'dismissed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blueprint-new-steps'] });
    },
  });
}

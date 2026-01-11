/**
 * useExcellenceChecklist Hook
 *
 * React Query hook for managing race checklists in the Excellence Framework.
 * Provides CRUD operations, phase progress tracking, and timeline management.
 *
 * This hook works with the race_checklist_items table and integrates with
 * the adaptive learning system for personalized items.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { RaceChecklistService } from '@/services/RaceChecklistService';
import type {
  RaceChecklistItem,
  RacePhase,
  ChecklistItemStatus,
  CreateChecklistItemInput,
  RaceTimeline,
} from '@/types/excellenceFramework';

// Query keys
const EXCELLENCE_CHECKLIST_KEYS = {
  all: ['excellence-checklist'] as const,
  race: (raceEventId: string) => [...EXCELLENCE_CHECKLIST_KEYS.all, 'race', raceEventId] as const,
  phase: (raceEventId: string, phase: RacePhase) =>
    [...EXCELLENCE_CHECKLIST_KEYS.race(raceEventId), 'phase', phase] as const,
  timeline: (raceEventId: string) =>
    [...EXCELLENCE_CHECKLIST_KEYS.race(raceEventId), 'timeline'] as const,
  personalized: (raceEventId: string) =>
    [...EXCELLENCE_CHECKLIST_KEYS.race(raceEventId), 'personalized'] as const,
  stats: (sailorId: string) => [...EXCELLENCE_CHECKLIST_KEYS.all, 'stats', sailorId] as const,
};

/**
 * Hook for managing a race's excellence checklist
 */
export function useExcellenceChecklist(raceEventId: string, phase?: RacePhase) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sailorId = user?.id;

  // Fetch checklist items
  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: phase
      ? EXCELLENCE_CHECKLIST_KEYS.phase(raceEventId, phase)
      : EXCELLENCE_CHECKLIST_KEYS.race(raceEventId),
    queryFn: async () => {
      if (!sailorId) return [];
      return RaceChecklistService.getChecklistForRace(sailorId, raceEventId, phase);
    },
    enabled: !!sailorId && !!raceEventId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: async (input: CreateChecklistItemInput) => {
      if (!sailorId) throw new Error('Not authenticated');
      return RaceChecklistService.createChecklistItem(sailorId, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXCELLENCE_CHECKLIST_KEYS.race(raceEventId) });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      itemId,
      status,
    }: {
      itemId: string;
      status: ChecklistItemStatus;
    }) => {
      return RaceChecklistService.updateChecklistStatus(itemId, status);
    },
    onMutate: async ({ itemId, status }) => {
      // Optimistic update
      const queryKey = phase
        ? EXCELLENCE_CHECKLIST_KEYS.phase(raceEventId, phase)
        : EXCELLENCE_CHECKLIST_KEYS.race(raceEventId);

      await queryClient.cancelQueries({ queryKey });

      const previousItems = queryClient.getQueryData<RaceChecklistItem[]>(queryKey);

      queryClient.setQueryData<RaceChecklistItem[]>(queryKey, (old) =>
        old?.map((item) =>
          item.id === itemId
            ? {
                ...item,
                status,
                completedAt:
                  status === 'completed' ? new Date().toISOString() : item.completedAt,
              }
            : item
        )
      );

      return { previousItems };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      const queryKey = phase
        ? EXCELLENCE_CHECKLIST_KEYS.phase(raceEventId, phase)
        : EXCELLENCE_CHECKLIST_KEYS.race(raceEventId);

      if (context?.previousItems) {
        queryClient.setQueryData(queryKey, context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: EXCELLENCE_CHECKLIST_KEYS.race(raceEventId) });
    },
  });

  // Rate outcome mutation
  const rateOutcomeMutation = useMutation({
    mutationFn: async ({
      itemId,
      rating,
      notes,
    }: {
      itemId: string;
      rating: number;
      notes?: string;
    }) => {
      return RaceChecklistService.rateChecklistOutcome(itemId, rating, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXCELLENCE_CHECKLIST_KEYS.race(raceEventId) });
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return RaceChecklistService.deleteChecklistItem(itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXCELLENCE_CHECKLIST_KEYS.race(raceEventId) });
    },
  });

  // Complete phase mutation
  const completePhaseMutation = useMutation({
    mutationFn: async (phaseToComplete: RacePhase) => {
      if (!sailorId) throw new Error('Not authenticated');
      return RaceChecklistService.completePhase(sailorId, raceEventId, phaseToComplete);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXCELLENCE_CHECKLIST_KEYS.race(raceEventId) });
    },
  });

  // Helper functions
  const createItem = (input: Omit<CreateChecklistItemInput, 'raceEventId'>) =>
    createItemMutation.mutateAsync({ ...input, raceEventId });

  const toggleItem = (item: RaceChecklistItem) => {
    const newStatus: ChecklistItemStatus =
      item.status === 'completed' ? 'pending' : 'completed';
    return updateStatusMutation.mutateAsync({ itemId: item.id, status: newStatus });
  };

  const skipItem = (itemId: string) =>
    updateStatusMutation.mutateAsync({ itemId, status: 'skipped' });

  const rateItem = (itemId: string, rating: number, notes?: string) =>
    rateOutcomeMutation.mutateAsync({ itemId, rating, notes });

  const deleteItem = (itemId: string) => deleteItemMutation.mutateAsync(itemId);

  const completePhase = (phaseToComplete: RacePhase) =>
    completePhaseMutation.mutateAsync(phaseToComplete);

  // Computed values
  const completedCount = items.filter((i) => i.status === 'completed').length;
  const totalCount = items.length;
  const completionRate = totalCount > 0 ? completedCount / totalCount : 0;

  const itemsByCategory = items.reduce(
    (acc, item) => {
      const category = item.category || 'other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, RaceChecklistItem[]>
  );

  const personalizedItems = items.filter((i) => i.isPersonalized);

  return {
    // Data
    items,
    itemsByCategory,
    personalizedItems,
    completedCount,
    totalCount,
    completionRate,

    // Loading states
    isLoading,
    error,
    isCreating: createItemMutation.isPending,
    isUpdating: updateStatusMutation.isPending,
    isDeleting: deleteItemMutation.isPending,

    // Actions
    createItem,
    toggleItem,
    skipItem,
    rateItem,
    deleteItem,
    completePhase,
    refetch,
  };
}

/**
 * Hook for race timeline (progress through all phases)
 */
export function useRaceTimeline(raceEventId: string) {
  const { user } = useAuth();
  const sailorId = user?.id;

  const {
    data: timeline,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: EXCELLENCE_CHECKLIST_KEYS.timeline(raceEventId),
    queryFn: async () => {
      if (!sailorId) return null;
      return RaceChecklistService.getRaceTimeline(sailorId, raceEventId);
    },
    enabled: !!sailorId && !!raceEventId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return {
    timeline,
    currentPhase: timeline?.currentPhase || 'prep',
    phases: timeline?.phases,
    overallProgress: timeline?.overallProgress || 0,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for personalized checklist items from adaptive learning
 */
export function usePersonalizedChecklistItems(raceEventId: string, phase?: RacePhase) {
  const { user } = useAuth();
  const sailorId = user?.id;

  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: EXCELLENCE_CHECKLIST_KEYS.personalized(raceEventId),
    queryFn: async () => {
      if (!sailorId) return [];
      return RaceChecklistService.getPersonalizedItems(sailorId, raceEventId, phase);
    },
    enabled: !!sailorId && !!raceEventId,
    staleTime: 1000 * 60 * 5,
  });

  return {
    items,
    count: items.length,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook for initializing checklist from templates
 */
export function useInitializeChecklist(raceEventId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sailorId = user?.id;

  const mutation = useMutation({
    mutationFn: async ({
      phase,
      boatClassId,
      raceType,
    }: {
      phase: RacePhase;
      boatClassId?: string;
      raceType?: 'fleet' | 'team' | 'match' | 'distance';
    }) => {
      if (!sailorId) throw new Error('Not authenticated');
      return RaceChecklistService.initializeChecklistFromTemplates(
        sailorId,
        raceEventId,
        phase,
        { boatClassId, raceType }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXCELLENCE_CHECKLIST_KEYS.race(raceEventId) });
    },
  });

  return {
    initialize: mutation.mutateAsync,
    isInitializing: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook for checklist completion stats across races
 */
export function useChecklistStats(options?: { seasonId?: string; limit?: number }) {
  const { user } = useAuth();
  const sailorId = user?.id;

  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: sailorId ? EXCELLENCE_CHECKLIST_KEYS.stats(sailorId) : ['no-user'],
    queryFn: async () => {
      if (!sailorId) return null;
      return RaceChecklistService.getCompletionStats(sailorId, options);
    },
    enabled: !!sailorId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    stats,
    isLoading,
    error,
    refetch,
  };
}

export default useExcellenceChecklist;

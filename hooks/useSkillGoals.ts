/**
 * useSkillGoals — React Query hook for user-defined skill goals.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { useInterest } from '@/providers/InterestProvider';
import {
  getSkillGoals,
  createSkillGoal,
  createSkillGoalsBatch,
  updateSkillGoal,
  archiveSkillGoal,
  syncStepReviewRatings,
  recordRating,
} from '@/services/SkillGoalService';
import type { UserSkillGoal, CreateSkillGoalInput } from '@/types/skill-goal';

function skillGoalsKey(userId?: string, interestId?: string) {
  return ['skill-goals', userId, interestId] as const;
}

export function useSkillGoals() {
  const { user } = useAuth();
  const { currentInterest } = useInterest();
  const queryClient = useQueryClient();

  const userId = user?.id;
  const interestId = currentInterest?.id;
  const key = skillGoalsKey(userId, interestId);

  const { data: skillGoals = [], isLoading, refetch } = useQuery({
    queryKey: key,
    queryFn: () => getSkillGoals(userId!, interestId!),
    enabled: !!userId && !!interestId,
    staleTime: 5 * 60 * 1000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

  const addGoal = useMutation({
    mutationFn: (input: CreateSkillGoalInput) =>
      createSkillGoal(userId!, interestId!, input),
    onSuccess: invalidate,
  });

  const addGoalsBatch = useMutation({
    mutationFn: (inputs: CreateSkillGoalInput[]) =>
      createSkillGoalsBatch(userId!, interestId!, inputs),
    onSuccess: invalidate,
  });

  const editGoal = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Pick<UserSkillGoal, 'title' | 'description' | 'category' | 'sort_order'>> }) =>
      updateSkillGoal(id, updates),
    onSuccess: invalidate,
  });

  const removeGoal = useMutation({
    mutationFn: (id: string) => archiveSkillGoal(id),
    onSuccess: invalidate,
  });

  const rateGoal = useMutation({
    mutationFn: ({ title, rating }: { title: string; rating: number }) =>
      recordRating(userId!, interestId!, title, rating),
    onMutate: async ({ title, rating }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<UserSkillGoal[]>(key);
      queryClient.setQueryData<UserSkillGoal[]>(key, (old) =>
        (old || []).map((g) =>
          g.title === title ? { ...g, current_rating: rating } : g,
        ),
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev);
    },
    onSettled: invalidate,
  });

  const syncRatings = useMutation({
    mutationFn: (capabilityProgress: Record<string, number>) =>
      syncStepReviewRatings(userId!, interestId!, capabilityProgress),
    onSuccess: invalidate,
  });

  // Group by category for display
  const byCategory = skillGoals.reduce<Record<string, UserSkillGoal[]>>((acc, goal) => {
    const cat = goal.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(goal);
    return acc;
  }, {});

  // Summary stats
  const summary = {
    total: skillGoals.length,
    rated: skillGoals.filter((g) => g.current_rating > 0).length,
    averageRating: skillGoals.length > 0
      ? skillGoals.reduce((sum, g) => sum + g.current_rating, 0) / skillGoals.length
      : 0,
  };

  return {
    skillGoals,
    byCategory,
    summary,
    isLoading,
    refetch,
    addGoal,
    addGoalsBatch,
    editGoal,
    removeGoal,
    rateGoal,
    syncRatings,
  };
}

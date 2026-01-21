/**
 * useRaceChecklist Hook
 *
 * Provides race-type-specific checklists with persistence.
 * Integrates with useRacePreparation for storing completion state.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRacePreparation } from './useRacePreparation';
import { useEquipmentFlow } from './useEquipmentFlow';
import { useAuth } from '@/providers/AuthProvider';
import {
  getChecklistItems,
  getItemsGroupedByCategory,
  getCategoriesForPhase,
} from '@/lib/checklists';
import type {
  ChecklistItem,
  ChecklistCompletion,
  RacePhase,
  ChecklistCategory,
} from '@/types/checklists';
import type { RaceType } from '@/types/raceEvents';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useRaceChecklist');

/**
 * Checklist item with completion state
 */
export interface ChecklistItemWithState extends ChecklistItem {
  isCompleted: boolean;
  completion?: ChecklistCompletion;
  isCarryover?: boolean;
  carryoverSource?: string; // Race name this issue came from
}

/**
 * Options for the useRaceChecklist hook
 */
interface UseRaceChecklistOptions {
  regattaId: string;
  raceName?: string;
  raceType: RaceType;
  phase: RacePhase;
  includeCarryover?: boolean; // Include equipment issues from previous races
  userId?: string; // User ID for equipment flow storage key
}

/**
 * Return type for the useRaceChecklist hook
 */
interface UseRaceChecklistReturn {
  // Items
  items: ChecklistItemWithState[];
  itemsByCategory: Record<ChecklistCategory, ChecklistItemWithState[]>;
  categories: ChecklistCategory[];

  // State
  completions: Record<string, ChecklistCompletion>;
  completedCount: number;
  totalCount: number;
  progress: number; // 0-1
  isLoading: boolean;
  isSaving: boolean;

  // Actions
  toggleItem: (itemId: string) => void;
  completeItem: (itemId: string, notes?: string) => void;
  uncompleteItem: (itemId: string) => void;
  resetAll: () => void;
}

/**
 * Hook to manage race-type-specific checklists
 */
export function useRaceChecklist({
  regattaId,
  raceName,
  raceType,
  phase,
  includeCarryover = true,
  userId: userIdProp,
}: UseRaceChecklistOptions): UseRaceChecklistReturn {
  const { user } = useAuth();
  // Use provided userId or fall back to auth user
  const userId = userIdProp || user?.id;

  // Get race preparation for persisting checklist state
  const { intentions, updateIntentions, isLoading, isSaving } = useRacePreparation({
    regattaId,
    autoSave: true,
    debounceMs: 500, // Faster save for checklist toggling
  });

  // Get carryover equipment issues (only for days_before phase)
  const { carryoverIssues, resolveIssue } = useEquipmentFlow({
    userId,
    currentRaceId: regattaId,
    unresolvedOnly: true,
  });

  // Get checklist completions from intentions
  const completions = useMemo(() => {
    return intentions?.checklistCompletions || {};
  }, [intentions?.checklistCompletions]);

  // Get base checklist items for this race type and phase
  const baseItems = useMemo(() => {
    return getChecklistItems(raceType, phase);
  }, [raceType, phase]);

  // Transform carryover issues to checklist items (only for days_before)
  const carryoverItems = useMemo((): ChecklistItemWithState[] => {
    if (!includeCarryover || phase !== 'days_before') {
      return [];
    }

    return carryoverIssues.map((issue) => ({
      id: `carryover_${issue.id}`,
      label: issue.description,
      priority: issue.priority,
      raceTypes: [raceType],
      phase: 'days_before' as RacePhase,
      category: 'equipment' as ChecklistCategory,
      isCompleted: !!completions[`carryover_${issue.id}`],
      completion: completions[`carryover_${issue.id}`],
      isCarryover: true,
      carryoverSource: issue.fromRaceName,
    }));
  }, [carryoverIssues, includeCarryover, phase, raceType, completions]);

  // Combine base items with completion state
  const items = useMemo((): ChecklistItemWithState[] => {
    const baseWithState: ChecklistItemWithState[] = baseItems.map((item) => ({
      ...item,
      isCompleted: !!completions[item.id],
      completion: completions[item.id],
    }));

    // Put carryover items first (in equipment section)
    return [...carryoverItems, ...baseWithState];
  }, [baseItems, carryoverItems, completions]);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped: Record<ChecklistCategory, ChecklistItemWithState[]> = {} as any;

    for (const item of items) {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    }

    return grouped;
  }, [items]);

  // Get categories in order
  const categories = useMemo(() => {
    const cats = getCategoriesForPhase(raceType, phase);
    // Add equipment if we have carryover items and it's not already there
    if (carryoverItems.length > 0 && !cats.includes('equipment')) {
      return ['equipment' as ChecklistCategory, ...cats];
    }
    return cats;
  }, [raceType, phase, carryoverItems]);

  // Calculate completion stats
  const completedCount = useMemo(() => {
    return items.filter((item) => item.isCompleted).length;
  }, [items]);

  const totalCount = items.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  /**
   * Complete a checklist item
   */
  const completeItem = useCallback(
    (itemId: string, notes?: string) => {
      if (!user?.id) {
        console.warn('[useRaceChecklist] Cannot complete item - no user ID');
        return;
      }

      const newCompletion: ChecklistCompletion = {
        itemId,
        completedAt: new Date().toISOString(),
        completedBy: user.id,
        completedByName: user.user_metadata?.full_name || user.email || 'Unknown',
        notes,
      };

      // Update intentions with new completion
      const currentCompletions = intentions?.checklistCompletions || {};
      const updatedCompletions = {
        ...currentCompletions,
        [itemId]: newCompletion,
      };

      updateIntentions({
        checklistCompletions: updatedCompletions,
      });

      // If this is a carryover item, also resolve it in equipment flow
      if (itemId.startsWith('carryover_')) {
        const originalIssueId = itemId.replace('carryover_', '');
        resolveIssue(originalIssueId, regattaId);
      }

      logger.info('Completed checklist item', { itemId, regattaId });
    },
    [user, intentions, updateIntentions, resolveIssue, regattaId]
  );

  /**
   * Uncomplete a checklist item
   */
  const uncompleteItem = useCallback(
    (itemId: string) => {
      const currentCompletions = { ...(intentions?.checklistCompletions || {}) };
      delete currentCompletions[itemId];

      updateIntentions({
        checklistCompletions: currentCompletions,
      });

      logger.info('Uncompleted checklist item', { itemId, regattaId });
    },
    [intentions, updateIntentions, regattaId]
  );

  /**
   * Toggle a checklist item
   */
  const toggleItem = useCallback(
    (itemId: string) => {
      const isCurrentlyCompleted = !!completions[itemId];

      if (isCurrentlyCompleted) {
        uncompleteItem(itemId);
      } else {
        completeItem(itemId);
      }
    },
    [completions, completeItem, uncompleteItem, regattaId]
  );

  /**
   * Reset all items to uncompleted
   */
  const resetAll = useCallback(() => {
    updateIntentions({
      checklistCompletions: {},
    });
    logger.info('Reset all checklist items', { regattaId });
  }, [updateIntentions, regattaId]);

  return {
    // Items
    items,
    itemsByCategory,
    categories,

    // State
    completions,
    completedCount,
    totalCount,
    progress,
    isLoading,
    isSaving,

    // Actions
    toggleItem,
    completeItem,
    uncompleteItem,
    resetAll,
  };
}

export default useRaceChecklist;

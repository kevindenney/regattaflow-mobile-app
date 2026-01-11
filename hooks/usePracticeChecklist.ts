/**
 * usePracticeChecklist Hook
 *
 * Manages practice session checklists with completion tracking.
 * Follows the same pattern as useRaceChecklist but for practice phases.
 *
 * Currently uses local state; will integrate with practice_intentions
 * table once the migration is applied.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import {
  getPracticeChecklistItems,
  getPracticeItemsGroupedByCategory,
  getCategoriesForPracticePhase,
  PracticeChecklistItem,
  PracticeChecklistCompletion,
} from '@/lib/checklists/practiceChecklists';
import type { PracticePhase } from '@/types/practice';
import type { ChecklistCategory } from '@/types/checklists';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('usePracticeChecklist');

// =============================================================================
// ASYNC STORAGE HELPERS
// =============================================================================

/**
 * Get AsyncStorage (cross-platform)
 */
function getAsyncStorage() {
  try {
    return require('@react-native-async-storage/async-storage').default;
  } catch {
    // Fallback for environments where AsyncStorage isn't available
    return null;
  }
}

// =============================================================================
// TYPES
// =============================================================================

/**
 * Practice checklist item with completion state
 */
export interface PracticeChecklistItemWithState extends PracticeChecklistItem {
  isCompleted: boolean;
  completion?: PracticeChecklistCompletion;
  isCarryover?: boolean;
  carryoverSource?: string; // Session name this issue came from
}

/**
 * Carryover item from a previous session
 */
export interface CarryoverItem {
  id: string;
  type: 'incomplete_drill' | 'equipment_issue' | 'learning_goal';
  label: string;
  sourceSessionId: string;
  sourceSessionName?: string;
  sourceSessionDate?: string;
  resolved: boolean;
}

/**
 * Options for the usePracticeChecklist hook
 */
interface UsePracticeChecklistOptions {
  sessionId: string;
  sessionName?: string;
  phase: PracticePhase;
  includeCarryover?: boolean;
  carryoverItems?: CarryoverItem[];
}

/**
 * Return type for the usePracticeChecklist hook
 */
interface UsePracticeChecklistReturn {
  // Items
  items: PracticeChecklistItemWithState[];
  itemsByCategory: Partial<Record<ChecklistCategory, PracticeChecklistItemWithState[]>>;
  categories: ChecklistCategory[];

  // State
  completions: Record<string, PracticeChecklistCompletion>;
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

  // Carryover actions
  resolveCarryoverItem?: (itemId: string) => void;
}

// =============================================================================
// LOCAL STORAGE KEY
// =============================================================================

const getStorageKey = (sessionId: string) =>
  `practice_checklist_${sessionId}`;

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * Hook to manage practice session checklists
 */
export function usePracticeChecklist({
  sessionId,
  sessionName,
  phase,
  includeCarryover = true,
  carryoverItems = [],
}: UsePracticeChecklistOptions): UsePracticeChecklistReturn {
  const { user } = useAuth();

  // State
  const [completions, setCompletions] = useState<
    Record<string, PracticeChecklistCompletion>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load completions from AsyncStorage on mount
  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    const loadCompletions = async () => {
      try {
        const AsyncStorage = getAsyncStorage();
        if (!AsyncStorage) {
          setIsLoading(false);
          return;
        }

        const stored = await AsyncStorage.getItem(getStorageKey(sessionId));
        if (stored) {
          const parsed = JSON.parse(stored);
          setCompletions(parsed.completions || {});
        }
      } catch (error) {
        logger.warn('Failed to load practice checklist from storage', { error });
      } finally {
        setIsLoading(false);
      }
    };

    loadCompletions();
  }, [sessionId]);

  // Save completions to AsyncStorage when they change
  useEffect(() => {
    if (isLoading || !sessionId) return;

    const saveCompletions = async () => {
      try {
        setIsSaving(true);
        const AsyncStorage = getAsyncStorage();
        if (!AsyncStorage) {
          setIsSaving(false);
          return;
        }

        await AsyncStorage.setItem(
          getStorageKey(sessionId),
          JSON.stringify({ completions })
        );
      } catch (error) {
        logger.warn('Failed to save practice checklist to storage', { error });
      } finally {
        setIsSaving(false);
      }
    };

    saveCompletions();
  }, [completions, sessionId, isLoading]);

  // Get base checklist items for this phase
  const baseItems = useMemo(() => {
    return getPracticeChecklistItems(phase);
  }, [phase]);

  // Transform carryover items to checklist items (only for prepare phase)
  const carryoverChecklistItems = useMemo((): PracticeChecklistItemWithState[] => {
    if (!includeCarryover || phase !== 'practice_prepare') {
      return [];
    }

    return carryoverItems
      .filter((item) => !item.resolved)
      .map((item) => ({
        id: `carryover_${item.id}`,
        label: item.label,
        priority: 'high' as const,
        description: `From ${item.sourceSessionName || 'previous session'}`,
        phase: 'practice_prepare' as PracticePhase,
        category: item.type === 'equipment_issue' ? 'equipment' : 'tactics',
        isCompleted: !!completions[`carryover_${item.id}`],
        completion: completions[`carryover_${item.id}`],
        isCarryover: true,
        carryoverSource: item.sourceSessionName,
      }));
  }, [carryoverItems, includeCarryover, phase, completions]);

  // Combine base items with completion state
  const items = useMemo((): PracticeChecklistItemWithState[] => {
    const baseWithState: PracticeChecklistItemWithState[] = baseItems.map(
      (item) => ({
        ...item,
        isCompleted: !!completions[item.id],
        completion: completions[item.id],
      })
    );

    // Put carryover items first
    return [...carryoverChecklistItems, ...baseWithState];
  }, [baseItems, carryoverChecklistItems, completions]);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped: Partial<Record<ChecklistCategory, PracticeChecklistItemWithState[]>> = {};

    for (const item of items) {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category]!.push(item);
    }

    return grouped;
  }, [items]);

  // Get categories in order
  const categories = useMemo(() => {
    const cats = getCategoriesForPracticePhase(phase);
    // Add equipment if we have carryover items and it's not already there
    if (
      carryoverChecklistItems.some((item) => item.category === 'equipment') &&
      !cats.includes('equipment')
    ) {
      return ['equipment' as ChecklistCategory, ...cats];
    }
    return cats;
  }, [phase, carryoverChecklistItems]);

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
      if (!user?.id) return;

      const newCompletion: PracticeChecklistCompletion = {
        itemId,
        completedAt: new Date().toISOString(),
        completedBy: user.id,
        completedByName:
          user.user_metadata?.full_name || user.email?.split('@')[0] || 'You',
        notes,
      };

      setCompletions((prev) => ({
        ...prev,
        [itemId]: newCompletion,
      }));

      logger.info('Completed practice checklist item', { itemId, sessionId });
    },
    [user, sessionId]
  );

  /**
   * Uncomplete a checklist item
   */
  const uncompleteItem = useCallback(
    (itemId: string) => {
      setCompletions((prev) => {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      });

      logger.info('Uncompleted practice checklist item', { itemId, sessionId });
    },
    [sessionId]
  );

  /**
   * Toggle a checklist item
   */
  const toggleItem = useCallback(
    (itemId: string) => {
      if (completions[itemId]) {
        uncompleteItem(itemId);
      } else {
        completeItem(itemId);
      }
    },
    [completions, completeItem, uncompleteItem]
  );

  /**
   * Reset all items to uncompleted
   */
  const resetAll = useCallback(() => {
    setCompletions({});
    logger.info('Reset all practice checklist items', { sessionId });
  }, [sessionId]);

  /**
   * Resolve a carryover item
   */
  const resolveCarryoverItem = useCallback(
    (itemId: string) => {
      // Complete the carryover item in our checklist
      completeItem(`carryover_${itemId}`);

      // TODO: When persistence is added, also update the original session's
      // carryover items to mark as resolved
      logger.info('Resolved carryover item', { itemId, sessionId });
    },
    [completeItem, sessionId]
  );

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

    // Carryover actions
    resolveCarryoverItem,
  };
}

export default usePracticeChecklist;

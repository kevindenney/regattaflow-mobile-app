/**
 * useTeamChecklist Hook
 *
 * Manages shared team checklist state with real-time sync.
 * Uses Supabase Realtime for instant updates across teammates.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { teamRaceEntryService } from '@/services/TeamRaceEntryService';
import {
  TeamRaceChecklistState,
  TeamChecklistCompletion,
} from '@/types/teamRacing';
import { getChecklistItems } from '@/lib/checklists';
import type { ChecklistItem, RacePhase } from '@/types/checklists';
import type { RaceType } from '@/types/raceEvents';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useTeamChecklist');

/**
 * Checklist item with team completion state
 */
export interface TeamChecklistItemWithState extends ChecklistItem {
  isCompleted: boolean;
  completion?: TeamChecklistCompletion;
}

interface UseTeamChecklistOptions {
  teamEntryId: string | null;
  raceType: RaceType;
  phase: RacePhase;
}

interface UseTeamChecklistReturn {
  // Items
  items: TeamChecklistItemWithState[];
  completions: Record<string, TeamChecklistCompletion>;

  // Stats
  completedCount: number;
  totalCount: number;
  progress: number;

  // State
  isLoading: boolean;
  isSyncing: boolean;
  error: Error | null;

  // Actions
  toggleItem: (itemId: string) => Promise<void>;
  completeItem: (itemId: string, notes?: string) => Promise<void>;
  uncompleteItem: (itemId: string) => Promise<void>;
  resetAll: () => Promise<void>;
}

/**
 * Hook for managing team checklist with real-time sync
 */
export function useTeamChecklist({
  teamEntryId,
  raceType,
  phase,
}: UseTeamChecklistOptions): UseTeamChecklistReturn {
  const { user } = useAuth();

  // State
  const [checklistState, setChecklistState] = useState<TeamRaceChecklistState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get base checklist items for this race type and phase
  const baseItems = useMemo(() => {
    return getChecklistItems(raceType, phase);
  }, [raceType, phase]);

  // Get completions from state
  const completions = useMemo(() => {
    return checklistState?.checklistState || {};
  }, [checklistState]);

  // Combine base items with completion state
  const items = useMemo((): TeamChecklistItemWithState[] => {
    return baseItems.map((item) => ({
      ...item,
      isCompleted: !!completions[item.id],
      completion: completions[item.id],
    }));
  }, [baseItems, completions]);

  // Stats
  const completedCount = useMemo(() => {
    return items.filter((item) => item.isCompleted).length;
  }, [items]);

  const totalCount = items.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  /**
   * Load initial checklist state
   */
  const loadChecklistState = useCallback(async () => {
    if (!teamEntryId) {
      setChecklistState(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const state = await teamRaceEntryService.getChecklistState(teamEntryId);
      setChecklistState(state);
    } catch (err) {
      logger.error('Failed to load checklist state:', err);
      setError(err instanceof Error ? err : new Error('Failed to load checklist'));
    } finally {
      setIsLoading(false);
    }
  }, [teamEntryId]);

  /**
   * Complete a checklist item
   */
  const completeItem = useCallback(
    async (itemId: string, notes?: string): Promise<void> => {
      if (!teamEntryId || !user?.id) return;

      const completion: TeamChecklistCompletion = {
        itemId,
        completedAt: new Date().toISOString(),
        completedBy: user.id,
        completedByName: user.user_metadata?.full_name || user.email || 'Unknown',
        notes,
      };

      // Optimistic update
      setChecklistState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          checklistState: {
            ...prev.checklistState,
            [itemId]: completion,
          },
        };
      });

      try {
        setIsSyncing(true);
        await teamRaceEntryService.updateChecklistItem(teamEntryId, itemId, completion);
        logger.info('Completed team checklist item', { teamEntryId, itemId });
      } catch (err) {
        // Revert on error
        await loadChecklistState();
        logger.error('Failed to complete item:', err);
        throw err;
      } finally {
        setIsSyncing(false);
      }
    },
    [teamEntryId, user, loadChecklistState]
  );

  /**
   * Uncomplete a checklist item
   */
  const uncompleteItem = useCallback(
    async (itemId: string): Promise<void> => {
      if (!teamEntryId) return;

      // Optimistic update
      setChecklistState((prev) => {
        if (!prev) return prev;
        const newState = { ...prev.checklistState };
        delete newState[itemId];
        return {
          ...prev,
          checklistState: newState,
        };
      });

      try {
        setIsSyncing(true);
        await teamRaceEntryService.updateChecklistItem(teamEntryId, itemId, null);
        logger.info('Uncompleted team checklist item', { teamEntryId, itemId });
      } catch (err) {
        // Revert on error
        await loadChecklistState();
        logger.error('Failed to uncomplete item:', err);
        throw err;
      } finally {
        setIsSyncing(false);
      }
    },
    [teamEntryId, loadChecklistState]
  );

  /**
   * Toggle a checklist item
   */
  const toggleItem = useCallback(
    async (itemId: string): Promise<void> => {
      if (completions[itemId]) {
        await uncompleteItem(itemId);
      } else {
        await completeItem(itemId);
      }
    },
    [completions, completeItem, uncompleteItem]
  );

  /**
   * Reset all items
   */
  const resetAll = useCallback(async (): Promise<void> => {
    if (!teamEntryId) return;

    try {
      setIsSyncing(true);
      await teamRaceEntryService.resetChecklist(teamEntryId);
      setChecklistState((prev) =>
        prev ? { ...prev, checklistState: {} } : null
      );
      logger.info('Reset team checklist', { teamEntryId });
    } catch (err) {
      logger.error('Failed to reset checklist:', err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [teamEntryId]);

  // Load checklist state on mount
  useEffect(() => {
    loadChecklistState();
  }, [loadChecklistState]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!teamEntryId) return;

    const unsubscribe = teamRaceEntryService.subscribeToChecklistChanges(
      teamEntryId,
      (state) => {
        setChecklistState(state);
        logger.info('Received real-time checklist update', { teamEntryId });
      }
    );

    return unsubscribe;
  }, [teamEntryId]);

  return {
    // Items
    items,
    completions,

    // Stats
    completedCount,
    totalCount,
    progress,

    // State
    isLoading,
    isSyncing,
    error,

    // Actions
    toggleItem,
    completeItem,
    uncompleteItem,
    resetAll,
  };
}

export default useTeamChecklist;

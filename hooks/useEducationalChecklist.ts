/**
 * useEducationalChecklist Hook
 *
 * Manages state for educational checklists including:
 * - Loading completion status from Supabase
 * - Toggling item completion with optimistic updates
 * - Calculating progress for each section
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import { logger } from '@/lib/utils/logger';
import type { EducationalChecklistItem } from '@/types/checklists';

interface UseEducationalChecklistOptions {
  raceId: string;
  userId: string | undefined;
  sectionId: string;
  items: EducationalChecklistItem[];
}

interface UseEducationalChecklistReturn {
  /** Map of item ID to completion status */
  completions: Map<string, boolean>;
  /** Toggle completion status for an item */
  toggleCompletion: (itemId: string) => Promise<void>;
  /** Check if an item is completed */
  isCompleted: (itemId: string) => boolean;
  /** Get progress as a fraction (0-1) */
  progress: number;
  /** Number of completed items */
  completedCount: number;
  /** Total number of items */
  totalCount: number;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
}

// Storage key for local persistence
const STORAGE_KEY_PREFIX = 'educational_checklist_';

/**
 * Get storage key for a race/section combination
 */
function getStorageKey(raceId: string, sectionId: string): string {
  return `${STORAGE_KEY_PREFIX}${raceId}_${sectionId}`;
}

/**
 * Load completions from local storage
 */
function loadFromLocalStorage(raceId: string, sectionId: string): Set<string> {
  try {
    if (typeof localStorage === 'undefined') return new Set();
    const key = getStorageKey(raceId, sectionId);
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Set(parsed);
    }
  } catch (e) {
    // Ignore storage errors
  }
  return new Set();
}

/**
 * Save completions to local storage
 */
function saveToLocalStorage(raceId: string, sectionId: string, completions: Set<string>): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const key = getStorageKey(raceId, sectionId);
    localStorage.setItem(key, JSON.stringify([...completions]));
  } catch (e) {
    // Ignore storage errors
  }
}

export function useEducationalChecklist({
  raceId,
  userId,
  sectionId,
  items,
}: UseEducationalChecklistOptions): UseEducationalChecklistReturn {
  const [completions, setCompletions] = useState<Set<string>>(() =>
    loadFromLocalStorage(raceId, sectionId)
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load completions from Supabase on mount
  useEffect(() => {
    if (!userId || !raceId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadCompletions() {
      try {
        setIsLoading(true);
        setError(null);

        // Query completions from database
        const { data, error: dbError } = await supabase
          .from('educational_checklist_completions')
          .select('item_id, completed_at')
          .eq('race_id', raceId)
          .eq('user_id', userId)
          .eq('section_id', sectionId);

        if (dbError) {
          // Table might not exist yet, fall back to local storage
          logger.warn('Failed to load educational checklist completions', { error: dbError });
          return;
        }

        if (isMounted && data) {
          const completedIds = new Set(data.map((row) => row.item_id));
          setCompletions(completedIds);
          saveToLocalStorage(raceId, sectionId, completedIds);
        }
      } catch (err) {
        if (isMounted) {
          logger.error('Error loading educational checklist completions', { error: err });
          // Keep local storage data on error
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCompletions();

    return () => {
      isMounted = false;
    };
  }, [raceId, userId, sectionId]);

  // Toggle completion with optimistic update
  const toggleCompletion = useCallback(
    async (itemId: string) => {
      const wasCompleted = completions.has(itemId);
      const newCompletions = new Set(completions);

      // Optimistic update
      if (wasCompleted) {
        newCompletions.delete(itemId);
      } else {
        newCompletions.add(itemId);
      }
      setCompletions(newCompletions);
      saveToLocalStorage(raceId, sectionId, newCompletions);

      // Skip database update if no user
      if (!userId) {
        return;
      }

      try {
        if (wasCompleted) {
          // Delete completion record
          const { error: dbError } = await supabase
            .from('educational_checklist_completions')
            .delete()
            .eq('race_id', raceId)
            .eq('user_id', userId)
            .eq('section_id', sectionId)
            .eq('item_id', itemId);

          if (dbError) {
            logger.warn('Failed to delete checklist completion', { error: dbError });
          }
        } else {
          // Insert completion record
          const { error: dbError } = await supabase
            .from('educational_checklist_completions')
            .upsert({
              race_id: raceId,
              user_id: userId,
              section_id: sectionId,
              item_id: itemId,
              completed_at: new Date().toISOString(),
            });

          if (dbError) {
            logger.warn('Failed to save checklist completion', { error: dbError });
          }
        }
      } catch (err) {
        // Revert on error
        logger.error('Error toggling checklist completion', { error: err });
        setCompletions(completions);
        saveToLocalStorage(raceId, sectionId, completions);
      }
    },
    [completions, raceId, userId, sectionId]
  );

  // Check if item is completed
  const isCompleted = useCallback(
    (itemId: string) => completions.has(itemId),
    [completions]
  );

  // Calculate progress
  const completedCount = completions.size;
  const totalCount = items.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  // Convert Set to Map for return value
  const completionsMap = useMemo(() => {
    const map = new Map<string, boolean>();
    items.forEach((item) => {
      map.set(item.id, completions.has(item.id));
    });
    return map;
  }, [items, completions]);

  return {
    completions: completionsMap,
    toggleCompletion,
    isCompleted,
    progress,
    completedCount,
    totalCount,
    isLoading,
    error,
  };
}

export default useEducationalChecklist;

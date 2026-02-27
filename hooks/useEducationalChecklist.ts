/**
 * useEducationalChecklist Hook
 *
 * Manages state for educational checklists including:
 * - Loading completion status from Supabase
 * - Toggling item completion with optimistic updates
 * - Calculating progress for each section
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { supabase } from '@/services/supabase';
import { logger } from '@/lib/utils/logger';
import { isMissingIdColumn } from '@/lib/utils/supabaseSchemaFallback';
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
  const completionsRef = useRef<Set<string>>(new Set(completions));
  const isMountedRef = useRef(true);
  const loadRunIdRef = useRef(0);
  const activeContextRef = useRef(`${raceId}|${userId ?? ''}|${sectionId}`);

  useEffect(() => {
    completionsRef.current = completions;
  }, [completions]);

  useEffect(() => {
    activeContextRef.current = `${raceId}|${userId ?? ''}|${sectionId}`;
  }, [raceId, userId, sectionId]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      loadRunIdRef.current += 1;
    };
  }, []);

  // Load completions from Supabase on mount
  useEffect(() => {
    if (!userId || !raceId) {
      const localCompletions = loadFromLocalStorage(raceId, sectionId);
      setCompletions(localCompletions);
      completionsRef.current = new Set(localCompletions);
      setError(null);
      setIsLoading(false);
      return;
    }

    async function loadCompletions() {
      const runId = ++loadRunIdRef.current;
      const contextKey = `${raceId}|${userId ?? ''}|${sectionId}`;
      const canCommit = () =>
        isMountedRef.current &&
        runId === loadRunIdRef.current &&
        activeContextRef.current === contextKey;
      try {
        if (!canCommit()) return;
        setIsLoading(true);
        setError(null);

        // Query completions from database
        let data: { item_id: string; completed_at: string }[] | null = null;
        let dbError: any = null;

        const primaryLoad = await supabase
          .from('educational_checklist_completions')
          .select('item_id, completed_at')
          .eq('race_id', raceId)
          .eq('user_id', userId)
          .eq('section_id', sectionId);
        data = primaryLoad.data;
        dbError = primaryLoad.error;

        if (isMissingIdColumn(dbError, 'educational_checklist_completions', 'race_id')) {
          const fallbackLoad = await supabase
            .from('educational_checklist_completions')
            .select('item_id, completed_at')
            .eq('regatta_id', raceId)
            .eq('user_id', userId)
            .eq('section_id', sectionId);
          data = fallbackLoad.data;
          dbError = fallbackLoad.error;
        }

        if (dbError) {
          // Table might not exist yet, fall back to local storage
          logger.warn('Failed to load educational checklist completions', { error: dbError });
          return;
        }

        if (canCommit() && data) {
          const completedIds = new Set(data.map((row) => row.item_id));
          setCompletions(completedIds);
          saveToLocalStorage(raceId, sectionId, completedIds);
        }
      } catch (err) {
        if (canCommit()) {
          logger.error('Error loading educational checklist completions', { error: err });
          // Keep local storage data on error
        }
      } finally {
        if (canCommit()) {
          setIsLoading(false);
        }
      }
    }

    void loadCompletions();
  }, [raceId, userId, sectionId]);

  // Toggle completion with optimistic update
  const toggleCompletion = useCallback(
    async (itemId: string) => {
      const previousCompletions = new Set(completionsRef.current);
      const wasCompleted = previousCompletions.has(itemId);
      const newCompletions = new Set(previousCompletions);

      // Optimistic update
      if (!isMountedRef.current) return;
      if (wasCompleted) {
        newCompletions.delete(itemId);
      } else {
        newCompletions.add(itemId);
      }
      setCompletions(newCompletions);
      completionsRef.current = new Set(newCompletions);
      saveToLocalStorage(raceId, sectionId, newCompletions);

      // Skip database update if no user
      if (!userId) {
        return;
      }

      try {
        if (wasCompleted) {
          // Delete completion record
          let dbError: any = null;
          const primaryDelete = await supabase
            .from('educational_checklist_completions')
            .delete()
            .eq('race_id', raceId)
            .eq('user_id', userId)
            .eq('section_id', sectionId)
            .eq('item_id', itemId);
          dbError = primaryDelete.error;

          if (isMissingIdColumn(dbError, 'educational_checklist_completions', 'race_id')) {
            const fallbackDelete = await supabase
              .from('educational_checklist_completions')
              .delete()
              .eq('regatta_id', raceId)
              .eq('user_id', userId)
              .eq('section_id', sectionId)
              .eq('item_id', itemId);
            dbError = fallbackDelete.error;
          }

          if (dbError) {
            logger.warn('Failed to delete checklist completion', { error: dbError });
          }
        } else {
          // Insert completion record
          let dbError: any = null;
          const primaryUpsert = await supabase
            .from('educational_checklist_completions')
            .upsert({
              race_id: raceId,
              user_id: userId,
              section_id: sectionId,
              item_id: itemId,
              completed_at: new Date().toISOString(),
            });
          dbError = primaryUpsert.error;

          if (isMissingIdColumn(dbError, 'educational_checklist_completions', 'race_id')) {
            const fallbackUpsert = await supabase
              .from('educational_checklist_completions')
              .upsert({
                regatta_id: raceId,
                user_id: userId,
                section_id: sectionId,
                item_id: itemId,
                completed_at: new Date().toISOString(),
              });
            dbError = fallbackUpsert.error;
          }

          if (dbError) {
            logger.warn('Failed to save checklist completion', { error: dbError });
          }
        }
      } catch (err) {
        // Revert on error
        logger.error('Error toggling checklist completion', { error: err });
        if (!isMountedRef.current) return;
        setCompletions(previousCompletions);
        completionsRef.current = new Set(previousCompletions);
        saveToLocalStorage(raceId, sectionId, previousCompletions);
      }
    },
    [raceId, userId, sectionId]
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

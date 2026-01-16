/**
 * useRaceStrategyNotes
 *
 * Hook for loading and persisting user strategy plans for a race.
 * Uses the strategy_entries table in Supabase.
 */

import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import type { StrategyPhase, StrategySectionId } from '@/types/raceStrategy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY_PREFIX = 'demo_strategy_';

interface StrategyEntry {
  id: string;
  phase: string;
  plan: Record<string, string>; // section field -> user plan text
  updated_at: string;
}

interface UseRaceStrategyNotesResult {
  /** User plans keyed by section ID */
  plans: Record<string, string>;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Update a specific section's plan */
  updatePlan: (sectionId: StrategySectionId, plan: string) => Promise<void>;
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
}

/**
 * Parse section ID into phase and field
 */
function parseSectionId(sectionId: StrategySectionId): { phase: StrategyPhase; field: string } {
  const [phase, field] = sectionId.split('.') as [StrategyPhase, string];
  return { phase, field };
}

/**
 * Debounce helper for auto-saving
 */
function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay]
  );
}



const isValidUUID = (id: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export function useRaceStrategyNotes(raceId: string | undefined): UseRaceStrategyNotesResult {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track entries by phase for updates
  const entriesRef = useRef<Record<string, StrategyEntry>>({});

  // Load existing strategy entries for this race
  useEffect(() => {
    // For demo/guest users, we allow loading without user.id if it's a demo race
    const isDemoRace = !isValidUUID(raceId || '');

    if (!raceId || (!user && !isDemoRace)) {
      setPlans({});
      return;
    }

    const loadPlans = async () => {
      setIsLoading(true);
      setError(null);

      // Handle non-UUID race IDs (demo races) with local storage
      if (isDemoRace) {
        try {
          const userId = user?.id || 'guest';
          const key = `${STORAGE_KEY_PREFIX}${raceId}_${userId}`;
          const saved = await AsyncStorage.getItem(key);
          if (saved) {
            setPlans(JSON.parse(saved));
          } else {
            setPlans({});
          }
        } catch (err) {
          console.error('[useRaceStrategyNotes] AsyncStorage load error', err);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('strategy_entries')
          .select('*')
          .eq('domain', 'race')
          .eq('entity_id', raceId);

        if (fetchError) throw fetchError;

        // Build plans map from entries
        const loadedPlans: Record<string, string> = {};
        const entries: Record<string, StrategyEntry> = {};

        for (const entry of (data || []) as StrategyEntry[]) {
          entries[entry.phase] = entry;
          if (entry.plan && typeof entry.plan === 'object') {
            for (const [field, planText] of Object.entries(entry.plan)) {
              const sectionId = `${entry.phase}.${field}`;
              if (planText && typeof planText === 'string') {
                loadedPlans[sectionId] = planText;
              }
            }
          }
        }

        entriesRef.current = entries;
        setPlans(loadedPlans);
      } catch (err) {
        console.error('[useRaceStrategyNotes] Failed to load plans:', err);
        setError(err instanceof Error ? err.message : 'Failed to load strategy plans');
      } finally {
        setIsLoading(false);
      }
    };

    loadPlans();
  }, [raceId, user]);

  // Save a plan to the database (or local storage for demo)
  const savePlan = useCallback(
    async (sectionId: StrategySectionId, planText: string) => {
      const isDemoRace = !isValidUUID(raceId || '');
      if (!raceId || (!user && !isDemoRace)) {
        return;
      }

      const { phase, field } = parseSectionId(sectionId);

      // Handle non-UUID race IDs (demo races) with local storage
      if (isDemoRace) {
        console.log('[useRaceStrategyNotes] Saving to AsyncStorage for demo race');
        try {
          const userId = user?.id || 'guest';
          const key = `${STORAGE_KEY_PREFIX}${raceId}_${userId}`;

          // Get existing or init new
          const existingStr = await AsyncStorage.getItem(key);
          const existing = existingStr ? JSON.parse(existingStr) : {};

          const updated = {
            ...existing,
            [sectionId]: planText
          };

          await AsyncStorage.setItem(key, JSON.stringify(updated));
          setHasUnsavedChanges(false);
        } catch (err) {
          console.error('[useRaceStrategyNotes] AsyncStorage save error', err);
        }
        return;
      }

    },
    [raceId, user]
  );

  // Debounced save (500ms delay)
  const debouncedSave = useDebouncedCallback(savePlan, 500);

  // Update plan with optimistic local update + debounced save
  const updatePlan = useCallback(
    async (sectionId: StrategySectionId, planText: string) => {
      // Optimistic local update
      setPlans((prev) => ({ ...prev, [sectionId]: planText }));
      setHasUnsavedChanges(true);

      // Debounced save to database
      debouncedSave(sectionId, planText);
    },
    [debouncedSave, raceId]
  );

  return {
    plans,
    isLoading,
    error,
    updatePlan,
    hasUnsavedChanges,
  };
}

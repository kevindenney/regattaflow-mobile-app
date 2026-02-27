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
import { createLogger } from '@/lib/utils/logger';

const STORAGE_KEY_PREFIX = 'demo_strategy_';
const logger = createLogger('useRaceStrategyNotes');

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

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
  const isMountedRef = useRef(true);
  const activeRaceIdRef = useRef(raceId);
  const activeUserIdRef = useRef(user?.id);
  const loadRunIdRef = useRef(0);
  const saveRunIdRef = useRef(0);

  useEffect(() => {
    activeRaceIdRef.current = raceId;
    activeUserIdRef.current = user?.id;
  }, [raceId, user?.id]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      loadRunIdRef.current += 1;
      saveRunIdRef.current += 1;
    };
  }, []);

  // Load existing strategy entries for this race
  useEffect(() => {
    // For demo/guest users, we allow loading without user.id if it's a demo race
    const isDemoRace = !isValidUUID(raceId || '');

    if (!raceId || (!user && !isDemoRace)) {
      setPlans({});
      return;
    }

    const loadPlans = async () => {
      const activeRaceId = raceId;
      const activeUserId = user?.id || null;
      const runId = ++loadRunIdRef.current;
      const canCommit = () =>
        isMountedRef.current &&
        runId === loadRunIdRef.current &&
        activeRaceIdRef.current === activeRaceId &&
        (activeUserIdRef.current || null) === activeUserId;

      if (canCommit()) setIsLoading(true);
      if (canCommit()) setError(null);

      // Handle non-UUID race IDs (demo races) with local storage
      if (isDemoRace) {
        try {
          const userId = user?.id || 'guest';
          const key = `${STORAGE_KEY_PREFIX}${raceId}_${userId}`;
          const saved = await AsyncStorage.getItem(key);
          if (!canCommit()) return;
          if (saved) {
            setPlans(JSON.parse(saved));
          } else {
            setPlans({});
          }
        } catch (err) {
          logger.error('AsyncStorage load error', err);
        } finally {
          if (canCommit()) setIsLoading(false);
        }
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('strategy_entries')
          .select('*')
          .eq('domain', 'race')
          .eq('entity_id', raceId);

        if (!canCommit()) return;
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

        if (!canCommit()) return;
        entriesRef.current = entries;
        setPlans(loadedPlans);
      } catch (err) {
        logger.error('Failed to load plans', err);
        if (canCommit()) {
          setError(err instanceof Error ? err.message : 'Failed to load strategy plans');
        }
      } finally {
        if (canCommit()) setIsLoading(false);
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

      const activeRaceId = raceId;
      const activeUserId = user?.id || null;
      const runId = ++saveRunIdRef.current;
      const canCommit = () =>
        isMountedRef.current &&
        runId === saveRunIdRef.current &&
        activeRaceIdRef.current === activeRaceId &&
        (activeUserIdRef.current || null) === activeUserId;

      const { phase, field } = parseSectionId(sectionId);

      // Handle non-UUID race IDs (demo races) with local storage
      if (isDemoRace) {
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
          if (canCommit()) setHasUnsavedChanges(false);
        } catch (err) {
          logger.error('AsyncStorage save error', err);
        }
        return;
      }

      try {
        const existingEntry = entriesRef.current[phase];
        const nextPhasePlan = {
          ...(existingEntry?.plan || {}),
        };

        const normalizedPlanText = planText.trim();
        if (normalizedPlanText.length === 0) {
          delete nextPhasePlan[field];
        } else {
          nextPhasePlan[field] = planText;
        }

        if (existingEntry?.id) {
          const { data: updatedEntry, error: updateError } = await supabase
            .from('strategy_entries')
            .update({
              plan: nextPhasePlan,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingEntry.id)
            .select('id, phase, plan, updated_at')
            .single();

          if (updateError) throw updateError;
          if (!canCommit()) return;
          entriesRef.current[phase] = updatedEntry as StrategyEntry;
          setHasUnsavedChanges(false);
          return;
        }

        const { data: insertedEntry, error: insertError } = await supabase
          .from('strategy_entries')
          .insert({
            domain: 'race',
            entity_id: raceId,
            phase,
            plan: nextPhasePlan,
          })
          .select('id, phase, plan, updated_at')
          .single();

        if (insertError) throw insertError;
        if (!canCommit()) return;
        entriesRef.current[phase] = insertedEntry as StrategyEntry;
        setHasUnsavedChanges(false);
      } catch (err) {
        logger.error('Failed to save plan', err);
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
    [debouncedSave]
  );

  return {
    plans,
    isLoading,
    error,
    updatePlan,
    hasUnsavedChanges,
  };
}

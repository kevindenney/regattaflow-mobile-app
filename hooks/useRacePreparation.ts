import { createLogger } from '@/lib/utils/logger';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspaceDomain } from '@/hooks/useWorkspaceDomain';
import {
  sailorRacePreparationService,
  type RaceBriefData,
  type RegulatoryAcknowledgements,
  type SailorRacePreparation,
} from '@/services/SailorRacePreparationService';
import { DemoRaceService } from '@/services/DemoRaceService';
import type {
  ArrivalTimeIntention,
  CourseSelectionIntention,
  RaceIntentions,
  RaceIntentionUpdate,
  RigIntentions,
  SailSelectionIntention,
  StrategyNotes,
} from '@/types/raceIntentions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const logger = createLogger('useRacePreparation');

const STORAGE_KEY_PREFIX = 'demo_race_prep_';

/**
 * Validates if a string is a valid UUID format
 */
const isValidUUID = (id: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const DEFAULT_INTENTIONS: RaceIntentions = {
  updatedAt: new Date().toISOString(),
};

/**
 * Deep merges intention updates, preserving nested fields from concurrent updates.
 * This prevents race conditions where one caller's update overwrites another's.
 *
 * NOTE: checklistCompletions is a special case - it uses full replacement instead of
 * merge because deletions (uncompleting items) need to be preserved. Object spread
 * doesn't remove keys, so we need to use the source value directly.
 */
function deepMergeIntentions(
  target: RaceIntentions,
  source: RaceIntentionUpdate
): RaceIntentions {
  const result = { ...target };

  for (const key of Object.keys(source) as (keyof RaceIntentionUpdate)[]) {
    const sourceValue = source[key];
    const targetValue = result[key as keyof RaceIntentions];

    // checklistCompletions needs full replacement to support deletions (unchecking items)
    // Object spread doesn't remove keys, so we can't merge here
    if (key === 'checklistCompletions') {
      result[key as keyof RaceIntentions] = sourceValue as any;
    } else if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
      // Deep merge nested objects (strategyBrief, etc.)
      result[key as keyof RaceIntentions] = {
        ...(targetValue as object || {}),
        ...sourceValue,
      } as any;
    } else if (sourceValue !== undefined) {
      // Direct assignment for primitives and arrays
      result[key as keyof RaceIntentions] = sourceValue as any;
    }
  }

  return result;
}

interface UseRacePreparationOptions {
  regattaId: string | null;
  autoSave?: boolean;
  debounceMs?: number;
}

interface UseRacePreparationReturn {
  // State
  rigNotes: string;
  selectedRigPresetId: string | null;
  acknowledgements: RegulatoryAcknowledgements;
  raceBriefData: RaceBriefData | null;
  intentions: RaceIntentions;
  isLoading: boolean;
  /** True only on the first load (before any data is available) */
  isInitialLoading: boolean;
  /** True if we have cached/loaded data (even if currently refreshing) */
  hasData: boolean;
  isSaving: boolean;

  // Actions
  setRigNotes: (notes: string) => void;
  setSelectedRigPresetId: (id: string | null) => void;
  setAcknowledgements: (acks: RegulatoryAcknowledgements) => void;
  toggleAcknowledgement: (key: keyof RegulatoryAcknowledgements) => void;
  updateRaceBrief: (data: RaceBriefData) => void;
  updateIntentions: (update: RaceIntentionUpdate) => void;
  updateArrivalIntention: (arrival: ArrivalTimeIntention) => void;
  updateSailSelection: (sails: SailSelectionIntention) => void;
  updateRigIntentions: (rig: RigIntentions) => void;
  updateCourseSelection: (course: CourseSelectionIntention) => void;
  updateStrategyNote: (sectionId: string, note: string) => void;
  save: () => Promise<void>;
  refresh: () => Promise<void>;
}

const DEFAULT_ACKNOWLEDGEMENTS: RegulatoryAcknowledgements = {
  cleanRegatta: false,
  signOn: false,
  safetyBriefing: false,
};

/**
 * Hook to manage sailor race preparation data with automatic persistence
 */
export function useRacePreparation({
  regattaId,
  autoSave = true,
  debounceMs = 1000,
}: UseRacePreparationOptions): UseRacePreparationReturn {
  const { user } = useAuth();
  const { isSailingDomain } = useWorkspaceDomain();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // State
  const [rigNotes, setRigNotesState] = useState('');
  const [selectedRigPresetId, setSelectedRigPresetIdState] = useState<string | null>(null);
  const [acknowledgements, setAcknowledgements] = useState<RegulatoryAcknowledgements>(
    DEFAULT_ACKNOWLEDGEMENTS
  );
  const [raceBriefData, setRaceBriefData] = useState<RaceBriefData | null>(null);
  const [intentions, setIntentions] = useState<RaceIntentions>(DEFAULT_INTENTIONS);

  // Refs for debouncing and tracking load state
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const pendingChangesRef = useRef<Partial<SailorRacePreparation>>({});
  /** Tracks if we've completed initial load - used to prevent loading flicker on subsequent refreshes */
  const hasLoadedOnceRef = useRef(false);
  const isMountedRef = useRef(true);
  const loadRunIdRef = useRef(0);
  const saveRunIdRef = useRef(0);
  const activeRegattaIdRef = useRef<string | null>(regattaId);
  const activeUserIdRef = useRef<string | undefined>(user?.id);

  useEffect(() => {
    activeRegattaIdRef.current = regattaId;
    activeUserIdRef.current = user?.id;
  }, [regattaId, user?.id]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      loadRunIdRef.current += 1;
      saveRunIdRef.current += 1;
    };
  }, []);

  /**
   * Load preparation data from Supabase or AsyncStorage
   */
  const loadPreparation = useCallback(async () => {
    const runId = ++loadRunIdRef.current;
    const targetRegattaId = regattaId;
    const targetUserId = user?.id;
    const canCommit = () =>
      isMountedRef.current &&
      runId === loadRunIdRef.current &&
      activeRegattaIdRef.current === targetRegattaId &&
      activeUserIdRef.current === targetUserId;

    if (!isSailingDomain) {
      if (!canCommit()) return;
      setRigNotesState('');
      setSelectedRigPresetIdState(null);
      setAcknowledgements(DEFAULT_ACKNOWLEDGEMENTS);
      setRaceBriefData(null);
      setIntentions(DEFAULT_INTENTIONS);
      setIsLoading(false);
      hasLoadedOnceRef.current = true;
      return;
    }

    if (!targetRegattaId) {
      if (!canCommit()) return;
      setRigNotesState('');
      setSelectedRigPresetIdState(null);
      setAcknowledgements(DEFAULT_ACKNOWLEDGEMENTS);
      setRaceBriefData(null);
      setIntentions(DEFAULT_INTENTIONS);
      setIsLoading(false);
      return;
    }

    // Clear any pending changes to prevent race conditions where an in-flight
    // save (from unmount cleanup) could overwrite freshly loaded data
    pendingChangesRef.current = {};

    // Only show loading UI on first load - background refresh keeps existing data visible
    if (!hasLoadedOnceRef.current) {
      if (!canCommit()) return;
      setIsLoading(true);
    }

    // Handle non-UUID race IDs (demo races) with local storage
    if (!isValidUUID(targetRegattaId)) {
      try {
        const demoUserId = targetUserId || 'guest';
        const key = `${STORAGE_KEY_PREFIX}${targetRegattaId}_${demoUserId}`;
        const saved = await AsyncStorage.getItem(key);
        if (!canCommit()) return;
        if (saved) {
          const data = JSON.parse(saved);
          const existingIntentions = data.user_intentions;

          // Check if existing data is essentially empty (no checklist completions)
          const hasCompletions = existingIntentions?.checklistCompletions &&
            Object.keys(existingIntentions.checklistCompletions).length > 0;

          // If existing data is empty, try to seed with demo data
          if (!hasCompletions) {
            const seededData = DemoRaceService.getDemoRacePreparation(targetRegattaId);
            if (seededData) {
              logger.info('Seeding demo race with preparation data (existing was empty)');
              if (!canCommit()) return;
              setIntentions(seededData);
              // Update AsyncStorage with seeded data
              await AsyncStorage.setItem(key, JSON.stringify({
                ...data,
                user_intentions: seededData,
                updated_at: new Date().toISOString()
              }));
            } else {
              // Not a seeded demo race, use existing empty data
              if (!canCommit()) return;
              setRigNotesState(data.rig_notes || '');
              setSelectedRigPresetIdState(data.selected_rig_preset_id || null);
              setAcknowledgements(data.regulatory_acknowledgements || DEFAULT_ACKNOWLEDGEMENTS);
              setRaceBriefData(data.race_brief_data || null);
              setIntentions(existingIntentions || DEFAULT_INTENTIONS);
            }
          } else {
            // Existing data has completions, use it
            if (!canCommit()) return;
            setRigNotesState(data.rig_notes || '');
            setSelectedRigPresetIdState(data.selected_rig_preset_id || null);
            setAcknowledgements(data.regulatory_acknowledgements || DEFAULT_ACKNOWLEDGEMENTS);
            setRaceBriefData(data.race_brief_data || null);
            setIntentions(existingIntentions);
            logger.info('Loaded demo race preparation data from local storage');
          }
        } else {
          // No existing data - check for seeded demo data
          const seededData = DemoRaceService.getDemoRacePreparation(targetRegattaId);
          if (seededData) {
            logger.info('Using seeded demo race preparation data');
            if (!canCommit()) return;
            setIntentions(seededData);
            // Save seeded data to AsyncStorage so it persists
            await AsyncStorage.setItem(key, JSON.stringify({
              user_intentions: seededData,
              updated_at: new Date().toISOString()
            }));
          } else {
            // Truly no data available, reset to defaults
            if (!canCommit()) return;
            setRigNotesState('');
            setSelectedRigPresetIdState(null);
            setAcknowledgements(DEFAULT_ACKNOWLEDGEMENTS);
            setRaceBriefData(null);
            setIntentions(DEFAULT_INTENTIONS);
          }
        }
      } catch (error) {
        logger.error('loadPreparation - AsyncStorage failed', error);
      } finally {
        if (!canCommit()) return;
        setIsLoading(false);
        hasLoadedOnceRef.current = true;
      }
      return;
    }

    // For non-demo races, we require authentication
    if (!targetUserId) {
      if (!canCommit()) return;
      setRigNotesState('');
      setSelectedRigPresetIdState(null);
      setAcknowledgements(DEFAULT_ACKNOWLEDGEMENTS);
      setRaceBriefData(null);
      setIntentions(DEFAULT_INTENTIONS);
      setIsLoading(false);
      return;
    }

    try {
      const data = await sailorRacePreparationService.getPreparation(targetRegattaId, targetUserId);
      if (!canCommit()) return;

      if (data) {
        setRigNotesState(data.rig_notes || '');
        setSelectedRigPresetIdState(data.selected_rig_preset_id || null);
        setAcknowledgements(data.regulatory_acknowledgements || DEFAULT_ACKNOWLEDGEMENTS);
        setRaceBriefData(data.race_brief_data || null);
        setIntentions(data.user_intentions || DEFAULT_INTENTIONS);
      } else {
        // No existing data, reset to defaults
        setRigNotesState('');
        setSelectedRigPresetIdState(null);
        setAcknowledgements(DEFAULT_ACKNOWLEDGEMENTS);
        setRaceBriefData(null);
        setIntentions(DEFAULT_INTENTIONS);
      }
    } catch (error) {
      logger.error('Failed to load race preparation:', error);
    } finally {
      if (!canCommit()) return;
      setIsLoading(false);
      hasLoadedOnceRef.current = true;
    }
  }, [regattaId, user?.id, isSailingDomain]);

  /**
   * Save pending changes to Supabase or AsyncStorage
   */
  const saveChanges = useCallback(async () => {
    const runId = ++saveRunIdRef.current;
    const targetRegattaId = regattaId;
    const targetUserId = user?.id;
    const canUpdateUi = () =>
      isMountedRef.current &&
      runId === saveRunIdRef.current &&
      activeRegattaIdRef.current === targetRegattaId &&
      activeUserIdRef.current === targetUserId;

    // For demo races (non-UUID), we allow saving even without a user ID (guest mode)
    const isDemoRace = targetRegattaId ? !isValidUUID(targetRegattaId) : false;
    if (!targetRegattaId || (!targetUserId && !isDemoRace) || Object.keys(pendingChangesRef.current).length === 0) {
      return;
    }

    // Handle non-UUID race IDs (demo races) with local storage
    if (isDemoRace) {
      try {
        if (canUpdateUi()) {
          setIsSaving(true);
        }
        const demoUserId = targetUserId || 'guest';
        const key = `${STORAGE_KEY_PREFIX}${targetRegattaId}_${demoUserId}`;

        // Load existing to merge updates
        const existingStr = await AsyncStorage.getItem(key);
        const existing = existingStr ? JSON.parse(existingStr) : {};

        const merged = {
          ...existing,
          ...pendingChangesRef.current,
          updated_at: new Date().toISOString()
        };

        await AsyncStorage.setItem(key, JSON.stringify(merged));
        logger.info('Demo race preparation saved to AsyncStorage', { regattaId: targetRegattaId });
        pendingChangesRef.current = {};
      } catch (error) {
        logger.error('AsyncStorage save failed', error);
        logger.error('AsyncStorage save failed:', error);
        // Keep pending changes so they can be retried
      } finally {
        if (canUpdateUi()) {
          setIsSaving(false);
        }
      }
      return;
    }

    try {
      if (canUpdateUi()) {
        setIsSaving(true);
      }

      const updates: SailorRacePreparation = {
        regatta_id: targetRegattaId,
        sailor_id: targetUserId!,
        ...pendingChangesRef.current,
      };

      logger.info('Saving race preparation to Supabase', { regattaId: targetRegattaId, hasIntentions: !!updates.user_intentions });
      const result = await sailorRacePreparationService.upsertPreparation(updates);

      if (result) {
        logger.info('Race preparation saved successfully', { regattaId: targetRegattaId });
        pendingChangesRef.current = {};
      } else {
        // Regatta doesn't exist - log this for debugging
        logger.warn('Regatta does not exist, cannot save preparation', targetRegattaId);
        logger.warn('Regatta does not exist, skipping save', { regattaId: targetRegattaId });
        pendingChangesRef.current = {};
      }
    } catch (error: any) {
      // RLS errors (42501) are expected when race doesn't exist or user doesn't have access yet
      // This happens during sample data creation - just log as warning and clear pending changes
      if (error?.code === '42501') {
        logger.warn('RLS policy prevented save (race may not exist yet)', { regattaId: targetRegattaId });
        pendingChangesRef.current = {};
      } else {
        logger.warn('Failed to save race preparation', error);
        logger.warn('Failed to save race preparation:', error);
        // Keep pending changes so they can be retried
      }
    } finally {
      if (canUpdateUi()) {
        setIsSaving(false);
      }
    }
  }, [regattaId, user?.id, isSailingDomain]);

  /**
   * Schedule a save with debouncing
   */
  const scheduleSave = useCallback(() => {
    if (!isSailingDomain || !autoSave) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      void saveChanges();
    }, debounceMs);
  }, [autoSave, debounceMs, saveChanges, isSailingDomain]);

  /**
   * Update rig notes
   */
  const setRigNotes = useCallback(
    (notes: string) => {
      if (!isSailingDomain) return;
      setRigNotesState(notes);
      pendingChangesRef.current = {
        ...pendingChangesRef.current,
        rig_notes: notes,
      };
      scheduleSave();
    },
    [scheduleSave, isSailingDomain]
  );

  /**
   * Update selected rig preset
   */
  const setSelectedRigPresetId = useCallback(
    (id: string | null) => {
      if (!isSailingDomain) return;
      setSelectedRigPresetIdState(id);
      pendingChangesRef.current = {
        ...pendingChangesRef.current,
        selected_rig_preset_id: id || undefined,
      };
      scheduleSave();
    },
    [scheduleSave, isSailingDomain]
  );

  /**
   * Set all acknowledgements at once
   */
  const setAcknowledgementsCallback = useCallback(
    (acks: RegulatoryAcknowledgements) => {
      if (!isSailingDomain) return;
      setAcknowledgements(acks);
      pendingChangesRef.current = {
        ...pendingChangesRef.current,
        regulatory_acknowledgements: acks,
      };
      scheduleSave();
    },
    [scheduleSave, isSailingDomain]
  );

  /**
   * Toggle an acknowledgement
   */
  const toggleAcknowledgement = useCallback(
    (key: keyof RegulatoryAcknowledgements) => {
      if (!isSailingDomain) return;
      setAcknowledgements((prev) => {
        const updated = {
          ...prev,
          [key]: !prev[key],
        };

        pendingChangesRef.current = {
          ...pendingChangesRef.current,
          regulatory_acknowledgements: updated,
        };

        scheduleSave();

        return updated;
      });
    },
    [scheduleSave, isSailingDomain]
  );

  /**
   * Update race brief data for AI context
   */
  const updateRaceBrief = useCallback(
    (data: RaceBriefData) => {
      if (!isSailingDomain) return;
      // Only update if data has actually changed (deep comparison)
      setRaceBriefData((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(data)) {
          return prev; // No change, prevent re-render
        }
        pendingChangesRef.current = {
          ...pendingChangesRef.current,
          race_brief_data: data,
        };
        scheduleSave();
        return data;
      });
    },
    [scheduleSave, isSailingDomain]
  );

  /**
   * Update user intentions (partial update, deep merges with existing)
   * Uses deep merge to prevent race conditions from concurrent callers
   */
  const updateIntentions = useCallback(
    (update: RaceIntentionUpdate) => {
      if (!isSailingDomain) return;
      setIntentions((prev) => {
        // Deep merge to preserve nested fields from concurrent updates
        const merged = deepMergeIntentions(prev, update);
        merged.updatedAt = new Date().toISOString();

        // Accumulate into pending changes using deep merge
        // This ensures multiple rapid updates are combined, not overwritten
        const existingIntentions = pendingChangesRef.current.user_intentions || prev;
        const accumulatedIntentions = deepMergeIntentions(existingIntentions, update);
        accumulatedIntentions.updatedAt = merged.updatedAt;

        pendingChangesRef.current = {
          ...pendingChangesRef.current,
          user_intentions: accumulatedIntentions,
        };

        scheduleSave();
        return merged;
      });
    },
    [scheduleSave, isSailingDomain]
  );

  /**
   * Update arrival time intention
   */
  const updateArrivalIntention = useCallback(
    (arrival: ArrivalTimeIntention) => {
      updateIntentions({ arrivalTime: arrival });
    },
    [updateIntentions]
  );

  /**
   * Update sail selection intention
   */
  const updateSailSelection = useCallback(
    (sails: SailSelectionIntention) => {
      updateIntentions({ sailSelection: sails });
    },
    [updateIntentions]
  );

  /**
   * Update rig intentions
   */
  const updateRigIntentions = useCallback(
    (rig: RigIntentions) => {
      updateIntentions({ rigIntentions: rig });
    },
    [updateIntentions]
  );

  /**
   * Update course selection intention
   */
  const updateCourseSelection = useCallback(
    (course: CourseSelectionIntention) => {
      updateIntentions({ courseSelection: course });
    },
    [updateIntentions]
  );

  /**
   * Update a single strategy note by section ID
   */
  const updateStrategyNote = useCallback(
    (sectionId: string, note: string) => {
      if (!isSailingDomain) return;
      setIntentions((prev) => {
        const existingNotes = prev.strategyNotes || {};
        const updatedNotes: StrategyNotes = {
          ...existingNotes,
          [sectionId]: note,
        };
        const merged: RaceIntentions = {
          ...prev,
          strategyNotes: updatedNotes,
          updatedAt: new Date().toISOString(),
        };
        pendingChangesRef.current = {
          ...pendingChangesRef.current,
          user_intentions: merged,
        };
        scheduleSave();
        return merged;
      });
    },
    [scheduleSave, isSailingDomain]
  );

  /**
   * Manually trigger a save
   */
  const save = useCallback(async () => {
    if (!isSailingDomain) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await saveChanges();
  }, [saveChanges, isSailingDomain]);

  /**
   * Refresh data from server
   */
  const refresh = useCallback(async () => {
    await loadPreparation();
  }, [loadPreparation]);

  // Load data on mount or when race changes
  useEffect(() => {
    void loadPreparation();
  }, [loadPreparation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Save any pending changes before unmounting
      if (isSailingDomain && Object.keys(pendingChangesRef.current).length > 0) {
        void saveChanges();
      }
    };
  }, [saveChanges, isSailingDomain]);

  // Compute derived state for loading optimization
  const isInitialLoading = isLoading && !hasLoadedOnceRef.current;
  const hasData = !!intentions?.updatedAt || hasLoadedOnceRef.current;

  return useMemo(() => ({
    // State
    rigNotes,
    selectedRigPresetId,
    acknowledgements,
    raceBriefData,
    intentions,
    isLoading,
    isInitialLoading,
    hasData,
    isSaving,

    // Actions
    setRigNotes,
    setSelectedRigPresetId,
    setAcknowledgements: setAcknowledgementsCallback,
    toggleAcknowledgement,
    updateRaceBrief,
    updateIntentions,
    updateArrivalIntention,
    updateSailSelection,
    updateRigIntentions,
    updateCourseSelection,
    updateStrategyNote,
    save,
    refresh,
  }), [
    rigNotes,
    selectedRigPresetId,
    acknowledgements,
    raceBriefData,
    intentions,
    isLoading,
    isInitialLoading,
    hasData,
    isSaving,
    setRigNotes,
    setSelectedRigPresetId,
    setAcknowledgementsCallback,
    toggleAcknowledgement,
    updateRaceBrief,
    updateIntentions,
    updateArrivalIntention,
    updateSailSelection,
    updateRigIntentions,
    updateCourseSelection,
    updateStrategyNote,
    save,
    refresh,
  ]);
}

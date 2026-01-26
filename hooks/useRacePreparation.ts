import { createLogger } from '@/lib/utils/logger';
import { useAuth } from '@/providers/AuthProvider';
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
import { useCallback, useEffect, useRef, useState } from 'react';

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



  /**
   * Load preparation data from Supabase or AsyncStorage
   */
  const loadPreparation = useCallback(async () => {
    if (!regattaId) {
      setIsLoading(false);
      return;
    }

    // Clear any pending changes to prevent race conditions where an in-flight
    // save (from unmount cleanup) could overwrite freshly loaded data
    pendingChangesRef.current = {};

    // Only show loading UI on first load - background refresh keeps existing data visible
    if (!hasLoadedOnceRef.current) {
      setIsLoading(true);
    }

    // Handle non-UUID race IDs (demo races) with local storage
    if (!isValidUUID(regattaId)) {
      try {
        const userId = user?.id || 'guest';
        const key = `${STORAGE_KEY_PREFIX}${regattaId}_${userId}`;
        const saved = await AsyncStorage.getItem(key);
        if (saved) {
          const data = JSON.parse(saved);
          const existingIntentions = data.user_intentions;

          // Check if existing data is essentially empty (no checklist completions)
          const hasCompletions = existingIntentions?.checklistCompletions &&
            Object.keys(existingIntentions.checklistCompletions).length > 0;

          // If existing data is empty, try to seed with demo data
          if (!hasCompletions) {
            const seededData = DemoRaceService.getDemoRacePreparation(regattaId);
            if (seededData) {
              logger.info('Seeding demo race with preparation data (existing was empty)');
              setIntentions(seededData);
              // Update AsyncStorage with seeded data
              await AsyncStorage.setItem(key, JSON.stringify({
                ...data,
                user_intentions: seededData,
                updated_at: new Date().toISOString()
              }));
            } else {
              // Not a seeded demo race, use existing empty data
              setRigNotesState(data.rig_notes || '');
              setSelectedRigPresetIdState(data.selected_rig_preset_id || null);
              setAcknowledgements(data.regulatory_acknowledgements || DEFAULT_ACKNOWLEDGEMENTS);
              setRaceBriefData(data.race_brief_data || null);
              setIntentions(existingIntentions || DEFAULT_INTENTIONS);
            }
          } else {
            // Existing data has completions, use it
            setRigNotesState(data.rig_notes || '');
            setSelectedRigPresetIdState(data.selected_rig_preset_id || null);
            setAcknowledgements(data.regulatory_acknowledgements || DEFAULT_ACKNOWLEDGEMENTS);
            setRaceBriefData(data.race_brief_data || null);
            setIntentions(existingIntentions);
            logger.info('Loaded demo race preparation data from local storage');
          }
        } else {
          // No existing data - check for seeded demo data
          const seededData = DemoRaceService.getDemoRacePreparation(regattaId);
          if (seededData) {
            logger.info('Using seeded demo race preparation data');
            setIntentions(seededData);
            // Save seeded data to AsyncStorage so it persists
            await AsyncStorage.setItem(key, JSON.stringify({
              user_intentions: seededData,
              updated_at: new Date().toISOString()
            }));
          } else {
            // Truly no data available, reset to defaults
            setRigNotesState('');
            setSelectedRigPresetIdState(null);
            setAcknowledgements(DEFAULT_ACKNOWLEDGEMENTS);
            setRaceBriefData(null);
            setIntentions(DEFAULT_INTENTIONS);
          }
        }
      } catch (error) {
        console.error('[useRacePreparation] loadPreparation - AsyncStorage failed', error);
      } finally {
        setIsLoading(false);
        hasLoadedOnceRef.current = true;
      }
      return;
    }

    try {
      const data = await sailorRacePreparationService.getPreparation(regattaId, user.id);

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
      setIsLoading(false);
      hasLoadedOnceRef.current = true;
    }
  }, [regattaId, user?.id]);

  /**
   * Save pending changes to Supabase or AsyncStorage
   */
  const saveChanges = useCallback(async () => {
    // For demo races (non-UUID), we allow saving even without a user ID (guest mode)
    const isDemoRace = !isValidUUID(regattaId);
    if (!regattaId || (!user?.id && !isDemoRace) || Object.keys(pendingChangesRef.current).length === 0) {
      return;
    }

    // Handle non-UUID race IDs (demo races) with local storage
    if (isDemoRace) {
      try {
        setIsSaving(true);
        const userId = user?.id || 'guest';
        const key = `${STORAGE_KEY_PREFIX}${regattaId}_${userId}`;

        // Load existing to merge updates
        const existingStr = await AsyncStorage.getItem(key);
        const existing = existingStr ? JSON.parse(existingStr) : {};

        const merged = {
          ...existing,
          ...pendingChangesRef.current,
          updated_at: new Date().toISOString()
        };

        await AsyncStorage.setItem(key, JSON.stringify(merged));
        logger.info('Demo race preparation saved to AsyncStorage', { regattaId });
        pendingChangesRef.current = {};
      } catch (error) {
        console.error('[useRacePreparation] AsyncStorage save failed:', error);
        logger.error('AsyncStorage save failed:', error);
        // Keep pending changes so they can be retried
      } finally {
        setIsSaving(false);
      }
      return;
    }

    try {
      setIsSaving(true);

      const updates: SailorRacePreparation = {
        regatta_id: regattaId,
        sailor_id: user.id,
        ...pendingChangesRef.current,
      };

      logger.info('Saving race preparation to Supabase', { regattaId, hasIntentions: !!updates.user_intentions });
      const result = await sailorRacePreparationService.upsertPreparation(updates);

      if (result) {
        logger.info('Race preparation saved successfully', { regattaId });
        pendingChangesRef.current = {};
      } else {
        // Regatta doesn't exist - log this for debugging
        console.warn('[useRacePreparation] Regatta does not exist, cannot save preparation:', regattaId);
        logger.warn('Regatta does not exist, skipping save', { regattaId });
        pendingChangesRef.current = {};
      }
    } catch (error) {
      console.error('[useRacePreparation] Failed to save race preparation:', error);
      logger.error('Failed to save race preparation:', error);
      // Keep pending changes so they can be retried
    } finally {
      setIsSaving(false);
    }
  }, [regattaId, user?.id]);

  /**
   * Schedule a save with debouncing
   */
  const scheduleSave = useCallback(() => {
    if (!autoSave) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveChanges();
    }, debounceMs);
  }, [autoSave, debounceMs, saveChanges]);

  /**
   * Update rig notes
   */
  const setRigNotes = useCallback(
    (notes: string) => {
      setRigNotesState(notes);
      pendingChangesRef.current = {
        ...pendingChangesRef.current,
        rig_notes: notes,
      };
      scheduleSave();
    },
    [scheduleSave]
  );

  /**
   * Update selected rig preset
   */
  const setSelectedRigPresetId = useCallback(
    (id: string | null) => {
      setSelectedRigPresetIdState(id);
      pendingChangesRef.current = {
        ...pendingChangesRef.current,
        selected_rig_preset_id: id || undefined,
      };
      scheduleSave();
    },
    [scheduleSave]
  );

  /**
   * Set all acknowledgements at once
   */
  const setAcknowledgementsCallback = useCallback(
    (acks: RegulatoryAcknowledgements) => {
      setAcknowledgements(acks);
      pendingChangesRef.current = {
        ...pendingChangesRef.current,
        regulatory_acknowledgements: acks,
      };
      scheduleSave();
    },
    [scheduleSave]
  );

  /**
   * Toggle an acknowledgement
   */
  const toggleAcknowledgement = useCallback(
    (key: keyof RegulatoryAcknowledgements) => {
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
    [scheduleSave]
  );

  /**
   * Update race brief data for AI context
   */
  const updateRaceBrief = useCallback(
    (data: RaceBriefData) => {
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
    [scheduleSave]
  );

  /**
   * Update user intentions (partial update, deep merges with existing)
   * Uses deep merge to prevent race conditions from concurrent callers
   */
  const updateIntentions = useCallback(
    (update: RaceIntentionUpdate) => {
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
    [scheduleSave, regattaId, user?.id]
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
    [scheduleSave]
  );

  /**
   * Manually trigger a save
   */
  const save = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await saveChanges();
  }, [saveChanges]);

  /**
   * Refresh data from server
   */
  const refresh = useCallback(async () => {
    await loadPreparation();
  }, [loadPreparation]);

  // Load data on mount or when race changes
  useEffect(() => {
    loadPreparation();
  }, [loadPreparation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Save any pending changes before unmounting
      if (Object.keys(pendingChangesRef.current).length > 0) {
        saveChanges();
      }
    };
  }, [saveChanges]);

  // Compute derived state for loading optimization
  const isInitialLoading = isLoading && !hasLoadedOnceRef.current;
  const hasData = !!intentions?.updatedAt || hasLoadedOnceRef.current;

  return {
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
  };
}

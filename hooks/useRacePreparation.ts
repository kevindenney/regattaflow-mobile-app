import { useState, useEffect, useCallback, useRef } from 'react';
import {
  sailorRacePreparationService,
  type RegulatoryAcknowledgements,
  type RaceBriefData,
  type SailorRacePreparation,
} from '@/services/SailorRacePreparationService';
import type {
  RaceIntentions,
  RaceIntentionUpdate,
  ArrivalTimeIntention,
  SailSelectionIntention,
  RigIntentions,
  CourseSelectionIntention,
  StrategyNotes,
} from '@/types/raceIntentions';
import { useAuth } from '@/providers/AuthProvider';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useRacePreparation');

/**
 * Validates if a string is a valid UUID format
 */
const isValidUUID = (id: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

const DEFAULT_INTENTIONS: RaceIntentions = {
  updatedAt: new Date().toISOString(),
};

interface UseRacePreparationOptions {
  raceEventId: string | null;
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
  raceEventId,
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

  // Refs for debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const pendingChangesRef = useRef<Partial<SailorRacePreparation>>({});

  /**
   * Load preparation data from Supabase
   */
  const loadPreparation = useCallback(async () => {
    if (!raceEventId || !user?.id) {
      setIsLoading(false);
      return;
    }

    // Skip database queries for non-UUID race IDs (e.g., demo races)
    if (!isValidUUID(raceEventId)) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await sailorRacePreparationService.getPreparation(raceEventId, user.id);

      if (data) {
        setRigNotesState(data.rig_notes || '');
        setSelectedRigPresetIdState(data.selected_rig_preset_id || null);
        setAcknowledgements(data.regulatory_acknowledgements || DEFAULT_ACKNOWLEDGEMENTS);
        setRaceBriefData(data.race_brief_data || null);
        setIntentions(data.user_intentions || DEFAULT_INTENTIONS);
        logger.info('Loaded race preparation data');
      } else {
        // No existing data, reset to defaults
        setRigNotesState('');
        setSelectedRigPresetIdState(null);
        setAcknowledgements(DEFAULT_ACKNOWLEDGEMENTS);
        setRaceBriefData(null);
        setIntentions(DEFAULT_INTENTIONS);
        logger.info('No existing race preparation data');
      }
    } catch (error) {
      logger.error('Failed to load race preparation:', error);
    } finally {
      setIsLoading(false);
    }
  }, [raceEventId, user?.id]);

  /**
   * Save pending changes to Supabase
   */
  const saveChanges = useCallback(async () => {
    if (!raceEventId || !user?.id || Object.keys(pendingChangesRef.current).length === 0) {
      return;
    }

    // Skip saving for non-UUID race IDs (e.g., demo races)
    if (!isValidUUID(raceEventId)) {
      pendingChangesRef.current = {};
      return;
    }

    try {
      setIsSaving(true);

      const updates: SailorRacePreparation = {
        race_event_id: raceEventId,
        sailor_id: user.id,
        ...pendingChangesRef.current,
      };

      await sailorRacePreparationService.upsertPreparation(updates);
      pendingChangesRef.current = {};
      logger.info('Saved race preparation changes');
    } catch (error) {
      logger.error('Failed to save race preparation:', error);
    } finally {
      setIsSaving(false);
    }
  }, [raceEventId, user?.id]);

  /**
   * Schedule a save with debouncing
   */
  const scheduleSave = useCallback(() => {
    if (!autoSave) return;

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
   * Update user intentions (partial update, merges with existing)
   */
  const updateIntentions = useCallback(
    (update: RaceIntentionUpdate) => {
      setIntentions((prev) => {
        const merged: RaceIntentions = {
          ...prev,
          ...update,
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

  return {
    // State
    rigNotes,
    selectedRigPresetId,
    acknowledgements,
    raceBriefData,
    intentions,
    isLoading,
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

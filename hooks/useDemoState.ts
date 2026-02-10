/**
 * useDemoState Hook
 *
 * React integration for demo race state management.
 * Provides easy access to demo race interactions like checklists,
 * notes, and debrief entries for a specific race.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DemoStateService,
  type DemoChecklistItem,
  type DemoDebriefEntry,
  type DemoStrategyNotes,
  type DemoSailSelection,
  type DemoRigSettings,
  type DemoRaceState,
} from '@/services/DemoStateService';
import { DemoRaceService } from '@/services/DemoRaceService';

export interface UseDemoStateResult {
  // State
  isLoading: boolean;
  isDemo: boolean;
  checklist: DemoChecklistItem[];
  notes: string;
  debrief: DemoDebriefEntry[];
  strategy: DemoStrategyNotes | null;
  sailSelection: DemoSailSelection | null;
  rigSettings: DemoRigSettings | null;

  // Checklist actions
  toggleChecklistItem: (itemId: string) => Promise<void>;
  isItemCompleted: (itemId: string) => boolean;

  // Notes actions
  saveNotes: (notes: string) => Promise<void>;

  // Debrief actions
  addDebriefEntry: (question: string, answer: string) => Promise<void>;

  // Strategy actions
  saveStrategy: (strategy: DemoStrategyNotes) => Promise<void>;

  // Sail selection actions
  saveSailSelection: (selection: DemoSailSelection) => Promise<void>;

  // Rig settings actions
  saveRigSettings: (settings: DemoRigSettings) => Promise<void>;

  // Refresh
  refresh: () => Promise<void>;
}

export interface UseDemoStateOptions {
  /** Auto-load state on mount */
  autoLoad?: boolean;
}

/**
 * Hook for managing demo race state
 * @param raceId The race ID (will check if it's a demo race)
 */
export function useDemoState(
  raceId: string | null,
  options: UseDemoStateOptions = {}
): UseDemoStateResult {
  const { autoLoad = true } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<DemoRaceState | null>(null);

  // Check if this is a demo race
  const isDemo = useMemo(() => {
    if (!raceId) return false;
    return DemoRaceService.isDemoRace(raceId);
  }, [raceId]);

  // Load state
  const loadState = useCallback(async () => {
    if (!raceId || !isDemo) {
      setState(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const raceState = await DemoStateService.getDemoRaceState(raceId);
      setState(raceState);
    } catch (error) {
      console.error('[useDemoState] Failed to load state:', error);
    } finally {
      setIsLoading(false);
    }
  }, [raceId, isDemo]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadState();
    }
  }, [autoLoad, loadState]);

  // Checklist actions
  const toggleChecklistItem = useCallback(async (itemId: string) => {
    if (!raceId || !isDemo) return;

    const updatedItems = await DemoStateService.toggleChecklistItem(raceId, itemId);
    setState(prev => prev ? { ...prev, checklist: updatedItems } : null);
  }, [raceId, isDemo]);

  const isItemCompleted = useCallback((itemId: string) => {
    if (!state) return false;
    const item = state.checklist.find(i => i.id === itemId);
    return item?.completed ?? false;
  }, [state]);

  // Notes actions
  const saveNotes = useCallback(async (notes: string) => {
    if (!raceId || !isDemo) return;

    await DemoStateService.saveDemoNotes(raceId, notes);
    setState(prev => prev ? { ...prev, notes } : null);
  }, [raceId, isDemo]);

  // Debrief actions
  const addDebriefEntry = useCallback(async (question: string, answer: string) => {
    if (!raceId || !isDemo) return;

    const updatedEntries = await DemoStateService.addDebriefEntry(raceId, question, answer);
    setState(prev => prev ? { ...prev, debrief: updatedEntries } : null);
  }, [raceId, isDemo]);

  // Strategy actions
  const saveStrategy = useCallback(async (strategy: DemoStrategyNotes) => {
    if (!raceId || !isDemo) return;

    await DemoStateService.saveDemoStrategy(raceId, strategy);
    setState(prev => prev ? { ...prev, strategy } : null);
  }, [raceId, isDemo]);

  // Sail selection actions
  const saveSailSelection = useCallback(async (selection: DemoSailSelection) => {
    if (!raceId || !isDemo) return;

    await DemoStateService.saveDemoSailSelection(raceId, selection);
    setState(prev => prev ? { ...prev, sailSelection: selection } : null);
  }, [raceId, isDemo]);

  // Rig settings actions
  const saveRigSettings = useCallback(async (settings: DemoRigSettings) => {
    if (!raceId || !isDemo) return;

    await DemoStateService.saveDemoRigSettings(raceId, settings);
    setState(prev => prev ? { ...prev, rigSettings: settings } : null);
  }, [raceId, isDemo]);

  return {
    // State
    isLoading,
    isDemo,
    checklist: state?.checklist ?? [],
    notes: state?.notes ?? '',
    debrief: state?.debrief ?? [],
    strategy: state?.strategy ?? null,
    sailSelection: state?.sailSelection ?? null,
    rigSettings: state?.rigSettings ?? null,

    // Actions
    toggleChecklistItem,
    isItemCompleted,
    saveNotes,
    addDebriefEntry,
    saveStrategy,
    saveSailSelection,
    saveRigSettings,
    refresh: loadState,
  };
}

/**
 * Hook to check if demo races should be visible
 * Demo races are hidden when user has added a real race
 */
export function useDemoVisibility() {
  const [shouldHideDemo, setShouldHideDemo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkVisibility = async () => {
      try {
        const hasRealRace = await DemoStateService.hasAddedRealRace();
        setShouldHideDemo(hasRealRace);
      } catch (error) {
        console.error('[useDemoVisibility] Failed to check visibility:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkVisibility();
  }, []);

  const markRealRaceAdded = useCallback(async () => {
    await DemoStateService.markFirstRealRaceAdded();
    setShouldHideDemo(true);
  }, []);

  const resetDemoVisibility = useCallback(async () => {
    await DemoStateService.resetFirstRealRace();
    setShouldHideDemo(false);
  }, []);

  return {
    shouldHideDemo,
    isLoading,
    markRealRaceAdded,
    resetDemoVisibility,
  };
}

/**
 * Hook to clear all demo state (useful for cleanup)
 */
export function useDemoClearState() {
  const clearAll = useCallback(async () => {
    await DemoStateService.clearAllDemoState();
  }, []);

  const clearRace = useCallback(async (raceId: string) => {
    await DemoStateService.clearDemoRaceState(raceId);
  }, []);

  return {
    clearAll,
    clearRace,
  };
}

export {
  type DemoChecklistItem,
  type DemoDebriefEntry,
  type DemoStrategyNotes,
  type DemoSailSelection,
  type DemoRigSettings,
  type DemoRaceState,
};

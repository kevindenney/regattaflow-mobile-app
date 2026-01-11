/**
 * useContentModules Hook
 *
 * Resolves which content modules to display based on:
 * - Current race phase
 * - Race type
 * - User preferences
 *
 * Provides controls for reordering, collapsing, and hiding modules.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { RacePhase } from '@/components/cards/types';
import {
  getAvailableModules,
  getDefaultModules,
  getMaxModules,
} from '@/components/cards/content/moduleConfig';
import { useContentPreferences } from './useContentPreferences';
import type {
  ContentModuleId,
  RaceType,
  UseContentModulesReturn,
} from '@/types/raceCardContent';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useContentModules');

interface UseContentModulesOptions {
  /** Current race phase */
  phase: RacePhase;
  /** Race type */
  raceType: RaceType;
  /** Optional specific race ID for per-race preferences */
  raceId?: string;
}

/**
 * Hook to resolve and manage content modules for the expanded race card
 */
export function useContentModules({
  phase,
  raceType,
  raceId,
}: UseContentModulesOptions): UseContentModulesReturn {
  // Load user preferences
  const {
    preferences,
    isLoading: prefsLoading,
    savePreferences,
    resetPreferences,
  } = useContentPreferences({ raceId, raceType });

  // Track collapsed modules in local state (merged with preferences)
  const [localCollapsed, setLocalCollapsed] = useState<Set<ContentModuleId>>(new Set());

  // Get available modules for this phase/type combination
  const availableModules = useMemo(
    () => getAvailableModules(phase, raceType),
    [phase, raceType]
  );

  // Get default modules for this phase/type
  const defaultModules = useMemo(
    () => getDefaultModules(phase, raceType),
    [phase, raceType]
  );

  // Get max modules allowed
  const maxModules = useMemo(() => getMaxModules(phase), [phase]);

  // Resolve collapsed modules from preferences + local state
  const collapsedModules = useMemo(() => {
    const collapsed = new Set<ContentModuleId>(localCollapsed);

    // Add collapsed from preferences
    if (preferences?.collapsedModules) {
      for (const id of preferences.collapsedModules) {
        collapsed.add(id);
      }
    }

    return collapsed;
  }, [localCollapsed, preferences?.collapsedModules]);

  // Resolve hidden modules from preferences
  const hiddenModules = useMemo(() => {
    return preferences?.hiddenModules || [];
  }, [preferences?.hiddenModules]);

  // Resolve final module list
  const modules = useMemo((): ContentModuleId[] => {
    let resolved: ContentModuleId[];

    // If user has saved a module order, use it
    if (preferences?.moduleOrder && preferences.moduleOrder.length > 0) {
      // Filter to only include modules that are still available
      resolved = preferences.moduleOrder.filter(
        (id) => availableModules.includes(id) && !hiddenModules.includes(id)
      );
    } else {
      // Use defaults for this phase/type
      resolved = defaultModules.filter((id) => !hiddenModules.includes(id));
    }

    // Enforce max modules
    return resolved.slice(0, maxModules);
  }, [preferences?.moduleOrder, availableModules, hiddenModules, defaultModules, maxModules]);

  // Initialize collapsed state from preferences on load
  useEffect(() => {
    if (preferences?.collapsedModules) {
      setLocalCollapsed(new Set(preferences.collapsedModules));
    }
  }, [preferences?.collapsedModules]);

  /**
   * Update module order
   */
  const updateOrder = useCallback(
    (newOrder: ContentModuleId[]) => {
      // Filter to only valid modules
      const validOrder = newOrder.filter((id) => availableModules.includes(id));

      savePreferences({
        moduleOrder: validOrder,
      });

      logger.debug('Updated module order', { newOrder: validOrder });
    },
    [availableModules, savePreferences]
  );

  /**
   * Toggle collapse state for a module
   */
  const toggleCollapse = useCallback(
    (moduleId: ContentModuleId) => {
      setLocalCollapsed((prev) => {
        const next = new Set(prev);

        if (next.has(moduleId)) {
          next.delete(moduleId);
        } else {
          next.add(moduleId);
        }

        // Persist to preferences
        savePreferences({
          collapsedModules: Array.from(next),
        });

        return next;
      });

      logger.debug('Toggled collapse', { moduleId });
    },
    [savePreferences]
  );

  /**
   * Hide a module
   */
  const hideModule = useCallback(
    (moduleId: ContentModuleId) => {
      const currentHidden = preferences?.hiddenModules || [];
      const newHidden = [...currentHidden, moduleId];

      savePreferences({
        hiddenModules: newHidden,
      });

      logger.debug('Hidden module', { moduleId });
    },
    [preferences?.hiddenModules, savePreferences]
  );

  /**
   * Show a previously hidden module
   */
  const showModule = useCallback(
    (moduleId: ContentModuleId) => {
      const currentHidden = preferences?.hiddenModules || [];
      const newHidden = currentHidden.filter((id) => id !== moduleId);

      savePreferences({
        hiddenModules: newHidden,
      });

      logger.debug('Shown module', { moduleId });
    },
    [preferences?.hiddenModules, savePreferences]
  );

  /**
   * Reset to default configuration
   */
  const resetToDefaults = useCallback(() => {
    setLocalCollapsed(new Set());
    resetPreferences();
    logger.info('Reset modules to defaults');
  }, [resetPreferences]);

  return {
    modules,
    collapsedModules,
    updateOrder,
    toggleCollapse,
    hideModule,
    showModule,
    resetToDefaults,
    isLoading: prefsLoading,
    availableModules,
    hiddenModules,
  };
}

export default useContentModules;

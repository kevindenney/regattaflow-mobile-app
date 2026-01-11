/**
 * useDebriefSailContext Hook
 *
 * Provides sail options for debrief interview questions.
 * Sources:
 * 1. Race intentions - sails selected in pre-race planning (if available)
 * 2. Primary boat's sail inventory (fallback)
 *
 * Used by StructuredDebriefInterview to show actual sail options
 * instead of free-form text input.
 */

import { useMemo } from 'react';
import { useRacePreparation } from './useRacePreparation';
import { useUserBoats } from './useUserBoats';
import { useSailInventory, formatSailDisplayName } from './useSailInventory';
import type { SailInventoryItem } from '@/types/raceIntentions';

export interface SailOption {
  value: string;
  label: string;
  hint?: string;
  category: 'mainsail' | 'jib' | 'genoa' | 'spinnaker' | 'code_zero';
  isPlanned?: boolean; // Was this the planned sail?
}

export interface DebriefSailContext {
  /** All available sail options for selection */
  sailOptions: SailOption[];
  /** The planned sail selection from race intentions (if any) */
  plannedSails: {
    mainsail?: string;
    jib?: string;
    spinnaker?: string;
  };
  /** Loading state */
  isLoading: boolean;
  /** Whether the user has any sails */
  hasSails: boolean;
}

interface UseDebriefSailContextParams {
  raceId: string | null | undefined;
  userId: string | null | undefined;
}

/**
 * Get sail options for debrief questions
 */
export function useDebriefSailContext({
  raceId,
  userId,
}: UseDebriefSailContextParams): DebriefSailContext {
  // Load race preparation data (includes sail selection intentions)
  const { intentions, isLoading: prepLoading } = useRacePreparation({
    raceEventId: raceId ?? null,
  });

  // Load user's boats to get primary boat
  const { primaryBoat, isLoading: boatsLoading } = useUserBoats();

  // Load sail inventory for primary boat
  const {
    allSails,
    isLoading: sailsLoading,
    hasSails,
  } = useSailInventory({
    boatId: primaryBoat?.id ?? null,
    activeOnly: false, // Include backup sails too
    enabled: !!primaryBoat?.id,
  });

  // Get planned sail selection from intentions
  const plannedSails = useMemo(() => {
    const sailSelection = intentions?.sailSelection;
    return {
      mainsail: sailSelection?.mainsailName,
      jib: sailSelection?.jibName,
      spinnaker: sailSelection?.spinnakerName,
    };
  }, [intentions?.sailSelection]);

  // Build sail options
  const sailOptions = useMemo((): SailOption[] => {
    const options: SailOption[] = [];
    const plannedIds = new Set([
      intentions?.sailSelection?.mainsail,
      intentions?.sailSelection?.jib,
      intentions?.sailSelection?.spinnaker,
    ].filter(Boolean));

    // Map inventory sails to options
    allSails.forEach((sail: SailInventoryItem) => {
      const displayName = formatSailDisplayName(sail);
      const isPlanned = plannedIds.has(sail.id);

      options.push({
        value: sail.id,
        label: isPlanned ? `${displayName} (planned)` : displayName,
        hint: sail.status === 'backup' ? 'Backup sail' : undefined,
        category: sail.category,
        isPlanned,
      });
    });

    // Sort: planned sails first, then by category
    const categoryOrder = ['mainsail', 'jib', 'genoa', 'spinnaker', 'code_zero'];
    options.sort((a, b) => {
      // Planned sails first
      if (a.isPlanned && !b.isPlanned) return -1;
      if (!a.isPlanned && b.isPlanned) return 1;
      // Then by category
      return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
    });

    return options;
  }, [allSails, intentions?.sailSelection]);

  const isLoading = prepLoading || boatsLoading || sailsLoading;

  return {
    sailOptions,
    plannedSails,
    isLoading,
    hasSails,
  };
}

/**
 * Get sail options grouped by category for display
 */
export function groupSailsByCategory(options: SailOption[]): Record<string, SailOption[]> {
  const grouped: Record<string, SailOption[]> = {
    mainsail: [],
    jib: [],
    genoa: [],
    spinnaker: [],
    code_zero: [],
  };

  options.forEach((opt) => {
    if (grouped[opt.category]) {
      grouped[opt.category].push(opt);
    }
  });

  return grouped;
}

export default useDebriefSailContext;

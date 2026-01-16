/**
 * useSailInventory Hook
 *
 * Fetches available sails from a boat's equipment inventory.
 * Groups sails by category (mainsail, jib, genoa, spinnaker, code_zero)
 * for use in the sail selection UI.
 *
 * Also supports demo boats for the freemium guest experience.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { equipmentService } from '@/services/EquipmentService';
import { isDemoBoatId, getDemoSailsForBoat } from '@/lib/demo/demoRaceData';
import type { SailInventoryItem, GroupedSailInventory } from '@/types/raceIntentions';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useSailInventory');

interface UseSailInventoryOptions {
  /** Boat ID to fetch sails for */
  boatId: string | null;
  /** Only fetch active sails */
  activeOnly?: boolean;
  /** Enable/disable fetching */
  enabled?: boolean;
}

interface UseSailInventoryReturn {
  /** All sails grouped by category */
  sails: GroupedSailInventory;
  /** All sails as flat array */
  allSails: SailInventoryItem[];
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Refresh sails from database */
  refresh: () => Promise<void>;
  /** Get sail by ID */
  getSailById: (id: string) => SailInventoryItem | undefined;
  /** Check if boat has any sails */
  hasSails: boolean;
}

const EMPTY_GROUPED_SAILS: GroupedSailInventory = {
  mainsails: [],
  jibs: [],
  genoas: [],
  spinnakers: [],
  codeZeros: [],
};

const SAIL_CATEGORIES = ['mainsail', 'jib', 'genoa', 'spinnaker', 'code_zero'] as const;

/**
 * Hook to fetch and manage sail inventory for a boat
 */
export function useSailInventory({
  boatId,
  activeOnly = true,
  enabled = true,
}: UseSailInventoryOptions): UseSailInventoryReturn {
  const [allSails, setAllSails] = useState<SailInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch sails from equipment service (or demo data for demo boats)
   */
  const fetchSails = useCallback(async () => {
    if (!boatId || !enabled) {
      setAllSails([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check if this is a demo boat - return demo sails directly
      if (isDemoBoatId(boatId)) {
        const demoSails = getDemoSailsForBoat(boatId);
        const sails: SailInventoryItem[] = demoSails
          .filter((item) => !activeOnly || item.status === 'active')
          .map((item) => ({
            id: item.id,
            customName: item.custom_name || undefined,
            category: item.category as SailInventoryItem['category'],
            manufacturer: item.manufacturer || undefined,
            model: item.model || undefined,
            conditionRating: item.condition_rating || undefined,
            status: item.status as SailInventoryItem['status'],
            totalRacesUsed: item.total_races_used || undefined,
            lastUsedDate: item.last_used_date || undefined,
          }));

        setAllSails(sails);
        logger.info(`Loaded ${sails.length} demo sails for demo boat ${boatId}`);
        return;
      }

      // Fetch all equipment for the boat from the database
      const equipment = await equipmentService.getEquipmentForBoat(boatId);

      // Filter to sail categories and map to SailInventoryItem
      const sails: SailInventoryItem[] = equipment
        .filter((item) => SAIL_CATEGORIES.includes(item.category as any))
        .filter((item) => !activeOnly || item.status === 'active')
        .map((item) => ({
          id: item.id,
          customName: item.custom_name || undefined,
          category: item.category as SailInventoryItem['category'],
          manufacturer: item.manufacturer || undefined,
          model: item.model || undefined,
          conditionRating: item.condition_rating || undefined,
          status: item.status as SailInventoryItem['status'],
          totalRacesUsed: item.total_races_used || undefined,
          lastUsedDate: item.last_used_date || undefined,
        }));

      setAllSails(sails);
      logger.info(`Loaded ${sails.length} sails for boat ${boatId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load sails';
      logger.error('Error fetching sails:', err);
      setError(message);
      setAllSails([]);
    } finally {
      setIsLoading(false);
    }
  }, [boatId, activeOnly, enabled]);

  // Fetch on mount or when boatId changes
  useEffect(() => {
    fetchSails();
  }, [fetchSails]);

  /**
   * Group sails by category
   */
  const sails = useMemo((): GroupedSailInventory => {
    if (allSails.length === 0) {
      return EMPTY_GROUPED_SAILS;
    }

    return {
      mainsails: allSails.filter((s) => s.category === 'mainsail'),
      jibs: allSails.filter((s) => s.category === 'jib'),
      genoas: allSails.filter((s) => s.category === 'genoa'),
      spinnakers: allSails.filter((s) => s.category === 'spinnaker'),
      codeZeros: allSails.filter((s) => s.category === 'code_zero'),
    };
  }, [allSails]);

  /**
   * Get a sail by its ID
   */
  const getSailById = useCallback(
    (id: string): SailInventoryItem | undefined => {
      return allSails.find((s) => s.id === id);
    },
    [allSails]
  );

  /**
   * Check if boat has any sails
   */
  const hasSails = allSails.length > 0;

  return {
    sails,
    allSails,
    isLoading,
    error,
    refresh: fetchSails,
    getSailById,
    hasSails,
  };
}

/**
 * Helper to format sail display name
 */
export function formatSailDisplayName(sail: SailInventoryItem): string {
  const parts: string[] = [];

  if (sail.customName) {
    parts.push(sail.customName);
  } else {
    // Build name from manufacturer + model
    if (sail.manufacturer) {
      parts.push(sail.manufacturer);
    }
    if (sail.model) {
      parts.push(sail.model);
    }
  }

  // Fallback to category
  if (parts.length === 0) {
    const categoryLabels: Record<string, string> = {
      mainsail: 'Mainsail',
      jib: 'Jib',
      genoa: 'Genoa',
      spinnaker: 'Spinnaker',
      code_zero: 'Code Zero',
    };
    parts.push(categoryLabels[sail.category] || sail.category);
  }

  return parts.join(' ');
}

/**
 * Helper to get condition color based on rating
 */
export function getSailConditionColor(rating?: number): string {
  if (!rating) return '#94A3B8'; // Gray for unknown
  if (rating >= 80) return '#22C55E'; // Green - good
  if (rating >= 60) return '#F59E0B'; // Orange - fair
  return '#EF4444'; // Red - poor
}

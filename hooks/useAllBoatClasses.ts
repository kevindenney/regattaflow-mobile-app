/**
 * useAllBoatClasses Hook
 *
 * Fetches all boat classes for browsing/discovery.
 * Returns classes sorted by popularity (fleet count).
 * Used when user doesn't have a boat class yet.
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useAllBoatClasses');

/**
 * Boat class for browsing
 */
export interface BrowseBoatClass {
  id: string;
  name: string;
  type?: string;
  description?: string;
  fleetCount: number;
  sailorCount: number;
}

/**
 * Hook options
 */
export interface UseAllBoatClassesOptions {
  /** Maximum number of classes to return */
  limit?: number;
  /** Whether to auto-fetch on mount */
  enabled?: boolean;
}

/**
 * Hook return type
 */
export interface UseAllBoatClassesResult {
  /** All boat classes */
  classes: BrowseBoatClass[];
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Refresh data */
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch all boat classes for browsing
 */
export function useAllBoatClasses(
  options: UseAllBoatClassesOptions = {}
): UseAllBoatClassesResult {
  const { limit = 20, enabled = true } = options;
  const [classes, setClasses] = useState<BrowseBoatClass[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all boat classes
  const fetchClasses = useCallback(async () => {
    if (!enabled) {
      setClasses([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      logger.info('[useAllBoatClasses] Fetching boat classes...');

      // Fetch boat classes
      const { data: classData, error: classError } = await supabase
        .from('boat_classes')
        .select('id, name, type, description')
        .order('name', { ascending: true })
        .limit(limit * 2); // Fetch more initially to account for filtering

      if (classError) {
        throw classError;
      }

      if (!classData || classData.length === 0) {
        setClasses([]);
        return;
      }

      // Get fleet counts for each class
      const classIds = classData.map((c) => c.id);
      const { data: fleetCounts, error: fleetError } = await supabase
        .from('fleets')
        .select('class_id')
        .in('class_id', classIds)
        .in('visibility', ['public', 'club']);

      if (fleetError) {
        logger.warn('[useAllBoatClasses] Error fetching fleet counts:', fleetError);
      }

      // Count fleets per class
      const fleetCountMap = new Map<string, number>();
      (fleetCounts || []).forEach((f: any) => {
        const count = fleetCountMap.get(f.class_id) || 0;
        fleetCountMap.set(f.class_id, count + 1);
      });

      // Get sailor counts (boats registered per class)
      const { data: sailorCounts, error: sailorError } = await supabase
        .from('sailor_boats')
        .select('class_id')
        .in('class_id', classIds);

      if (sailorError) {
        logger.warn('[useAllBoatClasses] Error fetching sailor counts:', sailorError);
      }

      // Count sailors per class
      const sailorCountMap = new Map<string, number>();
      (sailorCounts || []).forEach((s: any) => {
        const count = sailorCountMap.get(s.class_id) || 0;
        sailorCountMap.set(s.class_id, count + 1);
      });

      // Build result with counts
      const classesWithCounts: BrowseBoatClass[] = classData.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        description: c.description,
        fleetCount: fleetCountMap.get(c.id) || 0,
        sailorCount: sailorCountMap.get(c.id) || 0,
      }));

      // Sort by popularity (fleet count + sailor count)
      classesWithCounts.sort((a, b) => {
        const scoreA = a.fleetCount * 2 + a.sailorCount;
        const scoreB = b.fleetCount * 2 + b.sailorCount;
        return scoreB - scoreA;
      });

      // Take only the top classes
      setClasses(classesWithCounts.slice(0, limit));
      logger.info('[useAllBoatClasses] Loaded classes:', classesWithCounts.length);
    } catch (err: any) {
      logger.error('[useAllBoatClasses] Error:', err);
      setError(err?.message || 'Failed to load boat classes');
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, limit]);

  // Initial fetch
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  return {
    classes,
    isLoading,
    error,
    refresh: fetchClasses,
  };
}

export default useAllBoatClasses;

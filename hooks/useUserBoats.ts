/**
 * useUserBoats Hook
 *
 * Fetches the current user's boats for selection in forms like Add Race dialog.
 * Returns boats with their class information for auto-population.
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { sailorBoatService, SailorBoat } from '@/services/SailorBoatService';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useUserBoats');

interface UseUserBoatsOptions {
  /** Only fetch boats that are active (not sold/retired) */
  activeOnly?: boolean;
  /** Filter to a specific class */
  classId?: string;
  /** Whether to enable fetching */
  enabled?: boolean;
}

interface UseUserBoatsReturn {
  /** List of user's boats */
  boats: SailorBoat[];
  /** Primary boat (if any) */
  primaryBoat: SailorBoat | null;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Refetch boats */
  refetch: () => Promise<void>;
  /** Whether user has any boats */
  hasBoats: boolean;
}

export function useUserBoats(options: UseUserBoatsOptions = {}): UseUserBoatsReturn {
  const { activeOnly = true, classId, enabled = true } = options;
  const { user, ready: authReady } = useAuth();

  // Only enable query when auth is ready and we have a user
  const queryEnabled = enabled && authReady && !!user?.id;

  logger.debug('[useUserBoats] Hook state:', {
    userId: user?.id,
    authReady,
    queryEnabled,
    enabled,
  });

  const {
    data: boats = [],
    isLoading: queryLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user-boats', user?.id, classId, activeOnly],
    queryFn: async () => {
      logger.info('[useUserBoats] queryFn executing for user:', user?.id);

      if (!user?.id) {
        logger.debug('[useUserBoats] No user ID, returning empty');
        return [];
      }

      let result: SailorBoat[];

      try {
        if (classId) {
          result = await sailorBoatService.listBoatsForSailorClass(user.id, classId);
        } else {
          result = await sailorBoatService.listBoatsForSailor(user.id);
        }
      } catch (err) {
        logger.error('[useUserBoats] Error fetching boats:', err);
        throw err;
      }

      // Filter to active boats if requested
      if (activeOnly) {
        result = result.filter(boat => boat.status === 'active');
      }

      logger.info('[useUserBoats] Fetched boats:', {
        count: result.length,
        boats: result.map(b => ({
          id: b.id,
          name: b.name,
          sailNumber: b.sail_number,
          className: b.boat_class?.name,
          isPrimary: b.is_primary,
        })),
      });

      return result;
    },
    enabled: queryEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Show loading while auth is not ready OR query is loading
  const isLoading = !authReady || queryLoading;

  logger.debug('[useUserBoats] Return state:', {
    isLoading,
    authReady,
    queryLoading,
    isFetching,
    boatCount: boats.length,
  });

  // Find primary boat
  const primaryBoat = boats.find(b => b.is_primary) || boats[0] || null;

  return {
    boats,
    primaryBoat,
    isLoading,
    error: error as Error | null,
    refetch: async () => {
      await refetch();
    },
    hasBoats: boats.length > 0,
  };
}

export type { UseUserBoatsOptions, UseUserBoatsReturn };

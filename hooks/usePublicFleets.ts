/**
 * usePublicFleets Hook
 *
 * Fetches public fleets for browsing/discovery.
 * Uses FleetDiscoveryService.discoverFleets() under the hood.
 * Used when user doesn't have fleet membership yet.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { FleetDiscoveryService, Fleet } from '@/services/FleetDiscoveryService';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('usePublicFleets');

/**
 * Public fleet for browsing
 */
export interface BrowseFleet {
  id: string;
  name: string;
  description?: string;
  region?: string;
  boatClassName?: string;
  boatClassType?: string;
  memberCount: number;
  hasWhatsApp: boolean;
  isMember: boolean;
}

/**
 * Hook options
 */
export interface UsePublicFleetsOptions {
  /** Filter by boat class ID */
  classId?: string;
  /** Maximum number of fleets to return */
  limit?: number;
  /** Whether to auto-fetch on mount */
  enabled?: boolean;
}

/**
 * Hook return type
 */
export interface UsePublicFleetsResult {
  /** Public fleets */
  fleets: BrowseFleet[];
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Refresh data */
  refresh: () => Promise<void>;
  /** Join a fleet */
  joinFleet: (fleetId: string) => Promise<boolean>;
}

/**
 * Hook to fetch public fleets for browsing
 */
export function usePublicFleets(
  options: UsePublicFleetsOptions = {}
): UsePublicFleetsResult {
  const { classId, limit = 20, enabled = true } = options;
  const { user, isGuest } = useAuth();
  const [fleets, setFleets] = useState<BrowseFleet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const fetchRunIdRef = useRef(0);
  const activeUserIdRef = useRef<string | null>(user?.id ?? null);

  const userId = user?.id;

  useEffect(() => {
    activeUserIdRef.current = userId ?? null;
  }, [userId]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      fetchRunIdRef.current += 1;
    };
  }, []);

  // Fetch public fleets
  const fetchFleets = useCallback(async () => {
    const runId = ++fetchRunIdRef.current;
    const targetUserId = userId ?? null;
    const canCommit = () =>
      isMountedRef.current &&
      runId === fetchRunIdRef.current &&
      activeUserIdRef.current === targetUserId;

    if (!enabled) {
      if (!canCommit()) return;
      setFleets([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!canCommit()) return;
    setIsLoading(true);
    setError(null);

    try {
      logger.info('[usePublicFleets] Fetching public fleets...', { classId });

      // Use FleetDiscoveryService to discover fleets
      const discoveredFleets = await FleetDiscoveryService.discoverFleets(
        undefined, // venueId
        classId,
        limit
      );

      // Check user's memberships if logged in
      let memberFleetIds = new Set<string>();
      if (targetUserId && !isGuest) {
        const userFleets = await FleetDiscoveryService.getSailorFleets(targetUserId);
        memberFleetIds = new Set(userFleets.map((f: Fleet) => f.id));
      }

      // Transform to BrowseFleet format
      const browseFleets: BrowseFleet[] = discoveredFleets.map((fleet) => ({
        id: fleet.id,
        name: fleet.name,
        description: fleet.description,
        region: fleet.region,
        boatClassName: fleet.boat_classes?.name,
        boatClassType: fleet.boat_classes?.type,
        memberCount: fleet.member_count || 0,
        hasWhatsApp: !!fleet.whatsapp_link,
        isMember: memberFleetIds.has(fleet.id),
      }));

      if (!canCommit()) return;
      setFleets(browseFleets);
      logger.info('[usePublicFleets] Loaded fleets:', browseFleets.length);
    } catch (err: any) {
      logger.error('[usePublicFleets] Error:', err);
      if (!canCommit()) return;
      setError(err?.message || 'Failed to load fleets');
      setFleets([]);
    } finally {
      if (!canCommit()) return;
      setIsLoading(false);
    }
  }, [enabled, classId, limit, userId, isGuest]);

  // Join a fleet
  const joinFleet = useCallback(
    async (fleetId: string): Promise<boolean> => {
      const targetUserId = activeUserIdRef.current;
      if (!targetUserId || isGuest) {
        logger.warn('[usePublicFleets] Cannot join fleet - not logged in');
        return false;
      }

      try {
        const membership = await FleetDiscoveryService.joinFleet(targetUserId, fleetId);
        if (membership) {
          if (!isMountedRef.current || activeUserIdRef.current !== targetUserId) return false;
          // Update local state
          setFleets((prev) =>
            prev.map((f) => (f.id === fleetId ? { ...f, isMember: true, memberCount: f.memberCount + 1 } : f))
          );
          logger.info('[usePublicFleets] Joined fleet:', fleetId);
          return true;
        }
        return false;
      } catch (err: any) {
        logger.error('[usePublicFleets] Error joining fleet:', err);
        return false;
      }
    },
    [isGuest]
  );

  // Initial fetch
  useEffect(() => {
    void fetchFleets();
  }, [fetchFleets]);

  return {
    fleets,
    isLoading,
    error,
    refresh: fetchFleets,
    joinFleet,
  };
}

export default usePublicFleets;

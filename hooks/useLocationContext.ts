/**
 * Location Context Hook
 * Manages user's current location context for sailing network
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SailingNetworkService, LocationSummary, LocationContext } from '@/services/SailingNetworkService';
import { useAuth } from '@/providers/AuthProvider';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('LocationContext');

export interface UseLocationContextState {
  currentLocation: LocationContext | null;
  myLocations: LocationSummary[];
  isLoading: boolean;
  error: string | null;
}

export interface UseLocationContextActions {
  switchLocation: (locationName: string, locationRegion: string, coordinates: { lat: number; lng: number }) => Promise<void>;
  setLocationByGPS: (coordinates: { lat: number; lng: number }, locationName: string, locationRegion: string) => Promise<void>;
  refreshLocations: () => Promise<void>;
}

/**
 * Hook to manage user's location context for sailing network
 */
export function useLocationContext(): UseLocationContextState & UseLocationContextActions {
  const { user } = useAuth();
  const [state, setState] = useState<UseLocationContextState>({
    currentLocation: null,
    myLocations: [],
    isLoading: true,
    error: null,
  });
  const isMountedRef = useRef(true);
  const fetchRunIdRef = useRef(0);
  const activeUserIdRef = useRef<string | null>(user?.id ?? null);

  useEffect(() => {
    activeUserIdRef.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      fetchRunIdRef.current += 1;
    };
  }, []);

  /**
   * Fetch user's current location context and all locations
   */
  const fetchLocationContext = useCallback(async () => {
    const runId = ++fetchRunIdRef.current;
    const targetUserId = user?.id ?? null;
    const canCommit = () =>
      isMountedRef.current &&
      runId === fetchRunIdRef.current &&
      activeUserIdRef.current === targetUserId;

    if (!targetUserId) {
      if (!canCommit()) return;
      setState({
        currentLocation: null,
        myLocations: [],
        isLoading: false,
        error: null,
      });
      return;
    }

    if (!canCommit()) return;
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const [currentLocation, myLocations] = await Promise.all([
        SailingNetworkService.getCurrentLocationContext(),
        SailingNetworkService.getMyLocations(),
      ]);

      if (!canCommit()) return;
      setState({
        currentLocation,
        myLocations,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      logger.error('Failed to fetch location context:', error);
      if (!canCommit()) return;
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to fetch location context',
      }));
    }
  }, [user]);

  /**
   * Switch to a different location (manual selection)
   */
  const switchLocation = useCallback(async (
    locationName: string,
    locationRegion: string,
    coordinates: { lat: number; lng: number }
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await SailingNetworkService.setLocationContext(
        locationName,
        locationRegion,
        coordinates,
        'manual'
      );

      // Refresh location context
      await fetchLocationContext();
    } catch (error: any) {
      logger.error('Failed to switch location:', error);
      throw error;
    }
  }, [user, fetchLocationContext]);

  /**
   * Set location based on GPS coordinates
   */
  const setLocationByGPS = useCallback(async (
    coordinates: { lat: number; lng: number },
    locationName: string,
    locationRegion: string
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await SailingNetworkService.setLocationContext(
        locationName,
        locationRegion,
        coordinates,
        'gps'
      );

      // Refresh location context
      await fetchLocationContext();
    } catch (error: any) {
      logger.error('Failed to set GPS location:', error);
      throw error;
    }
  }, [user, fetchLocationContext]);

  /**
   * Manually refresh locations
   */
  const refreshLocations = useCallback(async () => {
    await fetchLocationContext();
  }, [fetchLocationContext]);

  // Fetch location context on mount and when user changes
  useEffect(() => {
    void fetchLocationContext();
  }, [fetchLocationContext]);

  return {
    ...state,
    switchLocation,
    setLocationByGPS,
    refreshLocations,
  };
}

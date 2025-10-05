/**
 * Location Context Hook
 * Manages user's current location context for sailing network
 */

import { useState, useEffect, useCallback } from 'react';
import { SailingNetworkService, LocationSummary, LocationContext } from '@/src/services/SailingNetworkService';
import { useAuth } from '@/src/providers/AuthProvider';

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

  /**
   * Fetch user's current location context and all locations
   */
  const fetchLocationContext = useCallback(async () => {
    console.log('📍 useLocationContext: fetchLocationContext called', { hasUser: !!user, userId: user?.id });

    if (!user) {
      console.log('📍 useLocationContext: No user, returning empty state');
      setState({
        currentLocation: null,
        myLocations: [],
        isLoading: false,
        error: null,
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('📍 useLocationContext: Fetching location data for user:', user.id);

      const [currentLocation, myLocations] = await Promise.all([
        SailingNetworkService.getCurrentLocationContext(),
        SailingNetworkService.getMyLocations(),
      ]);

      console.log('📍 useLocationContext: Location data received', {
        currentLocation,
        myLocations,
        locationsCount: myLocations.length,
      });

      setState({
        currentLocation,
        myLocations,
        isLoading: false,
        error: null,
      });

      console.log('📍 useLocationContext: Location context loaded', {
        current: currentLocation?.locationName,
        totalLocations: myLocations.length,
      });
    } catch (error: any) {
      console.error('❌ useLocationContext: Failed to fetch location context:', error);
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

    console.log('📍 useLocationContext: Switching location to:', locationName);

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
      console.error('❌ useLocationContext: Failed to switch location:', error);
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

    console.log('📍 useLocationContext: Setting location via GPS:', locationName);

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
      console.error('❌ useLocationContext: Failed to set GPS location:', error);
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
    fetchLocationContext();
  }, [fetchLocationContext]);

  return {
    ...state,
    switchLocation,
    setLocationByGPS,
    refreshLocations,
  };
}

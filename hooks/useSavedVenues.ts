/**
 * Saved Venues Hook
 * Manages user's saved/favorite sailing venues
 */

import { useState, useEffect, useCallback } from 'react';
import { SavedVenueService, type SavedVenueWithDetails } from '@/services/SavedVenueService';
import { useAuth } from '@/providers/AuthProvider';

export interface UseSavedVenuesState {
  savedVenues: SavedVenueWithDetails[];
  savedVenueIds: Set<string>;
  homeVenue: SavedVenueWithDetails | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseSavedVenuesActions {
  saveVenue: (venueId: string, options?: { notes?: string; isHomeVenue?: boolean }) => Promise<void>;
  unsaveVenue: (venueId: string) => Promise<void>;
  updateSavedVenue: (venueId: string, updates: { notes?: string; isHomeVenue?: boolean }) => Promise<void>;
  isVenueSaved: (venueId: string) => boolean;
  refreshSavedVenues: () => Promise<void>;
}

type UseSavedVenuesReturn = UseSavedVenuesState & UseSavedVenuesActions;

/**
 * Hook to manage user's saved sailing venues
 */
export function useSavedVenues(): UseSavedVenuesReturn {
  const { user } = useAuth();
  const [state, setState] = useState<UseSavedVenuesState>({
    savedVenues: [],
    savedVenueIds: new Set(),
    homeVenue: null,
    isLoading: true,
    error: null,
  });

  /**
   * Fetch saved venues for current user
   */
  const fetchSavedVenues = useCallback(async (): Promise<void> => {
    if (!user) {
      setState({
        savedVenues: [],
        savedVenueIds: new Set(),
        homeVenue: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const [venues, homeVenue] = await Promise.all([
        SavedVenueService.getSavedVenues(),
        SavedVenueService.getHomeVenue(),
      ]);

      const venueIds = new Set(venues.map((venue) => venue.id));

      setState({
        savedVenues: venues,
        savedVenueIds: venueIds,
        homeVenue,
        isLoading: false,
        error: null,
      });
    } catch (error: unknown) {
      const message =
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message?: unknown }).message === 'string'
          ? (error as { message: string }).message
          : 'Failed to fetch saved venues';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
    }
  }, [user]);

  /**
   * Save a venue to favorites
   */
  const saveVenue = useCallback(
    async (venueId: string, options?: { notes?: string; isHomeVenue?: boolean }): Promise<void> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      await SavedVenueService.saveVenue(venueId, options);
      await fetchSavedVenues(); // Refresh list
    },
    [user, fetchSavedVenues]
  );

  /**
   * Remove a venue from favorites
   */
  const unsaveVenue = useCallback(
    async (venueId: string): Promise<void> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      await SavedVenueService.unsaveVenue(venueId);
      await fetchSavedVenues(); // Refresh list
    },
    [user, fetchSavedVenues]
  );

  /**
   * Update saved venue details
   */
  const updateSavedVenue = useCallback(
    async (venueId: string, updates: { notes?: string; isHomeVenue?: boolean }): Promise<void> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      await SavedVenueService.updateSavedVenue(venueId, updates);
      await fetchSavedVenues(); // Refresh list
    },
    [user, fetchSavedVenues]
  );

  /**
   * Check if a venue is saved (fast Set lookup)
   */
  const isVenueSaved = useCallback((venueId: string): boolean => {
    return state.savedVenueIds.has(venueId);
  }, [state.savedVenueIds]);

  /**
   * Manually refresh saved venues
   */
  const refreshSavedVenues = useCallback(async (): Promise<void> => {
    await fetchSavedVenues();
  }, [fetchSavedVenues]);

  // Fetch saved venues on mount and when user changes
  useEffect(() => {
    fetchSavedVenues();
  }, [fetchSavedVenues]);

  return {
    ...state,
    saveVenue,
    unsaveVenue,
    updateSavedVenue,
    isVenueSaved,
    refreshSavedVenues,
  };
}

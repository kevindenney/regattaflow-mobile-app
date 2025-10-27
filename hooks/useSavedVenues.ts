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

/**
 * Hook to manage user's saved sailing venues
 */
export function useSavedVenues(): UseSavedVenuesState & UseSavedVenuesActions {
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
  const fetchSavedVenues = useCallback(async () => {
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

    console.log('📍 useSavedVenues: Fetching saved venues for user...');
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const [venues, homeVenue] = await Promise.all([
        SavedVenueService.getSavedVenues(),
        SavedVenueService.getHomeVenue(),
      ]);

      const venueIds = new Set(venues.map(v => v.id));

      setState({
        savedVenues: venues,
        savedVenueIds: venueIds,
        homeVenue,
        isLoading: false,
        error: null,
      });

      console.log('📍 useSavedVenues: Loaded saved venues:', {
        count: venues.length,
        hasHomeVenue: !!homeVenue,
      });
    } catch (error: any) {
      console.error('❌ useSavedVenues: Failed to fetch saved venues:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to fetch saved venues',
      }));
    }
  }, [user]);

  /**
   * Save a venue to favorites
   */
  const saveVenue = useCallback(async (
    venueId: string,
    options?: { notes?: string; isHomeVenue?: boolean }
  ) => {
    if (!user) throw new Error('User not authenticated');

    console.log('📍 useSavedVenues: Saving venue:', venueId);
    try {
      const result = await SavedVenueService.saveVenue(venueId, options);
      console.log('📍 useSavedVenues: Save result:', result);
      await fetchSavedVenues(); // Refresh list
      console.log('📍 useSavedVenues: Refreshed after save');
    } catch (error: any) {
      console.error('❌ useSavedVenues: Failed to save venue:', error);
      throw error;
    }
  }, [user, fetchSavedVenues]);

  /**
   * Remove a venue from favorites
   */
  const unsaveVenue = useCallback(async (venueId: string) => {
    if (!user) throw new Error('User not authenticated');

    console.log('📍 useSavedVenues: Unsaving venue:', venueId);
    try {
      await SavedVenueService.unsaveVenue(venueId);
      await fetchSavedVenues(); // Refresh list
    } catch (error: any) {
      console.error('❌ useSavedVenues: Failed to unsave venue:', error);
      throw error;
    }
  }, [user, fetchSavedVenues]);

  /**
   * Update saved venue details
   */
  const updateSavedVenue = useCallback(async (
    venueId: string,
    updates: { notes?: string; isHomeVenue?: boolean }
  ) => {
    if (!user) throw new Error('User not authenticated');

    console.log('📍 useSavedVenues: Updating saved venue:', venueId);
    try {
      await SavedVenueService.updateSavedVenue(venueId, updates);
      await fetchSavedVenues(); // Refresh list
    } catch (error: any) {
      console.error('❌ useSavedVenues: Failed to update saved venue:', error);
      throw error;
    }
  }, [user, fetchSavedVenues]);

  /**
   * Check if a venue is saved (fast Set lookup)
   */
  const isVenueSaved = useCallback((venueId: string): boolean => {
    return state.savedVenueIds.has(venueId);
  }, [state.savedVenueIds]);

  /**
   * Manually refresh saved venues
   */
  const refreshSavedVenues = useCallback(async () => {
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

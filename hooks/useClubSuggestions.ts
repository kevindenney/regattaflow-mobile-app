/**
 * Use Club Suggestions Hook
 * Auto-suggestion logic for club onboarding
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ClubOnboardingService,
  type ClubSuggestion,
  type ClassSuggestion,
  type VenueSuggestion,
} from '@/services/ClubOnboardingService';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useClubSuggestions');

// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;

  const debounced = function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func.apply(this, args), wait);
  } as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

export interface UseClubSuggestionsOptions {
  query?: string;
  selectedClubId?: string;
  selectedVenueId?: string;
  coordinates?: { lat: number; lng: number };
  autoDetectLocation?: boolean;
}

export function useClubSuggestions(options: UseClubSuggestionsOptions = {}) {
  const { query, selectedClubId, selectedVenueId, coordinates, autoDetectLocation = false } = options;

  // Club suggestions
  const [clubSuggestions, setClubSuggestions] = useState<ClubSuggestion[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(false);

  // Class suggestions
  const [classSuggestions, setClassSuggestions] = useState<ClassSuggestion[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Venue suggestions
  const [venueSuggestions, setVenueSuggestions] = useState<VenueSuggestion[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(false);

  /**
   * Load club suggestions based on location
   */
  const loadLocationBasedClubs = useCallback(async () => {
    if (!autoDetectLocation) return;

    setLoadingClubs(true);
    try {
      const suggestions = await ClubOnboardingService.suggestClubsByLocation();
      setClubSuggestions(suggestions);
      logger.debug('Loaded location-based club suggestions', suggestions.length);
    } catch (error) {
      logger.error('Error loading location-based clubs:', error);
    } finally {
      setLoadingClubs(false);
    }
  }, [autoDetectLocation]);

  /**
   * Search clubs by query
   */
  const searchClubs = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setClubSuggestions([]);
      return;
    }

    setLoadingClubs(true);
    try {
      const suggestions = await ClubOnboardingService.searchClubs(searchQuery.trim(), 10);
      setClubSuggestions(suggestions);
      logger.debug('Searched clubs:', suggestions.length);
    } catch (error) {
      logger.error('Error searching clubs:', error);
    } finally {
      setLoadingClubs(false);
    }
  }, []);

  /**
   * Debounced club search
   */
  const debouncedSearchClubs = useMemo(
    () => debounce(searchClubs, 300),
    [searchClubs]
  );

  /**
   * Load class suggestions when a club is selected
   */
  const loadClassSuggestions = useCallback(async (clubId: string) => {
    setLoadingClasses(true);
    try {
      const suggestions = await ClubOnboardingService.suggestClassesByClub(clubId);
      setClassSuggestions(suggestions);
      logger.debug('Loaded class suggestions for club:', suggestions.length);
    } catch (error) {
      logger.error('Error loading class suggestions:', error);
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  /**
   * Load class suggestions by region/venue
   */
  const loadClassSuggestionsByRegion = useCallback(async (venueId: string) => {
    setLoadingClasses(true);
    try {
      const suggestions = await ClubOnboardingService.suggestClassesByRegion(venueId);
      setClassSuggestions(suggestions);
      logger.debug('Loaded class suggestions for region:', suggestions.length);
    } catch (error) {
      logger.error('Error loading class suggestions by region:', error);
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  /**
   * Search venues by query
   */
  const searchVenues = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setVenueSuggestions([]);
      return;
    }

    setLoadingVenues(true);
    try {
      const suggestions = await ClubOnboardingService.suggestVenues(searchQuery.trim());
      setVenueSuggestions(suggestions);
      logger.debug('Searched venues:', suggestions.length);
    } catch (error) {
      logger.error('Error searching venues:', error);
    } finally {
      setLoadingVenues(false);
    }
  }, []);

  /**
   * Debounced venue search
   */
  const debouncedSearchVenues = useMemo(
    () => debounce(searchVenues, 300),
    [searchVenues]
  );

  /**
   * Load venue suggestions by coordinates
   */
  const loadVenuesByCoordinates = useCallback(async (coords: { lat: number; lng: number }) => {
    setLoadingVenues(true);
    try {
      const suggestions = await ClubOnboardingService.suggestVenues(undefined, coords);
      setVenueSuggestions(suggestions);
      logger.debug('Loaded venues by coordinates:', suggestions.length);
    } catch (error) {
      logger.error('Error loading venues by coordinates:', error);
    } finally {
      setLoadingVenues(false);
    }
  }, []);

  /**
   * Clear all suggestions
   */
  const clearSuggestions = useCallback(() => {
    setClubSuggestions([]);
    setClassSuggestions([]);
    setVenueSuggestions([]);
  }, []);

  /**
   * Clear club suggestions
   */
  const clearClubSuggestions = useCallback(() => {
    setClubSuggestions([]);
  }, []);

  /**
   * Clear class suggestions
   */
  const clearClassSuggestions = useCallback(() => {
    setClassSuggestions([]);
  }, []);

  /**
   * Clear venue suggestions
   */
  const clearVenueSuggestions = useCallback(() => {
    setVenueSuggestions([]);
  }, []);

  // Auto-load based on options
  useEffect(() => {
    if (autoDetectLocation && clubSuggestions.length === 0) {
      loadLocationBasedClubs();
    }
  }, [autoDetectLocation, clubSuggestions.length, loadLocationBasedClubs]);

  // Search clubs when query changes
  useEffect(() => {
    if (query) {
      debouncedSearchClubs(query);
    } else {
      setClubSuggestions([]);
    }

    // Cleanup debounce
    return () => {
      debouncedSearchClubs.cancel();
    };
  }, [query, debouncedSearchClubs]);

  // Load class suggestions when club is selected
  useEffect(() => {
    if (selectedClubId) {
      loadClassSuggestions(selectedClubId);
    } else if (selectedVenueId) {
      loadClassSuggestionsByRegion(selectedVenueId);
    } else {
      setClassSuggestions([]);
    }
  }, [selectedClubId, selectedVenueId, loadClassSuggestions, loadClassSuggestionsByRegion]);

  // Load venues by coordinates
  useEffect(() => {
    if (coordinates) {
      loadVenuesByCoordinates(coordinates);
    }
  }, [coordinates, loadVenuesByCoordinates]);

  return {
    // Club suggestions
    clubSuggestions,
    loadingClubs,
    searchClubs: debouncedSearchClubs,
    loadLocationBasedClubs,
    clearClubSuggestions,

    // Class suggestions
    classSuggestions,
    loadingClasses,
    loadClassSuggestions,
    loadClassSuggestionsByRegion,
    clearClassSuggestions,

    // Venue suggestions
    venueSuggestions,
    loadingVenues,
    searchVenues: debouncedSearchVenues,
    loadVenuesByCoordinates,
    clearVenueSuggestions,

    // General
    clearSuggestions,
    loading: loadingClubs || loadingClasses || loadingVenues,
  };
}

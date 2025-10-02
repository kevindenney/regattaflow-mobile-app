/**
 * Venue Intelligence Hook
 * React integration for Global Venue Intelligence System
 * Provides "OnX Maps for Sailing" experience with location-aware features
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  SailingVenue,
  VenueTransition,
  LocationDetection,
} from '@/src/lib/types/global-venues';
import type { RegionalIntelligenceData } from '@/src/services/venue/RegionalIntelligenceService';
import { venueDetectionService } from '@/src/services/location/VenueDetectionService';
import { regionalIntelligenceService } from '@/src/services/venue/RegionalIntelligenceService';

export interface VenueIntelligenceState {
  // Current venue state
  currentVenue: SailingVenue | null;
  isDetecting: boolean;
  detectionError: string | null;

  // Intelligence data
  intelligence: RegionalIntelligenceData | null;
  isLoadingIntelligence: boolean;
  intelligenceError: string | null;

  // Location state
  locationStatus: LocationDetection | null;

  // Transition state
  lastTransition: VenueTransition | null;
  adaptationRequired: boolean;
}

export interface VenueIntelligenceActions {
  // Venue control
  initializeDetection: () => Promise<boolean>;
  setVenueManually: (venueId: string) => Promise<boolean>;
  refreshIntelligence: () => Promise<void>;

  // Intelligence access
  getWeatherIntelligence: () => ReturnType<typeof regionalIntelligenceService.getWeatherIntelligence>;
  getTacticalIntelligence: () => ReturnType<typeof regionalIntelligenceService.getTacticalIntelligence>;
  getCulturalIntelligence: () => ReturnType<typeof regionalIntelligenceService.getCulturalIntelligence>;

  // Cleanup
  cleanup: () => Promise<void>;
}

/**
 * Main venue intelligence hook
 * Provides complete OnX Maps-style location intelligence for sailing
 */
export function useVenueIntelligence(): VenueIntelligenceState & VenueIntelligenceActions {
  const [state, setState] = useState<VenueIntelligenceState>({
    currentVenue: null,
    isDetecting: false,
    detectionError: null,
    intelligence: null,
    isLoadingIntelligence: false,
    intelligenceError: null,
    locationStatus: null,
    lastTransition: null,
    adaptationRequired: false,
  });

  /**
   * Sync service venue to state if there's a mismatch
   * This handles cases where the service has a venue but the hook state doesn't
   */
  useEffect(() => {
    const serviceVenue = venueDetectionService?.getCurrentVenue();
    if (serviceVenue && !state.currentVenue) {
      const syncVenue = async () => {
        setState(prev => ({
          ...prev,
          currentVenue: serviceVenue,
          locationStatus: {
            coordinates: {
              latitude: serviceVenue.coordinates.latitude,
              longitude: serviceVenue.coordinates.longitude
            },
            timestamp: new Date(),
            venue: serviceVenue
          } as LocationDetection,
        }));

        // Load intelligence for the synced venue
        try {
          const intelligence = await regionalIntelligenceService.loadVenueIntelligence(serviceVenue);
          setState(prev => ({
            ...prev,
            intelligence,
            isLoadingIntelligence: false,
          }));
        } catch (error) {
          // Silent fail during sync
        }
      };

      syncVenue();
    }
  }, [state.currentVenue]); // Only run when state.currentVenue changes

  /**
   * Initialize venue detection system
   */
  const initializeDetection = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isDetecting: true, detectionError: null }));

    try {
      // Initialize venue detection service (this tries GPS on native, falls back on web)
      const success = await venueDetectionService.initialize();

      if (!success) {
        setState(prev => ({
          ...prev,
          isDetecting: false,
          detectionError: 'Failed to initialize location services',
        }));
        return false;
      }

      // Set up venue detection callback using correct API
      venueDetectionService.addLocationListener(async (locationUpdate) => {
        setState(prev => ({
          ...prev,
          currentVenue: locationUpdate.venue,
          locationStatus: {
            coordinates: locationUpdate.coordinates,
            timestamp: locationUpdate.timestamp,
            venue: locationUpdate.venue
          } as LocationDetection,
        }));

        // Load intelligence for new venue only if venue changed
        if (locationUpdate.changed && locationUpdate.venue) {
          await loadVenueIntelligence(locationUpdate.venue);
        } else if (locationUpdate.changed && !locationUpdate.venue) {
          setState(prev => ({
            ...prev,
            intelligence: null,
            adaptationRequired: false,
          }));
        }
      });

      // Fix race condition: Check if venue was already detected during initialization
      const currentVenue = venueDetectionService.getCurrentVenue();

      if (currentVenue) {
        setState(prev => ({
          ...prev,
          currentVenue,
          locationStatus: {
            coordinates: { latitude: 0, longitude: 0 }, // Will be updated when location is available
            timestamp: new Date(),
            venue: currentVenue
          } as LocationDetection,
        }));

        // Load intelligence for already-detected venue
        await loadVenueIntelligence(currentVenue);
      }

      // Note: Venue detection callback already set up above with addLocationListener
      // No additional callbacks needed as LocationUpdate provides all information

      setState(prev => ({ ...prev, isDetecting: false }));
      return true;
    } catch (error) {
      console.error('Failed to initialize venue intelligence:', error);
      setState(prev => ({
        ...prev,
        isDetecting: false,
        detectionError: error instanceof Error ? error.message : 'Unknown error',
      }));
      return false;
    }
  }, []);

  /**
   * Load intelligence for a venue
   */
  const loadVenueIntelligence = useCallback(async (venue: SailingVenue) => {
    setState(prev => ({ ...prev, isLoadingIntelligence: true, intelligenceError: null }));

    try {
      const intelligence = await regionalIntelligenceService.loadVenueIntelligence(venue);

      setState(prev => ({
        ...prev,
        intelligence,
        isLoadingIntelligence: false,
      }));
    } catch (error) {
      console.error(`Failed to load intelligence for ${venue.name}:`, error);
      setState(prev => ({
        ...prev,
        isLoadingIntelligence: false,
        intelligenceError: error instanceof Error ? error.message : 'Failed to load intelligence',
      }));
    }
  }, []);

  /**
   * Manually set venue
   */
  const setVenueManually = useCallback(async (venueId: string): Promise<boolean> => {
    const success = await venueDetectionService.setManualVenue(venueId);

    if (success) {
      const newVenue = venueDetectionService.getCurrentVenue();

      // CRITICAL FIX: Immediately update state after manual venue selection
      // Don't rely solely on listener callback which may have timing issues
      if (newVenue) {
        setState(prev => ({
          ...prev,
          currentVenue: newVenue,
          locationStatus: {
            coordinates: { latitude: newVenue.coordinates.latitude, longitude: newVenue.coordinates.longitude },
            timestamp: new Date(),
            venue: newVenue
          } as LocationDetection,
        }));

        // Load intelligence for the new venue
        await loadVenueIntelligence(newVenue);
      }
    }

    return success;
  }, [loadVenueIntelligence]);

  /**
   * Refresh current intelligence
   */
  const refreshIntelligence = useCallback(async () => {
    if (!state.currentVenue) return;

    regionalIntelligenceService.clearCache();
    await loadVenueIntelligence(state.currentVenue);
  }, [state.currentVenue, loadVenueIntelligence]);

  /**
   * Get weather intelligence
   */
  const getWeatherIntelligence = useCallback(() => {
    if (!state.currentVenue) return Promise.resolve(null);
    return regionalIntelligenceService.getWeatherIntelligence(state.currentVenue.id);
  }, [state.currentVenue]);

  /**
   * Get tactical intelligence
   */
  const getTacticalIntelligence = useCallback(() => {
    if (!state.currentVenue) return Promise.resolve(null);
    return regionalIntelligenceService.getTacticalIntelligence(state.currentVenue.id);
  }, [state.currentVenue]);

  /**
   * Get cultural intelligence
   */
  const getCulturalIntelligence = useCallback(() => {
    if (!state.currentVenue) return Promise.resolve(null);
    return regionalIntelligenceService.getCulturalIntelligence(state.currentVenue.id);
  }, [state.currentVenue]);

  /**
   * Cleanup resources
   */
  const cleanup = useCallback(async () => {
    try {
      if (venueDetectionService && typeof venueDetectionService.cleanup === 'function') {
        await venueDetectionService.cleanup();
      }

      if (regionalIntelligenceService && typeof regionalIntelligenceService.clearCache === 'function') {
        regionalIntelligenceService.clearCache();
      }
    } catch (error) {
      // Silent fail during cleanup
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    // State
    ...state,

    // Actions
    initializeDetection,
    setVenueManually,
    refreshIntelligence,
    getWeatherIntelligence,
    getTacticalIntelligence,
    getCulturalIntelligence,
    cleanup,
  };
}

/**
 * Simplified hook for current venue only
 */
export function useCurrentVenue() {
  const [currentVenue, setCurrentVenue] = useState<SailingVenue | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    const initializeSimple = async () => {
      setIsDetecting(true);
      const success = await venueDetectionService.initialize();

      if (success) {
        venueDetectionService.onVenueDetected((venue) => {
          setCurrentVenue(venue);
        });
      }

      setIsDetecting(false);
    };

    initializeSimple();

    return () => {
      venueDetectionService.cleanup();
    };
  }, []);

  return {
    currentVenue,
    isDetecting,
  };
}

/**
 * Hook for weather intelligence only
 */
export function useVenueWeather(venueId?: string) {
  const [weatherIntelligence, setWeatherIntelligence] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!venueId) return;

    const loadWeather = async () => {
      setIsLoading(true);
      try {
        const weather = await regionalIntelligenceService.getWeatherIntelligence(venueId);
        setWeatherIntelligence(weather);
      } catch (error) {
        console.error('Failed to load weather intelligence:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWeather();
  }, [venueId]);

  return {
    weatherIntelligence,
    isLoading,
  };
}

/**
 * Hook for tactical intelligence only
 */
export function useVenueTactics(venueId?: string) {
  const [tacticalIntelligence, setTacticalIntelligence] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!venueId) return;

    const loadTactics = async () => {
      setIsLoading(true);
      try {
        const tactics = await regionalIntelligenceService.getTacticalIntelligence(venueId);
        setTacticalIntelligence(tactics);
      } catch (error) {
        console.error('Failed to load tactical intelligence:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTactics();
  }, [venueId]);

  return {
    tacticalIntelligence,
    isLoading,
  };
}

/**
 * Hook for cultural intelligence only
 */
export function useVenueCulture(venueId?: string) {
  const [culturalIntelligence, setCulturalIntelligence] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!venueId) return;

    const loadCulture = async () => {
      setIsLoading(true);
      try {
        const culture = await regionalIntelligenceService.getCulturalIntelligence(venueId);
        setCulturalIntelligence(culture);
      } catch (error) {
        console.error('Failed to load cultural intelligence:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCulture();
  }, [venueId]);

  return {
    culturalIntelligence,
    isLoading,
  };
}
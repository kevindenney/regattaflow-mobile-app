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
import { venueDetectionService } from '@/src/services/venue/VenueDetectionService';
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
  setVenueManually: (venueId: string) => Promise<void>;
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

  console.log('🎯 HOOK INIT DEBUG: useVenueIntelligence hook created with initial state:', state);

  /**
   * Initialize venue detection system
   */
  const initializeDetection = useCallback(async (): Promise<boolean> => {
    console.log('🎯 Initializing venue intelligence system');

    setState(prev => ({ ...prev, isDetecting: true, detectionError: null }));

    try {
      // Initialize venue detection service
      const success = await venueDetectionService.initialize();
      console.log('🎯 Hook Init - Venue detection service initialized:', success);

      if (!success) {
        setState(prev => ({
          ...prev,
          isDetecting: false,
          detectionError: 'Failed to initialize location services',
        }));
        return false;
      }

      // Set up venue detection callback
      console.log('🎯 Hook Init - Setting up venue detection callback');
      venueDetectionService.onVenueDetected(async (venue) => {
        console.log(`🎯 Hook Callback - Venue detected: ${venue?.name || 'None'}`);
        console.log(`🎯 Hook Callback - Setting state with venue:`, venue);

        setState(prev => {
          console.log(`🎯 Hook Callback - Previous state:`, { currentVenue: prev.currentVenue?.name || null });
          const newState = {
            ...prev,
            currentVenue: venue,
            locationStatus: venueDetectionService.getDetectionStatus(),
          };
          console.log(`🎯 Hook Callback - New state:`, { currentVenue: newState.currentVenue?.name || null });
          return newState;
        });

        // Load intelligence for new venue
        if (venue) {
          await loadVenueIntelligence(venue);
        } else {
          setState(prev => ({
            ...prev,
            intelligence: null,
            adaptationRequired: false,
          }));
        }
      });

      // Fix race condition: Check if venue was already detected during initialization
      const currentVenue = venueDetectionService.getCurrentVenue();
      console.log('🎯 Hook Init - Current venue after setup:', currentVenue?.name || 'None');

      if (currentVenue) {
        console.log('🎯 Hook Init - Syncing already-detected venue to hook state');
        setState(prev => ({
          ...prev,
          currentVenue,
          locationStatus: venueDetectionService.getDetectionStatus(),
        }));

        // Load intelligence for already-detected venue
        await loadVenueIntelligence(currentVenue);
      }

      // Set up venue detection callback
      venueDetectionService.onVenueDetected((venue) => {
        console.log(`🎯 DEBUG: Hook received venue detection: ${venue?.name || 'None'}`);

        setState(prev => ({
          ...prev,
          currentVenue: venue,
          isDetecting: false,
        }));

        // Load intelligence for new venue
        if (venue) {
          loadVenueIntelligence(venue);
        }
      });

      // Set up venue transition callback
      venueDetectionService.onVenueTransition((transition) => {
        console.log(`🎯 Venue transition: ${transition.fromVenue?.name || 'None'} → ${transition.toVenue.name}`);

        setState(prev => ({
          ...prev,
          lastTransition: transition,
          adaptationRequired: transition.adaptationRequired.length > 0,
        }));

        // Log adaptation requirements
        if (transition.adaptationRequired.length > 0) {
          console.log('🎯 Adaptations required:', transition.adaptationRequired.map(a => a.description));
        }
      });

      setState(prev => ({ ...prev, isDetecting: false }));
      console.log('🎯 Venue intelligence system initialized successfully');

      return true;
    } catch (error) {
      console.error('🎯 Failed to initialize venue intelligence:', error);
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
      console.log(`🎯 Loading intelligence for ${venue.name}`);
      const intelligence = await regionalIntelligenceService.loadVenueIntelligence(venue);
      console.log(`🎯 Intelligence service returned:`, intelligence ? 'Data received' : 'null');

      setState(prev => ({
        ...prev,
        intelligence,
        isLoadingIntelligence: false,
      }));

      console.log(`🎯 Intelligence loaded: ${intelligence.weatherIntelligence.forecast.length} weather forecasts, ${intelligence.tacticalIntelligence.localTactics.length} tactical recommendations`);
    } catch (error) {
      console.error(`🎯 Failed to load intelligence for ${venue.name}:`, error);
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
  const setVenueManually = useCallback(async (venueId: string) => {
    console.log(`🎯 Manual venue selection: ${venueId}`);
    await venueDetectionService.setVenueManually(venueId);
  }, []);

  /**
   * Refresh current intelligence
   */
  const refreshIntelligence = useCallback(async () => {
    if (!state.currentVenue) return;

    console.log(`🎯 Refreshing intelligence for ${state.currentVenue.name}`);
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
    console.log('🎯 Cleaning up venue intelligence');
    await venueDetectionService.cleanup();
    regionalIntelligenceService.clearCache();
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
/**
 * Global Venue Intelligence Hook
 * React hook for location-aware sailing venue intelligence
 * Core of the "OnX Maps for Sailing" user experience
 */

import { useState, useEffect, useCallback } from 'react';
import { globalVenueDatabase } from '@/src/services/venue/GlobalVenueDatabase';
import { VenueDetectionService } from '@/src/services/venue/VenueDetectionService';
import { useRegionalWeather } from './useRegionalWeather';
import type {
  SailingVenue,
  VenueTransition,
  LocationDetection,
  CulturalBriefing,
  Coordinates
} from '@/src/lib/types/global-venues';

export interface VenueIntelligenceState {
  // Current venue context
  currentVenue: SailingVenue | null;
  currentLocation: Coordinates | null;
  venueConfidence: number;

  // Detection state
  isDetecting: boolean;
  detectionMethod: 'gps' | 'network' | 'manual' | null;
  lastDetectionUpdate: Date | null;

  // Venue switching
  isTransitioning: boolean;
  lastTransition: VenueTransition | null;
  adaptationRequired: boolean;

  // Intelligence data
  nearbyVenues: SailingVenue[];
  culturalBriefing: CulturalBriefing | null;
  venueRecommendations: SailingVenue[];

  // User preferences
  homeVenue: SailingVenue | null;
  visitedVenues: SailingVenue[];
  favoritedVenues: SailingVenue[];

  // Error handling
  error: string | null;
  hasLocationPermission: boolean;
}

export function useGlobalVenueIntelligence() {
  // Initialize weather intelligence integration
  const weather = useRegionalWeather();

  const [state, setState] = useState<VenueIntelligenceState>({
    currentVenue: null,
    currentLocation: null,
    venueConfidence: 0,
    isDetecting: false,
    detectionMethod: null,
    lastDetectionUpdate: null,
    isTransitioning: false,
    lastTransition: null,
    adaptationRequired: false,
    nearbyVenues: [],
    culturalBriefing: null,
    venueRecommendations: [],
    homeVenue: null,
    visitedVenues: [],
    favoritedVenues: [],
    error: null,
    hasLocationPermission: false
  });

  const [venueDetector] = useState(() => new VenueDetectionService());

  /**
   * Initialize venue intelligence system
   */
  const initialize = useCallback(async () => {
    console.log('🌍 Initializing Global Venue Intelligence...');

    try {
      setState(prev => ({ ...prev, isDetecting: true, error: null }));

      // Initialize global venue database
      await globalVenueDatabase.initialize();

      // Initialize venue detection
      const hasPermission = await venueDetector.initialize();

      setState(prev => ({
        ...prev,
        isDetecting: false,
        hasLocationPermission: hasPermission,
        lastDetectionUpdate: new Date()
      }));

      // Always set up callbacks, regardless of permission status
      // because we have timezone-based fallback detection
      setupVenueDetectionCallbacks();
      console.log('🌍 Global Venue Intelligence initialized successfully');

      if (!hasPermission) {
        console.log('🌍 Using timezone-based venue detection');
      }

    } catch (error: any) {
      console.error('🌍 Failed to initialize venue intelligence:', error);
      setState(prev => ({
        ...prev,
        isDetecting: false,
        error: error.message
      }));
    }
  }, [venueDetector]);

  /**
   * Force venue detection to run (useful for testing)
   */
  const forceVenueDetection = useCallback(async () => {
    if (venueDetector) {
      await venueDetector.forceDetection();
    }
  }, [venueDetector]);

  /**
   * Setup callbacks for venue detection events
   */
  const setupVenueDetectionCallbacks = useCallback(() => {
    // Listen for venue detection
    venueDetector.onVenueDetected((venue: SailingVenue | null) => {
      console.log('🌍 Venue detected:', venue?.name || 'Unknown location');

      setState(prev => {
        const isNewVenue = venue?.id !== prev.currentVenue?.id;

        return {
          ...prev,
          currentVenue: venue,
          venueConfidence: venue ? 0.9 : 0.1,
          detectionMethod: 'gps',
          lastDetectionUpdate: new Date(),
          isTransitioning: isNewVenue && venue !== null,
          adaptationRequired: isNewVenue && venue !== null
        };
      });

      if (venue) {
        loadVenueIntelligence(venue);
        // Load weather data for the new venue
        weather.loadVenueWeather(venue);
      }
    });

    // Listen for venue transitions
    venueDetector.onVenueTransition((transition: VenueTransition) => {
      console.log('🌍 Venue transition:', transition.fromVenue?.name, '→', transition.toVenue.name);

      setState(prev => ({
        ...prev,
        lastTransition: transition,
        isTransitioning: true,
        adaptationRequired: true
      }));

      handleVenueTransition(transition);
    });
  }, [venueDetector]);

  /**
   * Load comprehensive intelligence for a venue
   */
  const loadVenueIntelligence = useCallback(async (venue: SailingVenue) => {
    console.log('🌍 Loading intelligence for:', venue.name);

    try {
      // Get nearby venues for circuit planning
      const nearby = globalVenueDatabase.getNearbyVenues(venue.coordinates, 500);

      // Generate cultural briefing
      const briefing = await generateCulturalBriefing(venue);

      // Get venue recommendations based on user profile
      const recommendations = await getVenueRecommendations(venue);

      // Load weather comparison for nearby venues
      if (nearby.length > 0) {
        weather.loadNearbyWeather(nearby.slice(0, 5));
      }

      setState(prev => ({
        ...prev,
        nearbyVenues: nearby,
        culturalBriefing: briefing,
        venueRecommendations: recommendations,
        isTransitioning: false
      }));

      console.log('🌍 Venue intelligence loaded:', {
        nearby: nearby.length,
        hasBriefing: !!briefing,
        recommendations: recommendations.length
      });

    } catch (error: any) {
      console.error('🌍 Failed to load venue intelligence:', error);
      setState(prev => ({ ...prev, error: error.message }));
    }
  }, []);

  /**
   * Handle venue transition with cultural adaptation
   */
  const handleVenueTransition = useCallback(async (transition: VenueTransition) => {
    console.log('🌍 Processing venue transition...');

    // Mark venue as visited
    setState(prev => {
      const visited = prev.visitedVenues.filter(v => v.id !== transition.toVenue.id);
      visited.push(transition.toVenue);

      return {
        ...prev,
        visitedVenues: visited.slice(-20) // Keep last 20 visited venues
      };
    });

    // Generate adaptation requirements
    const adaptations = generateAdaptationRequirements(transition);
    console.log('🌍 Adaptation requirements:', adaptations.length);

    // Complete transition
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        isTransitioning: false,
        adaptationRequired: false
      }));
    }, 2000);
  }, []);

  /**
   * Manually select a venue (when GPS detection is not available)
   */
  const selectVenue = useCallback(async (venueId: string) => {
    console.log('🌍 Manually selecting venue:', venueId);

    const venue = globalVenueDatabase.getVenueById(venueId);
    if (!venue) {
      setState(prev => ({ ...prev, error: `Venue ${venueId} not found` }));
      return;
    }

    setState(prev => ({
      ...prev,
      currentVenue: venue,
      venueConfidence: 0.8, // Slightly lower confidence for manual selection
      detectionMethod: 'manual',
      lastDetectionUpdate: new Date(),
      isTransitioning: venue.id !== prev.currentVenue?.id,
      error: null
    }));

    await loadVenueIntelligence(venue);

    // Load weather data for manually selected venue
    weather.loadVenueWeather(venue);
  }, [loadVenueIntelligence, weather]);

  /**
   * Search venues globally
   */
  const searchVenues = useCallback((query: string, limit?: number) => {
    return globalVenueDatabase.searchVenues(query, limit);
  }, []);

  /**
   * Get venues by region or type
   */
  const getVenuesByRegion = useCallback((region: string) => {
    return globalVenueDatabase.getVenuesByRegion(region);
  }, []);

  /**
   * Toggle venue as favorite
   */
  const toggleFavoriteVenue = useCallback((venue: SailingVenue) => {
    setState(prev => {
      const isFavorited = prev.favoritedVenues.some(v => v.id === venue.id);

      if (isFavorited) {
        return {
          ...prev,
          favoritedVenues: prev.favoritedVenues.filter(v => v.id !== venue.id)
        };
      } else {
        return {
          ...prev,
          favoritedVenues: [...prev.favoritedVenues, venue]
        };
      }
    });
  }, []);

  /**
   * Set home venue
   */
  const setHomeVenue = useCallback((venue: SailingVenue) => {
    console.log('🌍 Setting home venue:', venue.name);
    setState(prev => ({ ...prev, homeVenue: venue }));
  }, []);

  /**
   * Get global sailing statistics
   */
  const getGlobalStats = useCallback(() => {
    return globalVenueDatabase.getGlobalStats();
  }, []);

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    // State
    ...state,

    // Actions
    initialize,
    selectVenue,
    searchVenues,
    getVenuesByRegion,
    toggleFavoriteVenue,
    setHomeVenue,
    getGlobalStats,
    clearError,
    forceVenueDetection,

    // Weather Intelligence Integration
    weather: {
      ...weather,
      // Expose key weather methods for easy access
      refreshWeather: weather.refreshWeather,
      weatherSummary: weather.weatherSummary,
      isGoodSailing: weather.isGoodSailing,
      hasCriticalAlerts: weather.hasCriticalAlerts
    },

    // Utilities
    isInitialized: !state.isDetecting && state.lastDetectionUpdate !== null
  };
}

/**
 * Generate cultural briefing for venue transition
 */
async function generateCulturalBriefing(venue: SailingVenue): Promise<CulturalBriefing> {
  // This would typically call an AI service to generate contextual briefings
  // For now, return a structured briefing based on venue data

  return {
    venueId: venue.id,
    languageInfo: {
      primaryLanguage: venue.culturalContext.primaryLanguages[0],
      commonPhrases: [
        { english: 'Hello', local: 'Hello', context: 'greeting' },
        { english: 'Thank you', local: 'Thank you', context: 'courtesy' },
        { english: 'Good wind', local: 'Good wind', context: 'sailing' }
      ],
      sailingTerminology: [
        { english: 'port', local: 'port', context: 'direction' },
        { english: 'starboard', local: 'starboard', context: 'direction' }
      ]
    },
    culturalProtocols: venue.culturalContext.racingCustoms.map(custom => ({
      situation: custom.name,
      expectedBehavior: custom.description,
      importance: custom.importance,
      consequences: 'Follow local customs for best sailing experience'
    })),
    economicInfo: {
      currency: venue.culturalContext.economicFactors.currency,
      tippingCustoms: [{
        service: 'General',
        expected: venue.culturalContext.economicFactors.tipping.expected,
        rate: venue.culturalContext.economicFactors.tipping.rate,
        rateType: 'percentage'
      }],
      typicalCosts: [{
        category: 'accommodation',
        description: 'Moderate hotel',
        cost: venue.culturalContext.economicFactors.accommodation.moderate,
        currency: venue.culturalContext.economicFactors.currency
      }],
      paymentMethods: [{
        type: 'card',
        acceptance: 'common',
        notes: 'Credit cards widely accepted'
      }]
    },
    practicalTips: [{
      category: 'cultural',
      tip: `Welcome to ${venue.name}! This venue has a ${venue.culturalContext.sailingCulture.tradition} sailing tradition.`,
      importance: 'helpful',
      source: 'verified'
    }]
  };
}

/**
 * Get venue recommendations based on user profile and current venue
 */
async function getVenueRecommendations(currentVenue: SailingVenue): Promise<SailingVenue[]> {
  // This would analyze user preferences and sailing history
  // For now, return similar venues in the same region

  const sameRegionVenues = globalVenueDatabase.getVenuesByRegion(currentVenue.region);
  return sameRegionVenues
    .filter(venue => venue.id !== currentVenue.id)
    .slice(0, 5);
}

/**
 * Generate adaptation requirements for venue transition
 */
function generateAdaptationRequirements(transition: VenueTransition) {
  const requirements = [];

  // Language adaptation
  if (transition.fromVenue?.culturalContext.primaryLanguages[0].code !==
      transition.toVenue.culturalContext.primaryLanguages[0].code) {
    requirements.push({
      category: 'language',
      description: 'Primary language change detected',
      priority: 'important',
      actionRequired: 'Review local sailing terminology',
      userCanConfigure: true
    });
  }

  // Currency adaptation
  if (transition.fromVenue?.culturalContext.economicFactors.currency !==
      transition.toVenue.culturalContext.economicFactors.currency) {
    requirements.push({
      category: 'currency',
      description: 'Currency change detected',
      priority: 'important',
      actionRequired: 'Update currency preferences',
      userCanConfigure: true
    });
  }

  return requirements;
}

export default useGlobalVenueIntelligence;
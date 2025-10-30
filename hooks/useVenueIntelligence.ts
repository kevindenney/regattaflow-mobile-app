/**
 * Venue Intelligence Hook Suite
 * Provides sailing venue detection + regional intelligence with graceful fallbacks
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  SailingVenue as GlobalSailingVenue,
  VenueTransition,
  LocationDetection,
  VenueType,
  VenueConditionProfile,
  VenueCulturalProfile,
  WeatherSourceConfig,
  ServiceProvider as GlobalServiceProvider,
} from '@/lib/types/global-venues';
import type { RegionalIntelligenceData } from '@/services/venue/RegionalIntelligenceService';
import {
  venueDetectionService,
  type SailingVenue as DetectionVenue,
  type LocationUpdate,
} from '@/services/location/VenueDetectionService';
import { regionalIntelligenceService } from '@/services/venue/RegionalIntelligenceService';

/**
 * Helpers to normalize detection-service venues into the richer global schema
 */

const mapClassificationToVenueType = (classification: DetectionVenue['classification']): VenueType => {
  switch (classification) {
    case 'championship':
      return 'championship';
    case 'premier':
      return 'premier';
    case 'regional':
      return 'regional';
    default:
      return 'local';
  }
};

const createDefaultSailingConditions = (): VenueConditionProfile => ({
  windPatterns: [],
  typicalConditions: {
    windSpeed: { min: 0, max: 0, average: 0 },
    windDirection: { primary: 0 },
    waveHeight: { typical: 0, maximum: 0 },
    visibility: { typical: 0, minimum: 0 },
  },
  seasonalVariations: [],
  hazards: [],
  racingAreas: [],
});

const createDefaultCulturalContext = (): VenueCulturalProfile => ({
  primaryLanguages: [
    {
      code: 'en',
      name: 'English',
      prevalence: 'common',
      sailingTerminology: true,
    },
  ],
  sailingCulture: {
    tradition: 'developing',
    competitiveness: 'regional',
    formality: 'semi_formal',
    inclusivity: 'welcoming',
    characteristics: [],
  },
  racingCustoms: [],
  socialProtocols: [],
  economicFactors: {
    currency: 'USD',
    costLevel: 'moderate',
    entryFees: { typical: 0, range: { min: 0, max: 0 } },
    accommodation: { budget: 0, moderate: 0, luxury: 0 },
    dining: { budget: 0, moderate: 0, upscale: 0 },
    services: { rigger: 0, sail_repair: 0, chandlery: 'moderate' },
    tipping: { expected: false, contexts: [] },
  },
  regulatoryEnvironment: {
    racingRules: {
      authority: 'World Sailing',
      variations: [],
    },
    safetyRequirements: [],
    environmentalRestrictions: [],
    entryRequirements: [],
  },
});

const createDefaultWeatherSources = (): WeatherSourceConfig => ({
  primary: {
    name: 'Global Model',
    type: 'global_model',
    region: 'global',
    accuracy: 'moderate',
    forecastHorizon: 72,
    updateFrequency: 6,
    specialties: [],
  },
  updateFrequency: 6,
  reliability: 0.5,
});

const mapDetectionVenueToGlobal = (venue: DetectionVenue): GlobalSailingVenue => ({
  id: venue.id,
  name: venue.name,
  country: venue.country,
  region: venue.region,
  venueType: mapClassificationToVenueType(venue.classification),
  coordinates: [venue.coordinates.longitude, venue.coordinates.latitude],
  establishedYear: undefined,
  timeZone: venue.timezone,
  primaryClubs: [],
  sailingConditions: createDefaultSailingConditions(),
  culturalContext: createDefaultCulturalContext(),
  weatherSources: createDefaultWeatherSources(),
  localServices: [] as GlobalServiceProvider[],
  createdAt: venue.lastUpdated,
  updatedAt: venue.lastUpdated,
  dataQuality: 'estimated',
});

const createLocationDetection = (
  coords: { latitude: number; longitude: number },
  method: LocationDetection['detectionMethod'],
  detectedVenue: GlobalSailingVenue | null,
  confidence: number,
  timestamp: Date,
): LocationDetection => ({
  currentLocation: [coords.longitude, coords.latitude],
  detectedVenue: detectedVenue ?? undefined,
  confidence,
  detectionMethod: method,
  lastUpdated: timestamp,
});

const createVenueTransition = (
  previousVenue: GlobalSailingVenue | null,
  nextVenue: GlobalSailingVenue,
  timestamp: Date,
): VenueTransition => ({
  fromVenue: previousVenue ?? undefined,
  toVenue: nextVenue,
  transitionType: previousVenue ? 'traveling' : 'first_visit',
  transitionDate: timestamp,
  adaptationRequired: [],
});

export interface VenueIntelligenceState {
  currentVenue: GlobalSailingVenue | null;
  isDetecting: boolean;
  detectionError: string | null;
  intelligence: RegionalIntelligenceData | null;
  isLoadingIntelligence: boolean;
  intelligenceError: string | null;
  locationStatus: LocationDetection | null;
  lastTransition: VenueTransition | null;
  adaptationRequired: boolean;
}

export interface VenueIntelligenceActions {
  initializeDetection: () => Promise<boolean>;
  setVenueManually: (venueId: string) => Promise<boolean>;
  refreshIntelligence: () => Promise<void>;
  getWeatherIntelligence: () => ReturnType<typeof regionalIntelligenceService.getWeatherIntelligence>;
  getTacticalIntelligence: () => ReturnType<typeof regionalIntelligenceService.getTacticalIntelligence>;
  getCulturalIntelligence: () => ReturnType<typeof regionalIntelligenceService.getCulturalIntelligence>;
  cleanup: () => Promise<void>;
}

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

  const detectionMethodRef = useRef<LocationDetection['detectionMethod']>('gps');
  const locationListenerRef = useRef<((update: LocationUpdate) => void) | null>(null);

  const loadVenueIntelligence = useCallback(async (venue: GlobalSailingVenue) => {
    setState(prev => ({ ...prev, isLoadingIntelligence: true, intelligenceError: null }));

    try {
      const intelligence = await regionalIntelligenceService.loadVenueIntelligence(venue);
      setState(prev => ({
        ...prev,
        intelligence,
        isLoadingIntelligence: false,
        intelligenceError: null,
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

  const handleLocationUpdate = useCallback((update: LocationUpdate) => {
    if (detectionMethodRef.current !== 'gps') {
      detectionMethodRef.current = 'gps';
    }
    const method = detectionMethodRef.current;
    const nextVenue = update.venue ? mapDetectionVenueToGlobal(update.venue) : null;
    const coords = {
      latitude: update.coordinates.latitude ?? 0,
      longitude: update.coordinates.longitude ?? 0,
    };

    setState(prev => {
      const previousVenue = prev.currentVenue;
      const venueChanged = update.changed && ((previousVenue?.id ?? null) !== (nextVenue?.id ?? null));
      const transition = venueChanged && nextVenue
        ? createVenueTransition(previousVenue, nextVenue, update.timestamp)
        : venueChanged && !nextVenue
          ? null
          : prev.lastTransition;

      const nextLocationStatus = createLocationDetection(
        coords,
        method,
        nextVenue,
        venueChanged ? 0.85 : prev.locationStatus?.confidence ?? 0.75,
        update.timestamp,
      );

      return {
        ...prev,
        currentVenue: nextVenue,
        locationStatus: nextLocationStatus,
        lastTransition: transition,
        adaptationRequired: transition ? transition.adaptationRequired.length > 0 : (venueChanged && !nextVenue ? false : prev.adaptationRequired),
        intelligence: venueChanged && !nextVenue ? null : prev.intelligence,
        intelligenceError: venueChanged && !nextVenue ? null : prev.intelligenceError,
      };
    });

    if (update.changed) {
      if (update.venue) {
        loadVenueIntelligence(mapDetectionVenueToGlobal(update.venue));
      } else {
        setState(prev => ({
          ...prev,
          intelligence: null,
          intelligenceError: null,
          isLoadingIntelligence: false,
        }));
      }
    }
  }, [loadVenueIntelligence]);

  useEffect(() => {
    const serviceVenue = venueDetectionService.getCurrentVenue();
    if (serviceVenue && !state.currentVenue) {
      const globalVenue = mapDetectionVenueToGlobal(serviceVenue);
      setState(prev => ({
        ...prev,
        currentVenue: globalVenue,
        locationStatus: createLocationDetection(
          {
            latitude: serviceVenue.coordinates.latitude,
            longitude: serviceVenue.coordinates.longitude,
          },
          detectionMethodRef.current,
          globalVenue,
          0.85,
          new Date(),
        ),
      }));
      loadVenueIntelligence(globalVenue);
    }
  }, [state.currentVenue, loadVenueIntelligence]);

  const initializeDetection = useCallback(async (): Promise<boolean> => {
    const { Platform } = await import('react-native');

    if (!locationListenerRef.current) {
      locationListenerRef.current = handleLocationUpdate;
      venueDetectionService.addLocationListener(handleLocationUpdate);
    }

    detectionMethodRef.current = 'gps';

    if (Platform.OS === 'web') {
      setState(prev => ({
        ...prev,
        isDetecting: false,
        detectionError: 'GPS detection not available on web. Please select venue manually.',
      }));
      return false;
    }

    setState(prev => ({ ...prev, isDetecting: true, detectionError: null }));

    try {
      const success = await venueDetectionService.initialize();

      if (!success) {
        setState(prev => ({
          ...prev,
          isDetecting: false,
          detectionError: 'Failed to initialize location services',
        }));
        return false;
      }

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
  }, [handleLocationUpdate]);

  const loadVenueForManualSelection = useCallback(async (venue: DetectionVenue) => {
    const globalVenue = mapDetectionVenueToGlobal(venue);
    setState(prev => ({
      ...prev,
      currentVenue: globalVenue,
      locationStatus: createLocationDetection(
        {
          latitude: venue.coordinates.latitude,
          longitude: venue.coordinates.longitude,
        },
        detectionMethodRef.current,
        globalVenue,
        0.9,
        new Date(),
      ),
    }));
    await loadVenueIntelligence(globalVenue);
  }, [loadVenueIntelligence]);

  const setVenueManually = useCallback(async (venueId: string): Promise<boolean> => {
    detectionMethodRef.current = 'manual';
    const success = await venueDetectionService.setManualVenue(venueId);

    if (success) {
      const newVenue = venueDetectionService.getCurrentVenue();
      if (newVenue) {
        await loadVenueForManualSelection(newVenue);
      }
    }

    return success;
  }, [loadVenueForManualSelection]);

  const refreshIntelligence = useCallback(async () => {
    if (!state.currentVenue) return;
    regionalIntelligenceService.clearCache();
    await loadVenueIntelligence(state.currentVenue);
  }, [state.currentVenue, loadVenueIntelligence]);

  const getWeatherIntelligence = useCallback(() => {
    if (!state.currentVenue) return Promise.resolve(null);
    return regionalIntelligenceService.getWeatherIntelligence(state.currentVenue.id);
  }, [state.currentVenue]);

  const getTacticalIntelligence = useCallback(() => {
    if (!state.currentVenue) return Promise.resolve(null);
    return regionalIntelligenceService.getTacticalIntelligence(state.currentVenue.id);
  }, [state.currentVenue]);

  const getCulturalIntelligence = useCallback(() => {
    if (!state.currentVenue) return Promise.resolve(null);
    return regionalIntelligenceService.getCulturalIntelligence(state.currentVenue.id);
  }, [state.currentVenue]);

  const cleanup = useCallback(async () => {
    if (locationListenerRef.current) {
      venueDetectionService.removeLocationListener(locationListenerRef.current);
      locationListenerRef.current = null;
    }

    try {
      await venueDetectionService.cleanup();
    } catch (error) {
      // no-op
    }

    try {
      regionalIntelligenceService.clearCache();
    } catch (error) {
      // no-op
    }
  }, []);

  useEffect(() => () => {
    cleanup();
  }, [cleanup]);

  return {
    ...state,
    initializeDetection,
    setVenueManually,
    refreshIntelligence,
    getWeatherIntelligence,
    getTacticalIntelligence,
    getCulturalIntelligence,
    cleanup,
  };
}

export function useCurrentVenue() {
  const [currentVenue, setCurrentVenue] = useState<GlobalSailingVenue | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const listener = (update: LocationUpdate) => {
      if (!isMounted) return;
      setCurrentVenue(update.venue ? mapDetectionVenueToGlobal(update.venue) : null);
    };

    const initializeSimple = async () => {
      setIsDetecting(true);

      venueDetectionService.addLocationListener(listener);

      const success = await venueDetectionService.initialize();

      if (success) {
        const detectedVenue = venueDetectionService.getCurrentVenue();
        if (detectedVenue && isMounted) {
          setCurrentVenue(mapDetectionVenueToGlobal(detectedVenue));
        }
      }

      setIsDetecting(false);
    };

    initializeSimple();

    return () => {
      isMounted = false;
      venueDetectionService.removeLocationListener(listener);
    };
  }, []);

  return { currentVenue, isDetecting };
}

export function useVenueWeather(venueId?: string) {
  const [weatherIntelligence, setWeatherIntelligence] = useState<Awaited<ReturnType<typeof regionalIntelligenceService.getWeatherIntelligence>> | null>(null);
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

  return { weatherIntelligence, isLoading };
}

export function useVenueTactics(venueId?: string) {
  const [tacticalIntelligence, setTacticalIntelligence] = useState<Awaited<ReturnType<typeof regionalIntelligenceService.getTacticalIntelligence>> | null>(null);
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

  return { tacticalIntelligence, isLoading };
}

export function useVenueCulture(venueId?: string) {
  const [culturalIntelligence, setCulturalIntelligence] = useState<Awaited<ReturnType<typeof regionalIntelligenceService.getCulturalIntelligence>> | null>(null);
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

  return { culturalIntelligence, isLoading };
}

export function useVenueIntelligenceData(): RegionalIntelligenceData | null {
  const { intelligence } = useVenueIntelligence();
  return intelligence;
}

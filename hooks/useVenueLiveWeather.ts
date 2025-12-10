/**
 * useVenueLiveWeather Hook
 * Simplified weather hook for venue tab - auto-loads weather from coordinates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { regionalWeatherService, WeatherForecast, MarineConditions } from '@/services/weather/RegionalWeatherService';
import type { SailingVenue as GlobalSailingVenue } from '@/lib/types/global-venues';

export interface LiveWeatherData {
  // Current conditions
  windSpeed: number; // knots
  windDirection: number; // degrees
  windGusts?: number; // knots
  waveHeight?: number; // meters
  wavePeriod?: number; // seconds
  currentSpeed?: number; // knots
  currentDirection?: number; // degrees
  airTemperature: number; // celsius
  waterTemperature?: number; // celsius
  visibility: number; // km
  humidity: number; // percentage
  barometricPressure: number; // hPa
  weatherCondition: string;
  
  // Racing readiness
  raceReadiness: 'excellent' | 'good' | 'marginal' | 'poor';
  raceReadinessReason: string;
  
  // Tide info
  tidalState?: 'rising' | 'falling' | 'high' | 'low';
  tidalHeight?: number;
  
  // Metadata
  lastUpdated: Date;
  confidence: number;
  source: string;
}

export interface UseVenueLiveWeatherResult {
  weather: LiveWeatherData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

/**
 * Calculate race readiness based on conditions
 */
function calculateRaceReadiness(forecast: WeatherForecast): { readiness: LiveWeatherData['raceReadiness']; reason: string } {
  const wind = forecast.windSpeed;
  const gusts = forecast.windGusts || wind;
  const visibility = forecast.visibility;
  const waveHeight = forecast.waveHeight || 0;
  
  // Check for dangerous conditions first
  if (gusts > 35 || waveHeight > 3 || visibility < 1) {
    return { readiness: 'poor', reason: 'Dangerous conditions - racing not advised' };
  }
  
  // Check for marginal conditions
  if (gusts > 28 || wind < 3 || waveHeight > 2 || visibility < 2) {
    if (wind < 3) return { readiness: 'marginal', reason: 'Light air - may postpone' };
    if (gusts > 28) return { readiness: 'marginal', reason: 'Strong gusts - experienced sailors only' };
    if (waveHeight > 2) return { readiness: 'marginal', reason: 'Choppy seas - keelboats recommended' };
    return { readiness: 'marginal', reason: 'Conditions challenging' };
  }
  
  // Check for excellent conditions
  if (wind >= 8 && wind <= 18 && gusts <= 22 && waveHeight <= 1 && visibility >= 8) {
    return { readiness: 'excellent', reason: 'Ideal racing conditions' };
  }
  
  // Good conditions
  if (wind >= 5 && wind <= 22) {
    if (wind >= 15) return { readiness: 'good', reason: 'Fresh breeze - good racing' };
    return { readiness: 'good', reason: 'Pleasant sailing conditions' };
  }
  
  return { readiness: 'good', reason: 'Suitable for racing' };
}

/**
 * Hook to get live weather conditions for a venue
 */
export function useVenueLiveWeather(
  latitude?: number,
  longitude?: number,
  venueId?: string,
  venueName?: string
): UseVenueLiveWeatherResult {
  const [weather, setWeather] = useState<LiveWeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Track if we've already loaded for these coordinates
  const lastCoordsRef = useRef<string>('');
  
  const loadWeather = useCallback(async () => {
    if (!latitude || !longitude) {
      setError('No coordinates provided');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Create a minimal venue object for the weather service
      const venueForService: GlobalSailingVenue = {
        id: venueId || `temp-${latitude}-${longitude}`,
        name: venueName || 'Current Location',
        country: '',
        region: '',
        venueType: 'local',
        coordinates: [longitude, latitude], // GeoJSON format [lng, lat]
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        primaryClubs: [],
        sailingConditions: {
          windPatterns: [],
          typicalConditions: {
            windSpeed: { min: 5, max: 20, average: 12 },
            windDirection: { primary: 180 },
            waveHeight: { typical: 0.5, maximum: 2 },
            visibility: { typical: 10, minimum: 2 },
          },
          seasonalVariations: [],
          hazards: [],
          racingAreas: [],
        },
        culturalContext: {
          primaryLanguages: [{ code: 'en', name: 'English', prevalence: 'common', sailingTerminology: true }],
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
            racingRules: { authority: 'World Sailing', variations: [] },
            safetyRequirements: [],
            environmentalRestrictions: [],
            entryRequirements: [],
          },
        },
        weatherSources: {
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
          reliability: 0.8,
        },
        localServices: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        dataQuality: 'estimated',
      };
      
      const weatherData = await regionalWeatherService.getVenueWeather(venueForService, 24);
      
      if (!weatherData || !weatherData.forecast.length) {
        throw new Error('No weather data available');
      }
      
      const current = weatherData.forecast[0];
      const { readiness, reason } = calculateRaceReadiness(current);
      
      const liveWeather: LiveWeatherData = {
        windSpeed: current.windSpeed,
        windDirection: current.windDirection,
        windGusts: current.windGusts,
        waveHeight: current.waveHeight,
        wavePeriod: current.wavePeriod,
        currentSpeed: current.currentSpeed,
        currentDirection: current.currentDirection,
        airTemperature: current.airTemperature,
        waterTemperature: current.waterTemperature,
        visibility: current.visibility,
        humidity: current.humidity,
        barometricPressure: current.barometricPressure,
        weatherCondition: current.weatherCondition,
        raceReadiness: readiness,
        raceReadinessReason: reason,
        tidalState: weatherData.marineConditions.tidalState,
        tidalHeight: weatherData.marineConditions.tidalHeight,
        lastUpdated: weatherData.lastUpdated,
        confidence: current.confidence,
        source: weatherData.sources.primary,
      };
      
      setWeather(liveWeather);
      setLastUpdated(weatherData.lastUpdated);
      setError(null);
    } catch (err: any) {
      console.error('[useVenueLiveWeather] Error loading weather:', err);
      setError(err.message || 'Failed to load weather data');
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, venueId, venueName]);
  
  // Auto-load when coordinates change
  useEffect(() => {
    const coordsKey = `${latitude}-${longitude}`;
    
    if (latitude && longitude && coordsKey !== lastCoordsRef.current) {
      lastCoordsRef.current = coordsKey;
      loadWeather();
    }
  }, [latitude, longitude, loadWeather]);
  
  const refresh = useCallback(async () => {
    lastCoordsRef.current = ''; // Force reload
    await loadWeather();
  }, [loadWeather]);
  
  return {
    weather,
    isLoading,
    error,
    refresh,
    lastUpdated,
  };
}

export default useVenueLiveWeather;


/**
 * Hook to enrich races with real weather data
 * Fetches weather for races that don't have it in metadata
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { RaceWeatherService } from '@/services/RaceWeatherService';
import type { RaceWeatherMetadata } from '@/services/RaceWeatherService';
import { createLogger } from '@/lib/utils/logger';
import { supabase } from '@/services/supabase';

const logger = createLogger('useEnrichedRaces');

const FALLBACK_WARNING_TIME = '10:00';

function extract24HourTime(isoDate: string | undefined | null): string {
  if (!isoDate) {
    return FALLBACK_WARNING_TIME;
  }

  try {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
      logger.warn('[useEnrichedRaces] Unable to parse start date for fallback time:', isoDate);
      return FALLBACK_WARNING_TIME;
    }

    const hours = date.getHours();
    const minutes = date.getMinutes();

    if (hours === 0 && minutes === 0) {
      return FALLBACK_WARNING_TIME;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } catch (error) {
    logger.warn('[useEnrichedRaces] Exception deriving fallback warning time:', error);
    return FALLBACK_WARNING_TIME;
  }
}

interface Race {
  id: string;
  name: string;
  venue?: string;
  date: string;
  startTime?: string;
  wind?: {
    direction: string;
    speedMin: number;
    speedMax: number;
  } | null;
  tide?: {
    state: 'flooding' | 'ebbing' | 'slack' | 'high' | 'low';
    height: number;
    direction?: string;
  } | null;
  weatherStatus?: 'loading' | 'available' | 'unavailable' | 'error' | 'too_far' | 'past' | 'no_venue';
  weatherError?: string;
  [key: string]: any;
}

interface RegattaRaw {
  id: string;
  name: string;
  start_date: string;
  warning_signal_time?: string;
  metadata?: {
    venue_name?: string;
    wind?: any;
    tide?: any;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Hook to enrich races with real weather data from RaceWeatherService
 *
 * @param races - Array of race objects from database
 * @returns Enriched races with real weather data where available
 */
export function useEnrichedRaces(races: RegattaRaw[]) {
  const [enrichedRaces, setEnrichedRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(false);
  const [weatherCache, setWeatherCache] = useState<Map<string, RaceWeatherMetadata | null>>(new Map());
  const previousRacesRef = useRef<string>('');

  /**
   * Persist weather data back to Supabase regatta metadata
   */
  const persistWeatherToDatabase = useCallback(async (
    regattaId: string,
    weather: RaceWeatherMetadata,
    existingMetadata: any
  ) => {
    try {
      const updatedMetadata = {
        ...existingMetadata,
        wind: weather.wind,
        tide: weather.tide,
        weather_provider: weather.provider,
        weather_fetched_at: weather.fetchedAt,
        weather_confidence: weather.confidence,
      };

      const { error } = await supabase
        .from('regattas')
        .update({ metadata: updatedMetadata })
        .eq('id', regattaId);

      if (error) {
        logger.error(`[useEnrichedRaces] Failed to persist weather for regatta ${regattaId}:`, error);
      } else {
        logger.debug(`[useEnrichedRaces] ✓ Persisted weather to database for regatta ${regattaId}`);
      }
    } catch (error) {
      logger.error(`[useEnrichedRaces] Exception persisting weather for regatta ${regattaId}:`, error);
    }
  }, []);

  const enrichRaces = useCallback(async () => {
    logger.info('[useEnrichedRaces] ===== STARTING ENRICHMENT =====');
    logger.info('[useEnrichedRaces] Input races:', races?.length || 0);

    if (!races || races.length === 0) {
      logger.debug('[useEnrichedRaces] No races to enrich');
      setEnrichedRaces([]);
      return;
    }

    setLoading(true);

    try {
      // Collect all cache updates to batch them
      const cacheUpdates = new Map<string, RaceWeatherMetadata | null>();
      // Collect weather data to persist to database
      const persistenceQueue: Array<{ regattaId: string; weather: RaceWeatherMetadata; metadata: any }> = [];

      const enrichedPromises = races.map(async (regatta) => {
        const venueName = regatta.metadata?.venue_name || 'Venue TBD';
        const raceDate = regatta.start_date;

        // First, map to basic race format
        const baseRace: Race = {
          id: regatta.id,
          name: regatta.name,
          venue: venueName,
          date: raceDate,
          startTime: regatta.warning_signal_time || extract24HourTime(raceDate),
          boatClass: regatta.metadata?.class || regatta.metadata?.class_name || 'Class TBD',
          status: regatta.status || 'upcoming',
          strategy: regatta.metadata?.strategy || 'Race strategy will be generated based on conditions.',
          critical_details: regatta.metadata?.critical_details,
        };

        // Check if metadata has wind/tide and if they're not placeholder values
        const hasWind = regatta.metadata?.wind;
        const hasTide = regatta.metadata?.tide;
        const isPlaceholderWind = hasWind &&
          hasWind.direction === 'Variable' &&
          hasWind.speedMin === 8 &&
          hasWind.speedMax === 15;
        const isPlaceholderTide = hasTide &&
          hasTide.state === 'slack' &&
          hasTide.height === 1.0;

        // If metadata has real (non-placeholder) weather data, use it
        if (hasWind && hasTide && !isPlaceholderWind && !isPlaceholderTide) {
          logger.debug(`[useEnrichedRaces] Using existing real weather for ${regatta.name}`);
          return {
            ...baseRace,
            wind: regatta.metadata.wind,
            tide: regatta.metadata.tide,
          };
        }

        // Log if we're replacing placeholder values
        if ((hasWind && isPlaceholderWind) || (hasTide && isPlaceholderTide)) {
          logger.debug(`[useEnrichedRaces] Replacing placeholder weather for ${regatta.name}`);
        }

        // Check cache first
        const cacheKey = `${venueName}-${raceDate}`;
        if (weatherCache.has(cacheKey)) {
          const cachedWeather = weatherCache.get(cacheKey);
          if (cachedWeather) {
            logger.debug(`[useEnrichedRaces] Using cached weather for ${regatta.name}`);
            return {
              ...baseRace,
              wind: cachedWeather.wind,
              tide: cachedWeather.tide,
              weatherStatus: 'available' as const,
            };
          } else {
            // Cache indicates no weather available
            return {
              ...baseRace,
              wind: null,
              tide: null,
              weatherStatus: 'unavailable' as const,
            };
          }
        }

        // Don't fetch for races in the past or too far in the future
        const raceDateObj = new Date(raceDate);
        const now = new Date();
        const hoursUntil = (raceDateObj.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntil < -24) {
          logger.debug(`[useEnrichedRaces] Race is in the past (${Math.round(hoursUntil)} hours ago)`);
          return {
            ...baseRace,
            wind: null,
            tide: null,
            weatherStatus: 'past' as const,
          };
        }

        if (hoursUntil > 240) {
          logger.debug(`[useEnrichedRaces] Race is too far in future (${Math.round(hoursUntil)} hours away)`);
          return {
            ...baseRace,
            wind: null,
            tide: null,
            weatherStatus: 'too_far' as const,
          };
        }

        // Check if venue exists
        if (!venueName || venueName === 'Venue TBD') {
          logger.debug(`[useEnrichedRaces] No venue specified for ${regatta.name}`);
          return {
            ...baseRace,
            wind: null,
            tide: null,
            weatherStatus: 'no_venue' as const,
          };
        }

        // Fetch real weather with timeout
        try {
          logger.debug(`[useEnrichedRaces] Fetching weather for ${regatta.name} at ${venueName}`);
          const warningSignal = regatta.warning_signal_time
            || regatta.metadata?.warning_signal
            || regatta.metadata?.first_warning
            || regatta.metadata?.warning_signal_time
            || null;

          // Create timeout promise
          const timeoutPromise = new Promise<null>((resolve) => {
            setTimeout(() => {
              logger.warn(`[useEnrichedRaces] Weather fetch timeout for ${regatta.name}`);
              resolve(null);
            }, 5000); // 5 second timeout
          });

          // Try to use direct coordinates from race metadata first (faster and more reliable)
          const coords = regatta.metadata?.racing_area_coordinates;
          let weatherPromise;

          if (coords?.lat && coords?.lng) {
            logger.debug(`[useEnrichedRaces] Using direct coordinates for ${regatta.name}: ${coords.lat}, ${coords.lng}`);
            weatherPromise = RaceWeatherService.fetchWeatherByCoordinates(
              coords.lat,
              coords.lng,
              raceDate,
              venueName,
              { warningSignalTime: warningSignal }
            );
          } else {
            logger.debug(`[useEnrichedRaces] No coordinates in metadata, looking up venue: ${venueName}`);
            weatherPromise = RaceWeatherService.fetchWeatherByVenueName(
              venueName,
              raceDate,
              { warningSignalTime: warningSignal }
            );
          }

          // Race between weather fetch and timeout
          const weather = await Promise.race([weatherPromise, timeoutPromise]);

          // Collect cache update (don't set state in loop)
          cacheUpdates.set(cacheKey, weather);

          if (weather) {
            logger.info(`[useEnrichedRaces] ✓ Got real weather for ${regatta.name}: ${weather.wind.direction} ${weather.wind.speedMin}-${weather.wind.speedMax}kts`);

            // Queue weather data for database persistence
            persistenceQueue.push({
              regattaId: regatta.id,
              weather,
              metadata: regatta.metadata || {},
            });

            return {
              ...baseRace,
              wind: weather.wind,
              tide: weather.tide,
              weatherStatus: 'available' as const,
            };
          } else {
            logger.warn(`[useEnrichedRaces] No weather available for ${regatta.name}`);
            return {
              ...baseRace,
              wind: null,
              tide: null,
              weatherStatus: 'unavailable' as const,
            };
          }
        } catch (error: any) {
          logger.error(`[useEnrichedRaces] Error fetching weather for ${regatta.name}:`, error);
          // Collect cache update (don't set state in loop)
          cacheUpdates.set(cacheKey, null);
          return {
            ...baseRace,
            wind: null,
            tide: null,
            weatherStatus: 'error' as const,
            weatherError: error?.message || 'Failed to fetch weather',
          };
        }
      });

      const enriched = await Promise.all(enrichedPromises);

      // Batch update cache once after all promises complete
      if (cacheUpdates.size > 0) {
        setWeatherCache(prev => {
          const newCache = new Map(prev);
          cacheUpdates.forEach((value, key) => newCache.set(key, value));
          return newCache;
        });
      }

      // Persist all weather data to database in parallel
      if (persistenceQueue.length > 0) {
        logger.info(`[useEnrichedRaces] Persisting ${persistenceQueue.length} weather updates to database`);
        await Promise.all(
          persistenceQueue.map(({ regattaId, weather, metadata }) =>
            persistWeatherToDatabase(regattaId, weather, metadata)
          )
        );
      }

      logger.info('[useEnrichedRaces] ===== ENRICHMENT COMPLETE =====');
      logger.info('[useEnrichedRaces] Enriched races count:', enriched.length);
      logger.info('[useEnrichedRaces] Sample race:', enriched[0]);
      setEnrichedRaces(enriched);
    } catch (error) {
      logger.error('[useEnrichedRaces] Error enriching races:', error);
      // Fall back to basic mapping with status indicators
      setEnrichedRaces(races.map(regatta => ({
        id: regatta.id,
        name: regatta.name,
        venue: regatta.metadata?.venue_name || 'Venue TBD',
        date: regatta.start_date,
        startTime: regatta.warning_signal_time || new Date(regatta.start_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        boatClass: regatta.metadata?.class || regatta.metadata?.class_name || 'Class TBD',
        status: regatta.status || 'upcoming',
        wind: null,
        tide: null,
        weatherStatus: 'error' as const,
        weatherError: 'Failed to load weather data',
        strategy: regatta.metadata?.strategy || 'Race strategy will be generated based on conditions.',
        critical_details: regatta.metadata?.critical_details,
      })));
    } finally {
      setLoading(false);
    }
  }, [races]);

  useEffect(() => {
    // Create a stable key based on race IDs and dates to detect actual changes
    const racesKey = races.map(r => `${r.id}-${r.start_date}`).join(',');

    // Only enrich if races actually changed
    if (racesKey !== previousRacesRef.current) {
      previousRacesRef.current = racesKey;
      enrichRaces();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [races]);

  return {
    races: enrichedRaces,
    loading,
    refresh: enrichRaces,
  };
}

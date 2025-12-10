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
  boatClass?: string;
  classId?: string | null; // For rig tuning lookup
  vhf_channel?: string | null; // VHF channel at top level
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
  venueCoordinates?: { lat: number; lng: number } | null;
  critical_details?: {
    vhf_channel?: string;
    warning_signal?: string;
    first_start?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * Extract venue coordinates from regatta metadata
 * Checks multiple possible locations where coordinates might be stored
 */
function extractVenueCoordinates(regatta: RegattaRaw): { lat: number; lng: number } | null {
  const metadata = regatta.metadata;
  if (!metadata) return null;

  // 1. Check explicit venue_lat/venue_lng
  if (typeof metadata.venue_lat === 'number' && typeof metadata.venue_lng === 'number') {
    return { lat: metadata.venue_lat, lng: metadata.venue_lng };
  }

  // 2. Check racing_area_coordinates
  const racingAreaCoords = metadata.racing_area_coordinates;
  if (racingAreaCoords?.lat && racingAreaCoords?.lng) {
    return { lat: racingAreaCoords.lat, lng: racingAreaCoords.lng };
  }

  // 3. Check venue_coordinates
  const venueCoords = metadata.venue_coordinates;
  if (venueCoords?.lat && venueCoords?.lng) {
    return { lat: venueCoords.lat, lng: venueCoords.lng };
  }

  // 4. Check route_waypoints (distance racing) - calculate centroid
  const waypoints = regatta.route_waypoints;
  if (Array.isArray(waypoints) && waypoints.length > 0) {
    const validWaypoints = waypoints.filter(
      (wp: any) => typeof wp.latitude === 'number' && typeof wp.longitude === 'number'
    );
    if (validWaypoints.length > 0) {
      const lat = validWaypoints.reduce((sum: number, wp: any) => sum + wp.latitude, 0) / validWaypoints.length;
      const lng = validWaypoints.reduce((sum: number, wp: any) => sum + wp.longitude, 0) / validWaypoints.length;
      return { lat, lng };
    }
  }

  // 5. Check racing_area_polygon - calculate centroid
  const polygon = regatta.racing_area_polygon?.coordinates?.[0];
  if (Array.isArray(polygon) && polygon.length > 0) {
    const coords = polygon
      .filter((coord: any) => Array.isArray(coord) && coord.length >= 2)
      .map((coord: number[]) => ({ lat: coord[1], lng: coord[0] }));
    if (coords.length > 0) {
      const lat = coords.reduce((sum, point) => sum + point.lat, 0) / coords.length;
      const lng = coords.reduce((sum, point) => sum + point.lng, 0) / coords.length;
      return { lat, lng };
    }
  }

  return null;
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

        // Extract venue coordinates from metadata (used for weather fetching)
        const venueCoordinates = extractVenueCoordinates(regatta);

        // Extract VHF channel from multiple possible locations
        // Check top-level column first (where ComprehensiveRaceEntry stores it)
        const vhfChannel = 
          regatta.vhf_channel ||  // Top-level database column
          regatta.metadata?.vhf_channel ||
          regatta.metadata?.critical_details?.vhf_channel ||
          regatta.metadata?.communications?.vhf ||
          // Also check for vhf_channels array (detailed multi-channel format)
          (Array.isArray(regatta.metadata?.vhf_channels) && regatta.metadata.vhf_channels[0]?.channel) ||
          null;

        // Build critical_details ensuring VHF channel is included
        const critical_details = {
          ...regatta.metadata?.critical_details,
          vhf_channel: vhfChannel,
        };

        // Extract class_id for rig tuning lookup
        const classId = 
          regatta.class_id ||
          regatta.metadata?.class_id ||
          regatta.metadata?.classId ||
          null;

        // Extract class name - try multiple sources including extracting from race name
        let className = 
          regatta.metadata?.class || 
          regatta.metadata?.class_name ||
          null;

        // Fallback: Try to extract common boat class names from race name
        if (!className && regatta.name) {
          const raceNameLower = regatta.name.toLowerCase();
          const knownClasses = ['dragon', 'j/80', 'j80', 'laser', 'optimist', 'rs21', 'etchells', 'farr 40', 'irc', 'orc', 'sportsboat'];
          for (const knownClass of knownClasses) {
            if (raceNameLower.includes(knownClass)) {
              className = knownClass.charAt(0).toUpperCase() + knownClass.slice(1);
              // Normalize some class names
              if (className.toLowerCase() === 'j80') className = 'J/80';
              break;
            }
          }
        }

        // Debug logging to understand what data we have - especially VHF
        console.log(`📡 [useEnrichedRaces] Race "${regatta.name}" VHF sources:`, {
          'regatta.vhf_channel': regatta.vhf_channel,
          'metadata.vhf_channel': regatta.metadata?.vhf_channel,
          'critical_details.vhf_channel': regatta.metadata?.critical_details?.vhf_channel,
          'communications.vhf': regatta.metadata?.communications?.vhf,
          'vhf_channels array': regatta.metadata?.vhf_channels,
          'extracted vhfChannel': vhfChannel,
          classId,
          className,
        });

        // First, map to basic race format - preserve created_by for edit permissions
        const baseRace: Race = {
          id: regatta.id,
          name: regatta.name,
          venue: venueName,
          date: raceDate,
          startTime: regatta.warning_signal_time || extract24HourTime(raceDate),
          boatClass: className || 'Class TBD', // Use extracted class name
          classId, // Include class_id for rig tuning lookup
          vhf_channel: vhfChannel, // VHF channel at top level for easy access
          status: regatta.status || 'upcoming',
          strategy: regatta.metadata?.strategy || 'Race strategy will be generated based on conditions.',
          critical_details,
          created_by: regatta.created_by, // Preserve for edit/delete permission checks
          venueCoordinates, // Include coordinates for weather fetching
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
          // Check multiple potential coordinate sources:
          // 1. racing_area_coordinates (common for fleet races)
          // 2. venue_lat/venue_lng (explicit venue coordinates)
          // 3. venue_coordinates (alternate format)
          // 4. route_waypoints (distance races - calculate centroid)
          let coords: { lat: number; lng: number } | null = null;
          
          // 1. Check racing_area_coordinates
          const racingAreaCoords = regatta.metadata?.racing_area_coordinates;
          if (racingAreaCoords?.lat && racingAreaCoords?.lng) {
            coords = { lat: racingAreaCoords.lat, lng: racingAreaCoords.lng };
          }
          
          // 2. Check venue_lat/venue_lng
          if (!coords && regatta.metadata?.venue_lat && regatta.metadata?.venue_lng) {
            coords = { lat: regatta.metadata.venue_lat, lng: regatta.metadata.venue_lng };
          }
          
          // 3. Check venue_coordinates
          const venueCoords = regatta.metadata?.venue_coordinates;
          if (!coords && venueCoords?.lat && venueCoords?.lng) {
            coords = { lat: venueCoords.lat, lng: venueCoords.lng };
          }
          
          // 4. Check route_waypoints (distance racing) - calculate centroid
          const waypoints = regatta.route_waypoints;
          if (!coords && Array.isArray(waypoints) && waypoints.length > 0) {
            const validWaypoints = waypoints.filter(
              (wp: any) => typeof wp.latitude === 'number' && typeof wp.longitude === 'number'
            );
            if (validWaypoints.length > 0) {
              const lat = validWaypoints.reduce((sum: number, wp: any) => sum + wp.latitude, 0) / validWaypoints.length;
              const lng = validWaypoints.reduce((sum: number, wp: any) => sum + wp.longitude, 0) / validWaypoints.length;
              coords = { lat, lng };
              logger.debug(`[useEnrichedRaces] Using centroid of ${validWaypoints.length} waypoints for ${regatta.name}`);
            }
          }

          let weatherPromise;

          if (coords) {
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
      setEnrichedRaces(races.map(regatta => {
        // Extract VHF channel from multiple possible locations
        const vhfChannel = 
          regatta.vhf_channel ||
          regatta.metadata?.vhf_channel ||
          regatta.metadata?.critical_details?.vhf_channel ||
          regatta.metadata?.communications?.vhf ||
          null;

        // Extract class name - try multiple sources including extracting from race name
        let className = 
          regatta.metadata?.class || 
          regatta.metadata?.class_name ||
          null;

        // Fallback: Try to extract common boat class names from race name
        if (!className && regatta.name) {
          const raceNameLower = regatta.name.toLowerCase();
          const knownClasses = ['dragon', 'j/80', 'j80', 'laser', 'optimist', 'rs21', 'etchells', 'farr 40', 'irc', 'orc', 'sportsboat'];
          for (const knownClass of knownClasses) {
            if (raceNameLower.includes(knownClass)) {
              className = knownClass.charAt(0).toUpperCase() + knownClass.slice(1);
              if (className.toLowerCase() === 'j80') className = 'J/80';
              break;
            }
          }
        }

        return {
          id: regatta.id,
          name: regatta.name,
          venue: regatta.metadata?.venue_name || 'Venue TBD',
          date: regatta.start_date,
          startTime: regatta.warning_signal_time || new Date(regatta.start_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          boatClass: className || 'Class TBD',
          classId: regatta.class_id || regatta.metadata?.class_id || regatta.metadata?.classId || null,
          vhf_channel: vhfChannel, // VHF channel at top level
          status: regatta.status || 'upcoming',
          wind: null,
          tide: null,
          weatherStatus: 'error' as const,
          weatherError: 'Failed to load weather data',
          strategy: regatta.metadata?.strategy || 'Race strategy will be generated based on conditions.',
          critical_details: {
            ...regatta.metadata?.critical_details,
            vhf_channel: vhfChannel,
          },
          created_by: regatta.created_by, // Preserve for edit/delete permission checks
        };
      }));
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

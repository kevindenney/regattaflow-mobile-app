// @ts-nocheck

/**
 * Race Weather Service
 * Fetches weather data when races are created and stores it in race metadata
 *
 * Uses regional weather intelligence to automatically select the best provider
 * (HKO for Hong Kong, NOAA for USA, etc.)
 */

import { regionalWeatherService } from './weather/RegionalWeatherService';
import type { SailingVenue } from '@/lib/types/global-venues';
import type { WeatherData } from './weather/RegionalWeatherService';
import { createLogger } from '@/lib/utils/logger';

export interface RaceWeatherMetadata {
  wind: {
    direction: string;
    speedMin: number;
    speedMax: number;
  };
  tide: {
    state: 'flooding' | 'ebbing' | 'slack' | 'high' | 'low';
    height: number;
    direction?: string;
  };
  fetchedAt: string;
  provider: string;
  confidence: number;
}

const logger = createLogger('RaceWeatherService');
export class RaceWeatherService {
  /**
   * Fetch weather by exact coordinates (NEW - for map-based selection)
   *
   * @param lat - Latitude of racing area center
   * @param lng - Longitude of racing area center
   * @param raceDate - ISO date string of the race
   * @param venueName - Optional venue name for logging
   * @returns Weather metadata ready to store in regatta.metadata
   */
  static async fetchWeatherByCoordinates(
    lat: number,
    lng: number,
    raceDate: string,
    venueName?: string,
    options?: { warningSignalTime?: string | null }
  ): Promise<RaceWeatherMetadata | null> {
    try {
      const displayName = venueName || `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
      logger.debug(`[RaceWeatherService] Fetching weather for coordinates: ${displayName}`);

      // Calculate hours until race
      const raceDateObj = new Date(raceDate);
      const now = new Date();
      const hoursUntil = Math.max(0, (raceDateObj.getTime() - now.getTime()) / (1000 * 60 * 60));

      // Don't fetch weather for races more than 10 days (240 hours) away
      if (hoursUntil > 240) {
        logger.debug(`[RaceWeatherService] Race is ${Math.round(hoursUntil / 24)} days away - using defaults`);
        return null;
      }

      // Don't fetch weather for past races
      if (hoursUntil < 0) {
        logger.debug(`[RaceWeatherService] Race is in the past - using defaults`);
        return null;
      }

      // Create a minimal SailingVenue object with exact coordinates
      const venue: SailingVenue = {
        id: `custom-${lat}-${lng}`,
        name: displayName,
        country: 'Unknown',
        region: this.detectRegion(lat, lng),
        coordinates: { lat, lng },
        timeZone: 'UTC',
        weatherSources: undefined,
        sailingConditions: undefined,
        conditions: undefined,
        services: undefined,
      };

      const targetDate = options?.warningSignalTime
        ? this.combineDateWithTimeZone(raceDate, options.warningSignalTime, venue.timeZone || 'UTC') ?? new Date(raceDate)
        : new Date(raceDate);

      return this.fetchWeatherForRace(venue, targetDate.toISOString());

    } catch (error: any) {
      console.error('[RaceWeatherService] Error fetching weather by coordinates:', error.message);
      return null;
    }
  }

  /**
   * Detect region from coordinates for weather provider selection
   */
  private static detectRegion(lat: number, lng: number): string {
    // Hong Kong/South China
    if (lat >= 22 && lat <= 23 && lng >= 113.5 && lng <= 114.5) {
      return 'asia-pacific';
    }
    // North America (rough bounds)
    if (lat >= 25 && lat <= 50 && lng >= -130 && lng <= -65) {
      return 'north-america';
    }
    // Europe (rough bounds)
    if (lat >= 35 && lat <= 70 && lng >= -10 && lng <= 40) {
      return 'europe';
    }
    // Japan
    if (lat >= 30 && lat <= 46 && lng >= 129 && lng <= 146) {
      return 'asia-pacific';
    }
    // Australia/New Zealand
    if (lat >= -45 && lat <= -10 && lng >= 110 && lng <= 180) {
      return 'asia-pacific';
    }

    return 'global';
  }

  /**
   * Fetch weather for a race and format it for metadata storage
   *
   * @param venue - Sailing venue object with coordinates
   * @param raceDate - ISO date string of the race
   * @returns Weather metadata ready to store in regatta.metadata
   */
  static async fetchWeatherForRace(
    venue: SailingVenue,
    raceDate: string
  ): Promise<RaceWeatherMetadata | null> {
    try {
      logger.debug(`[RaceWeatherService] Fetching weather for ${venue.name} on ${raceDate}`);

      // Calculate hours until race
      const raceDateObj = new Date(raceDate);
      const now = new Date();
      const hoursUntil = Math.max(0, (raceDateObj.getTime() - now.getTime()) / (1000 * 60 * 60));

      // Don't fetch weather for races more than 10 days (240 hours) away
      if (hoursUntil > 240) {
        logger.debug(`[RaceWeatherService] Race is ${Math.round(hoursUntil / 24)} days away - using defaults`);
        return null;
      }

      // Don't fetch weather for past races
      if (hoursUntil < 0) {
        logger.debug(`[RaceWeatherService] Race is in the past - using defaults`);
        return null;
      }

      // Add timeout to weather fetch
      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => {
          console.warn('[RaceWeatherService] Weather fetch timeout - using defaults');
          resolve(null);
        }, 15000)
      );

      // Fetch weather data using regional intelligence
      const weatherPromise = regionalWeatherService.getVenueWeather(
        venue,
        Math.min(240, Math.ceil(hoursUntil))
      );

      const weatherData = await Promise.race([weatherPromise, timeoutPromise]);

      if (!weatherData) {
        console.warn(`[RaceWeatherService] No weather data available for ${venue.name}`);
        return null;
      }

      // Find forecast closest to race time
      const raceForecast = weatherData.forecast.reduce((closest, forecast) => {
        const forecastDiff = Math.abs(forecast.timestamp.getTime() - raceDateObj.getTime());
        const closestDiff = Math.abs(closest.timestamp.getTime() - raceDateObj.getTime());
        return forecastDiff < closestDiff ? forecast : closest;
      });

      // Convert wind direction from degrees to cardinal
      const windDirection = this.degreesToCardinal(raceForecast.windDirection);

      // Extract tide state from marine conditions
      const tideState = weatherData.marineConditions.tidalState || 'slack';
      const tideHeight = weatherData.marineConditions.tidalHeight || 1.0;

      // Determine tide direction from current if available
      const tideDirection = weatherData.marineConditions.surfaceCurrents?.[0]
        ? this.degreesToCardinal(weatherData.marineConditions.surfaceCurrents[0].direction)
        : undefined;

      const weatherMetadata: RaceWeatherMetadata = {
        wind: {
          direction: windDirection,
          speedMin: Math.round(raceForecast.windSpeed * 0.9), // Estimate range
          speedMax: Math.round(raceForecast.windGusts || raceForecast.windSpeed * 1.2),
        },
        tide: {
          state: tideState as 'flooding' | 'ebbing' | 'slack' | 'high' | 'low',
          height: Math.round(tideHeight * 10) / 10, // Round to 1 decimal
          direction: tideDirection,
        },
        fetchedAt: new Date().toISOString(),
        provider: weatherData.sources.primary,
        confidence: raceForecast.confidence,
      };

      return weatherMetadata;

    } catch (error: any) {
      console.error('[RaceWeatherService] Error fetching weather:', error);
      return null;
    }
  }

  /**
   * Fetch weather for a race by venue name (looks up venue first)
   * Used when creating races from calendar imports with just a venue name
   *
   * @param venueName - Name of the venue (e.g., "Clearwater Bay")
   * @param raceDate - ISO date string of the race
   * @returns Weather metadata or null
   */
  static async fetchWeatherByVenueName(
    venueName: string,
    raceDate: string,
    options?: { warningSignalTime?: string | null }
  ): Promise<RaceWeatherMetadata | null> {
    try {
      logger.debug(`[RaceWeatherService] Looking up venue: "${venueName}"`);

      // Clean venue name (remove country/region suffixes)
      const cleanVenueName = venueName
        .replace(/, Hong Kong$/i, '')
        .replace(/, China$/i, '')
        .replace(/, HK$/i, '')
        .trim();

      logger.debug(`[RaceWeatherService] Cleaned venue name: "${cleanVenueName}"`);

      // Look up venue in global venues database
      const { supabase } = await import('./supabase');

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Venue lookup timeout')), 10000)
      );

      logger.debug(`[RaceWeatherService] Starting venue query...`);

      const venuePromise = supabase
        .from('sailing_venues')
        .select('*, time_zone')
        .ilike('name', `%${cleanVenueName}%`)
        .limit(1);

      logger.debug(`[RaceWeatherService] Waiting for venue query result...`);
      const { data: venues, error } = await Promise.race([venuePromise, timeoutPromise]) as any;
      logger.debug(`[RaceWeatherService] Venue query completed`, { venues: venues?.length, error });

      if (error) {
        console.warn(`[RaceWeatherService] Venue lookup error:`, error);
        return null;
      }

      if (!venues || venues.length === 0) {
        console.warn(`[RaceWeatherService] Venue not found in database: ${cleanVenueName}`);
        return null;
      }

      const venue = venues[0];

      logger.debug(`[RaceWeatherService] Found venue: ${venue.name} (${venue.id})`);

      // Convert database venue to SailingVenue type
      const sailingVenue: SailingVenue = {
        id: venue.id,
        name: venue.name,
        country: venue.country,
        region: venue.region,
        coordinates: {
          lat: venue.coordinates_lat,
          lng: venue.coordinates_lng,
        },
        timeZone: venue.time_zone || venue.timezone || 'UTC',
        // Add minimal required fields
        weatherSources: undefined,
        sailingConditions: undefined,
        conditions: undefined,
        services: undefined,
      };

      const targetDate = this.combineDateWithTimeZone(
        raceDate,
        options?.warningSignalTime ?? null,
        sailingVenue.timeZone || 'UTC'
      ) ?? new Date(raceDate);

      return this.fetchWeatherForRace(sailingVenue, targetDate.toISOString());

    } catch (error: any) {
      console.error('[RaceWeatherService] Error in fetchWeatherByVenueName:', error.message);
      return null;
    }
  }

  /**
   * Convert degrees to cardinal direction
   */
  private static degreesToCardinal(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  /**
   * Check if weather data is stale (older than 24 hours)
   */
  static isWeatherStale(metadata: RaceWeatherMetadata): boolean {
    if (!metadata.fetchedAt) return true;

    const fetchedAt = new Date(metadata.fetchedAt);
    const now = new Date();
    const hoursSinceFetch = (now.getTime() - fetchedAt.getTime()) / (1000 * 60 * 60);

    return hoursSinceFetch > 24;
  }

  private static combineDateWithTimeZone(dateString: string, timeString: string | null, timeZone: string | undefined): Date | null {
    if (!timeString || !timeZone) {
      return new Date(dateString);
    }

    try {
      const baseDate = new Date(dateString);
      if (Number.isNaN(baseDate.getTime())) {
        return new Date(dateString);
      }

      const [hours, minutes, seconds = '00'] = timeString.split(':');
      const utcDate = new Date(Date.UTC(
        baseDate.getUTCFullYear(),
        baseDate.getUTCMonth(),
        baseDate.getUTCDate(),
        Number(hours),
        Number(minutes),
        Number(seconds)
      ));

      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const parts = formatter.formatToParts(utcDate);
      const values: Record<string, string> = {};
      for (const part of parts) {
        if (part.type !== 'literal') {
          values[part.type] = part.value;
        }
      }

      const zonedUTC = Date.UTC(
        Number(values.year),
        Number(values.month) - 1,
        Number(values.day),
        Number(values.hour),
        Number(values.minute),
        Number(values.second)
      );

      const offset = zonedUTC - utcDate.getTime();
      return new Date(utcDate.getTime() - offset);
    } catch (error) {
      console.warn('[RaceWeatherService] Failed to combine date/time with timezone, using base date', error);
      return new Date(dateString);
    }
  }
}

export default RaceWeatherService;

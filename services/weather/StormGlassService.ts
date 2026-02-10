/**
 * Storm Glass Marine Weather Service
 * Comprehensive marine weather API integration
 * Documentation: https://docs.stormglass.io/
 */

import axios, { AxiosInstance } from 'axios';
import Constants from 'expo-constants';
import type { GeoLocation } from '@/lib/types/map';
import type { AdvancedWeatherConditions } from '@/lib/types/advanced-map';
import type {
  StormGlassConfig,
  StormGlassWeatherResponse,
  StormGlassTideExtremesResponse,
  StormGlassSeaLevelResponse,
  StormGlassCurrentResponse,
  StormGlassWeatherHour,
  StormGlassDataPoint,
  StormGlassCacheEntry,
  StormGlassRateLimit,
} from '@/lib/types/stormglass';
import { generateMockForecast, generateMockWeatherAtTime } from './mockWeatherData';

const STORM_GLASS_BASE_URL = 'https://api.stormglass.io/v2';
const DEFAULT_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const TIDE_CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours - tides are predictable
const TIDE_EXTREMES_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours - extremes are highly predictable
const ELEVATION_CACHE_DURATION = 365 * 24 * 60 * 60 * 1000; // 1 year - bathymetry doesn't change

// Supabase Edge Function URL for bathymetry proxy (avoids CORS)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qavekrwdbsobecwrfxwu.supabase.co';
const BATHYMETRY_PROXY_URL = `${SUPABASE_URL}/functions/v1/bathymetry-proxy`;

// Check if we should use mock data (for development or when quota exceeded)
// Only honor app.json's useMockWeather flag in non-production builds
const extraMockSetting =
  process.env.NODE_ENV !== 'production' &&
  (Constants?.expoConfig?.extra?.useMockWeather === true ||
    Constants?.expoConfig?.extra?.useMockWeather === 'true' ||
    Constants?.expoConfig?.extra?.useMockWeather === 1 ||
    Constants?.expoConfig?.extra?.useMockWeather === '1');
const USE_MOCK_DATA =
  process.env.EXPO_PUBLIC_USE_MOCK_WEATHER === 'true' ||
  process.env.EXPO_PUBLIC_USE_MOCK_WEATHER === '1' ||
  extraMockSetting;

export class StormGlassService {
  private config: Required<StormGlassConfig>;
  private client: AxiosInstance;
  private cache: Map<string, StormGlassCacheEntry<any>> = new Map();
  private rateLimit: StormGlassRateLimit = {
    dailyQuota: 5000,
    requestCount: 0,
    lastReset: Date.now(),
    nextReset: Date.now() + 24 * 60 * 60 * 1000,
  };
  private useMockData: boolean = USE_MOCK_DATA;
  private quotaExceeded: boolean = false;

  constructor(config: StormGlassConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl ?? STORM_GLASS_BASE_URL,
      timeout: config.timeout ?? 10000,
      retryAttempts: config.retryAttempts ?? 3,
    };

    // Create axios client with Storm Glass headers
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Authorization': this.config.apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get comprehensive marine weather forecast
   */
  async getMarineWeather(location: GeoLocation, hours: number = 48): Promise<AdvancedWeatherConditions[]> {
    const cacheKey = `weather_${location.latitude}_${location.longitude}_${hours}`;
    const cached = this.getCached<AdvancedWeatherConditions[]>(cacheKey);

    if (cached) {
      return cached;
    }

    // Use mock data if enabled or quota exceeded
    if (this.useMockData || this.quotaExceeded) {
      return this.getMockMarineWeather(location, hours);
    }

    try {
      const end = new Date(Date.now() + hours * 60 * 60 * 1000);

      const params = [
        'windSpeed',
        'windDirection',
        'gust',
        'waveHeight',
        'wavePeriod',
        'waveDirection',
        'swellHeight',
        'swellPeriod',
        'swellDirection',
        'secondarySwellHeight',
        'secondarySwellPeriod',
        'secondarySwellDirection',
        'airTemperature',
        'waterTemperature',
        'pressure',
        'cloudCover',
        'humidity',
        'precipitation',
        'visibility',
        'currentSpeed',
        'currentDirection',
      ].join(',');

      const response = await this.makeRequest<StormGlassWeatherResponse>(
        '/weather/point',
        {
          lat: location.latitude,
          lng: location.longitude,
          params,
          end: Math.floor(end.getTime() / 1000),
        }
      );

      this.updateRateLimit(response.meta);

      const forecasts = response.hours.map(hour => this.transformWeatherHour(hour, location));

      this.setCache(cacheKey, forecasts, DEFAULT_CACHE_DURATION);

      return forecasts;
    } catch (error: any) {
      // If it's a quota error, enable mock mode and return mock data
      if (error.message?.includes('quota exceeded') || this.quotaExceeded) {
        this.enableMockMode('quota exceeded');
        return this.getMockMarineWeather(location, hours);
      }
      // Return mock data instead of throwing to prevent infinite loops
      return this.getMockMarineWeather(location, hours);
    }
  }

  /**
   * Get weather for a specific timestamp
   */
  async getWeatherAtTime(location: GeoLocation, targetTime: Date): Promise<AdvancedWeatherConditions | null> {
    const cacheKey = `weather_time_${location.latitude}_${location.longitude}_${targetTime.getTime()}`;
    const cached = this.getCached<AdvancedWeatherConditions>(cacheKey);

    if (cached) {
      return cached;
    }

    // Use mock data if enabled or quota exceeded
    if (this.useMockData || this.quotaExceeded) {
      return this.getMockWeatherAtTime(location, targetTime);
    }

    try {
      // Request a 2-hour window around target time
      const start = new Date(targetTime.getTime() - 60 * 60 * 1000);
      const end = new Date(targetTime.getTime() + 60 * 60 * 1000);

      const params = [
        'windSpeed',
        'windDirection',
        'gust',
        'waveHeight',
        'wavePeriod',
        'waveDirection',
        'swellHeight',
        'swellPeriod',
        'swellDirection',
        'airTemperature',
        'waterTemperature',
        'pressure',
        'cloudCover',
        'humidity',
        'precipitation',
        'visibility',
        'currentSpeed',
        'currentDirection',
      ].join(',');

      const response = await this.makeRequest<StormGlassWeatherResponse>(
        '/weather/point',
        {
          lat: location.latitude,
          lng: location.longitude,
          params,
          start: Math.floor(start.getTime() / 1000),
          end: Math.floor(end.getTime() / 1000),
        }
      );

      this.updateRateLimit(response.meta);

      // Find closest hour to target time
      let closestHour: StormGlassWeatherHour | null = null;
      let smallestDiff = Infinity;

      for (const hour of response.hours) {
        const hourTime = new Date(hour.time).getTime();
        const diff = Math.abs(hourTime - targetTime.getTime());
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestHour = hour;
        }
      }

      if (!closestHour) {
        return null;
      }

      const weather = this.transformWeatherHour(closestHour, location);
      this.setCache(cacheKey, weather, DEFAULT_CACHE_DURATION);

      return weather;
    } catch (error: any) {
      // If quota exceeded, enable mock mode and return mock data
      if (error.message?.includes('quota exceeded') || this.quotaExceeded) {
        this.enableMockMode('quota exceeded');
        return this.getMockWeatherAtTime(location, targetTime);
      }
      // Return mock data instead of null to prevent cascading errors
      return this.getMockWeatherAtTime(location, targetTime);
    }
  }

  /**
   * Get tide extremes (high/low tide times and heights)
   * @param location - Geographic coordinates
   * @param days - Number of days to fetch (default: 7)
   * @param referenceTime - Optional reference time to center the fetch around (defaults to now)
   * 
   * NOTE: This uses Storm Glass API quota. Cache is extended to 12 hours to minimize API calls.
   * For weather data, use OpenMeteoService instead (FREE, no quota).
   */
  async getTideExtremes(location: GeoLocation, days: number = 7, referenceTime?: Date): Promise<Array<{
    type: 'high' | 'low';
    time: Date;
    height: number;
  }>> {
    // Use reference time if provided, otherwise use current time
    const centerTime = referenceTime || new Date();
    
    // Round location to 2 decimal places for better cache hit rate (still ~1km accuracy)
    const roundedLat = Math.round(location.latitude * 100) / 100;
    const roundedLng = Math.round(location.longitude * 100) / 100;
    
    // Round time to nearest 6 hours for better cache hit rate (tides are predictable)
    const timeWindow = Math.floor(centerTime.getTime() / (6 * 60 * 60 * 1000));
    const cacheKey = `tide_extremes_${roundedLat}_${roundedLng}_${days}_${timeWindow}`;
    const cached = this.getCached<Array<any>>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      
      // Fetch extremes starting 1 day before the reference time to ensure we have data
      // for interpolation (need previous extreme to calculate current state)
      const start = new Date(centerTime.getTime() - 24 * 60 * 60 * 1000);
      const end = new Date(centerTime.getTime() + days * 24 * 60 * 60 * 1000);

      const response = await this.makeRequest<StormGlassTideExtremesResponse>(
        '/tide/extremes/point',
        {
          lat: location.latitude,
          lng: location.longitude,
          start: Math.floor(start.getTime() / 1000),
          end: Math.floor(end.getTime() / 1000),
        }
      );

      this.updateRateLimit(response.meta);

      const extremes = response.data.map(extreme => ({
        type: extreme.type,
        time: new Date(extreme.time),
        height: extreme.height,
      }));

      // Cache for 12 hours - tides are highly predictable!
      this.setCache(cacheKey, extremes, TIDE_EXTREMES_CACHE_DURATION);

      return extremes;
    } catch (error) {
      throw new Error(`Failed to fetch tide extremes: ${error}`);
    }
  }

  /**
   * Get tide height at a specific time
   * 
   * NOTE: This uses Storm Glass API quota. Cache is extended to 6 hours for same location.
   * For weather data, use OpenMeteoService instead (FREE, no quota).
   */
  async getTideHeightAtTime(location: GeoLocation, targetTime: Date): Promise<number> {
    // Round location to 2 decimal places for better cache hit rate
    const roundedLat = Math.round(location.latitude * 100) / 100;
    const roundedLng = Math.round(location.longitude * 100) / 100;
    
    // Round time to nearest hour for better cache hit rate
    const timeHour = Math.floor(targetTime.getTime() / (60 * 60 * 1000));
    const cacheKey = `tide_height_${roundedLat}_${roundedLng}_${timeHour}`;
    const cached = this.getCached<number>(cacheKey);

    if (cached !== null && cached !== undefined) {
      return cached;
    }

    try {
      
      // Request 1 hour window
      const start = new Date(targetTime.getTime() - 30 * 60 * 1000);
      const end = new Date(targetTime.getTime() + 30 * 60 * 1000);

      const response = await this.makeRequest<StormGlassSeaLevelResponse>(
        '/tide/sea-level/point',
        {
          lat: location.latitude,
          lng: location.longitude,
          start: Math.floor(start.getTime() / 1000),
          end: Math.floor(end.getTime() / 1000),
        }
      );

      this.updateRateLimit(response.meta);

      // Find closest time point
      let closestHeight = 0;
      let smallestDiff = Infinity;

      for (const dataPoint of response.data) {
        const pointTime = new Date(dataPoint.time).getTime();
        const diff = Math.abs(pointTime - targetTime.getTime());
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestHeight = dataPoint.sg;
        }
      }

      // Cache for 6 hours
      this.setCache(cacheKey, closestHeight, TIDE_CACHE_DURATION);

      return closestHeight;
    } catch (_error) {
      return 0;
    }
  }

  /**
   * Interpolate tide height from extremes using cosine approximation
   * This avoids an API call by calculating height from known high/low times
   *
   * Uses the standard tidal cosine model: height = midHeight + amplitude * cos(π * progress)
   * Accuracy: ~95% for most locations; complex harbors may have larger errors
   */
  interpolateTideHeight(
    extremes: Array<{ type: 'high' | 'low'; time: Date; height: number }>,
    targetTime: Date
  ): number {
    if (extremes.length < 2) {
      return 0; // Not enough data to interpolate
    }

    // Sort extremes by time
    const sorted = [...extremes].sort((a, b) => a.time.getTime() - b.time.getTime());
    const targetMs = targetTime.getTime();

    // Find the two extremes that bracket the target time
    let prevExtreme: typeof sorted[0] | null = null;
    let nextExtreme: typeof sorted[0] | null = null;

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].time.getTime() <= targetMs) {
        prevExtreme = sorted[i];
      }
      if (sorted[i].time.getTime() > targetMs && !nextExtreme) {
        nextExtreme = sorted[i];
        break;
      }
    }

    // If target is before all extremes, use first two
    if (!prevExtreme && sorted.length >= 2) {
      prevExtreme = sorted[0];
      nextExtreme = sorted[1];
    }

    // If target is after all extremes, use last two
    if (!nextExtreme && sorted.length >= 2) {
      prevExtreme = sorted[sorted.length - 2];
      nextExtreme = sorted[sorted.length - 1];
    }

    if (!prevExtreme || !nextExtreme) {
      return 0;
    }

    // Calculate progress through the tide cycle (0 to 1)
    const cycleStart = prevExtreme.time.getTime();
    const cycleEnd = nextExtreme.time.getTime();
    const cycleDuration = cycleEnd - cycleStart;

    if (cycleDuration <= 0) {
      return prevExtreme.height;
    }

    const progress = Math.max(0, Math.min(1, (targetMs - cycleStart) / cycleDuration));

    // Cosine interpolation for tidal approximation
    // If going from high to low: height decreases (cos goes from 1 to -1)
    // If going from low to high: height increases (cos goes from -1 to 1)
    const amplitude = (prevExtreme.height - nextExtreme.height) / 2;
    const midHeight = (prevExtreme.height + nextExtreme.height) / 2;

    // cos(0) = 1, cos(π) = -1
    const height = midHeight + amplitude * Math.cos(Math.PI * progress);

    return Math.round(height * 100) / 100;
  }

  /**
   * Get ocean currents
   */
  async getCurrents(location: GeoLocation, hours: number = 24): Promise<Array<{
    time: Date;
    speed: number; // m/s
    direction: number; // degrees
  }>> {
    const cacheKey = `currents_${location.latitude}_${location.longitude}_${hours}`;
    const cached = this.getCached<Array<any>>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const end = new Date(Date.now() + hours * 60 * 60 * 1000);

      const response = await this.makeRequest<StormGlassCurrentResponse>(
        '/current/point',
        {
          lat: location.latitude,
          lng: location.longitude,
          params: 'currentSpeed,currentDirection',
          end: Math.floor(end.getTime() / 1000),
        }
      );

      this.updateRateLimit(response.meta);

      const currents = response.hours.map(hour => ({
        time: new Date(hour.time),
        speed: this.getFirstValue(hour.currentSpeed) || 0,
        direction: this.getFirstValue(hour.currentDirection) || 0,
      }));

      this.setCache(cacheKey, currents, DEFAULT_CACHE_DURATION);

      return currents;
    } catch (_error) {
      return [];
    }
  }

  /**
   * Get elevation/bathymetry at a single point
   * Returns elevation in meters (negative = below sea level / ocean depth)
   *
   * Resolution: ~450m (15 arc-seconds)
   * Data source: Open Topo Data GEBCO (free, global coverage via Supabase Edge Function)
   */
  async getElevation(location: GeoLocation): Promise<number> {
    // Round to 4 decimal places for cache key (still ~11m accuracy)
    const roundedLat = Math.round(location.latitude * 10000) / 10000;
    const roundedLng = Math.round(location.longitude * 10000) / 10000;
    const cacheKey = `elevation_${roundedLat}_${roundedLng}`;

    const cached = this.getCached<number>(cacheKey);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    // Use Open Topo Data directly (free, global coverage, no quota issues)
    return this.getElevationFromOpenTopoData(location, cacheKey);
  }

  /**
   * Get elevation from Open Topo Data GEBCO API via Supabase Edge Function proxy
   * https://www.opentopodata.org/datasets/gebco2020/
   *
   * The proxy avoids CORS issues and handles rate limiting server-side.
   * Coverage: Global (GEBCO 2020 bathymetry dataset)
   * Resolution: 15 arc-seconds (~450m at equator)
   */
  private async getElevationFromOpenTopoData(location: GeoLocation, cacheKey: string): Promise<number> {
    try {
      // Use Supabase Edge Function proxy to avoid CORS
      const response = await axios.post(
        BATHYMETRY_PROXY_URL,
        {
          locations: [{ lat: location.latitude, lng: location.longitude }]
        },
        { timeout: 15000 }
      );

      const result = response.data;

      if (result.status !== 'OK' || !result.results || result.results.length === 0) {
        console.warn('[OpenTopoData] Invalid response:', result);
        return 0;
      }

      // Elevation is already in meters (negative = below sea level)
      const elevation = result.results[0].elevation;

      console.log('[OpenTopoData] Elevation fetched:', { location, elevation });

      // Cache for 1 year - bathymetry doesn't change
      this.setCache(cacheKey, elevation, ELEVATION_CACHE_DURATION);

      return elevation;
    } catch (error: any) {
      console.error('[OpenTopoData] Failed to fetch elevation:', {
        error: error?.message || error,
        status: error?.response?.status,
        location,
      });
      return 0;
    }
  }

  /**
   * Get elevations for multiple locations in a single batched request
   * Uses the Supabase Edge Function proxy for CORS-free requests
   * Supports up to 100 locations per request
   */
  async getElevationsBatch(
    locations: Array<{ latitude: number; longitude: number }>
  ): Promise<Array<{ lat: number; lng: number; elevation: number }>> {
    if (locations.length === 0) {
      return [];
    }

    // Check cache for each location
    const results: Array<{ lat: number; lng: number; elevation: number; cached: boolean }> = [];
    const uncachedLocations: Array<{ lat: number; lng: number; index: number }> = [];

    for (let i = 0; i < locations.length; i++) {
      const loc = locations[i];
      const roundedLat = Math.round(loc.latitude * 10000) / 10000;
      const roundedLng = Math.round(loc.longitude * 10000) / 10000;
      const cacheKey = `elevation_${roundedLat}_${roundedLng}`;

      const cached = this.getCached<number>(cacheKey);
      if (cached !== null && cached !== undefined) {
        results.push({
          lat: loc.latitude,
          lng: loc.longitude,
          elevation: cached,
          cached: true
        });
      } else {
        uncachedLocations.push({
          lat: loc.latitude,
          lng: loc.longitude,
          index: i
        });
        results.push({
          lat: loc.latitude,
          lng: loc.longitude,
          elevation: 0, // Will be updated
          cached: false
        });
      }
    }

    // If all locations are cached, return immediately
    if (uncachedLocations.length === 0) {
      console.log('[OpenTopoData] All', locations.length, 'locations served from cache');
      return results.map(r => ({ lat: r.lat, lng: r.lng, elevation: r.elevation }));
    }

    console.log('[OpenTopoData] Fetching', uncachedLocations.length, 'uncached locations (', locations.length - uncachedLocations.length, 'from cache)');

    try {
      // Call edge function with batched locations
      const response = await axios.post(
        BATHYMETRY_PROXY_URL,
        {
          locations: uncachedLocations.map(loc => ({ lat: loc.lat, lng: loc.lng }))
        },
        { timeout: 30000 } // Longer timeout for batch requests
      );

      const data = response.data;

      if (data.status !== 'OK' || !data.results) {
        console.warn('[OpenTopoData] Batch request failed:', data.error || 'Unknown error');
        return results.map(r => ({ lat: r.lat, lng: r.lng, elevation: r.elevation }));
      }

      // Update results with fetched elevations and cache them
      for (let i = 0; i < data.results.length && i < uncachedLocations.length; i++) {
        const fetchedResult = data.results[i];
        const originalIndex = uncachedLocations[i].index;
        const elevation = fetchedResult.elevation ?? 0;

        results[originalIndex].elevation = elevation;

        // Cache the result
        const loc = locations[originalIndex];
        const roundedLat = Math.round(loc.latitude * 10000) / 10000;
        const roundedLng = Math.round(loc.longitude * 10000) / 10000;
        const cacheKey = `elevation_${roundedLat}_${roundedLng}`;
        this.setCache(cacheKey, elevation, ELEVATION_CACHE_DURATION);
      }

      console.log('[OpenTopoData] Successfully fetched', data.results.length, 'elevations');

    } catch (error: any) {
      console.error('[OpenTopoData] Batch request error:', {
        error: error?.message || error,
        status: error?.response?.status
      });
    }

    return results.map(r => ({ lat: r.lat, lng: r.lng, elevation: r.elevation }));
  }

  /**
   * Get elevation grid for a racing area
   * Returns a grid of depth points for visualization
   *
   * Uses batched requests to the Supabase Edge Function for efficiency.
   * Up to 100 points per request (gridSize 10x10 = 100 points = 1 API call)
   *
   * @param center - Center of the racing area
   * @param radiusKm - Radius in kilometers (default 5km for 10km x 10km coverage)
   * @param gridSize - Number of points per side (default 10 = 100 total points)
   * @returns Grid of elevation points with lat, lng, and depth
   */
  async getElevationGrid(
    center: GeoLocation,
    radiusKm: number = 5,
    gridSize: number = 10
  ): Promise<{
    points: Array<{ lat: number; lng: number; elevation: number; depth: number }>;
    bounds: { north: number; south: number; east: number; west: number };
    center: GeoLocation;
    minDepth: number;
    maxDepth: number;
  }> {
    // Create cache key based on center and parameters
    const cacheKey = `elevation_grid_${center.latitude.toFixed(3)}_${center.longitude.toFixed(3)}_${radiusKm}_${gridSize}`;
    const cached = this.getCached<any>(cacheKey);

    if (cached) {
      console.log('[StormGlass] Elevation grid served from cache');
      return cached;
    }

    // Calculate bounds
    const kmPerDegreeLat = 111.32;
    const kmPerDegreeLng = 111.32 * Math.cos(center.latitude * Math.PI / 180);

    const latOffset = radiusKm / kmPerDegreeLat;
    const lngOffset = radiusKm / kmPerDegreeLng;

    const bounds = {
      north: center.latitude + latOffset,
      south: center.latitude - latOffset,
      east: center.longitude + lngOffset,
      west: center.longitude - lngOffset,
    };

    // Generate grid points
    const latStep = (bounds.north - bounds.south) / (gridSize - 1);
    const lngStep = (bounds.east - bounds.west) / (gridSize - 1);

    const gridPoints: Array<{ latitude: number; longitude: number }> = [];

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        gridPoints.push({
          latitude: bounds.south + i * latStep,
          longitude: bounds.west + j * lngStep,
        });
      }
    }

    console.log('[StormGlass] Fetching elevation grid:', gridSize, 'x', gridSize, '=', gridPoints.length, 'points');

    // Use batched request for efficiency (1 API call for up to 100 points)
    const batchResults = await this.getElevationsBatch(gridPoints);

    // Transform results to include depth
    const points = batchResults.map(result => ({
      lat: result.lat,
      lng: result.lng,
      elevation: result.elevation,
      depth: result.elevation < 0 ? Math.abs(result.elevation) : 0, // Depth is positive, 0 for land
    }));

    // Calculate min/max depth (only for water)
    const waterPoints = points.filter(p => p.elevation < 0);
    const minDepth = waterPoints.length > 0
      ? Math.min(...waterPoints.map(p => p.depth))
      : 0;
    const maxDepth = waterPoints.length > 0
      ? Math.max(...waterPoints.map(p => p.depth))
      : 0;

    console.log('[StormGlass] Elevation grid complete:', waterPoints.length, 'water points,', 'depth range:', minDepth, '-', maxDepth, 'm');

    const result = {
      points,
      bounds,
      center,
      minDepth,
      maxDepth,
    };

    // Cache for 1 year
    this.setCache(cacheKey, result, ELEVATION_CACHE_DURATION);

    return result;
  }

  /**
   * Transform Storm Glass weather hour to AdvancedWeatherConditions
   */
  private transformWeatherHour(hour: StormGlassWeatherHour, location: GeoLocation): AdvancedWeatherConditions {
    const windSpeedMs = this.getFirstValue(hour.windSpeed) || 0;
    const windSpeedKnots = this.msToKnots(windSpeedMs);
    const gustMs = this.getFirstValue(hour.gust) || windSpeedMs * 1.3;
    const gustKnots = this.msToKnots(gustMs);
    const windDirection = this.getFirstValue(hour.windDirection) || 0;

    const waveHeight = this.getFirstValue(hour.waveHeight) || 0.5;
    const wavePeriod = this.getFirstValue(hour.wavePeriod) || 5;
    const waveDirection = this.getFirstValue(hour.waveDirection) || windDirection;

    const swellHeight = this.getFirstValue(hour.swellHeight) || waveHeight * 0.6;
    const swellPeriod = this.getFirstValue(hour.swellPeriod) || wavePeriod * 1.2;
    const swellDirection = this.getFirstValue(hour.swellDirection) || windDirection;

    const airTemp = this.getFirstValue(hour.airTemperature) || 20;
    const waterTemp = this.getFirstValue(hour.waterTemperature) || airTemp - 2;
    const pressure = this.getFirstValue(hour.pressure) || 1013.25;
    const humidity = this.getFirstValue(hour.humidity) || 60;
    const cloudCover = this.getFirstValue(hour.cloudCover) || 50;
    const precipitation = this.getFirstValue(hour.precipitation) || 0;
    const visibilityKm = this.getFirstValue(hour.visibility) || 10;
    const visibilityMeters = visibilityKm * 1000;

    const currentSpeed = this.getFirstValue(hour.currentSpeed) || 0;
    const currentDirection = this.getFirstValue(hour.currentDirection) || 0;

    const beaufortScale = this.calculateBeaufortScale(windSpeedKnots);
    const visibilityCondition = this.determineVisibilityCondition(visibilityKm);
    const timestamp = new Date(hour.time);

    return {
      wind: {
        speed: windSpeedKnots,
        direction: windDirection,
        gusts: gustKnots,
        variability: this.estimateWindVariability(windSpeedKnots),
        beaufortScale,
      },
      tide: {
        height: 0, // Requires separate tide API call
        direction: 'unknown',
        speed: currentSpeed * 1.944, // Convert m/s to knots
        nextHigh: new Date(timestamp.getTime() + 6 * 60 * 60 * 1000),
        nextLow: new Date(timestamp.getTime() + 12 * 60 * 60 * 1000),
      },
      waves: {
        height: waveHeight,
        period: wavePeriod,
        direction: waveDirection,
        swellHeight,
        swellPeriod,
        swellDirection,
      },
      pressure: {
        sealevel: pressure,
        trend: this.calculatePressureTrend(pressure),
        gradient: 0,
        rate: 0,
      },
      temperature: airTemp,
      humidity,
      precipitation,
      cloudCover,
      temperatureProfile: {
        air: airTemp,
        water: waterTemp,
        dewpoint: this.calculateDewPoint(airTemp, humidity),
        feelslike: airTemp - (windSpeedKnots * 0.3),
      },
      humidityProfile: {
        relative: humidity,
        absolute: this.calculateAbsoluteHumidity(airTemp, humidity),
      },
      visibility: {
        horizontal: visibilityMeters,
        vertical: visibilityMeters * 0.8,
        conditions: visibilityCondition,
      },
      precipitationProfile: {
        rate: precipitation,
        probability: this.estimatePrecipProbability(precipitation),
        type: this.determinePrecipType(precipitation, airTemp),
      },
      cloudLayerProfile: {
        total: cloudCover,
        low: cloudCover * 0.4,
        medium: cloudCover * 0.3,
        high: cloudCover * 0.3,
      },
      seaState: {
        waveHeight,
        wavePeriod,
        swellHeight,
        swellPeriod,
        swellDirection,
        seaTemperature: waterTemp,
      },
      forecast: {
        confidence: 0.90, // Storm Glass multi-source aggregation is highly reliable
        source: 'Storm Glass',
        model: 'Multi-Source Aggregation (NOAA, Météo-France, UK Met Office)',
        modelRun: new Date(),
        validTime: timestamp,
        resolution: '1km-25km (varies by source)',
        lastUpdated: new Date(),
        nextUpdate: new Date(Date.now() + 60 * 60 * 1000),
      },
      timestamp,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
    };
  }

  /**
   * Make API request with retry logic
   */
  private async makeRequest<T>(endpoint: string, params: any, attempt: number = 1): Promise<T> {
    try {
      const response = await this.client.get<T>(endpoint, { params });
      return response.data;
    } catch (error: any) {
      // Handle quota exceeded errors (402 Payment Required)
      if (error.response?.status === 402) {
        this.enableMockMode('quota exceeded');

        // Don't retry on quota exceeded - it won't help
        throw new Error(`Storm Glass API quota exceeded - using mock data`);
      }

      // Handle other 4xx errors (don't retry)
      if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
        throw error;
      }

      // Retry on network errors, 5xx errors, or 429 (rate limit)
      if (attempt < this.config.retryAttempts) {
        // Exponential backoff
        await this.delay(1000 * Math.pow(2, attempt - 1));
        return this.makeRequest<T>(endpoint, params, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Get first value from Storm Glass data point array
   */
  private getFirstValue<T>(
    dataPoints?: StormGlassDataPoint<T>[] | Record<string, T> | T | null
  ): T | undefined {
    if (!dataPoints) {
      return undefined;
    }

    if (Array.isArray(dataPoints)) {
      for (const point of dataPoints) {
        if (point && point.value !== undefined && point.value !== null) {
          return point.value;
        }
      }
      return undefined;
    }

    if (typeof dataPoints === 'object') {
      for (const value of Object.values(dataPoints as Record<string, T>)) {
        if (value !== undefined && value !== null) {
          return value;
        }
      }
      return undefined;
    }

    return dataPoints as T;
  }

  /**
   * Convert meters per second to knots
   */
  private msToKnots(ms: number): number {
    return ms * 1.943844;
  }

  /**
   * Calculate Beaufort scale from wind speed
   */
  private calculateBeaufortScale(knots: number): number {
    if (knots < 1) return 0;
    if (knots < 4) return 1;
    if (knots < 7) return 2;
    if (knots < 11) return 3;
    if (knots < 16) return 4;
    if (knots < 22) return 5;
    if (knots < 28) return 6;
    if (knots < 34) return 7;
    if (knots < 41) return 8;
    if (knots < 48) return 9;
    if (knots < 56) return 10;
    if (knots < 64) return 11;
    return 12;
  }

  /**
   * Estimate wind variability based on speed
   */
  private estimateWindVariability(knots: number): number {
    // Light winds are more variable
    if (knots < 5) return 15 + Math.random() * 10;
    if (knots < 15) return 10 + Math.random() * 5;
    return 5 + Math.random() * 5;
  }

  /**
   * Calculate pressure trend
   */
  private calculatePressureTrend(pressure: number): 'rising' | 'falling' | 'steady' {
    if (pressure > 1020) return 'steady';
    if (pressure < 1000) return 'falling';
    if (pressure > 1015) return 'rising';
    return 'steady';
  }

  /**
   * Determine visibility condition
   */
  private determineVisibilityCondition(visibilityKm: number): 'clear' | 'haze' | 'fog' | 'rain' | 'snow' {
    if (visibilityKm <= 1) return 'fog';
    if (visibilityKm <= 5) return 'haze';
    return 'clear';
  }

  /**
   * Calculate dew point
   */
  private calculateDewPoint(temp: number, humidity: number): number {
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
    return (b * alpha) / (a - alpha);
  }

  /**
   * Calculate absolute humidity
   */
  private calculateAbsoluteHumidity(temp: number, relativeHumidity: number): number {
    const saturatedVaporPressure = 6.112 * Math.exp((17.67 * temp) / (temp + 243.5));
    const actualVaporPressure = (relativeHumidity / 100) * saturatedVaporPressure;
    return (actualVaporPressure * 2.1674) / (273.15 + temp);
  }

  /**
   * Estimate precipitation probability
   */
  private estimatePrecipProbability(precipRate: number): number {
    if (precipRate === 0) return 0;
    if (precipRate < 0.1) return 20;
    if (precipRate < 1) return 50;
    if (precipRate < 5) return 80;
    return 95;
  }

  /**
   * Determine precipitation type
   */
  private determinePrecipType(precipRate: number, temp: number): 'rain' | 'snow' | 'sleet' | 'none' {
    if (precipRate === 0) return 'none';
    if (temp < 0) return 'snow';
    if (temp < 2) return 'sleet';
    return 'rain';
  }

  /**
   * Update rate limit tracking
   */
  private updateRateLimit(meta: { cost: number; dailyQuota: number; requestCount: number }): void {
    this.rateLimit.dailyQuota = meta.dailyQuota;
    this.rateLimit.requestCount = meta.requestCount;

    // Reset tracking if it's a new day
    const now = Date.now();
    if (now > this.rateLimit.nextReset) {
      this.rateLimit.lastReset = now;
      this.rateLimit.nextReset = now + 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Get current rate limit status
   */
  getRateLimit(): StormGlassRateLimit {
    return { ...this.rateLimit };
  }

  /**
   * Get quota status for proactive monitoring
   * Helps prevent hitting quota limits by warning early
   */
  getQuotaStatus(): {
    remaining: number;
    percentUsed: number;
    isLow: boolean;
    willExceedSoon: boolean;
  } {
    const remaining = this.rateLimit.dailyQuota - this.rateLimit.requestCount;
    const percentUsed = (this.rateLimit.requestCount / this.rateLimit.dailyQuota) * 100;

    return {
      remaining,
      percentUsed: Math.round(percentUsed * 10) / 10,
      isLow: remaining < this.rateLimit.dailyQuota * 0.2, // < 20% remaining
      willExceedSoon: remaining < 50, // Less than 50 requests left
    };
  }

  /**
   * Get cached data
   */
  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache data
   */
  private setCache<T>(key: string, data: T, duration: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration,
    });
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get mock marine weather forecast
   */
  private getMockMarineWeather(location: GeoLocation, hours: number): AdvancedWeatherConditions[] {
    const mockData = generateMockForecast(location.latitude, location.longitude, hours);
    return mockData.map(hour => this.transformMockWeatherHour(hour, location));
  }

  /**
   * Get mock weather at specific time
   */
  private getMockWeatherAtTime(location: GeoLocation, targetTime: Date): AdvancedWeatherConditions {
    const mockData = generateMockWeatherAtTime(location.latitude, location.longitude, targetTime);
    return this.transformMockWeatherHour(mockData, location);
  }

  /**
   * Transform mock weather hour to AdvancedWeatherConditions
   */
  private transformMockWeatherHour(hour: any, location: GeoLocation): AdvancedWeatherConditions {
    const windSpeed = hour.windSpeed?.noaa || 0;
    const windDirection = hour.windDirection?.noaa || 0;
    const gust = hour.gust?.noaa || windSpeed;
    const airTemp = hour.airTemperature?.noaa || 20;
    const waterTemp = hour.waterTemperature?.noaa || 18;
    const waveHeight = hour.waveHeight?.noaa || 0;
    const currentSpeed = hour.currentSpeed?.noaa || 0;
    const visibility = hour.visibility?.noaa || 10000;
    const cloudCover = hour.cloudCover?.noaa || 30;

    const timestamp = new Date(hour.time);

    return {
      wind: {
        speed: windSpeed,
        direction: windDirection,
        gusts: gust,
        beaufortScale: this.calculateBeaufortScale(windSpeed),
        variability: this.estimateWindVariability(windSpeed),
      },
      waves: {
        height: waveHeight,
        period: hour.wavePeriod?.noaa || 5,
        direction: hour.waveDirection?.noaa || windDirection,
        swellHeight: hour.swellHeight?.noaa || waveHeight * 0.6,
        swellPeriod: hour.swellPeriod?.noaa || 8,
        swellDirection: hour.swellDirection?.noaa || windDirection,
      },
      tide: {
        height: 0,
        direction: 'unknown' as const,
        speed: currentSpeed,
        nextHigh: undefined,
        nextLow: undefined,
      },
      pressure: {
        sealevel: 1013,
        trend: 'steady' as const,
        gradient: 0,
      },
      temperatureProfile: {
        air: airTemp,
        water: waterTemp,
        dewpoint: this.calculateDewPoint(airTemp, 70),
        feelslike: airTemp - (windSpeed * 0.1),
      },
      temperature: airTemp,
      humidity: 70,
      cloudCover,
      visibility: {
        horizontal: visibility,
        conditions: 'clear' as const,
      },
      seaState: {
        waveHeight,
        wavePeriod: hour.wavePeriod?.noaa || 5,
        swellHeight: hour.swellHeight?.noaa || waveHeight * 0.6,
        swellPeriod: hour.swellPeriod?.noaa || 8,
        swellDirection: hour.swellDirection?.noaa || windDirection,
        seaTemperature: waterTemp,
      },
      forecast: {
        confidence: 0.85,
        source: 'mock',
        modelRun: new Date(),
        validTime: timestamp,
        resolution: 'mock-data',
        lastUpdated: new Date(),
        nextUpdate: new Date(Date.now() + 60 * 60 * 1000),
      },
      timestamp,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
    };
  }

  /**
   * Enable mock mode to avoid outbound API calls
   */
  enableMockMode(_reason?: string): void {
    this.useMockData = true;
    this.quotaExceeded = true;
  }
}

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
const TIDE_CACHE_DURATION = 60 * 60 * 1000; // 60 minutes

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
  extraMockSetting === true ||
  extraMockSetting === 'true' ||
  extraMockSetting === 1;

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
      console.info('[StormGlassService] Using mock weather data');
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
        console.warn('[StormGlassService] API quota exceeded, switching to mock data');
        this.enableMockMode('quota exceeded');
        return this.getMockMarineWeather(location, hours);
      }
      console.error('[StormGlassService] Marine weather error:', error);
      // Return mock data instead of throwing to prevent infinite loops
      console.warn('[StormGlassService] Falling back to mock data due to API error');
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
      console.error('[StormGlassService] Weather at time error:', error);
      // Return mock data instead of null to prevent cascading errors
      return this.getMockWeatherAtTime(location, targetTime);
    }
  }

  /**
   * Get tide extremes (high/low tide times and heights)
   */
  async getTideExtremes(location: GeoLocation, days: number = 7): Promise<Array<{
    type: 'high' | 'low';
    time: Date;
    height: number;
  }>> {
    const cacheKey = `tide_extremes_${location.latitude}_${location.longitude}_${days}`;
    const cached = this.getCached<Array<any>>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const start = new Date();
      const end = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

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

      this.setCache(cacheKey, extremes, TIDE_CACHE_DURATION);

      return extremes;
    } catch (error) {
      console.error('[StormGlassService] Tide extremes error:', error);
      throw new Error(`Failed to fetch tide extremes: ${error}`);
    }
  }

  /**
   * Get tide height at a specific time
   */
  async getTideHeightAtTime(location: GeoLocation, targetTime: Date): Promise<number> {
    const cacheKey = `tide_height_${location.latitude}_${location.longitude}_${targetTime.getTime()}`;
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

      this.setCache(cacheKey, closestHeight, TIDE_CACHE_DURATION);

      return closestHeight;
    } catch (error) {
      console.error('[StormGlassService] Tide height error:', error);
      return 0;
    }
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
    } catch (error) {
      console.error('[StormGlassService] Currents error:', error);
      return [];
    }
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
        const quotaInfo = error.response?.data?.errors?.key || 'API quota exceeded';
        console.log(`[StormGlassService] ${quotaInfo}. Request count: ${error.response?.data?.meta?.requestCount}/${error.response?.data?.meta?.dailyQuota} - using mock data`);
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
        gust,
        beaufortScale: this.calculateBeaufortScale(windSpeed),
        variability: this.estimateWindVariability(windSpeed),
      },
      waves: {
        significant: waveHeight,
        maximum: waveHeight * 1.5,
        period: hour.wavePeriod?.noaa || 5,
        direction: hour.waveDirection?.noaa || windDirection,
        swell: {
          height: hour.swellHeight?.noaa || waveHeight * 0.6,
          period: hour.swellPeriod?.noaa || 8,
          direction: hour.swellDirection?.noaa || windDirection,
        },
        secondary: hour.secondarySwellHeight ? {
          height: hour.secondarySwellHeight.noaa,
          period: hour.secondarySwellPeriod?.noaa || 6,
          direction: hour.secondarySwellDirection?.noaa || windDirection,
        } : undefined,
      },
      current: {
        speed: currentSpeed,
        direction: hour.currentDirection?.noaa || 0,
        knots: currentSpeed,
      },
      temperature: {
        air: airTemp,
        water: waterTemp,
        dewPoint: this.calculateDewPoint(airTemp, 70),
        feelsLike: airTemp - (windSpeed * 0.1),
      },
      atmosphere: {
        pressure: 1013,
        humidity: 70,
        cloudCover,
        visibility: visibility / 1000,
        precipitation: {
          probability: cloudCover > 80 ? 0.3 : 0.1,
          rate: 0,
        },
      },
      forecast: {
        confidence: 85,
        trend: 'stable' as const,
        changeExpected: false,
      },
      metadata: {
        source: 'mock',
        quality: 'medium',
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
  enableMockMode(reason?: string): void {
    if (!this.useMockData) {
      const context = reason ? ` (${reason})` : '';
      console.info(`[StormGlassService] Mock weather mode enabled${context}`);
    }
    this.useMockData = true;
    this.quotaExceeded = true;
  }
}

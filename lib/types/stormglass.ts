/**
 * Storm Glass API Type Definitions
 * Documentation: https://docs.stormglass.io/
 */

/**
 * Storm Glass API Configuration
 */
export interface StormGlassConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
}

/**
 * Geographic location for API requests
 */
export interface StormGlassLocation {
  lat: number;
  lng: number;
}

/**
 * Data source information
 */
export interface StormGlassSource {
  name: string;
  distance?: number;
  height?: number;
}

/**
 * Weather data point with multiple sources
 */
export interface StormGlassDataPoint<T> {
  source: string;
  value: T;
}

/**
 * Weather forecast hour response
 */
export interface StormGlassWeatherHour {
  time: string; // ISO 8601 timestamp

  // Wind
  windSpeed?: StormGlassDataPoint<number>[]; // m/s
  windDirection?: StormGlassDataPoint<number>[]; // degrees
  gust?: StormGlassDataPoint<number>[]; // m/s

  // Waves
  waveHeight?: StormGlassDataPoint<number>[]; // meters
  wavePeriod?: StormGlassDataPoint<number>[]; // seconds
  waveDirection?: StormGlassDataPoint<number>[]; // degrees

  // Swell
  swellHeight?: StormGlassDataPoint<number>[]; // meters
  swellPeriod?: StormGlassDataPoint<number>[]; // seconds
  swellDirection?: StormGlassDataPoint<number>[]; // degrees
  secondarySwellHeight?: StormGlassDataPoint<number>[]; // meters
  secondarySwellPeriod?: StormGlassDataPoint<number>[]; // seconds
  secondarySwellDirection?: StormGlassDataPoint<number>[]; // degrees

  // Wind waves (separate from swell)
  windWaveHeight?: StormGlassDataPoint<number>[]; // meters
  windWavePeriod?: StormGlassDataPoint<number>[]; // seconds
  windWaveDirection?: StormGlassDataPoint<number>[]; // degrees

  // Ocean currents
  currentSpeed?: StormGlassDataPoint<number>[]; // m/s
  currentDirection?: StormGlassDataPoint<number>[]; // degrees

  // Atmospheric
  airTemperature?: StormGlassDataPoint<number>[]; // celsius
  pressure?: StormGlassDataPoint<number>[]; // hPa
  humidity?: StormGlassDataPoint<number>[]; // percentage
  cloudCover?: StormGlassDataPoint<number>[]; // percentage
  precipitation?: StormGlassDataPoint<number>[]; // mm/hour
  visibility?: StormGlassDataPoint<number>[]; // km

  // Marine
  waterTemperature?: StormGlassDataPoint<number>[]; // celsius
  seaLevel?: StormGlassDataPoint<number>[]; // meters

  // Ice
  iceCover?: StormGlassDataPoint<number>[]; // percentage
  iceThickness?: StormGlassDataPoint<number>[]; // meters
}

/**
 * Weather API Response
 */
export interface StormGlassWeatherResponse {
  hours: StormGlassWeatherHour[];
  meta: {
    cost: number;
    dailyQuota: number;
    requestCount: number;
    lat: number;
    lng: number;
    params: string[];
  };
}

/**
 * Tide extreme (high or low)
 */
export interface StormGlassTideExtreme {
  height: number; // meters
  time: string; // ISO 8601 timestamp
  type: 'high' | 'low';
}

/**
 * Tide station information
 */
export interface StormGlassTideStation {
  distance: number; // km from requested point
  lat: number;
  lng: number;
  name: string;
  source: string;
}

/**
 * Tide Extremes API Response
 */
export interface StormGlassTideExtremesResponse {
  data: StormGlassTideExtreme[];
  meta: {
    cost: number;
    dailyQuota: number;
    datum: string;
    requestCount: number;
    lat: number;
    lng: number;
    station: StormGlassTideStation;
  };
}

/**
 * Sea level data point for continuous tide heights
 */
export interface StormGlassSeaLevelData {
  time: string; // ISO 8601 timestamp
  sg: number; // Storm Glass prediction (meters)
}

/**
 * Sea Level API Response
 */
export interface StormGlassSeaLevelResponse {
  data: StormGlassSeaLevelData[];
  meta: {
    cost: number;
    dailyQuota: number;
    datum: string;
    requestCount: number;
    lat: number;
    lng: number;
    station: StormGlassTideStation;
  };
}

/**
 * Current data for ocean currents
 */
export interface StormGlassCurrentHour {
  time: string; // ISO 8601 timestamp
  currentDirection?: StormGlassDataPoint<number>[]; // degrees
  currentSpeed?: StormGlassDataPoint<number>[]; // m/s
}

/**
 * Current API Response
 */
export interface StormGlassCurrentResponse {
  hours: StormGlassCurrentHour[];
  meta: {
    cost: number;
    dailyQuota: number;
    requestCount: number;
    lat: number;
    lng: number;
    params: string[];
  };
}

/**
 * API Error Response
 */
export interface StormGlassError {
  errors: {
    [key: string]: string[];
  };
}

/**
 * Request parameters for weather endpoint
 */
export interface StormGlassWeatherParams {
  lat: number;
  lng: number;
  params?: string[]; // e.g., ['windSpeed', 'waveHeight', 'waterTemperature']
  start?: number; // Unix timestamp
  end?: number; // Unix timestamp
  source?: string[]; // e.g., ['noaa', 'meteo', 'ukmo']
}

/**
 * Request parameters for tide endpoints
 */
export interface StormGlassTideParams {
  lat: number;
  lng: number;
  start?: number; // Unix timestamp
  end?: number; // Unix timestamp
  datum?: string; // e.g., 'MSL', 'LAT'
}

/**
 * Cache entry for storing API responses
 */
export interface StormGlassCacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Rate limit tracking
 */
export interface StormGlassRateLimit {
  dailyQuota: number;
  requestCount: number;
  lastReset: number;
  nextReset: number;
}

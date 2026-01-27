/**
 * Open-Meteo Weather Service
 * FREE weather and marine data API - no API key required!
 * Documentation: https://open-meteo.com/en/docs
 * Marine API: https://open-meteo.com/en/docs/marine-weather-api
 */

import type { GeoLocation } from '@/lib/types/map';
import type { AdvancedWeatherConditions } from '@/lib/types/advanced-map';

const WEATHER_API_URL = 'https://api.open-meteo.com/v1/forecast';
const MARINE_API_URL = 'https://marine-api.open-meteo.com/v1/marine';

// Cache duration in milliseconds
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface OpenMeteoWeatherHour {
  time: string;
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  precipitation: number;
  cloud_cover: number;
  pressure_msl: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  wind_gusts_10m: number;
  visibility?: number;
}

interface OpenMeteoMarineHour {
  time: string;
  wave_height?: number;
  wave_direction?: number;
  wave_period?: number;
  swell_wave_height?: number;
  swell_wave_direction?: number;
  swell_wave_period?: number;
  wind_wave_height?: number;
  wind_wave_direction?: number;
  wind_wave_period?: number;
}

interface OpenMeteoWeatherResponse {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    apparent_temperature: number[];
    precipitation: number[];
    cloud_cover: number[];
    pressure_msl: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    wind_gusts_10m: number[];
    visibility?: number[];
  };
}

interface OpenMeteoMarineResponse {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    wave_height?: number[];
    wave_direction?: number[];
    wave_period?: number[];
    swell_wave_height?: number[];
    swell_wave_direction?: number[];
    swell_wave_period?: number[];
    wind_wave_height?: number[];
    wind_wave_direction?: number[];
    wind_wave_period?: number[];
  };
}

export class OpenMeteoService {
  private cache: Map<string, CacheEntry<any>> = new Map();

  constructor() {
    console.info('[OpenMeteoService] Initialized - FREE weather API, no key required');
  }

  /**
   * Get comprehensive marine weather forecast
   * Combines weather API + marine API for complete data
   */
  async getMarineWeather(location: GeoLocation, hours: number = 48): Promise<AdvancedWeatherConditions[]> {
    const cacheKey = `weather_${location.latitude.toFixed(4)}_${location.longitude.toFixed(4)}_${hours}`;
    const cached = this.getCached<AdvancedWeatherConditions[]>(cacheKey);

    if (cached) {
      console.info('[OpenMeteoService] Returning cached weather data');
      return cached;
    }

    try {
      // Fetch weather and marine data in parallel
      const [weatherData, marineData] = await Promise.all([
        this.fetchWeatherForecast(location, hours),
        this.fetchMarineForecast(location, hours),
      ]);

      // Merge the data
      const forecasts = this.mergeWeatherAndMarine(weatherData, marineData, location);

      this.setCache(cacheKey, forecasts, CACHE_DURATION);
      console.info(`[OpenMeteoService] Fetched ${forecasts.length} hours of forecast data`);

      return forecasts;
    } catch (error) {
      console.error('[OpenMeteoService] Marine weather error:', error);
      throw error;
    }
  }

  /**
   * Get weather for a specific timestamp
   */
  async getWeatherAtTime(location: GeoLocation, targetTime: Date): Promise<AdvancedWeatherConditions | null> {
    try {
      // Get forecast and find closest hour
      const forecasts = await this.getMarineWeather(location, 72);
      
      let closest: AdvancedWeatherConditions | null = null;
      let smallestDiff = Infinity;

      for (const forecast of forecasts) {
        if (!forecast.timestamp) continue;
        const diff = Math.abs(forecast.timestamp.getTime() - targetTime.getTime());
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closest = forecast;
        }
      }

      return closest;
    } catch (error) {
      console.error('[OpenMeteoService] Weather at time error:', error);
      return null;
    }
  }

  /**
   * Fetch weather forecast from Open-Meteo Weather API
   */
  private async fetchWeatherForecast(location: GeoLocation, hours: number): Promise<OpenMeteoWeatherResponse> {
    const params = new URLSearchParams({
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      hourly: [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'precipitation',
        'cloud_cover',
        'pressure_msl',
        'wind_speed_10m',
        'wind_direction_10m',
        'wind_gusts_10m',
        'visibility',
      ].join(','),
      forecast_hours: hours.toString(),
      wind_speed_unit: 'kn', // Get wind in knots directly
    });

    const response = await fetch(`${WEATHER_API_URL}?${params}`);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetch marine forecast from Open-Meteo Marine API
   */
  private async fetchMarineForecast(location: GeoLocation, hours: number): Promise<OpenMeteoMarineResponse> {
    const params = new URLSearchParams({
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      hourly: [
        'wave_height',
        'wave_direction',
        'wave_period',
        'swell_wave_height',
        'swell_wave_direction',
        'swell_wave_period',
        'wind_wave_height',
        'wind_wave_direction',
        'wind_wave_period',
      ].join(','),
      forecast_hours: hours.toString(),
    });

    const response = await fetch(`${MARINE_API_URL}?${params}`);
    
    if (!response.ok) {
      // Marine data might not be available for all locations (inland areas)
      console.warn('[OpenMeteoService] Marine API not available for this location, using defaults');
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        hourly: {
          time: [],
        },
      };
    }

    return response.json();
  }

  /**
   * Merge weather and marine data into AdvancedWeatherConditions
   */
  private mergeWeatherAndMarine(
    weather: OpenMeteoWeatherResponse,
    marine: OpenMeteoMarineResponse,
    location: GeoLocation
  ): AdvancedWeatherConditions[] {
    const results: AdvancedWeatherConditions[] = [];
    const times = weather.hourly.time;

    // Create lookup for marine data by time
    const marineByTime = new Map<string, number>();
    marine.hourly.time?.forEach((time, index) => {
      marineByTime.set(time, index);
    });

    for (let i = 0; i < times.length; i++) {
      const time = times[i];
      const marineIndex = marineByTime.get(time);

      const windSpeed = weather.hourly.wind_speed_10m[i] || 0;
      const windDirection = weather.hourly.wind_direction_10m[i] || 0;
      const windGusts = weather.hourly.wind_gusts_10m[i] || windSpeed * 1.3;
      const temperature = weather.hourly.temperature_2m[i] || 20;
      const humidity = weather.hourly.relative_humidity_2m[i] || 60;
      const pressure = weather.hourly.pressure_msl[i] || 1013.25;
      const cloudCover = weather.hourly.cloud_cover[i] || 50;
      const precipitation = weather.hourly.precipitation[i] || 0;
      const visibilityMeters = (weather.hourly.visibility?.[i] || 10000);

      // Marine data (may be undefined for inland locations)
      const waveHeight = marineIndex !== undefined ? marine.hourly.wave_height?.[marineIndex] ?? 0.5 : 0.5;
      const waveDirection = marineIndex !== undefined ? marine.hourly.wave_direction?.[marineIndex] ?? windDirection : windDirection;
      const wavePeriod = marineIndex !== undefined ? marine.hourly.wave_period?.[marineIndex] ?? 5 : 5;
      const swellHeight = marineIndex !== undefined ? marine.hourly.swell_wave_height?.[marineIndex] ?? waveHeight * 0.6 : waveHeight * 0.6;
      const swellDirection = marineIndex !== undefined ? marine.hourly.swell_wave_direction?.[marineIndex] ?? windDirection : windDirection;
      const swellPeriod = marineIndex !== undefined ? marine.hourly.swell_wave_period?.[marineIndex] ?? wavePeriod * 1.2 : wavePeriod * 1.2;

      const beaufortScale = this.calculateBeaufortScale(windSpeed);
      const visibilityKm = visibilityMeters / 1000;
      const timestamp = new Date(time);

      results.push({
        wind: {
          speed: windSpeed,
          direction: windDirection,
          gusts: windGusts,
          variability: this.estimateWindVariability(windSpeed),
          beaufortScale,
        },
        tide: {
          height: 0, // Open-Meteo doesn't provide tides - use StormGlass for this
          direction: 'unknown',
          speed: 0,
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
        temperature,
        temperatureProfile: {
          air: temperature,
          water: temperature - 2, // Estimate water temp
          dewpoint: this.calculateDewpoint(temperature, humidity),
          feelslike: weather.hourly.apparent_temperature[i] || temperature,
        },
        humidity,
        cloudCover,
        cloudLayerProfile: {
          total: cloudCover,
          low: cloudCover * 0.4,
          medium: cloudCover * 0.35,
          high: cloudCover * 0.25,
        },
        precipitation,
        precipitationProfile: {
          rate: precipitation,
          probability: precipitation > 0 ? Math.min(90, precipitation * 30) : 10,
          type: temperature < 2 ? 'snow' : 'rain',
        },
        visibility: {
          horizontal: visibilityMeters,
          conditions: this.determineVisibilityCondition(visibilityKm) as 'clear' | 'haze' | 'fog' | 'rain' | 'snow',
        },
        seaState: {
          waveHeight,
          wavePeriod,
          swellHeight,
          swellPeriod,
          swellDirection,
          seaTemperature: temperature - 2,
        },
        timestamp,
        location,
        forecast: {
          confidence: 0.85, // Open-Meteo uses ECMWF data which is high quality
          source: 'Open-Meteo',
          modelRun: new Date(),
          validTime: new Date(timestamp.getTime() + 3 * 60 * 60 * 1000),
          resolution: '11km',
        },
      });
    }

    return results;
  }

  /**
   * Calculate Beaufort scale from wind speed in knots
   */
  private calculateBeaufortScale(knots: number): number {
    if (knots < 1) return 0;
    if (knots < 4) return 1;
    if (knots < 7) return 2;
    if (knots < 11) return 3;
    if (knots < 17) return 4;
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
  private estimateWindVariability(speed: number): number {
    if (speed < 5) return 30;
    if (speed < 10) return 20;
    if (speed < 15) return 15;
    if (speed < 20) return 12;
    return 10;
  }

  /**
   * Calculate pressure trend (simplified)
   */
  private calculatePressureTrend(pressure: number): 'rising' | 'falling' | 'steady' {
    // Would need historical data for accurate trend
    if (pressure > 1020) return 'rising';
    if (pressure < 1005) return 'falling';
    return 'steady';
  }

  /**
   * Calculate dewpoint from temperature and humidity
   */
  private calculateDewpoint(tempC: number, humidity: number): number {
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * tempC) / (b + tempC)) + Math.log(humidity / 100);
    return (b * alpha) / (a - alpha);
  }

  /**
   * Determine visibility condition
   */
  private determineVisibilityCondition(km: number): string {
    if (km < 1) return 'fog';
    if (km < 2) return 'mist';
    if (km < 5) return 'haze';
    if (km < 10) return 'moderate';
    return 'clear';
  }

  /**
   * Cache helpers
   */
  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setCache<T>(key: string, data: T, duration: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration,
    });
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
let openMeteoServiceInstance: OpenMeteoService | null = null;

export function getOpenMeteoService(): OpenMeteoService {
  if (!openMeteoServiceInstance) {
    openMeteoServiceInstance = new OpenMeteoService();
  }
  return openMeteoServiceInstance;
}

export default OpenMeteoService;


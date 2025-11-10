/**
 * OpenWeatherMap Provider
 *
 * Global weather service with free tier
 * API: https://openweathermap.org/api
 *
 * Free Tier: 1,000 calls/day, 60 calls/minute
 * Perfect for: Backup provider, global coverage outside HKO/NOAA regions
 *
 * Pricing:
 * - Free: 1,000 calls/day
 * - Startup: $40/month for 100k calls
 * - Developer: $120/month for 500k calls
 */

import {
  WeatherForecast,
  WindData,
  TideData,
  ConfidenceLevel,
  TideState
} from '@/types/environmental';
import Constants from 'expo-constants';

const OWM_API_BASE = 'https://api.openweathermap.org/data/2.5';

interface OWMForecastResponse {
  cod: string;
  message: number;
  cnt: number;
  list: Array<{
    dt: number; // Unix timestamp
    main: {
      temp: number; // Kelvin
      feels_like: number;
      temp_min: number;
      temp_max: number;
      pressure: number; // hPa
      sea_level: number;
      grnd_level: number;
      humidity: number; // %
      temp_kf: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    clouds: {
      all: number; // % cloud cover
    };
    wind: {
      speed: number; // m/s
      deg: number; // degrees
      gust?: number; // m/s
    };
    visibility: number; // meters
    pop: number; // Probability of precipitation
    sys: {
      pod: string; // Part of day (d/n)
    };
    dt_txt: string; // "2025-10-25 12:00:00"
  }>;
  city: {
    id: number;
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

interface OWMCurrentResponse {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number; // Kelvin
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number; // hPa
    humidity: number; // %
  };
  visibility: number;
  wind: {
    speed: number; // m/s
    deg: number; // degrees
    gust?: number; // m/s
  };
  clouds: {
    all: number; // %
  };
  dt: number; // Unix timestamp
  sys: {
    type: number;
    id: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

export class OpenWeatherMapProvider {
  private apiKey: string;

  constructor(apiKey?: string) {
    // Get API key from environment or parameter
    this.apiKey =
      apiKey ||
      Constants.expoConfig?.extra?.openWeatherMapApiKey ||
      process.env.EXPO_PUBLIC_OPENWEATHERMAP_API_KEY ||
      '';

    if (!this.apiKey) {
      console.warn(
        'OpenWeatherMap API key not set. Set EXPO_PUBLIC_OPENWEATHERMAP_API_KEY in .env or configure extra.openWeatherMapApiKey.'
      );
    }
  }

  /**
   * Get weather forecast for any location globally
   */
  async getForecast(
    lat: number,
    lng: number,
    targetTime: Date
  ): Promise<WeatherForecast | null> {
    if (!this.apiKey) {
      console.error('OpenWeatherMap: No API key configured');
      return null;
    }

    try {
      // Fetch 5-day forecast (3-hour intervals)
      const response = await fetch(
        `${OWM_API_BASE}/forecast?lat=${lat}&lon=${lng}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        if (response.status === 401) {
          console.error('OpenWeatherMap: Invalid API key');
        } else if (response.status === 429) {
          console.error('OpenWeatherMap: Rate limit exceeded (1000 calls/day on free tier)');
        }
        throw new Error(`OpenWeatherMap API error: ${response.status}`);
      }

      const data: OWMForecastResponse = await response.json();

      // Find forecast closest to target time
      const targetTimestamp = Math.floor(targetTime.getTime() / 1000);
      let closestForecast = data.list[0];
      let minDiff = Math.abs(closestForecast.dt - targetTimestamp);

      for (const forecast of data.list) {
        const diff = Math.abs(forecast.dt - targetTimestamp);
        if (diff < minDiff) {
          minDiff = diff;
          closestForecast = forecast;
        }
      }

      return this.buildForecast(closestForecast, targetTime);
    } catch (error) {
      console.error('OpenWeatherMap Provider error:', error);
      return null;
    }
  }

  /**
   * Get current weather conditions
   */
  async getCurrentConditions(lat: number, lng: number): Promise<WeatherForecast | null> {
    if (!this.apiKey) {
      console.error('OpenWeatherMap: No API key configured');
      return null;
    }

    try {
      const response = await fetch(
        `${OWM_API_BASE}/weather?lat=${lat}&lon=${lng}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`OpenWeatherMap API error: ${response.status}`);
      }

      const data: OWMCurrentResponse = await response.json();

      return {
        time: new Date(data.dt * 1000).toISOString(),
        wind: {
          speed: this.metersPerSecondToKnots(data.wind.speed),
          direction: data.wind.deg,
          gust: data.wind.gust ? this.metersPerSecondToKnots(data.wind.gust) : undefined
        },
        temperature: data.main.temp, // Already in Celsius
        pressure: data.main.pressure,
        cloud_cover: data.clouds.all,
        confidence: ConfidenceLevel.MEDIUM, // OWM is good but not as accurate as regional services
        provider: 'OpenWeatherMap'
      };
    } catch (error) {
      console.error('OpenWeatherMap current conditions error:', error);
      return null;
    }
  }

  /**
   * Build WeatherForecast from OpenWeatherMap data
   */
  private buildForecast(
    owmForecast: OWMForecastResponse['list'][0],
    targetTime: Date
  ): WeatherForecast {
    const wind: WindData = {
      speed: this.metersPerSecondToKnots(owmForecast.wind.speed),
      direction: owmForecast.wind.deg,
      gust: owmForecast.wind.gust
        ? this.metersPerSecondToKnots(owmForecast.wind.gust)
        : undefined
    };

    return {
      time: targetTime.toISOString(),
      wind,
      temperature: owmForecast.main.temp, // Already in Celsius from units=metric
      pressure: owmForecast.main.pressure,
      cloud_cover: owmForecast.clouds.all,
      confidence: ConfidenceLevel.MEDIUM,
      provider: 'OpenWeatherMap'
    };
  }

  /**
   * Convert m/s to knots
   * 1 m/s = 1.943844 knots
   */
  private metersPerSecondToKnots(ms: number): number {
    return Math.round(ms * 1.943844);
  }

  /**
   * Get tide data (OpenWeatherMap doesn't provide this - placeholder)
   */
  async getTideData(
    lat: number,
    lng: number,
    targetTime: Date
  ): Promise<TideData | null> {
    // OpenWeatherMap free tier doesn't provide tide data
    // Would need to use a dedicated tide API or upgrade to premium
    console.warn('OpenWeatherMap: Tide data not available in free tier');
    return null;
  }
}

export default OpenWeatherMapProvider;

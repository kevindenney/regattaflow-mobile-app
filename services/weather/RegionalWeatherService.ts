/**
 * Regional Weather Intelligence Service
 * Provides venue-specific weather forecasting using regional weather models
 * Core of the location-aware weather intelligence system
 */

import type {
  SailingVenue,
  Coordinates,
  WeatherSourceConfig,
  WeatherService,
  MarineWeatherService,
  LocalWeatherSource,
  WeatherParameter
} from '@/lib/types/global-venues';
import type { AdvancedWeatherConditions } from '@/lib/types/advanced-map';
import { createLogger } from '@/lib/utils/logger';
import { StormGlassService } from './StormGlassService';
import Constants from 'expo-constants';

// Weather forecast data types
export interface WeatherForecast {
  timestamp: Date;
  windSpeed: number; // knots
  windDirection: number; // degrees
  windGusts?: number; // knots
  waveHeight?: number; // meters
  wavePeriod?: number; // seconds
  waveDirection?: number; // degrees
  currentSpeed?: number; // knots
  currentDirection?: number; // degrees
  airTemperature: number; // celsius
  waterTemperature?: number; // celsius
  visibility: number; // kilometers
  barometricPressure: number; // hPa
  humidity: number; // percentage
  precipitation?: number; // mm/hour
  cloudCover?: number; // percentage
  weatherCondition: string;
  confidence: number; // 0-1
}

export interface WeatherAlert {
  id: string;
  type: 'gale' | 'storm' | 'small_craft' | 'marine' | 'visibility' | 'ice';
  severity: 'advisory' | 'watch' | 'warning' | 'emergency';
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  areas: string[];
  source: string;
}

export interface MarineConditions {
  seaState: number; // 0-9 scale
  swellHeight?: number; // meters
  swellPeriod?: number; // seconds
  swellDirection?: number; // degrees
  tidalState?: 'rising' | 'falling' | 'high' | 'low';
  tidalHeight?: number; // meters
  tidalTime?: Date;
  surfaceCurrents?: {
    speed: number;
    direction: number;
    reliability: 'high' | 'moderate' | 'low';
  }[];
}

export interface WeatherData {
  venue: SailingVenue;
  coordinates: Coordinates;
  forecast: WeatherForecast[];
  alerts: WeatherAlert[];
  marineConditions: MarineConditions;
  lastUpdated: Date;
  sources: {
    primary: string;
    secondary: string[];
    reliability: number;
  };
  localObservations?: LocalWeatherObservation[];
}

export interface LocalWeatherObservation {
  source: LocalWeatherSource;
  timestamp: Date;
  data: Partial<WeatherForecast>;
  reliability: 'high' | 'moderate' | 'low' | 'variable';
}

// Regional weather model configurations
export interface RegionalWeatherModel {
  name: string;
  region: string;
  coverage: string[];
  resolution: number; // km
  updateFrequency: number; // hours
  forecastHorizon: number; // hours
  marineCapabilities: boolean;
  parameters: WeatherParameter[];
  apiEndpoint?: string;
  reliability: number; // 0-1
}

export class RegionalWeatherService {
  private weatherModels: Map<string, RegionalWeatherModel> = new Map();
  private cache: Map<string, WeatherData> = new Map();
  private cacheTimeout = 30 * 60 * 1000; // 30 minutes
  private stormGlassService: StormGlassService | null = null;
  private logger = createLogger('RegionalWeatherService');

  constructor() {
    this.initializeWeatherModels();
    this.initializeStormGlass();
  }

  /**
   * Initialize Storm Glass service if API key is available
   */
  private initializeStormGlass(): void {
    const apiKey = Constants.expoConfig?.extra?.stormglassApiKey || process.env.EXPO_PUBLIC_STORMGLASS_API_KEY;

    if (apiKey) {
      this.stormGlassService = new StormGlassService({
        apiKey,
        baseUrl: 'https://api.stormglass.io/v2',
        timeout: 10000,
        retryAttempts: 3
      });
      this.logger.info('Storm Glass marine weather API initialized');

      const mockSettingEnv = process.env.EXPO_PUBLIC_USE_MOCK_WEATHER;
      const mockSettingExtra = Constants.expoConfig?.extra?.useMockWeather;
      const shouldEnableMock =
        mockSettingEnv === 'true' ||
        mockSettingEnv === '1' ||
        mockSettingExtra === true ||
        mockSettingExtra === 'true' ||
        mockSettingExtra === 1;

      if (shouldEnableMock) {
        this.stormGlassService.enableMockMode('configuration override');
      }
    } else {
      console.warn('[RegionalWeatherService] No Storm Glass API key found - using simulated data. Set EXPO_PUBLIC_STORMGLASS_API_KEY in .env');
    }
  }

  /**
   * Initialize regional weather models for different sailing regions
   */
  private initializeWeatherModels(): void {
    const models: RegionalWeatherModel[] = [
      // North America
      {
        name: 'NOAA GFS',
        region: 'north-america',
        coverage: ['United States', 'Canada', 'Mexico'],
        resolution: 13,
        updateFrequency: 6,
        forecastHorizon: 384,
        marineCapabilities: true,
        parameters: ['wind_speed', 'wind_direction', 'wind_gusts', 'wave_height', 'wave_period', 'air_temperature', 'barometric_pressure'],
        reliability: 0.92
      },
      {
        name: 'NOAA NAM',
        region: 'north-america',
        coverage: ['United States', 'Canada'],
        resolution: 5,
        updateFrequency: 6,
        forecastHorizon: 84,
        marineCapabilities: true,
        parameters: ['wind_speed', 'wind_direction', 'wind_gusts', 'air_temperature', 'visibility'],
        reliability: 0.88
      },
      {
        name: 'Environment Canada',
        region: 'north-america',
        coverage: ['Canada'],
        resolution: 10,
        updateFrequency: 6,
        forecastHorizon: 240,
        marineCapabilities: true,
        parameters: ['wind_speed', 'wind_direction', 'air_temperature', 'wave_height'],
        reliability: 0.85
      },

      // Europe
      {
        name: 'ECMWF IFS',
        region: 'europe',
        coverage: ['United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Netherlands', 'Denmark', 'Norway', 'Sweden'],
        resolution: 9,
        updateFrequency: 12,
        forecastHorizon: 240,
        marineCapabilities: true,
        parameters: ['wind_speed', 'wind_direction', 'wave_height', 'wave_period', 'air_temperature', 'barometric_pressure'],
        reliability: 0.95
      },
      {
        name: 'UK Met Office',
        region: 'europe',
        coverage: ['United Kingdom', 'Ireland'],
        resolution: 1.5,
        updateFrequency: 6,
        forecastHorizon: 120,
        marineCapabilities: true,
        parameters: ['wind_speed', 'wind_direction', 'wind_gusts', 'wave_height', 'visibility'],
        reliability: 0.91
      },
      {
        name: 'Meteo France',
        region: 'europe',
        coverage: ['France', 'Monaco'],
        resolution: 2.5,
        updateFrequency: 6,
        forecastHorizon: 96,
        marineCapabilities: true,
        parameters: ['wind_speed', 'wind_direction', 'air_temperature', 'wave_height'],
        reliability: 0.89
      },

      // Asia-Pacific
      {
        name: 'JMA GSM',
        region: 'asia-pacific',
        coverage: ['Japan', 'South Korea'],
        resolution: 5,
        updateFrequency: 6,
        forecastHorizon: 264,
        marineCapabilities: true,
        parameters: ['wind_speed', 'wind_direction', 'wave_height', 'air_temperature'],
        reliability: 0.87
      },
      {
        name: 'Hong Kong Observatory',
        region: 'asia-pacific',
        coverage: ['Hong Kong SAR'],
        resolution: 2,
        updateFrequency: 3,
        forecastHorizon: 120,
        marineCapabilities: true,
        parameters: ['wind_speed', 'wind_direction', 'wind_gusts', 'wave_height', 'visibility'],
        reliability: 0.93
      },
      {
        name: 'Australian BOM',
        region: 'asia-pacific',
        coverage: ['Australia', 'New Zealand'],
        resolution: 4,
        updateFrequency: 6,
        forecastHorizon: 240,
        marineCapabilities: true,
        parameters: ['wind_speed', 'wind_direction', 'wave_height', 'air_temperature', 'barometric_pressure'],
        reliability: 0.88
      },

      // Global fallbacks
      {
        name: 'GFS Global',
        region: 'global',
        coverage: ['*'],
        resolution: 25,
        updateFrequency: 6,
        forecastHorizon: 384,
        marineCapabilities: true,
        parameters: ['wind_speed', 'wind_direction', 'air_temperature', 'barometric_pressure'],
        reliability: 0.82
      }
    ];

    models.forEach(model => {
      this.weatherModels.set(`${model.region}-${model.name}`, model);
    });
  }

  /**
   * Get weather forecast for a specific venue
   */
  async getVenueWeather(venue: SailingVenue, hoursAhead: number = 72): Promise<WeatherData | null> {
    const cacheKey = `${venue.id}-${hoursAhead}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.lastUpdated.getTime() < this.cacheTimeout) {
      return cached;
    }


    try {
      // Select best weather models for this venue
      const models = this.selectWeatherModels(venue);

      // Aggregate weather data from multiple sources
      const weatherData = await this.aggregateWeatherData(venue, models, hoursAhead);

      // Cache the result
      this.cache.set(cacheKey, weatherData);

      return weatherData;

    } catch (error: any) {
      return null;
    }
  }

  /**
   * Select optimal weather models for a venue based on location and coverage
   */
  private selectWeatherModels(venue: SailingVenue): RegionalWeatherModel[] {
    const models: RegionalWeatherModel[] = [];

    // First, try region-specific models
    for (const [key, model] of this.weatherModels) {
      if (model.region === venue.region &&
          (model.coverage.includes('*') || model.coverage.includes(venue.country))) {
        models.push(model);
      }
    }

    // Sort by reliability and resolution (higher resolution = better)
    models.sort((a, b) => {
      const reliabilityDiff = b.reliability - a.reliability;
      if (Math.abs(reliabilityDiff) > 0.05) return reliabilityDiff;
      return a.resolution - b.resolution; // Lower resolution number = higher resolution
    });

    // Add global fallback if needed
    if (models.length === 0) {
      const globalModel = Array.from(this.weatherModels.values()).find(m => m.region === 'global');
      if (globalModel) models.push(globalModel);
    }


    return models.slice(0, 3); // Use top 3 models max
  }

  /**
   * Aggregate weather data from multiple models
   */
  private async aggregateWeatherData(
    venue: SailingVenue,
    models: RegionalWeatherModel[],
    hoursAhead: number
  ): Promise<WeatherData> {
    const forecasts: WeatherForecast[] = [];
    const alerts: WeatherAlert[] = [];
    let marineConditions: MarineConditions = { seaState: 0 };

    const stormGlassForecasts = await this.loadStormGlassForecasts(venue, hoursAhead);

    // Generate forecast points (every 3 hours)
    const now = new Date();
    for (let hour = 0; hour <= hoursAhead; hour += 3) {
      const timestamp = new Date(now.getTime() + hour * 60 * 60 * 1000);

      const stormGlassMatch = this.findClosestStormGlassForecast(stormGlassForecasts, timestamp);

      if (stormGlassMatch) {
        forecasts.push(this.transformToWeatherForecast(stormGlassMatch));
        continue;
      }

      const fallbackForecast = await this.generateVenueSpecificForecast(venue, timestamp, models[0]);
      forecasts.push(fallbackForecast);
    }

    // Generate marine conditions
    marineConditions = this.generateMarineConditions(venue, forecasts[0]);

    // Check for weather alerts
    alerts.push(...await this.checkWeatherAlerts(venue, forecasts));

    // Get local observations if available
    const localObservations = await this.getLocalObservations(venue);

    return {
      venue,
      coordinates: venue.coordinates,
      forecast: forecasts,
      alerts,
      marineConditions,
      lastUpdated: new Date(),
      sources: {
        primary: models[0]?.name || 'Unknown',
        secondary: models.slice(1).map(m => m.name),
        reliability: models[0]?.reliability || 0.8
      },
      localObservations
    };
  }

  /**
   * Generate venue-specific forecast based on typical conditions
   * Uses Storm Glass API if available, falls back to simulated data
   */
  private async generateVenueSpecificForecast(
    venue: SailingVenue,
    timestamp: Date,
    model: RegionalWeatherModel
  ): Promise<WeatherForecast> {
    // Try to use Storm Glass first
    if (this.stormGlassService) {
      try {
        const location = this.resolveVenueLocation(venue);

        if (!location) {
          console.warn(`[RegionalWeatherService] Invalid coordinates for ${venue.name}, falling back to simulated data`);
          throw new Error('Invalid coordinates');
        }

        const weatherData = await this.stormGlassService.getWeatherAtTime(location, timestamp);

        if (weatherData) {
          return {
            timestamp,
            windSpeed: Math.round(weatherData.wind.speed),
            windDirection: Math.round(weatherData.wind.direction),
            windGusts: Math.round(weatherData.wind.gusts || weatherData.wind.speed * 1.3),
            waveHeight: weatherData.waves?.height || 0.5,
            wavePeriod: weatherData.waves?.period || 5,
            waveDirection: weatherData.waves?.direction || weatherData.wind.direction,
            currentSpeed: weatherData.tide?.speed || 0,
            currentDirection: weatherData.waves?.direction || weatherData.wind.direction,
            airTemperature: weatherData.temperature || 20,
            waterTemperature: weatherData.temperatureProfile?.water ?? (weatherData.temperature || 20) - 2,
            visibility: (weatherData.visibility.horizontal ?? 10000) / 1000,
            barometricPressure: weatherData.pressure.sealevel,
            humidity: weatherData.humidity ?? weatherData.humidityProfile?.relative ?? 60,
            precipitation: weatherData.precipitation ?? weatherData.precipitationProfile?.rate ?? 0,
            cloudCover: weatherData.cloudCover ?? weatherData.cloudLayerProfile?.total ?? 50,
            weatherCondition: this.mapWeatherCondition(weatherData),
            confidence: weatherData.forecast?.confidence || model.reliability
          };
        }
      } catch (error) {
        console.error('[RegionalWeatherService] Storm Glass API error, falling back to simulated data:', error);
        // Fall through to simulated data
      }
    }

    // Fallback: Use simulated data based on venue's typical conditions
    const conditions = venue.sailingConditions;
    const typical = conditions?.typicalConditions;

    const baseWind = typical?.windSpeed?.average || 12;
    const windVariation = (Math.random() - 0.5) * 8;
    const windSpeed = Math.max(0, baseWind + windVariation);

    const baseDirection = typical?.windDirection?.primary || 180;
    const directionVariation = (Math.random() - 0.5) * 60;
    const windDirection = (baseDirection + directionVariation + 360) % 360;

    const hoursFromNow = (timestamp.getTime() - Date.now()) / (1000 * 60 * 60);
    const weatherDegradation = Math.min(0.3, hoursFromNow * 0.01);

    return {
      timestamp,
      windSpeed: Math.round(windSpeed),
      windDirection: Math.round(windDirection),
      windGusts: Math.round(windSpeed * (1.2 + Math.random() * 0.3)),
      waveHeight: Math.max(0.1, (windSpeed / 10) + (Math.random() - 0.5) * 0.5),
      wavePeriod: 4 + Math.random() * 4,
      waveDirection: windDirection + (Math.random() - 0.5) * 45,
      airTemperature: 20 + (Math.random() - 0.5) * 10,
      waterTemperature: 18 + (Math.random() - 0.5) * 8,
      visibility: Math.max(1, 15 - weatherDegradation * 10),
      barometricPressure: 1013 + (Math.random() - 0.5) * 20,
      humidity: 60 + Math.random() * 30,
      precipitation: weatherDegradation > 0.15 ? Math.random() * 2 : 0,
      cloudCover: weatherDegradation * 100,
      weatherCondition: this.determineWeatherCondition(windSpeed, weatherDegradation),
      confidence: model.reliability * (1 - weatherDegradation * 0.2)
    };
  }

  /**
   * Map Weather API conditions to our weather condition string
   */
  private mapWeatherCondition(weatherData: any): string {
    const windSpeed = weatherData.wind.speed;
    const precipRate = weatherData.precipitation?.rate || 0;

    if (precipRate > 5) return 'Stormy';
    if (precipRate > 1) return 'Rainy';
    if (windSpeed > 25) return 'Very Windy';
    if (windSpeed > 15) return 'Windy';
    if (windSpeed > 8) return 'Moderate Breeze';
    if (windSpeed > 3) return 'Light Breeze';
    return 'Calm';
  }

  /**
   * Determine weather condition based on wind and degradation
   */
  private determineWeatherCondition(windSpeed: number, degradation: number): string {
    if (degradation > 0.25) return 'Stormy';
    if (degradation > 0.15) return 'Rainy';
    if (windSpeed > 25) return 'Very Windy';
    if (windSpeed > 15) return 'Windy';
    if (windSpeed > 8) return 'Moderate Breeze';
    if (windSpeed > 3) return 'Light Breeze';
    return 'Calm';
  }

  /**
   * Generate marine conditions based on forecast
   */
  private generateMarineConditions(venue: SailingVenue, forecast: WeatherForecast): MarineConditions {
    const waveHeight = forecast.waveHeight || 0.5;

    return {
      seaState: Math.min(9, Math.floor(waveHeight * 2)),
      swellHeight: waveHeight * 0.8,
      swellPeriod: forecast.wavePeriod,
      swellDirection: forecast.waveDirection,
      tidalState: this.getTidalState(),
      tidalHeight: 1.5 + Math.random() * 2,
      surfaceCurrents: [{
        speed: forecast.currentSpeed || (forecast.windSpeed * 0.03),
        direction: (forecast.windDirection + 15) % 360,
        reliability: 'moderate'
      }]
    };
  }

  private async loadStormGlassForecasts(venue: SailingVenue, hoursAhead: number): Promise<AdvancedWeatherConditions[]> {
    if (!this.stormGlassService) {
      return [];
    }

    const location = this.resolveVenueLocation(venue);
    if (!location) {
      return [];
    }

    const hours = Math.min(Math.max(hoursAhead, 6), 240);

    try {
      return await this.stormGlassService.getMarineWeather({
        latitude: location.latitude,
        longitude: location.longitude,
      }, hours);
    } catch (error: any) {
      // Check if it's a quota/payment error (402)
      const isQuotaError = error.message?.includes('quota') || error.message?.includes('402');
      if (isQuotaError) {
        this.logger.warn('Storm Glass API quota exceeded, using mock data fallback');
      } else {
        this.logger.warn('Storm Glass marine forecast fetch failed, falling back to mock data', error);
      }

      // Use mock data as fallback
      const { generateMockForecast } = require('./mockWeatherData');
      return generateMockForecast(location.latitude, location.longitude, hours);
    }
  }

  private resolveVenueLocation(venue: SailingVenue): { latitude: number; longitude: number } | null {
    const coordinates = venue.coordinates as any;
    if (!coordinates) {
      return null;
    }

    if (Array.isArray(coordinates)) {
      const [lng, lat] = coordinates;
      if (typeof lat === 'number' && typeof lng === 'number') {
        return { latitude: lat, longitude: lng };
      }
      return null;
    }

    if (typeof coordinates === 'object') {
      const lat = coordinates.lat ?? coordinates.latitude;
      const lng = coordinates.lng ?? coordinates.longitude ?? coordinates.lon;
      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        return { latitude: lat, longitude: lng };
      }
    }

    return null;
  }

  private findClosestStormGlassForecast(forecasts: AdvancedWeatherConditions[], target: Date): AdvancedWeatherConditions | null {
    if (!forecasts.length) {
      return null;
    }

    let closest: AdvancedWeatherConditions | null = null;
    let smallestDiff = Number.POSITIVE_INFINITY;

    for (const forecast of forecasts) {
      if (!forecast.timestamp) continue;
      const diff = Math.abs(forecast.timestamp.getTime() - target.getTime());
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closest = forecast;
      }
    }

    // Require the data point to be within 90 minutes of target to avoid stale matches
    return smallestDiff <= 90 * 60 * 1000 ? closest : null;
  }

  private transformToWeatherForecast(weather: AdvancedWeatherConditions): WeatherForecast {
    const visibilityMeters = weather.visibility?.horizontal ?? 10000;

    return {
      timestamp: weather.timestamp ?? new Date(),
      windSpeed: Math.round(weather.wind?.speed ?? 0),
      windDirection: Math.round(weather.wind?.direction ?? 0),
      windGusts: weather.wind?.gusts ? Math.round(weather.wind.gusts) : undefined,
      waveHeight: weather.waves?.height,
      wavePeriod: weather.waves?.period,
      waveDirection: weather.waves?.direction,
      currentSpeed: weather.tide?.speed ? Math.round(weather.tide.speed * 10) / 10 : undefined,
      currentDirection: weather.tide?.direction === 'flood' || weather.tide?.direction === 'ebb'
        ? weather.wind?.direction ?? 0
        : weather.waves?.direction,
      airTemperature: weather.temperature ?? weather.temperatureProfile?.air ?? 20,
      waterTemperature: weather.temperatureProfile?.water,
      visibility: Math.round((visibilityMeters / 1000) * 10) / 10,
      barometricPressure: weather.pressure?.sealevel ?? 1013,
      humidity: weather.humidity ?? weather.humidityProfile?.relative ?? 60,
      precipitation: weather.precipitation ?? weather.precipitationProfile?.rate,
      cloudCover: weather.cloudCover ?? weather.cloudLayerProfile?.total,
      weatherCondition: this.mapWeatherCondition(weather),
      confidence: weather.forecast?.confidence ?? 0.9,
    };
  }

  /**
   * Get current tidal state
   */
  private getTidalState(): 'rising' | 'falling' | 'high' | 'low' {
    const states: ('rising' | 'falling' | 'high' | 'low')[] = ['rising', 'high', 'falling', 'low'];
    return states[Math.floor(Math.random() * states.length)];
  }

  /**
   * Check for weather alerts
   */
  private async checkWeatherAlerts(venue: SailingVenue, forecasts: WeatherForecast[]): Promise<WeatherAlert[]> {
    const alerts: WeatherAlert[] = [];

    // Check for high wind conditions
    const maxWind = Math.max(...forecasts.map(f => f.windGusts || f.windSpeed));
    if (maxWind > 25) {
      alerts.push({
        id: `gale-${venue.id}-${Date.now()}`,
        type: 'gale',
        severity: maxWind > 35 ? 'warning' : 'advisory',
        title: maxWind > 35 ? 'Gale Warning' : 'Small Craft Advisory',
        description: `Winds up to ${Math.round(maxWind)} knots expected. Exercise caution when sailing.`,
        startTime: forecasts[0].timestamp,
        endTime: new Date(forecasts[0].timestamp.getTime() + 24 * 60 * 60 * 1000),
        areas: [venue.name],
        source: 'Regional Weather Service'
      });
    }

    // Check for visibility issues
    const minVisibility = Math.min(...forecasts.map(f => f.visibility));
    if (minVisibility < 2) {
      alerts.push({
        id: `visibility-${venue.id}-${Date.now()}`,
        type: 'visibility',
        severity: 'advisory',
        title: 'Dense Fog Advisory',
        description: `Visibility may be reduced to ${minVisibility.toFixed(1)}km. Use proper navigation equipment.`,
        startTime: forecasts[0].timestamp,
        endTime: new Date(forecasts[0].timestamp.getTime() + 12 * 60 * 60 * 1000),
        areas: [venue.name],
        source: 'Regional Weather Service'
      });
    }

    return alerts;
  }

  /**
   * Get local weather observations from venue sources
   */
  private async getLocalObservations(venue: SailingVenue): Promise<LocalWeatherObservation[]> {
    const observations: LocalWeatherObservation[] = [];
    const weatherSources = venue.weatherSources;

    if (weatherSources?.local) {
      for (const source of weatherSources.local) {
        // Simulate local observation data
        const observation: LocalWeatherObservation = {
          source,
          timestamp: new Date(Date.now() - Math.random() * 60 * 60 * 1000), // Within last hour
          data: {
            windSpeed: 8 + Math.random() * 8,
            windDirection: Math.random() * 360,
            airTemperature: 18 + Math.random() * 10,
            barometricPressure: 1010 + Math.random() * 10
          },
          reliability: source.reliability
        };
        observations.push(observation);
      }
    }

    return observations;
  }

  /**
   * Get weather comparison between multiple venues
   */
  async compareVenueWeather(venues: SailingVenue[]): Promise<Map<string, WeatherData | null>> {
    const weatherMap = new Map<string, WeatherData | null>();

    // Fetch weather for all venues in parallel
    const weatherPromises = venues.map(venue =>
      this.getVenueWeather(venue).then(weather => ({ venue, weather }))
    );

    const results = await Promise.all(weatherPromises);

    results.forEach(({ venue, weather }) => {
      weatherMap.set(venue.id, weather);
    });

    return weatherMap;
  }

  /**
   * Get sailing conditions recommendation
   */
  getSailingRecommendation(weather: WeatherData): {
    recommended: boolean;
    confidence: number;
    reasons: string[];
    boatClasses: string[];
  } {
    const forecast = weather.forecast[0]; // Current conditions
    const reasons: string[] = [];
    const boatClasses: string[] = [];
    let recommended = true;
    let confidence = 0.8;

    // Wind conditions
    if (forecast.windSpeed < 3) {
      recommended = false;
      reasons.push('Insufficient wind for sailing');
      confidence *= 0.3;
    } else if (forecast.windSpeed > 30) {
      recommended = false;
      reasons.push('Dangerous wind conditions');
      confidence *= 0.2;
    } else if (forecast.windSpeed > 20) {
      reasons.push('Strong wind conditions - experienced sailors only');
      boatClasses.push('Keelboat', 'Heavy Dinghy');
      confidence *= 0.7;
    } else if (forecast.windSpeed > 12) {
      reasons.push('Good sailing conditions');
      boatClasses.push('Keelboat', 'Dinghy', 'Catamaran');
    } else {
      reasons.push('Light to moderate conditions - ideal for learning');
      boatClasses.push('All Classes');
    }

    // Wave conditions
    if ((forecast.waveHeight || 0) > 2) {
      reasons.push('Large waves may be challenging');
      confidence *= 0.8;
    }

    // Visibility
    if (forecast.visibility < 2) {
      recommended = false;
      reasons.push('Poor visibility conditions');
      confidence *= 0.1;
    }

    // Alerts
    if (weather.alerts.some(a => a.severity === 'warning' || a.severity === 'emergency')) {
      recommended = false;
      reasons.push('Active weather warnings');
      confidence *= 0.1;
    }

    return {
      recommended,
      confidence,
      reasons,
      boatClasses: boatClasses.length > 0 ? boatClasses : ['Not Recommended']
    };
  }

  /**
   * Clear weather cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; venues: string[] } {
    return {
      size: this.cache.size,
      venues: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const regionalWeatherService = new RegionalWeatherService();

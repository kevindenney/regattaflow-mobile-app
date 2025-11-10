import type { GeoLocation, BoundingBox } from '@/lib/types/map';
import type {
  AdvancedWeatherConditions,
  WeatherAlert
} from '@/lib/types/advanced-map';
import { StormGlassService } from './StormGlassService';
import { OpenWeatherMapProvider } from './OpenWeatherMapProvider';
import type { WeatherForecast as EnvironmentalForecast } from '@/types/environmental';
import { ConfidenceLevel } from '@/types/environmental';

export class ProfessionalWeatherService {
  private apiKeys: { [key: string]: string };
  private cache: Map<string, any> = new Map();
  private updateIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private stormGlassService: StormGlassService;
  private openWeatherProvider: OpenWeatherMapProvider | null;

  constructor(apiKeys: { [key: string]: string }) {
    this.apiKeys = apiKeys;

    // Initialize Storm Glass - comprehensive marine weather service
    this.stormGlassService = new StormGlassService({
      apiKey: apiKeys['stormglass'] || 'demo-key',
      baseUrl: 'https://api.stormglass.io/v2',
      timeout: 10000,
      retryAttempts: 3
    });

    // Initialize OpenWeatherMap as a cheaper global fallback provider
    this.openWeatherProvider = new OpenWeatherMapProvider(
      apiKeys['openweathermap']
    );
  }

  /**
   * Backwards compatible helper used by legacy components (e.g. WeatherOverlay3D)
   * Converts positional args into the GeoLocation shape expected internally.
   */
  async getAdvancedWeatherData(lat: number, lng: number, venueName?: string): Promise<AdvancedWeatherConditions> {
    return this.getAdvancedWeatherConditions({
      latitude: lat,
      longitude: lng,
    });
  }

  /**
   * Get comprehensive weather conditions from Storm Glass
   */
  async getAdvancedWeatherConditions(location: GeoLocation): Promise<AdvancedWeatherConditions> {
    const cacheKey = `weather_${location.latitude}_${location.longitude}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 15 * 60 * 1000) { // 15 minutes
        return cached.data;
      }
    }

    let weatherData: AdvancedWeatherConditions | null = null;

    try {
      // Storm Glass provides comprehensive marine data (weather + tides + currents)
      weatherData = await this.stormGlassService.getWeatherAtTime(location, new Date());

      if (weatherData) {
        // Enhance with tide extremes from Storm Glass
        try {
          const tideExtremes = await this.stormGlassService.getTideExtremes(location, 1);
          const nextHigh = tideExtremes.find(t => t.type === 'high' && t.time > new Date());
          const nextLow = tideExtremes.find(t => t.type === 'low' && t.time > new Date());

          if (nextHigh || nextLow) {
            weatherData.tide.nextHigh = nextHigh?.time;
            weatherData.tide.nextLow = nextLow?.time;
          }

          // Get current tide height
          const tideHeight = await this.stormGlassService.getTideHeightAtTime(location, new Date());
          weatherData.tide.height = tideHeight;

          // Determine tide direction based on next extreme
          if (nextHigh && nextLow) {
            weatherData.tide.direction = nextHigh.time < nextLow.time ? 'flood' : 'ebb';
          }
        } catch (tideError) {
          console.warn('[ProfessionalWeatherService] Tide data fetch failed, using defaults');
        }
      }
    } catch (error) {
      console.error('[ProfessionalWeatherService] Storm Glass error:', error);
    }

    if (!weatherData) {
      weatherData = await this.getFallbackWeather(location);
    }

    this.cache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now()
    });

    return weatherData;
  }

  /**
   * Convenience wrapper used by visualization components to render tidal current overlays.
   */
  async getTidalCurrents(bounds: BoundingBox): Promise<Array<{ time: Date; speed: number; direction: number }>> {
    try {
      const centerLat = bounds.southwest.latitude + ((bounds.northeast.latitude - bounds.southwest.latitude) / 2);
      const centerLng = bounds.southwest.longitude + ((bounds.northeast.longitude - bounds.southwest.longitude) / 2);

      const currents = await this.stormGlassService.getCurrents({
        latitude: centerLat,
        longitude: centerLng,
      }, 24);

      return currents.map(current => ({
        time: current.time,
        speed: current.speed * 1.943844, // Convert m/s to knots for UI consumers
        direction: current.direction,
      }));
    } catch (error) {
      console.warn('[ProfessionalWeatherService] Failed to load tidal currents from Storm Glass', error);
      return [];
    }
  }

  /**
   * Get detailed marine forecasts for racing
   */
  async getMarineForecast(location: GeoLocation, hours: number = 72): Promise<AdvancedWeatherConditions[]> {
    try {
      // Storm Glass provides comprehensive marine forecast
      const forecasts = await this.stormGlassService.getMarineWeather(location, hours);

      // Enhance with tide data for each forecast hour
      const tideExtremes = await this.stormGlassService.getTideExtremes(location, Math.ceil(hours / 24));

      for (const forecast of forecasts) {
        const nextHigh = tideExtremes.find(t => t.type === 'high' && t.time > forecast.timestamp);
        const nextLow = tideExtremes.find(t => t.type === 'low' && t.time > forecast.timestamp);

        if (nextHigh) forecast.tide.nextHigh = nextHigh.time;
        if (nextLow) forecast.tide.nextLow = nextLow.time;

        // Determine tide direction
        if (nextHigh && nextLow) {
          forecast.tide.direction = nextHigh.time < nextLow.time ? 'flood' : 'ebb';
        }
      }

      return forecasts;
    } catch (error) {
      console.error('[ProfessionalWeatherService] Marine forecast error:', error);
      const fallbackForecasts = await this.getFallbackMarineForecast(location, hours);
      if (fallbackForecasts.length > 0) {
        return fallbackForecasts;
      }
      return [];
    }
  }

  /**
   * Get real-time weather alerts for racing
   */
  async getWeatherAlerts(bounds: BoundingBox): Promise<WeatherAlert[]> {
    try {
      const alerts = await Promise.all([
        this.fetchNOAAAlerts(bounds),
        this.fetchWeatherAPIAlerts(bounds),
        this.fetchLocalMarineAlerts(bounds)
      ]);

      return alerts.flat().sort((a, b) => {
        const severityOrder = { 'warning': 3, 'watch': 2, 'advisory': 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
    } catch (error) {

      return [];
    }
  }

  private async fetchNOAAAlerts(_bounds: BoundingBox): Promise<WeatherAlert[]> {
    return [];
  }

  private async fetchWeatherAPIAlerts(_bounds: BoundingBox): Promise<WeatherAlert[]> {
    return [];
  }

  private async fetchLocalMarineAlerts(_bounds: BoundingBox): Promise<WeatherAlert[]> {
    return [];
  }

  /**
   * Get GRIB data for advanced analysis
   */
  async getGRIBData(bounds: BoundingBox, modelRun: Date): Promise<ArrayBuffer> {
    try {
      const gribUrl = this.buildGRIBUrl(bounds, modelRun);
      const response = await fetch(gribUrl, {
        headers: {
          'Authorization': `Bearer ${this.apiKeys['meteomatics']}`
        }
      });

      if (!response.ok) {
        throw new Error(`GRIB fetch failed: ${response.status}`);
      }

      return await response.arrayBuffer();
    } catch (error) {

      throw error;
    }
  }

  private buildGRIBUrl(bounds: BoundingBox, modelRun: Date): string {
    const baseUrl = 'https://api.stormglass.io/v2/weather/point';
    const params = new URLSearchParams({
      lat: bounds.southwest.latitude.toString(),
      lng: bounds.southwest.longitude.toString(),
      params: 'windSpeed,windDirection,airTemperature,pressure',
      start: Math.floor(modelRun.getTime() / 1000).toString(),
      end: Math.floor((modelRun.getTime() + (6 * 60 * 60 * 1000)) / 1000).toString(),
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Setup real-time weather updates for active racing
   */
  setupRealTimeUpdates(location: GeoLocation, callback: (weather: AdvancedWeatherConditions) => void): string {
    const updateId = `update_${Date.now()}_${Math.random()}`;

    const updateWeather = async () => {
      try {
        const weather = await this.getAdvancedWeatherConditions(location);
        callback(weather);
      } catch (error) {

      }
    };

    // Initial update
    updateWeather();

    // Setup 15-minute intervals for racing conditions
    const interval = setInterval(updateWeather, 15 * 60 * 1000) as ReturnType<typeof setInterval>;
    this.updateIntervals.set(updateId, interval);

    return updateId;
  }

  /**
   * Stop real-time updates
   */
  stopRealTimeUpdates(updateId: string): void {
    const interval = this.updateIntervals.get(updateId);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(updateId);
    }
  }

  // Private methods for Storm Glass integration
  // (Old multi-source methods removed - Storm Glass aggregates sources internally)


  private async getFallbackWeather(location: GeoLocation): Promise<AdvancedWeatherConditions> {
    if (this.openWeatherProvider) {
      try {
        const current = await this.openWeatherProvider.getCurrentConditions(
          location.latitude,
          location.longitude
        );

        if (current) {
          console.info('[ProfessionalWeatherService] Using OpenWeatherMap fallback data');
          return this.transformOpenWeatherForecast(current, location);
        }
      } catch (error) {
        console.warn('[ProfessionalWeatherService] OpenWeatherMap fallback failed', error);
      }
    }

    console.warn('[ProfessionalWeatherService] Falling back to static default weather data');
    return this.getStaticFallbackWeather(location);
  }

  private transformOpenWeatherForecast(
    forecast: EnvironmentalForecast,
    location: GeoLocation
  ): AdvancedWeatherConditions {
    const timestamp = forecast.time ? new Date(forecast.time) : new Date();
    const windSpeed = forecast.wind.speed;
    const windDirection = forecast.wind.direction ?? 0;
    const gusts = forecast.wind.gust ?? Math.round(windSpeed * 1.15);
    const cloudCover = forecast.cloud_cover ?? 0;
    const waveHeight = this.estimateWaveHeightFromWind(windSpeed);
    const wavePeriod = this.estimateWavePeriodFromWind(windSpeed);
    const airTemperature = forecast.temperature ?? 20;
    const waterTemperature = airTemperature - 2;
    const visibilityMeters = cloudCover >= 90 ? 6000 : cloudCover >= 70 ? 8000 : 12000;

    return {
      wind: {
        speed: windSpeed,
        direction: windDirection,
        gusts,
        variability: 5,
        beaufortScale: this.calculateBeaufortScale(windSpeed)
      },
      tide: {
        height: 0,
        direction: 'unknown',
        speed: 0
      },
      waves: {
        height: waveHeight,
        period: wavePeriod,
        direction: windDirection,
        swellHeight: Math.round(waveHeight * 0.6 * 10) / 10,
        swellPeriod: Math.max(3, Math.round(wavePeriod * 1.2)),
        swellDirection: windDirection
      },
      temperature: airTemperature,
      cloudCover,
      precipitation: 0,
      pressure: {
        sealevel: forecast.pressure ?? 1013.25,
        trend: 'steady',
        gradient: 0,
        rate: 0
      },
      visibility: {
        horizontal: visibilityMeters,
        conditions: this.determineVisibilityCondition(cloudCover),
        restrictions: cloudCover > 85 ? ['reduced by cloud cover'] : undefined
      },
      seaState: {
        waveHeight,
        wavePeriod,
        swellHeight: Math.round(waveHeight * 0.6 * 10) / 10,
        swellPeriod: Math.max(3, Math.round(wavePeriod * 1.2)),
        swellDirection: windDirection,
        seaTemperature: waterTemperature
      },
      temperatureProfile: {
        air: airTemperature,
        water: waterTemperature,
        dewpoint: airTemperature - 2,
        feelslike: airTemperature
      },
      precipitationProfile: {
        rate: 0,
        probability: 0,
        type: 'none'
      },
      cloudLayerProfile: {
        total: cloudCover,
        low: Math.min(100, Math.round(cloudCover * 0.6)),
        medium: Math.min(100, Math.round(cloudCover * 0.3)),
        high: Math.min(100, Math.round(cloudCover * 0.1))
      },
      forecast: {
        confidence: this.mapConfidenceToScore(forecast.confidence),
        source: forecast.provider || 'OpenWeatherMap',
        modelRun: timestamp,
        validTime: timestamp,
        resolution: '10km',
        model: 'OpenWeatherMap Global Forecast',
        lastUpdated: timestamp,
        nextUpdate: new Date(timestamp.getTime() + 3 * 60 * 60 * 1000)
      },
      alerts: [],
      location: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      timestamp
    };
  }

  private async getFallbackMarineForecast(
    location: GeoLocation,
    hours: number
  ): Promise<AdvancedWeatherConditions[]> {
    if (!this.openWeatherProvider) {
      return [];
    }

    const intervalHours = 3;
    const steps = Math.max(1, Math.min(Math.ceil(hours / intervalHours), 16));
    const forecasts: AdvancedWeatherConditions[] = [];

    for (let i = 0; i < steps; i++) {
      const targetTime = new Date(Date.now() + i * intervalHours * 60 * 60 * 1000);
      try {
        const forecast = await this.openWeatherProvider.getForecast(
          location.latitude,
          location.longitude,
          targetTime
        );

        if (!forecast) {
          continue;
        }

        const advanced = this.transformOpenWeatherForecast(forecast, location);
        advanced.timestamp = targetTime;
        advanced.forecast.validTime = targetTime;
        advanced.forecast.modelRun = targetTime;
        advanced.forecast.lastUpdated = new Date();
        forecasts.push(advanced);
      } catch (error) {
        console.warn('[ProfessionalWeatherService] OpenWeatherMap marine fallback fetch failed', error);
        break;
      }
    }

    return forecasts;
  }

  private mapConfidenceToScore(level?: ConfidenceLevel): number {
    switch (level) {
      case ConfidenceLevel.HIGH:
        return 0.8;
      case ConfidenceLevel.MEDIUM:
        return 0.55;
      case ConfidenceLevel.LOW:
        return 0.35;
      default:
        return 0.45;
    }
  }

  private determineVisibilityCondition(cloudCover?: number): 'clear' | 'haze' | 'fog' | 'rain' | 'snow' {
    if (cloudCover === undefined) {
      return 'clear';
    }

    if (cloudCover >= 90) {
      return 'rain';
    }

    if (cloudCover >= 70) {
      return 'haze';
    }

    return 'clear';
  }

  private estimateWaveHeightFromWind(windSpeedKnots: number): number {
    if (windSpeedKnots <= 0) {
      return 0.2;
    }

    const estimated = Math.min(4, Math.max(0.2, windSpeedKnots * 0.1));
    return Math.round(estimated * 10) / 10;
  }

  private estimateWavePeriodFromWind(windSpeedKnots: number): number {
    if (windSpeedKnots <= 0) {
      return 3;
    }

    return Math.max(3, Math.round(windSpeedKnots * 0.5));
  }

  private calculateBeaufortScale(knots: number): number {
    const thresholds = [1, 4, 7, 11, 17, 22, 28, 34, 41, 48, 56, 64];

    for (let scale = 0; scale < thresholds.length; scale++) {
      if (knots < thresholds[scale]) {
        return scale;
      }
    }

    return 12;
  }

  private getStaticFallbackWeather(location: GeoLocation): AdvancedWeatherConditions {
    const timestamp = new Date();

    return {
      wind: {
        speed: 5,
        direction: 180,
        gusts: 8,
        variability: 4,
        beaufortScale: this.calculateBeaufortScale(5)
      },
      tide: {
        height: 0,
        direction: 'flood',
        speed: 0.5
      },
      waves: {
        height: 0.5,
        period: 5,
        direction: 180,
        swellHeight: 0.3,
        swellPeriod: 6,
        swellDirection: 190
      },
      temperature: 15,
      precipitation: 0,
      cloudCover: 20,
      pressure: {
        sealevel: 1013.25,
        trend: 'steady',
        gradient: 0,
        rate: 0
      },
      visibility: {
        horizontal: 12000,
        conditions: 'clear'
      },
      seaState: {
        waveHeight: 0.5,
        wavePeriod: 5,
        swellHeight: 0.3,
        swellPeriod: 6,
        swellDirection: 190,
        seaTemperature: 15
      },
      temperatureProfile: {
        air: 15,
        water: 13,
        dewpoint: 12,
        feelslike: 15
      },
      precipitationProfile: {
        rate: 0,
        probability: 0,
        type: 'none'
      },
      cloudLayerProfile: {
        total: 20,
        low: 10,
        medium: 7,
        high: 3
      },
      forecast: {
        confidence: 0.3,
        source: 'StaticFallback',
        modelRun: timestamp,
        validTime: timestamp,
        resolution: 'low',
        lastUpdated: timestamp,
        nextUpdate: new Date(timestamp.getTime() + 60 * 60 * 1000)
      },
      alerts: [],
      location: {
        latitude: location.latitude,
        longitude: location.longitude
      },
      timestamp
    };
  }

}

/**
 * Weather Aggregation Service
 *
 * Multi-regional weather API integration for race intelligence
 * Automatically selects optimal weather providers by venue region
 * Supports: HKO (Hong Kong), NOAA (USA), ECMWF (Global), Met Office (UK), etc.
 *
 * See: plans/race-strategy-data-gathering-ux.md
 */

import { supabase } from './supabase';
import {
  WeatherForecast,
  EnvironmentalSnapshot,
  EnvironmentalIntelligence,
  WindData,
  TideData,
  WaveData,
  TideState,
  ConfidenceLevel
} from '@/types/environmental';
import { StormGlassService } from './weather/StormGlassService';
import type { AdvancedWeatherConditions } from '@/lib/types/advanced-map';

// Regional weather provider configuration
const REGIONAL_PROVIDERS = {
  'asia_pacific': ['StormGlass', 'HKO', 'JMA', 'BOM', 'OpenWeatherMap'],
  'europe': ['StormGlass', 'ECMWF', 'Met_Office', 'Meteo_France', 'OpenWeatherMap'],
  'north_america': ['StormGlass', 'NOAA', 'Environment_Canada', 'OpenWeatherMap'],
  'south_america': ['StormGlass', 'OpenWeatherMap'],
  'africa': ['StormGlass', 'OpenWeatherMap'],
  'middle_east': ['StormGlass', 'OpenWeatherMap'],
  'global': ['StormGlass', 'OpenWeatherMap']
};

export class WeatherAggregationService {
  private providers: string[];
  private venueRegion: string;
  private stormGlassService: StormGlassService | null;

  constructor(venue: { region?: string; country?: string }) {
    this.venueRegion = venue.region || 'global';
    this.providers = this.selectProvidersForRegion(this.venueRegion);
    this.stormGlassService = this.createStormGlassService();
  }

  /**
   * Get comprehensive environmental intelligence for race
   */
  async getEnvironmentalIntelligence(params: {
    venue_id: string;
    start_time: string;
    duration_minutes: number;
  }): Promise<EnvironmentalIntelligence> {
    try {
      // Get current conditions
      const current = await this.getCurrentConditions(params.venue_id);

      // Get forecast for race window
      const forecast = await this.getForecastForRaceWindow(
        params.venue_id,
        params.start_time,
        params.duration_minutes
      );

      // Generate summary
      const summary = this.generateWeatherSummary(current, forecast);

      // Detect tactical alerts
      const alerts = this.detectTacticalAlerts(current, forecast);

      return {
        current,
        forecast,
        summary,
        alerts
      };
    } catch (error) {
      console.error('Error getting environmental intelligence:', error);
      throw error;
    }
  }

  /**
   * Get current weather conditions
   */
  private async getCurrentConditions(venue_id: string): Promise<EnvironmentalSnapshot> {
    // Check cache first
    const cached = await this.getCachedForecast(venue_id, new Date().toISOString());
    if (cached) {
      return this.forecastToSnapshot(cached);
    }

    // Fetch from providers
    for (const provider of this.providers) {
      try {
        const data = await this.fetchFromProvider(provider, venue_id, new Date());
        if (data) {
          // Cache for future use
          await this.cacheForecast(venue_id, data);
          return this.forecastToSnapshot(data);
        }
      } catch (error) {
        console.warn(`Provider ${provider} failed:`, error);
        continue;
      }
    }

    throw new Error('No weather providers available');
  }

  /**
   * Get forecast for race time window
   */
  private async getForecastForRaceWindow(
    venue_id: string,
    start_time: string,
    duration_minutes: number
  ): Promise<WeatherForecast[]> {
    const startDate = new Date(start_time);
    const endDate = new Date(startDate.getTime() + duration_minutes * 60000);

    // Generate hourly intervals
    const intervals: Date[] = [];
    let currentTime = new Date(startDate);

    while (currentTime <= endDate) {
      intervals.push(new Date(currentTime));
      currentTime = new Date(currentTime.getTime() + 3600000); // +1 hour
    }

    // Fetch forecast for each interval
    const forecasts: WeatherForecast[] = [];

    for (const time of intervals) {
      // Check cache
      const cached = await this.getCachedForecast(venue_id, time.toISOString());
      if (cached) {
        forecasts.push(cached);
        continue;
      }

      // Fetch from providers
      for (const provider of this.providers) {
        try {
          const data = await this.fetchFromProvider(provider, venue_id, time);
          if (data) {
            forecasts.push(data);
            await this.cacheForecast(venue_id, data);
            break;
          }
        } catch (error) {
          console.warn(`Provider ${provider} failed for ${time}:`, error);
          continue;
        }
      }
    }

    return forecasts;
  }

  /**
   * Fetch weather data from specific provider
   */
  private async fetchFromProvider(
    provider: string,
    venue_id: string,
    time: Date
  ): Promise<WeatherForecast | null> {
    // Get venue coordinates
    const { data: venue } = await supabase
      .from('sailing_venues')
      .select('coordinates_lat, coordinates_lng')
      .eq('id', venue_id)
      .single();

    if (!venue) {
      throw new Error('Venue not found');
    }

    const lat = venue.coordinates_lat;
    const lng = venue.coordinates_lng;

    switch (provider) {
      case 'StormGlass':
        return this.fetchStormGlass(lat, lng, time);
      case 'HKO':
        return this.fetchHKO(lat, lng, time);
      case 'NOAA':
        return this.fetchNOAA(lat, lng, time);
      case 'ECMWF':
        return this.fetchECMWF(lat, lng, time);
      case 'OpenWeatherMap':
        return this.fetchOpenWeatherMap(lat, lng, time);
      default:
        return null;
    }
  }

  private createStormGlassService(): StormGlassService | null {
    const apiKey = process.env.EXPO_PUBLIC_STORMGLASS_API_KEY || process.env.STORMGLASS_API_KEY;
    if (!apiKey) {
      console.warn('[WeatherAggregationService] No Storm Glass API key configured');
      return null;
    }

    return new StormGlassService({
      apiKey,
      timeout: 10000,
      retryAttempts: 2,
    });
  }

  private async fetchStormGlass(lat: number, lng: number, time: Date): Promise<WeatherForecast | null> {
    if (!this.stormGlassService) {
      return null;
    }

    try {
      const targetConditions = await this.stormGlassService.getWeatherAtTime({ latitude: lat, longitude: lng }, time);
      if (!targetConditions) {
        return null;
      }

      return this.transformStormGlassForecast(targetConditions);
    } catch (error) {
      console.warn('[WeatherAggregationService] Storm Glass provider failed', error);
      return null;
    }
  }

  private transformStormGlassForecast(weather: AdvancedWeatherConditions): WeatherForecast {
    const confidenceRatio = weather.forecast?.confidence ?? 0.9;
    const confidence: ConfidenceLevel = confidenceRatio >= 0.75
      ? ConfidenceLevel.HIGH
      : confidenceRatio >= 0.5
        ? ConfidenceLevel.MEDIUM
        : ConfidenceLevel.LOW;

    const wind: WindData = {
      speed: weather.wind?.speed ?? 0,
      direction: weather.wind?.direction ?? 0,
      gust: weather.wind?.gusts ?? undefined,
    };

    const tide: TideData | undefined = weather.tide
      ? {
          height: weather.tide.height ?? 0,
          current_speed: weather.tide.speed ?? undefined,
          current_direction: typeof weather.tide.direction === 'number' ? weather.tide.direction : undefined,
          state: this.mapTideState(weather.tide.direction),
        }
      : undefined;

    const wave: WaveData | undefined = weather.waves
      ? {
          height: weather.waves.height ?? 0,
          period: weather.waves.period ?? 0,
          direction: weather.waves.direction ?? 0,
          swell_height: weather.waves.swellHeight,
          swell_direction: weather.waves.swellDirection,
        }
      : undefined;

    return {
      time: (weather.timestamp ?? new Date()).toISOString(),
      wind,
      tide,
      wave,
      temperature: weather.temperature ?? weather.temperatureProfile?.air,
      pressure: weather.pressure?.sealevel,
      cloud_cover: weather.cloudCover ?? weather.cloudLayerProfile?.total,
      confidence,
      provider: 'StormGlass',
    };
  }

  private mapTideState(direction: unknown): TideState {
    if (typeof direction === 'string') {
      const normalized = direction.toLowerCase();
      if (normalized.includes('flood')) return TideState.FLOOD;
      if (normalized.includes('ebb')) return TideState.EBB;
      if (normalized.includes('high')) return TideState.HIGH;
      if (normalized.includes('low')) return TideState.LOW;
      if (normalized.includes('slack')) return TideState.SLACK;
    }
    return TideState.UNKNOWN;
  }

  /**
   * Hong Kong Observatory API
   */
  private async fetchHKO(lat: number, lng: number, time: Date): Promise<WeatherForecast | null> {
    try {
      const { HKOWeatherProvider } = await import('./weather/HKOWeatherProvider');
      const hkoProvider = new HKOWeatherProvider();

      // Fetch forecast and tide data
      const forecast = await hkoProvider.getForecast(lat, lng, time);

      if (!forecast) {
        return null;
      }

      // Add tide data if not present
      if (!forecast.tide) {
        const tideData = await hkoProvider.getTideData(lat, lng, time);
        if (tideData) {
          forecast.tide = tideData;
        }
      }

      return forecast;
    } catch (error) {
      console.error('HKO API error:', error);
      return null;
    }
  }

  /**
   * NOAA API
   */
  private async fetchNOAA(lat: number, lng: number, time: Date): Promise<WeatherForecast | null> {
    try {
      // NOAA API requires grid coordinates first
      const pointResponse = await fetch(`https://api.weather.gov/points/${lat},${lng}`);
      const pointData = await pointResponse.json();

      if (!pointData.properties?.forecast) {
        return null;
      }

      // Get forecast
      const forecastResponse = await fetch(pointData.properties.forecast);
      const forecastData = await forecastResponse.json();

      // Find closest forecast period
      const period = forecastData.properties?.periods?.[0];
      if (!period) {
        return null;
      }

      const forecast: WeatherForecast = {
        time: time.toISOString(),
        wind: {
          speed: this.parseNOAAWindSpeed(period.windSpeed),
          direction: this.parseNOAAWindDirection(period.windDirection),
          gust: undefined
        },
        temperature: period.temperature,
        confidence: ConfidenceLevel.HIGH,
        provider: 'NOAA'
      };

      return forecast;
    } catch (error) {
      console.error('NOAA API error:', error);
      return null;
    }
  }

  private parseNOAAWindSpeed(speed: string | null | undefined): number {
    if (!speed) return 0;
    const match = speed.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  }

  private parseNOAAWindDirection(direction: string | null | undefined): number {
    if (!direction) return 0;
    const compassMap: Record<string, number> = {
      N: 0,
      NE: 45,
      E: 90,
      SE: 135,
      S: 180,
      SW: 225,
      W: 270,
      NW: 315
    };

    const trimmed = direction.trim().toUpperCase();
    if (compassMap[trimmed] !== undefined) {
      return compassMap[trimmed];
    }

    const match = trimmed.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  }

  /**
   * ECMWF API (placeholder - requires subscription)
   */
  private async fetchECMWF(lat: number, lng: number, time: Date): Promise<WeatherForecast | null> {
    // TODO: Implement ECMWF API when subscription is available
    console.warn('ECMWF API not yet implemented');
    return null;
  }

  /**
   * OpenWeatherMap API (global fallback)
   */
  private async fetchOpenWeatherMap(lat: number, lng: number, time: Date): Promise<WeatherForecast | null> {
    try {
      const { OpenWeatherMapProvider } = await import('./weather/OpenWeatherMapProvider');
      const owmProvider = new OpenWeatherMapProvider();

      const forecast = await owmProvider.getForecast(lat, lng, time);
      return forecast;
    } catch (error) {
      console.error('OpenWeatherMap API error:', error);
      return null;
    }
  }

  /**
   * Cache forecast in database
   */
  private async cacheForecast(venue_id: string, forecast: WeatherForecast): Promise<void> {
    try {
      await supabase.from('environmental_forecasts').insert({
        venue_id,
        forecast_time: forecast.time,
        wind_speed: forecast.wind.speed,
        wind_direction: forecast.wind.direction,
        wind_gust: forecast.wind.gust,
        temperature: forecast.temperature,
        pressure: forecast.pressure,
        cloud_cover: forecast.cloud_cover,
        wave_height: forecast.wave?.height,
        wave_direction: forecast.wave?.direction,
        wave_period: forecast.wave?.period,
        tide_height: forecast.tide?.height,
        tidal_current_speed: forecast.tide?.current_speed,
        tidal_current_direction: forecast.tide?.current_direction,
        tide_state: forecast.tide?.state,
        provider: forecast.provider,
        forecast_issued_at: new Date().toISOString(),
        confidence_level: forecast.confidence
      });
    } catch (error) {
      console.warn('Failed to cache forecast:', error);
    }
  }

  /**
   * Get cached forecast
   */
  private async getCachedForecast(venue_id: string, time: string): Promise<WeatherForecast | null> {
    try {
      const targetTime = new Date(time);
      const hourBefore = new Date(targetTime.getTime() - 3600000);
      const hourAfter = new Date(targetTime.getTime() + 3600000);

      const { data, error } = await supabase
        .from('environmental_forecasts')
        .select('*')
        .eq('venue_id', venue_id)
        .gte('forecast_time', hourBefore.toISOString())
        .lte('forecast_time', hourAfter.toISOString())
        .order('forecast_time', { ascending: true })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        time: data.forecast_time,
        wind: {
          speed: data.wind_speed,
          direction: data.wind_direction,
          gust: data.wind_gust || undefined
        },
        tide: data.tide_height ? {
          height: data.tide_height,
          current_speed: data.tidal_current_speed || undefined,
          current_direction: data.tidal_current_direction || undefined,
          state: data.tide_state as TideState
        } : undefined,
        wave: data.wave_height ? {
          height: data.wave_height,
          direction: data.wave_direction || 0,
          period: data.wave_period || 0
        } : undefined,
        temperature: data.temperature || undefined,
        pressure: data.pressure || undefined,
        cloud_cover: data.cloud_cover || undefined,
        confidence: data.confidence_level as ConfidenceLevel || ConfidenceLevel.MEDIUM,
        provider: data.provider
      };
    } catch (error) {
      console.error('Error fetching cached forecast:', error);
      return null;
    }
  }

  /**
   * Convert forecast to snapshot
   */
  private forecastToSnapshot(forecast: WeatherForecast): EnvironmentalSnapshot {
    return {
      wind: forecast.wind,
      tide: forecast.tide || {
        height: 0,
        state: TideState.SLACK
      },
      wave: forecast.wave,
      temperature: forecast.temperature,
      pressure: forecast.pressure,
      timestamp: forecast.time
    };
  }

  /**
   * Generate weather summary string
   */
  private generateWeatherSummary(current: EnvironmentalSnapshot, forecast: WeatherForecast[]): string {
    const windRange = this.getWindRange(forecast);
    const windDir = this.getWindDirection(current.wind.direction);
    const tideState = current.tide.state;

    let summary = `${windRange.min}-${windRange.max}kt ${windDir}`;

    if (windRange.increasing) {
      summary += ', building throughout race';
    } else if (windRange.decreasing) {
      summary += ', decreasing';
    }

    if (tideState) {
      summary += `. ${tideState.charAt(0).toUpperCase() + tideState.slice(1)} tide`;
    }

    return summary;
  }

  /**
   * Detect tactical alerts
   */
  private detectTacticalAlerts(current: EnvironmentalSnapshot, forecast: WeatherForecast[]): any[] {
    const alerts: any[] = [];

    // Wind shift detection
    const windShift = this.detectWindShift(forecast);
    if (windShift) {
      alerts.push({
        type: 'wind_shift',
        severity: windShift.magnitude > 20 ? 'warning' : 'info',
        title: 'Wind Shift Expected',
        message: `Wind expected to shift ${windShift.direction} by ${windShift.magnitude}° during race`,
        timestamp: windShift.time
      });
    }

    // Wind increase/decrease
    const windChange = this.detectWindChange(forecast);
    if (windChange && Math.abs(windChange.change) > 5) {
      alerts.push({
        type: 'wind_change',
        severity: Math.abs(windChange.change) > 10 ? 'warning' : 'info',
        title: windChange.change > 0 ? 'Wind Building' : 'Wind Decreasing',
        message: `Wind expected to ${windChange.change > 0 ? 'increase' : 'decrease'} by ${Math.abs(windChange.change)}kt`,
        timestamp: windChange.time
      });
    }

    // Tide change
    if (current.tide.state === TideState.FLOOD || current.tide.state === TideState.EBB) {
      alerts.push({
        type: 'tide_change',
        severity: 'info',
        title: `${current.tide.state === TideState.FLOOD ? 'Flood' : 'Ebb'} Tide`,
        message: `Strong ${current.tide.state} tide expected during race. ${current.tide.current_speed}kt current.`,
        timestamp: current.timestamp
      });
    }

    return alerts;
  }

  /**
   * Helper: Select weather providers for region
   */
  private selectProvidersForRegion(region: string): string[] {
    return REGIONAL_PROVIDERS[region as keyof typeof REGIONAL_PROVIDERS] || ['ECMWF'];
  }

  /**
   * Helper: Get wind range from forecast
   */
  private getWindRange(forecast: WeatherForecast[]): { min: number; max: number; increasing: boolean; decreasing: boolean } {
    const speeds = forecast.map(f => f.wind.speed);
    const min = Math.round(Math.min(...speeds));
    const max = Math.round(Math.max(...speeds));

    const first = speeds[0];
    const last = speeds[speeds.length - 1];
    const increasing = last > first + 2;
    const decreasing = last < first - 2;

    return { min, max, increasing, decreasing };
  }

  /**
   * Helper: Convert degrees to cardinal direction
   */
  private getWindDirection(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  /**
   * Helper: Detect wind shift
   */
  private detectWindShift(forecast: WeatherForecast[]): { magnitude: number; direction: string; time: string } | null {
    if (forecast.length < 2) return null;

    const first = forecast[0].wind.direction;
    const last = forecast[forecast.length - 1].wind.direction;

    let diff = last - first;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    if (Math.abs(diff) > 15) {
      return {
        magnitude: Math.abs(diff),
        direction: diff > 0 ? 'right' : 'left',
        time: forecast[forecast.length - 1].time
      };
    }

    return null;
  }

  /**
   * Helper: Detect wind speed change
   */
  private detectWindChange(forecast: WeatherForecast[]): { change: number; time: string } | null {
    if (forecast.length < 2) return null;

    const first = forecast[0].wind.speed;
    const last = forecast[forecast.length - 1].wind.speed;
    const change = last - first;

    if (Math.abs(change) > 3) {
      return {
        change,
        time: forecast[forecast.length - 1].time
      };
    }

    return null;
  }

}

export default WeatherAggregationService;

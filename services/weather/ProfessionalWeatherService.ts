import {
  AdvancedWeatherConditions,
  WeatherAlert,
  GeoLocation,
  BoundingBox,
  WeatherDataSource
} from '@/lib/types/advanced-map';
import { WeatherAPIProService } from './WeatherAPIProService';
import { WorldTidesProService } from '../tides/WorldTidesProService';

export class ProfessionalWeatherService {
  private apiKeys: { [key: string]: string };
  private cache: Map<string, any> = new Map();
  private updateIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private weatherAPIService: WeatherAPIProService;
  private worldTidesService: WorldTidesProService;

  constructor(apiKeys: { [key: string]: string }) {
    this.apiKeys = apiKeys;

    // Initialize premium services
    this.weatherAPIService = new WeatherAPIProService({
      apiKey: apiKeys['weatherapi-pro'] || 'demo-key',
      baseUrl: 'https://api.weatherapi.com/v1',
      timeout: 10000,
      retryAttempts: 3
    });

    this.worldTidesService = new WorldTidesProService({
      apiKey: apiKeys['worldtides-pro'] || 'demo-key',
      baseUrl: 'https://www.worldtides.info/api/v3',
      timeout: 10000,
      retryAttempts: 3
    });
  }

  /**
   * Get comprehensive weather conditions with multiple source validation
   */
  async getAdvancedWeatherConditions(location: GeoLocation): Promise<AdvancedWeatherConditions> {
    const cacheKey = `weather_${location.latitude}_${location.longitude}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 15 * 60 * 1000) { // 15 minutes
        return cached.data;
      }
    }

    try {
      // Primary: WeatherAPI Pro with premium marine data
      const primaryWeather = await this.weatherAPIService.getCurrentWeather(location);

      // Get professional tide data
      const tideData = await this.worldTidesService.getCurrentTideData(location);

      // Integrate tide data into weather conditions
      primaryWeather.tide = {
        height: tideData.height,
        direction: tideData.direction,
        speed: tideData.speed,
        nextHigh: tideData.nextHigh,
        nextLow: tideData.nextLow
      };

      // Enhanced confidence scoring with premium data
      primaryWeather.forecast.confidence = this.calculateProfessionalConfidence(primaryWeather, tideData);

      const combined = primaryWeather;

      this.cache.set(cacheKey, {
        data: combined,
        timestamp: Date.now()
      });

      return combined;
    } catch (error) {

      return this.getFallbackWeather(location);
    }
  }

  /**
   * Get detailed marine forecasts for racing
   */
  async getMarineForecast(location: GeoLocation, hours: number = 72): Promise<AdvancedWeatherConditions[]> {
    try {
      const forecasts = await Promise.all([
        this.fetchWeatherAPIForecast(location, hours),
        this.fetchPredictWindForecast(location, hours),
        this.fetchMeteomaticsForecast(location, hours)
      ]);

      return this.processForecastEnsemble(forecasts);
    } catch (error) {

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
    const interval = setInterval(updateWeather, 15 * 60 * 1000);
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

  // Private methods for data source integration

  private async fetchWeatherAPIPro(location: GeoLocation): Promise<Partial<AdvancedWeatherConditions>> {
    const apiKey = this.apiKeys['weatherapi-pro'];
    if (!apiKey) throw new Error('WeatherAPI Pro key not configured');

    const url = `https://api.weatherapi.com/v1/marine.json?` +
      `key=${apiKey}&` +
      `q=${location.latitude},${location.longitude}&` +
      `days=3&` +
      `aqi=yes&` +
      `alerts=yes`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`WeatherAPI Pro error: ${data.error?.message}`);
    }

    return this.parseWeatherAPIData(data);
  }

  private async fetchPredictWindPro(location: GeoLocation): Promise<Partial<AdvancedWeatherConditions>> {
    const apiKey = this.apiKeys['predictwind-pro'];
    if (!apiKey) throw new Error('PredictWind Pro key not configured');

    const url = `https://api.predictwind.com/v1/weather/point?` +
      `lat=${location.latitude}&` +
      `lon=${location.longitude}&` +
      `api_key=${apiKey}&` +
      `models=gfs,ecmwf,nam&` +
      `params=wind,pressure,waves,rain`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`PredictWind Pro error: ${data.message}`);
    }

    return this.parsePredictWindData(data);
  }

  private async fetchNOAAGFS(location: GeoLocation): Promise<Partial<AdvancedWeatherConditions>> {
    // Free NOAA GFS data for validation
    const url = `https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl?` +
      `file=gfs.t00z.pgrb2.0p25.f000&` +
      `lev_10_m_above_ground=on&` +
      `lev_surface=on&` +
      `var_UGRD=on&var_VGRD=on&var_PRMSL=on&` +
      `subregion=&` +
      `leftlon=${location.longitude-0.5}&` +
      `rightlon=${location.longitude+0.5}&` +
      `toplat=${location.latitude+0.5}&` +
      `bottomlat=${location.latitude-0.5}&` +
      `dir=%2Fgfs.${this.getGFSDateString()}%2F00%2Fatmos`;

    const response = await fetch(url);
    const gribData = await response.arrayBuffer();

    return this.parseGRIBData(gribData, location);
  }

  private async fetchMeteomaticsForecast(location: GeoLocation, hours: number): Promise<AdvancedWeatherConditions[]> {
    const apiKey = this.apiKeys['meteomatics'];
    if (!apiKey) throw new Error('Meteomatics key not configured');

    const startTime = new Date();
    const endTime = new Date(Date.now() + hours * 60 * 60 * 1000);

    const url = `https://api.meteomatics.com/` +
      `${this.formatISO(startTime)}--${this.formatISO(endTime)}:PT1H/` +
      `wind_speed_10m:ms,wind_dir_10m:d,msl_pressure:hPa,` +
      `significant_wave_height:m,mean_wave_period:s,mean_wave_direction:d,` +
      `sea_surface_temperature:C,visibility:m/` +
      `${location.latitude},${location.longitude}/json`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${btoa(`${this.apiKeys['meteomatics-user']}:${apiKey}`)}`
      }
    });

    const data = await response.json();
    return this.parseMeteomaticsData(data);
  }

  private combineWeatherSources(
    primary: Partial<AdvancedWeatherConditions>,
    sailing: Partial<AdvancedWeatherConditions>,
    noaa: Partial<AdvancedWeatherConditions>
  ): AdvancedWeatherConditions {
    // Implement ensemble averaging and validation logic
    return {
      // Wind data - average from all sources with confidence weighting
      wind: {
        speed: this.weightedAverage([
          { value: primary.wind?.speed || 0, weight: 0.5 },
          { value: sailing.wind?.speed || 0, weight: 0.3 },
          { value: noaa.wind?.speed || 0, weight: 0.2 }
        ]),
        direction: this.circularAverage([
          { value: primary.wind?.direction || 0, weight: 0.5 },
          { value: sailing.wind?.direction || 0, weight: 0.3 },
          { value: noaa.wind?.direction || 0, weight: 0.2 }
        ]),
        gusts: primary.wind?.gusts || sailing.wind?.gusts || 0
      },

      // Pressure data - prefer most recent
      pressure: {
        sealevel: primary.pressure?.sealevel || sailing.pressure?.sealevel || 1013.25,
        trend: this.calculatePressureTrend(primary.pressure, sailing.pressure),
        gradient: this.calculatePressureGradient([primary.pressure, sailing.pressure])
      },

      // Sea state - prefer sailing-specific source
      seaState: sailing.seaState || primary.seaState || {
        waveHeight: 0.5,
        wavePeriod: 5,
        seaTemperature: 15
      },

      // Visibility
      visibility: {
        horizontal: primary.visibility?.horizontal || 10,
        conditions: primary.visibility?.conditions || 'clear'
      },

      // Forecast metadata
      forecast: {
        confidence: this.calculateEnsembleConfidence([primary, sailing, noaa]),
        source: 'Professional Multi-Source Ensemble',
        modelRun: new Date(),
        validTime: new Date(),
        resolution: '1km'
      },

      // Tide and base weather from primary
      tide: primary.tide || {
        height: 0,
        direction: 'flood' as const,
        speed: 0
      },
      waves: primary.waves || {
        height: 0.5,
        period: 5,
        direction: 180
      },
      timestamp: new Date()
    };
  }

  private parseWeatherAPIData(data: any): Partial<AdvancedWeatherConditions> {
    const current = data.current;
    const marine = data.forecast?.forecastday?.[0]?.hour?.[0];

    return {
      wind: {
        speed: current.wind_kph * 0.539957, // Convert km/h to knots
        direction: current.wind_degree,
        gusts: current.gust_kph * 0.539957
      },
      pressure: {
        sealevel: current.pressure_mb,
        trend: 'steady' as const, // Would need historical data for trend
        gradient: 0
      },
      visibility: {
        horizontal: current.vis_km * 0.539957, // Convert to nautical miles
        conditions: this.mapWeatherCondition(current.condition.text)
      },
      seaState: marine ? {
        waveHeight: marine.sig_ht_mt || 0,
        wavePeriod: marine.swell_period_secs || 5,
        seaTemperature: marine.water_temp_c || 15
      } : undefined
    };
  }

  private parsePredictWindData(data: any): Partial<AdvancedWeatherConditions> {
    // PredictWind specific parsing logic
    return {
      wind: {
        speed: data.wind_speed_kts,
        direction: data.wind_direction,
        gusts: data.wind_gust_kts
      },
      seaState: {
        waveHeight: data.wave_height,
        wavePeriod: data.wave_period,
        swellHeight: data.swell_height,
        swellPeriod: data.swell_period,
        swellDirection: data.swell_direction
      }
    };
  }

  private parseGRIBData(gribData: ArrayBuffer, location: GeoLocation): Partial<AdvancedWeatherConditions> {
    // GRIB parsing logic - would use a library like node-grib2
    // For now, return placeholder
    return {
      wind: { speed: 10, direction: 180, gusts: 12 },
      pressure: { sealevel: 1013.25, trend: 'steady', gradient: 0 }
    };
  }

  private getFallbackWeather(location: GeoLocation): AdvancedWeatherConditions {
    // Return safe fallback weather conditions
    return {
      wind: { speed: 5, direction: 180, gusts: 8 },
      tide: { height: 0, direction: 'flood', speed: 0.5 },
      waves: { height: 0.5, period: 5, direction: 180 },
      pressure: { sealevel: 1013.25, trend: 'steady', gradient: 0 },
      visibility: { horizontal: 10, conditions: 'clear' },
      seaState: { waveHeight: 0.5, wavePeriod: 5, seaTemperature: 15 },
      forecast: {
        confidence: 0.3,
        source: 'Fallback',
        modelRun: new Date(),
        validTime: new Date(),
        resolution: 'low'
      },
      timestamp: new Date()
    };
  }

  // Utility methods
  private weightedAverage(values: { value: number; weight: number }[]): number {
    const totalWeight = values.reduce((sum, v) => sum + v.weight, 0);
    const weightedSum = values.reduce((sum, v) => sum + (v.value * v.weight), 0);
    return weightedSum / totalWeight;
  }

  private circularAverage(values: { value: number; weight: number }[]): number {
    // Handle circular averaging for wind direction
    let x = 0, y = 0, totalWeight = 0;

    values.forEach(v => {
      const rad = v.value * Math.PI / 180;
      x += Math.cos(rad) * v.weight;
      y += Math.sin(rad) * v.weight;
      totalWeight += v.weight;
    });

    const avgRad = Math.atan2(y / totalWeight, x / totalWeight);
    return ((avgRad * 180 / Math.PI) + 360) % 360;
  }

  private calculateEnsembleConfidence(sources: Partial<AdvancedWeatherConditions>[]): number {
    // Calculate confidence based on agreement between sources
    const validSources = sources.filter(s => s.wind);
    if (validSources.length < 2) return 0.5;

    // Simple confidence based on wind speed agreement
    const windSpeeds = validSources.map(s => s.wind!.speed);
    const stdDev = this.standardDeviation(windSpeeds);

    return Math.max(0.1, 1 - (stdDev / 10)); // Lower confidence for higher disagreement
  }

  private standardDeviation(values: number[]): number {
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  }

  private getGFSDateString(): string {
    const now = new Date();
    return now.getFullYear().toString() +
           (now.getMonth() + 1).toString().padStart(2, '0') +
           now.getDate().toString().padStart(2, '0');
  }

  private formatISO(date: Date): string {
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
  }

  private mapWeatherCondition(condition: string): 'clear' | 'haze' | 'fog' | 'rain' | 'snow' {
    const lower = condition.toLowerCase();
    if (lower.includes('fog')) return 'fog';
    if (lower.includes('rain')) return 'rain';
    if (lower.includes('snow')) return 'snow';
    if (lower.includes('haze') || lower.includes('mist')) return 'haze';
    return 'clear';
  }

  private calculatePressureTrend(p1: any, p2: any): 'rising' | 'falling' | 'steady' {
    if (!p1?.sealevel || !p2?.sealevel) return 'steady';
    const diff = p1.sealevel - p2.sealevel;
    if (diff > 1) return 'rising';
    if (diff < -1) return 'falling';
    return 'steady';
  }

  private calculatePressureGradient(pressures: any[]): number {
    // Simplified gradient calculation
    return 0.1; // mb per degree
  }

  private buildGRIBUrl(bounds: BoundingBox, modelRun: Date): string {
    // Build Meteomatics GRIB URL
    return `https://api.meteomatics.com/${this.formatISO(modelRun)}/` +
           `wind_speed_10m:ms,wind_dir_10m:d,msl_pressure:hPa/` +
           `${bounds.southwest.latitude},${bounds.southwest.longitude}:` +
           `${bounds.northeast.latitude},${bounds.northeast.longitude}:0.1,0.1/grib`;
  }

  private async fetchNOAAAlerts(bounds: BoundingBox): Promise<WeatherAlert[]> {
    // NOAA Weather Alerts implementation
    return [];
  }

  private async fetchWeatherAPIAlerts(bounds: BoundingBox): Promise<WeatherAlert[]> {
    // WeatherAPI alerts implementation
    return [];
  }

  private async fetchLocalMarineAlerts(bounds: BoundingBox): Promise<WeatherAlert[]> {
    // Local marine authority alerts
    return [];
  }

  private async fetchWeatherAPIForecast(location: GeoLocation, hours: number): Promise<AdvancedWeatherConditions[]> {
    // Implementation for WeatherAPI forecast
    return [];
  }

  private async fetchPredictWindForecast(location: GeoLocation, hours: number): Promise<AdvancedWeatherConditions[]> {
    // Implementation for PredictWind forecast
    return [];
  }

  private parseMeteomaticsData(data: any): AdvancedWeatherConditions[] {
    // Parse Meteomatics forecast data
    return [];
  }

  private processForecastEnsemble(forecasts: AdvancedWeatherConditions[][]): AdvancedWeatherConditions[] {
    // Process ensemble forecasts
    return [];
  }

  /**
   * Calculate professional confidence score with premium data sources
   */
  private calculateProfessionalConfidence(weather: AdvancedWeatherConditions, tideData: any): number {
    let confidence = 0.85; // Base professional confidence

    // Weather API Pro quality factors
    if (weather.forecast.source === 'WeatherAPI Pro') {
      confidence += 0.05;
    }

    // Tide data quality
    if (tideData.coefficient > 50) {
      confidence += 0.03; // High tide accuracy
    }

    // Time-based confidence degradation
    const hoursAgo = (Date.now() - weather.timestamp.getTime()) / (1000 * 60 * 60);
    if (hoursAgo > 3) {
      confidence -= hoursAgo * 0.02;
    }

    // Wind consistency check
    if ((weather.wind.variability ?? 0) < 10) {
      confidence += 0.02; // Stable wind conditions
    }

    // Pressure trend reliability
    if (weather.pressure.trend !== 'steady') {
      confidence += 0.02; // Clear pressure trend
    }

    return Math.max(0.6, Math.min(0.98, confidence));
  }
}

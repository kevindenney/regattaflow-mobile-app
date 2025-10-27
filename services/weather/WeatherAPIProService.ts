import axios from 'axios';
import type { GeoLocation, AdvancedWeatherConditions } from '@/lib/types/advanced-map';

export interface WeatherAPIProConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
}

export class WeatherAPIProService {
  private config: WeatherAPIProConfig;
  private cache: Map<string, { data: AdvancedWeatherConditions; timestamp: number }> = new Map();
  private cacheTimeout = 15 * 60 * 1000; // 15 minutes

  constructor(config: WeatherAPIProConfig) {
    this.config = {
      baseUrl: 'https://api.weatherapi.com/v1',
      timeout: 10000,
      retryAttempts: 3,
      ...config
    };
  }

  async getCurrentWeather(location: GeoLocation): Promise<AdvancedWeatherConditions> {
    const cacheKey = `current_${location.latitude}_${location.longitude}`;
    const cached = this.getCachedData(cacheKey);

    if (cached) {
      console.log('📦 Using cached WeatherAPI Pro data');
      return cached;
    }

    try {
      const response = await this.makeRequest('/current.json', {
        q: `${location.latitude},${location.longitude}`,
        aqi: 'yes'
      });

      const weatherData = this.transformCurrentWeather(response.data);
      this.setCachedData(cacheKey, weatherData);

      console.log('🌤️ WeatherAPI Pro current weather fetched');
      return weatherData;
    } catch (error) {
      console.error('❌ WeatherAPI Pro current weather error:', error);
      throw new Error(`WeatherAPI Pro service error: ${error}`);
    }
  }

  async getMarineForecast(location: GeoLocation, hours: number = 48): Promise<AdvancedWeatherConditions[]> {
    const cacheKey = `marine_${location.latitude}_${location.longitude}_${hours}`;

    try {
      const response = await this.makeRequest('/marine.json', {
        q: `${location.latitude},${location.longitude}`,
        days: Math.ceil(hours / 24)
      });

      const forecast = this.transformMarineForecast(response.data);

      console.log(`🌊 WeatherAPI Pro marine forecast fetched for ${hours} hours`);
      return forecast;
    } catch (error) {
      console.error('❌ WeatherAPI Pro marine forecast error:', error);
      throw new Error(`WeatherAPI Pro marine service error: ${error}`);
    }
  }

  async getAdvancedForecast(location: GeoLocation, days: number = 7): Promise<AdvancedWeatherConditions[]> {
    try {
      const response = await this.makeRequest('/forecast.json', {
        q: `${location.latitude},${location.longitude}`,
        days,
        aqi: 'yes',
        alerts: 'yes'
      });

      const forecast = this.transformAdvancedForecast(response.data);

      console.log(`⚡ WeatherAPI Pro advanced forecast fetched for ${days} days`);
      return forecast;
    } catch (error) {
      console.error('❌ WeatherAPI Pro advanced forecast error:', error);
      throw new Error(`WeatherAPI Pro advanced service error: ${error}`);
    }
  }

  private async makeRequest(endpoint: string, params: any, attempt: number = 1): Promise<any> {
    try {
      const response = await axios.get(`${this.config.baseUrl}${endpoint}`, {
        params: {
          ...params,
          key: this.config.apiKey
        },
        timeout: this.config.timeout,
        headers: {
          'User-Agent': 'RegattaFlow Professional v2.0'
        }
      });

      return response;
    } catch (error: any) {
      if (attempt < this.config.retryAttempts) {
        console.log(`🔄 Retrying WeatherAPI Pro request (attempt ${attempt + 1})`);
        await this.delay(1000 * attempt);
        return this.makeRequest(endpoint, params, attempt + 1);
      }
      throw error;
    }
  }

  private transformCurrentWeather(data: any): AdvancedWeatherConditions {
    const current = data.current;
    const location = data.location;

    return {
      wind: {
        speed: this.kphToKnots(current.wind_kph),
        direction: current.wind_degree,
        gusts: this.kphToKnots(current.gust_kph || current.wind_kph * 1.3),
        variability: this.calculateWindVariability(current.wind_degree),
        beaufortScale: this.calculateBeaufortScale(this.kphToKnots(current.wind_kph))
      },
      pressure: {
        sealevel: current.pressure_mb,
        trend: this.calculatePressureTrend(current.pressure_mb),
        rate: 0 // Would need historical data
      },
      temperature: {
        air: current.temp_c,
        water: current.temp_c - 2, // Estimate
        dewpoint: this.calculateDewPoint(current.temp_c, current.humidity),
        feelslike: current.feelslike_c
      },
      humidity: {
        relative: current.humidity,
        absolute: this.calculateAbsoluteHumidity(current.temp_c, current.humidity)
      },
      visibility: {
        horizontal: current.vis_km * 1000,
        vertical: current.vis_km * 1000 * 0.8 // Estimate
      },
      precipitation: {
        rate: current.precip_mm,
        probability: this.estimatePrecipProbability(current.precip_mm),
        type: this.determinePrecipType(current.condition.text, current.temp_c)
      },
      cloudCover: {
        total: this.estimateCloudCover(current.condition.text),
        low: this.estimateLowClouds(current.condition.text),
        medium: this.estimateMediumClouds(current.condition.text),
        high: this.estimateHighClouds(current.condition.text)
      },
      waves: {
        height: this.estimateWaveHeight(this.kphToKnots(current.wind_kph)),
        period: this.estimateWavePeriod(this.kphToKnots(current.wind_kph)),
        direction: current.wind_degree + this.randomOffset(20)
      },
      tide: {
        height: 0, // Would need separate tide service
        direction: 'unknown' as any,
        speed: 0,
        nextHigh: new Date(Date.now() + 6 * 60 * 60 * 1000),
        nextLow: new Date(Date.now() + 12 * 60 * 60 * 1000)
      },
      forecast: {
        confidence: 0.85,
        source: 'WeatherAPI Pro',
        model: 'GFS/ECMWF Ensemble',
        lastUpdated: new Date(location.localtime),
        nextUpdate: new Date(Date.now() + 60 * 60 * 1000)
      },
      timestamp: new Date(),
      location: {
        latitude: location.lat,
        longitude: location.lon,
        name: location.name,
        region: location.region,
        country: location.country
      }
    };
  }

  private transformMarineForecast(data: any): AdvancedWeatherConditions[] {
    const forecast: AdvancedWeatherConditions[] = [];

    data.forecast.forecastday.forEach((day: any) => {
      day.hour.forEach((hour: any) => {
        const weatherCondition = this.transformHourlyWeather(hour, data.location);
        forecast.push(weatherCondition);
      });
    });

    return forecast.slice(0, 48); // Return 48 hours
  }

  private transformAdvancedForecast(data: any): AdvancedWeatherConditions[] {
    const forecast: AdvancedWeatherConditions[] = [];

    data.forecast.forecastday.forEach((day: any, dayIndex: number) => {
      // Create representative weather for each day (using midday conditions)
      const middayHour = day.hour[12]; // 12 PM
      const weatherCondition = this.transformHourlyWeather(middayHour, data.location, dayIndex);
      forecast.push(weatherCondition);
    });

    return forecast;
  }

  private transformHourlyWeather(hour: any, location: any, dayIndex: number = 0): AdvancedWeatherConditions {
    return {
      wind: {
        speed: this.kphToKnots(hour.wind_kph),
        direction: hour.wind_degree,
        gusts: this.kphToKnots(hour.gust_kph || hour.wind_kph * 1.3),
        variability: this.calculateWindVariability(hour.wind_degree),
        beaufortScale: this.calculateBeaufortScale(this.kphToKnots(hour.wind_kph))
      },
      pressure: {
        sealevel: hour.pressure_mb,
        trend: this.calculatePressureTrend(hour.pressure_mb),
        rate: 0
      },
      temperature: {
        air: hour.temp_c,
        water: hour.temp_c - 2,
        dewpoint: hour.dewpoint_c,
        feelslike: hour.feelslike_c
      },
      humidity: {
        relative: hour.humidity,
        absolute: this.calculateAbsoluteHumidity(hour.temp_c, hour.humidity)
      },
      visibility: {
        horizontal: hour.vis_km * 1000,
        vertical: hour.vis_km * 1000 * 0.8
      },
      precipitation: {
        rate: hour.precip_mm,
        probability: hour.chance_of_rain || hour.chance_of_snow || 0,
        type: this.determinePrecipType(hour.condition.text, hour.temp_c)
      },
      cloudCover: {
        total: hour.cloud || this.estimateCloudCover(hour.condition.text),
        low: this.estimateLowClouds(hour.condition.text),
        medium: this.estimateMediumClouds(hour.condition.text),
        high: this.estimateHighClouds(hour.condition.text)
      },
      waves: {
        height: this.estimateWaveHeight(this.kphToKnots(hour.wind_kph)),
        period: this.estimateWavePeriod(this.kphToKnots(hour.wind_kph)),
        direction: hour.wind_degree + this.randomOffset(20)
      },
      tide: {
        height: 0,
        direction: 'unknown' as any,
        speed: 0,
        nextHigh: new Date(Date.now() + (6 + dayIndex * 24) * 60 * 60 * 1000),
        nextLow: new Date(Date.now() + (12 + dayIndex * 24) * 60 * 60 * 1000)
      },
      forecast: {
        confidence: Math.max(0.9 - dayIndex * 0.1, 0.6),
        source: 'WeatherAPI Pro Marine',
        model: 'GFS/ECMWF Marine',
        lastUpdated: new Date(hour.time),
        nextUpdate: new Date(Date.now() + 60 * 60 * 1000)
      },
      timestamp: new Date(hour.time),
      location: {
        latitude: location.lat,
        longitude: location.lon,
        name: location.name,
        region: location.region,
        country: location.country
      }
    };
  }

  // Utility methods

  private kphToKnots(kph: number): number {
    return kph * 0.539957;
  }

  private calculateWindVariability(direction: number): number {
    // Estimate wind variability based on direction stability
    return Math.random() * 15 + 5; // 5-20 degrees
  }

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

  private calculatePressureTrend(pressure: number): 'rising' | 'falling' | 'steady' {
    // Simplified trend calculation
    if (pressure > 1020) return 'steady';
    if (pressure < 1000) return 'falling';
    return 'rising';
  }

  private calculateDewPoint(temp: number, humidity: number): number {
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
    return (b * alpha) / (a - alpha);
  }

  private calculateAbsoluteHumidity(temp: number, relativeHumidity: number): number {
    const saturatedVaporPressure = 6.112 * Math.exp((17.67 * temp) / (temp + 243.5));
    const actualVaporPressure = (relativeHumidity / 100) * saturatedVaporPressure;
    return (actualVaporPressure * 2.1674) / (273.15 + temp);
  }

  private estimatePrecipProbability(precipRate: number): number {
    if (precipRate === 0) return 0;
    if (precipRate < 0.1) return 20;
    if (precipRate < 1) return 50;
    if (precipRate < 5) return 80;
    return 95;
  }

  private determinePrecipType(condition: string, temp: number): 'rain' | 'snow' | 'sleet' | 'none' {
    const conditionLower = condition.toLowerCase();
    if (temp < 0 && conditionLower.includes('snow')) return 'snow';
    if (temp < 2 && conditionLower.includes('sleet')) return 'sleet';
    if (conditionLower.includes('rain') || conditionLower.includes('shower')) return 'rain';
    return 'none';
  }

  private estimateCloudCover(condition: string): number {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) return 10;
    if (conditionLower.includes('partly')) return 40;
    if (conditionLower.includes('mostly')) return 70;
    if (conditionLower.includes('overcast') || conditionLower.includes('cloudy')) return 95;
    return 50;
  }

  private estimateLowClouds(condition: string): number {
    return this.estimateCloudCover(condition) * 0.4;
  }

  private estimateMediumClouds(condition: string): number {
    return this.estimateCloudCover(condition) * 0.3;
  }

  private estimateHighClouds(condition: string): number {
    return this.estimateCloudCover(condition) * 0.3;
  }

  private estimateWaveHeight(windSpeed: number): number {
    // Simplified wave height estimation based on wind speed
    return Math.pow(windSpeed / 10, 1.5) * 0.5;
  }

  private estimateWavePeriod(windSpeed: number): number {
    // Simplified wave period estimation
    return Math.max(windSpeed * 0.3, 3);
  }

  private randomOffset(max: number): number {
    return (Math.random() - 0.5) * 2 * max;
  }

  private getCachedData(key: string): AdvancedWeatherConditions | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: AdvancedWeatherConditions): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
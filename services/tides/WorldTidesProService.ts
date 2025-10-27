import axios from 'axios';
import type { GeoLocation } from '@/lib/types/advanced-map';

export interface TideData {
  height: number;
  direction: 'flood' | 'ebb' | 'slack';
  speed: number;
  nextHigh: Date;
  nextLow: Date;
  currentPhase: 'rising' | 'falling' | 'high_slack' | 'low_slack';
  range: number;
  coefficient: number;
}

export interface TideExtreme {
  type: 'high' | 'low';
  time: Date;
  height: number;
}

export interface TideStation {
  id: string;
  name: string;
  location: GeoLocation;
  distance: number;
  timezone: string;
}

export interface WorldTidesConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
}

export class WorldTidesProService {
  private config: WorldTidesConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 60 * 60 * 1000; // 1 hour for tide data

  constructor(config: WorldTidesConfig) {
    this.config = {
      baseUrl: 'https://www.worldtides.info/api/v3',
      timeout: 10000,
      retryAttempts: 3,
      ...config
    };
  }

  async getCurrentTideData(location: GeoLocation): Promise<TideData> {
    const cacheKey = `current_${location.latitude}_${location.longitude}`;
    const cached = this.getCachedData(cacheKey);

    if (cached) {
      console.log('📦 Using cached WorldTides Pro data');
      return this.transformTideData(cached);
    }

    try {
      const now = new Date();
      const startTime = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago
      const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours ahead

      const response = await this.makeRequest('/tides', {
        lat: location.latitude,
        lon: location.longitude,
        start: Math.floor(startTime.getTime() / 1000),
        length: Math.floor((endTime.getTime() - startTime.getTime()) / 1000),
        step: 900, // 15-minute intervals
        extremes: true,
        heights: true
      });

      const tideData = this.transformTideData(response.data);
      this.setCachedData(cacheKey, response.data);

      console.log('🌊 WorldTides Pro current tide data fetched');
      return tideData;
    } catch (error) {
      console.error('❌ WorldTides Pro error:', error);
      throw new Error(`WorldTides Pro service error: ${error}`);
    }
  }

  async getTideExtremes(location: GeoLocation, days: number = 7): Promise<TideExtreme[]> {
    const cacheKey = `extremes_${location.latitude}_${location.longitude}_${days}`;

    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      const response = await this.makeRequest('/tides', {
        lat: location.latitude,
        lon: location.longitude,
        start: Math.floor(now.getTime() / 1000),
        length: Math.floor((endTime.getTime() - now.getTime()) / 1000),
        extremes: true
      });

      const extremes = this.transformTideExtremes(response.data);

      console.log(`🌊 WorldTides Pro extremes fetched for ${days} days`);
      return extremes;
    } catch (error) {
      console.error('❌ WorldTides Pro extremes error:', error);
      throw new Error(`WorldTides Pro extremes service error: ${error}`);
    }
  }

  async getNearestTideStation(location: GeoLocation): Promise<TideStation | null> {
    const cacheKey = `station_${location.latitude}_${location.longitude}`;

    try {
      const response = await this.makeRequest('/stations', {
        lat: location.latitude,
        lon: location.longitude,
        max: 1
      });

      if (!response.data.stations || response.data.stations.length === 0) {
        return null;
      }

      const station = response.data.stations[0];
      const tideStation: TideStation = {
        id: station.id,
        name: station.name,
        location: {
          latitude: station.lat,
          longitude: station.lon
        },
        distance: this.calculateDistance(location, { latitude: station.lat, longitude: station.lon }),
        timezone: station.timezone || 'UTC'
      };

      console.log(`🏪 Nearest tide station: ${tideStation.name} (${tideStation.distance.toFixed(1)}km)`);
      return tideStation;
    } catch (error) {
      console.error('❌ WorldTides Pro station error:', error);
      return null;
    }
  }

  async getTideHeightAtTime(location: GeoLocation, targetTime: Date): Promise<number> {
    try {
      const response = await this.makeRequest('/tides', {
        lat: location.latitude,
        lon: location.longitude,
        start: Math.floor(targetTime.getTime() / 1000) - 1800, // 30 minutes before
        length: 3600, // 1 hour total
        step: 300, // 5-minute intervals
        heights: true
      });

      if (response.data.heights && response.data.heights.length > 0) {
        // Find the closest time point
        const targetUnix = Math.floor(targetTime.getTime() / 1000);
        let closestHeight = response.data.heights[0];
        let closestTimeDiff = Math.abs(closestHeight.dt - targetUnix);

        for (const height of response.data.heights) {
          const timeDiff = Math.abs(height.dt - targetUnix);
          if (timeDiff < closestTimeDiff) {
            closestHeight = height;
            closestTimeDiff = timeDiff;
          }
        }

        return closestHeight.height;
      }

      return 0;
    } catch (error) {
      console.error('❌ WorldTides Pro height at time error:', error);
      return 0;
    }
  }

  async getTideCurrents(location: GeoLocation): Promise<{ speed: number; direction: number } | null> {
    try {
      // WorldTides doesn't provide current data directly
      // We'll estimate based on tide rate of change
      const now = new Date();
      const before = new Date(now.getTime() - 15 * 60 * 1000); // 15 minutes ago
      const after = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes ahead

      const [heightBefore, heightAfter] = await Promise.all([
        this.getTideHeightAtTime(location, before),
        this.getTideHeightAtTime(location, after)
      ]);

      const rateOfChange = (heightAfter - heightBefore) / 0.5; // meters per hour
      const speed = Math.abs(rateOfChange) * 0.2; // Rough conversion to knots

      // Estimate direction based on geography (simplified)
      const direction = rateOfChange > 0 ? 90 : 270; // East for flood, West for ebb

      return { speed, direction };
    } catch (error) {
      console.error('❌ Tide current estimation error:', error);
      return null;
    }
  }

  private async makeRequest(endpoint: string, params: any, attempt: number = 1): Promise<any> {
    try {
      const response = await axios.get(`${this.config.baseUrl}${endpoint}`, {
        params: {
          ...params,
          key: this.config.apiKey,
          format: 'json'
        },
        timeout: this.config.timeout,
        headers: {
          'User-Agent': 'RegattaFlow Professional v2.0'
        }
      });

      return response;
    } catch (error: any) {
      if (attempt < this.config.retryAttempts) {
        console.log(`🔄 Retrying WorldTides Pro request (attempt ${attempt + 1})`);
        await this.delay(1000 * attempt);
        return this.makeRequest(endpoint, params, attempt + 1);
      }
      throw error;
    }
  }

  private transformTideData(data: any): TideData {
    const now = new Date();
    const nowUnix = Math.floor(now.getTime() / 1000);

    // Find current height
    let currentHeight = 0;
    if (data.heights) {
      const closestHeight = data.heights.find((h: any) => Math.abs(h.dt - nowUnix) < 900) || data.heights[0];
      currentHeight = closestHeight?.height || 0;
    }

    // Find next extremes
    let nextHigh: Date = new Date(now.getTime() + 6 * 60 * 60 * 1000); // Default 6 hours
    let nextLow: Date = new Date(now.getTime() + 12 * 60 * 60 * 1000); // Default 12 hours

    if (data.extremes) {
      const futureExtremes = data.extremes.filter((e: any) => e.dt > nowUnix);

      const nextHighExtreme = futureExtremes.find((e: any) => e.type === 'High');
      const nextLowExtreme = futureExtremes.find((e: any) => e.type === 'Low');

      if (nextHighExtreme) {
        nextHigh = new Date(nextHighExtreme.dt * 1000);
      }
      if (nextLowExtreme) {
        nextLow = new Date(nextLowExtreme.dt * 1000);
      }
    }

    // Calculate tide direction and phase
    const direction = this.calculateTideDirection(data, nowUnix);
    const currentPhase = this.calculateTidePhase(data, nowUnix);
    const speed = this.calculateTideSpeed(data, nowUnix);

    // Calculate tidal range and coefficient
    const range = this.calculateTidalRange(data);
    const coefficient = this.calculateTidalCoefficient(range);

    return {
      height: currentHeight,
      direction,
      speed,
      nextHigh,
      nextLow,
      currentPhase,
      range,
      coefficient
    };
  }

  private transformTideExtremes(data: any): TideExtreme[] {
    if (!data.extremes) return [];

    return data.extremes.map((extreme: any) => ({
      type: extreme.type.toLowerCase() as 'high' | 'low',
      time: new Date(extreme.dt * 1000),
      height: extreme.height
    }));
  }

  private calculateTideDirection(data: any, currentTime: number): 'flood' | 'ebb' | 'slack' {
    if (!data.heights || data.heights.length < 2) return 'slack';

    // Find heights around current time
    const beforeIndex = data.heights.findIndex((h: any) => h.dt >= currentTime - 900);
    const afterIndex = data.heights.findIndex((h: any) => h.dt >= currentTime + 900);

    if (beforeIndex === -1 || afterIndex === -1) return 'slack';

    const heightBefore = data.heights[Math.max(0, beforeIndex - 1)]?.height || 0;
    const heightAfter = data.heights[Math.min(data.heights.length - 1, afterIndex + 1)]?.height || 0;

    const change = heightAfter - heightBefore;

    if (Math.abs(change) < 0.05) return 'slack';
    return change > 0 ? 'flood' : 'ebb';
  }

  private calculateTidePhase(data: any, currentTime: number): 'rising' | 'falling' | 'high_slack' | 'low_slack' {
    const direction = this.calculateTideDirection(data, currentTime);

    if (direction === 'flood') return 'rising';
    if (direction === 'ebb') return 'falling';

    // Determine if we're at high or low slack
    if (!data.extremes) return 'high_slack';

    const recentExtremes = data.extremes
      .filter((e: any) => Math.abs(e.dt - currentTime) < 3600) // Within 1 hour
      .sort((a: any, b: any) => Math.abs(a.dt - currentTime) - Math.abs(b.dt - currentTime));

    if (recentExtremes.length > 0) {
      return recentExtremes[0].type === 'High' ? 'high_slack' : 'low_slack';
    }

    return 'high_slack';
  }

  private calculateTideSpeed(data: any, currentTime: number): number {
    if (!data.heights || data.heights.length < 2) return 0;

    // Find rate of change around current time
    const currentIndex = data.heights.findIndex((h: any) => h.dt >= currentTime);
    if (currentIndex === -1 || currentIndex === 0 || currentIndex === data.heights.length - 1) {
      return 0;
    }

    const before = data.heights[currentIndex - 1];
    const after = data.heights[currentIndex + 1];

    const timeChange = after.dt - before.dt; // seconds
    const heightChange = after.height - before.height; // meters

    // Convert to knots (very rough approximation)
    const rateMetersPerSecond = heightChange / timeChange;
    return Math.abs(rateMetersPerSecond) * 1.944; // Convert to knots (very approximate)
  }

  private calculateTidalRange(data: any): number {
    if (!data.extremes || data.extremes.length < 2) return 2.0; // Default range

    // Find recent high and low
    const now = Date.now() / 1000;
    const recentExtremes = data.extremes
      .filter((e: any) => Math.abs(e.dt - now) < 24 * 60 * 60) // Within 24 hours
      .sort((a: any, b: any) => Math.abs(a.dt - now) - Math.abs(b.dt - now));

    const high = recentExtremes.find((e: any) => e.type === 'High');
    const low = recentExtremes.find((e: any) => e.type === 'Low');

    if (high && low) {
      return Math.abs(high.height - low.height);
    }

    return 2.0; // Default range
  }

  private calculateTidalCoefficient(range: number): number {
    // Tidal coefficient calculation (simplified)
    // 20-120 scale, where 70 is average
    const baseCoeff = 70;
    const rangeCoeff = (range - 2.0) * 10; // Adjust based on range
    return Math.max(20, Math.min(120, baseCoeff + rangeCoeff));
  }

  private calculateDistance(point1: GeoLocation, point2: GeoLocation): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) * Math.cos(this.toRadians(point2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
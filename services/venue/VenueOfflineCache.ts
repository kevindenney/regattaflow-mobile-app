/**
 * VenueOfflineCache Service
 * Provides offline caching for venue intelligence data using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LiveWeatherData } from '@/hooks/useVenueLiveWeather';
import { VenueRace } from '@/hooks/useVenueRaces';
import { VenueRacingArea } from '@/hooks/useVenueRacingAreas';
import { VenueFleet } from '@/hooks/useVenueFleetInfo';

// Cache key prefixes
const CACHE_PREFIX = '@venue_cache_';
const WEATHER_PREFIX = `${CACHE_PREFIX}weather_`;
const RACES_PREFIX = `${CACHE_PREFIX}races_`;
const RACING_AREAS_PREFIX = `${CACHE_PREFIX}areas_`;
const FLEET_INFO_PREFIX = `${CACHE_PREFIX}fleets_`;
const INTEL_PREFIX = `${CACHE_PREFIX}intel_`;

// Cache expiration times (in milliseconds)
const WEATHER_TTL = 30 * 60 * 1000; // 30 minutes
const RACES_TTL = 6 * 60 * 60 * 1000; // 6 hours
const AREAS_TTL = 24 * 60 * 60 * 1000; // 24 hours
const FLEET_TTL = 24 * 60 * 60 * 1000; // 24 hours
const INTEL_TTL = 12 * 60 * 60 * 1000; // 12 hours

interface CachedData<T> {
  data: T;
  cachedAt: number;
  ttl: number;
}

/**
 * Generic cache read function
 */
async function readCache<T>(key: string): Promise<{ data: T; cachedAt: Date; isStale: boolean } | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;

    const cached: CachedData<T> = JSON.parse(raw);
    const age = Date.now() - cached.cachedAt;
    const isStale = age > cached.ttl;

    return {
      data: cached.data,
      cachedAt: new Date(cached.cachedAt),
      isStale,
    };
  } catch (error) {
    console.error('[VenueOfflineCache] Error reading cache:', error);
    return null;
  }
}

/**
 * Generic cache write function
 */
async function writeCache<T>(key: string, data: T, ttl: number): Promise<boolean> {
  try {
    const cached: CachedData<T> = {
      data,
      cachedAt: Date.now(),
      ttl,
    };
    await AsyncStorage.setItem(key, JSON.stringify(cached));
    return true;
  } catch (error) {
    console.error('[VenueOfflineCache] Error writing cache:', error);
    return false;
  }
}

/**
 * VenueOfflineCache class
 * Manages offline caching for venue-related data
 */
export class VenueOfflineCacheService {
  // ==================== WEATHER ====================
  
  async cacheWeather(venueId: string, weather: LiveWeatherData): Promise<boolean> {
    return writeCache(`${WEATHER_PREFIX}${venueId}`, weather, WEATHER_TTL);
  }

  async getWeather(venueId: string): Promise<{ data: LiveWeatherData; cachedAt: Date; isStale: boolean } | null> {
    return readCache<LiveWeatherData>(`${WEATHER_PREFIX}${venueId}`);
  }

  // ==================== RACES ====================

  async cacheRaces(venueId: string, races: VenueRace[]): Promise<boolean> {
    return writeCache(`${RACES_PREFIX}${venueId}`, races, RACES_TTL);
  }

  async getRaces(venueId: string): Promise<{ data: VenueRace[]; cachedAt: Date; isStale: boolean } | null> {
    return readCache<VenueRace[]>(`${RACES_PREFIX}${venueId}`);
  }

  // ==================== RACING AREAS ====================

  async cacheRacingAreas(venueId: string, areas: VenueRacingArea[]): Promise<boolean> {
    return writeCache(`${RACING_AREAS_PREFIX}${venueId}`, areas, AREAS_TTL);
  }

  async getRacingAreas(venueId: string): Promise<{ data: VenueRacingArea[]; cachedAt: Date; isStale: boolean } | null> {
    return readCache<VenueRacingArea[]>(`${RACING_AREAS_PREFIX}${venueId}`);
  }

  // ==================== FLEET INFO ====================

  async cacheFleetInfo(venueId: string, fleets: VenueFleet[]): Promise<boolean> {
    return writeCache(`${FLEET_INFO_PREFIX}${venueId}`, fleets, FLEET_TTL);
  }

  async getFleetInfo(venueId: string): Promise<{ data: VenueFleet[]; cachedAt: Date; isStale: boolean } | null> {
    return readCache<VenueFleet[]>(`${FLEET_INFO_PREFIX}${venueId}`);
  }

  // ==================== TACTICAL INTEL ====================

  async cacheIntelligence(venueId: string, intel: any): Promise<boolean> {
    return writeCache(`${INTEL_PREFIX}${venueId}`, intel, INTEL_TTL);
  }

  async getIntelligence(venueId: string): Promise<{ data: any; cachedAt: Date; isStale: boolean } | null> {
    return readCache<any>(`${INTEL_PREFIX}${venueId}`);
  }

  // ==================== UTILITIES ====================

  /**
   * Clear all cached data for a specific venue
   */
  async clearVenueCache(venueId: string): Promise<void> {
    const keys = [
      `${WEATHER_PREFIX}${venueId}`,
      `${RACES_PREFIX}${venueId}`,
      `${RACING_AREAS_PREFIX}${venueId}`,
      `${FLEET_INFO_PREFIX}${venueId}`,
      `${INTEL_PREFIX}${venueId}`,
    ];
    
    try {
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('[VenueOfflineCache] Error clearing venue cache:', error);
    }
  }

  /**
   * Clear all venue cache data
   */
  async clearAllCache(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('[VenueOfflineCache] Error clearing all cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalItems: number;
    venueCount: number;
    estimatedSize: string;
    oldestItem?: Date;
  }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX));
      
      const venueIds = new Set<string>();
      let totalSize = 0;
      let oldestTime = Date.now();

      for (const key of cacheKeys) {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          totalSize += raw.length;
          const cached = JSON.parse(raw);
          if (cached.cachedAt < oldestTime) {
            oldestTime = cached.cachedAt;
          }
        }

        // Extract venue ID from key
        const parts = key.replace(CACHE_PREFIX, '').split('_');
        if (parts.length > 1) {
          venueIds.add(parts.slice(1).join('_'));
        }
      }

      const sizeInKB = (totalSize / 1024).toFixed(1);

      return {
        totalItems: cacheKeys.length,
        venueCount: venueIds.size,
        estimatedSize: `${sizeInKB} KB`,
        oldestItem: cacheKeys.length > 0 ? new Date(oldestTime) : undefined,
      };
    } catch (error) {
      console.error('[VenueOfflineCache] Error getting cache stats:', error);
      return {
        totalItems: 0,
        venueCount: 0,
        estimatedSize: '0 KB',
      };
    }
  }

  /**
   * Prune stale cache entries
   */
  async pruneStaleCache(): Promise<number> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX));
      const keysToRemove: string[] = [];

      for (const key of cacheKeys) {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const cached: CachedData<any> = JSON.parse(raw);
          const age = Date.now() - cached.cachedAt;
          if (age > cached.ttl * 2) {
            // Remove if more than 2x the TTL
            keysToRemove.push(key);
          }
        }
      }

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }

      return keysToRemove.length;
    } catch (error) {
      console.error('[VenueOfflineCache] Error pruning cache:', error);
      return 0;
    }
  }

  /**
   * Check if device is likely offline (heuristic based on cache freshness)
   */
  async hasRecentData(venueId: string): Promise<boolean> {
    const weather = await this.getWeather(venueId);
    if (weather && !weather.isStale) return true;

    const races = await this.getRaces(venueId);
    if (races && !races.isStale) return true;

    return false;
  }
}

// Export singleton instance
export const venueOfflineCache = new VenueOfflineCacheService();

/**
 * Format cache age for display
 */
export function formatCacheAge(cachedAt: Date): string {
  const minutes = Math.floor((Date.now() - cachedAt.getTime()) / 60000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default venueOfflineCache;


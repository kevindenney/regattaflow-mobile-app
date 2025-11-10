/**
 * Offline Service
 *
 * Critical race day offline capabilities:
 * - Pre-cache essential data (course, strategy, intelligence)
 * - Queue offline actions for sync
 * - Conflict resolution with client timestamp priority
 * - Background sync when online
 *
 * Cache Strategy:
 * - Home venue: Permanent
 * - Recent venues: 30 days
 * - Next race: Until race complete
 * - GPS tracks: Until uploaded
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from './supabase';

// Storage keys
const STORAGE_KEYS = {
  CACHED_RACES: '@regattaflow/cached_races',
  CACHED_VENUES: '@regattaflow/cached_venues',
  CACHED_STRATEGIES: '@regattaflow/cached_strategies',
  CACHED_TUNING_GUIDES: '@regattaflow/cached_tuning_guides',
  CACHED_WEATHER: '@regattaflow/cached_weather',
  CACHED_DOCUMENTS: '@regattaflow/cached_documents',
  CACHED_VISUALIZATIONS: '@regattaflow/cached_visualizations',
  UPCOMING_RACES: '@regattaflow/upcoming_races',
  GPS_TRACKS: '@regattaflow/gps_tracks',
  RACE_LOGS: '@regattaflow/race_logs',
  SYNC_QUEUE: '@regattaflow/sync_queue',
  HOME_VENUE: '@regattaflow/home_venue',
  LAST_SYNC: '@regattaflow/last_sync',
} as const;

// Cache durations
const CACHE_DURATION = {
  HOME_VENUE: Infinity,
  RECENT_VENUE: 30 * 24 * 60 * 60 * 1000, // 30 days
  NEXT_RACE: Infinity, // Until race complete
  WEATHER: 6 * 60 * 60 * 1000, // 6 hours
  GPS_TRACK: Infinity, // Until uploaded
} as const;

interface CachedItem<T = any> {
  data: T;
  timestamp: number;
  expiresAt?: number;
  priority: 'permanent' | 'race' | 'venue' | 'temporary';
}

interface SyncQueueItem {
  id: string;
  type: 'gps_track' | 'race_log' | 'race_result' | 'photo' | 'analytics';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  priority: number; // 1 = highest (race data), 5 = lowest (analytics)
  retries: number;
}

interface OfflineStatus {
  isOnline: boolean;
  isSyncing: boolean;
  queueLength: number;
  lastSync: number | null;
  failedItems: number;
}

class OfflineService {
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private syncListeners: ((status: OfflineStatus) => void)[] = [];
  private unsubscribeNetInfo?: () => void;

  constructor() {
    // Only initialize on client side (browser), not during SSR
    if (typeof window !== 'undefined') {
      this.initNetworkListener();
    }
  }

  // Initialize network status listener
  private initNetworkListener() {
    // Skip if not in browser environment
    if (typeof window === 'undefined') return;

    this.unsubscribeNetInfo = NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // Trigger sync when coming back online
      if (wasOffline && this.isOnline) {
        this.processSyncQueue();
      }

      this.notifyListeners();
    });
  }

  // Subscribe to offline status changes
  public subscribe(listener: (status: OfflineStatus) => void): () => void {
    this.syncListeners.push(listener);
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener);
    };
  }

  private async notifyListeners() {
    const status = await this.getOfflineStatus();
    this.syncListeners.forEach(listener => listener(status));
  }

  // Get current offline status
  public async getOfflineStatus(): Promise<OfflineStatus> {
    // Return default values during SSR
    if (typeof window === 'undefined') {
      return {
        isOnline: true,
        isSyncing: false,
        queueLength: 0,
        lastSync: null,
        failedItems: 0,
      };
    }

    const queue = await this.getSyncQueue();
    const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      queueLength: queue.length,
      lastSync: lastSync ? parseInt(lastSync) : null,
      failedItems: queue.filter(item => item.retries > 3).length,
    };
  }

  // ===============================
  // PRE-CACHE ESSENTIAL DATA
  // ===============================

  /**
   * Cache next race with all dependencies
   */
  public async cacheNextRace(raceId: string, userId: string): Promise<void> {
    try {
      // Fetch race details
      const { data: race, error: raceError } = await supabase
        .from('regattas')
        .select('id, name, start_date, end_date, metadata, created_at, updated_at')
        .eq('id', raceId)
        .single();

      if (raceError) throw raceError;

      // Cache race
      await this.setCachedItem(
        `${STORAGE_KEYS.CACHED_RACES}:${raceId}`,
        race,
        { priority: 'race' }
      );

      // Cache venue (if not already cached)
      // Note: venue_id would need to be added to the race query if needed
      // For now, skip automatic venue caching to avoid foreign key errors

      // Fetch and cache strategy
      const { data: strategy } = await supabase
        .from('race_strategies')
        .select('*')
        .eq('regatta_id', raceId)
        .eq('user_id', userId)
        .single();

      if (strategy) {
        await this.setCachedItem(
          `${STORAGE_KEYS.CACHED_STRATEGIES}:${raceId}`,
          strategy,
          { priority: 'race' }
        );
      }

      // Fetch and cache tuning guide for user's boat
      // First get sailor_id from user_id
      const { data: sailorProfile } = await supabase
        .from('sailor_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (sailorProfile) {
        const { data: boat } = await supabase
          .from('sailor_boats')
          .select('class_id')
          .eq('sailor_id', sailorProfile.id)
          .eq('is_primary', true)
          .maybeSingle();

        if (boat) {
          const { data: tuningGuides } = await supabase
            .from('tuning_guides')
            .select('*')
            .eq('boat_class', boat.class_id)
            .limit(5);

          if (tuningGuides) {
            await this.setCachedItem(
              `${STORAGE_KEYS.CACHED_TUNING_GUIDES}:${boat.class_id}`,
              tuningGuides,
              { priority: 'race' }
            );
          }
        }
      }

      // Cache current weather
      // Note: weather caching would need venue coordinates from separate query
      // For now, skip to avoid foreign key errors

    } catch (error) {

      throw error;
    }
  }

  /**
   * Cache venue with intelligence data
   */
  public async cacheVenue(venueId: string, priority: 'permanent' | 'race' | 'venue' = 'venue'): Promise<void> {
    try {
      const { data: venue, error } = await supabase
        .from('sailing_venues')
        .select('id, name, latitude, longitude, country, region, time_zone, created_at, updated_at')
        .eq('id', venueId)
        .single();

      if (error) throw error;

      const expiresAt = priority === 'permanent'
        ? undefined
        : priority === 'race'
        ? undefined
        : Date.now() + CACHE_DURATION.RECENT_VENUE;

      await this.setCachedItem(
        `${STORAGE_KEYS.CACHED_VENUES}:${venueId}`,
        venue,
        { priority, expiresAt }
      );
    } catch (error) {
      console.error('Failed to cache venue:', error);
    }
  }

  /**
   * Cache weather data
   */
  private async cacheWeather(venueId: string, lat: number, lng: number): Promise<void> {
    try {
      // This would integrate with your weather service
      // For now, just a placeholder
      const weatherData = {
        venueId,
        coordinates: { lat, lng },
        timestamp: Date.now(),
        // ... weather data
      };

      await this.setCachedItem(
        `${STORAGE_KEYS.CACHED_WEATHER}:${venueId}`,
        weatherData,
        {
          priority: 'temporary',
          expiresAt: Date.now() + CACHE_DURATION.WEATHER
        }
      );
    } catch (error) {
      console.error('Failed to cache weather:', error);
    }
  }

  /**
   * Set home venue for permanent caching
   */
  public async setHomeVenue(venueId: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.HOME_VENUE, venueId);
    await this.cacheVenue(venueId, 'permanent');
  }

  /**
   * Cache upcoming races (next 7 days)
   */
  public async cacheUpcomingRaces(userId: string): Promise<void> {
    try {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const { data: races, error } = await supabase
        .from('regattas')
        .select('id, name, start_date, end_date, metadata, created_at, updated_at')
        .eq('created_by', userId)
        .gte('start_date', new Date().toISOString())
        .lte('start_date', sevenDaysFromNow.toISOString())
        .order('start_date', { ascending: true });

      if (error) throw error;

      await this.setCachedItem(
        STORAGE_KEYS.UPCOMING_RACES,
        races || [],
        {
          priority: 'race',
          expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        }
      );

      // Cache each race individually
      if (races) {
        for (const race of races) {
          await this.cacheNextRace(race.id, userId);
        }
      }
    } catch (error) {
      console.error('Failed to cache upcoming races:', error);
    }
  }

  /**
   * Cache sailing documents
   */
  public async cacheSailingDocuments(raceId: string): Promise<void> {
    try {
      const { data: documents, error } = await supabase
        .from('sailing_documents')
        .select('*')
        .eq('race_id', raceId);

      if (error) throw error;

      if (documents) {
        await this.setCachedItem(
          `${STORAGE_KEYS.CACHED_DOCUMENTS}:${raceId}`,
          documents,
          { priority: 'race' }
        );
      }
    } catch (error) {
      console.error('Failed to cache sailing documents:', error);
    }
  }

  /**
   * Cache course visualizations
   */
  public async cacheCourseVisualizations(raceId: string): Promise<void> {
    try {
      const { data: visualizations, error } = await supabase
        .from('race_strategies')
        .select('course_data, visualization_data')
        .eq('regatta_id', raceId);

      if (error) throw error;

      if (visualizations) {
        await this.setCachedItem(
          `${STORAGE_KEYS.CACHED_VISUALIZATIONS}:${raceId}`,
          visualizations,
          { priority: 'race' }
        );
      }
    } catch (error) {
      console.error('Failed to cache course visualizations:', error);
    }
  }

  // ===============================
  // OFFLINE RACE DAY OPERATIONS
  // ===============================

  /**
   * Save GPS track offline
   */
  public async saveGPSTrack(raceId: string, trackData: any): Promise<void> {
    const track = {
      id: `gps_${Date.now()}`,
      raceId,
      data: trackData,
      timestamp: Date.now(),
    };

    const tracks = await this.getGPSTracks();
    tracks.push(track);
    await AsyncStorage.setItem(STORAGE_KEYS.GPS_TRACKS, JSON.stringify(tracks));

    // Add to sync queue
    await this.addToSyncQueue({
      type: 'gps_track',
      action: 'create',
      data: track,
      priority: 1, // Highest priority
    });
  }

  /**
   * Log race event offline (tack, gybe, etc.)
   */
  public async logRaceEvent(raceId: string, event: any): Promise<void> {
    const log = {
      id: `log_${Date.now()}`,
      raceId,
      event,
      timestamp: Date.now(),
    };

    const logs = await this.getRaceLogs();
    logs.push(log);
    await AsyncStorage.setItem(STORAGE_KEYS.RACE_LOGS, JSON.stringify(logs));

    // Add to sync queue
    await this.addToSyncQueue({
      type: 'race_log',
      action: 'create',
      data: log,
      priority: 1, // Highest priority
    });
  }

  // ===============================
  // SYNC QUEUE MANAGEMENT
  // ===============================

  /**
   * Add item to sync queue
   */
  private async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    const queue = await this.getSyncQueue();
    const queueItem: SyncQueueItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
    };

    queue.push(queueItem);
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    this.notifyListeners();

    // Try to sync immediately if online
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  /**
   * Get sync queue
   */
  private async getSyncQueue(): Promise<SyncQueueItem[]> {
    // Return empty queue during SSR
    if (typeof window === 'undefined') {
      return [];
    }

    const queueJson = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    return queueJson ? JSON.parse(queueJson) : [];
  }

  /**
   * Process sync queue
   */
  public async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.isSyncing) return;

    this.isSyncing = true;
    this.notifyListeners();

    try {
      const queue = await this.getSyncQueue();

      // Sort by priority (1 = highest)
      const sortedQueue = queue.sort((a, b) => a.priority - b.priority);

      const results = await Promise.allSettled(
        sortedQueue.map(item => this.syncItem(item))
      );

      // Remove successful items from queue
      const updatedQueue = sortedQueue.filter((item, index) => {
        const result = results[index];
        if (result.status === 'fulfilled') {
          return false; // Remove from queue
        } else {
          // Increment retry count
          item.retries++;
          return item.retries <= 5; // Keep in queue if under 5 retries
        }
      });

      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(updatedQueue));
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());

    } catch (error) {
      console.error('Sync queue processing failed:', error);
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Sync individual item
   */
  private async syncItem(item: SyncQueueItem): Promise<void> {
    switch (item.type) {
      case 'gps_track':
        await this.syncGPSTrack(item.data);
        break;
      case 'race_log':
        await this.syncRaceLog(item.data);
        break;
      case 'race_result':
        await this.syncRaceResult(item.data);
        break;
      case 'photo':
        await this.syncPhoto(item.data);
        break;
      case 'analytics':
        await this.syncAnalytics(item.data);
        break;
    }
  }

  private async syncGPSTrack(track: any): Promise<void> {
    const { error } = await supabase
      .from('gps_tracks')
      .upsert({
        race_id: track.raceId,
        track_data: track.data,
        recorded_at: new Date(track.timestamp).toISOString(),
      });

    if (error) throw error;

    // Remove from local storage after successful sync
    const tracks = await this.getGPSTracks();
    const updatedTracks = tracks.filter(t => t.id !== track.id);
    await AsyncStorage.setItem(STORAGE_KEYS.GPS_TRACKS, JSON.stringify(updatedTracks));
  }

  private async syncRaceLog(log: any): Promise<void> {
    const { error } = await supabase
      .from('race_logs')
      .upsert({
        race_id: log.raceId,
        event_type: log.event.type,
        event_data: log.event.data,
        logged_at: new Date(log.timestamp).toISOString(),
      });

    if (error) throw error;

    // Remove from local storage after successful sync
    const logs = await this.getRaceLogs();
    const updatedLogs = logs.filter(l => l.id !== log.id);
    await AsyncStorage.setItem(STORAGE_KEYS.RACE_LOGS, JSON.stringify(updatedLogs));
  }

  private async syncRaceResult(result: any): Promise<void> {
    const { error } = await supabase
      .from('race_results')
      .upsert(result, {
        onConflict: 'id',
        // Client timestamp wins (race day data is authoritative)
      });

    if (error) throw error;
  }

  private async syncPhoto(photo: any): Promise<void> {
    // Upload photo to Supabase Storage
    const { error } = await supabase.storage
      .from('race-photos')
      .upload(photo.path, photo.file);

    if (error) throw error;
  }

  private async syncAnalytics(analytics: any): Promise<void> {
    const { error } = await supabase
      .from('race_analytics')
      .upsert(analytics);

    if (error) throw error;
  }

  // ===============================
  // CACHE UTILITIES
  // ===============================

  /**
   * Set cached item with expiration
   */
  private async setCachedItem<T>(
    key: string,
    data: T,
    options?: { priority?: CachedItem['priority']; expiresAt?: number }
  ): Promise<void> {
    const item: CachedItem<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: options?.expiresAt,
      priority: options?.priority || 'temporary',
    };

    await AsyncStorage.setItem(key, JSON.stringify(item));
  }

  /**
   * Get cached item (returns null if expired)
   */
  public async getCachedItem<T>(key: string): Promise<T | null> {
    const itemJson = await AsyncStorage.getItem(key);
    if (!itemJson) return null;

    const item: CachedItem<T> = JSON.parse(itemJson);

    // Check if expired
    if (item.expiresAt && item.expiresAt < Date.now()) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return item.data;
  }

  /**
   * Get cached race
   */
  public async getCachedRace(raceId: string): Promise<any | null> {
    return this.getCachedItem(`${STORAGE_KEYS.CACHED_RACES}:${raceId}`);
  }

  /**
   * Get cached venue
   */
  public async getCachedVenue(venueId: string): Promise<any | null> {
    return this.getCachedItem(`${STORAGE_KEYS.CACHED_VENUES}:${venueId}`);
  }

  /**
   * Get cached strategy
   */
  public async getCachedStrategy(raceId: string): Promise<any | null> {
    return this.getCachedItem(`${STORAGE_KEYS.CACHED_STRATEGIES}:${raceId}`);
  }

  /**
   * Get cached tuning guides
   */
  public async getCachedTuningGuides(boatClass: string): Promise<any[] | null> {
    return this.getCachedItem(`${STORAGE_KEYS.CACHED_TUNING_GUIDES}:${boatClass}`);
  }

  /**
   * Get cached weather
   */
  public async getCachedWeather(venueId: string): Promise<any | null> {
    return this.getCachedItem(`${STORAGE_KEYS.CACHED_WEATHER}:${venueId}`);
  }

  /**
   * Get cached upcoming races
   */
  public async getCachedUpcomingRaces(): Promise<any[] | null> {
    return this.getCachedItem(STORAGE_KEYS.UPCOMING_RACES);
  }

  /**
   * Get cached sailing documents
   */
  public async getCachedDocuments(raceId: string): Promise<any[] | null> {
    return this.getCachedItem(`${STORAGE_KEYS.CACHED_DOCUMENTS}:${raceId}`);
  }

  /**
   * Get cached course visualizations
   */
  public async getCachedVisualizations(raceId: string): Promise<any | null> {
    return this.getCachedItem(`${STORAGE_KEYS.CACHED_VISUALIZATIONS}:${raceId}`);
  }

  /**
   * Get GPS tracks
   */
  private async getGPSTracks(): Promise<any[]> {
    const tracksJson = await AsyncStorage.getItem(STORAGE_KEYS.GPS_TRACKS);
    return tracksJson ? JSON.parse(tracksJson) : [];
  }

  /**
   * Get race logs
   */
  private async getRaceLogs(): Promise<any[]> {
    const logsJson = await AsyncStorage.getItem(STORAGE_KEYS.RACE_LOGS);
    return logsJson ? JSON.parse(logsJson) : [];
  }

  /**
   * Clear expired cache
   */
  public async clearExpiredCache(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key =>
      key.startsWith('@regattaflow/cached_')
    );

    for (const key of cacheKeys) {
      const itemJson = await AsyncStorage.getItem(key);
      if (!itemJson) continue;

      const item: CachedItem = JSON.parse(itemJson);

      // Don't delete permanent or race priority items
      if (item.priority === 'permanent' || item.priority === 'race') continue;

      // Delete if expired
      if (item.expiresAt && item.expiresAt < Date.now()) {
        await AsyncStorage.removeItem(key);
      }
    }
  }

  /**
   * Clear all cache (except permanent)
   */
  public async clearCache(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key =>
      key.startsWith('@regattaflow/cached_')
    );

    for (const key of cacheKeys) {
      const itemJson = await AsyncStorage.getItem(key);
      if (!itemJson) continue;

      const item: CachedItem = JSON.parse(itemJson);

      // Don't delete permanent items
      if (item.priority === 'permanent') continue;

      await AsyncStorage.removeItem(key);
    }
  }

  /**
   * Force sync now
   */
  public async forceSyncNow(): Promise<void> {
    await this.processSyncQueue();
  }

  /**
   * Cleanup
   */
  public cleanup(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
    }
  }
}

// Singleton instance
export const offlineService = new OfflineService();

// Export types
export type { OfflineStatus, SyncQueueItem, CachedItem };

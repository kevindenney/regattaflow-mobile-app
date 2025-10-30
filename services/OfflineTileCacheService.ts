/**
 * Offline Tile Cache Service
 *
 * Provides OnX Maps-style offline tile caching for nautical charts, bathymetry,
 * and satellite imagery. Uses IndexedDB for web and FileSystem for React Native.
 *
 * Features:
 * - Download and cache map tiles for offline use
 * - Storage quota management
 * - Progressive background downloads
 * - Cache expiration and cleanup
 * - Download progress tracking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { SailingVenue } from '@/lib/types/global-venues';

/**
 * Tile layer type
 */
export type TileLayerType = 'satellite' | 'nautical' | 'bathymetry' | 'basemap';

/**
 * Tile coordinates (z/x/y)
 */
export interface TileCoordinate {
  z: number; // Zoom level
  x: number; // X tile coordinate
  y: number; // Y tile coordinate
}

/**
 * Cached tile metadata
 */
export interface CachedTile {
  coordinate: TileCoordinate;
  layerType: TileLayerType;
  url: string;
  data: Blob | string; // Blob for web, base64 string for React Native
  size: number; // bytes
  cachedAt: Date;
  expiresAt: Date;
}

/**
 * Download progress info
 */
export interface DownloadProgress {
  totalTiles: number;
  downloadedTiles: number;
  failedTiles: number;
  totalBytes: number;
  downloadedBytes: number;
  percentComplete: number;
  estimatedTimeRemaining: number; // seconds
  isComplete: boolean;
}

/**
 * Cache statistics
 */
export interface CacheStatistics {
  totalTiles: number;
  totalBytes: number;
  layerBreakdown: Record<TileLayerType, { tiles: number; bytes: number }>;
  oldestTile: Date | null;
  newestTile: Date | null;
}

/**
 * Offline Tile Cache Service
 */
export class OfflineTileCacheService {
  private readonly DB_NAME = 'regattaflow_offline_tiles';
  private readonly DB_VERSION = 1;
  private readonly CACHE_PREFIX = '@offline_tiles_';
  private readonly MAX_CACHE_SIZE = 500 * 1024 * 1024; // 500 MB default
  private readonly TILE_EXPIRY_DAYS = 30; // Cache tiles for 30 days

  private db: IDBDatabase | null = null;
  private downloadQueue: TileCoordinate[] = [];
  private isDownloading = false;
  private downloadProgress: DownloadProgress | null = null;
  private progressCallback: ((progress: DownloadProgress) => void) | null = null;

  /**
   * Initialize the tile cache
   */
  async initialize(): Promise<void> {
    if (Platform.OS === 'web') {
      await this.initializeIndexedDB();
    } else {
      // React Native uses AsyncStorage
      await this.initializeAsyncStorage();
    }
  }

  /**
   * Download tiles for a specific area
   */
  async downloadArea(
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    },
    zoomLevels: number[],
    layerType: TileLayerType,
    tileUrlTemplate: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<void> {
    this.progressCallback = onProgress || null;

    // Generate tile list for area
    const tiles = this.generateTileList(bounds, zoomLevels);

    // Initialize progress
    this.downloadProgress = {
      totalTiles: tiles.length,
      downloadedTiles: 0,
      failedTiles: 0,
      totalBytes: 0,
      downloadedBytes: 0,
      percentComplete: 0,
      estimatedTimeRemaining: 0,
      isComplete: false
    };

    // Add to download queue
    this.downloadQueue = tiles;
    this.isDownloading = true;

    // Start downloading
    const startTime = Date.now();
    for (const tile of tiles) {
      if (!this.isDownloading) break; // Allow cancellation

      try {
        const url = this.expandTileUrl(tileUrlTemplate, tile);
        await this.downloadAndCacheTile(tile, layerType, url);

        this.downloadProgress.downloadedTiles++;

        // Update estimated time
        const elapsed = (Date.now() - startTime) / 1000;
        const tilesPerSecond = this.downloadProgress.downloadedTiles / elapsed;
        const remaining = tiles.length - this.downloadProgress.downloadedTiles;
        this.downloadProgress.estimatedTimeRemaining = remaining / tilesPerSecond;

        this.downloadProgress.percentComplete =
          (this.downloadProgress.downloadedTiles / this.downloadProgress.totalTiles) * 100;

        // Report progress
        if (this.progressCallback) {
          this.progressCallback(this.downloadProgress);
        }
      } catch (error) {
        console.error(`Failed to download tile ${tile.z}/${tile.x}/${tile.y}:`, error);
        this.downloadProgress.failedTiles++;
      }
    }

    this.downloadProgress.isComplete = true;
    this.isDownloading = false;

    if (this.progressCallback) {
      this.progressCallback(this.downloadProgress);
    }
  }

  /**
   * Cancel ongoing download
   */
  cancelDownload(): void {
    this.isDownloading = false;
    this.downloadQueue = [];
  }

  /**
   * Get cached tile
   */
  async getCachedTile(
    coordinate: TileCoordinate,
    layerType: TileLayerType
  ): Promise<CachedTile | null> {
    const key = this.getTileKey(coordinate, layerType);

    if (Platform.OS === 'web') {
      return this.getTileFromIndexedDB(key);
    } else {
      return this.getTileFromAsyncStorage(key);
    }
  }

  /**
   * Check if tile is cached
   */
  async isTileCached(
    coordinate: TileCoordinate,
    layerType: TileLayerType
  ): Promise<boolean> {
    const tile = await this.getCachedTile(coordinate, layerType);
    return tile !== null && new Date() < tile.expiresAt;
  }

  /**
   * Get cache statistics
   */
  async getCacheStatistics(): Promise<CacheStatistics> {
    const stats: CacheStatistics = {
      totalTiles: 0,
      totalBytes: 0,
      layerBreakdown: {
        satellite: { tiles: 0, bytes: 0 },
        nautical: { tiles: 0, bytes: 0 },
        bathymetry: { tiles: 0, bytes: 0 },
        basemap: { tiles: 0, bytes: 0 }
      },
      oldestTile: null,
      newestTile: null
    };

    if (Platform.OS === 'web') {
      // Query IndexedDB
      if (!this.db) return stats;

      const transaction = this.db.transaction(['tiles'], 'readonly');
      const store = transaction.objectStore('tiles');
      const request = store.getAll();

      return new Promise((resolve) => {
        request.onsuccess = () => {
          const tiles: CachedTile[] = request.result;

          tiles.forEach(tile => {
            stats.totalTiles++;
            stats.totalBytes += tile.size;
            stats.layerBreakdown[tile.layerType].tiles++;
            stats.layerBreakdown[tile.layerType].bytes += tile.size;

            if (!stats.oldestTile || tile.cachedAt < stats.oldestTile) {
              stats.oldestTile = tile.cachedAt;
            }
            if (!stats.newestTile || tile.cachedAt > stats.newestTile) {
              stats.newestTile = tile.cachedAt;
            }
          });

          resolve(stats);
        };
      });
    } else {
      // Query AsyncStorage
      const keys = await AsyncStorage.getAllKeys();
      const tileKeys = keys.filter((key: string) => key.startsWith(this.CACHE_PREFIX));

      for (const key of tileKeys) {
        const tileJson = await AsyncStorage.getItem(key);
        if (tileJson) {
          const tile: CachedTile = JSON.parse(tileJson);
          stats.totalTiles++;
          stats.totalBytes += tile.size;
          stats.layerBreakdown[tile.layerType].tiles++;
          stats.layerBreakdown[tile.layerType].bytes += tile.size;

          const cachedAt = new Date(tile.cachedAt);
          if (!stats.oldestTile || cachedAt < stats.oldestTile) {
            stats.oldestTile = cachedAt;
          }
          if (!stats.newestTile || cachedAt > stats.newestTile) {
            stats.newestTile = cachedAt;
          }
        }
      }

      return stats;
    }
  }

  /**
   * Clear cache (all or by layer type)
   */
  async clearCache(layerType?: TileLayerType): Promise<void> {
    if (Platform.OS === 'web') {
      if (!this.db) return;

      const transaction = this.db.transaction(['tiles'], 'readwrite');
      const store = transaction.objectStore('tiles');

      if (layerType) {
        // Clear specific layer
        const index = store.index('layerType');
        const request = index.openCursor(IDBKeyRange.only(layerType));

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };
      } else {
        // Clear all
        store.clear();
      }
    } else {
      const keys = await AsyncStorage.getAllKeys();
      const tileKeys = keys.filter((key: string) => {
        if (!key.startsWith(this.CACHE_PREFIX)) return false;
        if (!layerType) return true;
        return key.includes(`_${layerType}_`);
      });

      await AsyncStorage.multiRemove(tileKeys);
    }
  }

  /**
   * Remove expired tiles
   */
  async removeExpiredTiles(): Promise<number> {
    let removedCount = 0;
    const now = new Date();

    if (Platform.OS === 'web') {
      if (!this.db) return 0;

      const transaction = this.db.transaction(['tiles'], 'readwrite');
      const store = transaction.objectStore('tiles');
      const request = store.openCursor();

      return new Promise((resolve) => {
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const tile: CachedTile = cursor.value;
            if (new Date(tile.expiresAt) < now) {
              cursor.delete();
              removedCount++;
            }
            cursor.continue();
          } else {
            resolve(removedCount);
          }
        };
      });
    } else {
      const keys = await AsyncStorage.getAllKeys();
      const tileKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));

      for (const key of tileKeys) {
        const tileJson = await AsyncStorage.getItem(key);
        if (tileJson) {
          const tile: CachedTile = JSON.parse(tileJson);
          if (new Date(tile.expiresAt) < now) {
            await AsyncStorage.removeItem(key);
            removedCount++;
          }
        }
      }

      return removedCount;
    }
  }

  /**
   * Estimate storage size for area download
   */
  estimateDownloadSize(
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    },
    zoomLevels: number[],
    avgTileSizeKB: number = 50 // Average tile size
  ): {
    tileCount: number;
    estimatedSizeMB: number;
  } {
    const tiles = this.generateTileList(bounds, zoomLevels);
    const estimatedSizeMB = (tiles.length * avgTileSizeKB) / 1024;

    return {
      tileCount: tiles.length,
      estimatedSizeMB: Math.round(estimatedSizeMB * 10) / 10
    };
  }

  // Private helper methods

  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('tiles')) {
          const store = db.createObjectStore('tiles', { keyPath: 'key' });
          store.createIndex('layerType', 'layerType', { unique: false });
          store.createIndex('cachedAt', 'cachedAt', { unique: false });
        }
      };
    });
  }

  private async initializeAsyncStorage(): Promise<void> {
    // No initialization needed for AsyncStorage
    return Promise.resolve();
  }

  private async downloadAndCacheTile(
    coordinate: TileCoordinate,
    layerType: TileLayerType,
    url: string
  ): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    const size = blob.size;

    const cachedAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.TILE_EXPIRY_DAYS);

    const tile: CachedTile = {
      coordinate,
      layerType,
      url,
      data: Platform.OS === 'web' ? blob : await this.blobToBase64(blob),
      size,
      cachedAt,
      expiresAt
    };

    const key = this.getTileKey(coordinate, layerType);

    if (Platform.OS === 'web') {
      await this.saveTileToIndexedDB(key, tile);
    } else {
      await this.saveTileToAsyncStorage(key, tile);
    }

    if (this.downloadProgress) {
      this.downloadProgress.downloadedBytes += size;
      this.downloadProgress.totalBytes += size;
    }
  }

  private async saveTileToIndexedDB(key: string, tile: CachedTile): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['tiles'], 'readwrite');
      const store = transaction.objectStore('tiles');
      const request = store.put({ ...tile, key });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async saveTileToAsyncStorage(key: string, tile: CachedTile): Promise<void> {
    await AsyncStorage.setItem(this.CACHE_PREFIX + key, JSON.stringify(tile));
  }

  private async getTileFromIndexedDB(key: string): Promise<CachedTile | null> {
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['tiles'], 'readonly');
      const store = transaction.objectStore('tiles');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result || null);
      };
      request.onerror = () => resolve(null);
    });
  }

  private async getTileFromAsyncStorage(key: string): Promise<CachedTile | null> {
    const tileJson = await AsyncStorage.getItem(this.CACHE_PREFIX + key);
    return tileJson ? JSON.parse(tileJson) : null;
  }

  private getTileKey(coordinate: TileCoordinate, layerType: TileLayerType): string {
    return `${layerType}_${coordinate.z}_${coordinate.x}_${coordinate.y}`;
  }

  private generateTileList(
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    },
    zoomLevels: number[]
  ): TileCoordinate[] {
    const tiles: TileCoordinate[] = [];

    for (const z of zoomLevels) {
      const minTile = this.latLngToTile(bounds.north, bounds.west, z);
      const maxTile = this.latLngToTile(bounds.south, bounds.east, z);

      for (let x = minTile.x; x <= maxTile.x; x++) {
        for (let y = minTile.y; y <= maxTile.y; y++) {
          tiles.push({ z, x, y });
        }
      }
    }

    return tiles;
  }

  private latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
    const n = Math.pow(2, zoom);
    const x = Math.floor((lng + 180) / 360 * n);
    const y = Math.floor(
      (1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2 * n
    );

    return { x, y };
  }

  private expandTileUrl(template: string, tile: TileCoordinate): string {
    return template
      .replace('{z}', tile.z.toString())
      .replace('{x}', tile.x.toString())
      .replace('{y}', tile.y.toString());
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

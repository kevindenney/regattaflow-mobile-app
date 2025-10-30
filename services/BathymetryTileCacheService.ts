/**
 * Bathymetry Tile Cache Service
 *
 * Manages offline caching of bathymetry tiles for race day reliability.
 * Platform-aware: Uses expo-file-system on mobile, Cache API on web.
 */

import { Platform } from 'react-native';
import type { SailingVenue } from '@/lib/types/global-venues';
import { createLogger } from '@/lib/utils/logger';

/**
 * Tile identifier
 */
export interface TileCoordinate {
  z: number; // Zoom level
  x: number; // Tile X
  y: number; // Tile Y
}

/**
 * Cache statistics
 */
export interface CacheStats {
  tileCount: number;
  totalSize: number; // bytes
  venues: string[]; // Cached venue IDs
  lastUpdated: Date;
}

/**
 * Download progress callback
 */
export type DownloadProgressCallback = (progress: {
  downloaded: number;
  total: number;
  percentage: number;
  currentTile?: TileCoordinate;
}) => void;

/**
 * Bathymetry Tile Cache Service
 */

const logger = createLogger('BathymetryTileCacheService');
export class BathymetryTileCacheService {
  private static instance: BathymetryTileCacheService;
  private cacheDir = 'bathymetry-tiles';
  private maxCacheSize = 50 * 1024 * 1024; // 50MB limit

  private constructor() {}

  static getInstance(): BathymetryTileCacheService {
    if (!BathymetryTileCacheService.instance) {
      BathymetryTileCacheService.instance = new BathymetryTileCacheService();
    }
    return BathymetryTileCacheService.instance;
  }

  /**
   * Pre-download tiles for a racing area
   *
   * @param venue - Sailing venue
   * @param racingArea - Racing area polygon
   * @param zoomLevels - Zoom levels to download (default: 8-12)
   */
  async preDownloadTiles(
    venue: SailingVenue,
    racingArea: GeoJSON.Polygon,
    zoomLevels: number[] = [8, 9, 10, 11, 12],
    onProgress?: DownloadProgressCallback
  ): Promise<void> {

    const tiles = this.getTilesForArea(racingArea, zoomLevels);
    logger.debug(`   Total tiles to download: ${tiles.length}`);

    let downloaded = 0;
    const total = tiles.length;

    for (const tile of tiles) {
      try {
        await this.cacheTile(venue, tile);
        downloaded++;

        if (onProgress) {
          onProgress({
            downloaded,
            total,
            percentage: (downloaded / total) * 100,
            currentTile: tile
          });
        }

        // Log progress every 10 tiles
        if (downloaded % 10 === 0) {
          logger.debug(`   Progress: ${downloaded}/${total} (${((downloaded / total) * 100).toFixed(0)}%)`);
        }
      } catch (error) {
        console.error(`   Failed to cache tile z${tile.z}/${tile.x}/${tile.y}:`, error);
      }
    }

  }

  /**
   * Get tile from cache or fetch from network
   */
  async getTile(venue: SailingVenue, tile: TileCoordinate): Promise<Blob | null> {
    // Try cache first
    const cached = await this.getCachedTile(venue, tile);
    if (cached) {
      return cached;
    }

    // Fetch from network
    try {
      const url = this.getTileUrl(venue, tile);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();

      // Cache for future use
      await this.cacheTileBlob(venue, tile, blob);

      return blob;
    } catch (error) {
      console.error(`Failed to fetch tile z${tile.z}/${tile.x}/${tile.y}:`, error);
      return null;
    }
  }

  /**
   * Cache a single tile
   */
  private async cacheTile(venue: SailingVenue, tile: TileCoordinate): Promise<void> {
    const url = this.getTileUrl(venue, tile);

    if (Platform.OS === 'web') {
      await this.cacheWebTile(url, tile);
    } else {
      await this.cacheMobileTile(url, venue, tile);
    }
  }

  /**
   * Cache tile on web (Cache API)
   */
  private async cacheWebTile(url: string, tile: TileCoordinate): Promise<void> {
    if (!('caches' in window)) {
      console.warn('Cache API not available');
      return;
    }

    try {
      const cache = await caches.open(this.cacheDir);
      await cache.add(url);
    } catch (error) {
      console.error('Web cache error:', error);
    }
  }

  /**
   * Cache tile on mobile (expo-file-system)
   */
  private async cacheMobileTile(url: string, venue: SailingVenue, tile: TileCoordinate): Promise<void> {
    try {
      const FileSystem = await import('expo-file-system');

      const dir = `${FileSystem.default.cacheDirectory}${this.cacheDir}/${venue.id}`;
      await FileSystem.default.makeDirectoryAsync(dir, { intermediates: true });

      const filename = `${tile.z}-${tile.x}-${tile.y}.png`;
      const filePath = `${dir}/${filename}`;

      await FileSystem.default.downloadAsync(url, filePath);
    } catch (error) {
      console.error('Mobile cache error:', error);
    }
  }

  /**
   * Get cached tile
   */
  private async getCachedTile(venue: SailingVenue, tile: TileCoordinate): Promise<Blob | null> {
    if (Platform.OS === 'web') {
      return await this.getWebCachedTile(venue, tile);
    } else {
      return await this.getMobileCachedTile(venue, tile);
    }
  }

  /**
   * Get cached tile from web Cache API
   */
  private async getWebCachedTile(venue: SailingVenue, tile: TileCoordinate): Promise<Blob | null> {
    if (!('caches' in window)) {
      return null;
    }

    try {
      const cache = await caches.open(this.cacheDir);
      const url = this.getTileUrl(venue, tile);
      const response = await cache.match(url);

      if (response) {
        return await response.blob();
      }
    } catch (error) {
      console.error('Web cache retrieval error:', error);
    }

    return null;
  }

  /**
   * Get cached tile from mobile file system
   */
  private async getMobileCachedTile(venue: SailingVenue, tile: TileCoordinate): Promise<Blob | null> {
    try {
      const FileSystem = await import('expo-file-system');

      const filename = `${tile.z}-${tile.x}-${tile.y}.png`;
      const filePath = `${FileSystem.default.cacheDirectory}${this.cacheDir}/${venue.id}/${filename}`;

      const info = await FileSystem.default.getInfoAsync(filePath);

      if (info.exists) {
        // Read file as base64 and convert to Blob
        const base64 = await FileSystem.default.readAsStringAsync(filePath, {
          encoding: FileSystem.default.EncodingType.Base64
        });

        // Convert base64 to Blob
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        return new Blob([bytes], { type: 'image/png' });
      }
    } catch (error) {
      console.error('Mobile cache retrieval error:', error);
    }

    return null;
  }

  /**
   * Cache tile blob
   */
  private async cacheTileBlob(venue: SailingVenue, tile: TileCoordinate, blob: Blob): Promise<void> {
    if (Platform.OS === 'web') {
      await this.cacheWebTileBlob(tile, blob);
    } else {
      await this.cacheMobileTileBlob(venue, tile, blob);
    }
  }

  /**
   * Cache tile blob on web
   */
  private async cacheWebTileBlob(tile: TileCoordinate, blob: Blob): Promise<void> {
    // Web caching handled by Cache API during fetch
  }

  /**
   * Cache tile blob on mobile
   */
  private async cacheMobileTileBlob(venue: SailingVenue, tile: TileCoordinate, blob: Blob): Promise<void> {
    // Mobile caching handled during download
  }

  /**
   * Get tile URL based on venue
   */
  private getTileUrl(venue: SailingVenue, tile: TileCoordinate): string {
    const { BathymetryTileService } = require('./BathymetryTileService');
    const service = new BathymetryTileService();
    const sources = service.getBathymetrySources(venue);

    // Get first tile URL from raster source
    const template = sources.raster.tiles[0];

    // Replace placeholders
    return template
      .replace('{z}', tile.z.toString())
      .replace('{x}', tile.x.toString())
      .replace('{y}', tile.y.toString())
      .replace('{bbox-epsg-3857}', this.getBBox(tile));
  }

  /**
   * Get bounding box for WMS tile
   */
  private getBBox(tile: TileCoordinate): string {
    const n = 2 ** tile.z;
    const lon1 = (tile.x / n) * 360 - 180;
    const lat1 = Math.atan(Math.sinh(Math.PI * (1 - (2 * tile.y) / n))) * (180 / Math.PI);
    const lon2 = ((tile.x + 1) / n) * 360 - 180;
    const lat2 = Math.atan(Math.sinh(Math.PI * (1 - (2 * (tile.y + 1)) / n))) * (180 / Math.PI);

    // Convert to Web Mercator (EPSG:3857)
    const merc1 = this.latLonToMercator(lat1, lon1);
    const merc2 = this.latLonToMercator(lat2, lon2);

    return `${merc1.x},${merc1.y},${merc2.x},${merc2.y}`;
  }

  /**
   * Convert lat/lon to Web Mercator
   */
  private latLonToMercator(lat: number, lon: number): { x: number; y: number } {
    const x = (lon * 20037508.34) / 180;
    let y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
    y = (y * 20037508.34) / 180;
    return { x, y };
  }

  /**
   * Calculate tiles needed for a racing area
   */
  private getTilesForArea(racingArea: GeoJSON.Polygon, zoomLevels: number[]): TileCoordinate[] {
    const tiles: TileCoordinate[] = [];
    const coords = racingArea.coordinates[0];

    // Get bounding box
    let minLat = 90,
      maxLat = -90,
      minLon = 180,
      maxLon = -180;

    for (const [lon, lat] of coords) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
    }

    // Calculate tiles for each zoom level
    for (const z of zoomLevels) {
      const minTile = this.latLonToTile(minLat, minLon, z);
      const maxTile = this.latLonToTile(maxLat, maxLon, z);

      for (let x = minTile.x; x <= maxTile.x; x++) {
        for (let y = maxTile.y; y <= minTile.y; y++) {
          tiles.push({ z, x, y });
        }
      }
    }

    return tiles;
  }

  /**
   * Convert lat/lon to tile coordinates
   */
  private latLonToTile(lat: number, lon: number, z: number): { x: number; y: number } {
    const n = 2 ** z;
    const x = Math.floor(((lon + 180) / 360) * n);
    const latRad = (lat * Math.PI) / 180;
    const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);

    return { x, y };
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<CacheStats> {
    if (Platform.OS === 'web') {
      return await this.getWebCacheStats();
    } else {
      return await this.getMobileCacheStats();
    }
  }

  /**
   * Get web cache statistics
   */
  private async getWebCacheStats(): Promise<CacheStats> {
    if (!('caches' in window)) {
      return {
        tileCount: 0,
        totalSize: 0,
        venues: [],
        lastUpdated: new Date()
      };
    }

    try {
      const cache = await caches.open(this.cacheDir);
      const keys = await cache.keys();

      return {
        tileCount: keys.length,
        totalSize: 0, // Size not easily available in Cache API
        venues: [],
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Failed to get web cache stats:', error);
      return {
        tileCount: 0,
        totalSize: 0,
        venues: [],
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Get mobile cache statistics
   */
  private async getMobileCacheStats(): Promise<CacheStats> {
    try {
      const FileSystem = await import('expo-file-system');
      const basePath = `${FileSystem.default.cacheDirectory}${this.cacheDir}`;

      const info = await FileSystem.default.getInfoAsync(basePath);

      if (!info.exists) {
        return {
          tileCount: 0,
          totalSize: 0,
          venues: [],
          lastUpdated: new Date()
        };
      }

      // Count files recursively
      let tileCount = 0;
      let totalSize = 0;
      const venues: string[] = [];

      const venueDirs = await FileSystem.default.readDirectoryAsync(basePath);

      for (const venueId of venueDirs) {
        venues.push(venueId);
        const venuePath = `${basePath}/${venueId}`;
        const files = await FileSystem.default.readDirectoryAsync(venuePath);

        for (const file of files) {
          const filePath = `${venuePath}/${file}`;
          const fileInfo = await FileSystem.default.getInfoAsync(filePath);

          if (fileInfo.exists) {
            tileCount++;
            totalSize += fileInfo.size || 0;
          }
        }
      }

      return {
        tileCount,
        totalSize,
        venues,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Failed to get mobile cache stats:', error);
      return {
        tileCount: 0,
        totalSize: 0,
        venues: [],
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Clear cache for a specific venue
   */
  async clearVenueCache(venue: SailingVenue): Promise<void> {

    if (Platform.OS === 'web') {
      await this.clearWebCache();
    } else {
      await this.clearMobileVenueCache(venue);
    }

  }

  /**
   * Clear all web cache
   */
  private async clearWebCache(): Promise<void> {
    if ('caches' in window) {
      await caches.delete(this.cacheDir);
    }
  }

  /**
   * Clear mobile venue cache
   */
  private async clearMobileVenueCache(venue: SailingVenue): Promise<void> {
    try {
      const FileSystem = await import('expo-file-system');
      const venuePath = `${FileSystem.default.cacheDirectory}${this.cacheDir}/${venue.id}`;

      await FileSystem.default.deleteAsync(venuePath, { idempotent: true });
    } catch (error) {
      console.error('Failed to clear mobile venue cache:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clearAllCache(): Promise<void> {

    if (Platform.OS === 'web') {
      await this.clearWebCache();
    } else {
      await this.clearAllMobileCache();
    }

  }

  /**
   * Clear all mobile cache
   */
  private async clearAllMobileCache(): Promise<void> {
    try {
      const FileSystem = await import('expo-file-system');
      const basePath = `${FileSystem.default.cacheDirectory}${this.cacheDir}`;

      await FileSystem.default.deleteAsync(basePath, { idempotent: true });
    } catch (error) {
      console.error('Failed to clear all mobile cache:', error);
    }
  }
}

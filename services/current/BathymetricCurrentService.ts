/**
 * BathymetricCurrentService
 *
 * Combines bathymetry data with tidal current estimation to produce
 * spatially-varying current visualization that shows how current strength
 * changes based on underwater depth.
 *
 * Physics Principle:
 * Current speed varies inversely with cross-sectional area (flow continuity):
 * - Deeper channels → faster currents (water funneled through)
 * - Shallow areas → slower currents (bottom friction)
 * - Narrows/headlands → accelerated currents
 * - Bays/coves → reduced currents, eddies
 *
 * Formula: V(x,y) = V_base × (D_ref / D(x,y))^α × channelFactor
 */

import { createLogger } from '@/lib/utils/logger';
import { TidalCurrentEstimator, TideExtreme, TidalCurrentEstimate } from '@/services/tides/TidalCurrentEstimator';
import { NOAABathymetryService } from '@/services/bathymetry/NOAABathymetryService';
import type { BoundingBox, BathymetryData } from '@/lib/types/advanced-map';

const logger = createLogger('BathymetricCurrentService');

/**
 * A single point in the depth-modulated current grid
 */
export interface DepthModulatedCurrentPoint {
  lat: number;
  lng: number;
  depth: number;              // meters (negative below sea level)
  baseSpeed: number;          // knots (from TidalCurrentEstimator)
  modulatedSpeed: number;     // knots (depth-adjusted)
  direction: number;          // degrees (0-360, direction current flows TO)
  depthFactor: number;        // multiplier applied
}

/**
 * The complete grid of depth-modulated current data
 */
export interface DepthModulatedCurrentGrid {
  center: { lat: number; lng: number };
  radiusKm: number;
  gridSpacingM: number;
  points: DepthModulatedCurrentPoint[];
  baseEstimate: TidalCurrentEstimate;
  generatedAt: Date;
  minDepth: number;
  maxDepth: number;
  minSpeed: number;
  maxSpeed: number;
}

/**
 * Configuration for depth factor calculation
 */
export interface DepthFactorConfig {
  referenceDepth: number;     // meters (typical racing area depth)
  alpha: number;              // scaling exponent (0.3-0.5)
  minFactor: number;          // minimum multiplier (friction-dominated)
  maxFactor: number;          // maximum multiplier (prevent extremes)
  shallowThreshold: number;   // depth below which friction dominates
}

const DEFAULT_DEPTH_CONFIG: DepthFactorConfig = {
  referenceDepth: 20,         // 20m typical racing area
  alpha: 0.4,                 // balanced scaling
  minFactor: 0.3,             // cap for very shallow areas
  maxFactor: 2.5,             // cap for very deep areas
  shallowThreshold: 2,        // 2m is too shallow - friction dominates
};

/**
 * Cache entry for current grids
 */
interface CacheEntry {
  grid: DepthModulatedCurrentGrid;
  expiresAt: number;
}

/**
 * BathymetricCurrentService
 *
 * Generates depth-modulated current grids for racing areas by combining
 * bathymetry data with tidal current estimation.
 */
export class BathymetricCurrentService {
  private static instance: BathymetricCurrentService | null = null;
  private bathymetryService: NOAABathymetryService;
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.bathymetryService = new NOAABathymetryService();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): BathymetricCurrentService {
    if (!this.instance) {
      this.instance = new BathymetricCurrentService();
    }
    return this.instance;
  }

  /**
   * Generate a depth-modulated current grid for a racing area
   *
   * @param center - Center point of the racing area
   * @param radiusKm - Radius in kilometers (default 2km)
   * @param targetTime - Time for current estimation
   * @param gridSpacingM - Grid spacing in meters (default 100m)
   * @param tideExtremes - Optional tide extremes for better current estimation
   * @param depthConfig - Optional depth factor configuration
   */
  async generateCurrentGrid(
    center: { lat: number; lng: number },
    radiusKm: number = 2,
    targetTime: Date,
    gridSpacingM: number = 100,
    tideExtremes?: { high?: TideExtreme; low?: TideExtreme },
    depthConfig: DepthFactorConfig = DEFAULT_DEPTH_CONFIG
  ): Promise<DepthModulatedCurrentGrid> {
    const cacheKey = this.getCacheKey(center, radiusKm, targetTime);

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      logger.debug('[BathymetricCurrentService] Returning cached grid');
      return cached.grid;
    }

    logger.debug('[BathymetricCurrentService] Generating current grid', {
      center,
      radiusKm,
      targetTime: targetTime.toISOString(),
      gridSpacingM,
    });

    // 1. Calculate bounds from center and radius
    const bounds = this.calculateBounds(center, radiusKm);

    // 2. Fetch bathymetry data
    let bathymetryData: BathymetryData;
    try {
      bathymetryData = await this.bathymetryService.getBathymetryData(bounds, gridSpacingM);
    } catch (error) {
      logger.warn('[BathymetricCurrentService] Failed to fetch bathymetry, using fallback', error);
      bathymetryData = this.generateFallbackBathymetry(bounds, gridSpacingM);
    }

    // 3. Get base current from TidalCurrentEstimator
    const baseEstimate = TidalCurrentEstimator.estimateCurrent(
      center.lat,
      center.lng,
      targetTime,
      tideExtremes?.high || null,
      tideExtremes?.low || null
    );

    logger.debug('[BathymetricCurrentService] Base current estimate', {
      speed: baseEstimate.speed,
      direction: baseEstimate.direction,
      phase: baseEstimate.phase,
    });

    // 4. Generate grid points with depth-modulated currents
    const points = this.generateGridPoints(
      bounds,
      bathymetryData,
      baseEstimate,
      gridSpacingM,
      depthConfig
    );

    // 5. Calculate statistics
    const depths = points.map(p => p.depth);
    const speeds = points.map(p => p.modulatedSpeed);

    const grid: DepthModulatedCurrentGrid = {
      center,
      radiusKm,
      gridSpacingM,
      points,
      baseEstimate,
      generatedAt: new Date(),
      minDepth: Math.min(...depths),
      maxDepth: Math.max(...depths),
      minSpeed: Math.min(...speeds),
      maxSpeed: Math.max(...speeds),
    };

    // Cache the result
    this.cache.set(cacheKey, {
      grid,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });

    logger.debug('[BathymetricCurrentService] Grid generated', {
      pointCount: points.length,
      depthRange: [grid.minDepth, grid.maxDepth],
      speedRange: [grid.minSpeed, grid.maxSpeed],
    });

    return grid;
  }

  /**
   * Calculate depth factor for a given depth
   *
   * Uses the formula: factor = (D_ref / D)^α
   * With safety bounds for extreme depths
   */
  calculateDepthFactor(
    depth: number,
    config: DepthFactorConfig = DEFAULT_DEPTH_CONFIG
  ): number {
    const absDepth = Math.abs(depth);

    // Too shallow - friction dominates
    if (absDepth < config.shallowThreshold) {
      return config.minFactor;
    }

    // Calculate base factor
    const factor = Math.pow(config.referenceDepth / absDepth, config.alpha);

    // Clamp to safe range
    return Math.max(config.minFactor, Math.min(config.maxFactor, factor));
  }

  /**
   * Generate grid points with depth-modulated current values
   */
  private generateGridPoints(
    bounds: BoundingBox,
    bathymetryData: BathymetryData,
    baseEstimate: TidalCurrentEstimate,
    gridSpacingM: number,
    depthConfig: DepthFactorConfig
  ): DepthModulatedCurrentPoint[] {
    const points: DepthModulatedCurrentPoint[] = [];

    const latRange = bounds.northeast.latitude - bounds.southwest.latitude;
    const lngRange = bounds.northeast.longitude - bounds.southwest.longitude;

    // Convert grid spacing from meters to degrees (approximate)
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLng = metersPerDegreeLat * Math.cos(
      ((bounds.northeast.latitude + bounds.southwest.latitude) / 2) * Math.PI / 180
    );

    const latStep = gridSpacingM / metersPerDegreeLat;
    const lngStep = gridSpacingM / metersPerDegreeLng;

    // Generate grid
    for (let lat = bounds.southwest.latitude; lat <= bounds.northeast.latitude; lat += latStep) {
      for (let lng = bounds.southwest.longitude; lng <= bounds.northeast.longitude; lng += lngStep) {
        // Get depth at this point from bathymetry data
        const depth = this.interpolateDepth(lat, lng, bounds, bathymetryData);

        // Calculate depth factor
        const depthFactor = this.calculateDepthFactor(depth, depthConfig);

        // Apply depth modulation to base current
        const modulatedSpeed = Math.round(baseEstimate.speed * depthFactor * 100) / 100;

        // Add small directional variation based on depth gradient (optional enhancement)
        // For now, use base direction - could add gradient-based deflection later
        const direction = baseEstimate.direction;

        points.push({
          lat,
          lng,
          depth,
          baseSpeed: baseEstimate.speed,
          modulatedSpeed,
          direction,
          depthFactor,
        });
      }
    }

    return points;
  }

  /**
   * Interpolate depth at a specific point from bathymetry grid
   */
  private interpolateDepth(
    lat: number,
    lng: number,
    bounds: BoundingBox,
    bathymetryData: BathymetryData
  ): number {
    const latRange = bounds.northeast.latitude - bounds.southwest.latitude;
    const lngRange = bounds.northeast.longitude - bounds.southwest.longitude;

    // Calculate normalized position in grid
    const normalizedLat = (lat - bounds.southwest.latitude) / latRange;
    const normalizedLng = (lng - bounds.southwest.longitude) / lngRange;

    // Calculate grid indices
    const gridX = Math.floor(normalizedLng * bathymetryData.width);
    const gridY = Math.floor(normalizedLat * bathymetryData.height);

    // Clamp to valid range
    const clampedX = Math.max(0, Math.min(bathymetryData.width - 1, gridX));
    const clampedY = Math.max(0, Math.min(bathymetryData.height - 1, gridY));

    // Get depth from elevation grid
    const index = clampedX * bathymetryData.height + clampedY;
    const depth = bathymetryData.elevationGrid[index];

    // Handle no-data values
    if (depth === bathymetryData.noDataValue || isNaN(depth)) {
      return -15; // Default depth if no data
    }

    return depth;
  }

  /**
   * Calculate bounding box from center and radius
   */
  private calculateBounds(
    center: { lat: number; lng: number },
    radiusKm: number
  ): BoundingBox {
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLng = metersPerDegreeLat * Math.cos(center.lat * Math.PI / 180);

    const latDelta = (radiusKm * 1000) / metersPerDegreeLat;
    const lngDelta = (radiusKm * 1000) / metersPerDegreeLng;

    return {
      southwest: {
        latitude: center.lat - latDelta,
        longitude: center.lng - lngDelta,
      },
      northeast: {
        latitude: center.lat + latDelta,
        longitude: center.lng + lngDelta,
      },
    };
  }

  /**
   * Generate fallback bathymetry when API fails
   */
  private generateFallbackBathymetry(
    bounds: BoundingBox,
    resolution: number
  ): BathymetryData {
    const width = 50;
    const height = 50;
    const elevationGrid = new Float32Array(width * height);

    const centerLat = (bounds.southwest.latitude + bounds.northeast.latitude) / 2;
    const centerLng = (bounds.southwest.longitude + bounds.northeast.longitude) / 2;

    // Generate realistic-looking depth variation
    // Deeper in center, shallower at edges with some noise
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        const normalizedX = (i / width) - 0.5;
        const normalizedY = (j / height) - 0.5;
        const distFromCenter = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);

        // Base depth: 10-30m, deeper in center
        const baseDepth = -25 + distFromCenter * 20;

        // Add some noise for natural variation
        const noise = (Math.sin(i * 0.5) * Math.cos(j * 0.7)) * 5;

        elevationGrid[i * height + j] = baseDepth + noise;
      }
    }

    return {
      bounds,
      resolution,
      elevationGrid,
      width,
      height,
      noDataValue: -9999,
      units: 'meters',
    };
  }

  /**
   * Generate cache key for a grid request
   */
  private getCacheKey(
    center: { lat: number; lng: number },
    radius: number,
    time: Date
  ): string {
    const hour = time.getHours();
    return `${center.lat.toFixed(3)}_${center.lng.toFixed(3)}_${radius}_${hour}`;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.debug('[BathymetricCurrentService] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

export default BathymetricCurrentService;

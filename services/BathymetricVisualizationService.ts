/**
 * Bathymetric Visualization Service
 *
 * Provides OnX Maps-level 3D underwater terrain visualization using MapLibre GL JS.
 * Enhances the base BathymetryTileService with hillshade rendering, 3D exaggeration,
 * and professional depth visualization.
 */

import type { SailingVenue } from '@/lib/types/global-venues';
import { BathymetryTileService, type BathymetrySources } from './BathymetryTileService';

/**
 * Bathymetric layer configuration for MapLibre
 */
export interface BathymetricLayerConfig {
  /** Layer ID prefix */
  idPrefix: string;

  /** Show hillshade for 3D depth perception */
  showHillshade: boolean;

  /** Hillshade exaggeration factor (0-1 for subtle, 1-3 for dramatic) */
  hillshadeExaggeration: number;

  /** Show depth color gradient */
  showColorGradient: boolean;

  /** Color gradient opacity */
  colorGradientOpacity: number;

  /** Show depth contour lines */
  showContours: boolean;

  /** Contour line widths by depth */
  contourWidths: {
    shallow: number;    // 0-50m
    medium: number;     // 50-200m
    deep: number;       // 200m+
  };

  /** Show depth labels on contours */
  showDepthLabels: boolean;

  /** Label intervals (show label every N meters) */
  labelIntervals: number[];

  /** 3D terrain exaggeration (for MapLibre's terrain layer) */
  terrainExaggeration: number;
}

/**
 * Default visualization config (OnX-inspired defaults)
 */
export const DEFAULT_BATHYMETRIC_CONFIG: BathymetricLayerConfig = {
  idPrefix: 'bathymetry',
  showHillshade: true,
  hillshadeExaggeration: 1.5,
  showColorGradient: true,
  colorGradientOpacity: 0.6,
  showContours: true,
  contourWidths: {
    shallow: 2,
    medium: 1.5,
    deep: 1
  },
  showDepthLabels: true,
  labelIntervals: [10, 20, 50, 100, 200, 500, 1000],
  terrainExaggeration: 2.0
};

/**
 * Bathymetric Visualization Service
 */
export class BathymetricVisualizationService {
  private bathymetryService: BathymetryTileService;
  private config: BathymetricLayerConfig;

  constructor(config: Partial<BathymetricLayerConfig> = {}) {
    this.bathymetryService = new BathymetryTileService();
    this.config = { ...DEFAULT_BATHYMETRIC_CONFIG, ...config };
  }

  /**
   * Get complete layer stack for bathymetric visualization
   * Returns layers in bottom-to-top rendering order
   */
  getBathymetricLayers(venue: SailingVenue): any[] {
    const sources = this.bathymetryService.getBathymetrySources(venue);
    const layers: any[] = [];

    // Layer 1: Color gradient (base layer)
    if (this.config.showColorGradient) {
      layers.push(this.createColorGradientLayer(sources));
    }

    // Layer 2: Hillshade for 3D depth perception
    if (this.config.showHillshade) {
      layers.push(this.createHillshadeLayer(sources));
    }

    // Layer 3: Depth contours
    if (this.config.showContours) {
      layers.push(this.createContoursLayer(sources));
    }

    // Layer 4: Depth labels
    if (this.config.showDepthLabels) {
      layers.push(this.createDepthLabelsLayer(sources));
    }

    return layers;
  }

  /**
   * Create color gradient layer (base bathymetry colors)
   */
  private createColorGradientLayer(sources: BathymetrySources): any {
    return {
      id: `${this.config.idPrefix}-color-gradient`,
      type: 'raster',
      source: 'bathymetry-raster',
      paint: {
        'raster-opacity': this.config.colorGradientOpacity,
        'raster-resampling': 'linear',
        'raster-fade-duration': 300
      },
      layout: {
        visibility: 'visible'
      }
    };
  }

  /**
   * Create hillshade layer for 3D depth perception
   * Uses raster-dem source type with hillshade rendering
   */
  private createHillshadeLayer(sources: BathymetrySources): any {
    return {
      id: `${this.config.idPrefix}-hillshade`,
      type: 'hillshade',
      source: 'bathymetry-hillshade',
      paint: {
        // Light from northwest at 45° angle (standard cartographic lighting)
        'hillshade-illumination-direction': 315,

        // Exaggeration factor (how dramatic the 3D effect is)
        'hillshade-exaggeration': this.config.hillshadeExaggeration,

        // Shadow intensity
        'hillshade-shadow-color': 'rgba(0, 40, 80, 0.8)',

        // Highlight intensity
        'hillshade-highlight-color': 'rgba(255, 255, 255, 0.3)',

        // Accent color for mid-tones
        'hillshade-accent-color': 'rgba(100, 180, 220, 0.2)'
      },
      layout: {
        visibility: 'visible'
      }
    };
  }

  /**
   * Create depth contours layer
   */
  private createContoursLayer(sources: BathymetrySources): any {
    const { shallow, medium, deep } = this.config.contourWidths;

    return {
      id: `${this.config.idPrefix}-contours`,
      type: 'line',
      source: 'bathymetry-contours',
      paint: {
        'line-color': [
          'case',
          ['>=', ['get', 'depth'], -50], 'rgba(62, 149, 205, 0.8)',  // Shallow: bright blue
          ['>=', ['get', 'depth'], -200], 'rgba(41, 128, 185, 0.7)', // Medium: medium blue
          'rgba(31, 97, 141, 0.6)'                                    // Deep: dark blue
        ],
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, [
            'case',
            ['>=', ['get', 'depth'], -50], shallow * 0.5,
            ['>=', ['get', 'depth'], -200], medium * 0.5,
            deep * 0.5
          ],
          16, [
            'case',
            ['>=', ['get', 'depth'], -50], shallow,
            ['>=', ['get', 'depth'], -200], medium,
            deep
          ]
        ],
        'line-opacity': 0.8
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
        visibility: 'visible'
      }
    };
  }

  /**
   * Create depth labels layer
   */
  private createDepthLabelsLayer(sources: BathymetrySources): any {
    return {
      id: `${this.config.idPrefix}-labels`,
      type: 'symbol',
      source: 'bathymetry-contours',
      filter: this.createLabelFilter(),
      paint: {
        'text-color': 'rgba(62, 149, 205, 1)',
        'text-halo-color': 'rgba(255, 255, 255, 0.9)',
        'text-halo-width': 2,
        'text-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 0,
          12, 1
        ]
      },
      layout: {
        'text-field': [
          'concat',
          ['abs', ['get', 'depth']],
          'm'
        ],
        'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
        'text-size': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 10,
          16, 14
        ],
        'symbol-placement': 'line',
        'text-rotation-alignment': 'map',
        'text-pitch-alignment': 'viewport',
        'text-max-angle': 30,
        visibility: 'visible'
      }
    };
  }

  /**
   * Create filter for showing labels only at key depth intervals
   */
  private createLabelFilter(): any {
    // Show labels only for depths in labelIntervals array
    const conditions = this.config.labelIntervals.flatMap(interval => [
      ['==', ['get', 'depth'], -interval]
    ]);

    return ['any', ...conditions];
  }

  /**
   * Get MapLibre sources for bathymetric visualization
   */
  getBathymetricSources(venue: SailingVenue): Record<string, any> {
    const sources = this.bathymetryService.getBathymetrySources(venue);

    return {
      // Raster tiles for color gradient
      'bathymetry-raster': sources.raster,

      // Raster-DEM for hillshade (same tiles, different source type)
      'bathymetry-hillshade': {
        type: 'raster-dem',
        tiles: sources.raster.tiles,
        tileSize: sources.raster.tileSize,
        encoding: 'terrarium', // Mapbox Terrarium encoding format
        maxzoom: sources.raster.maxzoom || 14
      },

      // GeoJSON contours
      'bathymetry-contours': sources.contours
    };
  }

  /**
   * Get terrain configuration for MapLibre's setTerrain()
   * Enables true 3D terrain rendering
   */
  getTerrainConfig(): any {
    return {
      source: 'bathymetry-hillshade',
      exaggeration: this.config.terrainExaggeration
    };
  }

  /**
   * Update visualization config dynamically
   */
  updateConfig(updates: Partial<BathymetricLayerConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get config presets for different use cases
   */
  static getPreset(preset: 'racing' | 'navigation' | 'analysis' | 'minimal'): Partial<BathymetricLayerConfig> {
    switch (preset) {
      case 'racing':
        // Optimized for race strategy - show shallow waters clearly
        return {
          showHillshade: true,
          hillshadeExaggeration: 2.0,
          showColorGradient: true,
          colorGradientOpacity: 0.7,
          showContours: true,
          showDepthLabels: true,
          labelIntervals: [10, 20, 50],
          terrainExaggeration: 3.0,
          contourWidths: {
            shallow: 3,
            medium: 2,
            deep: 1
          }
        };

      case 'navigation':
        // Clear depth information for safe navigation
        return {
          showHillshade: true,
          hillshadeExaggeration: 1.0,
          showColorGradient: true,
          colorGradientOpacity: 0.8,
          showContours: true,
          showDepthLabels: true,
          labelIntervals: [5, 10, 20, 50, 100],
          terrainExaggeration: 1.5,
          contourWidths: {
            shallow: 2.5,
            medium: 2,
            deep: 1.5
          }
        };

      case 'analysis':
        // Detailed view for studying underwater topography
        return {
          showHillshade: true,
          hillshadeExaggeration: 2.5,
          showColorGradient: true,
          colorGradientOpacity: 0.5,
          showContours: true,
          showDepthLabels: true,
          labelIntervals: [10, 20, 50, 100, 200, 500],
          terrainExaggeration: 3.0,
          contourWidths: {
            shallow: 2,
            medium: 2,
            deep: 2
          }
        };

      case 'minimal':
        // Clean view for race overlays
        return {
          showHillshade: false,
          hillshadeExaggeration: 0,
          showColorGradient: true,
          colorGradientOpacity: 0.3,
          showContours: true,
          showDepthLabels: false,
          labelIntervals: [],
          terrainExaggeration: 0,
          contourWidths: {
            shallow: 1,
            medium: 1,
            deep: 0.5
          }
        };
    }
  }

  /**
   * Check if venue supports advanced bathymetry features
   */
  supportsAdvancedBathymetry(venue: SailingVenue): boolean {
    return this.bathymetryService.hasHighResolutionBathymetry(venue);
  }

  /**
   * Get recommended zoom range for bathymetry visibility
   */
  getRecommendedZoomRange(venue: SailingVenue): { min: number; max: number } {
    return this.bathymetryService.getRecommendedZoomRange(venue);
  }
}

/**
 * Helper: Generate GeoJSON depth contours from raster bathymetry
 * (For future implementation - would use gdal-contour or similar)
 */
export function generateDepthContours(
  rasterUrl: string,
  intervals: number[]
): Promise<GeoJSON.FeatureCollection> {
  // TODO: Implement server-side contour generation
  // For now, we rely on pre-generated GeoJSON files
  throw new Error('Server-side contour generation not yet implemented');
}

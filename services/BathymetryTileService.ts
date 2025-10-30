/**
 * Bathymetry Tile Service
 *
 * Provides venue-specific bathymetry data sources for MapLibre GL.
 * Uses free tile services (GEBCO WMS, EMODnet) and Natural Earth vectors.
 */

import type { SailingVenue } from '@/lib/types/global-venues';

/**
 * Bathymetry raster source configuration
 */
export interface BathymetryRasterSource {
  type: 'raster';
  tiles: string[];
  tileSize: number;
  maxzoom?: number;
  attribution?: string;
}

/**
 * Bathymetry vector source configuration
 */
export interface BathymetryVectorSource {
  type: 'geojson';
  data: string | GeoJSON.FeatureCollection;
}

/**
 * Combined bathymetry sources
 */
export interface BathymetrySources {
  /** WMS/XYZ raster tiles for continuous depth coverage */
  raster: BathymetryRasterSource;

  /** GeoJSON depth contour polygons */
  contours: BathymetryVectorSource;

  /** Recommended visualization */
  recommendation: {
    showRaster: boolean;
    showContours: boolean;
    rasterOpacity: number;
    contourOpacity: number;
  };
}

/**
 * Bathymetry Tile Service
 */
export class BathymetryTileService {
  /**
   * Get bathymetry sources for a venue
   */
  getBathymetrySources(venue: SailingVenue): BathymetrySources {
    // Europe: Use EMODnet for higher resolution
    if (venue.region === 'europe') {
      return this.getEMODnetSources(venue);
    }

    // Global: Use GEBCO WMS
    return this.getGEBCOSources(venue);
  }

  /**
   * GEBCO WMS (Global coverage)
   */
  private getGEBCOSources(venue: SailingVenue): BathymetrySources {
    return {
      raster: {
        type: 'raster',
        tiles: [
          'https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?' +
          'request=GetMap&service=WMS&version=1.3.0&layers=GEBCO_LATEST&' +
          'crs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256&format=image/png'
        ],
        tileSize: 256,
        attribution: '© GEBCO'
      },
      contours: {
        type: 'geojson',
        data: '/assets/bathymetry/geojson/shallow-bathymetry-combined.geojson'
      },
      recommendation: {
        showRaster: true,
        showContours: true,
        rasterOpacity: 0.5,
        contourOpacity: 0.3
      }
    };
  }

  /**
   * EMODnet WMS (European waters)
   */
  private getEMODnetSources(venue: SailingVenue): BathymetrySources {
    return {
      raster: {
        type: 'raster',
        tiles: [
          'https://ows.emodnet-bathymetry.eu/wms?' +
          'service=WMS&version=1.3.0&request=GetMap&layers=mean_atlas_land&' +
          'bbox={bbox-epsg-3857}&width=256&height=256&crs=EPSG:3857&format=image/png'
        ],
        tileSize: 256,
        attribution: '© EMODnet Bathymetry'
      },
      contours: {
        type: 'geojson',
        data: '/assets/bathymetry/geojson/shallow-bathymetry-combined.geojson'
      },
      recommendation: {
        showRaster: true,
        showContours: true,
        rasterOpacity: 0.6, // Higher opacity for European waters (better data)
        contourOpacity: 0.3
      }
    };
  }

  /**
   * Get depth contours only (for offline use)
   */
  getDepthContours(): BathymetryVectorSource {
    return {
      type: 'geojson',
      data: '/assets/bathymetry/geojson/shallow-bathymetry-combined.geojson'
    };
  }

  /**
   * Get specific depth layer
   */
  getDepthLayer(depth: 0 | 200 | 1000): BathymetryVectorSource {
    const fileMap = {
      0: 'sea-level.geojson',
      200: '200m.geojson',
      1000: '1000m.geojson'
    };

    return {
      type: 'geojson',
      data: `/assets/bathymetry/geojson/${fileMap[depth]}`
    };
  }

  /**
   * Get color for depth
   */
  getDepthColor(depth: number): string {
    // Positive = above water (shouldn't happen in bathymetry)
    if (depth >= 0) return '#d4f1f9';

    // Sailing depths (0 to -50m)
    if (depth >= -10) return '#ace0f0';     // Very shallow
    if (depth >= -20) return '#6ec3d8';     // Shallow
    if (depth >= -50) return '#3da5c0';     // Moderate

    // Deeper waters
    if (depth >= -200) return '#2b8aa8';    // Deep
    if (depth >= -1000) return '#1e6f90';   // Very deep
    if (depth >= -3000) return '#0f5278';   // Extremely deep

    return '#083d56';                        // Abyssal
  }

  /**
   * Get MapLibre paint expression for depth-based coloring
   */
  getDepthColorExpression(): any {
    return [
      'case',
      ['>=', ['get', 'depth'], 0], '#d4f1f9',
      ['>=', ['get', 'depth'], -10], '#ace0f0',
      ['>=', ['get', 'depth'], -20], '#6ec3d8',
      ['>=', ['get', 'depth'], -50], '#3da5c0',
      ['>=', ['get', 'depth'], -200], '#2b8aa8',
      ['>=', ['get', 'depth'], -1000], '#1e6f90',
      ['>=', ['get', 'depth'], -3000], '#0f5278',
      '#083d56'
    ];
  }

  /**
   * Check if venue has high-resolution bathymetry available
   */
  hasHighResolutionBathymetry(venue: SailingVenue): boolean {
    // European waters have EMODnet
    if (venue.region === 'europe') return true;

    // US coastal waters have NOAA bathymetry
    if (venue.country === 'US') return true;

    // Other regions use GEBCO (medium resolution)
    return false;
  }

  /**
   * Get recommended zoom level for bathymetry visibility
   */
  getRecommendedZoomRange(venue: SailingVenue): { min: number; max: number } {
    if (this.hasHighResolutionBathymetry(venue)) {
      return { min: 8, max: 16 }; // Show at closer zoom for high-res data
    }

    return { min: 6, max: 14 }; // Show earlier for lower-res data
  }
}

/**
 * Get default bathymetry color scale for legends
 */
export function getBathymetryColorScale(): Array<{ depth: number; color: string; label: string }> {
  return [
    { depth: 0, color: '#d4f1f9', label: 'Sea Level' },
    { depth: -10, color: '#ace0f0', label: '10m' },
    { depth: -20, color: '#6ec3d8', label: '20m' },
    { depth: -50, color: '#3da5c0', label: '50m' },
    { depth: -200, color: '#2b8aa8', label: '200m' },
    { depth: -1000, color: '#1e6f90', label: '1000m' },
    { depth: -3000, color: '#0f5278', label: '3000m' },
    { depth: -10000, color: '#083d56', label: '10000m+' }
  ];
}

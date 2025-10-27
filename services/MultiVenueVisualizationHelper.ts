/**
 * Multi-Venue Visualization Helper
 *
 * Generates MapLibre layers for visualizing yacht clubs with multiple racing areas.
 * Example: RHKYC has 3 locations (Kellett Island, Middle Island, Clearwater Bay).
 *
 * Features:
 * - Venue marker clustering
 * - Racing area boundaries
 * - Connection lines between venues
 * - Active area highlighting
 */

import type { SailingVenue } from '../types/venues';

/**
 * Racing area location
 */
export interface RacingArea {
  name: string;
  coordinates: [number, number]; // [lng, lat]
  description: string;
  type: 'headquarters' | 'offshore' | 'sheltered' | 'harbor';
  courses?: string[]; // e.g., ['Windward/Leeward', 'Triangle']
}

/**
 * Multi-venue club configuration
 */
export interface MultiVenueClub {
  clubName: string;
  headquarters: RacingArea;
  additionalAreas: RacingArea[];
  color: string; // Brand color for visualization
}

/**
 * Multi-Venue Visualization Helper
 */
export class MultiVenueVisualizationHelper {
  /**
   * Get RHKYC multi-venue configuration
   */
  static getRHKYCConfiguration(): MultiVenueClub {
    return {
      clubName: 'Royal Hong Kong Yacht Club',
      headquarters: {
        name: 'Kellett Island',
        coordinates: [114.1833, 22.2833],
        description: 'Club headquarters and harbor racing',
        type: 'headquarters',
        courses: ['Harbor Racing', 'Wednesday Series']
      },
      additionalAreas: [
        {
          name: 'Middle Island',
          coordinates: [114.3025, 22.2847],
          description: 'Offshore racing area east of Hong Kong Island',
          type: 'offshore',
          courses: ['Windward/Leeward', 'Round the Island']
        },
        {
          name: 'Clearwater Bay',
          coordinates: [114.3167, 22.2667],
          description: 'Sheltered bay racing area with Dragon course',
          type: 'sheltered',
          courses: ['Dragon Course', 'Dinghy Racing']
        }
      ],
      color: '#1E3A8A' // RHKYC royal blue
    };
  }

  /**
   * Generate GeoJSON for all racing areas
   */
  static generateRacingAreasGeoJSON(club: MultiVenueClub): GeoJSON.FeatureCollection {
    const allAreas = [club.headquarters, ...club.additionalAreas];

    const features = allAreas.map(area => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: area.coordinates
      },
      properties: {
        name: area.name,
        description: area.description,
        type: area.type,
        courses: area.courses || [],
        clubName: club.clubName,
        color: club.color,
        isHeadquarters: area === club.headquarters
      }
    }));

    return {
      type: 'FeatureCollection',
      features
    };
  }

  /**
   * Generate connection lines between racing areas
   */
  static generateConnectionLines(club: MultiVenueClub): GeoJSON.FeatureCollection {
    const hqCoords = club.headquarters.coordinates;

    const features = club.additionalAreas.map(area => ({
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: [hqCoords, area.coordinates]
      },
      properties: {
        from: club.headquarters.name,
        to: area.name,
        clubName: club.clubName,
        color: club.color
      }
    }));

    return {
      type: 'FeatureCollection',
      features
    };
  }

  /**
   * Generate MapLibre layers for multi-venue visualization
   */
  static getMultiVenueLayers(club: MultiVenueClub, activeArea?: string): any[] {
    const layers: any[] = [];
    const racingAreasGeoJSON = this.generateRacingAreasGeoJSON(club);
    const connectionLinesGeoJSON = this.generateConnectionLines(club);

    // Connection lines (dashed lines between areas)
    layers.push({
      id: 'multi-venue-connections',
      type: 'line',
      source: {
        type: 'geojson',
        data: connectionLinesGeoJSON
      },
      paint: {
        'line-color': club.color,
        'line-width': 2,
        'line-dasharray': [2, 2],
        'line-opacity': 0.5
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round'
      }
    });

    // Racing area circles
    layers.push({
      id: 'multi-venue-areas',
      type: 'circle',
      source: {
        type: 'geojson',
        data: racingAreasGeoJSON
      },
      paint: {
        'circle-radius': [
          'case',
          ['get', 'isHeadquarters'], 16, // HQ larger
          ['==', ['get', 'name'], activeArea || ''], 14, // Active area highlighted
          12 // Other areas
        ],
        'circle-color': club.color,
        'circle-opacity': [
          'case',
          ['==', ['get', 'name'], activeArea || ''], 1.0,
          0.7
        ],
        'circle-stroke-width': [
          'case',
          ['get', 'isHeadquarters'], 3,
          2
        ],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-opacity': 1.0
      }
    });

    // Icons for area types
    layers.push({
      id: 'multi-venue-icons',
      type: 'symbol',
      source: {
        type: 'geojson',
        data: racingAreasGeoJSON
      },
      layout: {
        'icon-image': [
          'match',
          ['get', 'type'],
          'headquarters', 'home',
          'offshore', 'anchor',
          'sheltered', 'shield',
          'harbor', 'boat',
          'circle'
        ],
        'icon-size': 0.8,
        'icon-allow-overlap': true,
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 12,
        'text-offset': [0, 2],
        'text-anchor': 'top'
      },
      paint: {
        'icon-color': '#ffffff',
        'text-color': '#333333',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2
      }
    });

    // Area descriptions (shown on hover/click)
    layers.push({
      id: 'multi-venue-descriptions',
      type: 'symbol',
      source: {
        type: 'geojson',
        data: racingAreasGeoJSON
      },
      layout: {
        'text-field': ['get', 'description'],
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
        'text-size': 10,
        'text-offset': [0, 3.5],
        'text-anchor': 'top',
        'text-max-width': 15
      },
      paint: {
        'text-color': '#666666',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2,
        'text-opacity': [
          'case',
          ['==', ['get', 'name'], activeArea || ''], 1.0,
          0.6
        ]
      },
      minzoom: 11
    });

    return layers;
  }

  /**
   * Generate boundary polygon for racing area (approximate circle)
   */
  static generateRacingAreaBoundary(
    area: RacingArea,
    radiusKm: number = 3
  ): GeoJSON.Feature<GeoJSON.Polygon> {
    const [lng, lat] = area.coordinates;
    const points: [number, number][] = [];

    // Generate circle with 32 points
    for (let i = 0; i <= 32; i++) {
      const angle = (i * 360) / 32;
      const angleRad = (angle * Math.PI) / 180;

      // Convert km to degrees (approximate)
      const latOffset = (radiusKm / 111) * Math.cos(angleRad);
      const lngOffset = (radiusKm / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angleRad);

      points.push([lng + lngOffset, lat + latOffset]);
    }

    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [points]
      },
      properties: {
        name: area.name,
        type: area.type,
        radiusKm
      }
    };
  }

  /**
   * Get boundary layers for racing areas
   */
  static getRacingAreaBoundaries(club: MultiVenueClub): any[] {
    const allAreas = [club.headquarters, ...club.additionalAreas];

    const boundariesGeoJSON: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: allAreas.map(area => this.generateRacingAreaBoundary(area, 3))
    };

    return [
      {
        id: 'racing-area-boundaries',
        type: 'fill',
        source: {
          type: 'geojson',
          data: boundariesGeoJSON
        },
        paint: {
          'fill-color': club.color,
          'fill-opacity': 0.1
        }
      },
      {
        id: 'racing-area-boundary-lines',
        type: 'line',
        source: {
          type: 'geojson',
          data: boundariesGeoJSON
        },
        paint: {
          'line-color': club.color,
          'line-width': 1.5,
          'line-opacity': 0.5,
          'line-dasharray': [4, 2]
        }
      }
    ];
  }

  /**
   * Calculate optimal camera view for all racing areas
   */
  static getOptimalCameraView(club: MultiVenueClub): {
    center: [number, number];
    zoom: number;
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  } {
    const allAreas = [club.headquarters, ...club.additionalAreas];
    const coords = allAreas.map(area => area.coordinates);

    // Calculate bounds
    const lngs = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);

    const west = Math.min(...lngs);
    const east = Math.max(...lngs);
    const south = Math.min(...lats);
    const north = Math.max(...lats);

    // Calculate center
    const centerLng = (west + east) / 2;
    const centerLat = (south + north) / 2;

    // Calculate zoom to fit all areas
    const lngDelta = east - west;
    const latDelta = north - south;
    const maxDelta = Math.max(lngDelta, latDelta);

    // Rough zoom calculation (adjust as needed)
    let zoom = 10;
    if (maxDelta < 0.1) zoom = 12;
    else if (maxDelta < 0.2) zoom = 11;
    else if (maxDelta < 0.5) zoom = 10;
    else zoom = 9;

    return {
      center: [centerLng, centerLat],
      zoom,
      bounds: { north, south, east, west }
    };
  }
}

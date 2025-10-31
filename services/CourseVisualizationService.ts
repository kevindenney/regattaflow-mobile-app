// @ts-nocheck

/**
 * Course Visualization Service
 *
 * Generates MapLibre-compatible GeoJSON for 3D race course visualization
 * Transforms database course marks into interactive map layers
 *
 * See: plans/race-strategy-data-gathering-ux.md
 */

import {
  CourseMark,
  CourseGeoJSON,
  CourseFeature,
  PointGeometry,
  PolygonGeometry,
  MarkType,
  CourseConfiguration
} from '../types/raceEvents';

export class CourseVisualizationService {
  /**
   * Generate complete GeoJSON for race course
   */
  static generateCourseGeoJSON(params: {
    marks: CourseMark[];
    racingAreaBoundary?: { coordinates: number[][][] };
    courseConfiguration?: CourseConfiguration;
  }): CourseGeoJSON {
    const features: CourseFeature[] = [];

    // Add racing area boundary if provided
    if (params.racingAreaBoundary) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: params.racingAreaBoundary.coordinates
        } as PolygonGeometry,
        properties: {
          type: 'racing_area',
          name: 'Racing Area',
          venue_id: ''
        }
      });
    }

    // Add course marks
    params.marks
      .filter(mark => mark.position) // Only marks with GPS coordinates
      .sort((a, b) => (a.sequence_number || 999) - (b.sequence_number || 999))
      .forEach((mark, index) => {
        const coords = this.extractCoordinates(mark.position);
        if (coords) {
          features.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [coords.lng, coords.lat]
            } as PointGeometry,
            properties: {
              id: mark.id,
              name: mark.mark_name,
              type: mark.mark_type,
              rounding: mark.rounding_direction || undefined,
              sequence: mark.sequence_number || index + 1,
              color: mark.mark_color || undefined,
              confidence: mark.confidence_score || undefined
            }
          });
        }
      });

    // Add course lines connecting marks in sequence
    const courseLineFeature = this.generateCourseLine(params.marks, params.courseConfiguration);
    if (courseLineFeature) {
      features.push(courseLineFeature);
    }

    return {
      type: 'FeatureCollection',
      features
    };
  }

  /**
   * Generate course line connecting marks
   */
  private static generateCourseLine(
    marks: CourseMark[],
    courseConfiguration?: CourseConfiguration
  ): CourseFeature | null {
    const sortedMarks = marks
      .filter(mark => mark.position && mark.sequence_number)
      .sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0));

    if (sortedMarks.length < 2) {
      return null;
    }

    const coordinates: [number, number][] = sortedMarks.map(mark => {
      const coords = this.extractCoordinates(mark.position);
      return [coords!.lng, coords!.lat];
    }).filter(coord => coord[0] && coord[1]);

    if (coordinates.length < 2) {
      return null;
    }

    // For windward-leeward, add return legs
    if (courseConfiguration === CourseConfiguration.WINDWARD_LEEWARD) {
      // Course is typically: Start -> Windward -> Leeward -> Windward -> Finish
      // Add connections to show multiple laps
      const windwardCoords = coordinates[1];
      const leewardCoords = coordinates[2];

      if (windwardCoords && leewardCoords) {
        // Add second upwind leg
        coordinates.push(windwardCoords);
      }
    }

    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates
      } as any,
      properties: {
        type: 'course_line',
        courseType: courseConfiguration || CourseConfiguration.RANDOM,
        length_nm: this.calculateCourseLength(coordinates)
      } as any
    };
  }

  /**
   * Extract lat/lng from PostGIS GEOGRAPHY(POINT)
   */
  private static extractCoordinates(position: any): { lat: number; lng: number } | null {
    if (!position) return null;

    // If position is already an object with lat/lng
    if (typeof position === 'object' && 'lat' in position && 'lng' in position) {
      return { lat: position.lat, lng: position.lng };
    }

    // If position is a PostGIS point string (e.g., "POINT(lng lat)")
    if (typeof position === 'string') {
      const match = position.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
      if (match) {
        return {
          lng: parseFloat(match[1]),
          lat: parseFloat(match[2])
        };
      }
    }

    // If position is GeoJSON
    if (typeof position === 'object' && position.type === 'Point' && Array.isArray(position.coordinates)) {
      return {
        lng: position.coordinates[0],
        lat: position.coordinates[1]
      };
    }

    return null;
  }

  /**
   * Calculate total course length in nautical miles
   */
  private static calculateCourseLength(coordinates: [number, number][]): number {
    let totalDistance = 0;

    for (let i = 0; i < coordinates.length - 1; i++) {
      const from = coordinates[i];
      const to = coordinates[i + 1];
      totalDistance += this.haversineDistance(from[1], from[0], to[1], to[0]);
    }

    return Math.round(totalDistance * 100) / 100; // Round to 2 decimals
  }

  /**
   * Calculate distance between two points (Haversine formula)
   * Returns distance in nautical miles
   */
  private static haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3440.065; // Earth's radius in nautical miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private static toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Calculate optimal map bounds for marks
   */
  static calculateMapBounds(marks: CourseMark[]): {
    north: number;
    south: number;
    east: number;
    west: number;
    center: { lat: number; lng: number };
    zoom: number;
  } | null {
    const coordinates = marks
      .map(mark => this.extractCoordinates(mark.position))
      .filter((coord): coord is { lat: number; lng: number } => coord !== null);

    if (coordinates.length === 0) {
      return null;
    }

    const lats = coordinates.map(c => c.lat);
    const lngs = coordinates.map(c => c.lng);

    const north = Math.max(...lats);
    const south = Math.min(...lats);
    const east = Math.max(...lngs);
    const west = Math.min(...lngs);

    const center = {
      lat: (north + south) / 2,
      lng: (east + west) / 2
    };

    const zoom = this.calculateOptimalZoom(north, south, east, west);

    return { north, south, east, west, center, zoom };
  }

  /**
   * Calculate optimal zoom level for map bounds
   */
  private static calculateOptimalZoom(north: number, south: number, east: number, west: number): number {
    const latDiff = north - south;
    const lngDiff = east - west;
    const maxDiff = Math.max(latDiff, lngDiff);

    // Zoom levels for different course sizes
    if (maxDiff > 1) return 10; // Large coastal course
    if (maxDiff > 0.5) return 11; // Large bay course
    if (maxDiff > 0.1) return 13; // Medium course
    if (maxDiff > 0.05) return 14; // Typical windward-leeward
    if (maxDiff > 0.02) return 15; // Small course
    return 16; // Very small or tight course
  }

  /**
   * Generate MapLibre style layers for course visualization
   */
  static generateStyleLayers(): any[] {
    return [
      // Racing area boundary
      {
        id: 'racing-area-fill',
        type: 'fill',
        source: 'course',
        filter: ['==', ['get', 'type'], 'racing_area'],
        paint: {
          'fill-color': '#0080ff',
          'fill-opacity': 0.1
        }
      },
      {
        id: 'racing-area-outline',
        type: 'line',
        source: 'course',
        filter: ['==', ['get', 'type'], 'racing_area'],
        paint: {
          'line-color': '#0080ff',
          'line-width': 2,
          'line-dasharray': [4, 2]
        }
      },

      // Course line
      {
        id: 'course-line',
        type: 'line',
        source: 'course',
        filter: ['==', ['get', 'type'], 'course_line'],
        paint: {
          'line-color': '#ff6b00',
          'line-width': 3,
          'line-dasharray': [2, 1]
        }
      },

      // Course marks (circles)
      {
        id: 'course-marks',
        type: 'circle',
        source: 'course',
        filter: ['!=', ['get', 'type'], 'racing_area'],
        paint: {
          'circle-radius': [
            'case',
            ['==', ['get', 'type'], 'start'], 12,
            ['==', ['get', 'type'], 'finish'], 12,
            10
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'type'], 'start'], '#00ff00',
            ['==', ['get', 'type'], 'finish'], '#ff0000',
            ['==', ['get', 'type'], 'windward'], '#ffff00',
            ['==', ['get', 'type'], 'leeward'], '#00ffff',
            '#ff6b00'
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
          'circle-opacity': 0.8
        }
      },

      // Mark labels
      {
        id: 'mark-labels',
        type: 'symbol',
        source: 'course',
        filter: ['!=', ['get', 'type'], 'racing_area'],
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-offset': [0, 1.5],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#000000',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      }
    ];
  }

  /**
   * Generate mark icon based on type
   */
  static getMarkIcon(markType: MarkType): string {
    const icons: Record<MarkType, string> = {
      [MarkType.START]: '🟢',
      [MarkType.FINISH]: '🔴',
      [MarkType.WINDWARD]: '⬆️',
      [MarkType.LEEWARD]: '⬇️',
      [MarkType.GATE_LEFT]: '◀️',
      [MarkType.GATE_RIGHT]: '▶️',
      [MarkType.OFFSET]: '◆',
      [MarkType.COMMITTEE_BOAT]: '⛵',
      [MarkType.PIN]: '📍'
    };

    return icons[markType] || '●';
  }

  /**
   * Convert polygon coordinates for racing area drawing
   */
  static polygonToCoordinates(polygon: any): { lat: number; lng: number }[] {
    if (!polygon || !polygon.coordinates || !polygon.coordinates[0]) {
      return [];
    }

    return polygon.coordinates[0].map((coord: number[]) => ({
      lng: coord[0],
      lat: coord[1]
    }));
  }

  /**
   * Convert coordinates array to PostGIS GEOGRAPHY(POLYGON) string
   */
  static coordinatesToPolygon(coordinates: { lat: number; lng: number }[]): string {
    if (coordinates.length < 3) {
      throw new Error('Polygon requires at least 3 points');
    }

    // Ensure polygon is closed (first point = last point)
    const closed = [...coordinates];
    const first = closed[0];
    const last = closed[closed.length - 1];

    if (first.lat !== last.lat || first.lng !== last.lng) {
      closed.push(first);
    }

    const coordStr = closed.map(c => `${c.lng} ${c.lat}`).join(', ');
    return `POLYGON((${coordStr}))`;
  }
}

export default CourseVisualizationService;

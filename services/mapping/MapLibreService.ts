/**
 * MapLibre GL Service
 * Marine-grade 3D mapping for professional sailing applications
 * OnX Maps inspired 3D race course visualization and tactical planning
 */

import maplibregl from 'maplibre-gl';
import { Platform } from 'react-native';

interface RaceMark {
  id: string;
  name: string;
  type: 'start' | 'windward' | 'leeward' | 'gate' | 'finish';
  lat: number;
  lng: number;
  elevation?: number;
  description?: string;
}

interface RaceCourse {
  id: string;
  name: string;
  type: 'windward_leeward' | 'triangle' | 'olympic' | 'custom';
  marks: RaceMark[];
  instructions: string;
  safety_notes: string[];
}

interface MapStyle {
  name: string;
  url: string;
  description: string;
  optimizedFor: 'racing' | 'navigation' | 'tactical' | 'satellite';
}

interface WeatherOverlay {
  type: 'wind' | 'current' | 'tide' | 'pressure';
  data: any;
  opacity: number;
  visible: boolean;
}

interface TacticalLayer {
  type: 'wind_shifts' | 'current_lines' | 'depth_contours' | 'hazards' | 'racing_lines';
  data: any;
  style: any;
  visible: boolean;
}

/**
 * MapLibre GL Service for Professional Sailing
 * Provides 3D mapping capabilities for race courses and tactical planning
 */
export class MapLibreService {
  private static instance: MapLibreService;
  private map: maplibregl.Map | null = null;
  private raceCourse: RaceCourse | null = null;
  private weatherOverlays: WeatherOverlay[] = [];
  private tacticalLayers: TacticalLayer[] = [];
  private isInitialized = false;

  // Marine-optimized map styles
  private mapStyles: MapStyle[] = [
    {
      name: 'Sailing Tactical',
      url: 'https://tiles.stadiamaps.com/styles/alidade_smooth.json',
      description: 'High contrast for tactical planning',
      optimizedFor: 'tactical',
    },
    {
      name: 'Marine Navigation',
      url: 'https://tiles.stadiamaps.com/styles/outdoors.json',
      description: 'Nautical chart style with depth info',
      optimizedFor: 'navigation',
    },
    {
      name: 'Satellite Racing',
      url: 'https://tiles.stadiamaps.com/styles/satellite.json',
      description: 'Satellite imagery for course visualization',
      optimizedFor: 'satellite',
    },
    {
      name: 'Racing Course',
      url: 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json',
      description: 'Clean design for race course display',
      optimizedFor: 'racing',
    },
  ];

  static getInstance(): MapLibreService {
    if (!MapLibreService.instance) {
      MapLibreService.instance = new MapLibreService();
    }
    return MapLibreService.instance;
  }

  /**
   * Initialize MapLibre GL with marine-optimized settings
   */
  async initializeMap(container: string | HTMLElement, options: {
    center: [number, number];
    zoom: number;
    style?: string;
    bearing?: number;
    pitch?: number;
  }): Promise<maplibregl.Map> {
    try {

      // Default to sailing tactical style
      const defaultStyle = this.mapStyles.find(s => s.optimizedFor === 'tactical')?.url ||
                          this.mapStyles[0].url;

      // Marine-optimized map configuration
      this.map = new maplibregl.Map({
        container,
        style: options.style || defaultStyle,
        center: options.center,
        zoom: options.zoom,
        bearing: options.bearing || 0,
        pitch: options.pitch || 45, // 3D perspective for better course visualization
        antialias: true,
        maxZoom: 20,
        minZoom: 8,
        attributionControl: false,
        logoPosition: 'bottom-right',
      });

      // Add marine-specific controls
      this.map.addControl(new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true,
      }), 'top-right');

      this.map.addControl(new maplibregl.ScaleControl({
        maxWidth: 100,
        unit: 'nautical', // Nautical miles for sailing
      }), 'bottom-left');

      this.map.addControl(new maplibregl.FullscreenControl(), 'top-right');

      // Wait for map to load
      await new Promise<void>((resolve) => {
        this.map!.on('load', () => {
          this.isInitialized = true;

          resolve();
        });
      });

      // Add marine-specific layers
      await this.setupMarineLayers();

      return this.map;

    } catch (error) {

      throw error;
    }
  }

  /**
   * Setup marine-specific map layers
   */
  private async setupMarineLayers(): Promise<void> {
    if (!this.map || !this.isInitialized) return;

    try {
      // Add water depth contours (if available)
      this.map.addSource('depth-contours', {
        type: 'vector',
        url: 'https://example.com/marine-charts/{z}/{x}/{y}.pbf', // Replace with actual marine chart tiles
      });

      // Add maritime boundaries
      this.map.addSource('maritime-boundaries', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [], // Would load actual maritime boundary data
        },
      });

      // Add wind and current visualization layers (initially empty)
      this.map.addSource('wind-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      this.map.addSource('current-data', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

    } catch (error) {

    }
  }

  /**
   * Display race course with 3D visualization
   */
  async displayRaceCourse(course: RaceCourse): Promise<void> {
    if (!this.map || !this.isInitialized) {
      throw new Error('Map not initialized');
    }

    try {

      this.raceCourse = course;

      // Clear existing race course data
      await this.clearRaceCourse();

      // Add race marks
      await this.addRaceMarks(course.marks);

      // Add course lines
      await this.addCourseLines(course.marks);

      // Add start/finish lines
      await this.addStartFinishLines(course.marks);

      // Add 3D course visualization
      await this.add3DCourseVisualization(course);

      // Fit map to course bounds
      this.fitToCourse(course.marks);

    } catch (error) {

      throw error;
    }
  }

  /**
   * Add race marks with 3D visualization
   */
  private async addRaceMarks(marks: RaceMark[]): Promise<void> {
    if (!this.map) return;

    // Create GeoJSON for race marks
    const markFeatures = marks.map(mark => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [mark.lng, mark.lat, mark.elevation || 0],
      },
      properties: {
        id: mark.id,
        name: mark.name,
        type: mark.type,
        description: mark.description || '',
      },
    }));

    // Add race marks source
    this.map.addSource('race-marks', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: markFeatures,
      },
    });

    // Add 3D mark visualization
    this.map.addLayer({
      id: 'race-marks-3d',
      type: 'fill-extrusion',
      source: 'race-marks',
      paint: {
        'fill-extrusion-color': [
          'case',
          ['==', ['get', 'type'], 'start'], '#22c55e',
          ['==', ['get', 'type'], 'finish'], '#ef4444',
          ['==', ['get', 'type'], 'windward'], '#0ea5e9',
          ['==', ['get', 'type'], 'leeward'], '#f59e0b',
          '#8b5cf6', // Default for gates
        ],
        'fill-extrusion-height': 50, // 50 meters tall for visibility
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.8,
      },
    });

    // Add mark labels
    this.map.addLayer({
      id: 'race-marks-labels',
      type: 'symbol',
      source: 'race-marks',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 14,
        'text-offset': [0, -3],
        'text-anchor': 'bottom',
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 2,
      },
    });

    // Add mark icons
    this.map.addLayer({
      id: 'race-marks-icons',
      type: 'symbol',
      source: 'race-marks',
      layout: {
        'icon-image': [
          'case',
          ['==', ['get', 'type'], 'start'], 'start-mark',
          ['==', ['get', 'type'], 'finish'], 'finish-mark',
          ['==', ['get', 'type'], 'windward'], 'windward-mark',
          ['==', ['get', 'type'], 'leeward'], 'leeward-mark',
          'gate-mark', // Default for gates
        ],
        'icon-size': 1.2,
        'icon-allow-overlap': true,
      },
    });
  }

  /**
   * Add course lines connecting marks
   */
  private async addCourseLines(marks: RaceMark[]): Promise<void> {
    if (!this.map || marks.length < 2) return;

    // Create course line coordinates
    const coordinates = marks.map(mark => [mark.lng, mark.lat]);

    // Add course line source
    this.map.addSource('course-lines', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates,
        },
        properties: {},
      },
    });

    // Add course line layer
    this.map.addLayer({
      id: 'course-lines',
      type: 'line',
      source: 'course-lines',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#0ea5e9',
        'line-width': 3,
        'line-opacity': 0.8,
        'line-dasharray': [2, 2],
      },
    });
  }

  /**
   * Add start and finish line visualization
   */
  private async addStartFinishLines(marks: RaceMark[]): Promise<void> {
    if (!this.map) return;

    const startMark = marks.find(m => m.type === 'start');
    const finishMark = marks.find(m => m.type === 'finish');

    if (startMark) {
      // Create start line (perpendicular to wind direction)
      const startLineCoords = this.createStartLine(startMark, 100); // 100m line

      this.map.addSource('start-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: startLineCoords,
          },
          properties: { type: 'start' },
        },
      });

      this.map.addLayer({
        id: 'start-line',
        type: 'line',
        source: 'start-line',
        paint: {
          'line-color': '#22c55e',
          'line-width': 5,
          'line-opacity': 0.9,
        },
      });
    }

    if (finishMark) {
      // Create finish line
      const finishLineCoords = this.createStartLine(finishMark, 100);

      this.map.addSource('finish-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: finishLineCoords,
          },
          properties: { type: 'finish' },
        },
      });

      this.map.addLayer({
        id: 'finish-line',
        type: 'line',
        source: 'finish-line',
        paint: {
          'line-color': '#ef4444',
          'line-width': 5,
          'line-opacity': 0.9,
        },
      });
    }
  }

  /**
   * Add 3D course visualization with tactical information
   */
  private async add3DCourseVisualization(course: RaceCourse): Promise<void> {
    if (!this.map) return;

    // Add 3D course area visualization
    const courseBounds = this.calculateCourseBounds(course.marks);

    this.map.addSource('course-area', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [courseBounds],
        },
        properties: {
          courseName: course.name,
          courseType: course.type,
        },
      },
    });

    this.map.addLayer({
      id: 'course-area-3d',
      type: 'fill-extrusion',
      source: 'course-area',
      paint: {
        'fill-extrusion-color': 'rgba(14, 165, 233, 0.1)',
        'fill-extrusion-height': 10,
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.3,
      },
    });
  }

  /**
   * Add weather overlay (wind, current, etc.)
   */
  async addWeatherOverlay(overlay: WeatherOverlay): Promise<void> {
    if (!this.map || !this.isInitialized) return;

    try {

      const sourceId = `weather-${overlay.type}`;
      const layerId = `weather-${overlay.type}-layer`;

      // Add weather data source
      this.map.addSource(sourceId, {
        type: 'geojson',
        data: overlay.data,
      });

      // Add visualization layer based on weather type
      switch (overlay.type) {
        case 'wind':
          this.map.addLayer({
            id: layerId,
            type: 'symbol',
            source: sourceId,
            layout: {
              'icon-image': 'wind-arrow',
              'icon-size': 0.8,
              'icon-rotate': ['get', 'direction'],
              'icon-allow-overlap': true,
            },
            paint: {
              'icon-opacity': overlay.opacity,
            },
          });
          break;

        case 'current':
          this.map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': '#06b6d4',
              'line-width': 2,
              'line-opacity': overlay.opacity,
            },
          });
          break;

        case 'tide':
          this.map.addLayer({
            id: layerId,
            type: 'fill',
            source: sourceId,
            paint: {
              'fill-color': '#3b82f6',
              'fill-opacity': overlay.opacity * 0.3,
            },
          });
          break;
      }

      this.weatherOverlays.push(overlay);

    } catch (error) {
    }
  }

  /**
   * Add tactical layer (racing lines, wind shifts, etc.)
   */
  async addTacticalLayer(layer: TacticalLayer): Promise<void> {
    if (!this.map || !this.isInitialized) return;

    try {

      const sourceId = `tactical-${layer.type}`;
      const layerId = `tactical-${layer.type}-layer`;

      this.map.addSource(sourceId, {
        type: 'geojson',
        data: layer.data,
      });

      this.map.addLayer({
        id: layerId,
        ...layer.style,
        source: sourceId,
      });

      this.tacticalLayers.push(layer);

    } catch (error) {
    }
  }

  /**
   * Switch map style
   */
  async switchMapStyle(styleType: MapStyle['optimizedFor']): Promise<void> {
    if (!this.map) return;

    const style = this.mapStyles.find(s => s.optimizedFor === styleType);
    if (!style) return;

    try {

      this.map.setStyle(style.url);

      // Re-add layers after style change
      this.map.once('styledata', async () => {
        if (this.raceCourse) {
          await this.displayRaceCourse(this.raceCourse);
        }

        // Re-add weather overlays
        for (const overlay of this.weatherOverlays) {
          await this.addWeatherOverlay(overlay);
        }

        // Re-add tactical layers
        for (const layer of this.tacticalLayers) {
          await this.addTacticalLayer(layer);
        }
      });

    } catch (error) {

    }
  }

  /**
   * Utility methods
   */
  private createStartLine(mark: RaceMark, lengthMeters: number): [number, number][] {
    // Create a perpendicular line for start/finish
    const offset = lengthMeters / 111320; // Convert meters to degrees (approximate)
    return [
      [mark.lng - offset, mark.lat],
      [mark.lng + offset, mark.lat],
    ];
  }

  private calculateCourseBounds(marks: RaceMark[]): [number, number][] {
    if (marks.length === 0) return [];

    const lats = marks.map(m => m.lat);
    const lngs = marks.map(m => m.lng);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const padding = 0.001; // Add padding around course

    return [
      [minLng - padding, minLat - padding],
      [maxLng + padding, minLat - padding],
      [maxLng + padding, maxLat + padding],
      [minLng - padding, maxLat + padding],
      [minLng - padding, minLat - padding],
    ];
  }

  private fitToCourse(marks: RaceMark[]): void {
    if (!this.map || marks.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();
    marks.forEach(mark => bounds.extend([mark.lng, mark.lat]));

    this.map.fitBounds(bounds, {
      padding: 100,
      duration: 1000,
    });
  }

  private async clearRaceCourse(): Promise<void> {
    if (!this.map) return;

    const layersToRemove = [
      'race-marks-3d',
      'race-marks-labels',
      'race-marks-icons',
      'course-lines',
      'start-line',
      'finish-line',
      'course-area-3d',
    ];

    const sourcesToRemove = [
      'race-marks',
      'course-lines',
      'start-line',
      'finish-line',
      'course-area',
    ];

    // Remove layers
    layersToRemove.forEach(layerId => {
      if (this.map!.getLayer(layerId)) {
        this.map!.removeLayer(layerId);
      }
    });

    // Remove sources
    sourcesToRemove.forEach(sourceId => {
      if (this.map!.getSource(sourceId)) {
        this.map!.removeSource(sourceId);
      }
    });
  }

  /**
   * Cleanup and destroy map
   */
  destroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.isInitialized = false;
      this.raceCourse = null;
      this.weatherOverlays = [];
      this.tacticalLayers = [];
    }
  }

  /**
   * Get map instance
   */
  getMap(): maplibregl.Map | null {
    return this.map;
  }

  /**
   * Get available map styles
   */
  getAvailableStyles(): MapStyle[] {
    return this.mapStyles;
  }
}

// Export singleton instance
export const mapLibreService = MapLibreService.getInstance();

export default mapLibreService;
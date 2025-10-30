import maplibregl from 'maplibre-gl';
import { createLogger } from '@/lib/utils/logger';

interface RaceCourse3D {
  course_id: string;
  course_data: CourseExtraction;
  venue_coordinates: [number, number];
  map_instance?: maplibregl.Map;
  visualization_config: VisualizationConfig;
}

interface VisualizationConfig {
  theme: 'nautical' | 'satellite' | 'tactical';
  show_bathymetry: boolean;
  show_currents: boolean;
  show_wind_vectors: boolean;
  show_laylines: boolean;
  show_tactical_grid: boolean;
  animation_enabled: boolean;
  performance_mode: 'high' | 'medium' | 'low';
}

interface TacticalLayer {
  id: string;
  type: 'wind_shift_zones' | 'current_vectors' | 'pressure_gradients' | 'tactical_grid';
  data: GeoJSON.FeatureCollection;
  style: LayerStyle;
  interactive: boolean;
}

interface LayerStyle {
  color: string;
  opacity: number;
  stroke_width: number;
  fill_opacity?: number;
  pattern?: string;
}

interface WindVisualization {
  vectors: WindVector[];
  shift_zones: ShiftZone[];
  pressure_areas: PressureArea[];
  confidence_overlay: ConfidenceOverlay;
}

interface WindVector {
  coordinates: [number, number];
  direction: number;
  speed: number;
  confidence: number;
  timestamp: number;
}

interface ShiftZone {
  id: string;
  coordinates: [number, number][];
  shift_direction: 'left' | 'right';
  shift_magnitude: number;
  probability: number;
  duration_minutes: number;
}

interface PressureArea {
  id: string;
  coordinates: [number, number][];
  pressure_type: 'high' | 'low' | 'gradient';
  intensity: number;
  tactical_advice: string[];
}

interface ConfidenceOverlay {
  grid_resolution: number;
  confidence_data: number[][];
  visualization_type: 'heatmap' | 'contours' | 'grid';
}

interface CurrentVisualization {
  vectors: CurrentVector[];
  tidal_streams: TidalStream[];
  eddy_zones: EddyZone[];
  layline_effects: LaylineEffect[];
}

interface CurrentVector {
  coordinates: [number, number];
  direction: number;
  speed: number;
  tidal_state: 'flood' | 'ebb' | 'slack';
  depth_layer: 'surface' | 'mid' | 'bottom';
}

interface TidalStream {
  id: string;
  path: [number, number][];
  max_speed: number;
  direction_flood: number;
  direction_ebb: number;
  timing: {
    flood_start: string;
    flood_max: string;
    ebb_start: string;
    ebb_max: string;
  };
}

interface EddyZone {
  id: string;
  coordinates: [number, number][];
  rotation_direction: 'clockwise' | 'counterclockwise';
  strength: number;
  tactical_impact: string[];
}

interface LaylineEffect {
  mark_id: string;
  effect_coordinates: [number, number][];
  current_angle: number;
  speed_impact: number;
  strategic_advice: string[];
}

interface BathymetryVisualization {
  depth_contours: DepthContour[];
  shallow_areas: ShallowArea[];
  deep_channels: DeepChannel[];
  navigation_hazards: NavigationHazard[];
}

interface DepthContour {
  depth_meters: number;
  coordinates: [number, number][];
  tactical_relevance: 'high' | 'medium' | 'low';
}

interface ShallowArea {
  id: string;
  coordinates: [number, number][];
  min_depth: number;
  max_depth: number;
  bottom_type: 'sand' | 'mud' | 'rock' | 'coral';
  racing_impact: string[];
}

interface DeepChannel {
  id: string;
  centerline: [number, number][];
  width_meters: number;
  depth_meters: number;
  current_effects: string[];
}

interface NavigationHazard {
  id: string;
  type: 'rock' | 'wreck' | 'shallow' | 'structure';
  coordinates: [number, number];
  radius_meters: number;
  description: string;
  avoidance_advice: string[];
}

interface Course3DOptions {
  container: string | HTMLElement;
  course_extraction: CourseExtraction;
  venue_intelligence?: VenueIntelligence;
  visualization_config?: Partial<VisualizationConfig>;
  interactive_features?: InteractiveFeatures;
}

interface InteractiveFeatures {
  mark_selection: boolean;
  layline_drawing: boolean;
  wind_measurement: boolean;
  current_measurement: boolean;
  tactical_notes: boolean;
  strategy_overlay: boolean;
  real_time_tracking: boolean;
}

const logger = createLogger('RaceCourseVisualizationService');
export class RaceCourseVisualizationService {
  private static mapInstances: Map<string, RaceCourse3D> = new Map();

  /**
   * Initialize 3D race course visualization
   */
  static async initialize3DCourse(options: Course3DOptions): Promise<string> {
    try {
      const courseId = `course_${Date.now()}`;

      // Calculate course center for map positioning
      const courseCenter = this.calculateCourseCenter(options.course_extraction);

      // Default visualization config
      const defaultConfig: VisualizationConfig = {
        theme: 'nautical',
        show_bathymetry: true,
        show_currents: true,
        show_wind_vectors: true,
        show_laylines: false,
        show_tactical_grid: false,
        animation_enabled: true,
        performance_mode: 'high',
        ...options.visualization_config,
      };

      // Initialize MapLibre GL map
      const map = new maplibregl.Map({
        container: options.container,
        style: await this.getMapStyle(defaultConfig.theme),
        center: courseCenter,
        zoom: this.calculateOptimalZoom(options.course_extraction),
        pitch: 60,
        bearing: this.calculateOptimalBearing(options.course_extraction),
        antialias: true,
        preserveDrawingBuffer: true,
      });

      // Wait for map to load
      await new Promise<void>((resolve) => {
        map.on('load', () => resolve());
      });

      // Add 3D terrain if available
      if (defaultConfig.show_bathymetry) {
        await this.add3DTerrain(map);
      }

      // Add course marks and lines
      await this.addCourseGeometry(map, options.course_extraction);

      // Add tactical layers
      if (options.venue_intelligence) {
        await this.addTacticalLayers(map, options.venue_intelligence, defaultConfig);
      }

      // Add interactive features
      if (options.interactive_features) {
        this.addInteractiveFeatures(map, options.interactive_features);
      }

      // Store map instance
      const raceCourse: RaceCourse3D = {
        course_id: courseId,
        course_data: options.course_extraction,
        venue_coordinates: courseCenter,
        map_instance: map,
        visualization_config: defaultConfig,
      };

      this.mapInstances.set(courseId, raceCourse);

      return courseId;
    } catch (error) {
      console.error('Error initializing 3D course:', error);
      throw error;
    }
  }

  /**
   * Add real-time wind visualization
   */
  static async addWindVisualization(
    courseId: string,
    windData: WindVisualization
  ): Promise<void> {
    try {
      const raceCourse = this.mapInstances.get(courseId);
      if (!raceCourse?.map_instance) {
        throw new Error('Race course not found');
      }

      const map = raceCourse.map_instance;

      // Add wind vectors layer
      map.addSource('wind-vectors', {
        type: 'geojson',
        data: this.createWindVectorGeoJSON(windData.vectors),
      });

      map.addLayer({
        id: 'wind-vectors',
        type: 'symbol',
        source: 'wind-vectors',
        layout: {
          'icon-image': 'wind-arrow',
          'icon-size': ['interpolate', ['linear'], ['get', 'speed'], 0, 0.3, 25, 1.0],
          'icon-rotate': ['get', 'direction'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
        },
        paint: {
          'icon-opacity': ['interpolate', ['linear'], ['get', 'confidence'], 0, 0.3, 1, 1.0],
        },
      });

      // Add wind shift zones
      map.addSource('wind-shifts', {
        type: 'geojson',
        data: this.createShiftZoneGeoJSON(windData.shift_zones),
      });

      map.addLayer({
        id: 'wind-shift-zones',
        type: 'fill',
        source: 'wind-shifts',
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'shift_direction'], 'left'],
            '#ff6b6b',
            '#4ecdc4'
          ],
          'fill-opacity': ['*', ['get', 'probability'], 0.3],
        },
      });

      // Add pressure areas
      map.addSource('pressure-areas', {
        type: 'geojson',
        data: this.createPressureAreaGeoJSON(windData.pressure_areas),
      });

      map.addLayer({
        id: 'pressure-areas',
        type: 'fill',
        source: 'pressure-areas',
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'pressure_type'], 'high'],
            '#2196f3',
            ['==', ['get', 'pressure_type'], 'low'],
            '#f44336',
            '#ff9800'
          ],
          'fill-opacity': ['*', ['get', 'intensity'], 0.2],
        },
      });

    } catch (error) {
      console.error('Error adding wind visualization:', error);
      throw error;
    }
  }

  /**
   * Add current and tidal visualization
   */
  static async addCurrentVisualization(
    courseId: string,
    currentData: CurrentVisualization
  ): Promise<void> {
    try {
      const raceCourse = this.mapInstances.get(courseId);
      if (!raceCourse?.map_instance) {
        throw new Error('Race course not found');
      }

      const map = raceCourse.map_instance;

      // Add current vectors
      map.addSource('current-vectors', {
        type: 'geojson',
        data: this.createCurrentVectorGeoJSON(currentData.vectors),
      });

      map.addLayer({
        id: 'current-vectors',
        type: 'symbol',
        source: 'current-vectors',
        layout: {
          'icon-image': 'current-arrow',
          'icon-size': ['interpolate', ['linear'], ['get', 'speed'], 0, 0.2, 3, 0.8],
          'icon-rotate': ['get', 'direction'],
          'icon-rotation-alignment': 'map',
        },
        paint: {
          'icon-color': [
            'case',
            ['==', ['get', 'tidal_state'], 'flood'],
            '#2196f3',
            ['==', ['get', 'tidal_state'], 'ebb'],
            '#f44336',
            '#9e9e9e'
          ],
        },
      });

      // Add tidal streams
      map.addSource('tidal-streams', {
        type: 'geojson',
        data: this.createTidalStreamGeoJSON(currentData.tidal_streams),
      });

      map.addLayer({
        id: 'tidal-streams',
        type: 'line',
        source: 'tidal-streams',
        paint: {
          'line-color': '#00bcd4',
          'line-width': ['interpolate', ['linear'], ['get', 'max_speed'], 0, 1, 3, 5],
          'line-opacity': 0.7,
        },
      });

      // Add eddy zones
      map.addSource('eddy-zones', {
        type: 'geojson',
        data: this.createEddyZoneGeoJSON(currentData.eddy_zones),
      });

      map.addLayer({
        id: 'eddy-zones',
        type: 'fill',
        source: 'eddy-zones',
        paint: {
          'fill-color': '#ff9800',
          'fill-opacity': ['*', ['get', 'strength'], 0.3],
        },
      });

    } catch (error) {
      console.error('Error adding current visualization:', error);
      throw error;
    }
  }

  /**
   * Update course for real-time race tracking
   */
  static async updateRealTimeTracking(
    courseId: string,
    boatPositions: BoatPosition[],
    windUpdate?: WindVisualization,
    currentUpdate?: CurrentVisualization
  ): Promise<void> {
    try {
      const raceCourse = this.mapInstances.get(courseId);
      if (!raceCourse?.map_instance) {
        throw new Error('Race course not found');
      }

      const map = raceCourse.map_instance;

      // Update boat positions
      const boatGeoJSON = this.createBoatPositionGeoJSON(boatPositions);

      if (map.getSource('boat-positions')) {
        (map.getSource('boat-positions') as maplibregl.GeoJSONSource).setData(boatGeoJSON);
      } else {
        map.addSource('boat-positions', {
          type: 'geojson',
          data: boatGeoJSON,
        });

        map.addLayer({
          id: 'boat-positions',
          type: 'symbol',
          source: 'boat-positions',
          layout: {
            'icon-image': 'boat-icon',
            'icon-size': 0.5,
            'icon-rotate': ['get', 'heading'],
            'icon-rotation-alignment': 'map',
            'text-field': ['get', 'sail_number'],
            'text-offset': [0, -2],
            'text-size': 12,
          },
          paint: {
            'text-color': '#000000',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2,
          },
        });
      }

      // Update wind data if provided
      if (windUpdate) {
        await this.updateWindData(map, windUpdate);
      }

      // Update current data if provided
      if (currentUpdate) {
        await this.updateCurrentData(map, currentUpdate);
      }

    } catch (error) {
      console.error('Error updating real-time tracking:', error);
      throw error;
    }
  }

  /**
   * Export course visualization as image
   */
  static async exportCourseImage(
    courseId: string,
    options: {
      format: 'png' | 'jpeg';
      quality?: number;
      width?: number;
      height?: number;
    }
  ): Promise<string> {
    try {
      const raceCourse = this.mapInstances.get(courseId);
      if (!raceCourse?.map_instance) {
        throw new Error('Race course not found');
      }

      const map = raceCourse.map_instance;

      // Ensure map is fully loaded
      await new Promise<void>((resolve) => {
        if (map.loaded()) {
          resolve();
        } else {
          map.on('idle', () => resolve());
        }
      });

      // Export as base64 image
      const canvas = map.getCanvas();
      return canvas.toDataURL(`image/${options.format}`, options.quality || 0.9);

    } catch (error) {
      console.error('Error exporting course image:', error);
      throw error;
    }
  }

  /**
   * Cleanup and destroy course visualization
   */
  static destroyCourse(courseId: string): void {
    try {
      const raceCourse = this.mapInstances.get(courseId);
      if (raceCourse?.map_instance) {
        raceCourse.map_instance.remove();
      }
      this.mapInstances.delete(courseId);
    } catch (error) {
      console.error('Error destroying course:', error);
    }
  }

  // Helper methods

  private static calculateCourseCenter(courseData: CourseExtraction): [number, number] {
    const allCoordinates = courseData.marks.map(mark => mark.coordinates);

    const latSum = allCoordinates.reduce((sum, coord) => sum + coord[0], 0);
    const lngSum = allCoordinates.reduce((sum, coord) => sum + coord[1], 0);

    return [
      latSum / allCoordinates.length,
      lngSum / allCoordinates.length,
    ];
  }

  private static calculateOptimalZoom(courseData: CourseExtraction): number {
    // Calculate bounding box of course
    const lats = courseData.marks.map(mark => mark.coordinates[0]);
    const lngs = courseData.marks.map(mark => mark.coordinates[1]);

    const latRange = Math.max(...lats) - Math.min(...lats);
    const lngRange = Math.max(...lngs) - Math.min(...lngs);

    const maxRange = Math.max(latRange, lngRange);

    // Zoom level based on coordinate range
    if (maxRange > 0.1) return 10;
    if (maxRange > 0.05) return 12;
    if (maxRange > 0.01) return 14;
    return 16;
  }

  private static calculateOptimalBearing(courseData: CourseExtraction): number {
    // Calculate bearing based on start line orientation
    if (courseData.start_line.coordinates.length >= 2) {
      const [start, end] = courseData.start_line.coordinates;
      const bearing = Math.atan2(
        end[1] - start[1],
        end[0] - start[0]
      ) * (180 / Math.PI);

      return (bearing + 360) % 360;
    }

    return 0; // Default bearing
  }

  private static async getMapStyle(theme: 'nautical' | 'satellite' | 'tactical'): Promise<string> {
    // Return appropriate map style based on theme
    switch (theme) {
      case 'nautical':
        return 'https://demotiles.maplibre.org/style.json'; // Replace with nautical chart style
      case 'satellite':
        return 'https://api.maptiler.com/maps/satellite/style.json'; // Replace with satellite style
      case 'tactical':
        return 'https://demotiles.maplibre.org/style.json'; // Replace with tactical style
      default:
        return 'https://demotiles.maplibre.org/style.json';
    }
  }

  private static async add3DTerrain(map: maplibregl.Map): Promise<void> {
    // Add 3D terrain source and layer
    map.addSource('terrain', {
      type: 'raster-dem',
      url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json', // Replace with bathymetry tiles
    });

    map.setTerrain({
      source: 'terrain',
      exaggeration: 2,
    });
  }

  private static async addCourseGeometry(
    map: maplibregl.Map,
    courseData: CourseExtraction
  ): Promise<void> {
    // Add course marks
    const marksGeoJSON = this.createMarksGeoJSON(courseData.marks);

    map.addSource('course-marks', {
      type: 'geojson',
      data: marksGeoJSON,
    });

    map.addLayer({
      id: 'course-marks',
      type: 'circle',
      source: 'course-marks',
      paint: {
        'circle-radius': [
          'case',
          ['==', ['get', 'type'], 'start'],
          12,
          ['==', ['get', 'type'], 'finish'],
          12,
          8
        ],
        'circle-color': [
          'case',
          ['==', ['get', 'type'], 'start'],
          '#4caf50',
          ['==', ['get', 'type'], 'finish'],
          '#f44336',
          ['==', ['get', 'type'], 'windward'],
          '#2196f3',
          '#ff9800'
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });

    // Add mark labels
    map.addLayer({
      id: 'mark-labels',
      type: 'symbol',
      source: 'course-marks',
      layout: {
        'text-field': ['get', 'name'],
        'text-offset': [0, -2],
        'text-size': 14,
        'text-font': ['Open Sans Bold'],
      },
      paint: {
        'text-color': '#000000',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2,
      },
    });

    // Add start/finish lines
    const linesGeoJSON = this.createLinesGeoJSON(courseData);

    map.addSource('course-lines', {
      type: 'geojson',
      data: linesGeoJSON,
    });

    map.addLayer({
      id: 'course-lines',
      type: 'line',
      source: 'course-lines',
      paint: {
        'line-color': [
          'case',
          ['==', ['get', 'line_type'], 'start'],
          '#4caf50',
          '#f44336'
        ],
        'line-width': 3,
        'line-dasharray': [2, 2],
      },
    });
  }

  private static async addTacticalLayers(
    map: maplibregl.Map,
    intelligence: VenueIntelligence,
    config: VisualizationConfig
  ): Promise<void> {
    // Add tactical grid if enabled
    if (config.show_tactical_grid) {
      // Implementation for tactical grid overlay
    }

    // Add favored side indicators
    if (intelligence.tactical_intelligence.favored_sides.length > 0) {
      // Implementation for favored side visualization
    }
  }

  private static addInteractiveFeatures(
    map: maplibregl.Map,
    features: InteractiveFeatures
  ): void {
    if (features.mark_selection) {
      map.on('click', 'course-marks', (e) => {
        // Handle mark selection
        const properties = e.features?.[0]?.properties;
        logger.debug('Mark selected:', properties);
      });
    }

    if (features.layline_drawing) {
      // Implementation for layline drawing interaction
    }

    if (features.tactical_notes) {
      // Implementation for tactical notes interaction
    }
  }

  private static createMarksGeoJSON(marks: CourseMark[]): GeoJSON.FeatureCollection {
    return {
      type: 'FeatureCollection',
      features: marks.map(mark => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [mark.coordinates[1], mark.coordinates[0]], // lng, lat for GeoJSON
        },
        properties: {
          id: mark.id,
          name: mark.name,
          type: mark.type,
          rounding_direction: mark.rounding_direction,
          description: mark.description,
        },
      })),
    };
  }

  private static createLinesGeoJSON(courseData: CourseExtraction): GeoJSON.FeatureCollection {
    const features: GeoJSON.Feature[] = [];

    // Start line
    if (courseData.start_line.coordinates.length >= 2) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: courseData.start_line.coordinates.map(coord => [coord[1], coord[0]]),
        },
        properties: {
          line_type: 'start',
          bearing: courseData.start_line.bearing,
          length_meters: courseData.start_line.length_meters,
        },
      });
    }

    // Finish line
    if (courseData.finish_line.coordinates.length >= 2) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: courseData.finish_line.coordinates.map(coord => [coord[1], coord[0]]),
        },
        properties: {
          line_type: 'finish',
          bearing: courseData.finish_line.bearing,
          length_meters: courseData.finish_line.length_meters,
        },
      });
    }

    return {
      type: 'FeatureCollection',
      features,
    };
  }

  private static createWindVectorGeoJSON(vectors: WindVector[]): GeoJSON.FeatureCollection {
    return {
      type: 'FeatureCollection',
      features: vectors.map(vector => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [vector.coordinates[1], vector.coordinates[0]],
        },
        properties: {
          direction: vector.direction,
          speed: vector.speed,
          confidence: vector.confidence,
          timestamp: vector.timestamp,
        },
      })),
    };
  }

  private static createShiftZoneGeoJSON(zones: ShiftZone[]): GeoJSON.FeatureCollection {
    return {
      type: 'FeatureCollection',
      features: zones.map(zone => ({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [zone.coordinates.map(coord => [coord[1], coord[0]])],
        },
        properties: {
          shift_direction: zone.shift_direction,
          shift_magnitude: zone.shift_magnitude,
          probability: zone.probability,
          duration_minutes: zone.duration_minutes,
        },
      })),
    };
  }

  private static createPressureAreaGeoJSON(areas: PressureArea[]): GeoJSON.FeatureCollection {
    return {
      type: 'FeatureCollection',
      features: areas.map(area => ({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [area.coordinates.map(coord => [coord[1], coord[0]])],
        },
        properties: {
          pressure_type: area.pressure_type,
          intensity: area.intensity,
          tactical_advice: area.tactical_advice,
        },
      })),
    };
  }

  private static createCurrentVectorGeoJSON(vectors: CurrentVector[]): GeoJSON.FeatureCollection {
    return {
      type: 'FeatureCollection',
      features: vectors.map(vector => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [vector.coordinates[1], vector.coordinates[0]],
        },
        properties: {
          direction: vector.direction,
          speed: vector.speed,
          tidal_state: vector.tidal_state,
          depth_layer: vector.depth_layer,
        },
      })),
    };
  }

  private static createTidalStreamGeoJSON(streams: TidalStream[]): GeoJSON.FeatureCollection {
    return {
      type: 'FeatureCollection',
      features: streams.map(stream => ({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: stream.path.map(coord => [coord[1], coord[0]]),
        },
        properties: {
          max_speed: stream.max_speed,
          direction_flood: stream.direction_flood,
          direction_ebb: stream.direction_ebb,
          timing: stream.timing,
        },
      })),
    };
  }

  private static createEddyZoneGeoJSON(zones: EddyZone[]): GeoJSON.FeatureCollection {
    return {
      type: 'FeatureCollection',
      features: zones.map(zone => ({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [zone.coordinates.map(coord => [coord[1], coord[0]])],
        },
        properties: {
          rotation_direction: zone.rotation_direction,
          strength: zone.strength,
          tactical_impact: zone.tactical_impact,
        },
      })),
    };
  }

  private static createBoatPositionGeoJSON(positions: BoatPosition[]): GeoJSON.FeatureCollection {
    return {
      type: 'FeatureCollection',
      features: positions.map(position => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [position.coordinates[1], position.coordinates[0]],
        },
        properties: {
          sail_number: position.sail_number,
          boat_name: position.boat_name,
          heading: position.heading,
          speed: position.speed,
          position_in_fleet: position.position_in_fleet,
        },
      })),
    };
  }

  private static async updateWindData(map: maplibregl.Map, windUpdate: WindVisualization): Promise<void> {
    // Update wind vector data
    if (map.getSource('wind-vectors')) {
      (map.getSource('wind-vectors') as maplibregl.GeoJSONSource).setData(
        this.createWindVectorGeoJSON(windUpdate.vectors)
      );
    }

    // Update shift zones
    if (map.getSource('wind-shifts')) {
      (map.getSource('wind-shifts') as maplibregl.GeoJSONSource).setData(
        this.createShiftZoneGeoJSON(windUpdate.shift_zones)
      );
    }
  }

  private static async updateCurrentData(map: maplibregl.Map, currentUpdate: CurrentVisualization): Promise<void> {
    // Update current vector data
    if (map.getSource('current-vectors')) {
      (map.getSource('current-vectors') as maplibregl.GeoJSONSource).setData(
        this.createCurrentVectorGeoJSON(currentUpdate.vectors)
      );
    }

    // Update tidal streams
    if (map.getSource('tidal-streams')) {
      (map.getSource('tidal-streams') as maplibregl.GeoJSONSource).setData(
        this.createTidalStreamGeoJSON(currentUpdate.tidal_streams)
      );
    }
  }
}

// Additional interfaces for boat tracking
interface BoatPosition {
  sail_number: string;
  boat_name: string;
  coordinates: [number, number];
  heading: number;
  speed: number;
  position_in_fleet: number;
  timestamp: number;
}

export default RaceCourseVisualizationService;
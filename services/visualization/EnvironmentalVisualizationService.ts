/**
 * Environmental Visualization Service
 *
 * Coordinates rendering of environmental data (bathymetry, tides, wind, terrain)
 * on mapping platforms (MapLibre, Cesium). Transforms analysis data into
 * visual layers for strategic race planning.
 */

import type { EnvironmentalAnalysis } from '../../types/wind';
import type { UnderwaterAnalysis } from '../../types/bathymetry';
import type { WindAnalysis } from '../../types/wind';

// Safely import Platform for React Native environments
let Platform: { OS: string } | undefined;
try {
  Platform = require('react-native').Platform;
} catch {
  // Running in Node.js environment, default to web
  Platform = { OS: 'web' };
}

/**
 * Particle data for wind or current visualization
 */
export interface ParticleData {
  /** Latitude */
  lat: number;

  /** Longitude */
  lng: number;

  /** Direction in degrees (0-360) */
  direction: number;

  /** Speed in knots */
  speed: number;
}

/**
 * GeoJSON polygon for overlay layers
 */
export interface OverlayPolygon {
  type: 'Feature';
  geometry: GeoJSON.Polygon;
  properties: {
    id: string;
    name?: string;
    type: 'wind-shadow' | 'wind-acceleration' | 'current-acceleration' | 'current-eddy';
    severity?: 'severe' | 'moderate' | 'weak';
    speedChange: number; // Percentage (e.g., -0.65 for 65% reduction)
    estimatedSpeed: number; // Knots
    confidence: number; // 0-1
    description: string;
    color: string; // Hex color for rendering
  };
}

/**
 * Configuration for environmental visualization
 */
export interface VisualizationConfig {
  /** Show wind particle animation */
  showWindParticles: boolean;

  /** Show current particle animation */
  showCurrentParticles: boolean;

  /** Show wind shadow zones */
  showWindShadows: boolean;

  /** Show wind acceleration zones */
  showWindAcceleration: boolean;

  /** Show current acceleration zones */
  showCurrentAcceleration: boolean;

  /** Show current eddy zones */
  showCurrentEddies: boolean;

  /** Show bathymetry (underwater terrain) */
  showBathymetry: boolean;

  /** Show buildings (for wind shadow calculation) */
  showBuildings: boolean;

  /** Bathymetry exaggeration factor (1 = no exaggeration) */
  bathymetryExaggeration: number;

  /** Number of particles for animations */
  particleCount: number;
}

/**
 * Visualization layers output
 */
export interface VisualizationLayers {
  /** Wind particle data for animation */
  windParticles: ParticleData[];

  /** Current particle data for animation */
  currentParticles: ParticleData[];

  /** Wind shadow zone polygons */
  windShadowZones: OverlayPolygon[];

  /** Wind acceleration zone polygons */
  windAccelerationZones: OverlayPolygon[];

  /** Current acceleration zone polygons */
  currentAccelerationZones: OverlayPolygon[];

  /** Current eddy zone polygons */
  currentEddyZones: OverlayPolygon[];

  /** Building footprints with heights */
  buildings: {
    type: 'FeatureCollection';
    features: Array<{
      type: 'Feature';
      geometry: GeoJSON.Polygon;
      properties: {
        height: number;
        name?: string;
      };
    }>;
  };
}

export type EnvironmentalLayers = VisualizationLayers;

/**
 * Environmental Visualization Service
 */
export class EnvironmentalVisualizationService {
  private config: VisualizationConfig;

  constructor(config?: Partial<VisualizationConfig>) {
    this.config = {
      showWindParticles: true,
      showCurrentParticles: true,
      showWindShadows: true,
      showWindAcceleration: true,
      showCurrentAcceleration: true,
      showCurrentEddies: true,
      showBathymetry: true,
      showBuildings: true,
      bathymetryExaggeration: 3.0,
      particleCount: Platform?.OS === 'web' ? 10000 : 5000, // Fewer on mobile
      ...config
    };
  }

  /**
   * Update visualization configuration
   */
  updateConfig(config: Partial<VisualizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Generate visualization layers from environmental analysis
   */
  generateLayers(analysis: EnvironmentalAnalysis): VisualizationLayers {
    return {
      windParticles: this.config.showWindParticles && analysis.air
        ? this.generateWindParticles(analysis.air)
        : [],

      currentParticles: this.config.showCurrentParticles && analysis.water
        ? this.generateCurrentParticles(analysis.water)
        : [],

      windShadowZones: this.config.showWindShadows && analysis.air
        ? this.generateWindShadowOverlays(analysis.air)
        : [],

      windAccelerationZones: this.config.showWindAcceleration && analysis.air
        ? this.generateWindAccelerationOverlays(analysis.air)
        : [],

      currentAccelerationZones: this.config.showCurrentAcceleration && analysis.water
        ? this.generateCurrentAccelerationOverlays(analysis.water)
        : [],

      currentEddyZones: this.config.showCurrentEddies && analysis.water
        ? this.generateCurrentEddyOverlays(analysis.water)
        : [],

      buildings: this.config.showBuildings && analysis.air
        ? this.generateBuildingFeatures(analysis.air)
        : { type: 'FeatureCollection', features: [] }
    };
  }

  /**
   * Generate wind particle data for animation
   */
  private generateWindParticles(windAnalysis: WindAnalysis): ParticleData[] {
    const particles: ParticleData[] = [];

    // Get racing area bounds
    const bounds = this.getBoundsFromAnalysis(windAnalysis);

    // Generate random particles across racing area
    // In shadow zones, adjust speed downward
    for (let i = 0; i < this.config.particleCount; i++) {
      const lat = bounds.south + Math.random() * (bounds.north - bounds.south);
      const lng = bounds.west + Math.random() * (bounds.east - bounds.west);

      // Check if particle is in wind shadow zone
      const shadowZone = windAnalysis.windShadowZones?.find(zone =>
        this.pointInPolygon([lng, lat], zone.polygon)
      );

      // Check if particle is in acceleration zone
      const accelZone = windAnalysis.accelerationZones?.find(zone =>
        this.pointInPolygon([lng, lat], zone.polygon)
      );

      let speed = windAnalysis.gradientWind?.speed ?? windAnalysis.averageWindSpeed;

      if (shadowZone) {
        // Reduce speed in shadow
        speed = shadowZone.estimatedSpeed;
      } else if (accelZone) {
        // Increase speed in acceleration zone
        speed = accelZone.estimatedSpeed;
      }

      particles.push({
        lat,
        lng,
        direction: windAnalysis.gradientWind?.direction ?? windAnalysis.averageWindDirection,
        speed
      });
    }

    return particles;
  }

  /**
   * Generate current particle data for animation
   */
  private generateCurrentParticles(waterAnalysis: UnderwaterAnalysis): ParticleData[] {
    const particles: ParticleData[] = [];

    // Get racing area bounds
    const bounds = this.getBoundsFromWaterAnalysis(waterAnalysis);

    // Generate random particles across racing area
    for (let i = 0; i < this.config.particleCount; i++) {
      const lat = bounds.south + Math.random() * (bounds.north - bounds.south);
      const lng = bounds.west + Math.random() * (bounds.east - bounds.west);

      // Check if particle is in acceleration zone
      const accelZone = waterAnalysis.strategicFeatures?.accelerationZones?.find(zone =>
        this.pointInPolygon([lng, lat], zone.polygon)
      );

      // Check if particle is in eddy zone
      const eddyZone = waterAnalysis.strategicFeatures?.eddyZones?.find(zone =>
        this.pointInPolygon([lng, lat], zone.polygon)
      );

      let speed = waterAnalysis.tidal?.currentSpeed ?? waterAnalysis.current?.averageSpeed ?? 0;
      let direction = waterAnalysis.tidal?.currentDirection ?? waterAnalysis.current?.averageDirection ?? 0;

      if (accelZone && accelZone.properties) {
        // Increase speed in acceleration zone
        speed = accelZone.properties.speedIncrease || speed;
      } else if (eddyZone && eddyZone.properties) {
        // Reverse or circular flow in eddy
        direction = (direction + 180) % 360;
        speed *= 0.5; // Slower in eddy
      }

      particles.push({
        lat,
        lng,
        direction,
        speed
      });
    }

    return particles;
  }

  /**
   * Generate wind shadow zone overlays
   */
  private generateWindShadowOverlays(windAnalysis: WindAnalysis): OverlayPolygon[] {
    if (!windAnalysis.windShadowZones || windAnalysis.windShadowZones.length === 0) {
      return [];
    }
    return windAnalysis.windShadowZones.map((zone, idx) => ({
      type: 'Feature' as const,
      geometry: zone.polygon,
      properties: {
        id: `wind-shadow-${idx}`,
        name: zone.obstacle.name,
        type: 'wind-shadow' as const,
        severity: zone.severity,
        speedChange: -zone.reduction,
        estimatedSpeed: zone.estimatedSpeed,
        confidence: zone.confidence,
        description: zone.description,
        color: this.getSeverityColor(zone.severity)
      }
    }));
  }

  /**
   * Generate wind acceleration zone overlays
   */
  private generateWindAccelerationOverlays(windAnalysis: WindAnalysis): OverlayPolygon[] {
    if (!windAnalysis.accelerationZones || windAnalysis.accelerationZones.length === 0) {
      return [];
    }
    return windAnalysis.accelerationZones.map((zone, idx) => ({
      type: 'Feature' as const,
      geometry: zone.polygon,
      properties: {
        id: `wind-accel-${idx}`,
        type: 'wind-acceleration' as const,
        speedChange: zone.increase,
        estimatedSpeed: zone.estimatedSpeed,
        confidence: zone.confidence,
        description: zone.description,
        color: '#00ff00' // Green for acceleration
      }
    }));
  }

  /**
   * Generate current acceleration zone overlays
   */
  private generateCurrentAccelerationOverlays(waterAnalysis: UnderwaterAnalysis): OverlayPolygon[] {
    if (!waterAnalysis.strategicFeatures?.accelerationZones || waterAnalysis.strategicFeatures.accelerationZones.length === 0) {
      return [];
    }
    return waterAnalysis.strategicFeatures.accelerationZones.map((zone, idx) => ({
      type: 'Feature' as const,
      geometry: zone.polygon,
      properties: {
        id: `current-accel-${idx}`,
        name: zone.properties?.name,
        type: 'current-acceleration' as const,
        speedChange: zone.properties?.speedIncrease || 0.3,
        estimatedSpeed: zone.properties?.speedIncrease || waterAnalysis.tidal?.currentSpeed || waterAnalysis.current?.averageSpeed || 1.0,
        confidence: zone.properties?.confidence || 0.7,
        description: zone.properties?.description || 'Current acceleration zone',
        color: '#0088ff' // Blue for current
      }
    }));
  }

  /**
   * Generate current eddy zone overlays
   */
  private generateCurrentEddyOverlays(waterAnalysis: UnderwaterAnalysis): OverlayPolygon[] {
    if (!waterAnalysis.strategicFeatures?.eddyZones || waterAnalysis.strategicFeatures.eddyZones.length === 0) {
      return [];
    }
    return waterAnalysis.strategicFeatures.eddyZones.map((zone, idx) => ({
      type: 'Feature' as const,
      geometry: zone.polygon,
      properties: {
        id: `current-eddy-${idx}`,
        name: zone.properties?.name,
        type: 'current-eddy' as const,
        speedChange: -0.5, // Eddies slow you down
        estimatedSpeed: (waterAnalysis.tidal?.currentSpeed || waterAnalysis.current?.averageSpeed || 1.0) * 0.5,
        confidence: zone.properties?.confidence || 0.6,
        description: zone.properties?.description || 'Current eddy zone',
        color: '#ff8800' // Orange for eddies
      }
    }));
  }

  /**
   * Generate building features for 3D rendering
   */
  private generateBuildingFeatures(windAnalysis: WindAnalysis): VisualizationLayers['buildings'] {
    if (!windAnalysis.buildings || !windAnalysis.buildings.buildings || windAnalysis.buildings.buildings.length === 0) {
      return {
        type: 'FeatureCollection',
        features: []
      };
    }
    return {
      type: 'FeatureCollection',
      features: windAnalysis.buildings.buildings.map(building => ({
        type: 'Feature' as const,
        geometry: building.footprint,
        properties: {
          height: building.height,
          name: building.name
        }
      }))
    };
  }

  /**
   * Get bounds from wind analysis
   */
  private getBoundsFromAnalysis(windAnalysis: WindAnalysis): { north: number; south: number; east: number; west: number } {
    return windAnalysis.terrain.bounds;
  }

  /**
   * Get bounds from water analysis
   */
  private getBoundsFromWaterAnalysis(waterAnalysis: UnderwaterAnalysis): { north: number; south: number; east: number; west: number } {
    return waterAnalysis.bathymetry.bounds;
  }

  /**
   * Get color based on severity
   */
  private getSeverityColor(severity: 'severe' | 'moderate' | 'weak'): string {
    switch (severity) {
      case 'severe':
        return '#ff0000'; // Red
      case 'moderate':
        return '#ff8800'; // Orange
      case 'weak':
        return '#ffcc00'; // Yellow
      default:
        return '#ffcc00';
    }
  }

  /**
   * Check if point is inside polygon (simple ray casting algorithm)
   */
  private pointInPolygon(point: [number, number], polygon: GeoJSON.Polygon): boolean {
    const x = point[0];
    const y = point[1];
    const coords = polygon.coordinates[0];

    let inside = false;
    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
      const xi = coords[i][0];
      const yi = coords[i][1];
      const xj = coords[j][0];
      const yj = coords[j][1];

      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

      if (intersect) inside = !inside;
    }

    return inside;
  }
}

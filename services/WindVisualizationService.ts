/**
 * Wind Visualization Service
 *
 * Provides professional wind visualization using MapLibre GL JS.
 * Supports wind barbs (meteorological standard) and wind arrows (sailor-friendly).
 *
 * Features:
 * - Wind barbs (standard meteorological notation)
 * - Wind arrows (simplified visualization)
 * - Speed-based color coding
 * - Wind gust indicators
 * - Forecast grid visualization
 */

import type { SailingVenue } from '@/lib/types/global-venues';

/**
 * Wind data point
 */
export interface WindDataPoint {
  coordinates: [number, number]; // [lng, lat]
  speed: number; // knots
  direction: number; // degrees (0-360, 0=North, clockwise)
  gust?: number; // knots (optional)
  time: Date;
}

/**
 * Wind barb feature (for GeoJSON)
 */
export interface WindBarbFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    speed: number;
    direction: number;
    gust?: number;
    color: string;
    barbType: 'calm' | 'light' | 'moderate' | 'strong' | 'gale';
  };
}

/**
 * Wind visualization configuration
 */
export interface WindVisualizationConfig {
  /** Visualization style */
  style: 'barbs' | 'arrows';

  /** Show wind speed values */
  showSpeed: boolean;

  /** Show gust indicators */
  showGusts: boolean;

  /** Color scheme */
  colorScheme: 'beaufort' | 'racing' | 'gradient';

  /** Grid spacing (degrees) */
  gridSpacing: number;

  /** Symbol size multiplier */
  symbolSize: number;

  /** Opacity */
  opacity: number;

  /** Minimum wind speed to display (knots) */
  minSpeed: number;
}

/**
 * Wind Visualization Service
 */
export class WindVisualizationService {
  /**
   * Generate wind barbs GeoJSON (meteorological standard)
   */
  generateWindBarbs(
    dataPoints: WindDataPoint[],
    config: WindVisualizationConfig
  ): GeoJSON.FeatureCollection<GeoJSON.Point> {
    const features: WindBarbFeature[] = dataPoints
      .filter((point: WindDataPoint) => point.speed >= config.minSpeed)
      .map((point: WindDataPoint) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: point.coordinates
        },
        properties: {
          speed: point.speed,
          direction: point.direction,
          gust: point.gust,
          color: this.getColorForSpeed(point.speed, config.colorScheme),
          barbType: this.getBarbType(point.speed)
        }
      }));

    return {
      type: 'FeatureCollection',
      features
    };
  }

  /**
   * Generate wind arrows GeoJSON (simplified visualization)
   */
  generateWindArrows(
    dataPoints: WindDataPoint[],
    config: WindVisualizationConfig
  ): GeoJSON.FeatureCollection {
    const features = dataPoints
      .filter((point: WindDataPoint) => point.speed >= config.minSpeed)
      .map((point: WindDataPoint) => {
        // Calculate arrow length based on wind speed
        const arrowLength = this.calculateArrowLength(point.speed, config.symbolSize);
        const startPoint = point.coordinates;
        const endPoint = this.calculateEndpoint(
          startPoint,
          point.direction,
          arrowLength
        );

        return {
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates: [startPoint, endPoint]
          },
          properties: {
            speed: point.speed,
            direction: point.direction,
            gust: point.gust,
            color: this.getColorForSpeed(point.speed, config.colorScheme),
            width: this.getWidthForSpeed(point.speed, config.symbolSize)
          }
        };
      });

    return {
      type: 'FeatureCollection',
      features
    };
  }

  /**
   * Generate MapLibre layers for wind visualization
   */
  getWindLayers(
    dataPoints: WindDataPoint[],
    config: WindVisualizationConfig
  ): any[] {
    const layers: any[] = [];

    if (config.style === 'barbs') {
      const barbsGeoJSON = this.generateWindBarbs(dataPoints, config);

      // Wind barb symbols
      layers.push({
        id: 'wind-barbs',
        type: 'symbol',
        source: {
          type: 'geojson',
          data: barbsGeoJSON
        },
        layout: {
          'icon-image': this.getWindBarbIcon(['get', 'barbType']),
          'icon-size': config.symbolSize,
          'icon-rotate': ['get', 'direction'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true
        },
        paint: {
          'icon-opacity': config.opacity,
          'icon-color': ['get', 'color']
        }
      });

      // Wind speed labels
      if (config.showSpeed) {
        layers.push({
          id: 'wind-speed-labels',
          type: 'symbol',
          source: {
            type: 'geojson',
            data: barbsGeoJSON
          },
          layout: {
            'text-field': [
              'concat',
              ['round', ['get', 'speed']],
              'kt'
            ],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': 10,
            'text-offset': [0, 2],
            'text-anchor': 'top'
          },
          paint: {
            'text-color': '#333333',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2,
            'text-opacity': config.opacity
          },
          minzoom: 10
        });
      }
    } else {
      // Arrows style
      const arrowsGeoJSON = this.generateWindArrows(dataPoints, config);

      // Wind arrow lines
      layers.push({
        id: 'wind-arrows',
        type: 'line',
        source: {
          type: 'geojson',
          data: arrowsGeoJSON
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['get', 'width'],
          'line-opacity': config.opacity
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        }
      });

      // Arrow heads
      layers.push({
        id: 'wind-arrow-heads',
        type: 'symbol',
        source: {
          type: 'geojson',
          data: arrowsGeoJSON
        },
        layout: {
          'icon-image': 'triangle', // Simple triangle for arrow head
          'icon-size': config.symbolSize * 0.6,
          'icon-rotate': ['get', 'direction'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true
        },
        paint: {
          'icon-opacity': config.opacity,
          'icon-color': ['get', 'color']
        }
      });
    }

    // Gust indicators (if enabled)
    if (config.showGusts) {
      const gustsGeoJSON = this.generateGustIndicators(dataPoints, config);

      layers.push({
        id: 'wind-gusts',
        type: 'circle',
        source: {
          type: 'geojson',
          data: gustsGeoJSON
        },
        paint: {
          'circle-radius': 4,
          'circle-color': '#FF6B35',
          'circle-opacity': config.opacity * 0.6,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff'
        }
      });
    }

    return layers;
  }

  /**
   * Generate wind forecast grid for venue
   */
  generateWindGrid(
    venue: SailingVenue,
    windData: { speed: number; direction: number; time: Date },
    gridSpacing: number = 0.01
  ): WindDataPoint[] {
    const dataPoints: WindDataPoint[] = [];
    const [venueLng, venueLat] = venue.coordinates;

    // Generate grid around venue (±0.05 degrees ~5km)
    for (let lat = venueLat - 0.05; lat <= venueLat + 0.05; lat += gridSpacing) {
      for (let lng = venueLng - 0.05; lng <= venueLng + 0.05; lng += gridSpacing) {
        // Add some variation (in production, use actual wind model)
        const speedVariation = (Math.random() - 0.5) * 2;
        const directionVariation = (Math.random() - 0.5) * 15;

        dataPoints.push({
          coordinates: [lng, lat],
          speed: Math.max(0, windData.speed + speedVariation),
          direction: (windData.direction + directionVariation + 360) % 360,
          time: windData.time
        });
      }
    }

    return dataPoints;
  }

  /**
   * Get Beaufort scale description for wind speed
   */
  getBeaufortScale(speedKnots: number): {
    force: number;
    description: string;
    seaState: string;
  } {
    if (speedKnots < 1) return { force: 0, description: 'Calm', seaState: 'Mirror-like' };
    if (speedKnots < 4) return { force: 1, description: 'Light Air', seaState: 'Ripples' };
    if (speedKnots < 7) return { force: 2, description: 'Light Breeze', seaState: 'Small wavelets' };
    if (speedKnots < 11) return { force: 3, description: 'Gentle Breeze', seaState: 'Large wavelets' };
    if (speedKnots < 16) return { force: 4, description: 'Moderate Breeze', seaState: 'Small waves' };
    if (speedKnots < 22) return { force: 5, description: 'Fresh Breeze', seaState: 'Moderate waves' };
    if (speedKnots < 28) return { force: 6, description: 'Strong Breeze', seaState: 'Large waves' };
    if (speedKnots < 34) return { force: 7, description: 'Near Gale', seaState: 'Sea heaps up' };
    if (speedKnots < 41) return { force: 8, description: 'Gale', seaState: 'Moderately high waves' };
    if (speedKnots < 48) return { force: 9, description: 'Strong Gale', seaState: 'High waves' };
    if (speedKnots < 56) return { force: 10, description: 'Storm', seaState: 'Very high waves' };
    if (speedKnots < 64) return { force: 11, description: 'Violent Storm', seaState: 'Exceptionally high waves' };
    return { force: 12, description: 'Hurricane', seaState: 'Air filled with foam' };
  }

  /**
   * Convert wind direction to cardinal direction
   */
  getCardinalDirection(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round((degrees % 360) / 22.5);
    return directions[index % 16];
  }

  /**
   * Calculate wind shift between two data points
   */
  calculateWindShift(wind1: WindDataPoint, wind2: WindDataPoint): {
    speedChange: number;
    directionChange: number;
    isBackingWind: boolean;
    isVeeringWind: boolean;
  } {
    const speedChange = wind2.speed - wind1.speed;

    let directionChange = wind2.direction - wind1.direction;
    if (directionChange > 180) directionChange -= 360;
    if (directionChange < -180) directionChange += 360;

    return {
      speedChange,
      directionChange,
      isBackingWind: directionChange < 0, // Counterclockwise
      isVeeringWind: directionChange > 0  // Clockwise
    };
  }

  // Private helper methods

  private calculateArrowLength(speed: number, sizeMultiplier: number): number {
    // Base length in degrees
    return (speed * 0.001 * sizeMultiplier);
  }

  private calculateEndpoint(
    start: [number, number],
    direction: number,
    length: number
  ): [number, number] {
    // Wind direction is "from" direction, we want "to" direction for arrow
    const arrowDirection = (direction + 180) % 360;
    const directionRad = ((90 - arrowDirection) * Math.PI) / 180;

    const endLng = start[0] + length * Math.cos(directionRad);
    const endLat = start[1] + length * Math.sin(directionRad);

    return [endLng, endLat];
  }

  private getColorForSpeed(speed: number, scheme: 'beaufort' | 'racing' | 'gradient'): string {
    if (scheme === 'racing') {
      // Sailor-friendly: light (blue) → medium (green) → heavy (red)
      if (speed < 8) return '#4A90E2'; // Light wind
      if (speed < 15) return '#50C878'; // Good racing wind
      if (speed < 25) return '#F5A623'; // Heavy wind
      return '#E94B3C'; // Storm force
    }

    if (scheme === 'beaufort') {
      // Beaufort scale colors
      const beaufort = this.getBeaufortScale(speed);
      const colors = [
        '#E0F7FA', // 0 - Calm
        '#B2EBF2', // 1 - Light Air
        '#80DEEA', // 2 - Light Breeze
        '#4DD0E1', // 3 - Gentle Breeze
        '#26C6DA', // 4 - Moderate Breeze
        '#00BCD4', // 5 - Fresh Breeze
        '#00ACC1', // 6 - Strong Breeze
        '#0097A7', // 7 - Near Gale
        '#00838F', // 8 - Gale
        '#006064', // 9 - Strong Gale
        '#FF6F00', // 10 - Storm
        '#E65100', // 11 - Violent Storm
        '#BF360C'  // 12 - Hurricane
      ];
      return colors[beaufort.force] || colors[0];
    }

    // Gradient (default)
    if (speed < 5) return '#C8E6C9'; // Very light - Light green
    if (speed < 10) return '#81C784'; // Light - Green
    if (speed < 15) return '#4CAF50'; // Moderate - Strong green
    if (speed < 20) return '#FFF176'; // Fresh - Yellow
    if (speed < 25) return '#FFB74D'; // Strong - Orange
    if (speed < 30) return '#FF8A65'; // Very strong - Light red
    return '#E57373'; // Storm - Red
  }

  private getWidthForSpeed(speed: number, sizeMultiplier: number): number {
    return Math.max(2, speed * 0.3 * sizeMultiplier);
  }

  private getBarbType(speed: number): 'calm' | 'light' | 'moderate' | 'strong' | 'gale' {
    if (speed < 2) return 'calm';
    if (speed < 12) return 'light';
    if (speed < 22) return 'moderate';
    if (speed < 34) return 'strong';
    return 'gale';
  }

  private getWindBarbIcon(barbTypeExpression: any): any {
    // Return appropriate wind barb icon based on type
    // In production, these would be actual icon names in the map style
    return [
      'match',
      barbTypeExpression,
      'calm', 'wind-barb-calm',
      'light', 'wind-barb-light',
      'moderate', 'wind-barb-moderate',
      'strong', 'wind-barb-strong',
      'gale', 'wind-barb-gale',
      'wind-barb-default'
    ];
  }

  private generateGustIndicators(
    dataPoints: WindDataPoint[],
    config: WindVisualizationConfig
  ): GeoJSON.FeatureCollection {
    const features = dataPoints
      .filter(point => point.gust && point.gust > point.speed + 5)
      .map(point => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: point.coordinates
        },
        properties: {
          gustSpeed: point.gust,
          baseSpeed: point.speed,
          gustDelta: (point.gust || 0) - point.speed
        }
      }));

    return {
      type: 'FeatureCollection',
      features
    };
  }
}

/**
 * Default wind visualization configuration
 */
export const DEFAULT_WIND_CONFIG: WindVisualizationConfig = {
  style: 'arrows',
  showSpeed: true,
  showGusts: true,
  colorScheme: 'racing',
  gridSpacing: 0.01,
  symbolSize: 1.0,
  opacity: 0.8,
  minSpeed: 2
};

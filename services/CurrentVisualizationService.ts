/**
 * Current Visualization Service
 *
 * Provides animated current flow visualization using MapLibre GL JS.
 * Integrates with NOAA Current Predictions API and generates vector field visualizations.
 *
 * Features:
 * - Animated current flow arrows
 * - Speed-based color coding
 * - Tidal current predictions
 * - Real-time current data
 */

import type { SailingVenue } from '../types/venues';

/**
 * Current data point
 */
export interface CurrentDataPoint {
  coordinates: [number, number]; // [lng, lat]
  speed: number; // knots
  direction: number; // degrees (0-360, 0=North)
  time: Date;
}

/**
 * Current prediction for a specific time
 */
export interface CurrentPrediction {
  time: Date;
  speed: number; // knots
  direction: number; // degrees
  type: 'flood' | 'ebb' | 'slack';
}

/**
 * Current station information
 */
export interface CurrentStation {
  id: string;
  name: string;
  coordinates: [number, number];
  country: string;
  type: 'tidal' | 'ocean' | 'river';
}

/**
 * Current visualization configuration
 */
export interface CurrentVisualizationConfig {
  /** Show current arrows */
  showArrows: boolean;

  /** Animate arrows (flow effect) */
  animate: boolean;

  /** Animation speed (1-10) */
  animationSpeed: number;

  /** Arrow size multiplier */
  arrowSize: number;

  /** Color scheme */
  colorScheme: 'speed' | 'direction' | 'type';

  /** Show current stations */
  showStations: boolean;

  /** Opacity */
  opacity: number;

  /** Minimum current speed to display (knots) */
  minSpeed: number;
}

/**
 * Current Visualization Service
 */
export class CurrentVisualizationService {
  private readonly NOAA_CURRENTS_API = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
  private animationFrameId: number | null = null;
  private currentOffset = 0;

  /**
   * Get current predictions for a station
   */
  async getCurrentPredictions(
    stationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CurrentPrediction[]> {
    try {
      const params = new URLSearchParams({
        product: 'currents_predictions',
        application: 'RegattaFlow',
        begin_date: this.formatNOAADate(startDate),
        end_date: this.formatNOAADate(endDate),
        station: stationId,
        time_zone: 'gmt',
        units: 'english', // knots
        format: 'json',
        interval: 'h'
      });

      const response = await fetch(`${this.NOAA_CURRENTS_API}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`NOAA API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.current_predictions?.cp) {
        console.warn(`No current predictions for station ${stationId}`);
        return [];
      }

      return data.current_predictions.cp.map((c: any) => ({
        time: new Date(c.Time),
        speed: parseFloat(c.Speed),
        direction: parseFloat(c.Direction),
        type: this.determineCurrentType(parseFloat(c.Speed), parseFloat(c.Direction))
      }));
    } catch (error) {
      console.error('Failed to fetch current predictions:', error);
      return [];
    }
  }

  /**
   * Generate current flow arrow GeoJSON
   */
  generateCurrentArrows(
    dataPoints: CurrentDataPoint[],
    config: CurrentVisualizationConfig
  ): GeoJSON.FeatureCollection {
    const features = dataPoints
      .filter(point => point.speed >= config.minSpeed)
      .map(point => {
        // Calculate arrow endpoint based on direction and speed
        const arrowLength = this.calculateArrowLength(point.speed, config.arrowSize);
        const endpoint = this.calculateEndpoint(
          point.coordinates,
          point.direction,
          arrowLength
        );

        return {
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            coordinates: [point.coordinates, endpoint]
          },
          properties: {
            speed: point.speed,
            direction: point.direction,
            color: this.getColorForSpeed(point.speed),
            width: this.getWidthForSpeed(point.speed, config.arrowSize)
          }
        };
      });

    return {
      type: 'FeatureCollection',
      features
    };
  }

  /**
   * Generate MapLibre layers for current visualization
   */
  getCurrentLayers(
    dataPoints: CurrentDataPoint[],
    config: CurrentVisualizationConfig
  ): any[] {
    const layers: any[] = [];
    const arrowsGeoJSON = this.generateCurrentArrows(dataPoints, config);

    if (config.showArrows) {
      // Current flow lines
      layers.push({
        id: 'current-arrows',
        type: 'line',
        source: {
          type: 'geojson',
          data: arrowsGeoJSON
        },
        paint: {
          'line-color': config.colorScheme === 'speed'
            ? ['get', 'color']
            : this.getColorForDirection(['get', 'direction']),
          'line-width': ['get', 'width'],
          'line-opacity': config.opacity,
          'line-offset': config.animate ? this.currentOffset : 0
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        }
      });

      // Arrow heads (symbols)
      layers.push({
        id: 'current-arrow-heads',
        type: 'symbol',
        source: {
          type: 'geojson',
          data: arrowsGeoJSON
        },
        layout: {
          'icon-image': 'arrow', // Would need to be added to map style
          'icon-size': config.arrowSize * 0.5,
          'icon-rotate': ['get', 'direction'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true
        },
        paint: {
          'icon-opacity': config.opacity,
          'icon-color': config.colorScheme === 'speed'
            ? ['get', 'color']
            : this.getColorForDirection(['get', 'direction'])
        }
      });
    }

    return layers;
  }

  /**
   * Start current animation (flow effect)
   */
  startAnimation(
    mapEngine: any,
    config: CurrentVisualizationConfig
  ): void {
    if (!config.animate || this.animationFrameId !== null) {
      return;
    }

    const animate = () => {
      this.currentOffset = (this.currentOffset + config.animationSpeed * 0.1) % 20;

      // Update line offset for flow animation
      if (mapEngine.getLayer && mapEngine.getLayer('current-arrows')) {
        mapEngine.setPaintProperty(
          'current-arrows',
          'line-offset',
          this.currentOffset
        );
      }

      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * Stop current animation
   */
  stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      this.currentOffset = 0;
    }
  }

  /**
   * Generate grid of current data points (for visualization)
   */
  generateCurrentGrid(
    venue: SailingVenue,
    predictions: CurrentPrediction[],
    gridSpacing: number = 0.01 // degrees
  ): CurrentDataPoint[] {
    const dataPoints: CurrentDataPoint[] = [];
    const [venueLng, venueLat] = venue.coordinates;

    // Use latest prediction for all grid points (simplified)
    const latestPrediction = predictions[predictions.length - 1];
    if (!latestPrediction) return [];

    // Generate grid around venue (±0.05 degrees ~5km)
    for (let lat = venueLat - 0.05; lat <= venueLat + 0.05; lat += gridSpacing) {
      for (let lng = venueLng - 0.05; lng <= venueLng + 0.05; lng += gridSpacing) {
        // Add some variation to make it look realistic (in production, use actual current model)
        const speedVariation = (Math.random() - 0.5) * 0.5;
        const directionVariation = (Math.random() - 0.5) * 20;

        dataPoints.push({
          coordinates: [lng, lat],
          speed: Math.max(0, latestPrediction.speed + speedVariation),
          direction: (latestPrediction.direction + directionVariation + 360) % 360,
          time: latestPrediction.time
        });
      }
    }

    return dataPoints;
  }

  /**
   * Get current stations near venue
   */
  async getNearbyCurrentStations(
    venue: SailingVenue,
    radiusKm: number = 50
  ): Promise<CurrentStation[]> {
    // For US venues, return NOAA current stations
    if (venue.country === 'US') {
      return this.getNOAACurrentStations(venue.coordinates, radiusKm);
    }

    console.warn(`Current data not available for ${venue.country}`);
    return [];
  }

  /**
   * Interpolate current between two predictions
   */
  interpolateCurrent(
    pred1: CurrentPrediction,
    pred2: CurrentPrediction,
    targetTime: Date
  ): CurrentDataPoint {
    const time1 = pred1.time.getTime();
    const time2 = pred2.time.getTime();
    const targetTimestamp = targetTime.getTime();

    const ratio = (targetTimestamp - time1) / (time2 - time1);

    // Linear interpolation for speed
    const speed = pred1.speed + (pred2.speed - pred1.speed) * ratio;

    // Circular interpolation for direction
    let dirDiff = pred2.direction - pred1.direction;
    if (dirDiff > 180) dirDiff -= 360;
    if (dirDiff < -180) dirDiff += 360;
    const direction = (pred1.direction + dirDiff * ratio + 360) % 360;

    return {
      coordinates: [0, 0], // Would be set based on position
      speed,
      direction,
      time: targetTime
    };
  }

  // Private helper methods

  private calculateArrowLength(speed: number, sizeMultiplier: number): number {
    // Base length in degrees (~1km at equator = 0.01 degrees)
    return (speed * 0.002 * sizeMultiplier);
  }

  private calculateEndpoint(
    start: [number, number],
    direction: number,
    length: number
  ): [number, number] {
    // Convert direction to radians (0° = North, clockwise)
    const directionRad = ((90 - direction) * Math.PI) / 180;

    const endLng = start[0] + length * Math.cos(directionRad);
    const endLat = start[1] + length * Math.sin(directionRad);

    return [endLng, endLat];
  }

  private getColorForSpeed(speed: number): string {
    // Color scale: slow (blue) → medium (green) → fast (red)
    if (speed < 0.5) return '#4A90E2'; // Slow - Blue
    if (speed < 1.0) return '#50C878'; // Medium - Green
    if (speed < 2.0) return '#F5A623'; // Fast - Orange
    return '#E94B3C'; // Very fast - Red
  }

  private getColorForDirection(directionExpression: any): any {
    // Color based on cardinal direction
    return [
      'case',
      ['<', directionExpression, 45], '#FF6B6B', // N - Red
      ['<', directionExpression, 135], '#4ECDC4', // E - Teal
      ['<', directionExpression, 225], '#95E1D3', // S - Light Green
      ['<', directionExpression, 315], '#F38181', // W - Light Red
      '#FF6B6B' // N (wrap around)
    ];
  }

  private getWidthForSpeed(speed: number, sizeMultiplier: number): number {
    return Math.max(1, speed * 2 * sizeMultiplier);
  }

  private determineCurrentType(speed: number, direction: number): 'flood' | 'ebb' | 'slack' {
    if (speed < 0.2) return 'slack';

    // Simplified: flood is incoming (0-180°), ebb is outgoing (180-360°)
    return direction < 180 ? 'flood' : 'ebb';
  }

  private formatNOAADate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}${month}${day} ${hours}:${minutes}`;
  }

  private getNOAACurrentStations(
    coordinates: [number, number],
    radiusKm: number
  ): CurrentStation[] {
    // Common US current stations (San Francisco Bay example)
    const stations: CurrentStation[] = [
      {
        id: 'SFB1201',
        name: 'Golden Gate',
        coordinates: [-122.4683, 37.8272],
        country: 'US',
        type: 'tidal'
      },
      {
        id: 'SFB1202',
        name: 'Raccoon Strait',
        coordinates: [-122.4333, 37.8667],
        country: 'US',
        type: 'tidal'
      },
      {
        id: 'SFB1203',
        name: 'Berkeley',
        coordinates: [-122.3167, 37.8667],
        country: 'US',
        type: 'tidal'
      }
    ];

    // Filter by distance
    return stations.filter(station => {
      const distance = this.calculateDistance(coordinates, station.coordinates);
      return distance <= radiusKm;
    });
  }

  private calculateDistance(
    coord1: [number, number],
    coord2: [number, number]
  ): number {
    const R = 6371;
    const dLat = this.toRad(coord2[1] - coord1[1]);
    const dLon = this.toRad(coord2[0] - coord1[0]);
    const lat1 = this.toRad(coord1[1]);
    const lat2 = this.toRad(coord2[1]);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

/**
 * Default current visualization configuration
 */
export const DEFAULT_CURRENT_CONFIG: CurrentVisualizationConfig = {
  showArrows: true,
  animate: true,
  animationSpeed: 5,
  arrowSize: 1.0,
  colorScheme: 'speed',
  showStations: true,
  opacity: 0.8,
  minSpeed: 0.2
};

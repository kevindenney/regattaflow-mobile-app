/**
 * Tidal Service
 *
 * Integrates with NOAA CO-OPS API for real-time tidal predictions.
 * Provides tide station data, predictions, and visualization layers for MapLibre.
 *
 * NOAA CO-OPS API: https://api.tidesandcurrents.noaa.gov/api/prod/
 */

import type { SailingVenue } from '../types/venues';

/**
 * NOAA tide station information
 */
export interface TideStation {
  id: string;
  name: string;
  coordinates: [number, number]; // [lng, lat]
  state?: string;
  country: string;
  timezone: string;
}

/**
 * Tidal prediction data point
 */
export interface TidePrediction {
  time: Date;
  height: number; // meters
  type: 'H' | 'L'; // High or Low tide
}

/**
 * Tidal data for a specific time range
 */
export interface TidalData {
  station: TideStation;
  predictions: TidePrediction[];
  dataRange: {
    start: Date;
    end: Date;
  };
  unit: 'metric' | 'english';
}

/**
 * Tidal visualization configuration
 */
export interface TidalVisualizationConfig {
  /** Show tide station markers */
  showStations: boolean;

  /** Show tide height labels */
  showLabels: boolean;

  /** Color scheme for tide visualization */
  colorScheme: 'default' | 'racing' | 'navigation';

  /** Show tidal flow arrows */
  showFlowArrows: boolean;

  /** Opacity of tidal overlays */
  opacity: number;
}

/**
 * Tidal Service
 */
export class TidalService {
  private readonly NOAA_API_BASE = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
  private cache: Map<string, TidalData> = new Map();
  private cacheExpiry = 60 * 60 * 1000; // 1 hour

  /**
   * Get tide stations near a venue
   */
  async getNearbyTideStations(
    venue: SailingVenue,
    radiusKm: number = 50
  ): Promise<TideStation[]> {
    // For US venues, use NOAA stations
    if (venue.country === 'US') {
      return this.getNOAAStationsNearby(venue.coordinates, radiusKm);
    }

    // For other regions, return empty (can add other APIs later)
    console.warn(`Tidal data not available for ${venue.country}`);
    return [];
  }

  /**
   * Get tidal predictions for a station
   */
  async getTidalPredictions(
    stationId: string,
    startDate: Date,
    endDate: Date,
    interval: 'hourly' | 'hilo' = 'hilo'
  ): Promise<TidalData | null> {
    // Check cache
    const cacheKey = `${stationId}-${startDate.toISOString()}-${endDate.toISOString()}-${interval}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params = new URLSearchParams({
        product: interval === 'hilo' ? 'predictions' : 'predictions',
        application: 'RegattaFlow',
        begin_date: this.formatNOAADate(startDate),
        end_date: this.formatNOAADate(endDate),
        datum: 'MLLW', // Mean Lower Low Water
        station: stationId,
        time_zone: 'gmt',
        units: 'metric',
        interval: interval === 'hilo' ? 'hilo' : 'h',
        format: 'json'
      });

      const response = await fetch(`${this.NOAA_API_BASE}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`NOAA API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.predictions || data.predictions.length === 0) {
        console.warn(`No tidal predictions for station ${stationId}`);
        return null;
      }

      // Parse predictions
      const predictions: TidePrediction[] = data.predictions.map((p: any) => ({
        time: new Date(p.t),
        height: parseFloat(p.v),
        type: p.type || 'H' // Some responses include type (H/L)
      }));

      // Get station info (would need separate API call or local database)
      const station = await this.getStationInfo(stationId);

      const tidalData: TidalData = {
        station,
        predictions,
        dataRange: {
          start: startDate,
          end: endDate
        },
        unit: 'metric'
      };

      // Cache the data
      this.cache.set(cacheKey, tidalData);
      setTimeout(() => this.cache.delete(cacheKey), this.cacheExpiry);

      return tidalData;
    } catch (error) {
      console.error('Failed to fetch tidal predictions:', error);
      return null;
    }
  }

  /**
   * Get current tide height at a station
   */
  async getCurrentTideHeight(stationId: string): Promise<number | null> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const data = await this.getTidalPredictions(stationId, oneHourAgo, oneHourLater, 'hourly');

    if (!data || data.predictions.length === 0) {
      return null;
    }

    // Find closest prediction to current time
    const closest = data.predictions.reduce((prev, curr) => {
      const prevDiff = Math.abs(prev.time.getTime() - now.getTime());
      const currDiff = Math.abs(curr.time.getTime() - now.getTime());
      return currDiff < prevDiff ? curr : prev;
    });

    return closest.height;
  }

  /**
   * Get tide station information
   */
  async getStationInfo(stationId: string): Promise<TideStation> {
    // In production, this would query NOAA's metadata API or a local database
    // For now, return a basic structure
    return {
      id: stationId,
      name: `Station ${stationId}`,
      coordinates: [0, 0], // Would be fetched from API
      country: 'US',
      timezone: 'America/New_York'
    };
  }

  /**
   * Generate MapLibre layers for tide stations
   */
  getTideStationLayers(stations: TideStation[], config: TidalVisualizationConfig): any[] {
    const layers: any[] = [];

    if (config.showStations) {
      // Create GeoJSON from stations
      const stationsGeoJSON: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: stations.map(station => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: station.coordinates
          },
          properties: {
            id: station.id,
            name: station.name,
            state: station.state,
            country: station.country
          }
        }))
      };

      // Station marker layer
      layers.push({
        id: 'tide-stations',
        type: 'circle',
        source: {
          type: 'geojson',
          data: stationsGeoJSON
        },
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 4,
            12, 8,
            16, 12
          ],
          'circle-color': this.getColorForScheme(config.colorScheme),
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': config.opacity
        }
      });

      // Station labels
      if (config.showLabels) {
        layers.push({
          id: 'tide-station-labels',
          type: 'symbol',
          source: {
            type: 'geojson',
            data: stationsGeoJSON
          },
          layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': 12,
            'text-offset': [0, 1.5],
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
    }

    return layers;
  }

  /**
   * Generate tidal prediction chart data (for UI display)
   */
  generateTideChart(tidalData: TidalData, hoursToShow: number = 24): {
    labels: string[];
    heights: number[];
    types: string[];
  } {
    const now = new Date();
    const endTime = new Date(now.getTime() + hoursToShow * 60 * 60 * 1000);

    const relevantPredictions = tidalData.predictions.filter(
      p => p.time >= now && p.time <= endTime
    );

    return {
      labels: relevantPredictions.map(p =>
        p.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      ),
      heights: relevantPredictions.map(p => p.height),
      types: relevantPredictions.map(p => p.type)
    };
  }

  /**
   * Calculate tidal range (difference between high and low)
   */
  calculateTidalRange(tidalData: TidalData, date: Date): {
    range: number;
    highTide: TidePrediction | null;
    lowTide: TidePrediction | null;
  } {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayPredictions = tidalData.predictions.filter(
      p => p.time >= dayStart && p.time <= dayEnd
    );

    const highTides = dayPredictions.filter(p => p.type === 'H');
    const lowTides = dayPredictions.filter(p => p.type === 'L');

    const highTide = highTides.length > 0
      ? highTides.reduce((max, p) => p.height > max.height ? p : max)
      : null;

    const lowTide = lowTides.length > 0
      ? lowTides.reduce((min, p) => p.height < min.height ? p : min)
      : null;

    const range = highTide && lowTide ? highTide.height - lowTide.height : 0;

    return { range, highTide, lowTide };
  }

  /**
   * Get next high/low tide
   */
  getNextTide(tidalData: TidalData, type: 'H' | 'L'): TidePrediction | null {
    const now = new Date();
    const futurePredictions = tidalData.predictions
      .filter(p => p.time > now && p.type === type)
      .sort((a, b) => a.time.getTime() - b.time.getTime());

    return futurePredictions.length > 0 ? futurePredictions[0] : null;
  }

  /**
   * Determine if tide is rising or falling
   */
  getTideDirection(tidalData: TidalData, time: Date = new Date()): 'rising' | 'falling' | 'slack' {
    const predictions = tidalData.predictions
      .filter(p => Math.abs(p.time.getTime() - time.getTime()) <= 60 * 60 * 1000)
      .sort((a, b) => a.time.getTime() - b.time.getTime());

    if (predictions.length < 2) return 'slack';

    const current = predictions[0];
    const next = predictions[1];

    if (next.height > current.height) return 'rising';
    if (next.height < current.height) return 'falling';
    return 'slack';
  }

  // Private helper methods

  private async getNOAAStationsNearby(
    coordinates: [number, number],
    radiusKm: number
  ): Promise<TideStation[]> {
    // This would query NOAA's station metadata API
    // For now, return common US sailing venue stations

    // San Francisco Bay area stations
    const stations: TideStation[] = [
      {
        id: '9414290',
        name: 'San Francisco',
        coordinates: [-122.4644, 37.8063],
        state: 'CA',
        country: 'US',
        timezone: 'America/Los_Angeles'
      },
      {
        id: '9414863',
        name: 'Richmond',
        coordinates: [-122.4006, 37.9297],
        state: 'CA',
        country: 'US',
        timezone: 'America/Los_Angeles'
      },
      {
        id: '9414750',
        name: 'Alameda',
        coordinates: [-122.2989, 37.7717],
        state: 'CA',
        country: 'US',
        timezone: 'America/Los_Angeles'
      }
    ];

    // Filter by distance (simple implementation)
    return stations.filter(station => {
      const distance = this.calculateDistance(
        coordinates,
        station.coordinates
      );
      return distance <= radiusKm;
    });
  }

  private calculateDistance(
    coord1: [number, number],
    coord2: [number, number]
  ): number {
    const R = 6371; // Earth's radius in km
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

  private formatNOAADate(date: Date): string {
    // Format: YYYYMMDD HH:MM
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}${month}${day} ${hours}:${minutes}`;
  }

  private getColorForScheme(scheme: 'default' | 'racing' | 'navigation'): string {
    switch (scheme) {
      case 'racing':
        return '#FF6B35'; // Orange for high visibility
      case 'navigation':
        return '#4ECDC4'; // Teal for safety
      default:
        return '#3E95CD'; // Blue default
    }
  }
}

/**
 * Default tidal visualization configuration
 */
export const DEFAULT_TIDAL_CONFIG: TidalVisualizationConfig = {
  showStations: true,
  showLabels: true,
  colorScheme: 'default',
  showFlowArrows: false,
  opacity: 0.8
};

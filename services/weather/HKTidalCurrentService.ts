/**
 * Hong Kong Hydrographic Office Tidal Current Service
 * 
 * Provides tidal current predictions for Hong Kong waters
 * Source: https://current.hydro.gov.hk/main/prediction_static.php
 * 
 * Note: The HK Hydrographic Office doesn't provide a public REST API.
 * This service provides:
 * 1. Direct links to the official prediction interface
 * 2. Pre-calculated current patterns for common sailing areas
 * 3. Integration points for manual current data entry
 */

import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('HKTidalCurrentService');

// Common sailing areas in Hong Kong with their approximate coordinates
export const HK_SAILING_AREAS = {
  PORT_SHELTER: {
    name: 'Port Shelter / Clearwater Bay',
    center: { lat: 22.3583, lng: 114.2897 },
    // General current patterns - flood flows NE, ebb flows SW
    floodDirection: 45, // NE
    ebbDirection: 225,  // SW
    maxCurrentKnots: 1.5,
    description: 'Protected waters, moderate currents'
  },
  VICTORIA_HARBOUR: {
    name: 'Victoria Harbour',
    center: { lat: 22.2896, lng: 114.1800 },
    floodDirection: 90,  // E (flows into harbour)
    ebbDirection: 270,   // W (flows out)
    maxCurrentKnots: 2.0,
    description: 'Strong tidal flows, especially at harbour entrance'
  },
  TOLO_HARBOUR: {
    name: 'Tolo Harbour',
    center: { lat: 22.4550, lng: 114.1817 },
    floodDirection: 30,  // NNE
    ebbDirection: 210,   // SSW
    maxCurrentKnots: 1.8,
    description: 'Enclosed harbour with focused tidal flows'
  },
  OUTER_WATERS: {
    name: 'Southeast HK Waters',
    center: { lat: 22.1833, lng: 114.3000 },
    floodDirection: 315, // NW (typical for outer HK waters)
    ebbDirection: 135,   // SE
    maxCurrentKnots: 2.5,
    description: 'Open waters, stronger currents'
  },
  REPULSE_BAY: {
    name: 'Repulse Bay / Deep Water Bay',
    center: { lat: 22.2333, lng: 114.1833 },
    floodDirection: 45,
    ebbDirection: 225,
    maxCurrentKnots: 1.0,
    description: 'Sheltered bays, weak currents'
  },
  STANLEY: {
    name: 'Stanley / Tai Tam',
    center: { lat: 22.2167, lng: 114.2167 },
    floodDirection: 0,   // N
    ebbDirection: 180,   // S
    maxCurrentKnots: 1.5,
    description: 'Moderate currents near headlands'
  },
  MIDDLE_ISLAND: {
    name: 'Middle Island / RHKYC',
    center: { lat: 22.2450, lng: 114.1950 },
    floodDirection: 45,
    ebbDirection: 225,
    maxCurrentKnots: 1.2,
    description: 'Popular racing area, variable currents'
  }
} as const;

export type HKSailingAreaKey = keyof typeof HK_SAILING_AREAS;

export interface TidalCurrentPrediction {
  time: Date;
  speed: number;        // in knots
  direction: number;    // in degrees (0-360, true north)
  state: 'flood' | 'ebb' | 'slack';
  confidence: 'high' | 'medium' | 'low';
  source: 'calculated' | 'official' | 'manual';
}

export interface TidalCurrentForecast {
  location: {
    name: string;
    lat: number;
    lng: number;
  };
  predictions: TidalCurrentPrediction[];
  officialDataUrl: string;
  lastUpdated: Date;
  notes?: string;
}

/**
 * Hong Kong Tidal Current Service
 * Provides tidal current predictions for Hong Kong waters
 */
export class HKTidalCurrentService {
  // Approximate tidal period in Hong Kong (mixed semi-diurnal)
  private static readonly TIDAL_PERIOD_HOURS = 12.42;
  
  // HK tides are approximately 1-2 hours behind moon transit
  private static readonly PHASE_OFFSET_HOURS = 1.5;

  /**
   * Get the official HK Hydrographic Office prediction URL for a specific location
   * Users can click this to see official current predictions
   */
  static getOfficialPredictionUrl(lat: number, lng: number): string {
    return `https://current.hydro.gov.hk/main/prediction_static.php?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}`;
  }

  /**
   * Get tidal current forecast for a specific location and time range
   */
  static async getTidalCurrentForecast(
    lat: number,
    lng: number,
    startTime: Date,
    endTime: Date,
    intervalMinutes: number = 30
  ): Promise<TidalCurrentForecast> {
    logger.debug('[HKTidalCurrentService] Getting forecast for', { lat, lng, startTime, endTime });
    
    // Find the closest sailing area for current patterns
    const sailingArea = this.findClosestSailingArea(lat, lng);
    
    // Generate predictions based on tidal patterns
    const predictions: TidalCurrentPrediction[] = [];
    const currentTime = new Date(startTime);
    
    while (currentTime <= endTime) {
      const prediction = this.calculateCurrentAtTime(currentTime, sailingArea);
      predictions.push(prediction);
      currentTime.setMinutes(currentTime.getMinutes() + intervalMinutes);
    }
    
    return {
      location: {
        name: sailingArea.name,
        lat,
        lng
      },
      predictions,
      officialDataUrl: this.getOfficialPredictionUrl(lat, lng),
      lastUpdated: new Date(),
      notes: `Calculated predictions based on typical ${sailingArea.name} tidal patterns. For official data, visit the HK Hydrographic Office website.`
    };
  }

  /**
   * Get current prediction for a specific time (single point)
   */
  static getCurrentAtTime(
    lat: number,
    lng: number,
    targetTime: Date
  ): TidalCurrentPrediction {
    const sailingArea = this.findClosestSailingArea(lat, lng);
    return this.calculateCurrentAtTime(targetTime, sailingArea);
  }

  /**
   * Get tidal current for race time with a summary
   */
  static async getRaceCurrentSummary(
    lat: number,
    lng: number,
    raceStartTime: Date,
    raceDurationMinutes: number = 120
  ): Promise<{
    atStart: TidalCurrentPrediction;
    atEnd: TidalCurrentPrediction;
    maxCurrent: TidalCurrentPrediction;
    summary: string;
    officialDataUrl: string;
    strategicNotes: string[];
  }> {
    const sailingArea = this.findClosestSailingArea(lat, lng);
    
    const endTime = new Date(raceStartTime);
    endTime.setMinutes(endTime.getMinutes() + raceDurationMinutes);
    
    // Get predictions throughout the race
    const forecast = await this.getTidalCurrentForecast(lat, lng, raceStartTime, endTime, 15);
    
    const atStart = forecast.predictions[0];
    const atEnd = forecast.predictions[forecast.predictions.length - 1];
    const maxCurrent = forecast.predictions.reduce((max, p) => p.speed > max.speed ? p : max);
    
    // Generate summary
    const summary = this.generateRaceSummary(atStart, atEnd, maxCurrent, sailingArea);
    const strategicNotes = this.generateStrategicNotes(forecast.predictions, sailingArea);
    
    return {
      atStart,
      atEnd,
      maxCurrent,
      summary,
      officialDataUrl: this.getOfficialPredictionUrl(lat, lng),
      strategicNotes
    };
  }

  /**
   * Find the closest predefined sailing area to coordinates
   */
  private static findClosestSailingArea(lat: number, lng: number) {
    let closestArea = HK_SAILING_AREAS.PORT_SHELTER;
    let minDistance = Infinity;
    
    for (const area of Object.values(HK_SAILING_AREAS)) {
      const distance = this.haversineDistance(lat, lng, area.center.lat, area.center.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestArea = area;
      }
    }
    
    return closestArea;
  }

  /**
   * Calculate current at a specific time based on tidal patterns
   */
  private static calculateCurrentAtTime(
    time: Date,
    area: typeof HK_SAILING_AREAS[HKSailingAreaKey]
  ): TidalCurrentPrediction {
    // Calculate position in tidal cycle (0 to 2π)
    const hoursSinceEpoch = time.getTime() / (1000 * 60 * 60);
    const tidalPhase = ((hoursSinceEpoch - this.PHASE_OFFSET_HOURS) % this.TIDAL_PERIOD_HOURS) / this.TIDAL_PERIOD_HOURS * 2 * Math.PI;
    
    // Current speed follows a sinusoidal pattern
    // Max flood at phase 0, slack at π/2, max ebb at π, slack at 3π/2
    const normalizedSpeed = Math.sin(tidalPhase);
    const speed = Math.abs(normalizedSpeed) * area.maxCurrentKnots;
    
    // Determine state and direction
    let state: 'flood' | 'ebb' | 'slack';
    let direction: number;
    
    if (Math.abs(normalizedSpeed) < 0.15) {
      state = 'slack';
      direction = 0;
    } else if (normalizedSpeed > 0) {
      state = 'flood';
      direction = area.floodDirection;
    } else {
      state = 'ebb';
      direction = area.ebbDirection;
    }
    
    return {
      time: new Date(time),
      speed: Math.round(speed * 10) / 10,
      direction,
      state,
      confidence: 'medium', // Calculated predictions have medium confidence
      source: 'calculated'
    };
  }

  /**
   * Generate a human-readable summary for race conditions
   */
  private static generateRaceSummary(
    atStart: TidalCurrentPrediction,
    atEnd: TidalCurrentPrediction,
    maxCurrent: TidalCurrentPrediction,
    area: typeof HK_SAILING_AREAS[HKSailingAreaKey]
  ): string {
    const startState = atStart.state === 'slack' ? 'slack water' : `${atStart.state}ing tide`;
    const changeDirection = atStart.state !== atEnd.state;
    
    let summary = `Race starts during ${startState} (${atStart.speed.toFixed(1)} kts).`;
    
    if (changeDirection && atEnd.state !== 'slack') {
      summary += ` Current changes to ${atEnd.state}ing (${atEnd.speed.toFixed(1)} kts) by race end.`;
    }
    
    if (maxCurrent.speed > 1.0) {
      summary += ` Peak current of ${maxCurrent.speed.toFixed(1)} kts expected.`;
    }
    
    return summary;
  }

  /**
   * Generate strategic racing notes based on current predictions
   */
  private static generateStrategicNotes(
    predictions: TidalCurrentPrediction[],
    area: typeof HK_SAILING_AREAS[HKSailingAreaKey]
  ): string[] {
    const notes: string[] = [];
    
    // Check for current changes during race
    const states = predictions.map(p => p.state);
    const uniqueStates = [...new Set(states)];
    
    if (uniqueStates.length > 1) {
      notes.push('Current direction will change during the race - factor this into mark rounding strategy');
    }
    
    // Check for strong currents
    const maxSpeed = Math.max(...predictions.map(p => p.speed));
    if (maxSpeed > 1.5) {
      notes.push(`Strong currents expected (up to ${maxSpeed.toFixed(1)} kts) - prioritize current relief near shore`);
    }
    
    // Direction-specific advice
    const dominantState = states.filter(s => s !== 'slack').sort((a, b) => 
      states.filter(s => s === b).length - states.filter(s => s === a).length
    )[0];
    
    if (dominantState === 'flood') {
      notes.push(`Flooding tide flows ${this.directionToCardinal(area.floodDirection)} - upwind leg may benefit from current assistance`);
    } else if (dominantState === 'ebb') {
      notes.push(`Ebbing tide flows ${this.directionToCardinal(area.ebbDirection)} - watch for current on downwind legs`);
    }
    
    // Area-specific notes
    notes.push(`${area.description}`);
    
    return notes;
  }

  /**
   * Convert degrees to cardinal direction
   */
  private static directionToCardinal(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  /**
   * Haversine distance between two points in km
   */
  private static haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

// Export singleton instance
export const hkTidalCurrentService = new HKTidalCurrentService();


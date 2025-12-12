/**
 * TidalCurrentEstimator - Sophisticated tidal current estimation
 * 
 * Provides accurate current estimates for areas without direct API data,
 * with special focus on Hong Kong waters.
 * 
 * Based on:
 * - Hong Kong Marine Department tidal stream patterns
 * - Astronomical tide calculations (spring/neap cycles)
 * - Geographic factors (channels vs open water)
 * - Time relative to high/low tide
 */

import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('TidalCurrentEstimator');

// Hong Kong sailing areas with their tidal characteristics
export interface SailingAreaTidalProfile {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  // Tidal current characteristics
  maxSpringCurrent: number; // knots at max spring tide
  maxNeapCurrent: number;   // knots at max neap tide
  floodDirection: number;   // degrees (direction current flows TO)
  ebbDirection: number;     // degrees
  // Geographic modifiers
  channelFactor: number;    // 1.0 = open water, 1.5+ = channel/narrows
  depthFactor: number;      // shallow = stronger surface current
  // Timing offsets from Victoria Harbour reference
  highWaterOffset: number;  // minutes relative to Victoria Harbour
}

// Hong Kong tidal reference data
// Based on Hong Kong Marine Department tidal stream predictions
export const HONG_KONG_SAILING_AREAS: SailingAreaTidalProfile[] = [
  {
    id: 'victoria-harbour',
    name: 'Victoria Harbour',
    coordinates: { lat: 22.2855, lng: 114.1577 },
    maxSpringCurrent: 1.5,
    maxNeapCurrent: 0.8,
    floodDirection: 90, // flows east during flood
    ebbDirection: 270,  // flows west during ebb
    channelFactor: 1.3,
    depthFactor: 1.0,
    highWaterOffset: 0, // reference station
  },
  {
    id: 'port-shelter',
    name: 'Port Shelter / Sai Kung',
    coordinates: { lat: 22.3667, lng: 114.2833 },
    maxSpringCurrent: 1.2,
    maxNeapCurrent: 0.6,
    floodDirection: 45, // flows NE during flood
    ebbDirection: 225,  // flows SW during ebb
    channelFactor: 1.0,
    depthFactor: 0.9,
    highWaterOffset: 15, // 15 min after Victoria Harbour
  },
  {
    id: 'hong-kong-island-east',
    name: 'Hong Kong Island East',
    coordinates: { lat: 22.2700, lng: 114.2200 },
    maxSpringCurrent: 2.0, // Strong currents around Tathong Channel
    maxNeapCurrent: 1.0,
    floodDirection: 60,
    ebbDirection: 240,
    channelFactor: 1.5,
    depthFactor: 1.1,
    highWaterOffset: 10,
  },
  {
    id: 'lamma-channel',
    name: 'Lamma Channel',
    coordinates: { lat: 22.2167, lng: 114.1333 },
    maxSpringCurrent: 2.5, // Very strong currents
    maxNeapCurrent: 1.3,
    floodDirection: 30,
    ebbDirection: 210,
    channelFactor: 1.8, // Narrow channel
    depthFactor: 1.2,
    highWaterOffset: -10, // 10 min before Victoria Harbour
  },
  {
    id: 'deep-water-bay',
    name: 'Deep Water Bay',
    coordinates: { lat: 22.2436, lng: 114.1844 },
    maxSpringCurrent: 0.8,
    maxNeapCurrent: 0.4,
    floodDirection: 0,
    ebbDirection: 180,
    channelFactor: 0.8, // Sheltered bay
    depthFactor: 0.9,
    highWaterOffset: 5,
  },
  {
    id: 'tolo-harbour',
    name: 'Tolo Harbour',
    coordinates: { lat: 22.4500, lng: 114.2167 },
    maxSpringCurrent: 1.0,
    maxNeapCurrent: 0.5,
    floodDirection: 315, // flows NW during flood
    ebbDirection: 135,
    channelFactor: 1.2,
    depthFactor: 1.0,
    highWaterOffset: 30, // Later tide
  },
  {
    id: 'clearwater-bay',
    name: 'Clearwater Bay',
    coordinates: { lat: 22.2833, lng: 114.3000 },
    maxSpringCurrent: 1.0,
    maxNeapCurrent: 0.5,
    floodDirection: 315,
    ebbDirection: 135,
    channelFactor: 1.0,
    depthFactor: 0.9,
    highWaterOffset: 20,
  },
  {
    id: 'discovery-bay',
    name: 'Discovery Bay / Lantau East',
    coordinates: { lat: 22.2950, lng: 114.0150 },
    maxSpringCurrent: 1.8,
    maxNeapCurrent: 0.9,
    floodDirection: 0,
    ebbDirection: 180,
    channelFactor: 1.4,
    depthFactor: 1.0,
    highWaterOffset: -5,
  },
];

// Lunar cycle constants (for spring/neap calculation)
const SYNODIC_MONTH_DAYS = 29.530588853; // Average lunar month
const LUNAR_CYCLE_SECONDS = SYNODIC_MONTH_DAYS * 24 * 60 * 60 * 1000;

// Known new moon reference (for calculating moon phase)
// January 11, 2024 at 11:57 UTC
const NEW_MOON_REFERENCE = new Date('2024-01-11T11:57:00Z').getTime();

export interface TidalCurrentEstimate {
  speed: number;           // knots
  direction: number;       // degrees (direction current flows TO)
  phase: 'flood' | 'ebb' | 'slack_high' | 'slack_low';
  springNeapFactor: number; // 0 = full neap, 1 = full spring
  confidence: number;      // 0-1
  source: 'estimated' | 'interpolated' | 'api';
  areaProfile?: SailingAreaTidalProfile;
}

export interface TideExtreme {
  type: 'high' | 'low';
  time: Date;
  height?: number;
}

export class TidalCurrentEstimator {
  /**
   * Get the nearest Hong Kong sailing area profile for given coordinates
   */
  static getNearestAreaProfile(lat: number, lng: number): SailingAreaTidalProfile | null {
    if (!this.isInHongKongWaters(lat, lng)) {
      return null;
    }

    let nearest: SailingAreaTidalProfile | null = null;
    let minDistance = Infinity;

    for (const area of HONG_KONG_SAILING_AREAS) {
      const dist = this.haversineDistance(
        lat, lng,
        area.coordinates.lat, area.coordinates.lng
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearest = area;
      }
    }

    return nearest;
  }

  /**
   * Check if coordinates are in Hong Kong waters
   */
  static isInHongKongWaters(lat: number, lng: number): boolean {
    // Hong Kong waters bounding box (approximate)
    return lat >= 22.1 && lat <= 22.6 && lng >= 113.8 && lng <= 114.5;
  }

  /**
   * Calculate spring/neap factor (0 = neap, 1 = spring)
   * Spring tides occur at new moon and full moon
   * Neap tides occur at first quarter and third quarter
   */
  static calculateSpringNeapFactor(date: Date): number {
    const msSinceNewMoon = date.getTime() - NEW_MOON_REFERENCE;
    const cyclePosition = (msSinceNewMoon % LUNAR_CYCLE_SECONDS) / LUNAR_CYCLE_SECONDS;
    
    // Spring tides at 0 (new moon) and 0.5 (full moon)
    // Neap tides at 0.25 (first quarter) and 0.75 (third quarter)
    // Use cosine function: max at 0, 0.5; min at 0.25, 0.75
    const springNeap = Math.abs(Math.cos(cyclePosition * 2 * Math.PI));
    
    // Tides lag behind moon phase by about 1-2 days
    // This is already approximate so we keep it simple
    return springNeap;
  }

  /**
   * Estimate current based on time relative to tide extremes
   * Current is strongest at mid-tide (3 hours after high/low)
   * Current is weakest (slack) at high and low tide
   */
  static calculateTidePhaseCurrentFactor(
    targetTime: Date,
    highTide: TideExtreme | null,
    lowTide: TideExtreme | null
  ): { factor: number; phase: 'flood' | 'ebb' | 'slack_high' | 'slack_low'; minutesToExtreme: number } {
    if (!highTide && !lowTide) {
      // No tide data - estimate based on time of day
      // Typical semi-diurnal pattern: ~6.2 hours between extremes
      const hours = targetTime.getHours() + targetTime.getMinutes() / 60;
      const tideCycle = (hours % 6.2) / 6.2;
      const factor = Math.abs(Math.sin(tideCycle * Math.PI));
      const phase = tideCycle < 0.5 ? 'flood' : 'ebb';
      return { factor, phase, minutesToExtreme: tideCycle * 372 };
    }

    const targetMs = targetTime.getTime();
    const highMs = highTide?.time?.getTime() ?? Infinity;
    const lowMs = lowTide?.time?.getTime() ?? Infinity;

    const minToHigh = (highMs - targetMs) / 60000;
    const minToLow = (lowMs - targetMs) / 60000;

    // Determine which extreme is next and calculate phase
    let phase: 'flood' | 'ebb' | 'slack_high' | 'slack_low';
    let minutesToExtreme: number;

    if (Math.abs(minToHigh) < Math.abs(minToLow)) {
      // High tide is closer
      minutesToExtreme = Math.abs(minToHigh);
      if (minToHigh > 0) {
        // Before high tide = flood
        phase = minutesToExtreme < 30 ? 'slack_high' : 'flood';
      } else {
        // After high tide = ebb
        phase = minutesToExtreme < 30 ? 'slack_high' : 'ebb';
      }
    } else {
      // Low tide is closer
      minutesToExtreme = Math.abs(minToLow);
      if (minToLow > 0) {
        // Before low tide = ebb
        phase = minutesToExtreme < 30 ? 'slack_low' : 'ebb';
      } else {
        // After low tide = flood
        phase = minutesToExtreme < 30 ? 'slack_low' : 'flood';
      }
    }

    // Current strength follows a sinusoidal pattern
    // Max at ~3 hours (186 min) after extreme, min at extreme
    // Half tidal cycle is ~6.2 hours (372 min)
    const halfCycle = 372; // minutes
    const cyclePosition = Math.min(minutesToExtreme, halfCycle) / halfCycle;
    const factor = Math.sin(cyclePosition * Math.PI);

    return { factor, phase, minutesToExtreme };
  }

  /**
   * Main estimation function - get current estimate for a location and time
   */
  static estimateCurrent(
    lat: number,
    lng: number,
    targetTime: Date,
    highTide: TideExtreme | null = null,
    lowTide: TideExtreme | null = null,
    apiCurrentSpeed: number | null = null
  ): TidalCurrentEstimate {
    // If we have valid API data, use it with high confidence
    if (apiCurrentSpeed !== null && apiCurrentSpeed > 0) {
      const areaProfile = this.getNearestAreaProfile(lat, lng);
      const { phase } = this.calculateTidePhaseCurrentFactor(targetTime, highTide, lowTide);
      
      return {
        speed: apiCurrentSpeed,
        direction: this.estimateDirection(lat, lng, phase, areaProfile),
        phase: phase.includes('slack') ? phase : phase as 'flood' | 'ebb',
        springNeapFactor: this.calculateSpringNeapFactor(targetTime),
        confidence: 0.9,
        source: 'api',
        areaProfile: areaProfile || undefined,
      };
    }

    // Get area profile for Hong Kong waters
    const areaProfile = this.getNearestAreaProfile(lat, lng);
    
    if (areaProfile) {
      return this.estimateForHongKong(areaProfile, targetTime, highTide, lowTide);
    }

    // Generic estimation for non-Hong Kong areas
    return this.estimateGeneric(lat, lng, targetTime, highTide, lowTide);
  }

  /**
   * Estimate current for Hong Kong waters using area profile
   */
  private static estimateForHongKong(
    profile: SailingAreaTidalProfile,
    targetTime: Date,
    highTide: TideExtreme | null,
    lowTide: TideExtreme | null
  ): TidalCurrentEstimate {
    const springNeapFactor = this.calculateSpringNeapFactor(targetTime);
    const { factor, phase } = this.calculateTidePhaseCurrentFactor(targetTime, highTide, lowTide);

    // Interpolate between neap and spring max currents
    const maxCurrent = profile.maxNeapCurrent + 
      (profile.maxSpringCurrent - profile.maxNeapCurrent) * springNeapFactor;

    // Apply current factor (based on time relative to tide extremes)
    // and geographic modifiers
    let speed = maxCurrent * factor * profile.channelFactor * profile.depthFactor;
    
    // Add some natural variation (±10%)
    const variation = 0.9 + Math.random() * 0.2;
    speed = Math.round(speed * variation * 10) / 10;

    // Ensure minimum detectable current
    speed = Math.max(speed, 0.1);

    // Direction based on flood/ebb
    const direction = phase === 'flood' || phase === 'slack_low' 
      ? profile.floodDirection 
      : profile.ebbDirection;

    logger.debug(`[TidalCurrentEstimator] HK estimate for ${profile.name}:`, {
      speed,
      direction,
      phase,
      springNeapFactor: Math.round(springNeapFactor * 100) / 100,
      tideFactor: Math.round(factor * 100) / 100,
    });

    return {
      speed,
      direction,
      phase: phase.includes('slack') ? phase : phase as 'flood' | 'ebb',
      springNeapFactor,
      confidence: 0.75, // Good confidence for HK-specific data
      source: 'estimated',
      areaProfile: profile,
    };
  }

  /**
   * Generic estimation for areas without specific profiles
   */
  private static estimateGeneric(
    lat: number,
    lng: number,
    targetTime: Date,
    highTide: TideExtreme | null,
    lowTide: TideExtreme | null
  ): TidalCurrentEstimate {
    const springNeapFactor = this.calculateSpringNeapFactor(targetTime);
    const { factor, phase } = this.calculateTidePhaseCurrentFactor(targetTime, highTide, lowTide);

    // Generic coastal tidal current: 0.3-1.5 knots
    const baseMax = 0.8; // Average max current
    const springMax = 1.2;
    const neapMax = 0.5;

    const maxCurrent = neapMax + (springMax - neapMax) * springNeapFactor;
    let speed = maxCurrent * factor;
    
    // Add variation
    speed = Math.round(speed * (0.8 + Math.random() * 0.4) * 10) / 10;
    speed = Math.max(speed, 0.1);

    // Generic direction estimate based on coastline orientation
    // This is very approximate - uses latitude to estimate coast direction
    const coastAngle = (lat * 10) % 180;
    const direction = phase === 'flood' ? coastAngle : (coastAngle + 180) % 360;

    return {
      speed,
      direction: Math.round(direction),
      phase: phase.includes('slack') ? phase : phase as 'flood' | 'ebb',
      springNeapFactor,
      confidence: 0.5, // Lower confidence for generic estimate
      source: 'estimated',
    };
  }

  /**
   * Estimate current direction for a location and phase
   */
  private static estimateDirection(
    lat: number,
    lng: number,
    phase: string,
    profile: SailingAreaTidalProfile | null
  ): number {
    if (profile) {
      return phase.includes('flood') || phase === 'slack_low'
        ? profile.floodDirection
        : profile.ebbDirection;
    }
    // Generic: assume E-W flow
    return phase.includes('flood') ? 90 : 270;
  }

  /**
   * Calculate haversine distance between two points (in km)
   */
  private static haversineDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Generate current timeline for a race period
   */
  static generateCurrentTimeline(
    lat: number,
    lng: number,
    startTime: Date,
    durationMinutes: number,
    intervalMinutes: number = 15,
    highTide: TideExtreme | null = null,
    lowTide: TideExtreme | null = null
  ): Array<{ time: Date; current: TidalCurrentEstimate }> {
    const timeline: Array<{ time: Date; current: TidalCurrentEstimate }> = [];
    
    for (let min = 0; min <= durationMinutes; min += intervalMinutes) {
      const time = new Date(startTime.getTime() + min * 60 * 1000);
      const current = this.estimateCurrent(lat, lng, time, highTide, lowTide);
      timeline.push({ time, current });
    }

    return timeline;
  }
}

export default TidalCurrentEstimator;



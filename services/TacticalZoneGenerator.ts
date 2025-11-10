/**
 * Tactical Zone Generator
 *
 * Generates tactical current zones based on environmental data analysis.
 * Uses current patterns, wind, bathymetry, and tidal information to
 * identify racing opportunities.
 */

import type { Wind, Current, Tide, Depth, Course, TacticalZone } from '@/stores/raceConditionsStore';

export interface ZoneGenerationContext {
  wind?: Wind;
  current?: Current;
  tide?: Tide;
  depth?: Depth;
  course?: Course;
  venue?: {
    center: { latitude: number; longitude: number };
    features?: string[]; // e.g., ['channel', 'shore', 'harbor']
  };
}

/**
 * Generate tactical zones from environmental conditions
 */
export class TacticalZoneGenerator {
  /**
   * Generate all tactical zones
   */
  static generateZones(context: ZoneGenerationContext): TacticalZone[] {
    const zones: TacticalZone[] = [];

    if (!context.current || !context.wind || !context.venue) {
      return zones;
    }

    // Generate different zone types based on conditions
    zones.push(...this.generateReliefLanes(context));
    zones.push(...this.generateAccelerationZones(context));
    zones.push(...this.generateShearBoundaries(context));
    zones.push(...this.generateLeeBowZones(context));
    zones.push(...this.generateAnchoringZones(context));

    return zones.filter(zone => zone.confidence >= 0.5); // Filter low confidence
  }

  /**
   * Generate relief lanes (favorable current corridors)
   */
  private static generateReliefLanes(context: ZoneGenerationContext): TacticalZone[] {
    const { current, wind, venue } = context;
    if (!current || !wind || !venue) return [];

    const zones: TacticalZone[] = [];
    const center = venue.center;

    // Look for areas where current aids upwind progress
    const windCurrentAngle = this.angleDifference(wind.direction, current.direction);

    // Relief lanes occur when current opposes wind at ~150-180°
    if (Math.abs(windCurrentAngle) > 135) {
      // Strong opposing current creates relief near shores/boundaries
      const confidence = this.calculateConfidence(current.speed, 0.5, 2.0);
      const timing = this.generateTimingWindow(context, {
        durationMinutes: 20,
        fallbackLabel: 'Next 20 minutes'
      });

      zones.push({
        id: this.buildZoneId('relief', context, 'shore'),
        type: 'relief-lane',
        name: 'Shore Relief Lane',
        description: 'Favorable eddy current near shore boundary provides upwind advantage',
        geometry: this.createPolygon(center, {
          offsetLon: -0.003,
          offsetLat: 0,
          width: 0.002,
          height: 0.008
        }),
        confidence,
        advantage: this.calculateAdvantage(current.speed * 0.6),
        timing
      });
    }

    // Check for channel effects
    if (venue.features?.includes('channel')) {
      const timing = this.generateTimingWindow(context, {
        durationMinutes: 25,
        fallbackLabel: 'Channel window'
      });

      zones.push({
        id: this.buildZoneId('relief', context, 'channel'),
        type: 'relief-lane',
        name: 'Channel Edge Relief',
        description: 'Reduced current along channel margins',
        geometry: this.createPolygon(center, {
          offsetLon: 0.002,
          offsetLat: 0.001,
          width: 0.0015,
          height: 0.007
        }),
        confidence: 0.7,
        advantage: this.calculateAdvantage(current.speed * 0.4),
        timing
      });
    }

    return zones;
  }

  /**
   * Generate acceleration zones (current speed increase areas)
   */
  private static generateAccelerationZones(context: ZoneGenerationContext): TacticalZone[] {
    const { current, venue } = context;
    if (!current || !venue) return [];

    const zones: TacticalZone[] = [];
    const center = venue.center;

    // Acceleration zones form in channels and constrictions
    if (current.speed > 0.8 && venue.features?.includes('channel')) {
      const timing = this.generateTimingWindow(context, {
        durationMinutes: 30,
        fallbackLabel: 'Channel pulse'
      });

      zones.push({
        id: this.buildZoneId('acceleration', context, 'channel'),
        type: 'acceleration',
        name: 'Channel Acceleration',
        description: 'Current accelerates through channel constriction',
        geometry: this.createPolygon(center, {
          offsetLon: 0,
          offsetLat: 0.003,
          width: 0.003,
          height: 0.003
        }),
        confidence: this.calculateConfidence(current.speed, 1.0, 2.5),
        advantage: this.calculateAdvantage(current.speed * 0.5),
        timing
      });
    }

    return zones;
  }

  /**
   * Generate shear boundaries (current direction change areas)
   */
  private static generateShearBoundaries(context: ZoneGenerationContext): TacticalZone[] {
    const { current, tide, venue } = context;
    if (!current || !venue) return [];

    const zones: TacticalZone[] = [];
    const center = venue.center;

    // Shear boundaries form where current direction changes abruptly
    if (current.speed > 1.0 && tide) {
      const timing = this.generateTimingWindow(context, {
        durationMinutes: 15,
        fallbackLabel: 'Shear boundary'
      });

      zones.push({
        id: this.buildZoneId('shear', context, 'primary'),
        type: 'shear-boundary',
        name: 'Current Shear Line',
        description: 'Current direction changes abruptly - challenging but tactical',
        geometry: this.createPolygon(center, {
          offsetLon: 0.0025,
          offsetLat: 0,
          width: 0.001,
          height: 0.007
        }),
        confidence: 0.65,
        advantage: 'Variable',
        timing
      });
    }

    return zones;
  }

  /**
   * Generate lee-bow zones (tactical positioning areas)
   */
  private static generateLeeBowZones(context: ZoneGenerationContext): TacticalZone[] {
    const { current, wind, course, venue } = context;
    if (!current || !wind || !venue) return [];

    const zones: TacticalZone[] = [];
    const center = venue.center;

    // Lee-bow zones occur where current vector creates favorable crossing angles
    const windCurrentAngle = this.angleDifference(wind.direction, current.direction);

    if (current.speed > 0.8 && Math.abs(windCurrentAngle) > 90) {
      const timing = this.generateTimingWindow(context, {
        startOffsetMinutes: 5,
        durationMinutes: 10,
        optimalOffsetMinutes: 10,
        fallbackLabel: 'Mark approach'
      });

      // Near marks is ideal for lee-bow positioning
      zones.push({
        id: this.buildZoneId('lee-bow', context, 'mark'),
        type: 'lee-bow',
        name: 'Mark Lee-Bow Zone',
        description: 'Ideal current angle for lee-bowing port tackers',
        geometry: this.createPolygon(center, {
          offsetLon: -0.001,
          offsetLat: 0.008,
          width: 0.003,
          height: 0.003
        }),
        confidence: 0.85,
        advantage: this.calculateAdvantage(current.speed * 0.8),
        timing
      });
    }

    return zones;
  }

  /**
   * Generate anchoring zones (minimal current areas)
   */
  private static generateAnchoringZones(context: ZoneGenerationContext): TacticalZone[] {
    const { current, depth, venue } = context;
    if (!current || !venue) return [];

    const zones: TacticalZone[] = [];
    const center = venue.center;

    // Anchoring zones are areas with minimal current (good for maintaining position)
    if (current.speed > 0.5) {
      const timing = this.generateTimingWindow(context, {
        durationMinutes: 45,
        fallbackLabel: 'Holding pattern'
      });

      zones.push({
        id: this.buildZoneId('anchoring', context, 'calm'),
        type: 'anchoring',
        name: 'Calm Pocket',
        description: 'Minimal current allows easy height maintenance',
        geometry: this.createPolygon(center, {
          offsetLon: 0.001,
          offsetLat: 0.002,
          width: 0.002,
          height: 0.003
        }),
        confidence: 0.7,
        advantage: '0 BL (stable)',
        timing
      });
    }

    return zones;
  }

  /**
   * Helper: Calculate angle difference (normalized to -180 to 180)
   */
  private static angleDifference(angle1: number, angle2: number): number {
    let diff = angle2 - angle1;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return diff;
  }

  /**
   * Helper: Calculate confidence based on data quality and strength
   */
  private static calculateConfidence(
    value: number,
    minThreshold: number,
    maxThreshold: number
  ): number {
    if (value < minThreshold) return 0.5;
    if (value > maxThreshold) return 0.95;

    // Linear interpolation between min and max
    const ratio = (value - minThreshold) / (maxThreshold - minThreshold);
    return 0.5 + (ratio * 0.45); // 0.5 to 0.95 range
  }

  /**
   * Helper: Calculate tactical advantage in boat lengths
   */
  private static calculateAdvantage(currentEffect: number): string {
    const boatLengths = currentEffect * 2.5; // Rough conversion
    if (Math.abs(boatLengths) < 0.5) return '< 0.5 BL';
    return `${boatLengths > 0 ? '+' : ''}${boatLengths.toFixed(1)} BL`;
  }

  /**
   * Helper: Build deterministic zone identifier
   */
  private static buildZoneId(
    prefix: string,
    context: ZoneGenerationContext,
    variant: string
  ): string {
    const wind: any = context.wind ?? {};
    const current = context.current;
    const venue = context.venue?.center;
    const courseKeyRaw =
      (context.course as any)?.id ??
      (context.course as any)?.name ??
      'course';

    const normalizeAngle = (angle: number | undefined): number => {
      if (typeof angle !== 'number' || Number.isNaN(angle)) {
        return 0;
      }
      const normalized = angle % 360;
      return normalized < 0 ? normalized + 360 : normalized;
    };

    const windDirection = normalizeAngle(
      wind.direction ?? wind.trueDirection ?? wind.heading
    );
    const windSpeed = Math.round(
      ((wind.speed ?? wind.trueSpeed ?? wind.apparentSpeed ?? 0) + Number.EPSILON) * 10
    );

    const currentDirection = normalizeAngle(current?.direction);
    const currentSpeed = Math.round(
      ((current?.speed ?? 0) + Number.EPSILON) * 10
    );

    const venueLat = venue?.latitude ?? 0;
    const venueLon = venue?.longitude ?? 0;
    const courseKey =
      typeof courseKeyRaw === 'string'
        ? courseKeyRaw.slice(0, 16)
        : String(courseKeyRaw);

    return [
      prefix,
      variant,
      courseKey,
      `${windDirection}-${windSpeed}`,
      `${currentDirection}-${currentSpeed}`,
      `${venueLat.toFixed(3)}-${venueLon.toFixed(3)}`
    ].join(':');
  }

  /**
   * Helper: Resolve timing reference from course data
   */
  private static getTimingReference(context: ZoneGenerationContext): Date | null {
    const rawStart = (context.course as any)?.startTime;
    if (!rawStart) {
      return null;
    }

    const start =
      rawStart instanceof Date ? rawStart : new Date(rawStart as string | number);
    if (Number.isNaN(start.valueOf())) {
      return null;
    }

    return start;
  }

  /**
   * Helper: Generate timing window relative to course start
   */
  private static generateTimingWindow(
    context: ZoneGenerationContext,
    options: {
      startOffsetMinutes?: number;
      durationMinutes: number;
      optimalOffsetMinutes?: number;
      fallbackLabel?: string;
    }
  ) {
    const reference = this.getTimingReference(context);
    if (!reference) {
      if (!options.fallbackLabel) {
        return { durationMinutes: options.durationMinutes };
      }
      return {
        label: options.fallbackLabel,
        durationMinutes: options.durationMinutes
      };
    }

    const startOffsetMs = (options.startOffsetMinutes ?? 0) * 60 * 1000;
    const durationMs = options.durationMinutes * 60 * 1000;

    const validFrom = new Date(reference.getTime() + startOffsetMs);
    const validUntil = new Date(validFrom.getTime() + durationMs);

    const window: Record<string, string | number> = {
      validFrom: validFrom.toISOString(),
      validUntil: validUntil.toISOString()
    };

    if (typeof options.optimalOffsetMinutes === 'number') {
      const optimal = new Date(
        reference.getTime() + options.optimalOffsetMinutes * 60 * 1000
      );
      window.optimalTime = optimal.toISOString();
    }

    return window;
  }

  /**
   * Helper: Create polygon geometry
   */
  private static createPolygon(
    center: { latitude: number; longitude: number },
    options: {
      offsetLon: number;
      offsetLat: number;
      width: number;
      height: number;
    }
  ): GeoJSON.Polygon {
    const { offsetLon, offsetLat, width, height } = options;
    const lon = center.longitude + offsetLon;
    const lat = center.latitude + offsetLat;

    return {
      type: 'Polygon',
      coordinates: [[
        [lon, lat],
        [lon, lat + height],
        [lon + width, lat + height],
        [lon + width, lat],
        [lon, lat] // Close the polygon
      ]]
    };
  }

  /**
   * Get zone importance score (for prioritization)
   */
  static getZoneImportance(zone: TacticalZone): number {
    let score = zone.confidence;

    // Boost score based on advantage
    if (zone.advantage && zone.advantage.includes('+')) {
      const match = zone.advantage.match(/\+?([\d.]+)/);
      if (match) {
        const advantageValue = parseFloat(match[1]);
        score += advantageValue * 0.1; // Add 0.1 per boat length
      }
    }

    // Boost score if timing is soon
    if (zone.timing?.optimalTime) {
      const optimalTime = new Date(zone.timing.optimalTime).getTime();
      const now = Date.now();
      const minutesUntil = (optimalTime - now) / (1000 * 60);

      if (minutesUntil > 0 && minutesUntil < 15) {
        score += 0.2; // Boost for imminent opportunities
      }
    }

    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Filter zones by minimum importance
   */
  static filterByImportance(zones: TacticalZone[], minImportance: number = 0.6): TacticalZone[] {
    return zones
      .map(zone => ({
        zone,
        importance: this.getZoneImportance(zone)
      }))
      .filter(({ importance }) => importance >= minImportance)
      .sort((a, b) => b.importance - a.importance)
      .map(({ zone }) => zone);
  }
}

import { createLogger } from '@/lib/utils/logger';

/**
 * Auto Course Generator Service
 * Automatically generates standard racing course marks when user draws a racing area
 *
 * Features:
 * - Wind-adaptive mark placement
 * - Boat class-specific distances
 * - Standard windward-leeward with gate configuration
 */

interface Point {
  lat: number;
  lng: number;
}

interface RacingArea {
  polygon: Point[];
  center: Point;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

interface CourseMark {
  id: string;
  name: string;
  mark_type: string;
  latitude: number;
  longitude: number;
  color?: string;
  shape?: string;
  description?: string;
}

const logger = createLogger('AutoCourseGeneratorService');
class AutoCourseGeneratorService {
  /**
   * Generate standard racing course marks based on racing area and conditions
   */
  generateStandardCourse(
    racingArea: RacingArea,
    windDirection: string | number, // Cardinal (e.g., 'SE') or degrees
    windSpeed: number, // knots
    boatClass?: unknown
  ): CourseMark[] {

    const normalizedBoatClass = this.normalizeBoatClass(boatClass);

    logger.debug('   Wind:', windDirection, '@', windSpeed, 'kt');
    logger.debug('   Boat class:', normalizedBoatClass || 'default');
    logger.debug('   Racing area center:', racingArea.center);

    // Convert wind direction to degrees if needed
    const windDegrees = typeof windDirection === 'string'
      ? this.cardinalToDegrees(windDirection)
      : windDirection;

    // Calculate start line orientation (perpendicular to wind)
    const startLineBearing = (windDegrees + 90) % 360;

    // Calculate distances based on boat class and wind
    const startLineLength = this.getStartLineLength(normalizedBoatClass);
    const windwardDistance = this.getWindwardDistance(windSpeed);

    // Generate marks
    const center = racingArea.center;

    // 1. Committee Boat & Pin (start line, perpendicular to wind)
    const committeeBoat = this.calculatePoint(center, startLineBearing, startLineLength / 2);
    const pinBuoy = this.calculatePoint(center, startLineBearing + 180, startLineLength / 2);

    // 2. Windward Mark (upwind from center)
    const windwardMark = this.calculatePoint(center, windDegrees, windwardDistance);

    // 3. Leeward Gate (slightly upwind of start line, offset toward pin side)
    // Position gate 90m upwind of center (not downwind like traditional leeward marks)
    const gateCenter = this.calculatePoint(center, windDegrees, 0.05); // 0.05nm ≈ 90m upwind
    // Offset gate toward pin side (opposite from where finish mark will be)
    const gateA = this.calculatePoint(gateCenter, startLineBearing + 180, 0.025); // 25m toward pin
    const gateB = this.calculatePoint(gateCenter, startLineBearing + 180, 0.045); // 45m toward pin (wider spacing)

    // 4. Finish Mark (opposite side of committee boat from pin)
    // This creates finish line: Committee Boat <---> Finish Mark
    // With pin on opposite side from finish mark
    const finishMark = this.calculatePoint(committeeBoat, startLineBearing, startLineLength * 0.8);

    const marks: CourseMark[] = [
      {
        id: 'auto-committee-boat',
        name: 'Committee Boat',
        mark_type: 'committee_boat',
        latitude: committeeBoat.lat,
        longitude: committeeBoat.lng,
        color: 'Orange',
        shape: 'boat',
        description: 'Race committee signal boat - start line end',
      },
      {
        id: 'auto-pin',
        name: 'Pin',
        mark_type: 'pin',
        latitude: pinBuoy.lat,
        longitude: pinBuoy.lng,
        color: 'Orange',
        shape: 'inflatable',
        description: 'Start line pin end',
      },
      {
        id: 'auto-windward',
        name: 'Mark 1',
        mark_type: 'windward',
        latitude: windwardMark.lat,
        longitude: windwardMark.lng,
        color: 'Yellow',
        shape: 'inflatable',
        description: 'Windward mark - round to port',
      },
      {
        id: 'auto-gate-a',
        name: 'Gate A',
        mark_type: 'gate_left',
        latitude: gateA.lat,
        longitude: gateA.lng,
        color: 'Yellow',
        shape: 'inflatable',
        description: 'Leeward gate - port side',
      },
      {
        id: 'auto-gate-b',
        name: 'Gate B',
        mark_type: 'gate_right',
        latitude: gateB.lat,
        longitude: gateB.lng,
        color: 'Yellow',
        shape: 'inflatable',
        description: 'Leeward gate - starboard side',
      },
      {
        id: 'auto-finish',
        name: 'Finish',
        mark_type: 'finish',
        latitude: finishMark.lat,
        longitude: finishMark.lng,
        color: 'Blue',
        shape: 'inflatable',
        description: 'Finish line mark',
      },
    ];

    marks.forEach(mark => {
      logger.debug(`   - ${mark.name} (${mark.mark_type}): ${mark.latitude.toFixed(6)}, ${mark.longitude.toFixed(6)}`);
    });

    return marks;
  }

  /**
   * Calculate racing area center (centroid of polygon)
   */
  calculateCenter(polygon: Point[]): Point {
    const n = polygon.length;
    let latSum = 0;
    let lngSum = 0;

    for (const point of polygon) {
      latSum += point.lat;
      lngSum += point.lng;
    }

    return {
      lat: latSum / n,
      lng: lngSum / n,
    };
  }

  /**
   * Calculate bounding box from polygon
   */
  calculateBounds(polygon: Point[]): { north: number; south: number; east: number; west: number } {
    const lats = polygon.map(p => p.lat);
    const lngs = polygon.map(p => p.lng);

    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs),
    };
  }

  /**
   * Convert cardinal wind direction to degrees
   * N=0°, E=90°, S=180°, W=270°
   */
  cardinalToDegrees(cardinal: string): number {
    const directions: Record<string, number> = {
      'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5,
      'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
      'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5,
      'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
    };

    return directions[cardinal.toUpperCase()] || 180; // Default to S (180°)
  }

  /**
   * Calculate a new point from a starting point, bearing, and distance
   *
   * @param start - Starting point (lat/lng)
   * @param bearing - Bearing in degrees (0 = North, 90 = East)
   * @param distanceNM - Distance in nautical miles
   * @returns New point coordinates
   */
  calculatePoint(start: Point, bearing: number, distanceNM: number): Point {
    const R = 3440.065; // Earth radius in nautical miles
    const bearingRad = (bearing * Math.PI) / 180;
    const latRad = (start.lat * Math.PI) / 180;
    const lngRad = (start.lng * Math.PI) / 180;
    const angularDistance = distanceNM / R;

    // Calculate new latitude
    const newLatRad = Math.asin(
      Math.sin(latRad) * Math.cos(angularDistance) +
      Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearingRad)
    );

    // Calculate new longitude
    const newLngRad = lngRad + Math.atan2(
      Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(latRad),
      Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(newLatRad)
    );

    return {
      lat: (newLatRad * 180) / Math.PI,
      lng: (newLngRad * 180) / Math.PI,
    };
  }

  /**
   * Get start line length based on boat class
   * @param boatClass - Boat class name (e.g., 'Dragon', 'J/24')
   * @returns Start line length in nautical miles
   */
  private normalizeBoatClass(boatClass?: unknown): string {
    if (!boatClass) return '';

    if (typeof boatClass === 'string') {
      return boatClass;
    }

    if (Array.isArray(boatClass)) {
      return boatClass
        .map(value => this.normalizeBoatClass(value))
        .filter(Boolean)
        .join(' ');
    }

    if (typeof boatClass === 'object') {
      const candidate = boatClass as Record<string, unknown>;
      const keys = [
        'name',
        'class',
        'className',
        'label',
        'class_association',
        'boat_class',
        'value',
        'title',
      ];

      for (const key of keys) {
        const value = candidate[key];
        if (typeof value === 'string' && value.trim()) {
          return value;
        }
      }

      if (typeof candidate.toString === 'function') {
        const value = candidate.toString();
        if (value && value !== '[object Object]') {
          return value;
        }
      }
    }

    return '';
  }

  getStartLineLength(boatClass?: unknown): number {
    // Standard start line lengths by boat class
    const lengths: Record<string, number> = {
      'dragon': 0.081, // 150m
      'j/24': 0.081,   // 150m
      'j/70': 0.108,   // 200m
      'farr 40': 0.135, // 250m
    };

    const normalizedClass = this.normalizeBoatClass(boatClass).toLowerCase();

    // Look for partial matches
    for (const [key, length] of Object.entries(lengths)) {
      if (normalizedClass.includes(key)) {
        return length;
      }
    }

    // Default: 150m for most one-design classes
    return 0.081;
  }

  /**
   * Get windward mark distance based on wind speed
   * Lighter winds = shorter course, heavier winds = longer course
   *
   * @param windSpeed - Wind speed in knots
   * @returns Distance in nautical miles
   */
  getWindwardDistance(windSpeed: number): number {
    if (windSpeed < 8) {
      return 0.4; // 0.4nm in very light air
    } else if (windSpeed < 12) {
      return 0.6; // 0.6nm in light-moderate air
    } else if (windSpeed < 18) {
      return 0.8; // 0.8nm in moderate air
    } else {
      return 1.0; // 1.0nm in heavy air
    }
  }
}

// Export singleton instance
export const autoCourseGenerator = new AutoCourseGeneratorService();

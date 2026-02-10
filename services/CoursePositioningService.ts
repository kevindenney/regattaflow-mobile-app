/**
 * Course Positioning Service
 *
 * Calculates GPS coordinates for race course marks based on:
 * - Course type template (windward/leeward, triangle, olympic, etc.)
 * - Wind direction
 * - Start line position
 * - Leg length
 *
 * Converts relative course descriptions into positioned GPS coordinates.
 */

import type {
  CourseType,
  CourseTypeTemplate,
  CourseMarkTemplate,
  CoursePositioningOptions,
  PositionedCourseResult,
  PositionedMark,
  StartLinePosition,
  MarkType,
} from '@/types/courses';

// =============================================================================
// CONSTANTS
// =============================================================================

/** Nautical miles to degrees latitude (approximate) */
const NM_TO_DEG_LAT = 1 / 60;

/** Earth's radius in nautical miles */
const EARTH_RADIUS_NM = 3440.065;

/** Default start line length in meters */
const DEFAULT_START_LINE_LENGTH_M = 100;

/** Default boat LOA in meters (~26ft keelboat) */
const DEFAULT_BOAT_LOA_M = 8;

/** Default spacing multiplier per sailing standards */
const DEFAULT_SPACING_MULTIPLIER = 1.5;

/** Minimum start line length in meters */
const MIN_START_LINE_LENGTH_M = 50;

/** Maximum start line length in meters */
const MAX_START_LINE_LENGTH_M = 500;

// =============================================================================
// COURSE TYPE TEMPLATES
// =============================================================================

/**
 * Pre-defined course templates with mark positions relative to start line center
 * Coordinates use leg lengths as units:
 * - relY: positive = upwind from start
 * - relX: positive = right side when facing upwind
 */
export const COURSE_TEMPLATES: Record<CourseType, CourseTypeTemplate> = {
  windward_leeward: {
    type: 'windward_leeward',
    name: 'Windward/Leeward',
    description: 'Classic upwind/downwind course with gates',
    defaultLegLengthNm: 0.5,
    marks: [
      { name: 'Windward Mark', type: 'windward', relX: 0, relY: 1.0, rounding: 'port', color: 'yellow' },
      // Leeward gates positioned ~20% up the course from start line toward windward mark
      { name: 'Leeward Gate Left', type: 'gate', relX: -0.08, relY: 0.2, rounding: 'port', color: 'orange' },
      { name: 'Leeward Gate Right', type: 'gate', relX: 0.08, relY: 0.2, rounding: 'starboard', color: 'orange' },
    ],
  },

  triangle: {
    type: 'triangle',
    name: 'Triangle',
    description: 'Triangular course with reaching legs',
    defaultLegLengthNm: 0.4,
    marks: [
      { name: 'Windward Mark', type: 'windward', relX: 0, relY: 1.0, rounding: 'port', color: 'yellow' },
      { name: 'Wing Mark', type: 'wing', relX: 0.866, relY: 0.5, rounding: 'port', color: 'green' }, // 60° reach
      { name: 'Leeward Mark', type: 'leeward', relX: 0, relY: 0, rounding: 'port', color: 'red' },
    ],
  },

  olympic: {
    type: 'olympic',
    name: 'Olympic',
    description: 'Olympic-style course with multiple legs',
    defaultLegLengthNm: 0.5,
    marks: [
      { name: 'Windward Mark', type: 'windward', relX: 0, relY: 1.0, rounding: 'port', color: 'yellow' },
      { name: 'Wing Mark', type: 'wing', relX: 0.5, relY: 0.5, rounding: 'port', color: 'green' },
      { name: 'Leeward Mark', type: 'leeward', relX: 0, relY: 0, rounding: 'port', color: 'red' },
      { name: 'Offset Mark', type: 'offset', relX: 0.1, relY: 0.9, rounding: 'starboard', color: 'blue' },
    ],
  },

  trapezoid: {
    type: 'trapezoid',
    name: 'Trapezoid',
    description: 'Four-mark trapezoid course',
    defaultLegLengthNm: 0.5,
    marks: [
      { name: 'Windward Left', type: 'windward', relX: -0.3, relY: 1.0, rounding: 'port', color: 'yellow' },
      { name: 'Windward Right', type: 'windward', relX: 0.3, relY: 1.0, rounding: 'starboard', color: 'yellow' },
      { name: 'Leeward Left', type: 'leeward', relX: -0.2, relY: 0, rounding: 'port', color: 'red' },
      { name: 'Leeward Right', type: 'leeward', relX: 0.2, relY: 0, rounding: 'starboard', color: 'red' },
    ],
  },

  custom: {
    type: 'custom',
    name: 'Custom',
    description: 'User-defined course layout',
    defaultLegLengthNm: 0.5,
    marks: [], // User adds marks manually
  },
};

// =============================================================================
// GEOMETRY UTILITIES
// =============================================================================

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Calculate destination point given start, bearing, and distance
 * Uses spherical Earth approximation
 *
 * @param lat Starting latitude in degrees
 * @param lng Starting longitude in degrees
 * @param bearingDeg Bearing in degrees (0 = North, 90 = East)
 * @param distanceNm Distance in nautical miles
 * @returns Destination coordinates
 */
function destinationPoint(
  lat: number,
  lng: number,
  bearingDeg: number,
  distanceNm: number
): { lat: number; lng: number } {
  const lat1 = toRadians(lat);
  const lng1 = toRadians(lng);
  const bearing = toRadians(bearingDeg);
  const angularDistance = distanceNm / EARTH_RADIUS_NM;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
    Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
  );

  const lng2 = lng1 + Math.atan2(
    Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
    Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
  );

  return {
    lat: toDegrees(lat2),
    lng: toDegrees(lng2),
  };
}

/**
 * Calculate bearing between two points
 *
 * @param lat1 Start latitude
 * @param lng1 Start longitude
 * @param lat2 End latitude
 * @param lng2 End longitude
 * @returns Bearing in degrees
 */
function calculateBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaLambda = toRadians(lng2 - lng1);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/**
 * Calculate distance between two points in nautical miles
 * Uses Haversine formula
 */
function calculateDistanceNm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = EARTH_RADIUS_NM;
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lng2 - lng1);

  const a = Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Normalize bearing to 0-360 range
 */
function normalizeBearing(bearing: number): number {
  return ((bearing % 360) + 360) % 360;
}

// =============================================================================
// COURSE POSITIONING SERVICE
// =============================================================================

export class CoursePositioningService {

  /**
   * Calculate positioned marks for a course type
   *
   * @param options Course positioning options
   * @returns Positioned course result with marks and start line
   */
  static calculatePositionedCourse(options: CoursePositioningOptions): PositionedCourseResult {
    const { startLineCenter, windDirection, courseType } = options;
    const template = COURSE_TEMPLATES[courseType];
    const legLengthNm = options.legLengthNm ?? template.defaultLegLengthNm;

    // Calculate start line endpoints
    // Start line is perpendicular to wind, slightly biased toward port
    const startLine = this.calculateStartLine(startLineCenter, windDirection);

    // Calculate mark positions
    const marks = this.calculateMarkPositions(
      startLineCenter,
      windDirection,
      legLengthNm,
      template.marks
    );

    // Calculate bounding box
    const boundingBox = this.calculateBoundingBox(marks, startLine);

    return {
      marks,
      startLine,
      boundingBox,
    };
  }

  /**
   * Calculate start line endpoints perpendicular to wind
   *
   * @param center Start line center point
   * @param windDirection Wind direction in degrees
   * @param lengthM Start line length in meters (default 100m)
   * @returns Start line endpoints
   */
  static calculateStartLine(
    center: { lat: number; lng: number },
    windDirection: number,
    lengthM: number = DEFAULT_START_LINE_LENGTH_M
  ): StartLinePosition {
    // Start line is perpendicular to wind
    // Pin is on the left (port) side, committee boat on right (starboard)
    const perpendicularBearing = normalizeBearing(windDirection + 90);
    const halfLengthNm = (lengthM / 1852) / 2; // Convert meters to nm

    // Pin end (port side when looking upwind)
    const pin = destinationPoint(
      center.lat,
      center.lng,
      normalizeBearing(perpendicularBearing + 180), // Left side
      halfLengthNm
    );

    // Committee boat end (starboard side when looking upwind)
    const committee = destinationPoint(
      center.lat,
      center.lng,
      perpendicularBearing, // Right side
      halfLengthNm
    );

    return { pin, committee };
  }

  /**
   * Calculate recommended start line length based on fleet size
   * Formula: spacingMultiplier × LOA × numberOfBoats (with min/max bounds)
   *
   * @param numberOfBoats Number of boats expected at start
   * @param boatLengthM Boat LOA in meters (default ~26ft keelboat = 8m)
   * @param spacingMultiplier Spacing multiplier (default 1.5 per sailing standards)
   * @returns Calculated start line length in meters, bounded to 50-500m range
   */
  static calculateStartLineLength(
    numberOfBoats: number,
    boatLengthM: number = DEFAULT_BOAT_LOA_M,
    spacingMultiplier: number = DEFAULT_SPACING_MULTIPLIER
  ): number {
    const calculated = numberOfBoats * boatLengthM * spacingMultiplier;
    // Bounds: minimum 50m, maximum 500m
    return Math.max(MIN_START_LINE_LENGTH_M, Math.min(MAX_START_LINE_LENGTH_M, calculated));
  }

  /**
   * Calculate mark positions from template
   */
  private static calculateMarkPositions(
    startLineCenter: { lat: number; lng: number },
    windDirection: number,
    legLengthNm: number,
    templateMarks: CourseMarkTemplate[]
  ): PositionedMark[] {
    const marks: PositionedMark[] = [];

    templateMarks.forEach((template, index) => {
      // Convert relative coordinates to bearing and distance
      // relY is upwind (in direction of windDirection)
      // relX is perpendicular (positive = right when facing upwind)

      // Calculate the actual distance and bearing
      const distanceUpwind = template.relY * legLengthNm;
      const distanceSide = template.relX * legLengthNm;

      // First move upwind
      let position = destinationPoint(
        startLineCenter.lat,
        startLineCenter.lng,
        windDirection, // Upwind direction
        distanceUpwind
      );

      // Then move sideways (perpendicular to wind)
      if (Math.abs(distanceSide) > 0.0001) {
        const sideBearing = normalizeBearing(windDirection + (distanceSide > 0 ? 90 : -90));
        position = destinationPoint(
          position.lat,
          position.lng,
          sideBearing,
          Math.abs(distanceSide)
        );
      }

      const positionedMark: PositionedMark = {
        id: `mark-${index}-${Date.now()}`,
        name: template.name,
        type: template.type,
        latitude: position.lat,
        longitude: position.lng,
        rounding: template.rounding,
        color: template.color,
        sequenceOrder: index,
        isUserAdjusted: false,
      };

      marks.push(positionedMark);
    });

    return marks;
  }

  /**
   * Calculate bounding box for all marks and start line
   */
  private static calculateBoundingBox(
    marks: PositionedMark[],
    startLine: StartLinePosition
  ): { north: number; south: number; east: number; west: number } {
    const allLats = [
      ...marks.map(m => m.latitude),
      startLine.pin.lat,
      startLine.committee.lat,
    ];
    const allLngs = [
      ...marks.map(m => m.longitude),
      startLine.pin.lng,
      startLine.committee.lng,
    ];

    const padding = 0.005; // Add some padding

    return {
      north: Math.max(...allLats) + padding,
      south: Math.min(...allLats) - padding,
      east: Math.max(...allLngs) + padding,
      west: Math.min(...allLngs) - padding,
    };
  }

  /**
   * Recalculate course when wind direction changes
   * Preserves user-adjusted marks and only moves template-positioned ones
   */
  static recalculateForWindChange(
    currentMarks: PositionedMark[],
    startLineCenter: { lat: number; lng: number },
    oldWindDirection: number,
    newWindDirection: number,
    legLengthNm: number,
    courseType: CourseType
  ): PositionedMark[] {
    const template = COURSE_TEMPLATES[courseType];
    const rotationDelta = newWindDirection - oldWindDirection;

    return currentMarks.map((mark, index) => {
      if (mark.isUserAdjusted) {
        // Keep user-adjusted marks in place
        return mark;
      }

      // Find matching template mark
      const templateMark = template.marks[index];
      if (!templateMark) {
        // No template for this mark, rotate around start line center
        const distance = calculateDistanceNm(
          startLineCenter.lat,
          startLineCenter.lng,
          mark.latitude,
          mark.longitude
        );
        const currentBearing = calculateBearing(
          startLineCenter.lat,
          startLineCenter.lng,
          mark.latitude,
          mark.longitude
        );
        const newBearing = normalizeBearing(currentBearing + rotationDelta);
        const newPos = destinationPoint(
          startLineCenter.lat,
          startLineCenter.lng,
          newBearing,
          distance
        );
        return {
          ...mark,
          latitude: newPos.lat,
          longitude: newPos.lng,
        };
      }

      // Recalculate from template
      const distanceUpwind = templateMark.relY * legLengthNm;
      const distanceSide = templateMark.relX * legLengthNm;

      let position = destinationPoint(
        startLineCenter.lat,
        startLineCenter.lng,
        newWindDirection,
        distanceUpwind
      );

      if (Math.abs(distanceSide) > 0.0001) {
        const sideBearing = normalizeBearing(newWindDirection + (distanceSide > 0 ? 90 : -90));
        position = destinationPoint(
          position.lat,
          position.lng,
          sideBearing,
          Math.abs(distanceSide)
        );
      }

      return {
        ...mark,
        latitude: position.lat,
        longitude: position.lng,
      };
    });
  }

  /**
   * Recalculate course when leg length changes
   */
  static recalculateForLegLengthChange(
    currentMarks: PositionedMark[],
    startLineCenter: { lat: number; lng: number },
    windDirection: number,
    oldLegLengthNm: number,
    newLegLengthNm: number,
    courseType: CourseType
  ): PositionedMark[] {
    const template = COURSE_TEMPLATES[courseType];
    const scaleFactor = newLegLengthNm / oldLegLengthNm;

    return currentMarks.map((mark, index) => {
      if (mark.isUserAdjusted) {
        // Scale user-adjusted marks proportionally from start line center
        const distance = calculateDistanceNm(
          startLineCenter.lat,
          startLineCenter.lng,
          mark.latitude,
          mark.longitude
        );
        const bearing = calculateBearing(
          startLineCenter.lat,
          startLineCenter.lng,
          mark.latitude,
          mark.longitude
        );
        const newDistance = distance * scaleFactor;
        const newPos = destinationPoint(
          startLineCenter.lat,
          startLineCenter.lng,
          bearing,
          newDistance
        );
        return {
          ...mark,
          latitude: newPos.lat,
          longitude: newPos.lng,
        };
      }

      // Find matching template mark and recalculate
      const templateMark = template.marks[index];
      if (!templateMark) {
        return mark;
      }

      const distanceUpwind = templateMark.relY * newLegLengthNm;
      const distanceSide = templateMark.relX * newLegLengthNm;

      let position = destinationPoint(
        startLineCenter.lat,
        startLineCenter.lng,
        windDirection,
        distanceUpwind
      );

      if (Math.abs(distanceSide) > 0.0001) {
        const sideBearing = normalizeBearing(windDirection + (distanceSide > 0 ? 90 : -90));
        position = destinationPoint(
          position.lat,
          position.lng,
          sideBearing,
          Math.abs(distanceSide)
        );
      }

      return {
        ...mark,
        latitude: position.lat,
        longitude: position.lng,
      };
    });
  }

  /**
   * Get available course templates
   */
  static getAvailableTemplates(): CourseTypeTemplate[] {
    return Object.values(COURSE_TEMPLATES);
  }

  /**
   * Get template for a specific course type
   */
  static getTemplate(courseType: CourseType): CourseTypeTemplate {
    return COURSE_TEMPLATES[courseType];
  }

  /**
   * Add a custom mark to the course
   */
  static addCustomMark(
    existingMarks: PositionedMark[],
    position: { lat: number; lng: number },
    name: string,
    type: MarkType = 'offset',
    rounding: 'port' | 'starboard' = 'port'
  ): PositionedMark[] {
    const newMark: PositionedMark = {
      id: `custom-mark-${Date.now()}`,
      name,
      type,
      latitude: position.lat,
      longitude: position.lng,
      rounding,
      isUserAdjusted: true,
      sequenceOrder: existingMarks.length,
    };

    return [...existingMarks, newMark];
  }

  /**
   * Update a mark's position (marks it as user-adjusted)
   */
  static updateMarkPosition(
    marks: PositionedMark[],
    markId: string,
    newPosition: { lat: number; lng: number }
  ): PositionedMark[] {
    return marks.map(mark => {
      if (mark.id === markId) {
        return {
          ...mark,
          latitude: newPosition.lat,
          longitude: newPosition.lng,
          isUserAdjusted: true,
        };
      }
      return mark;
    });
  }

  /**
   * Calculate finish mark position
   * Finish buoy is opposite the pin from the committee boat
   *
   * @param startLine Start line position
   * @param windDirection Wind direction in degrees (not currently used but may be useful for future enhancements)
   * @returns Finish mark position
   */
  static calculateFinishMark(
    startLine: StartLinePosition,
    _windDirection: number
  ): { lat: number; lng: number } {
    // Finish buoy is opposite pin from committee boat
    // Calculate by reflecting pin position across committee boat
    const dx = startLine.pin.lng - startLine.committee.lng;
    const dy = startLine.pin.lat - startLine.committee.lat;
    return {
      lat: startLine.committee.lat - dy,
      lng: startLine.committee.lng - dx,
    };
  }

  /**
   * Reposition entire course to a new center location
   * Preserves relative positions and orientation
   *
   * @param marks Current positioned marks
   * @param startLine Current start line position
   * @param newCenter New center point for the course
   * @returns Repositioned marks and start line
   */
  static repositionCourse(
    marks: PositionedMark[],
    startLine: StartLinePosition,
    newCenter: { lat: number; lng: number }
  ): { marks: PositionedMark[]; startLine: StartLinePosition } {
    // Calculate offset from old center to new center
    const oldCenter = {
      lat: (startLine.pin.lat + startLine.committee.lat) / 2,
      lng: (startLine.pin.lng + startLine.committee.lng) / 2,
    };
    const latOffset = newCenter.lat - oldCenter.lat;
    const lngOffset = newCenter.lng - oldCenter.lng;

    // Apply offset to all marks and start line
    return {
      marks: marks.map(m => ({
        ...m,
        latitude: m.latitude + latOffset,
        longitude: m.longitude + lngOffset,
      })),
      startLine: {
        pin: {
          lat: startLine.pin.lat + latOffset,
          lng: startLine.pin.lng + lngOffset,
        },
        committee: {
          lat: startLine.committee.lat + latOffset,
          lng: startLine.committee.lng + lngOffset,
        },
      },
    };
  }

  /**
   * Realign course to wind direction after manual adjustments
   * Clears all isUserAdjusted flags and recalculates from template
   *
   * @param marks Current marks (may have manual adjustments)
   * @param startLineCenter Center point for the start line
   * @param newWindDirection Wind direction in degrees
   * @param legLengthNm Leg length in nautical miles
   * @param courseType Type of course template to use
   * @returns Newly calculated marks aligned to wind
   */
  static realignCourseToWind(
    _marks: PositionedMark[],
    startLineCenter: { lat: number; lng: number },
    newWindDirection: number,
    legLengthNm: number,
    courseType: CourseType
  ): PositionedMark[] {
    // Recalculate from template - this clears all isUserAdjusted flags
    return this.calculatePositionedCourse({
      startLineCenter,
      windDirection: newWindDirection,
      legLengthNm,
      courseType,
    }).marks;
  }

  /**
   * Remove a mark from the course
   */
  static removeMark(marks: PositionedMark[], markId: string): PositionedMark[] {
    return marks.filter(mark => mark.id !== markId);
  }

  /**
   * Generate GeoJSON for the course (for map rendering)
   */
  static toGeoJSON(
    marks: PositionedMark[],
    startLine: StartLinePosition
  ): GeoJSON.FeatureCollection {
    const features: GeoJSON.Feature[] = [];

    // Start line as LineString
    features.push({
      type: 'Feature',
      id: 'start-line',
      properties: {
        type: 'start-line',
        name: 'Start Line',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [startLine.pin.lng, startLine.pin.lat],
          [startLine.committee.lng, startLine.committee.lat],
        ],
      },
    });

    // Marks as Points
    marks.forEach(mark => {
      features.push({
        type: 'Feature',
        id: mark.id,
        properties: {
          type: 'mark',
          markType: mark.type,
          name: mark.name,
          rounding: mark.rounding,
          color: mark.color,
          isUserAdjusted: mark.isUserAdjusted,
        },
        geometry: {
          type: 'Point',
          coordinates: [mark.longitude, mark.latitude],
        },
      });
    });

    // Course line connecting marks in sequence
    if (marks.length >= 2) {
      const sortedMarks = [...marks].sort((a, b) =>
        (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0)
      );

      features.push({
        type: 'Feature',
        id: 'course-line',
        properties: {
          type: 'course-line',
          name: 'Course',
        },
        geometry: {
          type: 'LineString',
          coordinates: sortedMarks.map(m => [m.longitude, m.latitude]),
        },
      });
    }

    return {
      type: 'FeatureCollection',
      features,
    };
  }
}

// Export utility functions for external use
export {
  destinationPoint,
  calculateBearing,
  calculateDistanceNm,
  normalizeBearing,
};

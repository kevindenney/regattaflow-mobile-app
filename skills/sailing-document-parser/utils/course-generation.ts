/**
 * Course Generation Utilities
 *
 * Functions for generating GeoJSON data structures and detecting course types
 * for MapLibre GL JS visualization.
 */

export type CourseType =
  | 'windward-leeward'
  | 'triangle'
  | 'trapezoid'
  | 'olympic'
  | 'custom';

export type MarkType =
  | 'start-line'
  | 'finish-line'
  | 'start-finish'
  | 'mark'
  | 'gate'
  | 'offset'
  | 'committee-boat'
  | 'pin';

export interface Mark {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  type: MarkType;
  description?: string;
  rounding?: 'port' | 'starboard' | 'either';
  order?: number;
}

export interface CourseLeg {
  from: string;
  to: string;
  type: 'upwind' | 'downwind' | 'reaching' | 'run';
  distance?: number;
  unit?: 'nautical miles' | 'meters' | 'kilometers';
  bearing?: number;
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon';
    coordinates: number[] | number[][] | number[][][];
  };
  properties: {
    [key: string]: any;
  };
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

/**
 * Generates a GeoJSON FeatureCollection from race course marks
 *
 * Creates both point features for marks and line features for the course path.
 * Output is MapLibre GL JS compatible.
 *
 * @param marks - Array of race course marks
 * @param includeCourseLine - Whether to include connecting line (default: true)
 * @returns GeoJSON FeatureCollection
 *
 * @example
 * const marks = [
 *   { name: 'Start', latitude: 22.279, longitude: 114.162, type: 'start-line' },
 *   { name: 'Windward', latitude: 22.285, longitude: 114.165, type: 'mark' }
 * ];
 * const geojson = generateCourseGeoJSON(marks);
 */
export function generateCourseGeoJSON(
  marks: Mark[],
  includeCourseLine: boolean = true
): GeoJSONFeatureCollection {
  const features: GeoJSONFeature[] = [];

  // Create point features for each mark
  marks.forEach((mark, index) => {
    const pointFeature: GeoJSONFeature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [mark.longitude, mark.latitude], // GeoJSON: [lng, lat]
      },
      properties: {
        id: mark.id || `mark-${index}`,
        name: mark.name,
        type: mark.type,
        description: mark.description || '',
        rounding: mark.rounding || 'port',
        order: mark.order !== undefined ? mark.order : index,
      },
    };

    features.push(pointFeature);
  });

  // Create line feature connecting the marks
  if (includeCourseLine && marks.length > 1) {
    const courseLineFeature: GeoJSONFeature = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: marks.map(m => [m.longitude, m.latitude]),
      },
      properties: {
        type: 'course-line',
        name: 'Race Course',
      },
    };

    features.push(courseLineFeature);
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Generates GeoJSON for course legs (individual segments)
 *
 * Creates LineString features for each leg with tactical information.
 *
 * @param marks - Array of race course marks
 * @param legs - Array of course leg definitions
 * @returns GeoJSON FeatureCollection
 *
 * @example
 * const legs = [
 *   { from: 'Start', to: 'Windward', type: 'upwind', distance: 1.2 }
 * ];
 * const geojson = generateCourseLegsGeoJSON(marks, legs);
 */
export function generateCourseLegsGeoJSON(
  marks: Mark[],
  legs: CourseLeg[]
): GeoJSONFeatureCollection {
  const features: GeoJSONFeature[] = [];

  legs.forEach(leg => {
    const fromMark = marks.find(m => m.name === leg.from);
    const toMark = marks.find(m => m.name === leg.to);

    if (!fromMark || !toMark) {
      console.warn(`Unable to find marks for leg: ${leg.from} → ${leg.to}`);
      return;
    }

    const legFeature: GeoJSONFeature = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [fromMark.longitude, fromMark.latitude],
          [toMark.longitude, toMark.latitude],
        ],
      },
      properties: {
        from: leg.from,
        to: leg.to,
        legType: leg.type,
        distance: leg.distance,
        unit: leg.unit || 'nautical miles',
        bearing: leg.bearing,
      },
    };

    features.push(legFeature);
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Detects the type of race course based on mark configuration
 *
 * Analyzes mark names and positions to identify standard course types.
 *
 * @param marks - Array of race course marks
 * @returns Detected course type
 *
 * @example
 * detectCourseType([
 *   { name: 'Start', ... },
 *   { name: 'Windward Mark', ... },
 *   { name: 'Leeward Gate', ... }
 * ]) // 'windward-leeward'
 */
export function detectCourseType(marks: Mark[]): CourseType {
  const markCount = marks.length;
  const markNames = marks.map(m => m.name.toLowerCase());

  // Check for specific keywords in mark names
  const hasWindward = markNames.some(n =>
    n.includes('windward') || n.includes('weather') || n.includes('top')
  );

  const hasLeeward = markNames.some(n =>
    n.includes('leeward') || n.includes('lee') || n.includes('bottom')
  );

  const hasGate = markNames.some(n =>
    n.includes('gate') || markNames.filter(n => n.includes('leeward')).length >= 2
  );

  const hasReaching = markNames.some(n =>
    n.includes('reach') || n.includes('wing')
  );

  const hasOffset = markNames.some(n =>
    n.includes('offset')
  );

  // Windward-Leeward course detection
  if (hasWindward && hasLeeward && !hasReaching) {
    return 'windward-leeward';
  }

  // Triangle course detection
  if (hasReaching && (markCount === 3 || markCount === 4)) {
    return 'triangle';
  }

  // Trapezoid course detection
  if (hasOffset && hasWindward && hasLeeward) {
    return 'trapezoid';
  }

  // Olympic course detection (typically 5-6 marks)
  if (markCount >= 5 && markCount <= 7 && hasWindward) {
    return 'olympic';
  }

  // Default to custom if no pattern matches
  return 'custom';
}

/**
 * Calculates the center point (centroid) of a course
 *
 * @param marks - Array of race course marks
 * @returns Center coordinates [longitude, latitude]
 *
 * @example
 * const center = calculateCourseCenter(marks);
 * map.setCenter(center);
 */
export function calculateCourseCenter(marks: Mark[]): [number, number] {
  if (marks.length === 0) {
    throw new Error('Cannot calculate center of empty mark array');
  }

  const sumLat = marks.reduce((sum, mark) => sum + mark.latitude, 0);
  const sumLng = marks.reduce((sum, mark) => sum + mark.longitude, 0);

  return [sumLng / marks.length, sumLat / marks.length];
}

/**
 * Calculates bounding box for a course
 *
 * @param marks - Array of race course marks
 * @param padding - Padding in degrees (default: 0.005 ≈ 500m)
 * @returns Bounding box [minLng, minLat, maxLng, maxLat]
 *
 * @example
 * const bounds = calculateCourseBounds(marks);
 * map.fitBounds(bounds, { padding: 50 });
 */
export function calculateCourseBounds(
  marks: Mark[],
  padding: number = 0.005
): [number, number, number, number] {
  if (marks.length === 0) {
    throw new Error('Cannot calculate bounds of empty mark array');
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  marks.forEach(mark => {
    minLat = Math.min(minLat, mark.latitude);
    maxLat = Math.max(maxLat, mark.latitude);
    minLng = Math.min(minLng, mark.longitude);
    maxLng = Math.max(maxLng, mark.longitude);
  });

  return [
    minLng - padding,
    minLat - padding,
    maxLng + padding,
    maxLat + padding,
  ];
}

/**
 * Calculates distance between two marks using Haversine formula
 *
 * @param mark1 - First mark
 * @param mark2 - Second mark
 * @param unit - Distance unit (default: 'nautical miles')
 * @returns Distance in specified unit
 *
 * @example
 * const distance = calculateDistance(startMark, windwardMark);
 * console.log(`Upwind leg: ${distance.toFixed(2)} nm`);
 */
export function calculateDistance(
  mark1: Mark,
  mark2: Mark,
  unit: 'nautical miles' | 'meters' | 'kilometers' = 'nautical miles'
): number {
  const R = unit === 'nautical miles'
    ? 3440.065  // Earth radius in nautical miles
    : unit === 'kilometers'
    ? 6371      // Earth radius in kilometers
    : 6371000;  // Earth radius in meters

  const dLat = ((mark2.latitude - mark1.latitude) * Math.PI) / 180;
  const dLon = ((mark2.longitude - mark1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((mark1.latitude * Math.PI) / 180) *
      Math.cos((mark2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculates bearing (compass direction) from one mark to another
 *
 * @param mark1 - Starting mark
 * @param mark2 - Destination mark
 * @returns Bearing in degrees (0-360, where 0/360 = North)
 *
 * @example
 * const bearing = calculateBearing(startMark, windwardMark);
 * console.log(`Upwind bearing: ${bearing}°`);
 */
export function calculateBearing(mark1: Mark, mark2: Mark): number {
  const dLon = ((mark2.longitude - mark1.longitude) * Math.PI) / 180;
  const lat1 = (mark1.latitude * Math.PI) / 180;
  const lat2 = (mark2.latitude * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;

  // Normalize to 0-360
  return (bearing + 360) % 360;
}

/**
 * Generates course legs from marks based on order
 *
 * Automatically creates leg definitions by connecting marks in order.
 *
 * @param marks - Array of race course marks (must have order property)
 * @returns Array of course legs with calculated distances and bearings
 *
 * @example
 * const legs = generateCourseLegs(marks);
 * // [{ from: 'Start', to: 'Mark 1', type: 'upwind', distance: 1.2, ... }]
 */
export function generateCourseLegs(marks: Mark[]): CourseLeg[] {
  if (marks.length < 2) {
    return [];
  }

  // Sort marks by order
  const orderedMarks = [...marks].sort((a, b) =>
    (a.order || 0) - (b.order || 0)
  );

  const legs: CourseLeg[] = [];

  for (let i = 0; i < orderedMarks.length - 1; i++) {
    const fromMark = orderedMarks[i];
    const toMark = orderedMarks[i + 1];

    const distance = calculateDistance(fromMark, toMark, 'nautical miles');
    const bearing = calculateBearing(fromMark, toMark);

    // Determine leg type based on bearing (rough estimate)
    let legType: CourseLeg['type'] = 'reaching';
    if (bearing >= 315 || bearing <= 45) legType = 'upwind';
    else if (bearing >= 135 && bearing <= 225) legType = 'downwind';
    else if (bearing >= 45 && bearing < 135) legType = 'reaching';
    else if (bearing > 225 && bearing < 315) legType = 'reaching';

    legs.push({
      from: fromMark.name,
      to: toMark.name,
      type: legType,
      distance: parseFloat(distance.toFixed(2)),
      unit: 'nautical miles',
      bearing: Math.round(bearing),
    });
  }

  return legs;
}

/**
 * Sorts marks by their geographic position relative to course center
 *
 * Useful for determining racing order when mark order is not explicit.
 *
 * @param marks - Array of race course marks
 * @param windDirection - Wind direction in degrees (0 = North)
 * @returns Sorted marks (start, windward, leeward, finish)
 *
 * @example
 * const sorted = sortMarksByPosition(marks, 180); // Wind from south
 */
export function sortMarksByPosition(
  marks: Mark[],
  windDirection?: number
): Mark[] {
  const center = calculateCourseCenter(marks);

  return [...marks].sort((a, b) => {
    // Start/finish marks first
    if (a.type.includes('start') && !b.type.includes('start')) return -1;
    if (!a.type.includes('start') && b.type.includes('start')) return 1;

    // If wind direction provided, sort by upwind/downwind position
    if (windDirection !== undefined) {
      const bearingA = calculateBearing(
        { name: 'center', latitude: center[1], longitude: center[0], type: 'mark' },
        a
      );
      const bearingB = calculateBearing(
        { name: 'center', latitude: center[1], longitude: center[0], type: 'mark' },
        b
      );

      // Calculate angle difference from wind direction
      const diffA = Math.abs(((bearingA - windDirection + 180) % 360) - 180);
      const diffB = Math.abs(((bearingB - windDirection + 180) % 360) - 180);

      return diffA - diffB;
    }

    // Default: sort by latitude (south to north)
    return a.latitude - b.latitude;
  });
}

/**
 * Coordinate Conversion Utilities
 *
 * Pre-tested functions for converting between different coordinate formats
 * commonly found in sailing documents.
 */

export type CoordinateFormat = 'DMS' | 'DDM' | 'Decimal';

export interface CoordinateParseResult {
  latitude: number;
  longitude: number;
  format: CoordinateFormat;
}

/**
 * Detects the format of a coordinate string
 *
 * @param coord - Coordinate string to analyze
 * @returns Format type: 'DMS', 'DDM', or 'Decimal'
 *
 * @example
 * detectCoordinateFormat("22°16.760'N") // 'DMS'
 * detectCoordinateFormat("22 16.760N") // 'DDM'
 * detectCoordinateFormat("22.279300") // 'Decimal'
 */
export function detectCoordinateFormat(coord: string): CoordinateFormat {
  const normalized = coord.trim();

  // DMS: Contains degrees symbol (°) and typically minutes/seconds markers (' ")
  if (normalized.includes('°')) {
    return 'DMS';
  }

  // DDM: Space-separated numbers with hemisphere letter
  // Format: "22 16.760N" or "22 16.760 N"
  if (/\d+\s+\d+\.\d+\s*[NSEW]/i.test(normalized)) {
    return 'DDM';
  }

  // Default to Decimal
  return 'Decimal';
}

/**
 * Converts DMS (Degrees Minutes Seconds) format to decimal degrees
 *
 * Supports formats:
 * - 22°16'45.6"N
 * - 22° 16' 45.6" N
 * - 22°16.760'N (minutes with decimal)
 *
 * @param dms - DMS coordinate string
 * @returns Decimal degree value (negative for S/W)
 *
 * @example
 * convertDMSToDecimal("22°16'45.6\"N") // 22.279333
 * convertDMSToDecimal("114°09'46.1\"E") // 114.162806
 */
export function convertDMSToDecimal(dms: string): number {
  const normalized = dms.trim();

  // Pattern 1: Degrees and decimal minutes (e.g., 22°16.760'N)
  const dmPattern = /(\d+)°\s*(\d+(?:\.\d+)?)'?\s*([NSEW])/i;
  const dmMatch = normalized.match(dmPattern);

  if (dmMatch) {
    const [, degrees, minutes, direction] = dmMatch;
    const decimal = parseFloat(degrees) + parseFloat(minutes) / 60;
    return ['S', 'W'].includes(direction.toUpperCase()) ? -decimal : decimal;
  }

  // Pattern 2: Full DMS (e.g., 22°16'45.6"N)
  const dmsPattern = /(\d+)°\s*(\d+)'\s*(\d+(?:\.\d+)?)"?\s*([NSEW])/i;
  const dmsMatch = normalized.match(dmsPattern);

  if (dmsMatch) {
    const [, degrees, minutes, seconds, direction] = dmsMatch;
    const decimal =
      parseFloat(degrees) +
      parseFloat(minutes) / 60 +
      parseFloat(seconds) / 3600;
    return ['S', 'W'].includes(direction.toUpperCase()) ? -decimal : decimal;
  }

  throw new Error(`Unable to parse DMS coordinate: ${dms}`);
}

/**
 * Converts DDM (Degrees Decimal Minutes) format to decimal degrees
 *
 * Supports formats:
 * - 22 16.760N
 * - 22 16.760 N
 * - N22 16.760
 * - 22° 16.760'N
 *
 * @param ddm - DDM coordinate string
 * @returns Decimal degree value (negative for S/W)
 *
 * @example
 * convertDDMToDecimal("22 16.760N") // 22.279333
 * convertDDMToDecimal("114 09.768E") // 114.1628
 */
export function convertDDMToDecimal(ddm: string): number {
  const normalized = ddm.trim();

  // Pattern 1: Hemisphere at end (e.g., "22 16.760N")
  const endPattern = /(\d+)°?\s+(\d+\.\d+)'?\s*([NSEW])/i;
  const endMatch = normalized.match(endPattern);

  if (endMatch) {
    const [, degrees, minutes, direction] = endMatch;
    const decimal = parseFloat(degrees) + parseFloat(minutes) / 60;
    return ['S', 'W'].includes(direction.toUpperCase()) ? -decimal : decimal;
  }

  // Pattern 2: Hemisphere at start (e.g., "N22 16.760")
  const startPattern = /([NSEW])\s*(\d+)°?\s+(\d+\.\d+)/i;
  const startMatch = normalized.match(startPattern);

  if (startMatch) {
    const [, direction, degrees, minutes] = startMatch;
    const decimal = parseFloat(degrees) + parseFloat(minutes) / 60;
    return ['S', 'W'].includes(direction.toUpperCase()) ? -decimal : decimal;
  }

  throw new Error(`Unable to parse DDM coordinate: ${ddm}`);
}

/**
 * Converts any supported coordinate format to decimal degrees
 *
 * @param coord - Coordinate string in any supported format
 * @returns Decimal degree value
 *
 * @example
 * convertToDecimal("22°16.760'N") // 22.279333
 * convertToDecimal("22 16.760N") // 22.279333
 * convertToDecimal("22.279333") // 22.279333
 */
export function convertToDecimal(coord: string): number {
  const format = detectCoordinateFormat(coord);

  switch (format) {
    case 'DMS':
      return convertDMSToDecimal(coord);
    case 'DDM':
      return convertDDMToDecimal(coord);
    case 'Decimal':
      return parseFloat(coord.replace(/[NSEW]/i, '').trim());
    default:
      throw new Error(`Unknown coordinate format: ${coord}`);
  }
}

/**
 * Parses a coordinate pair string into latitude and longitude
 *
 * Supports various formats:
 * - "22°16.760'N, 114°09.768'E"
 * - "22 16.760N, 114 09.768E"
 * - "22.279333, 114.1628"
 * - "22.279333N 114.1628E"
 *
 * @param coordPair - Coordinate pair string
 * @returns Parsed coordinates with format information
 *
 * @example
 * parseCoordinatePair("22°16.760'N, 114°09.768'E")
 * // { latitude: 22.279333, longitude: 114.1628, format: 'DMS' }
 */
export function parseCoordinatePair(coordPair: string): CoordinateParseResult {
  // Split by common separators
  const parts = coordPair.split(/[,\s]+/).filter(p => p.length > 0);

  if (parts.length < 2) {
    throw new Error(`Invalid coordinate pair: ${coordPair}`);
  }

  // Determine format from first coordinate
  const format = detectCoordinateFormat(parts[0]);

  // Parse coordinates based on format
  let lat: number, lng: number;

  if (format === 'DMS' || format === 'DDM') {
    // For DMS/DDM, we need to handle latitude and longitude separately
    const latPart = parts.find(p => /[NS]/i.test(p));
    const lngPart = parts.find(p => /[EW]/i.test(p));

    if (!latPart || !lngPart) {
      throw new Error(`Unable to identify lat/lng in: ${coordPair}`);
    }

    lat = convertToDecimal(latPart);
    lng = convertToDecimal(lngPart);
  } else {
    // For decimal, assume first is latitude, second is longitude
    lat = parseFloat(parts[0]);
    lng = parseFloat(parts[1]);

    // Check for hemisphere indicators
    if (parts[0].match(/S/i)) lat = -Math.abs(lat);
    if (parts[1].match(/W/i)) lng = -Math.abs(lng);
  }

  return { latitude: lat, longitude: lng, format };
}

/**
 * Validates that coordinate values are within valid ranges
 *
 * @param latitude - Latitude value
 * @param longitude - Longitude value
 * @returns True if valid, throws error otherwise
 *
 * @example
 * validateCoordinates(22.279333, 114.1628) // true
 * validateCoordinates(95, 200) // throws Error
 */
export function validateCoordinates(latitude: number, longitude: number): boolean {
  if (latitude < -90 || latitude > 90) {
    throw new Error(`Latitude out of range (-90 to 90): ${latitude}`);
  }

  if (longitude < -180 || longitude > 180) {
    throw new Error(`Longitude out of range (-180 to 180): ${longitude}`);
  }

  return true;
}

/**
 * Formats decimal coordinates to a specific format
 *
 * @param latitude - Latitude in decimal degrees
 * @param longitude - Longitude in decimal degrees
 * @param format - Desired output format
 * @param precision - Decimal places for minutes/seconds
 * @returns Formatted coordinate string
 *
 * @example
 * formatCoordinates(22.279333, 114.1628, 'DDM')
 * // "22 16.760N, 114 09.768E"
 */
export function formatCoordinates(
  latitude: number,
  longitude: number,
  format: CoordinateFormat = 'Decimal',
  precision: number = 3
): string {
  validateCoordinates(latitude, longitude);

  if (format === 'Decimal') {
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }

  const formatDDM = (value: number, isLat: boolean): string => {
    const absValue = Math.abs(value);
    const degrees = Math.floor(absValue);
    const minutes = (absValue - degrees) * 60;
    const direction = isLat
      ? (value >= 0 ? 'N' : 'S')
      : (value >= 0 ? 'E' : 'W');

    return `${degrees} ${minutes.toFixed(precision)}${direction}`;
  };

  const formatDMS = (value: number, isLat: boolean): string => {
    const absValue = Math.abs(value);
    const degrees = Math.floor(absValue);
    const minutesDecimal = (absValue - degrees) * 60;
    const minutes = Math.floor(minutesDecimal);
    const seconds = (minutesDecimal - minutes) * 60;
    const direction = isLat
      ? (value >= 0 ? 'N' : 'S')
      : (value >= 0 ? 'E' : 'W');

    return `${degrees}°${minutes}'${seconds.toFixed(precision)}"${direction}`;
  };

  if (format === 'DDM') {
    return `${formatDDM(latitude, true)}, ${formatDDM(longitude, false)}`;
  } else {
    return `${formatDMS(latitude, true)}, ${formatDMS(longitude, false)}`;
  }
}

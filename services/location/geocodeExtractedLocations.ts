/**
 * Geocoding Helper for Extracted Race Locations
 *
 * Automatically geocodes waypoints, prohibited areas, and other locations
 * extracted from race documents that don't have GPS coordinates.
 */

import { NominatimService } from './NominatimService';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('geocodeExtractedLocations');

export interface GeocodableItem {
  name: string;
  latitude?: number;
  longitude?: number;
  [key: string]: any; // Allow additional properties to pass through
}

export interface GeocodeResult<T extends GeocodableItem> {
  item: T;
  geocoded: boolean;
  error?: string;
}

/**
 * Geocode a list of items that may or may not have coordinates
 * Items with existing valid coordinates are skipped
 *
 * @param items - Array of items with name and optional lat/lng
 * @param regionHint - Region to improve geocoding accuracy (e.g., "Hong Kong")
 * @returns Array of items with coordinates filled in where possible
 */
export async function geocodeExtractedLocations<T extends GeocodableItem>(
  items: T[],
  regionHint?: string
): Promise<T[]> {
  if (!items || items.length === 0) {
    return items;
  }

  const nominatim = new NominatimService();
  const results: T[] = [];

  logger.debug(`[geocodeExtractedLocations] Geocoding ${items.length} items with hint: ${regionHint}`);

  for (const item of items) {
    // Skip if already has valid coordinates
    if (item.latitude && item.longitude &&
        item.latitude !== 0 && item.longitude !== 0 &&
        !isNaN(item.latitude) && !isNaN(item.longitude)) {
      logger.debug(`[geocodeExtractedLocations] Skipping "${item.name}" - already has coordinates`);
      results.push(item);
      continue;
    }

    try {
      // Build search query with region hint for better accuracy
      const searchQuery = regionHint
        ? `${item.name}, ${regionHint}`
        : item.name;

      logger.debug(`[geocodeExtractedLocations] Geocoding: "${searchQuery}"`);

      const result = await nominatim.geocodeVenue(item.name, regionHint);

      if (result) {
        logger.debug(`[geocodeExtractedLocations] Found: ${item.name} -> ${result.lat}, ${result.lng}`);
        results.push({
          ...item,
          latitude: result.lat,
          longitude: result.lng,
        });
      } else {
        logger.warn(`[geocodeExtractedLocations] No result for: "${item.name}"`);
        results.push(item);
      }
    } catch (error) {
      logger.error(`[geocodeExtractedLocations] Error geocoding "${item.name}":`, error);
      results.push(item);
    }
  }

  const geocodedCount = results.filter(r => r.latitude && r.longitude).length;
  logger.debug(`[geocodeExtractedLocations] Geocoded ${geocodedCount}/${items.length} items`);

  return results;
}

/**
 * Geocode a single location by name
 *
 * @param name - Location name to geocode
 * @param regionHint - Region to improve accuracy
 * @returns Coordinates or null if not found
 */
export async function geocodeSingleLocation(
  name: string,
  regionHint?: string
): Promise<{ lat: number; lng: number } | null> {
  if (!name) return null;

  const nominatim = new NominatimService();

  try {
    const result = await nominatim.geocodeVenue(name, regionHint);

    if (result) {
      return { lat: result.lat, lng: result.lng };
    }
    return null;
  } catch (error) {
    logger.error(`[geocodeSingleLocation] Error geocoding "${name}":`, error);
    return null;
  }
}

/**
 * Geocode start and finish areas from extracted race data
 *
 * @param startAreaName - Name of start area
 * @param finishAreaName - Name of finish area
 * @param regionHint - Region hint for geocoding
 * @returns Object with geocoded start and finish coordinates
 */
export async function geocodeStartFinishAreas(
  startAreaName?: string,
  finishAreaName?: string,
  regionHint?: string
): Promise<{
  startCoordinates: { lat: number; lng: number } | null;
  finishCoordinates: { lat: number; lng: number } | null;
}> {
  const startCoordinates = startAreaName
    ? await geocodeSingleLocation(startAreaName, regionHint)
    : null;

  const finishCoordinates = finishAreaName
    ? await geocodeSingleLocation(finishAreaName, regionHint)
    : null;

  return { startCoordinates, finishCoordinates };
}

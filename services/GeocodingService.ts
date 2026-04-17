/**
 * GeocodingService — Converts location names to coordinates using OpenStreetMap Nominatim.
 */

import { logger } from '@/lib/logger';

interface GeocodedResult {
  lat: number;
  lng: number;
}

export class GeocodingService {
  private static readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

  static async geocode(query: string): Promise<GeocodedResult | null> {
    if (!query?.trim()) return null;

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        format: 'json',
        limit: '1',
      });

      const response = await fetch(`${this.NOMINATIM_URL}?${params}`, {
        headers: {
          'User-Agent': 'RegattaFlow/1.0',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        logger.warn('[GeocodingService] Nominatim request failed:', response.status);
        return null;
      }

      const results = await response.json();
      if (!results?.length) {
        logger.debug('[GeocodingService] No results for:', query);
        return null;
      }

      const { lat, lon } = results[0];
      const parsed = { lat: parseFloat(lat), lng: parseFloat(lon) };

      if (isNaN(parsed.lat) || isNaN(parsed.lng)) return null;

      logger.debug('[GeocodingService] Geocoded:', query, '→', parsed);
      return parsed;
    } catch (error) {
      logger.warn('[GeocodingService] Geocoding failed:', error);
      return null;
    }
  }
}

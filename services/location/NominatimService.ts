/**
 * Nominatim Geocoding Service
 * Free, open-source geocoding using OpenStreetMap data
 *
 * Usage Policy: https://operations.osmfoundation.org/policies/nominatim/
 * - Max 1 request per second
 * - Must provide valid User-Agent
 * - No heavy usage (we'll cache results)
 */

export interface NominatimResult {
  lat: number;
  lng: number;
  displayName: string;
  osmId: string;
  osmType: string;
  placeRank: number;
  addressType: string;
  boundingBox?: [number, number, number, number]; // [south, north, west, east]
}

export interface NominatimSearchOptions {
  limit?: number;
  countrycodes?: string; // ISO 3166-1alpha2 codes, comma-separated
  viewbox?: string; // Preferred area: left,top,right,bottom
  bounded?: boolean; // Restrict to viewbox
}

export class NominatimService {
  private baseUrl = 'https://nominatim.openstreetmap.org';
  private userAgent = 'RegattaFlow/1.0 (Sailing Race Management App)';
  private requestQueue: Promise<any> = Promise.resolve();

  /**
   * Rate-limited fetch to comply with Nominatim usage policy (1 req/sec)
   */
  private async rateLimitedFetch(url: string): Promise<Response> {
    return new Promise((resolve, reject) => {
      this.requestQueue = this.requestQueue
        .then(() => {
          return fetch(url, {
            headers: {
              'User-Agent': this.userAgent,
            },
          });
        })
        .then(resolve)
        .catch(reject);

      // Ensure 1 second delay between requests
      this.requestQueue = this.requestQueue.then(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );
    });
  }

  /**
   * Search for a location by text query
   * @param query - Search string (e.g., "Royal Hong Kong Yacht Club Middle Island")
   * @param options - Search options
   */
  async search(
    query: string,
    options: NominatimSearchOptions = {}
  ): Promise<NominatimResult[]> {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: String(options.limit || 5),
    });

    if (options.countrycodes) {
      params.append('countrycodes', options.countrycodes);
    }

    if (options.viewbox) {
      params.append('viewbox', options.viewbox);
      if (options.bounded) {
        params.append('bounded', '1');
      }
    }

    const url = `${this.baseUrl}/search?${params.toString()}`;

    try {
      const response = await this.rateLimitedFetch(url);

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data = await response.json();

      return data.map((result: any) => ({
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        displayName: result.display_name,
        osmId: result.osm_id,
        osmType: result.osm_type,
        placeRank: result.place_rank,
        addressType: result.addresstype || result.type,
        boundingBox: result.boundingbox
          ? [
              parseFloat(result.boundingbox[0]), // south
              parseFloat(result.boundingbox[1]), // north
              parseFloat(result.boundingbox[2]), // west
              parseFloat(result.boundingbox[3]), // east
            ]
          : undefined,
      }));
    } catch (error) {

      throw error;
    }
  }

  /**
   * Reverse geocode coordinates to address
   * @param lat - Latitude
   * @param lng - Longitude
   */
  async reverse(lat: number, lng: number): Promise<NominatimResult | null> {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'json',
      addressdetails: '1',
    });

    const url = `${this.baseUrl}/reverse?${params.toString()}`;

    try {
      const response = await this.rateLimitedFetch(url);

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        return null;
      }

      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        displayName: result.display_name,
        osmId: result.osm_id,
        osmType: result.osm_type,
        placeRank: result.place_rank,
        addressType: result.addresstype || result.type,
        boundingBox: result.boundingbox
          ? [
              parseFloat(result.boundingbox[0]),
              parseFloat(result.boundingbox[1]),
              parseFloat(result.boundingbox[2]),
              parseFloat(result.boundingbox[3]),
            ]
          : undefined,
      };
    } catch (error) {

      return null;
    }
  }

  /**
   * Geocode yacht club by name with country filtering
   * Optimized for sailing venues and yacht clubs
   */
  async geocodeYachtClub(
    name: string,
    country?: string
  ): Promise<NominatimResult | null> {
    const options: NominatimSearchOptions = {
      limit: 1,
    };

    // Map country names to ISO codes for better results
    const countryCodeMap: Record<string, string> = {
      'Hong Kong SAR': 'hk',
      'United States': 'us',
      'United Kingdom': 'gb',
      'Australia': 'au',
      'New Zealand': 'nz',
      'China': 'cn',
      'Japan': 'jp',
      'Singapore': 'sg',
      'France': 'fr',
      'Italy': 'it',
      'Spain': 'es',
      'Germany': 'de',
      'Netherlands': 'nl',
      'Denmark': 'dk',
      'Sweden': 'se',
      'Norway': 'no',
    };

    if (country && countryCodeMap[country]) {
      options.countrycodes = countryCodeMap[country];
    }

    // Enhance query with sailing-related keywords
    const enhancedQuery = `${name} yacht club marina`;

    const results = await this.search(enhancedQuery, options);

    return results[0] || null;
  }

  /**
   * Geocode sailing venue by name and region
   */
  async geocodeVenue(
    name: string,
    country?: string,
    region?: string
  ): Promise<NominatimResult | null> {
    const options: NominatimSearchOptions = {
      limit: 1,
    };

    // Country code filtering
    const countryCodeMap: Record<string, string> = {
      'Hong Kong SAR': 'hk',
      'United States': 'us',
      'United Kingdom': 'gb',
      'Australia': 'au',
      'New Zealand': 'nz',
      'China': 'cn',
      'Japan': 'jp',
      'Singapore': 'sg',
    };

    if (country && countryCodeMap[country]) {
      options.countrycodes = countryCodeMap[country];
    }

    // Build comprehensive query
    const queryParts = [name];
    if (region) queryParts.push(region);
    if (country) queryParts.push(country);

    const results = await this.search(queryParts.join(', '), options);

    return results[0] || null;
  }

  /**
   * Batch geocode multiple locations with rate limiting
   * Automatically respects 1 req/sec limit
   */
  async batchGeocode(
    queries: Array<{ name: string; country?: string }>
  ): Promise<Array<{ query: string; result: NominatimResult | null }>> {
    const results: Array<{ query: string; result: NominatimResult | null }> = [];

    for (const query of queries) {
      const result = await this.geocodeYachtClub(query.name, query.country);
      results.push({
        query: query.name,
        result,
      });
    }

    return results;
  }
}

export const nominatimService = new NominatimService();

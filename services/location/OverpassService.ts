import { createLogger } from '@/lib/utils/logger';

/**
 * Overpass API Service
 * Query OpenStreetMap for marinas, yacht clubs, and sailing venues worldwide
 * Completely FREE - no API key required
 *
 * API Docs: https://wiki.openstreetmap.org/wiki/Overpass_API
 */

export interface OSMMarina {
  id: string; // OSM ID
  type: 'node' | 'way' | 'relation';
  lat: number;
  lon: number;
  tags: {
    name?: string;
    'name:en'?: string;
    leisure?: string; // 'marina'
    sport?: string; // 'sailing'
    amenity?: string;
    website?: string;
    phone?: string;
    operator?: string;
    description?: string;
    capacity?: string; // Number of berths
    fee?: string; // 'yes' | 'no'
    [key: string]: string | undefined;
  };
}

export interface OverpassResponse {
  version: number;
  generator: string;
  elements: OSMMarina[];
}

const logger = createLogger('OverpassService');
export class OverpassService {
  private baseUrl = 'https://overpass-api.de/api/interpreter';

  /**
   * Query marinas worldwide
   * @param bounds - Optional bounding box [south, west, north, east]
   * @param limit - Max results (default: no limit)
   */
  async queryMarinas(
    bounds?: [number, number, number, number],
    limit?: number
  ): Promise<OSMMarina[]> {
    const bbox = bounds ? `(${bounds.join(',')})` : '';

    const query = `
[out:json][timeout:180];
(
  node["leisure"="marina"]${bbox};
  way["leisure"="marina"]${bbox};
  relation["leisure"="marina"]${bbox};
);
out center${limit ? ` ${limit}` : ''};
    `.trim();

    return this.executeQuery(query);
  }

  /**
   * Query yacht clubs worldwide
   */
  async queryYachtClubs(
    bounds?: [number, number, number, number],
    limit?: number
  ): Promise<OSMMarina[]> {
    const bbox = bounds ? `(${bounds.join(',')})` : '';

    const query = `
[out:json][timeout:180];
(
  node["club"="sailing"]${bbox};
  way["club"="sailing"]${bbox};
  relation["club"="sailing"]${bbox};
  node["amenity"="yacht_club"]${bbox};
  way["amenity"="yacht_club"]${bbox};
  relation["amenity"="yacht_club"]${bbox};
);
out center${limit ? ` ${limit}` : ''};
    `.trim();

    return this.executeQuery(query);
  }

  /**
   * Query all sailing-related locations (marinas + clubs)
   */
  async querySailingVenues(
    bounds?: [number, number, number, number],
    limit?: number
  ): Promise<OSMMarina[]> {
    const bbox = bounds ? `(${bounds.join(',')})` : '';

    const query = `
[out:json][timeout:300];
(
  // Marinas
  node["leisure"="marina"]${bbox};
  way["leisure"="marina"]${bbox};
  relation["leisure"="marina"]${bbox};

  // Yacht clubs
  node["club"="sailing"]${bbox};
  way["club"="sailing"]${bbox};
  relation["club"="sailing"]${bbox};

  // Sailing clubs
  node["sport"="sailing"]${bbox};
  way["sport"="sailing"]${bbox};
  relation["sport"="sailing"]${bbox};
);
out center${limit ? ` ${limit}` : ''};
    `.trim();

    return this.executeQuery(query);
  }

  /**
   * Query by country
   * @param country - ISO 3166-1 alpha-2 country code (e.g., 'US', 'GB', 'HK')
   */
  async queryByCountry(country: string): Promise<OSMMarina[]> {
    const query = `
[out:json][timeout:300];
area["ISO3166-1"="${country.toUpperCase()}"][admin_level=2]->.searchArea;
(
  node["leisure"="marina"](area.searchArea);
  way["leisure"="marina"](area.searchArea);
  relation["leisure"="marina"](area.searchArea);
  node["club"="sailing"](area.searchArea);
  way["club"="sailing"](area.searchArea);
  relation["club"="sailing"](area.searchArea);
);
out center;
    `.trim();

    return this.executeQuery(query);
  }

  /**
   * Query by region (e.g., specific bay or coast)
   * @param query - Natural language query
   */
  async queryByRegion(regionName: string): Promise<OSMMarina[]> {
    const query = `
[out:json][timeout:180];
area["name"="${regionName}"]->.searchArea;
(
  node["leisure"="marina"](area.searchArea);
  way["leisure"="marina"](area.searchArea);
  relation["leisure"="marina"](area.searchArea);
);
out center;
    `.trim();

    return this.executeQuery(query);
  }

  /**
   * Execute raw Overpass QL query
   */
  async executeQuery(query: string): Promise<OSMMarina[]> {

    logger.debug('Query:', query.substring(0, 100) + '...');

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Overpass API error: ${response.status} - ${error}`);
      }

      const data: OverpassResponse = await response.json();

      return data.elements.map(element => ({
        ...element,
        // For ways/relations, use center coordinates
        lat: element.lat || (element as any).center?.lat,
        lon: element.lon || (element as any).center?.lon,
      })).filter(e => e.lat && e.lon); // Only keep elements with coordinates
    } catch (error: any) {

      throw error;
    }
  }

  /**
   * Query sailing services (chandleries, sail lofts, repair shops, etc.)
   */
  async querySailingServices(
    bounds?: [number, number, number, number],
    limit?: number
  ): Promise<OSMMarina[]> {
    const bbox = bounds ? `(${bounds.join(',')})` : '';

    const query = `
[out:json][timeout:180];
(
  // Chandleries and marine supply stores
  node["shop"="boat"]${bbox};
  way["shop"="boat"]${bbox};
  node["shop"="marine"]${bbox};
  way["shop"="marine"]${bbox};

  // Sail makers and riggers
  node["craft"="sailmaker"]${bbox};
  way["craft"="sailmaker"]${bbox};
  node["craft"="rigger"]${bbox};
  way["craft"="rigger"]${bbox};

  // Boat repair
  node["craft"="boatbuilder"]${bbox};
  way["craft"="boatbuilder"]${bbox};

  // Sailing schools
  node["sport"="sailing"]["amenity"="school"]${bbox};
  way["sport"="sailing"]["amenity"="school"]${bbox};
);
out center${limit ? ` ${limit}` : ''};
    `.trim();

    return this.executeQuery(query);
  }

  /**
   * Download all marinas worldwide in chunks (to avoid timeout)
   * Splits globe into regions and queries each
   */
  async downloadAllMarinasWorldwide(): Promise<OSMMarina[]> {

    logger.debug('This will take several minutes...\n');

    // Split world into regions to avoid timeout
    const regions = [
      { name: 'North America', bounds: [15, -170, 72, -50] },
      { name: 'South America', bounds: [-56, -82, 13, -34] },
      { name: 'Europe', bounds: [36, -10, 71, 40] },
      { name: 'Africa', bounds: [-35, -18, 37, 52] },
      { name: 'Asia', bounds: [5, 40, 55, 150] },
      { name: 'Oceania', bounds: [-47, 110, -10, 180] },
    ] as const;

    const allMarinas: OSMMarina[] = [];

    for (const region of regions) {

      try {
        const marinas = await this.queryMarinas(region.bounds as [number, number, number, number]);
        allMarinas.push(...marinas);

        // Rate limiting - be nice to Overpass
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
      }
    }

    return allMarinas;
  }

  /**
   * Convert OSM marina to our database format
   */
  static toVenueFormat(marina: OSMMarina): {
    name: string;
    coordinates_lat: number;
    coordinates_lng: number;
    country?: string;
    osm_id: string;
    osm_type: string;
    website?: string;
    phone?: string;
    capacity?: number;
  } {
    return {
      name: marina.tags.name || marina.tags['name:en'] || `Marina ${marina.id}`,
      coordinates_lat: marina.lat,
      coordinates_lng: marina.lon,
      osm_id: String(marina.id),
      osm_type: marina.type,
      website: marina.tags.website,
      phone: marina.tags.phone,
      capacity: marina.tags.capacity ? parseInt(marina.tags.capacity) : undefined,
    };
  }
}

export const overpassService = new OverpassService();

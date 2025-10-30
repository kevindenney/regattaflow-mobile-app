/**
 * Google Places API Service
 * Accurate geocoding for yacht clubs, marinas, and sailing venues
 *
 * API Documentation: https://developers.google.com/maps/documentation/places/web-service/overview
 * Requires: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
 */

export interface PlaceSearchResult {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
  types: string[];
  rating?: number;
  userRatingsTotal?: number;
  businessStatus?: string;
}

export interface PlaceDetails extends PlaceSearchResult {
  phoneNumber?: string;
  internationalPhoneNumber?: string;
  website?: string;
  openingHours?: {
    periods: any[];
    weekdayText: string[];
  };
  photos?: Array<{
    name: string;
    widthPx: number;
    heightPx: number;
  }>;
  editorialSummary?: string;
  googleMapsUri?: string;
}

export interface GeocodingResult {
  placeId: string;
  formattedAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
  locationType: string; // ROOFTOP, RANGE_INTERPOLATED, GEOMETRIC_CENTER, APPROXIMATE
  types: string[];
}

export class GooglePlacesService {
  private apiKey: string;
  private placesBaseUrl = 'https://places.googleapis.com/v1';
  private geocodingBaseUrl = 'https://maps.googleapis.com/maps/api/geocode';

  constructor(apiKey?: string) {
    // @ts-ignore - Expo env vars
    this.apiKey = apiKey || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    if (!this.apiKey) {

    }
  }

  /**
   * Search for places by text query
   * Uses Places API (New) Text Search
   *
   * @param query - Search text (e.g., "Royal Hong Kong Yacht Club")
   * @param options - Search options
   */
  async searchText(
    query: string,
    options: {
      includedType?: string; // 'marina', 'establishment', etc.
      locationBias?: {
        circle: {
          center: { latitude: number; longitude: number };
          radius: number; // meters
        };
      };
      maxResultCount?: number;
    } = {}
  ): Promise<PlaceSearchResult[]> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    const requestBody: any = {
      textQuery: query,
    };

    if (options.includedType) {
      requestBody.includedType = options.includedType;
    }

    if (options.locationBias) {
      requestBody.locationBias = options.locationBias;
    }

    if (options.maxResultCount) {
      requestBody.maxResultCount = Math.min(options.maxResultCount, 20);
    }

    try {
      const response = await fetch(`${this.placesBaseUrl}/places:searchText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.businessStatus',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Google Places API error: ${response.status} - ${error}`);
      }

      const data = await response.json();

      return (data.places || []).map((place: any) => ({
        placeId: place.id,
        displayName: place.displayName?.text || '',
        formattedAddress: place.formattedAddress || '',
        location: {
          latitude: place.location?.latitude || 0,
          longitude: place.location?.longitude || 0,
        },
        types: place.types || [],
        rating: place.rating,
        userRatingsTotal: place.userRatingCount,
        businessStatus: place.businessStatus,
      }));
    } catch (error: any) {

      throw error;
    }
  }

  /**
   * Get detailed information about a specific place
   *
   * @param placeId - Google Place ID
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const response = await fetch(`${this.placesBaseUrl}/places/${placeId}`, {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,types,rating,userRatingCount,businessStatus,internationalPhoneNumber,nationalPhoneNumber,websiteUri,currentOpeningHours,photos,editorialSummary,googleMapsUri',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`Google Places API error: ${response.status} - ${error}`);
        return null;
      }

      const place = await response.json();

      return {
        placeId: place.id,
        displayName: place.displayName?.text || '',
        formattedAddress: place.formattedAddress || '',
        location: {
          latitude: place.location?.latitude || 0,
          longitude: place.location?.longitude || 0,
        },
        types: place.types || [],
        rating: place.rating,
        userRatingsTotal: place.userRatingCount,
        businessStatus: place.businessStatus,
        phoneNumber: place.nationalPhoneNumber,
        internationalPhoneNumber: place.internationalPhoneNumber,
        website: place.websiteUri,
        openingHours: place.currentOpeningHours,
        photos: place.photos,
        editorialSummary: place.editorialSummary?.text,
        googleMapsUri: place.googleMapsUri,
      };
    } catch (error: any) {

      return null;
    }
  }

  /**
   * Geocode an address to coordinates
   * Uses Geocoding API for address → coordinates conversion
   *
   * @param address - Address string
   */
  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const params = new URLSearchParams({
        address: address,
        key: this.apiKey,
      });

      const response = await fetch(`${this.geocodingBaseUrl}/json?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== 'OK' || !data.results?.[0]) {
        console.warn(`Geocoding failed: ${data.status} - ${data.error_message || 'No results'}`);
        return null;
      }

      const result = data.results[0];

      return {
        placeId: result.place_id,
        formattedAddress: result.formatted_address,
        location: {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
        },
        locationType: result.geometry.location_type,
        types: result.types,
      };
    } catch (error: any) {

      return null;
    }
  }

  /**
   * Reverse geocode coordinates to address
   *
   * @param latitude - Latitude
   * @param longitude - Longitude
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    try {
      const params = new URLSearchParams({
        latlng: `${latitude},${longitude}`,
        key: this.apiKey,
      });

      const response = await fetch(`${this.geocodingBaseUrl}/json?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Reverse Geocoding API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== 'OK' || !data.results?.[0]) {
        console.warn(`Reverse geocoding failed: ${data.status}`);
        return null;
      }

      const result = data.results[0];

      return {
        placeId: result.place_id,
        formattedAddress: result.formatted_address,
        location: {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
        },
        locationType: result.geometry.location_type,
        types: result.types,
      };
    } catch (error: any) {

      return null;
    }
  }

  /**
   * Search for yacht club or marina with location bias
   * Optimized for sailing venues
   *
   * @param name - Yacht club name
   * @param location - Optional location bias
   */
  async searchYachtClub(
    name: string,
    location?: { latitude: number; longitude: number; radius?: number }
  ): Promise<PlaceSearchResult[]> {
    const options: any = {
      includedType: 'marina',
      maxResultCount: 5,
    };

    if (location) {
      options.locationBias = {
        circle: {
          center: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          radius: location.radius || 50000, // 50km default
        },
      };
    }

    return this.searchText(name, options);
  }

  /**
   * Get photo URL for a place photo
   *
   * @param photoName - Photo name from Place Details
   * @param maxWidth - Maximum width in pixels
   */
  getPhotoUrl(photoName: string, maxWidth: number = 400): string {
    return `${this.placesBaseUrl}/${photoName}/media?maxWidthPx=${maxWidth}&key=${this.apiKey}`;
  }

  /**
   * Batch geocode multiple locations with rate limiting
   * Note: Google doesn't have strict rate limits like Nominatim, but we'll be respectful
   *
   * @param queries - Array of search queries
   * @param delayMs - Delay between requests (default 100ms)
   */
  async batchSearch(
    queries: Array<{ name: string; location?: { latitude: number; longitude: number } }>,
    delayMs: number = 100
  ): Promise<Array<{ query: string; results: PlaceSearchResult[] }>> {
    const results: Array<{ query: string; results: PlaceSearchResult[] }> = [];

    for (const query of queries) {

      try {
        const searchResults = await this.searchYachtClub(query.name, query.location);
        results.push({
          query: query.name,
          results: searchResults,
        });
      } catch (error) {
        results.push({
          query: query.name,
          results: [],
        });
      }

      // Rate limiting delay
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }
}

// Singleton instance
export const googlePlacesService = new GooglePlacesService();

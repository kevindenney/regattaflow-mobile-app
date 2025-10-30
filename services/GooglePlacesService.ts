/**
 * Google Places Service
 * Fetch sailing-related services using Google Places API
 */

import { ServiceType } from './SailingNetworkService';

export interface PlaceResult {
  id: string;
  name: string;
  type: ServiceType;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  rating?: number;
  userRatingsTotal?: number;
  photoUrl?: string;
  isOpen?: boolean;
  placeId: string;
}

// Map our service types to Google Places types
const SERVICE_TYPE_MAPPING: Record<ServiceType, string[]> = {
  yacht_club: ['yacht_club', 'country_club', 'marina'],
  sailmaker: ['sail_maker', 'sporting_goods_store'],
  rigger: ['boat_repair', 'marine_supply_store'],
  coach: ['sports_coach', 'sports_club'],
  marina: ['marina', 'boat_storage'],
  chandler: ['marine_supply_store', 'boating_supply_store'],
  repair: ['boat_repair', 'marine_repair'],
  engine: ['boat_repair', 'marine_engine_repair'],
  clothing: ['clothing_store', 'sporting_goods_store'],
  venue: ['sports_complex', 'stadium'],
  other: ['point_of_interest'],
};

// Search queries for each service type when Places types don't match well
const SERVICE_SEARCH_QUERIES: Record<ServiceType, string> = {
  yacht_club: 'yacht club',
  sailmaker: 'sail maker',
  rigger: 'rigging service',
  coach: 'sailing coach',
  marina: 'marina',
  chandler: 'chandlery marine supplies',
  repair: 'boat repair',
  engine: 'marine engine repair',
  clothing: 'sailing gear clothing',
  venue: 'sailing venue',
  other: 'sailing',
};

export class GooglePlacesService {
  /**
   * Search for places by service type in a geographic area
   */
  static async searchPlaces(
    serviceType: ServiceType,
    center: { lat: number; lng: number },
    radiusMeters: number = 50000 // 50km default
  ): Promise<PlaceResult[]> {
    try {
      // Use the global google object from Google Maps script
      if (typeof window === 'undefined' || !(window as any).google) {
        console.warn('Google Maps not loaded');
        return [];
      }

      const google = (window as any).google;
      const map = new google.maps.Map(document.createElement('div'));
      const service = new google.maps.places.PlacesService(map);

      const query = SERVICE_SEARCH_QUERIES[serviceType];

      return new Promise((resolve) => {
        // Use nearbySearch for better geographic filtering
        const request = {
          location: new google.maps.LatLng(center.lat, center.lng),
          radius: radiusMeters,
          keyword: query, // Use keyword instead of query for nearbySearch
          type: 'point_of_interest', // Broad type to catch all businesses
        };

        service.nearbySearch(request, (results: any[], status: any) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const places = results.map((place: any) => ({
              id: place.place_id,
              name: place.name,
              type: serviceType,
              address: place.vicinity || place.formatted_address || '',
              coordinates: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              },
              rating: place.rating,
              userRatingsTotal: place.user_ratings_total,
              photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 400 }),
              isOpen: place.opening_hours?.isOpen?.() || place.opening_hours?.open_now,
              placeId: place.place_id,
            }));


            // Log first few results for debugging
            if (places.length > 0) {
            }

            resolve(places);
          } else {
            resolve([]);
          }
        });
      });
    } catch (error) {

      return [];
    }
  }

  /**
   * Get details for a specific place
   */
  static async getPlaceDetails(placeId: string): Promise<any> {
    try {
      if (typeof window === 'undefined' || !(window as any).google) {
        return null;
      }

      const google = (window as any).google;
      const map = new google.maps.Map(document.createElement('div'));
      const service = new google.maps.places.PlacesService(map);

      return new Promise((resolve) => {
        service.getDetails(
          {
            placeId,
            fields: [
              'name',
              'formatted_address',
              'geometry',
              'place_id',
              'photos',
              'rating',
              'user_ratings_total',
              'opening_hours',
              'website',
              'formatted_phone_number',
              'types',
            ],
          },
          (place: any, status: any) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
              resolve(place);
            } else {
              resolve(null);
            }
          }
        );
      });
    } catch (error) {
      console.error('Get place details error:', error);
      return null;
    }
  }

  /**
   * Search multiple service types at once
   */
  static async searchMultipleTypes(
    serviceTypes: ServiceType[],
    center: { lat: number; lng: number },
    radiusMeters: number = 50000
  ): Promise<Record<ServiceType, PlaceResult[]>> {
    const results: Record<ServiceType, PlaceResult[]> = {} as any;

    await Promise.all(
      serviceTypes.map(async (type) => {
        const places = await this.searchPlaces(type, center, radiusMeters);
        results[type] = places;
      })
    );

    return results;
  }
}

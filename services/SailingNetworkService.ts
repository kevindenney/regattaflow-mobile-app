/**
 * Sailing Network Service
 * Unified service for managing all "places" in a sailor's network
 * (venues, yacht clubs, sailmakers, chandlers, coaches, etc.)
 */

import { supabase } from './supabase';
import { createLogger } from '@/lib/utils/logger';

export type ServiceType =
  | 'venue'
  | 'yacht_club'
  | 'sailmaker'
  | 'chandler'
  | 'rigger'
  | 'coach'
  | 'marina'
  | 'repair'
  | 'engine'
  | 'clothing'
  | 'other';

export interface NetworkPlace {
  id: string;
  type: ServiceType;
  name: string;
  country: string;
  location: {
    name: string;
    region: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
  isSaved: boolean;
  savedId?: string; // ID in saved_venues table if saved
  notes?: string;
  isHomeVenue?: boolean;
}

export interface LocationSummary {
  name: string;
  region: string;
  savedCount: number;
  hasHomeVenue: boolean;
  serviceTypes: ServiceType[];
}

export interface LocationContext {
  locationName: string;
  locationRegion: string;
  coordinates: { lat: number; lng: number };
  detectionMethod: 'gps' | 'manual' | 'calendar';
}

const logger = createLogger('SailingNetworkService');
export class SailingNetworkService {
  /**
   * Get user's saved network for a specific location
   */
  static async getMyNetwork(locationName?: string): Promise<NetworkPlace[]> {
    try {
      // Timeout after 5 seconds to prevent indefinite hanging
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out after 5 seconds')), 5000)
      );

      const authPromise = supabase.auth.getUser();
      const { data: { user } } = await Promise.race([authPromise, timeoutPromise]) as any;

      if (!user) {
        logger.debug('No user authenticated, returning empty network');
        return [];
      }

      let query = supabase
        .from('saved_venues_with_details')
        .select('*')
        .eq('user_id', user.id);

      if (locationName) {
        query = query.eq('location_name', locationName);
      }

      const queryPromise = query.order('is_home_venue', { ascending: false });
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        logger.error('Failed to get network:', error);
        return []; // Return empty array instead of throwing
      }

      return (data || []).map(item => ({
        id: item.id,
        type: item.service_type as ServiceType,
        name: item.name,
        country: item.country,
        location: {
          name: item.location_name,
          region: item.location_region,
        },
        coordinates: {
          lat: item.coordinates_lat,
          lng: item.coordinates_lng,
        },
        isSaved: true,
        savedId: item.saved_venue_id,
        notes: item.notes,
        isHomeVenue: item.is_home_venue,
      }));
    } catch (error: any) {
      // Handle timeout or other errors gracefully
      if (error.message?.includes('timed out')) {
        logger.warn('getMyNetwork timed out, returning empty array');
      } else {
        logger.error('getMyNetwork failed:', error);
      }
      return [];
    }
  }

  /**
   * Discover places in a location (not yet saved)
   */
  static async discoverInLocation(
    locationName: string,
    filters?: {
      serviceTypes?: ServiceType[];
      searchQuery?: string;
    }
  ): Promise<NetworkPlace[]> {
    try {
      // Timeout after 5 seconds
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out after 5 seconds')), 5000)
      );

      const authPromise = supabase.auth.getUser();
      const { data: { user } } = await Promise.race([authPromise, timeoutPromise]) as any;
      if (!user) throw new Error('User not authenticated');

      // Get saved venue IDs to exclude from discovery
      const savedVenuesPromise = supabase
        .from('saved_venues')
        .select('venue_id')
        .eq('user_id', user.id);

      const { data: savedVenues } = await Promise.race([savedVenuesPromise, timeoutPromise]) as any;

      const savedVenueIds = new Set((savedVenues || []).map((sv: { venue_id: string }) => sv.venue_id));

      // Query sailing venues in this location
      let query = supabase
        .from('sailing_venues')
        .select('*');

      // Filter by location (approximate matching)
      if (filters?.searchQuery) {
        query = query.or(`name.ilike.%${filters.searchQuery}%,country.ilike.%${filters.searchQuery}%`);
      }

      const { data, error } = await Promise.race([query, timeoutPromise]) as any;

      if (error) throw error;

      // Filter out already saved venues
      const unsavedVenues = (data || [])
        .filter((venue: any) => !savedVenueIds.has(venue.id))
        .map((venue: any) => ({
          id: venue.id,
          type: 'venue' as ServiceType, // Default to venue for now
          name: venue.name,
          country: venue.country,
          location: {
            name: venue.name, // Use venue name as location
            region: venue.region,
          },
          coordinates: {
            lat: venue.coordinates_lat,
            lng: venue.coordinates_lng,
          },
          isSaved: false,
        }));

      return unsavedVenues;
    } catch (error: any) {
      if (error.message?.includes('timed out')) {
        logger.warn('discoverInLocation timed out, returning empty array');
      } else {
        logger.error('discoverInLocation failed:', error);
      }
      return [];
    }
  }

  /**
   * Save a place to user's network
   */
  static async saveToNetwork(
    placeId: string,
    type: ServiceType,
    location: {
      name: string;
      region: string;
    },
    options?: {
      notes?: string;
      isHomeVenue?: boolean;
    }
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // If setting as home venue, unset any existing home venue
    if (options?.isHomeVenue) {
      await supabase
        .from('saved_venues')
        .update({ is_home_venue: false })
        .eq('user_id', user.id)
        .eq('is_home_venue', true);
    }

    const { error } = await supabase
      .from('saved_venues')
      .insert({
        user_id: user.id,
        venue_id: placeId,
        service_type: type,
        location_name: location.name,
        location_region: location.region,
        notes: options?.notes || null,
        is_home_venue: options?.isHomeVenue || false,
      });

    if (error) {
      // Handle unique constraint violation (already saved)
      if (error.code === '23505') {
        throw new Error('This place is already saved to your network');
      }
      throw error;
    }
  }

  /**
   * Remove a place from user's network
   */
  static async removeFromNetwork(placeId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('saved_venues')
      .delete()
      .eq('user_id', user.id)
      .eq('venue_id', placeId);

    if (error) throw error;
  }

  /**
   * Get summary of user's locations with saved place counts
   */
  static async getMyLocations(): Promise<LocationSummary[]> {
    try {
      // Timeout after 5 seconds
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out after 5 seconds')), 5000)
      );

      const authPromise = supabase.auth.getUser();
      const { data: { user } } = await Promise.race([authPromise, timeoutPromise]) as any;

      if (!user) {
        return [];
      }

      const rpcPromise = supabase.rpc('get_user_locations_summary', {
        p_user_id: user.id,
      });

      const { data, error } = await Promise.race([rpcPromise, timeoutPromise]) as any;

      if (error) {
        logger.error('Failed to get locations:', error);
        return []; // Return empty array instead of throwing
      }

      const mapped = (data || []).map((item: any) => ({
        name: item.location_name,
        region: item.location_region,
        savedCount: item.saved_count,
        hasHomeVenue: item.has_home_venue,
        serviceTypes: item.service_types,
      }));

      return mapped;
    } catch (error: any) {
      if (error.message?.includes('timed out')) {
        logger.warn('getMyLocations timed out, returning empty array');
      } else {
        logger.error('getMyLocations failed:', error);
      }
      return [];
    }
  }

  /**
   * Get user's current location context
   */
  static async getCurrentLocationContext(): Promise<LocationContext | null> {
    try {
      // Timeout after 5 seconds
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out after 5 seconds')), 5000)
      );

      const authPromise = supabase.auth.getUser();
      const { data: { user } } = await Promise.race([authPromise, timeoutPromise]) as any;

      if (!user) {
        return null;
      }

      const queryPromise = supabase
        .from('user_location_context')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (error) {
        logger.error('Failed to get current location context:', error);
        return null; // Return null instead of throwing to prevent app crash
      }
      if (!data) {
        return null;
      }

      const result = {
        locationName: data.current_location_name,
        locationRegion: data.current_location_region,
        coordinates: {
          lat: 0, // POINT type not used for now
          lng: 0,
        },
        detectionMethod: data.detection_method as 'gps' | 'manual' | 'calendar',
      };

      return result;
    } catch (error: any) {
      if (error.message?.includes('timed out')) {
        logger.warn('getCurrentLocationContext timed out, returning null');
      } else {
        logger.error('getCurrentLocationContext failed:', error);
      }
      return null;
    }
  }

  /**
   * Set user's current location context
   */
  static async setLocationContext(
    locationName: string,
    locationRegion: string,
    coordinates: { lat: number; lng: number },
    detectionMethod: 'gps' | 'manual' | 'calendar' = 'manual'
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Direct insert/update instead of RPC to avoid POINT type issues
    const { error } = await supabase
      .from('user_location_context')
      .upsert({
        user_id: user.id,
        current_location_name: locationName,
        current_location_region: locationRegion,
        // Store as null for now - POINT type has issues with JS client
        current_location_coordinates: null,
        detection_method: detectionMethod,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;
  }

  /**
   * Auto-save a place during onboarding or calendar setup
   */
  static async autoSave(
    placeId: string,
    placeName: string,
    type: ServiceType,
    location: {
      name: string;
      region: string;
    },
    coordinates: { lat: number; lng: number },
    isHome: boolean = false
  ): Promise<void> {
    try {
      // Save to network
      await this.saveToNetwork(placeId, type, location, {
        isHomeVenue: isHome,
      });

      // Update location context if this is home
      if (isHome) {
        await this.setLocationContext(
          location.name,
          location.region,
          coordinates,
          'manual'
        );
      }
    } catch (error: any) {
      // Silent fail if already saved - this is auto-save, not critical
      if (!error.message?.includes('already saved')) {
        console.error('Auto-save failed:', error);
      }
    }
  }

  /**
   * Check if a place is in user's network
   */
  static async isInNetwork(placeId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('saved_venues')
      .select('id')
      .eq('user_id', user.id)
      .eq('venue_id', placeId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  }

  /**
   * Update place details in network
   */
  static async updateNetworkPlace(
    placeId: string,
    updates: {
      notes?: string;
      isHomeVenue?: boolean;
    }
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // If setting as home venue, unset any existing home venue
    if (updates.isHomeVenue) {
      await supabase
        .from('saved_venues')
        .update({ is_home_venue: false })
        .eq('user_id', user.id)
        .eq('is_home_venue', true);
    }

    const { error } = await supabase
      .from('saved_venues')
      .update({
        notes: updates.notes !== undefined ? updates.notes : undefined,
        is_home_venue: updates.isHomeVenue !== undefined ? updates.isHomeVenue : undefined,
      })
      .eq('user_id', user.id)
      .eq('venue_id', placeId);

    if (error) throw error;
  }
}

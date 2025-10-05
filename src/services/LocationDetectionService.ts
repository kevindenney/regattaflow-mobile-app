/**
 * Location Detection Service
 * GPS-based venue detection and location management for sailors
 * Called by OnboardingAgent tools
 */

import { supabase } from './supabase';
import * as Location from 'expo-location';

export interface GPSCoordinates {
  lat: number;
  lng: number;
}

export interface SailingVenue {
  id: string;
  name: string;
  city?: string;
  country?: string;
  latitude: number;
  longitude: number;
  distance_km?: number;
}

export interface SailorLocation {
  id: string;
  sailor_id: string;
  location_id: string;
  is_primary: boolean;
  is_active: boolean;
  metadata: any;
  sailing_venues: SailingVenue;
}

export class LocationDetectionService {
  /**
   * Detect current location using device GPS
   */
  static async detectCurrentLocation(): Promise<{
    venue: SailingVenue | null;
    confidence: 'high' | 'medium' | 'low';
    coordinates: GPSCoordinates;
  } | null> {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        console.warn('Location permission denied');
        return null;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coordinates: GPSCoordinates = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      // Find nearest venue using PostGIS
      const { data: venues, error } = await supabase
        .rpc('venues_within_radius', {
          lat: coordinates.lat,
          lng: coordinates.lng,
          radius_km: 50,
        })
        .limit(1);

      if (error) {
        console.error('Error finding nearby venues:', error);
        return null;
      }

      if (!venues || venues.length === 0) {
        return {
          venue: null,
          confidence: 'low',
          coordinates,
        };
      }

      const venue = venues[0];

      // Determine confidence based on distance
      let confidence: 'high' | 'medium' | 'low' = 'low';
      if (venue.distance_km < 10) confidence = 'high';
      else if (venue.distance_km < 25) confidence = 'medium';

      return {
        venue,
        confidence,
        coordinates,
      };
    } catch (error) {
      console.error('Error detecting location:', error);
      return null;
    }
  }

  /**
   * Search venues by name, city, or country
   */
  static async searchLocations(query: string, limit: number = 10): Promise<SailingVenue[]> {
    try {
      const { data: venues, error } = await supabase
        .from('sailing_venues')
        .select('*')
        .or(`name.ilike.%${query}%,country.ilike.%${query}%,region.ilike.%${query}%,formatted_address.ilike.%${query}%`)
        .order('name', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return venues || [];
    } catch (error) {
      console.error('Error searching locations:', error);
      return [];
    }
  }

  /**
   * Add a location for a sailor
   */
  static async addSailorLocation(
    sailorId: string,
    venueId: string,
    isPrimary: boolean = false,
    metadata?: any
  ): Promise<SailorLocation | null> {
    try {
      const { data: location, error } = await supabase
        .from('sailor_locations')
        .insert({
          sailor_id: sailorId,
          location_id: venueId,
          is_primary: isPrimary,
          is_active: true,
          metadata: metadata || {},
        })
        .select(`
          *,
          sailing_venues(*)
        `)
        .single();

      if (error) throw error;

      return location;
    } catch (error) {
      console.error('Error adding sailor location:', error);
      return null;
    }
  }

  /**
   * Get all locations for a sailor
   */
  static async getSailorLocations(sailorId: string): Promise<SailorLocation[]> {
    try {
      const { data: locations, error } = await supabase
        .from('sailor_locations')
        .select(`
          *,
          sailing_venues(*)
        `)
        .eq('sailor_id', sailorId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false });

      if (error) throw error;

      return locations || [];
    } catch (error) {
      console.error('Error getting sailor locations:', error);
      return [];
    }
  }

  /**
   * Get primary location for a sailor
   */
  static async getPrimaryLocation(sailorId: string): Promise<SailorLocation | null> {
    try {
      const { data: location, error } = await supabase
        .from('sailor_locations')
        .select(`
          *,
          sailing_venues(*)
        `)
        .eq('sailor_id', sailorId)
        .eq('is_primary', true)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return location || null;
    } catch (error) {
      console.error('Error getting primary location:', error);
      return null;
    }
  }

  /**
   * Set a location as primary (unsets others)
   */
  static async setPrimaryLocation(sailorId: string, locationId: string): Promise<boolean> {
    try {
      // The trigger ensures only one primary location
      const { error } = await supabase
        .from('sailor_locations')
        .update({ is_primary: true })
        .eq('sailor_id', sailorId)
        .eq('id', locationId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error setting primary location:', error);
      return false;
    }
  }

  /**
   * Remove a sailor location
   */
  static async removeSailorLocation(sailorId: string, locationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sailor_locations')
        .delete()
        .eq('sailor_id', sailorId)
        .eq('id', locationId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error removing sailor location:', error);
      return false;
    }
  }

  /**
   * Calculate distance between two GPS coordinates (Haversine formula)
   */
  static calculateDistance(
    coord1: GPSCoordinates,
    coord2: GPSCoordinates
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLon = this.toRad(coord2.lng - coord1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(coord1.lat)) *
        Math.cos(this.toRad(coord2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

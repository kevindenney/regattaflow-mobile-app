/**
 * Club Onboarding Service
 * Orchestrates auto-suggestions for club setup
 * Combines location, discovery, and scraping services
 */

import { supabase } from './supabase';
import { LocationDetectionService, type SailingVenue, type GPSCoordinates } from './LocationDetectionService';
import { ClubDiscoveryService, type YachtClub } from './ClubDiscoveryService';
import { FleetDiscoveryService, type Fleet } from './FleetDiscoveryService';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('ClubOnboardingService');

export interface OnboardingSession {
  id: string;
  user_id: string;
  club_id?: string;
  scraped_data: any;
  suggested_data: any;
  confirmed_data: any;
  source_url?: string;
  conversation_history: any[];
  status: 'in_progress' | 'completed' | 'abandoned';
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface SuggestedData {
  id: string;
  session_id: string;
  field_name: string;
  field_category: 'basic' | 'classes' | 'events' | 'contacts' | 'venue' | 'other';
  suggested_value: any;
  confidence: number;
  source: 'scrape' | 'chat' | 'location' | 'manual' | 'discovery';
  status: 'pending' | 'accepted' | 'rejected' | 'edited';
  reasoning?: string;
  created_at: string;
}

export interface ClubSuggestion {
  id: string;
  name: string;
  venue_id?: string;
  venue_name?: string;
  city?: string;
  country?: string;
  website?: string;
  confidence: number;
  source: 'location' | 'search' | 'popular';
}

export interface ClassSuggestion {
  id?: string;
  name: string;
  type?: string;
  confidence: number;
  source: 'club' | 'region' | 'popular';
  typical_fleet_size?: number;
}

export interface VenueSuggestion {
  id?: string;
  name: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  confidence: number;
  distance_km?: number;
}

export class ClubOnboardingService {
  /**
   * Create or resume an onboarding session
   */
  static async getOrCreateSession(userId: string): Promise<OnboardingSession | null> {
    try {
      // Try to find active session
      const { data: existing, error: fetchError } = await supabase
        .from('club_onboarding_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'in_progress')
        .single();

      if (!fetchError && existing) {
        logger.debug('Resuming existing session', existing.id);
        return existing;
      }

      // Create new session
      const { data: newSession, error: createError } = await supabase
        .from('club_onboarding_sessions')
        .insert({
          user_id: userId,
          scraped_data: {},
          suggested_data: {},
          confirmed_data: {},
          conversation_history: [],
        })
        .select()
        .single();

      if (createError) throw createError;

      logger.debug('Created new onboarding session', newSession.id);
      return newSession;
    } catch (error) {
      logger.error('Error getting/creating session:', error);
      return null;
    }
  }

  /**
   * Detect location and suggest nearby clubs
   */
  static async suggestClubsByLocation(): Promise<ClubSuggestion[]> {
    try {
      const locationResult = await LocationDetectionService.detectCurrentLocation();

      if (!locationResult || !locationResult.venue) {
        logger.debug('No location detected');
        return [];
      }

      const { venue, confidence } = locationResult;

      // Get clubs at this venue
      const clubs = await ClubDiscoveryService.discoverClubsByVenue(venue.id, 10);

      return clubs.map((club) => ({
        id: club.id,
        name: club.name,
        venue_id: club.venue_id,
        venue_name: venue.name,
        city: venue.city,
        country: venue.country,
        website: club.website,
        confidence: confidence === 'high' ? 0.9 : confidence === 'medium' ? 0.7 : 0.5,
        source: 'location' as const,
      }));
    } catch (error) {
      logger.error('Error suggesting clubs by location:', error);
      return [];
    }
  }

  /**
   * Search clubs by name or region
   */
  static async searchClubs(query: string, limit: number = 10): Promise<ClubSuggestion[]> {
    try {
      const { data: clubs, error } = await supabase
        .from('yacht_clubs')
        .select(`
          *,
          sailing_venues(id, name, city, country)
        `)
        .ilike('name', `%${query}%`)
        .limit(limit);

      if (error) throw error;

      return (clubs || []).map((club: any) => ({
        id: club.id,
        name: club.name,
        venue_id: club.venue_id,
        venue_name: club.sailing_venues?.name,
        city: club.sailing_venues?.city,
        country: club.sailing_venues?.country,
        website: club.website,
        confidence: 0.8,
        source: 'search' as const,
      }));
    } catch (error) {
      logger.error('Error searching clubs:', error);
      return [];
    }
  }

  /**
   * Suggest boat classes based on selected club
   */
  static async suggestClassesByClub(clubId: string): Promise<ClassSuggestion[]> {
    try {
      // Get fleets associated with this club
      const fleets = await FleetDiscoveryService.discoverFleetsByClub(clubId, 20);

      const classMap = new Map<string, ClassSuggestion>();

      for (const fleet of fleets) {
        if (fleet.boat_classes) {
          const existingClass = classMap.get(fleet.boat_classes.name);
          if (existingClass) {
            // Increase confidence if we see the same class multiple times
            existingClass.confidence = Math.min(1.0, existingClass.confidence + 0.1);
          } else {
            classMap.set(fleet.boat_classes.name, {
              id: fleet.boat_classes.id,
              name: fleet.boat_classes.name,
              type: fleet.boat_classes.type,
              confidence: 0.8,
              source: 'club',
              typical_fleet_size: fleet.member_count,
            });
          }
        }
      }

      return Array.from(classMap.values()).sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      logger.error('Error suggesting classes by club:', error);
      return [];
    }
  }

  /**
   * Suggest boat classes based on region
   */
  static async suggestClassesByRegion(venueId: string): Promise<ClassSuggestion[]> {
    try {
      const fleets = await FleetDiscoveryService.discoverFleetsByVenue(venueId, 20);

      const classMap = new Map<string, ClassSuggestion>();

      for (const fleet of fleets) {
        if (fleet.boat_classes) {
          const existingClass = classMap.get(fleet.boat_classes.name);
          if (existingClass) {
            existingClass.confidence = Math.min(1.0, existingClass.confidence + 0.1);
            if (fleet.member_count) {
              existingClass.typical_fleet_size = Math.max(
                existingClass.typical_fleet_size || 0,
                fleet.member_count
              );
            }
          } else {
            classMap.set(fleet.boat_classes.name, {
              id: fleet.boat_classes.id,
              name: fleet.boat_classes.name,
              type: fleet.boat_classes.type,
              confidence: 0.7,
              source: 'region',
              typical_fleet_size: fleet.member_count,
            });
          }
        }
      }

      return Array.from(classMap.values()).sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      logger.error('Error suggesting classes by region:', error);
      return [];
    }
  }

  /**
   * Suggest venues based on location or search
   */
  static async suggestVenues(query?: string, coordinates?: GPSCoordinates): Promise<VenueSuggestion[]> {
    try {
      if (coordinates) {
        // Find venues near coordinates
        const { data: venues, error } = await supabase
          .rpc('venues_within_radius', {
            lat: coordinates.lat,
            lng: coordinates.lng,
            radius_km: 50,
          })
          .limit(10);

        if (error) throw error;

        return (venues || []).map((venue: any) => ({
          id: venue.id,
          name: venue.name,
          city: venue.city,
          country: venue.country,
          latitude: venue.latitude,
          longitude: venue.longitude,
          confidence: venue.distance_km < 10 ? 0.9 : venue.distance_km < 25 ? 0.7 : 0.5,
          distance_km: venue.distance_km,
        }));
      } else if (query) {
        // Search venues by name
        const { data: venues, error } = await supabase
          .from('sailing_venues')
          .select('*')
          .ilike('name', `%${query}%`)
          .limit(10);

        if (error) throw error;

        return (venues || []).map((venue: any) => ({
          id: venue.id,
          name: venue.name,
          city: venue.city,
          country: venue.country,
          latitude: venue.latitude,
          longitude: venue.longitude,
          confidence: 0.8,
        }));
      }

      return [];
    } catch (error) {
      logger.error('Error suggesting venues:', error);
      return [];
    }
  }

  /**
   * Save scraped data to session
   */
  static async saveScrapedData(sessionId: string, scrapedData: any, sourceUrl: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('club_onboarding_sessions')
        .update({
          scraped_data: scrapedData,
          source_url: sourceUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;

      logger.debug('Saved scraped data to session', sessionId);
      return true;
    } catch (error) {
      logger.error('Error saving scraped data:', error);
      return false;
    }
  }

  /**
   * Add a suggestion to the session
   */
  static async addSuggestion(
    sessionId: string,
    fieldName: string,
    fieldCategory: SuggestedData['field_category'],
    suggestedValue: any,
    confidence: number,
    source: SuggestedData['source'],
    reasoning?: string
  ): Promise<SuggestedData | null> {
    try {
      const { data, error } = await supabase
        .from('club_suggested_data')
        .insert({
          session_id: sessionId,
          field_name: fieldName,
          field_category: fieldCategory,
          suggested_value: suggestedValue,
          confidence,
          source,
          reasoning,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      logger.error('Error adding suggestion:', error);
      return null;
    }
  }

  /**
   * Accept a suggestion
   */
  static async acceptSuggestion(suggestionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('club_suggested_data')
        .update({
          status: 'accepted',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', suggestionId);

      if (error) throw error;

      return true;
    } catch (error) {
      logger.error('Error accepting suggestion:', error);
      return false;
    }
  }

  /**
   * Reject a suggestion
   */
  static async rejectSuggestion(suggestionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('club_suggested_data')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', suggestionId);

      if (error) throw error;

      return true;
    } catch (error) {
      logger.error('Error rejecting suggestion:', error);
      return false;
    }
  }

  /**
   * Edit a suggestion
   */
  static async editSuggestion(suggestionId: string, editedValue: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('club_suggested_data')
        .update({
          status: 'edited',
          edited_value: editedValue,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', suggestionId);

      if (error) throw error;

      return true;
    } catch (error) {
      logger.error('Error editing suggestion:', error);
      return false;
    }
  }

  /**
   * Get all suggestions for a session
   */
  static async getSuggestions(sessionId: string): Promise<SuggestedData[]> {
    try {
      const { data, error } = await supabase
        .from('club_suggested_data')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting suggestions:', error);
      return [];
    }
  }

  /**
   * Complete onboarding session
   */
  static async completeSession(sessionId: string, clubId: string, confirmedData: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('club_onboarding_sessions')
        .update({
          club_id: clubId,
          confirmed_data: confirmedData,
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress_percentage: 100,
        })
        .eq('id', sessionId);

      if (error) throw error;

      logger.debug('Completed onboarding session', sessionId);
      return true;
    } catch (error) {
      logger.error('Error completing session:', error);
      return false;
    }
  }

  /**
   * Abandon session
   */
  static async abandonSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('club_onboarding_sessions')
        .update({
          status: 'abandoned',
        })
        .eq('id', sessionId);

      if (error) throw error;

      return true;
    } catch (error) {
      logger.error('Error abandoning session:', error);
      return false;
    }
  }
}

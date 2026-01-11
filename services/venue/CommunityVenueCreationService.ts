/**
 * CommunityVenueCreationService
 *
 * Enables organic discovery and community-driven creation of racing areas.
 * When sailors sail in undefined waters, they can name and define new areas.
 * Other sailors can confirm these areas, building community-validated knowledge.
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('CommunityVenueCreationService');

// ============================================================================
// TYPES
// ============================================================================

export type RacingAreaSource = 'official' | 'community' | 'imported';
export type VerificationStatus = 'pending' | 'verified' | 'disputed';
export type AreaType = 'racing_area' | 'practice_area' | 'start_line' | 'mark';

export interface VenueRacingArea {
  id: string;
  venue_id: string | null;
  area_name: string;
  description?: string;
  area_type: AreaType;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  source: RacingAreaSource;
  verification_status: VerificationStatus;
  confirmation_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Computed/joined fields
  user_has_confirmed?: boolean;
  distance_km?: number;
}

export interface RacingAreaConfirmation {
  id: string;
  racing_area_id: string;
  user_id: string;
  confirmed_at: string;
  latitude: number;
  longitude: number;
}

export interface CreateCommunityAreaParams {
  name: string;
  centerLat: number;
  centerLng: number;
  radiusMeters?: number;
  description?: string;
  areaType?: AreaType;
  venueId?: string | null;
}

export interface UnknownAreaDetection {
  latitude: number;
  longitude: number;
  nearestVenue?: {
    id: string;
    name: string;
    distanceKm: number;
  };
  nearestRacingArea?: {
    id: string;
    name: string;
    distanceKm: number;
    source: RacingAreaSource;
    verification_status: VerificationStatus;
  };
  suggestedVenueId?: string;
  shouldPromptCreation: boolean;
  pendingAreasNearby: VenueRacingArea[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CONFIRMATION_THRESHOLD = 3;
const DEFAULT_RADIUS_METERS = 2000;
const UNKNOWN_AREA_DETECTION_RADIUS_KM = 5; // If no area within 5km, prompt creation
const NEARBY_PENDING_AREAS_RADIUS_KM = 10;

// ============================================================================
// SERVICE
// ============================================================================

class CommunityVenueCreationServiceClass {
  /**
   * Detect if user is in an unknown (undefined) area
   * Returns info about nearest venues/areas and whether to prompt for creation
   */
  async detectUnknownArea(lat: number, lng: number): Promise<UnknownAreaDetection> {
    try {
      // Find nearby racing areas using the database function
      const { data: nearbyAreas, error: areasError } = await supabase
        .rpc('find_nearby_racing_areas', {
          lat,
          lng,
          radius_km: UNKNOWN_AREA_DETECTION_RADIUS_KM,
        });

      if (areasError) {
        logger.error('Error finding nearby areas:', areasError);
      }

      // Find nearest venue
      const { data: nearbyVenues, error: venuesError } = await supabase
        .from('sailing_venues')
        .select('id, name, coordinates_lat, coordinates_lng')
        .limit(5);

      if (venuesError) {
        logger.error('Error finding nearby venues:', venuesError);
      }

      // Calculate distances to venues
      const venuesWithDistance = (nearbyVenues || [])
        .map((venue) => {
          if (!venue.coordinates_lat || !venue.coordinates_lng) return null;
          const distance = this.calculateDistanceKm(
            lat,
            lng,
            venue.coordinates_lat,
            venue.coordinates_lng
          );
          return { ...venue, distanceKm: distance };
        })
        .filter(Boolean)
        .sort((a, b) => (a?.distanceKm || 999) - (b?.distanceKm || 999));

      const nearestVenue = venuesWithDistance[0];
      const nearestArea = nearbyAreas?.[0];

      // Get pending community areas nearby that user might want to confirm
      const pendingAreas = await this.getPendingAreasNearby(lat, lng, NEARBY_PENDING_AREAS_RADIUS_KM);

      // Determine if we should prompt for area creation
      const shouldPromptCreation =
        !nearestArea || nearestArea.distance_km > UNKNOWN_AREA_DETECTION_RADIUS_KM;

      return {
        latitude: lat,
        longitude: lng,
        nearestVenue: nearestVenue
          ? {
              id: nearestVenue.id,
              name: nearestVenue.name,
              distanceKm: nearestVenue.distanceKm,
            }
          : undefined,
        nearestRacingArea: nearestArea
          ? {
              id: nearestArea.id,
              name: nearestArea.area_name,
              distanceKm: nearestArea.distance_km,
              source: nearestArea.source as RacingAreaSource,
              verification_status: nearestArea.verification_status as VerificationStatus,
            }
          : undefined,
        suggestedVenueId: nearestVenue?.id,
        shouldPromptCreation,
        pendingAreasNearby: pendingAreas,
      };
    } catch (error) {
      logger.error('Error detecting unknown area:', error);
      return {
        latitude: lat,
        longitude: lng,
        shouldPromptCreation: false,
        pendingAreasNearby: [],
      };
    }
  }

  /**
   * Create a new community-defined racing area
   */
  async createCommunityArea(params: CreateCommunityAreaParams): Promise<VenueRacingArea> {
    const {
      name,
      centerLat,
      centerLng,
      radiusMeters = DEFAULT_RADIUS_METERS,
      description,
      areaType = 'racing_area',
      venueId,
    } = params;

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to create racing areas');
    }

    // Create GeoJSON geometry for compatibility with existing system
    const geometry = {
      type: 'Point',
      coordinates: [centerLng, centerLat],
    };

    const { data, error } = await supabase
      .from('venue_racing_areas')
      .insert({
        venue_id: venueId || null,
        area_name: name,
        description,
        area_type: areaType,
        geometry,
        center_lat: centerLat,
        center_lng: centerLng,
        radius_meters: radiusMeters,
        source: 'community',
        verification_status: 'pending',
        confirmation_count: 1, // Creator counts as first confirmation
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating community area:', error);
      throw new Error(`Failed to create racing area: ${error.message}`);
    }

    // Auto-confirm for the creator
    await this.confirmCommunityArea(data.id, centerLat, centerLng);

    logger.info('Created community racing area:', { id: data.id, area_name: name });
    return data as VenueRacingArea;
  }

  /**
   * Confirm an existing community racing area
   * User must be near the area to confirm
   */
  async confirmCommunityArea(areaId: string, lat: number, lng: number): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to confirm areas');
    }

    // Check if user has already confirmed
    const { data: existing } = await supabase
      .from('venue_racing_area_confirmations')
      .select('id')
      .eq('racing_area_id', areaId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      logger.debug('User has already confirmed this area');
      return;
    }

    const { error } = await supabase.from('venue_racing_area_confirmations').insert({
      racing_area_id: areaId,
      user_id: user.id,
      latitude: lat,
      longitude: lng,
    });

    if (error) {
      logger.error('Error confirming area:', error);
      throw new Error(`Failed to confirm area: ${error.message}`);
    }

    logger.info('Confirmed community racing area:', { areaId, userId: user.id });
  }

  /**
   * Remove a confirmation (unconfirm)
   */
  async unconfirmCommunityArea(areaId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated');
    }

    const { error } = await supabase
      .from('venue_racing_area_confirmations')
      .delete()
      .eq('racing_area_id', areaId)
      .eq('user_id', user.id);

    if (error) {
      logger.error('Error unconfirming area:', error);
      throw new Error(`Failed to unconfirm area: ${error.message}`);
    }
  }

  /**
   * Get pending community areas near a location
   */
  async getPendingAreasNearby(
    lat: number,
    lng: number,
    radiusKm: number = NEARBY_PENDING_AREAS_RADIUS_KM
  ): Promise<VenueRacingArea[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: areas, error } = await supabase.rpc('find_nearby_racing_areas', {
      lat,
      lng,
      radius_km: radiusKm,
    });

    if (error) {
      logger.error('Error finding pending areas:', error);
      return [];
    }

    // Filter to pending community areas and check user confirmation status
    const pendingAreas = (areas || []).filter(
      (area: { source: string; verification_status: string }) =>
        area.source === 'community' && area.verification_status === 'pending'
    );

    if (!user || pendingAreas.length === 0) {
      return pendingAreas as VenueRacingArea[];
    }

    // Check which areas user has confirmed
    const { data: confirmations } = await supabase
      .from('venue_racing_area_confirmations')
      .select('racing_area_id')
      .eq('user_id', user.id)
      .in(
        'racing_area_id',
        pendingAreas.map((a: { id: string }) => a.id)
      );

    const confirmedIds = new Set((confirmations || []).map((c) => c.racing_area_id));

    return pendingAreas.map((area: VenueRacingArea) => ({
      ...area,
      user_has_confirmed: confirmedIds.has(area.id),
    }));
  }

  /**
   * Get all racing areas for a venue (official + community)
   */
  async getRacingAreasForVenue(venueId: string): Promise<VenueRacingArea[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: areas, error } = await supabase
      .from('venue_racing_areas')
      .select('*')
      .eq('venue_id', venueId)
      .order('source', { ascending: true }) // Official first
      .order('area_name', { ascending: true });

    if (error) {
      logger.error('Error fetching racing areas:', error);
      return [];
    }

    if (!user || !areas || areas.length === 0) {
      return (areas || []) as VenueRacingArea[];
    }

    // Check user confirmation status for community areas
    const communityAreaIds = areas.filter((a) => a.source === 'community').map((a) => a.id);

    if (communityAreaIds.length === 0) {
      return areas as VenueRacingArea[];
    }

    const { data: confirmations } = await supabase
      .from('venue_racing_area_confirmations')
      .select('racing_area_id')
      .eq('user_id', user.id)
      .in('racing_area_id', communityAreaIds);

    const confirmedIds = new Set((confirmations || []).map((c) => c.racing_area_id));

    return areas.map((area) => ({
      ...area,
      user_has_confirmed: confirmedIds.has(area.id),
    })) as VenueRacingArea[];
  }

  /**
   * Get racing areas for map display (with center/radius for circles)
   */
  async getRacingAreasForMap(venueId?: string): Promise<{
    verified: VenueRacingArea[];
    pending: VenueRacingArea[];
  }> {
    let query = supabase
      .from('venue_racing_areas')
      .select('*')
      .not('center_lat', 'is', null)
      .not('center_lng', 'is', null);

    if (venueId) {
      query = query.eq('venue_id', venueId);
    }

    const { data: areas, error } = await query.order('area_name', { ascending: true });

    if (error) {
      logger.error('Error fetching areas for map:', error);
      return { verified: [], pending: [] };
    }

    const allAreas = (areas || []) as VenueRacingArea[];

    return {
      verified: allAreas.filter(
        (a) => a.verification_status === 'verified' || a.source === 'official'
      ),
      pending: allAreas.filter(
        (a) => a.source === 'community' && a.verification_status === 'pending'
      ),
    };
  }

  /**
   * Update a community area (only creator can update)
   */
  async updateCommunityArea(
    areaId: string,
    updates: Partial<Pick<VenueRacingArea, 'name' | 'description' | 'radius_meters'>>
  ): Promise<VenueRacingArea> {
    const { data, error } = await supabase
      .from('venue_racing_areas')
      .update(updates)
      .eq('id', areaId)
      .eq('source', 'community') // RLS will also check created_by
      .select()
      .single();

    if (error) {
      logger.error('Error updating community area:', error);
      throw new Error(`Failed to update area: ${error.message}`);
    }

    return data as VenueRacingArea;
  }

  /**
   * Delete a community area (only creator can delete, only if pending)
   */
  async deleteCommunityArea(areaId: string): Promise<void> {
    const { error } = await supabase
      .from('venue_racing_areas')
      .delete()
      .eq('id', areaId)
      .eq('source', 'community')
      .eq('verification_status', 'pending'); // Can only delete pending areas

    if (error) {
      logger.error('Error deleting community area:', error);
      throw new Error(`Failed to delete area: ${error.message}`);
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Check if a point is within a racing area
   */
  isPointInArea(lat: number, lng: number, area: VenueRacingArea): boolean {
    if (!area.center_lat || !area.center_lng || !area.radius_meters) {
      return false;
    }
    const distanceKm = this.calculateDistanceKm(lat, lng, area.center_lat, area.center_lng);
    return distanceKm * 1000 <= area.radius_meters;
  }
}

// Export singleton instance
export const CommunityVenueCreationService = new CommunityVenueCreationServiceClass();

// Export class for testing
export { CommunityVenueCreationServiceClass };

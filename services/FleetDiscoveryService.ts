/**
 * Fleet Discovery Service
 * Auto-suggest fleets based on location and boat class
 * Called by OnboardingAgent tools
 */

import { supabase } from './supabase';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUuid = (value?: string) => !!value && UUID_REGEX.test(value);

export interface Fleet {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  class_id?: string;
  club_id?: string;
  region?: string;
  whatsapp_link?: string;
  visibility: 'public' | 'private' | 'club';
  metadata?: any;
  boat_classes?: {
    id: string;
    name: string;
    type?: string;
  };
  yacht_clubs?: {
    id: string;
    name: string;
    venue_id?: string;
  };
  member_count?: number;
}

export interface FleetMembership {
  id: string;
  fleet_id: string;
  user_id: string;
  role: 'member' | 'owner' | 'captain' | 'coach' | 'support';
  status: 'active' | 'pending' | 'invited' | 'inactive';
  joined_at: string;
  notify_fleet_on_join?: boolean;
}

export class FleetDiscoveryService {
  /**
   * Discover fleets by venue and boat class
   */
  static async discoverFleets(
    venueId?: string,
    classId?: string,
    limit: number = 10
  ): Promise<Fleet[]> {
    try {
      let query = supabase
        .from('fleets')
        .select(`
          *,
          boat_classes!inner(id, name)
        `)
        .in('visibility', ['public', 'club'])
        .order('created_at', { ascending: false })
        .limit(limit);

      // Filter by boat class if provided
      if (classId) {
        query = query.eq('class_id', classId);
      }

      // Filter by region if provided
      if (venueId) {
        // Note: We filter by region since there's no direct venue relationship
        // This is a simplified approach - you may want to add a venue_id column to fleets
      }

      const { data: fleets, error } = await query;

      if (error) throw error;

      // Get member counts for each fleet
      const fleetsWithCounts = await Promise.all(
        (fleets || []).map(async (fleet: any) => {
          const { count } = await supabase
            .from('fleet_members')
            .select('*', { count: 'exact', head: true })
            .eq('fleet_id', fleet.id)
            .eq('status', 'active');

          return {
            ...fleet,
            member_count: count || 0,
          };
        })
      );

      // Sort by member count (popularity)
      return fleetsWithCounts.sort((a, b) => (b.member_count || 0) - (a.member_count || 0));
    } catch (error) {
      console.error('Error discovering fleets:', error);
      return [];
    }
  }

  /**
   * Get suggested fleets for a sailor based on their profile
   */
  static async getSuggestedFleets(sailorId: string): Promise<Fleet[]> {
    try {
      // Get sailor's locations and boat classes
      const [locationsResult, boatsResult] = await Promise.all([
        supabase
          .from('sailor_locations')
          .select('location_id')
        .eq('sailor_id', sailorId)
          .eq('is_active', true),
        supabase
          .from('sailor_boats')
          .select('class_id')
          .eq('sailor_id', sailorId)
          .in('status', ['active', 'racing']),
      ]);

      const venueIds = locationsResult.data?.map((l: any) => l.location_id) || [];
      const classIds = boatsResult.data?.map((b: any) => b.class_id) || [];

      if (classIds.length === 0) {
        return [];
      }

      // Find fleets matching sailor's boats
      const { data: fleets, error } = await supabase
        .from('fleets')
        .select(`
          *,
          boat_classes!inner(id, name)
        `)
        .in('class_id', classIds)
        .in('visibility', ['public', 'club'])
        .limit(20);

      if (error) throw error;

      // Filter by region if sailor has locations
      let filteredFleets = fleets || [];
      // Note: Region-based filtering could be added here if needed

      // Get member counts and sort by popularity
      const fleetsWithCounts = await Promise.all(
        filteredFleets.map(async (fleet: any) => {
          const { count } = await supabase
            .from('fleet_members')
            .select('*', { count: 'exact', head: true })
            .eq('fleet_id', fleet.id)
            .eq('status', 'active');

          return {
            ...fleet,
            member_count: count || 0,
          };
        })
      );

      return fleetsWithCounts
        .sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
        .slice(0, 10);
    } catch (error) {
      console.error('Error getting suggested fleets:', error);
      return [];
    }
  }

  /**
   * Join a fleet
   */
  static async joinFleet(
    sailorId: string,
    fleetId: string,
    notifyFleet: boolean = false
  ): Promise<FleetMembership | null> {
    if (!isUuid(fleetId)) {
      console.warn('Skipping joinFleet for non-UUID fleet id', { fleetId });
      return null;
    }

    try {
      const { data: membership, error } = await supabase
        .from('fleet_members')
        .insert({
          fleet_id: fleetId,
          user_id: sailorId,
          role: 'member',
          status: 'active',
          notify_fleet_on_join: notifyFleet,
        })
        .select()
        .single();

      if (error) throw error;

      return membership;
    } catch (error) {
      console.error('Error joining fleet:', error);
      return null;
    }
  }

  /**
   * Leave a fleet
   */
  static async leaveFleet(sailorId: string, fleetId: string): Promise<boolean> {
    if (!isUuid(fleetId)) {
      console.warn('Skipping leaveFleet for non-UUID fleet id', { fleetId });
      return false;
    }

    try {
      const { error } = await supabase
        .from('fleet_members')
        .delete()
        .eq('fleet_id', fleetId)
        .eq('user_id', sailorId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error leaving fleet:', error);
      return false;
    }
  }

  /**
   * Get sailor's fleet memberships
   */
  static async getSailorFleets(sailorId: string): Promise<Fleet[]> {
    try {
      const { data: memberships, error } = await supabase
        .from('fleet_members')
        .select(`
          fleet_id,
          fleets(
            *,
            boat_classes(id, name)
          )
        `)
        .eq('user_id', sailorId)
        .eq('status', 'active');

      if (error) throw error;

      return memberships?.map((m: any) => m.fleets).filter(Boolean) || [];
    } catch (error) {
      console.error('Error getting sailor fleets:', error);
      return [];
    }
  }

  /**
   * Search fleets by name, region, or boat class
   */
  static async searchFleets(query: string, limit: number = 10): Promise<Fleet[]> {
    try {
      const { data: fleets, error } = await supabase
        .from('fleets')
        .select(`
          *,
          boat_classes(id, name)
        `)
        .or(`name.ilike.%${query}%,region.ilike.%${query}%,description.ilike.%${query}%`)
        .in('visibility', ['public', 'club'])
        .order('name', { ascending: true })
        .limit(limit);

      if (error) throw error;

      // Get member counts for each fleet
      const fleetsWithCounts = await Promise.all(
        (fleets || []).map(async (fleet: any) => {
          const { count } = await supabase
            .from('fleet_members')
            .select('*', { count: 'exact', head: true })
            .eq('fleet_id', fleet.id)
            .eq('status', 'active');

          return {
            ...fleet,
            member_count: count || 0,
          };
        })
      );

      return fleetsWithCounts;
    } catch (error) {
      console.error('Error searching fleets:', error);
      return [];
    }
  }

  /**
   * Create a new fleet
   */
  static async createFleet(
    creatorId: string,
    fleet: {
      name: string;
      description?: string;
      class_id?: string;
      club_id?: string;
      region?: string;
      whatsapp_link?: string;
      visibility?: 'public' | 'private' | 'club';
    }
  ): Promise<Fleet | null> {
    try {
      // Create fleet
      const { data: newFleet, error: fleetError } = await supabase
        .from('fleets')
        .insert({
          ...fleet,
          created_by: creatorId,
          visibility: fleet.visibility || 'public',
        })
        .select()
        .single();

      if (fleetError) throw fleetError;

      // Add creator as owner
      await supabase.from('fleet_members').insert({
        fleet_id: newFleet.id,
        user_id: creatorId,
        role: 'owner',
        status: 'active',
      });

      return newFleet;
    } catch (error) {
      console.error('Error creating fleet:', error);
      return null;
    }
  }

  /**
   * Check if user is a member of a fleet
   */
  static async isMember(sailorId: string, fleetId: string): Promise<boolean> {
    if (!isUuid(fleetId)) {
      console.warn('Skipping isMember check for non-UUID fleet id', { fleetId });
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('fleet_members')
        .select('id')
        .eq('fleet_id', fleetId)
        .eq('user_id', sailorId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking fleet membership:', error);
      return false;
    }
  }

  /**
   * Discover fleets by club
   */
  static async discoverFleetsByClub(clubId: string, limit: number = 20): Promise<Fleet[]> {
    try {
      const { data: fleets, error } = await supabase
        .from('fleets')
        .select(`
          *,
          boat_classes(id, name, type)
        `)
        .eq('club_id', clubId)
        .in('visibility', ['public', 'club'])
        .limit(limit);

      if (error) throw error;

      // Get member counts for each fleet
      const fleetsWithCounts = await Promise.all(
        (fleets || []).map(async (fleet: any) => {
          const { count } = await supabase
            .from('fleet_members')
            .select('*', { count: 'exact', head: true })
            .eq('fleet_id', fleet.id)
            .eq('status', 'active');

          return {
            ...fleet,
            member_count: count || 0,
          };
        })
      );

      // Sort by member count (popularity)
      return fleetsWithCounts.sort((a, b) => (b.member_count || 0) - (a.member_count || 0));
    } catch (error) {
      console.error('Error discovering fleets by club:', error);
      return [];
    }
  }

  /**
   * Discover fleets by venue
   */
  static async discoverFleetsByVenue(venueId: string, limit: number = 20): Promise<Fleet[]> {
    try {
      // Get clubs at this venue
      const { data: clubs, error: clubsError } = await supabase
        .from('yacht_clubs')
        .select('id')
        .eq('venue_id', venueId);

      if (clubsError) throw clubsError;

      const clubIds = (clubs || []).map((c: any) => c.id);

      if (clubIds.length === 0) {
        return [];
      }

      // Get fleets for these clubs
      const { data: fleets, error } = await supabase
        .from('fleets')
        .select(`
          *,
          boat_classes(id, name, type)
        `)
        .in('club_id', clubIds)
        .in('visibility', ['public', 'club'])
        .limit(limit);

      if (error) throw error;

      // Get member counts for each fleet
      const fleetsWithCounts = await Promise.all(
        (fleets || []).map(async (fleet: any) => {
          const { count } = await supabase
            .from('fleet_members')
            .select('*', { count: 'exact', head: true })
            .eq('fleet_id', fleet.id)
            .eq('status', 'active');

          return {
            ...fleet,
            member_count: count || 0,
          };
        })
      );

      // Sort by member count (popularity)
      return fleetsWithCounts.sort((a, b) => (b.member_count || 0) - (a.member_count || 0));
    } catch (error) {
      console.error('Error discovering fleets by venue:', error);
      return [];
    }
  }
}

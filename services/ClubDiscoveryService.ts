/**
 * Club Discovery Service
 * Auto-suggest yacht clubs and class associations
 * Called by OnboardingAgent tools
 */

import { supabase } from './supabase';

export interface YachtClub {
  id: string;
  name: string;
  venue_id?: string;
  website?: string;
  contact_email?: string;
  metadata?: any;
  sailing_venues?: {
    id: string;
    name: string;
    city?: string;
    country?: string;
  };
}

export interface ClassAssociation {
  id: string;
  name: string;
  class_id?: string;
  website?: string;
  racing_rules_url?: string;
  region?: string;
  boat_classes?: {
    id: string;
    name: string;
    type?: string;
  };
}

export interface SailorClubMembership {
  id: string;
  sailor_id: string;
  club_id?: string;
  association_id?: string;
  club_type: 'yacht_club' | 'class_association';
  auto_import_races: boolean;
  created_at: string;
  yacht_clubs?: YachtClub;
  class_associations?: ClassAssociation;
}

export class ClubDiscoveryService {
  /**
   * Discover yacht clubs by venue
   */
  static async discoverClubsByVenue(venueId: string, limit: number = 10): Promise<YachtClub[]> {
    try {
      const { data: clubs, error } = await supabase
        .from('yacht_clubs')
        .select(`
          *,
          sailing_venues(id, name)
        `)
        .eq('venue_id', venueId)
        .limit(limit);

      if (error) throw error;

      return clubs || [];
    } catch (error) {
      console.error('Error discovering clubs by venue:', error);
      return [];
    }
  }

  /**
   * Discover clubs by fleet (get the club that hosts the fleet)
   */
  static async discoverClubsByFleet(fleetId: string): Promise<YachtClub[]> {
    try {
      const { data: fleet, error: fleetError } = await supabase
        .from('fleets')
        .select('club_id')
        .eq('id', fleetId)
        .single();

      if (fleetError || !fleet?.club_id) return [];

      const { data: club, error: clubError } = await supabase
        .from('yacht_clubs')
        .select(`
          *,
          sailing_venues(id, name)
        `)
        .eq('id', fleet.club_id)
        .single();

      if (clubError) throw clubError;

      return club ? [club] : [];
    } catch (error) {
      console.error('Error discovering clubs by fleet:', error);
      return [];
    }
  }

  /**
   * Discover class associations by boat class
   */
  static async discoverAssociationsByClass(classId: string): Promise<ClassAssociation[]> {
    try {
      const { data: associations, error } = await supabase
        .from('class_associations')
        .select(`
          *,
          boat_classes(id, name, type)
        `)
        .eq('class_id', classId);

      if (error) throw error;

      return associations || [];
    } catch (error) {
      console.error('Error discovering associations by class:', error);
      return [];
    }
  }

  /**
   * Get suggested clubs and associations for a sailor
   */
  static async getSuggestedClubs(sailorId: string): Promise<{
    clubs: YachtClub[];
    associations: ClassAssociation[];
  }> {
    try {
      // Get sailor's locations and boats
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

      // Get clubs from venues
      let clubs: YachtClub[] = [];
      if (venueIds.length > 0) {
        const { data: venueClubs } = await supabase
          .from('yacht_clubs')
          .select(`
            *,
            sailing_venues(id, name, city, country)
          `)
          .in('venue_id', venueIds);

        clubs = venueClubs || [];
      }

      // Get class associations from boat classes
      let associations: ClassAssociation[] = [];
      if (classIds.length > 0) {
        const { data: classAssociations } = await supabase
          .from('class_associations')
          .select(`
            *,
            boat_classes(id, name, type)
          `)
          .in('class_id', classIds);

        associations = classAssociations || [];
      }

      return { clubs, associations };
    } catch (error) {
      console.error('Error getting suggested clubs:', error);
      return { clubs: [], associations: [] };
    }
  }

  /**
   * Add a yacht club membership for sailor
   */
  static async addYachtClubMembership(
    sailorId: string,
    clubId: string,
    autoImportRaces: boolean = true
  ): Promise<SailorClubMembership | null> {
    try {
      const { data: membership, error } = await supabase
        .from('sailor_clubs')
        .insert({
          sailor_id: sailorId,
          club_id: clubId,
          club_type: 'yacht_club',
          auto_import_races: autoImportRaces,
        })
        .select(`
          *,
          yacht_clubs(
            *,
            sailing_venues(id, name, city, country)
          )
        `)
        .single();

      if (error) throw error;

      return membership;
    } catch (error) {
      console.error('Error adding yacht club membership:', error);
      return null;
    }
  }

  /**
   * Add a class association membership for sailor
   */
  static async addClassAssociationMembership(
    sailorId: string,
    associationId: string,
    autoImportRaces: boolean = true
  ): Promise<SailorClubMembership | null> {
    try {
      const { data: membership, error } = await supabase
        .from('sailor_clubs')
        .insert({
          sailor_id: sailorId,
          association_id: associationId,
          club_type: 'class_association',
          auto_import_races: autoImportRaces,
        })
        .select(`
          *,
          class_associations(
            *,
            boat_classes(id, name, type)
          )
        `)
        .single();

      if (error) throw error;

      return membership;
    } catch (error) {
      console.error('Error adding class association membership:', error);
      return null;
    }
  }

  /**
   * Remove a club membership
   */
  static async removeClubMembership(sailorId: string, membershipId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sailor_clubs')
        .delete()
        .eq('id', membershipId)
        .eq('sailor_id', sailorId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error removing club membership:', error);
      return false;
    }
  }

  /**
   * Get all club memberships for a sailor
   */
  static async getSailorClubs(sailorId: string): Promise<SailorClubMembership[]> {
    try {
      const { data: memberships, error } = await supabase
        .from('sailor_clubs')
        .select(`
          *,
          yacht_clubs(
            *,
            sailing_venues(id, name, city, country)
          ),
          class_associations(
            *,
            boat_classes(id, name, type)
          )
        `)
        .eq('sailor_id', sailorId);

      if (error) throw error;

      return memberships || [];
    } catch (error) {
      console.error('Error getting sailor clubs:', error);
      return [];
    }
  }

  /**
   * Search yacht clubs by name
   */
  static async searchYachtClubs(query: string, limit: number = 10): Promise<YachtClub[]> {
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

      return clubs || [];
    } catch (error) {
      console.error('Error searching yacht clubs:', error);
      return [];
    }
  }

  /**
   * Search class associations by name
   */
  static async searchClassAssociations(query: string, limit: number = 10): Promise<ClassAssociation[]> {
    try {
      const { data: associations, error } = await supabase
        .from('class_associations')
        .select(`
          *,
          boat_classes(id, name, type)
        `)
        .ilike('name', `%${query}%`)
        .limit(limit);

      if (error) throw error;

      return associations || [];
    } catch (error) {
      console.error('Error searching class associations:', error);
      return [];
    }
  }

  /**
   * Check if sailor is member of a yacht club
   */
  static async isYachtClubMember(sailorId: string, clubId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('sailor_clubs')
        .select('id')
        .eq('sailor_id', sailorId)
        .eq('club_id', clubId)
        .eq('club_type', 'yacht_club')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking yacht club membership:', error);
      return false;
    }
  }

  /**
   * Check if sailor is member of a class association
   */
  static async isAssociationMember(sailorId: string, associationId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('sailor_clubs')
        .select('id')
        .eq('sailor_id', sailorId)
        .eq('association_id', associationId)
        .eq('club_type', 'class_association')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking class association membership:', error);
      return false;
    }
  }

  /**
   * Toggle auto-import races for a club membership
   */
  static async toggleAutoImportRaces(
    sailorId: string,
    membershipId: string,
    autoImport: boolean
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sailor_clubs')
        .update({ auto_import_races: autoImport })
        .eq('id', membershipId)
        .eq('sailor_id', sailorId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error toggling auto-import races:', error);
      return false;
    }
  }
}

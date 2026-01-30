/**
 * CatalogRaceService
 *
 * Service for browsing, searching, and following public catalog races.
 * Follows the singleton pattern used by CommunityFeedService.
 */

import { supabase } from '@/services/supabase';
import type { CatalogRace } from '@/types/catalog-race';

interface GetAllRacesOptions {
  limit?: number;
  offset?: number;
  country?: string;
  raceType?: string;
  level?: string;
}

class CatalogRaceServiceClass {
  // ============================================================================
  // BROWSE
  // ============================================================================

  /**
   * Get all catalog races with optional filters
   */
  async getAllRaces(options: GetAllRacesOptions = {}): Promise<CatalogRace[]> {
    const { limit = 100, offset = 0, country, raceType, level } = options;

    let query = supabase
      .from('catalog_races')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('follower_count', { ascending: false })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (country) {
      query = query.eq('country', country);
    }
    if (raceType) {
      query = query.eq('race_type', raceType);
    }
    if (level) {
      query = query.eq('level', level);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[CatalogRaceService] Error fetching races:', error);
      throw error;
    }

    return (data || []) as CatalogRace[];
  }

  // ============================================================================
  // SEARCH
  // ============================================================================

  /**
   * Search catalog races by name, short_name, organizing_authority, or country
   */
  async searchRaces(query: string): Promise<CatalogRace[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const { data, error } = await supabase
      .from('catalog_races')
      .select('*')
      .or(
        `name.ilike.%${q}%,short_name.ilike.%${q}%,organizing_authority.ilike.%${q}%,country.ilike.%${q}%`
      )
      .order('follower_count', { ascending: false })
      .limit(30);

    if (error) {
      console.error('[CatalogRaceService] Error searching races:', error);
      throw error;
    }

    return (data || []) as CatalogRace[];
  }

  // ============================================================================
  // SINGLE ITEM
  // ============================================================================

  /**
   * Get a single race by slug
   */
  async getRaceBySlug(slug: string): Promise<CatalogRace | null> {
    const { data, error } = await supabase
      .from('catalog_races')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('[CatalogRaceService] Error fetching race by slug:', error);
      return null;
    }

    return data as CatalogRace;
  }

  /**
   * Get a single race by ID
   */
  async getRaceById(id: string): Promise<CatalogRace | null> {
    const { data, error } = await supabase
      .from('catalog_races')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[CatalogRaceService] Error fetching race by id:', error);
      return null;
    }

    return data as CatalogRace;
  }

  // ============================================================================
  // FEATURED / VENUE
  // ============================================================================

  /**
   * Get featured catalog races
   */
  async getFeaturedRaces(): Promise<CatalogRace[]> {
    const { data, error } = await supabase
      .from('catalog_races')
      .select('*')
      .eq('is_featured', true)
      .order('follower_count', { ascending: false });

    if (error) {
      console.error('[CatalogRaceService] Error fetching featured races:', error);
      return [];
    }

    return (data || []) as CatalogRace[];
  }

  /**
   * Get races associated with a specific venue
   */
  async getRacesByVenue(venueId: string): Promise<CatalogRace[]> {
    const { data, error } = await supabase
      .from('catalog_races')
      .select('*')
      .eq('venue_id', venueId)
      .order('name', { ascending: true });

    if (error) {
      console.error('[CatalogRaceService] Error fetching races by venue:', error);
      return [];
    }

    return (data || []) as CatalogRace[];
  }

  // ============================================================================
  // FOLLOW / UNFOLLOW
  // ============================================================================

  /**
   * Follow a catalog race
   */
  async followRace(raceId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to follow a race');

    const { error } = await supabase
      .from('saved_catalog_races')
      .upsert(
        { user_id: user.id, catalog_race_id: raceId },
        { onConflict: 'user_id,catalog_race_id' }
      );

    if (error) {
      console.error('[CatalogRaceService] Error following race:', error);
      throw error;
    }
  }

  /**
   * Unfollow a catalog race
   */
  async unfollowRace(raceId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Must be logged in to unfollow a race');

    const { error } = await supabase
      .from('saved_catalog_races')
      .delete()
      .eq('user_id', user.id)
      .eq('catalog_race_id', raceId);

    if (error) {
      console.error('[CatalogRaceService] Error unfollowing race:', error);
      throw error;
    }
  }

  /**
   * Get IDs of races the current user follows
   */
  async getFollowedRaceIds(): Promise<Set<string>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Set();

    const { data, error } = await supabase
      .from('saved_catalog_races')
      .select('catalog_race_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('[CatalogRaceService] Error fetching followed races:', error);
      return new Set();
    }

    return new Set((data || []).map(r => r.catalog_race_id));
  }

  // ============================================================================
  // USER MATCHING
  // ============================================================================

  /**
   * Get catalog races that match a user's boat classes and/or region.
   * Used by RaceSuggestionService for catalog_match suggestions.
   */
  async getMatchesForUser(
    boatClasses: string[],
    region?: string
  ): Promise<CatalogRace[]> {
    const now = new Date();
    const sixMonthsFromNow = new Date(now);
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    const currentMonth = now.getMonth() + 1; // 1-based
    const threeMonthsLater = currentMonth + 3;

    // Fetch candidate catalog races (broad query, filter client-side)
    const { data, error } = await supabase
      .from('catalog_races')
      .select('*')
      .order('follower_count', { ascending: false })
      .limit(100);

    if (error || !data) {
      console.error('[CatalogRaceService] Error fetching matches:', error);
      return [];
    }

    return data.filter((race) => {
      // Check boat class overlap
      const classOverlap = boatClasses.length > 0 && race.boat_classes?.some(
        (bc: string) => boatClasses.some(
          (uc) => uc.toLowerCase() === bc.toLowerCase()
        )
      );

      // Check country/region match
      const regionMatch = region && race.country?.toLowerCase() === region.toLowerCase();

      // Check if upcoming
      const monthMatch = race.typical_month != null &&
        race.typical_month >= currentMonth &&
        race.typical_month <= threeMonthsLater;

      const dateMatch = race.next_edition_date &&
        new Date(race.next_edition_date) >= now &&
        new Date(race.next_edition_date) <= sixMonthsFromNow;

      const isUpcoming = monthMatch || dateMatch;

      return classOverlap || (regionMatch && isUpcoming);
    }) as CatalogRace[];
  }

  // ============================================================================
  // DISCUSSION COUNTS
  // ============================================================================

  /**
   * Get discussion counts for a batch of race IDs
   */
  async getDiscussionCounts(raceIds: string[]): Promise<Map<string, number>> {
    if (raceIds.length === 0) return new Map();

    const { data, error } = await supabase
      .from('catalog_races')
      .select('id, discussion_count')
      .in('id', raceIds);

    if (error) {
      console.error('[CatalogRaceService] Error fetching discussion counts:', error);
      return new Map();
    }

    return new Map((data || []).map(r => [r.id, r.discussion_count]));
  }
}

export const CatalogRaceService = new CatalogRaceServiceClass();

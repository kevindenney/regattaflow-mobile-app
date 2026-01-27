/**
 * GlobalSearchService
 *
 * Runs parallel ilike queries against regattas, profiles, sailing_venues,
 * and boat_classes. Returns categorised results for the search overlay.
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('GlobalSearchService');

// ── Result types ──────────────────────────────────────────────────────

export interface RaceSearchResult {
  id: string;
  title: string;
  subtitle?: string;
  raceDate?: string;
  status?: string;
}

export interface SailorSearchResult {
  id: string;
  title: string;
  subtitle?: string;
  avatarEmoji?: string;
  avatarColor?: string;
}

export interface VenueSearchResult {
  id: string;
  title: string;
  subtitle?: string;
  venueType?: string;
}

export interface BoatClassSearchResult {
  id: string;
  title: string;
}

export interface SearchResults {
  races: RaceSearchResult[];
  sailors: SailorSearchResult[];
  venues: VenueSearchResult[];
  boatClasses: BoatClassSearchResult[];
}

const EMPTY_RESULTS: SearchResults = {
  races: [],
  sailors: [],
  venues: [],
  boatClasses: [],
};

// ── Service ───────────────────────────────────────────────────────────

export class GlobalSearchService {
  static async search(query: string, userId: string): Promise<SearchResults> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return EMPTY_RESULTS;

    const pattern = `%${trimmed}%`;

    const [racesResult, profilesResult, venuesResult, boatClassesResult] =
      await Promise.allSettled([
        // Races (regattas table) – scoped to current user
        supabase
          .from('regattas')
          .select('id, name, start_date, status, metadata')
          .eq('created_by', userId)
          .ilike('name', pattern)
          .order('start_date', { ascending: false })
          .limit(5),

        // Profiles – all users
        supabase
          .from('profiles')
          .select('id, full_name, email')
          .ilike('full_name', pattern)
          .limit(5),

        // Venues – name, country, or region
        supabase
          .from('sailing_venues')
          .select('id, name, country, region, venue_type')
          .or(
            `name.ilike.${pattern},country.ilike.${pattern},region.ilike.${pattern}`,
          )
          .limit(5),

        // Boat classes
        supabase
          .from('boat_classes')
          .select('id, name')
          .ilike('name', pattern)
          .limit(5),
      ]);

    // ── Races (from regattas) ───────────────────────────────────────
    const races: RaceSearchResult[] = [];
    if (racesResult.status === 'fulfilled') {
      const { data, error } = racesResult.value;
      if (error) logger.warn('Race search error:', error.message);
      (data ?? []).forEach((r: any) => {
        const venueName =
          r.metadata?.venue_name ?? r.metadata?.venue ?? undefined;
        races.push({
          id: r.id,
          title: r.name,
          subtitle: venueName,
          raceDate: r.start_date ?? undefined,
          status: r.status ?? undefined,
        });
      });
    }

    // ── Profiles → Sailors ──────────────────────────────────────────
    const sailors: SailorSearchResult[] = [];
    if (profilesResult.status === 'fulfilled') {
      const { data: profiles, error } = profilesResult.value;
      if (error) logger.warn('Profile search error:', error.message);

      if (profiles && profiles.length > 0) {
        const userIds = profiles.map((p: any) => p.id);
        const { data: sailorProfiles } = await supabase
          .from('sailor_profiles')
          .select('user_id, avatar_emoji, avatar_color')
          .in('user_id', userIds);

        const spMap: Record<string, { avatar_emoji?: string; avatar_color?: string }> = {};
        (sailorProfiles ?? []).forEach((sp: any) => {
          spMap[sp.user_id] = sp;
        });

        profiles.forEach((p: any) => {
          const sp = spMap[p.id];
          sailors.push({
            id: p.id,
            title: p.full_name,
            subtitle: p.email ?? undefined,
            avatarEmoji: sp?.avatar_emoji ?? undefined,
            avatarColor: sp?.avatar_color ?? undefined,
          });
        });
      }
    }

    // ── Venues ──────────────────────────────────────────────────────
    const venues: VenueSearchResult[] = [];
    if (venuesResult.status === 'fulfilled') {
      const { data, error } = venuesResult.value;
      if (error) logger.warn('Venue search error:', error.message);
      (data ?? []).forEach((v: any) => {
        const parts = [v.region, v.country].filter(Boolean);
        venues.push({
          id: v.id,
          title: v.name,
          subtitle: parts.length > 0 ? parts.join(', ') : undefined,
          venueType: v.venue_type ?? undefined,
        });
      });
    }

    // ── Boat classes ────────────────────────────────────────────────
    const boatClasses: BoatClassSearchResult[] = [];
    if (boatClassesResult.status === 'fulfilled') {
      const { data, error } = boatClassesResult.value;
      if (error) logger.warn('Boat class search error:', error.message);
      (data ?? []).forEach((bc: any) =>
        boatClasses.push({ id: bc.id, title: bc.name }),
      );
    }

    return { races, sailors, venues, boatClasses };
  }
}

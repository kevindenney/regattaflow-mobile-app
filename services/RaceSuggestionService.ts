/**
 * Race Suggestion Service
 * Provides intelligent race recommendations based on user's clubs, fleets, and racing history
 */

import { supabase } from './supabase';
import { fleetService } from './fleetService';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('RaceSuggestionService');
const stringifyPatternData = (value: Record<string, unknown> | null | undefined) =>
  JSON.stringify(value ?? {});

// =====================================================
// Types
// =====================================================

export type RaceSuggestionType =
  | 'club_event'
  | 'fleet_race'
  | 'pattern_match'
  | 'template'
  | 'similar_sailor'
  | 'community_race'
  | 'catalog_match'
  | 'previous_year';

export interface RaceSuggestion {
  id: string;
  type: RaceSuggestionType;
  confidenceScore: number;
  raceData: {
    raceName: string;
    venue?: string;
    venueCoordinates?: { lat: number; lng: number };
    startDate?: string;
    endDate?: string;
    boatClass?: string;
    raceSeries?: string;
    description?: string;
    registrationUrl?: string;
    documentUrls?: {
      nor?: string;
      si?: string;
    };
    raceType?: string;
    location?: string;
    time?: string;
    vhfChannel?: string;
    totalDistanceNm?: number;
    timeLimitHours?: number;
    routeDescription?: string;
    courseType?: string;
  };
  reason: string;
  source?: {
    id: string;
    name: string;
    type: 'club' | 'fleet' | 'pattern' | 'community' | 'catalog';
  };
  canAddDirectly: boolean;
  catalogRaceId?: string;
  updateGuidance?: {
    fieldsToReview: string[];
    message: string;
  };
}

export interface CategorizedSuggestions {
  clubRaces: RaceSuggestion[];
  fleetRaces: RaceSuggestion[];
  communityRaces: RaceSuggestion[];
  catalogMatches: RaceSuggestion[];
  previousYearRaces: RaceSuggestion[];
  patterns: RaceSuggestion[];
  templates: RaceSuggestion[];
  total: number;
}

export interface RacePattern {
  id: string;
  type: 'seasonal' | 'recurring_series' | 'venue_preference' | 'class_preference' | 'temporal_annual';
  confidence: number;
  data: Record<string, any>;
  occurrenceCount: number;
  acceptanceRate: number;
}

export interface RaceTemplate {
  id: string;
  name: string;
  raceNamePattern?: string;
  venueName?: string;
  venueCoordinates?: { lat: number; lng: number };
  boatClass?: string;
  raceSeries?: string;
  typicalMonth?: number;
  usageCount: number;
  templateData: Record<string, any>;
}

// =====================================================
// Main Service Class
// =====================================================

class RaceSuggestionService {
  /**
   * Get all categorized suggestions for a user
   */
  async getSuggestionsForUser(userId: string): Promise<CategorizedSuggestions> {
    try {
      logger.debug('[getSuggestionsForUser] Fetching suggestions for user:', userId);

      // Check cache first
      const cached = await this.getCachedSuggestions(userId);

      if (cached.total > 0) {
        logger.debug('[getSuggestionsForUser] Returning cached suggestions:', cached.total);
        return cached;
      }

      // Generate fresh suggestions
      logger.debug('[getSuggestionsForUser] No valid cache, generating fresh suggestions');
      const suggestions = await this.generateFreshSuggestions(userId);

      // Cache the results
      const cacheSuccess = await this.cacheSuggestions(userId, suggestions);
      if (!cacheSuccess) {
        logger.debug('[RaceSuggestionService] Unable to cache suggestions');
      }

      return suggestions;
    } catch (error) {
      logger.debug('[getSuggestionsForUser] Error fetching suggestions (non-blocking):', {
        name: (error as Error).name,
        message: (error as Error).message,
      });
      // Return empty suggestions on error
      return this.emptySuggestions();
    }
  }

  /**
   * Get cached suggestions if they exist and are not expired
   */
  private async getCachedSuggestions(userId: string): Promise<CategorizedSuggestions> {
    const { data, error } = await supabase
      .from('race_suggestions_cache')
      .select('*')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .is('dismissed_at', null)
      .is('accepted_at', null)
      .order('confidence_score', { ascending: false });

    if (error) {
      logger.debug('[getCachedSuggestions] Error fetching cached suggestions (non-blocking):', error);
      return this.emptySuggestions();
    }

    if (!data || data.length === 0) {
      return this.emptySuggestions();
    }

    // Categorize suggestions
    return this.categorizeSuggestions(data.map(this.mapCachedSuggestion));
  }

  /**
   * Generate fresh suggestions from all sources
   */
  private async generateFreshSuggestions(userId: string): Promise<CategorizedSuggestions> {
    const [clubRaces, fleetRaces, communityRaces, catalogMatches, previousYearRaces, patterns, templates] = await Promise.all([
      this.getClubUpcomingRaces(userId),
      this.getFleetUpcomingRaces(userId),
      this.getCommunityRaces(userId),
      this.getCatalogMatches(userId),
      this.getPreviousYearRaces(userId),
      this.getPatternBasedSuggestions(userId),
      this.getTemplateSuggestions(userId),
    ]);

    // Cross-category dedup: if same race appears in multiple categories, keep highest confidence
    const allSuggestions = [
      ...clubRaces, ...fleetRaces, ...communityRaces,
      ...catalogMatches, ...previousYearRaces, ...patterns, ...templates,
    ];
    const deduped = this.crossCategoryDedup(allSuggestions);

    return {
      clubRaces: deduped.filter(s => s.type === 'club_event'),
      fleetRaces: deduped.filter(s => s.type === 'fleet_race'),
      communityRaces: deduped.filter(s => s.type === 'community_race'),
      catalogMatches: deduped.filter(s => s.type === 'catalog_match'),
      previousYearRaces: deduped.filter(s => s.type === 'previous_year'),
      patterns: deduped.filter(s => s.type === 'pattern_match'),
      templates: deduped.filter(s => s.type === 'template'),
      total: deduped.length,
    };
  }

  /**
   * Get upcoming races from user's clubs
   */
  async getClubUpcomingRaces(userId: string): Promise<RaceSuggestion[]> {
    try {
      // Get user's clubs
      const { data: memberships, error: memberError } = await supabase
        .from('club_members')
        .select('club_id, clubs(id, name)')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (memberError || !memberships || memberships.length === 0) {
        logger.debug('[getClubUpcomingRaces] No club memberships found');
        return [];
      }

      logger.debug('[getClubUpcomingRaces] Found club memberships:', {
        userId,
        membershipCount: memberships.length,
        clubIds: memberships.map((m) => m.club_id),
      });

      const clubIds = memberships.map((m) => m.club_id);

      // Get upcoming events from these clubs
      const { data: events, error: eventsError } = await supabase
        .from('club_events')
        .select('*')
        .in('club_id', clubIds)
        .gte('start_date', new Date().toISOString())
        .in('status', ['published', 'registration_open'])
        .order('start_date', { ascending: true })
        .limit(20);

      if (eventsError || !events) {
        logger.debug('[getClubUpcomingRaces] Error fetching club events (non-blocking):', eventsError);
        return [];
      }

      logger.debug('[getClubUpcomingRaces] Club events query result:', {
        requestedClubCount: clubIds.length,
        returnedEvents: events.length,
        sampleTitles: events.slice(0, 3).map((event) => event.title),
      });

      // Map to suggestions
      return events.map((event) => {
        const club = memberships.find((m) => m.club_id === event.club_id)?.clubs as any;
        return this.mapClubEventToSuggestion(event, club);
      });
    } catch (error) {
      logger.debug('[getClubUpcomingRaces] Error (non-blocking):', error);
      return [];
    }
  }

  /**
   * Get upcoming races from fleet members
   */
  async getFleetUpcomingRaces(userId: string): Promise<RaceSuggestion[]> {
    try {
      // Get user's fleets
      const fleets = await fleetService.getFleetsForUser(userId);

      if (!fleets || fleets.length === 0) {
        logger.debug('[getFleetUpcomingRaces] No fleet memberships found');
        return [];
      }

      logger.debug('[getFleetUpcomingRaces] Fleet memberships found:', {
        userId,
        fleetCount: fleets.length,
        fleetIds: fleets.map(({ fleet }) => fleet.id),
        classIds: fleets.map(({ fleet }) => fleet.classId),
      });

      // Get races for each fleet's class
      const allRaces: RaceSuggestion[] = [];

      for (const { fleet } of fleets) {
        if (!fleet.classId) continue;

        // Use existing fleet service method
        const races = await fleetService.getFleetUpcomingRaces({
          classId: fleet.classId,
          limit: 10,
        });

        // Map to suggestions
        const suggestions = races.map((race) =>
          this.mapFleetRaceToSuggestion(race, fleet)
        );

        allRaces.push(...suggestions);
      }

      // Deduplicate and sort by confidence
      const unique = this.deduplicateSuggestions(allRaces);
      logger.debug('[getFleetUpcomingRaces] Aggregated fleet races:', {
        rawCount: allRaces.length,
        uniqueCount: unique.length,
      });
      return unique.slice(0, 20);
    } catch (error) {
      logger.error('[getFleetUpcomingRaces] Error:', error);
      return [];
    }
  }

  /**
   * Get suggestions based on detected patterns
   */
  async getPatternBasedSuggestions(userId: string): Promise<RaceSuggestion[]> {
    try {
      // First, detect/update patterns
      await this.detectAndUpdatePatterns(userId);

      // Get high-confidence patterns
      const { data: patterns, error } = await supabase
        .from('race_patterns')
        .select('*')
        .eq('user_id', userId)
        .gte('confidence', 0.6)
        .order('confidence', { ascending: false })
        .limit(10);

      if (error || !patterns) {
        logger.debug('[getPatternBasedSuggestions] No patterns found');
        return [];
      }

      // Generate suggestions from patterns
      const suggestions: RaceSuggestion[] = [];

      for (const pattern of patterns) {
        const patternSuggestions = await this.generateSuggestionsFromPattern(pattern);
        suggestions.push(...patternSuggestions);
      }

      return suggestions.slice(0, 15);
    } catch (error) {
      logger.error('[getPatternBasedSuggestions] Error:', error);
      return [];
    }
  }

  /**
   * Get template-based suggestions
   */
  async getTemplateSuggestions(userId: string): Promise<RaceSuggestion[]> {
    try {
      const { data: templates, error } = await supabase
        .from('race_templates')
        .select('*')
        .eq('user_id', userId)
        .order('usage_count', { ascending: false })
        .limit(10);

      if (error || !templates) {
        return [];
      }

      return templates.map((template) => this.mapTemplateToSuggestion(template));
    } catch (error) {
      logger.error('[getTemplateSuggestions] Error:', error);
      return [];
    }
  }

  /**
   * Detect and update patterns from user's race history
   */
  private async detectAndUpdatePatterns(userId: string): Promise<void> {
    try {
      // Get user's race history
      const { data: races, error } = await supabase
        .from('regattas')
        .select('*')
        .eq('created_by', userId)
        .order('start_date', { ascending: true });

      if (error || !races || races.length < 3) {
        // Need at least 3 races to detect patterns
        logger.debug('[detectAndUpdatePatterns] Insufficient race history for patterns:', {
          userId,
          raceCount: races?.length ?? 0,
          error,
        });
        return;
      }

      logger.debug('[detectAndUpdatePatterns] Processing race history:', {
        userId,
        raceCount: races.length,
      });

      // Detect various pattern types
      await Promise.all([
        this.detectSeasonalPatterns(userId, races),
        this.detectVenuePreferences(userId, races),
        this.detectClassPreferences(userId, races),
        this.detectTemporalAnnualPatterns(userId, races),
      ]);
    } catch (error) {
      logger.error('[detectAndUpdatePatterns] Error:', error);
    }
  }

  /**
   * Detect seasonal patterns (e.g., Spring Championship every April)
   */
  private async detectSeasonalPatterns(userId: string, races: any[]): Promise<void> {
    const seasonalRaces = new Map<string, any[]>();

    // Group races by name and month
    for (const race of races) {
      const date = new Date(race.start_date);
      const month = date.getMonth();
      const key = `${race.name}_${month}`;

      if (!seasonalRaces.has(key)) {
        seasonalRaces.set(key, []);
      }
      seasonalRaces.get(key)!.push(race);
    }

    // Find patterns (races that occurred 2+ times in same month)
    for (const [key, raceList] of seasonalRaces.entries()) {
      if (raceList.length >= 2) {
        const [raceName, month] = key.split('_');
        const confidence = Math.min(raceList.length / 5, 0.95); // Cap at 0.95

        await this.upsertPattern(userId, {
          pattern_type: 'seasonal',
          pattern_data: {
            raceName,
            month: parseInt(month),
            venue: raceList[0].metadata?.venue_name,
            boatClass: raceList[0].metadata?.class,
          },
          confidence,
          occurrence_count: raceList.length,
        });
      }
    }
  }

  /**
   * Detect venue preferences
   */
  private async detectVenuePreferences(userId: string, races: any[]): Promise<void> {
    const venueCounts = new Map<string, number>();

    for (const race of races) {
      const venue = race.metadata?.venue_name;
      if (venue) {
        venueCounts.set(venue, (venueCounts.get(venue) || 0) + 1);
      }
    }

    for (const [venue, count] of venueCounts.entries()) {
      if (count >= 3) {
        const confidence = Math.min(count / 10, 0.9);

        await this.upsertPattern(userId, {
          pattern_type: 'venue_preference',
          pattern_data: { venue, raceCount: count },
          confidence,
          occurrence_count: count,
        });
      }
    }
  }

  /**
   * Detect class preferences
   */
  private async detectClassPreferences(userId: string, races: any[]): Promise<void> {
    const classCounts = new Map<string, number>();

    for (const race of races) {
      const boatClass = race.metadata?.class || race.metadata?.class_name;
      if (boatClass) {
        classCounts.set(boatClass, (classCounts.get(boatClass) || 0) + 1);
      }
    }

    for (const [boatClass, count] of classCounts.entries()) {
      if (count >= 3) {
        const confidence = Math.min(count / 8, 0.9);

        await this.upsertPattern(userId, {
          pattern_type: 'class_preference',
          pattern_data: { boatClass, raceCount: count },
          confidence,
          occurrence_count: count,
        });
      }
    }
  }

  /**
   * Detect temporal annual patterns (same race around same time last year)
   */
  private async detectTemporalAnnualPatterns(userId: string, races: any[]): Promise<void> {
    const now = new Date();
    const thisYear = now.getFullYear();
    const nextMonth = now.getMonth() + 1;
    const monthAfter = now.getMonth() + 2;

    // Look for races from previous years in the next 2 months
    const candidateRaces = races.filter((race) => {
      const date = new Date(race.start_date);
      const raceMonth = date.getMonth();
      return date.getFullYear() < thisYear && (raceMonth === nextMonth || raceMonth === monthAfter);
    });

    for (const race of candidateRaces) {
      await this.upsertPattern(userId, {
        pattern_type: 'temporal_annual',
        pattern_data: {
          raceName: race.name,
          venue: race.metadata?.venue_name,
          month: new Date(race.start_date).getMonth(),
          lastOccurrence: race.start_date,
        },
        confidence: 0.7,
        occurrence_count: 1,
      });
    }
  }

  /**
   * Upsert a pattern (insert or update if exists)
   */
  private async upsertPattern(userId: string, patternData: any): Promise<void> {
    const targetSignature = stringifyPatternData(patternData.pattern_data);

    try {
      // Load existing patterns of this type so we can compare signatures client-side
      const { data: existingPatterns, error } = await supabase
        .from('race_patterns')
        .select('id, pattern_data')
        .eq('user_id', userId)
        .eq('pattern_type', patternData.pattern_type);

      if (error) {
        logger.error('[upsertPattern] Failed to query existing patterns:', error);
        return;
      }

      const existing = (existingPatterns || []).find(
        (pattern) => stringifyPatternData(pattern.pattern_data) === targetSignature
      );

      if (existing) {
        await supabase
          .from('race_patterns')
          .update({
            confidence: patternData.confidence,
            occurrence_count: patternData.occurrence_count,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('race_patterns').insert({
          user_id: userId,
          ...patternData,
        });
      }
    } catch (error) {
      logger.error('[upsertPattern] Unexpected error while processing pattern:', error);
    }
  }

  /**
   * Generate suggestions from a pattern
   */
  private async generateSuggestionsFromPattern(pattern: any): Promise<RaceSuggestion[]> {
    const suggestions: RaceSuggestion[] = [];
    const data = pattern.pattern_data;

    switch (pattern.pattern_type) {
      case 'seasonal':
      case 'temporal_annual':
        suggestions.push({
          id: pattern.id,
          type: 'pattern_match',
          confidenceScore: pattern.confidence,
          raceData: {
            raceName: data.raceName || 'Seasonal Race',
            venue: data.venue,
            boatClass: data.boatClass,
            startDate: this.suggestDateForMonth(data.month),
          },
          reason: `You typically race "${data.raceName}" in ${this.getMonthName(data.month)}`,
          canAddDirectly: true,
        });
        break;

      case 'venue_preference':
        suggestions.push({
          id: pattern.id,
          type: 'pattern_match',
          confidenceScore: pattern.confidence * 0.8, // Lower confidence for venue-only
          raceData: {
            raceName: `Race at ${data.venue}`,
            venue: data.venue,
          },
          reason: `You've raced at ${data.venue} ${data.raceCount} times`,
          canAddDirectly: false,
        });
        break;

      case 'class_preference':
        suggestions.push({
          id: pattern.id,
          type: 'pattern_match',
          confidenceScore: pattern.confidence * 0.75,
          raceData: {
            raceName: `${data.boatClass} Race`,
            boatClass: data.boatClass,
          },
          reason: `You frequently race ${data.boatClass} (${data.raceCount} races)`,
          canAddDirectly: false,
        });
        break;
    }

    return suggestions;
  }

  /**
   * Cache suggestions for quick retrieval
   */
  private async cacheSuggestions(
    userId: string,
    suggestions: CategorizedSuggestions
  ): Promise<boolean> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Cache for 24 hours

    const allSuggestions = [
      ...suggestions.clubRaces,
      ...suggestions.fleetRaces,
      ...suggestions.communityRaces,
      ...suggestions.catalogMatches,
      ...suggestions.previousYearRaces,
      ...suggestions.patterns,
      ...suggestions.templates,
    ];

    const cacheEntries = allSuggestions.map((suggestion) => ({
      user_id: userId,
      suggestion_type: suggestion.type,
      confidence_score: suggestion.confidenceScore,
      race_data: suggestion.raceData,
      source_id: suggestion.source?.id,
      source_metadata: suggestion.source,
      suggestion_reason: suggestion.reason,
      expires_at: expiresAt.toISOString(),
    }));

    const uniqueEntriesMap = new Map<string, typeof cacheEntries[number]>();
    cacheEntries.forEach((entry) => {
      const uniquenessKey = `${entry.suggestion_type}::${entry.source_id || 'none'}::${JSON.stringify(entry.race_data)}`;
      if (!uniqueEntriesMap.has(uniquenessKey)) {
        uniqueEntriesMap.set(uniquenessKey, entry);
      }
    });
    const uniqueEntries = Array.from(uniqueEntriesMap.values());

    if (uniqueEntries.length === 0) {
      return true;
    }

    try {
      // First, delete old expired suggestions for this user
      await supabase
        .from('race_suggestions_cache')
        .delete()
        .eq('user_id', userId)
        .lt('expires_at', new Date().toISOString());

      // Use upsert to handle duplicates gracefully
      const { error } = await supabase
        .from('race_suggestions_cache')
        .upsert(uniqueEntries, {
          onConflict: 'user_id,suggestion_type,source_id,race_data',
          ignoreDuplicates: false
        });

      if (error) {
        logger.debug('[RaceSuggestionService] Failed to cache suggestions (non-blocking)', { error });
        return false;
      }

      logger.debug('[RaceSuggestionService] Successfully cached suggestions', {
        count: uniqueEntries.length
      });
      return true;
    } catch (error) {
      logger.debug('[RaceSuggestionService] Unexpected error caching suggestions (non-blocking)', error);
      return false;
    }
  }

  /**
   * Record user feedback on a suggestion
   */
  async recordFeedback(
    userId: string,
    suggestionId: string,
    action: 'accepted' | 'dismissed' | 'modified' | 'clicked',
    modifiedFields?: string[]
  ): Promise<void> {
    await supabase.rpc('record_suggestion_feedback', {
      p_user_id: userId,
      p_suggestion_id: suggestionId,
      p_action: action,
      p_modified_fields: modifiedFields || null,
    });
  }

  /**
   * Invalidate cached suggestions (force refresh)
   */
  async invalidateCache(userId: string): Promise<void> {
    await supabase
      .from('race_suggestions_cache')
      .update({ expires_at: new Date().toISOString() })
      .eq('user_id', userId);
  }

  // =====================================================
  // Community Race Suggestions
  // =====================================================

  /**
   * Get races that other users in the same clubs/fleets have recently added
   */
  async getCommunityRaces(userId: string): Promise<RaceSuggestion[]> {
    try {
      // Get user's club and fleet memberships
      const { data: clubMemberships } = await supabase
        .from('club_members')
        .select('club_id, clubs(id, name)')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (!clubMemberships || clubMemberships.length === 0) {
        logger.debug('[getCommunityRaces] No club memberships found');
        return [];
      }

      const clubIds = clubMemberships.map((m) => m.club_id);

      // Get co-members (other users in the same clubs)
      const { data: coMembers } = await supabase
        .from('club_members')
        .select('user_id')
        .in('club_id', clubIds)
        .eq('is_active', true)
        .neq('user_id', userId);

      if (!coMembers || coMembers.length === 0) {
        logger.debug('[getCommunityRaces] No co-members found');
        return [];
      }

      const coMemberIds = [...new Set(coMembers.map((m) => m.user_id))];

      // Get future races created by co-members
      const { data: communityRaces } = await supabase
        .from('regattas')
        .select('id, name, start_date, start_area_name, race_type, metadata, created_by')
        .in('created_by', coMemberIds)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(30);

      if (!communityRaces || communityRaces.length === 0) {
        return [];
      }

      // Group by race name + date to count community participation
      const raceGroups = new Map<string, { race: any; count: number }>();
      for (const race of communityRaces) {
        const dateStr = race.start_date?.split('T')[0] || '';
        const key = `${race.name?.toLowerCase().trim()}_${dateStr}`;
        const existing = raceGroups.get(key);
        if (existing) {
          existing.count++;
        } else {
          raceGroups.set(key, { race, count: 1 });
        }
      }

      // Map to suggestions
      return Array.from(raceGroups.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 20)
        .map(({ race, count }) => {
          const confidence = Math.min(0.7 + count * 0.05, 0.9);
          const sailorLabel = count === 1 ? '1 sailor' : `${count} sailors`;
          return {
            id: `community_${race.id}`,
            type: 'community_race' as const,
            confidenceScore: confidence,
            raceData: {
              raceName: race.name,
              venue: race.start_area_name || race.metadata?.venue_name,
              startDate: race.start_date,
              raceType: race.race_type,
            },
            reason: `${sailorLabel} in your club are racing this`,
            source: {
              id: race.id,
              name: race.name,
              type: 'community' as const,
            },
            canAddDirectly: true,
          };
        });
    } catch (error) {
      logger.error('[getCommunityRaces] Error:', error);
      return [];
    }
  }

  // =====================================================
  // Catalog Race Match Suggestions
  // =====================================================

  /**
   * Match catalog races to user context (boat classes, followed races, region)
   */
  async getCatalogMatches(userId: string): Promise<RaceSuggestion[]> {
    try {
      // Get user's boat classes
      const { data: sailorBoats } = await supabase
        .from('sailor_boats')
        .select('boat_classes(name)')
        .eq('user_id', userId);

      const userClasses = (sailorBoats || [])
        .map((sb: any) => sb.boat_classes?.name)
        .filter(Boolean) as string[];

      // Get followed catalog race IDs
      const { data: followedRaces } = await supabase
        .from('saved_catalog_races')
        .select('catalog_race_id')
        .eq('user_id', userId);

      const followedIds = new Set((followedRaces || []).map((r) => r.catalog_race_id));

      // Get user's region from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('country, region')
        .eq('id', userId)
        .single();

      const userCountry = profile?.country;

      // Query catalog races matching boat classes or upcoming
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // 1-based
      const threeMonthsLater = ((currentMonth + 2) % 12) + 1;
      const sixMonthsFromNow = new Date(now);
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

      let query = supabase
        .from('catalog_races')
        .select('*')
        .order('follower_count', { ascending: false })
        .limit(50);

      const { data: catalogRaces } = await query;

      if (!catalogRaces || catalogRaces.length === 0) {
        return [];
      }

      // Score and filter matches
      const suggestions: RaceSuggestion[] = [];

      for (const race of catalogRaces) {
        const isFollowed = followedIds.has(race.id);
        const classMatch = userClasses.length > 0 && race.boat_classes?.some(
          (bc: string) => userClasses.some(uc => uc.toLowerCase() === bc.toLowerCase())
        );
        const countryMatch = userCountry && race.country?.toLowerCase() === userCountry.toLowerCase();

        // Check if race is upcoming (within next 3 months by typical_month or 6 months by date)
        const monthMatch = race.typical_month &&
          race.typical_month >= currentMonth &&
          race.typical_month <= (currentMonth + 3 > 12 ? currentMonth + 3 - 12 : currentMonth + 3);
        const dateMatch = race.next_edition_date &&
          new Date(race.next_edition_date) <= sixMonthsFromNow &&
          new Date(race.next_edition_date) >= now;

        const isUpcoming = monthMatch || dateMatch;

        // Skip if no relevance signals
        if (!isFollowed && !classMatch && !countryMatch && !isUpcoming) continue;

        // Calculate confidence
        let confidence: number;
        if (isFollowed && classMatch) confidence = 0.95;
        else if (isFollowed) confidence = 0.85;
        else if (classMatch && countryMatch) confidence = 0.8;
        else if (classMatch) confidence = 0.7;
        else if (countryMatch && isUpcoming) confidence = 0.65;
        else confidence = 0.6;

        // Build reason
        const reasons: string[] = [];
        if (isFollowed) reasons.push('you follow this race');
        if (classMatch) reasons.push('matches your boat class');
        if (countryMatch) reasons.push('in your region');
        if (isUpcoming) reasons.push('coming up soon');

        suggestions.push({
          id: `catalog_${race.id}`,
          type: 'catalog_match',
          confidenceScore: confidence,
          raceData: {
            raceName: race.name,
            venue: race.region ? `${race.region}, ${race.country}` : race.country || undefined,
            startDate: race.next_edition_date || undefined,
            boatClass: race.boat_classes?.[0],
            description: race.description || undefined,
            registrationUrl: race.website_url || undefined,
          },
          reason: reasons.length > 0
            ? reasons.join(', ').replace(/^./, (c) => c.toUpperCase())
            : 'Popular race in the catalog',
          source: {
            id: race.id,
            name: race.short_name || race.name,
            type: 'catalog',
          },
          catalogRaceId: race.id,
          canAddDirectly: true,
        });
      }

      return suggestions
        .sort((a, b) => b.confidenceScore - a.confidenceScore)
        .slice(0, 15);
    } catch (error) {
      logger.error('[getCatalogMatches] Error:', error);
      return [];
    }
  }

  // =====================================================
  // Previous Year Re-Race Suggestions
  // =====================================================

  /**
   * Suggest races from ~12 months ago with date bumping
   */
  async getPreviousYearRaces(userId: string): Promise<RaceSuggestion[]> {
    try {
      const now = new Date();
      const currentMonth = now.getMonth(); // 0-based
      const currentYear = now.getFullYear();

      // Look for races created by this user in months [current, current+1, current+2]
      // from any previous year
      const monthsToMatch = [currentMonth, (currentMonth + 1) % 12, (currentMonth + 2) % 12];

      const { data: pastRaces } = await supabase
        .from('regattas')
        .select('*')
        .eq('created_by', userId)
        .lt('start_date', `${currentYear}-01-01T00:00:00`)
        .order('start_date', { ascending: false })
        .limit(100);

      if (!pastRaces || pastRaces.length === 0) {
        return [];
      }

      // Filter to races in matching months
      const candidates = pastRaces.filter((race) => {
        const raceDate = new Date(race.start_date);
        return monthsToMatch.includes(raceDate.getMonth());
      });

      if (candidates.length === 0) {
        return [];
      }

      // Deduplicate by race name (keep most recent)
      const byName = new Map<string, any>();
      for (const race of candidates) {
        const key = race.name?.toLowerCase().trim();
        if (key && !byName.has(key)) {
          byName.set(key, race);
        }
      }

      return Array.from(byName.values()).slice(0, 10).map((race) => {
        const originalDate = new Date(race.start_date);
        const yearDelta = currentYear - originalDate.getFullYear();
        const bumpedDate = new Date(originalDate);
        bumpedDate.setFullYear(bumpedDate.getFullYear() + yearDelta);

        // Adjust to nearest matching weekday
        const originalDow = originalDate.getDay();
        const bumpedDow = bumpedDate.getDay();
        if (originalDow !== bumpedDow) {
          const diff = originalDow - bumpedDow;
          const adjustment = diff > 3 ? diff - 7 : diff < -3 ? diff + 7 : diff;
          bumpedDate.setDate(bumpedDate.getDate() + adjustment);
        }

        // If bumped date is in the past, push forward one week
        if (bumpedDate < now) {
          bumpedDate.setDate(bumpedDate.getDate() + 7);
        }

        const bumpedDateStr = bumpedDate.toISOString().split('T')[0];
        const timeStr = race.start_date?.includes('T')
          ? race.start_date.split('T')[1]?.substring(0, 5)
          : undefined;

        // Determine fields to review
        const fieldsToReview: string[] = ['date', 'time'];
        if (race.metadata?.venue_name) fieldsToReview.push('location');
        if (race.notice_of_race_url) fieldsToReview.push('NOR URL');
        if (race.entry_fees) fieldsToReview.push('entry fees');
        if (race.event_website) fieldsToReview.push('event website');

        return {
          id: `prev_year_${race.id}`,
          type: 'previous_year' as const,
          confidenceScore: 0.85,
          raceData: {
            raceName: race.name,
            venue: race.start_area_name || race.metadata?.venue_name,
            startDate: `${bumpedDateStr}T${timeStr || '12:00'}:00`,
            boatClass: race.metadata?.class_name || race.metadata?.class,
            raceType: race.race_type,
            location: race.start_area_name,
            time: timeStr || '12:00',
            totalDistanceNm: race.total_distance_nm,
            timeLimitHours: race.time_limit_hours,
            routeDescription: race.metadata?.route_description,
            courseType: race.metadata?.course_type,
            vhfChannel: race.vhf_channel,
          },
          reason: `You raced this in ${originalDate.getFullYear()}`,
          canAddDirectly: true,
          updateGuidance: {
            fieldsToReview,
            message: 'Review dates, NOR, and entry fees before saving',
          },
        };
      });
    } catch (error) {
      logger.error('[getPreviousYearRaces] Error:', error);
      return [];
    }
  }

  // =====================================================
  // Cross-Category Dedup
  // =====================================================

  /**
   * Deduplicate suggestions across categories - keep highest confidence version
   */
  private crossCategoryDedup(suggestions: RaceSuggestion[]): RaceSuggestion[] {
    const byKey = new Map<string, RaceSuggestion>();

    for (const suggestion of suggestions) {
      const name = suggestion.raceData.raceName?.toLowerCase().trim() || '';
      const date = suggestion.raceData.startDate?.split('T')[0] || '';
      const key = `${name}_${date}`;

      const existing = byKey.get(key);
      if (!existing || suggestion.confidenceScore > existing.confidenceScore) {
        byKey.set(key, suggestion);
      }
    }

    return Array.from(byKey.values());
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  private emptySuggestions(): CategorizedSuggestions {
    return {
      clubRaces: [],
      fleetRaces: [],
      communityRaces: [],
      catalogMatches: [],
      previousYearRaces: [],
      patterns: [],
      templates: [],
      total: 0,
    };
  }

  private mapClubEventToSuggestion(event: any, club: any): RaceSuggestion {
    return {
      id: event.id,
      type: 'club_event',
      confidenceScore: 0.9, // High confidence for club events
      raceData: {
        raceName: event.title,
        venue: event.location_name,
        venueCoordinates: event.location_coordinates,
        startDate: event.start_date,
        endDate: event.end_date,
        boatClass: event.boat_classes?.[0],
        description: event.description,
        registrationUrl: event.website_url,
      },
      reason: `Upcoming event at ${club?.name || 'your club'}`,
      source: {
        id: event.club_id,
        name: club?.name || 'Your Club',
        type: 'club',
      },
      canAddDirectly: true,
    };
  }

  private mapFleetRaceToSuggestion(race: any, fleet: any): RaceSuggestion {
    return {
      id: race.id,
      type: 'fleet_race',
      confidenceScore: 0.85,
      raceData: {
        raceName: race.raceName,
        venue: race.venueName || race.racingAreaName,
        startDate: race.startTime,
        boatClass: race.boatClass,
        raceSeries: race.raceSeries,
      },
      reason: `${fleet.name} fleet member is racing this`,
      source: {
        id: fleet.id,
        name: fleet.name,
        type: 'fleet',
      },
      canAddDirectly: true,
    };
  }

  private mapTemplateToSuggestion(template: any): RaceSuggestion {
    return {
      id: template.id,
      type: 'template',
      confidenceScore: Math.min(template.usage_count / 10, 0.8),
      raceData: {
        raceName: template.template_name,
        venue: template.venue_name,
        venueCoordinates: template.venue_coordinates,
        boatClass: template.boat_class,
        raceSeries: template.race_series,
      },
      reason: `You've used this template ${template.usage_count} times`,
      canAddDirectly: true,
    };
  }

  private mapCachedSuggestion(cached: any): RaceSuggestion {
    return {
      id: cached.id,
      type: cached.suggestion_type,
      confidenceScore: cached.confidence_score,
      raceData: cached.race_data,
      reason: cached.suggestion_reason,
      source: cached.source_metadata,
      canAddDirectly: true,
    };
  }

  private categorizeSuggestions(suggestions: RaceSuggestion[]): CategorizedSuggestions {
    return {
      clubRaces: suggestions.filter((s) => s.type === 'club_event'),
      fleetRaces: suggestions.filter((s) => s.type === 'fleet_race'),
      communityRaces: suggestions.filter((s) => s.type === 'community_race'),
      catalogMatches: suggestions.filter((s) => s.type === 'catalog_match'),
      previousYearRaces: suggestions.filter((s) => s.type === 'previous_year'),
      patterns: suggestions.filter((s) => s.type === 'pattern_match'),
      templates: suggestions.filter((s) => s.type === 'template'),
      total: suggestions.length,
    };
  }

  private deduplicateSuggestions(suggestions: RaceSuggestion[]): RaceSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter((suggestion) => {
      const key = `${suggestion.raceData.raceName}_${suggestion.raceData.startDate}_${suggestion.raceData.venue}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private suggestDateForMonth(month: number): string {
    const now = new Date();
    const year = now.getFullYear();
    const suggestedDate = new Date(year, month, 15); // Mid-month

    // If month has passed, suggest next year
    if (suggestedDate < now) {
      suggestedDate.setFullYear(year + 1);
    }

    return suggestedDate.toISOString();
  }

  private getMonthName(month: number): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[month] || 'Unknown';
  }
}

export const raceSuggestionService = new RaceSuggestionService();

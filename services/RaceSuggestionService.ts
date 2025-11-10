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

export interface RaceSuggestion {
  id: string;
  type: 'club_event' | 'fleet_race' | 'pattern_match' | 'template' | 'similar_sailor';
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
  };
  reason: string;
  source?: {
    id: string;
    name: string;
    type: 'club' | 'fleet' | 'pattern';
  };
  canAddDirectly: boolean;
}

export interface CategorizedSuggestions {
  clubRaces: RaceSuggestion[];
  fleetRaces: RaceSuggestion[];
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
      console.log('🎯 [RaceSuggestionService] getSuggestionsForUser called for:', userId);
      logger.debug('[getSuggestionsForUser] Fetching suggestions for user:', userId);

      // Check cache first
      console.log('💾 [RaceSuggestionService] Checking cache...');
      const cached = await this.getCachedSuggestions(userId);
      console.log('💾 [RaceSuggestionService] Cache check result:', {
        total: cached.total,
        hasData: cached.total > 0
      });

      if (cached.total > 0) {
        console.log('✅ [RaceSuggestionService] Returning cached suggestions:', cached);
        logger.debug('[getSuggestionsForUser] Returning cached suggestions:', cached.total);
        return cached;
      }

      // Generate fresh suggestions
      console.log('🔨 [RaceSuggestionService] No valid cache, generating fresh suggestions');
      logger.debug('[getSuggestionsForUser] No valid cache, generating fresh suggestions');
      const suggestions = await this.generateFreshSuggestions(userId);
      console.log('🔨 [RaceSuggestionService] Generated suggestions:', suggestions);

      // Cache the results
      console.log('💾 [RaceSuggestionService] Caching suggestions...');
      const cacheSuccess = await this.cacheSuggestions(userId, suggestions);
      if (cacheSuccess) {
        console.log('✅ [RaceSuggestionService] Suggestions cached successfully');
      } else {
        console.warn('⚠️ [RaceSuggestionService] Unable to cache suggestions (see logs above)');
      }

      return suggestions;
    } catch (error) {
      console.error('❌ [RaceSuggestionService] Error fetching suggestions:', error);
      console.error('❌ [RaceSuggestionService] Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      logger.error('[getSuggestionsForUser] Error fetching suggestions:', error);
      // Return empty suggestions on error
      return {
        clubRaces: [],
        fleetRaces: [],
        patterns: [],
        templates: [],
        total: 0,
      };
    }
  }

  /**
   * Get cached suggestions if they exist and are not expired
   */
  private async getCachedSuggestions(userId: string): Promise<CategorizedSuggestions> {
    console.log('📦 [getCachedSuggestions] Querying cache for user:', userId);
    console.log('📦 [getCachedSuggestions] Current timestamp:', new Date().toISOString());

    const { data, error } = await supabase
      .from('race_suggestions_cache')
      .select('*')
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .is('dismissed_at', null)
      .is('accepted_at', null)
      .order('confidence_score', { ascending: false });

    console.log('📦 [getCachedSuggestions] Query result:', { data, error });

    if (error) {
      console.error('❌ [getCachedSuggestions] Error fetching cached suggestions:', error);
      logger.error('[getCachedSuggestions] Error fetching cached suggestions:', error);
      return { clubRaces: [], fleetRaces: [], patterns: [], templates: [], total: 0 };
    }

    if (!data || data.length === 0) {
      console.log('📦 [getCachedSuggestions] No cached data found');
      return { clubRaces: [], fleetRaces: [], patterns: [], templates: [], total: 0 };
    }

    console.log('✅ [getCachedSuggestions] Found', data.length, 'cached suggestions');
    // Categorize suggestions
    return this.categorizeSuggestions(data.map(this.mapCachedSuggestion));
  }

  /**
   * Generate fresh suggestions from all sources
   */
  private async generateFreshSuggestions(userId: string): Promise<CategorizedSuggestions> {
    console.log('🔨 [generateFreshSuggestions] Starting parallel fetch for user:', userId);

    const [clubRaces, fleetRaces, patterns, templates] = await Promise.all([
      this.getClubUpcomingRaces(userId),
      this.getFleetUpcomingRaces(userId),
      this.getPatternBasedSuggestions(userId),
      this.getTemplateSuggestions(userId),
    ]);

    console.log('🔨 [generateFreshSuggestions] Results:', {
      clubRaces: clubRaces.length,
      fleetRaces: fleetRaces.length,
      patterns: patterns.length,
      templates: templates.length
    });

    return {
      clubRaces,
      fleetRaces,
      patterns,
      templates,
      total: clubRaces.length + fleetRaces.length + patterns.length + templates.length,
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
        logger.error('[getClubUpcomingRaces] Error fetching club events:', eventsError);
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
      logger.error('[getClubUpcomingRaces] Error:', error);
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
      await supabase.from('race_suggestions_cache').delete().eq('user_id', userId);

      const { error } = await supabase
        .from('race_suggestions_cache')
        .insert(uniqueEntries);

      if (error) {
        console.error('[RaceSuggestionService] Failed to cache suggestions', error);
        logger.error('[RaceSuggestionService] Failed to cache suggestions', { error });
        return false;
      }

      logger.debug('[RaceSuggestionService] Successfully cached suggestions', {
        count: uniqueEntries.length
      });
      return true;
    } catch (error) {
      console.error('[RaceSuggestionService] Unexpected error caching suggestions', error);
      logger.error('[RaceSuggestionService] Unexpected error caching suggestions', error);
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
  // Helper Methods
  // =====================================================

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

/**
 * Race Suggestion Service
 * Provides intelligent race recommendations based on user's clubs, fleets, and racing history
 */

import { supabase } from './supabase';
import { fleetService } from './fleetService';
import { createLogger } from '@/lib/utils/logger';
import { isMissingRelationError, isMissingSupabaseColumn } from '@/lib/utils/supabaseSchemaFallback';

const logger = createLogger('RaceSuggestionService');
const stringifyPatternData = (value: Record<string, unknown> | null | undefined) =>
  JSON.stringify(value ?? {});
const ACTIVE_MEMBERSHIP_STATUSES = ['active', 'approved', 'confirmed', 'current'];

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
  diagnostics?: SuggestionDiagnostics;
}

export interface SuggestionSourceDiagnostic {
  name: string;
  failed: boolean;
  elapsedMs: number;
  count: number;
  errorMessage?: string;
}

export interface SuggestionDiagnostics {
  failedSources: string[];
  sources: SuggestionSourceDiagnostic[];
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
  private debugErrorDetails(error: any) {
    if (!error) return null;
    return {
      code: typeof error.code === 'string' ? error.code : undefined,
      message: typeof error.message === 'string' ? error.message : String(error),
      details: typeof error.details === 'string' ? error.details : undefined,
      hint: typeof error.hint === 'string' ? error.hint : undefined,
      status: typeof error.status === 'number' ? error.status : undefined,
    };
  }

  private createTaggedError(code: string, message: string, cause?: unknown): Error {
    const tagged = new Error(`[${code}] ${message}`);
    (tagged as any).code = code;
    if (cause !== undefined) {
      (tagged as any).cause = cause;
    }
    return tagged;
  }

  private async fetchRegattasForUser(
    userId: string,
    options: {
      select?: string;
      orderBy?: string;
      ascending?: boolean;
      limit?: number;
      ltStartDate?: string;
      gteStartDate?: string;
    } = {}
  ): Promise<any[]> {
    const {
      select = '*',
      orderBy = 'start_date',
      ascending = true,
      limit,
      ltStartDate,
      gteStartDate,
    } = options;

    const ownerColumns: ('created_by' | 'user_id')[] = ['created_by', 'user_id'];
    logger.debug('[Debug400][fetchRegattasForUser] starting owner-column probe', {
      userId,
      ownerColumns,
      orderBy,
      ascending,
      ltStartDate,
      gteStartDate,
      limit,
    });

    for (const ownerColumn of ownerColumns) {
      logger.debug('[Debug400][fetchRegattasForUser] querying regattas', {
        userId,
        ownerColumn,
        ltStartDate,
        gteStartDate,
        limit,
      });
      let query = supabase
        .from('regattas')
        .select(select)
        .eq(ownerColumn, userId)
        .order(orderBy, { ascending });

      if (ltStartDate) {
        query = query.lt('start_date', ltStartDate);
      }
      if (gteStartDate) {
        query = query.gte('start_date', gteStartDate);
      }
      if (typeof limit === 'number') {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) {
        if (this.isSchemaFallbackError(error, `regattas.${ownerColumn}`)) {
          logger.warn('[Debug400][fetchRegattasForUser] schema fallback triggered', {
            userId,
            failedOwnerColumn: ownerColumn,
            fallbackToNextOwnerColumn: true,
            error: this.debugErrorDetails(error),
          });
          continue;
        }
        logger.error('[Debug400][fetchRegattasForUser] non-fallback query failure', {
          userId,
          ownerColumn,
          error: this.debugErrorDetails(error),
        });
        throw error;
      }

      logger.debug('[Debug400][fetchRegattasForUser] query succeeded', {
        userId,
        ownerColumn,
        count: Array.isArray(data) ? data.length : 0,
        fallbackToNextOwnerColumn: false,
      });
      // Important: only fall back when schema/column errors occur.
      // Do not probe alternate owner columns on empty results, because that
      // causes noisy 400s in mixed-schema environments.
      return data || [];
    }

    logger.debug('[Debug400][fetchRegattasForUser] no rows returned from owner-column probes', { userId });
    return [];
  }

  private async fetchRegattasForOwners(
    ownerIds: string[],
    options: {
      select?: string;
      orderBy?: string;
      ascending?: boolean;
      limit?: number;
      gteStartDate?: string;
    } = {}
  ): Promise<any[]> {
    if (ownerIds.length === 0) return [];

    const {
      select = '*',
      orderBy = 'start_date',
      ascending = true,
      limit,
      gteStartDate,
    } = options;

    const ownerColumns: ('created_by' | 'user_id')[] = ['created_by', 'user_id'];

    for (const ownerColumn of ownerColumns) {
      let query = supabase
        .from('regattas')
        .select(select)
        .in(ownerColumn, ownerIds)
        .order(orderBy, { ascending });

      if (gteStartDate) {
        query = query.gte('start_date', gteStartDate);
      }
      if (typeof limit === 'number') {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) {
        if (this.isSchemaFallbackError(error, `regattas.${ownerColumn}`)) {
          continue;
        }
        throw error;
      }

      // Only continue to fallback column on schema errors above.
      // Successful empty result means this is the canonical owner column.
      return data || [];
    }

    return [];
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async withRetry<T>(label: string, fn: () => Promise<T>, attempts = 2): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        logger.warn(`[RaceSuggestionService] ${label} attempt failed`, {
          attempt,
          attempts,
          message: error instanceof Error ? error.message : String(error),
        });
        if (attempt < attempts) {
          await this.delay(200 * attempt);
        }
      }
    }
    throw lastError instanceof Error ? lastError : new Error(`${label} failed`);
  }

  private isSchemaFallbackError(error: any, qualifiedColumn?: string): boolean {
    return isMissingRelationError(error) || isMissingSupabaseColumn(error, qualifiedColumn);
  }

  private isPermissionOrRlsError(error: any): boolean {
    if (!error) return false;
    const code = typeof error.code === 'string' ? error.code : '';
    const message = typeof error.message === 'string' ? error.message.toLowerCase() : '';
    return (
      code === '42501' ||
      message.includes('row-level security') ||
      message.includes('permission denied') ||
      message.includes('not authorized')
    );
  }

  private isNonCriticalSuggestionError(error: any, qualifiedColumn?: string): boolean {
    return this.isSchemaFallbackError(error, qualifiedColumn) || this.isPermissionOrRlsError(error);
  }

  private getUpcomingMonthIndices(startMonthIndex: number, span: number): number[] {
    return Array.from({ length: span }, (_, offset) => (startMonthIndex + offset) % 12);
  }

  private getUpcomingMonthNumbers(startMonthNumber: number, span: number): number[] {
    return this.getUpcomingMonthIndices(startMonthNumber - 1, span).map((index) => index + 1);
  }

  private async getActiveClubMemberships(userId: string): Promise<{ club_id: string }[]> {
    const mergeWithGlobalMemberships = async (
      memberships: { club_id: string }[]
    ): Promise<{ club_id: string }[]> => {
      const globalMembershipResult = await supabase
        .from('global_club_members')
        .select('global_club_id')
        .eq('user_id', userId);

      if (globalMembershipResult.error) {
        if (this.isSchemaFallbackError(globalMembershipResult.error, 'global_club_members.global_club_id')) {
          return memberships;
        }
        throw globalMembershipResult.error;
      }

      const globalClubIds = Array.from(
        new Set(
          (globalMembershipResult.data || [])
            .map((row: any) => row?.global_club_id)
            .filter(Boolean)
        )
      ) as string[];

      if (globalClubIds.length === 0) {
        return memberships;
      }

      const globalClubsResult = await supabase
        .from('global_clubs')
        .select('id, platform_club_id')
        .in('id', globalClubIds);

      if (globalClubsResult.error) {
        if (this.isSchemaFallbackError(globalClubsResult.error, 'global_clubs.id')) {
          return memberships;
        }
        throw globalClubsResult.error;
      }

      const mergedClubIds = new Set<string>(memberships.map((membership) => membership.club_id));
      (globalClubsResult.data || []).forEach((club: any) => {
        const resolvedId = club?.platform_club_id || club?.id;
        if (resolvedId) mergedClubIds.add(resolvedId);
      });

      return Array.from(mergedClubIds).map((club_id) => ({ club_id }));
    };

    const activeByFlag = await supabase
      .from('club_members')
      .select('club_id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (activeByFlag.error && !this.isSchemaFallbackError(activeByFlag.error, 'club_members.is_active')) {
      throw activeByFlag.error;
    }

    if (!activeByFlag.error && activeByFlag.data) {
      const memberships = (activeByFlag.data as { club_id?: string | null }[])
        .filter((m): m is { club_id: string } => Boolean(m?.club_id))
        .map((m) => ({ club_id: m.club_id }));
      return mergeWithGlobalMemberships(memberships);
    }

    const activeByStatus = await supabase
      .from('club_members')
      .select('club_id')
      .eq('user_id', userId)
      .in('status', ACTIVE_MEMBERSHIP_STATUSES);

    if (activeByStatus.error && !this.isSchemaFallbackError(activeByStatus.error, 'club_members.status')) {
      throw activeByStatus.error;
    }

    if (!activeByStatus.error && activeByStatus.data) {
      const memberships = (activeByStatus.data as { club_id?: string | null }[])
        .filter((m): m is { club_id: string } => Boolean(m?.club_id))
        .map((m) => ({ club_id: m.club_id }));
      return mergeWithGlobalMemberships(memberships);
    }

    const fallbackAllMemberships = await supabase
      .from('club_members')
      .select('club_id')
      .eq('user_id', userId);
    if (fallbackAllMemberships.error) {
      if (!this.isSchemaFallbackError(fallbackAllMemberships.error, 'club_members.club_id')) {
        throw fallbackAllMemberships.error;
      }

      const legacyByStatus = await supabase
        .from('club_memberships')
        .select('club_id')
        .eq('user_id', userId)
        .in('status', ACTIVE_MEMBERSHIP_STATUSES);
      if (!legacyByStatus.error && legacyByStatus.data) {
        const memberships = (legacyByStatus.data as { club_id?: string | null }[])
          .filter((m): m is { club_id: string } => Boolean(m?.club_id))
          .map((m) => ({ club_id: m.club_id }));
        return mergeWithGlobalMemberships(memberships);
      }
      if (legacyByStatus.error && !this.isSchemaFallbackError(legacyByStatus.error, 'club_memberships.status')) {
        throw legacyByStatus.error;
      }

      const legacyAll = await supabase
        .from('club_memberships')
        .select('club_id')
        .eq('user_id', userId);
      if (legacyAll.error) {
        if (this.isSchemaFallbackError(legacyAll.error, 'club_memberships.club_id')) {
          return mergeWithGlobalMemberships([]);
        }
        throw legacyAll.error;
      }
      const memberships = (legacyAll.data as { club_id?: string | null }[])
        .filter((m): m is { club_id: string } => Boolean(m?.club_id))
        .map((m) => ({ club_id: m.club_id }));
      return mergeWithGlobalMemberships(memberships);
    }
    const memberships = (fallbackAllMemberships.data as { club_id?: string | null }[])
      .filter((m): m is { club_id: string } => Boolean(m?.club_id))
      .map((m) => ({ club_id: m.club_id }));
    return mergeWithGlobalMemberships(memberships);
  }

  private async getActiveMembersForClubs(clubIds: string[], excludeUserId?: string): Promise<string[]> {
    if (clubIds.length === 0) return [];

    const byFlag = await supabase
      .from('club_members')
      .select('user_id')
      .in('club_id', clubIds)
      .eq('is_active', true);

    let rows = byFlag.data as { user_id?: string | null }[] | null;
    if (byFlag.error) {
      if (!this.isSchemaFallbackError(byFlag.error, 'club_members.is_active')) {
        throw byFlag.error;
      }
      const byStatus = await supabase
        .from('club_members')
        .select('user_id')
        .in('club_id', clubIds)
        .in('status', ACTIVE_MEMBERSHIP_STATUSES);
      if (byStatus.error && !this.isSchemaFallbackError(byStatus.error, 'club_members.status')) {
        throw byStatus.error;
      }
      if (!byStatus.error) {
        rows = byStatus.data as { user_id?: string | null }[] | null;
      } else {
        const fallbackAllMembers = await supabase
          .from('club_members')
          .select('user_id')
          .in('club_id', clubIds);
        if (fallbackAllMembers.error) {
          if (!this.isSchemaFallbackError(fallbackAllMembers.error, 'club_members.user_id')) {
            throw fallbackAllMembers.error;
          }

          const legacyByStatus = await supabase
            .from('club_memberships')
            .select('user_id')
            .in('club_id', clubIds)
            .in('status', ACTIVE_MEMBERSHIP_STATUSES);
          if (!legacyByStatus.error && legacyByStatus.data) {
            rows = legacyByStatus.data as { user_id?: string | null }[] | null;
          } else if (
            legacyByStatus.error &&
            !this.isSchemaFallbackError(legacyByStatus.error, 'club_memberships.status')
          ) {
            throw legacyByStatus.error;
          } else {
            const legacyAllMembers = await supabase
              .from('club_memberships')
              .select('user_id')
              .in('club_id', clubIds);
            if (legacyAllMembers.error) {
              if (this.isSchemaFallbackError(legacyAllMembers.error, 'club_memberships.user_id')) {
                rows = [];
              } else {
                throw legacyAllMembers.error;
              }
            } else {
              rows = legacyAllMembers.data as { user_id?: string | null }[] | null;
            }
          }
        } else {
          rows = fallbackAllMembers.data as { user_id?: string | null }[] | null;
        }
      }
    }

    const uniqueIds = new Set(
      (rows || [])
        .map((row) => row?.user_id)
        .filter((id): id is string => Boolean(id))
        .filter((id) => (excludeUserId ? id !== excludeUserId : true))
    );
    return Array.from(uniqueIds);
  }

  private async getClubNamesByIds(clubIds: string[]): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    if (clubIds.length === 0) return result;

    const clubsRes = await supabase
      .from('clubs')
      .select('id, name')
      .in('id', clubIds);

    if (clubsRes.error && !this.isSchemaFallbackError(clubsRes.error, 'clubs.id')) {
      throw clubsRes.error;
    }

    if (!clubsRes.error && clubsRes.data) {
      clubsRes.data.forEach((club: any) => {
        if (club?.id && club?.name) {
          result.set(club.id, club.name);
        }
      });
    }

    const unresolvedClubIds = clubIds.filter((clubId) => !result.has(clubId));
    if (unresolvedClubIds.length === 0) {
      return result;
    }

    const profilesRes = await supabase
      .from('club_profiles')
      .select('id, club_name, organization_name')
      .in('id', unresolvedClubIds);
    if (profilesRes.error && !this.isSchemaFallbackError(profilesRes.error, 'club_profiles.id')) {
      throw profilesRes.error;
    }
    if (!profilesRes.error && profilesRes.data) {
      profilesRes.data.forEach((profile: any) => {
        if (!profile?.id) return;
        const name = profile.organization_name || profile.club_name;
        if (name) {
          result.set(profile.id, name);
        }
      });
    }

    const stillUnresolvedClubIds = clubIds.filter((clubId) => !result.has(clubId));
    if (stillUnresolvedClubIds.length === 0) {
      return result;
    }

    const yachtRes = await supabase
      .from('yacht_clubs')
      .select('id, name')
      .in('id', stillUnresolvedClubIds);

    if (yachtRes.error && !this.isSchemaFallbackError(yachtRes.error, 'yacht_clubs.id')) {
      throw yachtRes.error;
    }

    if (!yachtRes.error && yachtRes.data) {
      yachtRes.data.forEach((club: any) => {
        if (club?.id && club?.name) {
          result.set(club.id, club.name);
        }
      });
    }

    const stillUnresolvedAfterYacht = clubIds.filter((clubId) => !result.has(clubId));
    if (stillUnresolvedAfterYacht.length === 0) {
      return result;
    }

    const globalRes = await supabase
      .from('global_clubs')
      .select('id, name, platform_club_id')
      .or(
        `id.in.(${stillUnresolvedAfterYacht.join(',')}),platform_club_id.in.(${stillUnresolvedAfterYacht.join(',')})`
      );
    if (globalRes.error && !this.isSchemaFallbackError(globalRes.error, 'global_clubs.id')) {
      throw globalRes.error;
    }
    if (!globalRes.error && globalRes.data) {
      globalRes.data.forEach((club: any) => {
        const name = club?.name;
        const id = club?.id;
        const platformId = club?.platform_club_id;
        if (!name) return;
        if (id && stillUnresolvedAfterYacht.includes(id)) {
          result.set(id, name);
        }
        if (platformId && stillUnresolvedAfterYacht.includes(platformId)) {
          result.set(platformId, name);
        }
      });
    }

    return result;
  }

  /**
   * Get all categorized suggestions for a user
   */
  async getSuggestionsForUser(userId: string): Promise<CategorizedSuggestions> {
    try {
      logger.debug('[getSuggestionsForUser] Fetching suggestions for user:', userId);

      // Check cache first
      let cached = this.emptySuggestions();
      try {
        cached = await this.withRetry('cache-read', () => this.getCachedSuggestions(userId));
      } catch (cacheError) {
        logger.warn('[getSuggestionsForUser] Cache read failed, continuing with fresh generation:', cacheError);
      }

      if (cached.total > 0) {
        logger.debug('[getSuggestionsForUser] Returning cached suggestions:', cached.total);
        return cached;
      }

      // Generate fresh suggestions
      logger.debug('[getSuggestionsForUser] No valid cache, generating fresh suggestions');
      const startedAt = Date.now();
      const suggestions = await this.withRetry('fresh-generation', () => this.generateFreshSuggestions(userId));
      logger.debug('[getSuggestionsForUser] Fresh generation completed', {
        elapsedMs: Date.now() - startedAt,
        total: suggestions.total,
      });

      // Cache the results
      const cacheSuccess = await this.cacheSuggestions(userId, suggestions);
      if (!cacheSuccess) {
        logger.debug('[RaceSuggestionService] Unable to cache suggestions');
      }

      return suggestions;
    } catch (error) {
      logger.error('[getSuggestionsForUser] Error fetching suggestions:', {
        name: (error as Error).name,
        message: (error as Error).message,
      });
      throw this.createTaggedError(
        'RACE_SUGGESTIONS_SERVICE_FAILURE',
        'Unable to load race suggestions from available sources.',
        error
      );
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
      if (this.isNonCriticalSuggestionError(error, 'race_suggestions_cache.user_id')) {
        logger.debug('[getCachedSuggestions] Cache read skipped due schema/RLS restrictions');
        return this.emptySuggestions();
      }
      logger.error('[getCachedSuggestions] Error fetching cached suggestions:', error);
      throw error;
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
    const sources = await Promise.all([
      this.safeSuggestionSource('club_events', () => this.getClubUpcomingRaces(userId)),
      this.safeSuggestionSource('fleet_races', () => this.getFleetUpcomingRaces(userId)),
      this.safeSuggestionSource('community_races', () => this.getCommunityRaces(userId)),
      this.safeSuggestionSource('catalog_matches', () => this.getCatalogMatches(userId)),
      this.safeSuggestionSource('previous_year', () => this.getPreviousYearRaces(userId)),
      this.safeSuggestionSource('patterns', () => this.getPatternBasedSuggestions(userId)),
      this.safeSuggestionSource('templates', () => this.getTemplateSuggestions(userId)),
    ]);

    const [clubRaces, fleetRaces, communityRaces, catalogMatches, previousYearRaces, patterns, templates] =
      sources.map((source) => source.suggestions);
    const failedSources = sources.filter((source) => source.failed).map((source) => source.name);
    const sourceDiagnostics: SuggestionSourceDiagnostic[] = sources.map((source) => ({
      name: source.name,
      failed: source.failed,
      elapsedMs: source.elapsedMs,
      count: source.suggestions.length,
      errorMessage: source.errorMessage,
    }));
    const totalElapsedMs = sources.reduce((sum, source) => sum + source.elapsedMs, 0);

    logger.debug('[RaceSuggestionService] Source diagnostics', {
      userId,
      failedSources,
      totalElapsedMs,
      sources: sourceDiagnostics,
    });
    const diagnostics =
      failedSources.length > 0
        ? ({
            failedSources,
            sources: sourceDiagnostics,
          } satisfies SuggestionDiagnostics)
        : undefined;

    // Cross-category dedup: if same race appears in multiple categories, keep highest confidence
    const allSuggestions = [
      ...clubRaces, ...fleetRaces, ...communityRaces,
      ...catalogMatches, ...previousYearRaces, ...patterns, ...templates,
    ];

    if (allSuggestions.length === 0 && failedSources.length > 0) {
      logger.warn('[RaceSuggestionService] All suggestion sources unavailable, returning empty set', {
        failedSources,
      });
      return this.emptySuggestions(diagnostics);
    }

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
      diagnostics,
    };
  }

  private async safeSuggestionSource(
    name: string,
    loader: () => Promise<RaceSuggestion[]>
  ): Promise<{ name: string; suggestions: RaceSuggestion[]; failed: boolean; elapsedMs: number; errorMessage?: string }> {
    const startedAt = Date.now();
    try {
      const suggestions = await loader();
      return { name, suggestions, failed: false, elapsedMs: Date.now() - startedAt };
    } catch (error) {
      logger.warn(`[RaceSuggestionService] Suggestion source failed: ${name}`, error);
      return {
        name,
        suggestions: [],
        failed: true,
        elapsedMs: Date.now() - startedAt,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get upcoming races from user's clubs
   */
  async getClubUpcomingRaces(userId: string): Promise<RaceSuggestion[]> {
    try {
      const memberships = await this.getActiveClubMemberships(userId);

      if (!memberships || memberships.length === 0) {
        logger.debug('[getClubUpcomingRaces] No club memberships found');
        return [];
      }

      logger.debug('[getClubUpcomingRaces] Found club memberships:', {
        userId,
        membershipCount: memberships.length,
        clubIds: memberships.map((m) => m.club_id),
      });

      const clubIds = memberships.map((m) => m.club_id);
      const clubNamesById = await this.getClubNamesByIds(clubIds);

      // Get upcoming events from these clubs
      const { data: events, error: eventsError } = await supabase
        .from('club_events')
        .select('*')
        .in('club_id', clubIds)
        .gte('start_date', new Date().toISOString())
        .in('status', ['published', 'registration_open'])
        .order('start_date', { ascending: true })
        .limit(20);

      if (eventsError) {
        throw eventsError;
      }
      if (!events) {
        return [];
      }

      logger.debug('[getClubUpcomingRaces] Club events query result:', {
        requestedClubCount: clubIds.length,
        returnedEvents: events.length,
        sampleTitles: events.slice(0, 3).map((event) => event.title),
      });

      // Map to suggestions
      return events.map((event) => {
        const club = { id: event.club_id, name: clubNamesById.get(event.club_id) || 'Your Club' };
        return this.mapClubEventToSuggestion(event, club);
      });
    } catch (error) {
      logger.error('[getClubUpcomingRaces] Error:', error);
      throw error;
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
      throw error;
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

      if (error) {
        throw error;
      }
      if (!patterns) {
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
      throw error;
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

      if (error) {
        throw error;
      }
      if (!templates) {
        return [];
      }

      return templates.map((template) => this.mapTemplateToSuggestion(template));
    } catch (error) {
      logger.error('[getTemplateSuggestions] Error:', error);
      throw error;
    }
  }

  /**
   * Detect and update patterns from user's race history
   */
  private async detectAndUpdatePatterns(userId: string): Promise<void> {
    // Get user's race history
    let races: any[] = [];
    try {
      races = await this.fetchRegattasForUser(userId, {
        select: '*',
        orderBy: 'start_date',
        ascending: true,
      });
    } catch (error) {
      logger.error('[detectAndUpdatePatterns] Failed to load race history:', error);
      throw error;
    }

    if (!races || races.length < 3) {
      // Need at least 3 races to detect patterns
      logger.debug('[detectAndUpdatePatterns] Insufficient race history for patterns:', {
        userId,
        raceCount: races?.length ?? 0,
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
    const targetMonths = this.getUpcomingMonthIndices(now.getMonth(), 3);

    // Look for races from previous years in the next 2 months
    const candidateRaces = races.filter((race) => {
      const date = new Date(race.start_date);
      const raceMonth = date.getMonth();
      return date.getFullYear() < thisYear && targetMonths.includes(raceMonth);
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
      const cleanupResult = await supabase
        .from('race_suggestions_cache')
        .delete()
        .eq('user_id', userId)
        .lt('expires_at', new Date().toISOString());
      if (
        cleanupResult.error &&
        !this.isNonCriticalSuggestionError(cleanupResult.error, 'race_suggestions_cache.expires_at')
      ) {
        logger.debug('[RaceSuggestionService] Cache cleanup failed (non-blocking)', {
          error: cleanupResult.error,
        });
      }

      // Use upsert to handle duplicates gracefully
      const { error } = await supabase
        .from('race_suggestions_cache')
        .upsert(uniqueEntries, {
          onConflict: 'user_id,suggestion_type,source_id,race_data',
          ignoreDuplicates: false
        });

      if (error) {
        if (this.isNonCriticalSuggestionError(error, 'race_suggestions_cache.user_id')) {
          logger.debug('[RaceSuggestionService] Cache write skipped due schema/RLS restrictions');
          return false;
        }
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
    const { error } = await supabase.rpc('record_suggestion_feedback', {
      p_user_id: userId,
      p_suggestion_id: suggestionId,
      p_action: action,
      p_modified_fields: modifiedFields || null,
    });
    if (error) {
      if (
        this.isPermissionOrRlsError(error) ||
        isMissingRelationError(error) ||
        isMissingSupabaseColumn(error)
      ) {
        logger.debug('[recordFeedback] Feedback RPC unavailable due schema/RLS (non-blocking)');
        return;
      }
      logger.debug('[recordFeedback] RPC failed (non-blocking):', error);
    }
  }

  /**
   * Invalidate cached suggestions (force refresh)
   */
  async invalidateCache(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('race_suggestions_cache')
        .update({ expires_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) {
        if (this.isNonCriticalSuggestionError(error, 'race_suggestions_cache.user_id')) {
          logger.debug('[invalidateCache] Cache invalidation skipped due schema/RLS restrictions');
          return;
        }
        logger.debug('[invalidateCache] Cache invalidation skipped (non-blocking):', error);
      }
    } catch (error) {
      logger.debug('[invalidateCache] Unexpected cache invalidation error (non-blocking):', error);
    }
  }

  // =====================================================
  // Community Race Suggestions
  // =====================================================

  /**
   * Get races that other users in the same clubs/fleets have recently added
   */
  async getCommunityRaces(userId: string): Promise<RaceSuggestion[]> {
    try {
      const clubMemberships = await this.getActiveClubMemberships(userId);

      if (!clubMemberships || clubMemberships.length === 0) {
        logger.debug('[getCommunityRaces] No club memberships found');
        return [];
      }

      const clubIds = clubMemberships.map((m) => m.club_id);

      // Get co-members (other users in the same clubs)
      const coMemberIds = await this.getActiveMembersForClubs(clubIds, userId);
      if (coMemberIds.length === 0) {
        logger.debug('[getCommunityRaces] No co-members found');
        return [];
      }

      // Get future races created by co-members
      const communityRaces = await this.fetchRegattasForOwners(coMemberIds, {
        select: 'id, name, start_date, start_area_name, race_type, metadata',
        gteStartDate: new Date().toISOString(),
        orderBy: 'start_date',
        ascending: true,
        limit: 30,
      });
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
      throw error;
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
      // Get user's boat classes (support both sailor_id and user_id schema variants).
      // Prefer sailor_id first: this matches the current schema/RLS in this app.
      let sailorBoats: any[] | null = null;
      logger.debug('[Debug400][getCatalogMatches] querying sailor_boats by sailor_id', { userId });
      const boatsBySailor = await supabase
        .from('sailor_boats')
        .select('boat_classes(name)')
        .eq('sailor_id', userId);
      if (boatsBySailor.error && !this.isNonCriticalSuggestionError(boatsBySailor.error, 'sailor_boats.sailor_id')) {
        logger.error('[Debug400][getCatalogMatches] sailor_boats sailor_id query failed (non-fallback)', {
          userId,
          error: this.debugErrorDetails(boatsBySailor.error),
        });
        throw boatsBySailor.error;
      }
      const shouldTryUserId = isMissingSupabaseColumn(boatsBySailor.error, 'sailor_boats.sailor_id');
      if (boatsBySailor.error) {
        logger.warn('[Debug400][getCatalogMatches] sailor_boats sailor_id query produced handled error', {
          userId,
          shouldTryUserId,
          error: this.debugErrorDetails(boatsBySailor.error),
        });
      }

      if (shouldTryUserId) {
        logger.debug('[Debug400][getCatalogMatches] querying sailor_boats by user_id fallback', { userId });
        const boatsByUser = await supabase
          .from('sailor_boats')
          .select('boat_classes(name)')
          .eq('user_id', userId);
        if (boatsByUser.error && !this.isNonCriticalSuggestionError(boatsByUser.error, 'sailor_boats.user_id')) {
          logger.error('[Debug400][getCatalogMatches] sailor_boats user_id query failed (non-fallback)', {
            userId,
            error: this.debugErrorDetails(boatsByUser.error),
          });
          throw boatsByUser.error;
        }
        if (boatsByUser.error) {
          logger.warn('[Debug400][getCatalogMatches] sailor_boats user_id query produced handled error', {
            userId,
            error: this.debugErrorDetails(boatsByUser.error),
          });
        }
        sailorBoats = boatsByUser.data || boatsBySailor.data;
      } else {
        sailorBoats = boatsBySailor.data;
      }

      const userClasses = (sailorBoats || [])
        .map((sb: any) => sb.boat_classes?.name)
        .filter(Boolean) as string[];

      // Get followed catalog race IDs
      const { data: followedRaces, error: followedRacesError } = await supabase
        .from('saved_catalog_races')
        .select('catalog_race_id')
        .eq('user_id', userId);
      if (followedRacesError && !this.isNonCriticalSuggestionError(followedRacesError, 'saved_catalog_races.user_id')) {
        throw followedRacesError;
      }

      const followedIds = new Set((followedRaces || []).map((r) => r.catalog_race_id));

      // Get user's region from profile.
      // Prefer user_id first for this environment; fallback to id on schema mismatch.
      let profile: { country?: string | null; region?: string | null } | null = null;
      logger.debug('[Debug400][getCatalogMatches] querying profile by user_id', { userId });
      const profileByUserId = await supabase
        .from('profiles')
        .select('country, region')
        .eq('user_id', userId)
        .maybeSingle();
      if (profileByUserId.error && !this.isNonCriticalSuggestionError(profileByUserId.error, 'profiles.user_id')) {
        logger.error('[Debug400][getCatalogMatches] profiles by user_id query failed (non-fallback)', {
          userId,
          error: this.debugErrorDetails(profileByUserId.error),
        });
        throw profileByUserId.error;
      }
      const shouldTryProfileById = isMissingSupabaseColumn(profileByUserId.error, 'profiles.user_id');
      if (profileByUserId.error) {
        logger.warn('[Debug400][getCatalogMatches] profiles by user_id query produced handled error', {
          userId,
          shouldTryProfileById,
          error: this.debugErrorDetails(profileByUserId.error),
        });
      }

      if (shouldTryProfileById) {
        logger.debug('[Debug400][getCatalogMatches] querying profile by id fallback', { userId });
        const profileById = await supabase
          .from('profiles')
          .select('country, region')
          .eq('id', userId)
          .maybeSingle();
        if (profileById.error && !this.isNonCriticalSuggestionError(profileById.error, 'profiles.id')) {
          logger.error('[Debug400][getCatalogMatches] profiles by id query failed (non-fallback)', {
            userId,
            error: this.debugErrorDetails(profileById.error),
          });
          throw profileById.error;
        }
        if (profileById.error) {
          logger.warn('[Debug400][getCatalogMatches] profiles by id query produced handled error', {
            userId,
            error: this.debugErrorDetails(profileById.error),
          });
        }
        profile = profileById.data;
      } else {
        profile = profileByUserId.data;
      }

      const userCountry = profile?.country;

      // Query catalog races matching boat classes or upcoming
      const now = new Date();
      const currentMonth = now.getMonth() + 1; // 1-based
      const upcomingMonths = new Set(this.getUpcomingMonthNumbers(currentMonth, 3));
      const sixMonthsFromNow = new Date(now);
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

      let query = supabase
        .from('catalog_races')
        .select('*')
        .order('follower_count', { ascending: false })
        .limit(50);

      const { data: catalogRaces, error: catalogError } = await query;
      if (catalogError) {
        throw catalogError;
      }

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
        const normalizedTypicalMonth =
          typeof race.typical_month === 'number' && race.typical_month >= 1 && race.typical_month <= 12
            ? race.typical_month
            : null;
        const monthMatch = normalizedTypicalMonth ? upcomingMonths.has(normalizedTypicalMonth) : false;
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
      throw error;
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

      const pastRaces = await this.fetchRegattasForUser(userId, {
        select: '*',
        ltStartDate: `${currentYear}-01-01T00:00:00`,
        orderBy: 'start_date',
        ascending: false,
        limit: 100,
      });

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
      throw error;
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

  private emptySuggestions(diagnostics?: SuggestionDiagnostics): CategorizedSuggestions {
    return {
      clubRaces: [],
      fleetRaces: [],
      communityRaces: [],
      catalogMatches: [],
      previousYearRaces: [],
      patterns: [],
      templates: [],
      total: 0,
      diagnostics,
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

  private categorizeSuggestions(
    suggestions: RaceSuggestion[],
    diagnostics?: SuggestionDiagnostics
  ): CategorizedSuggestions {
    return {
      clubRaces: suggestions.filter((s) => s.type === 'club_event'),
      fleetRaces: suggestions.filter((s) => s.type === 'fleet_race'),
      communityRaces: suggestions.filter((s) => s.type === 'community_race'),
      catalogMatches: suggestions.filter((s) => s.type === 'catalog_match'),
      previousYearRaces: suggestions.filter((s) => s.type === 'previous_year'),
      patterns: suggestions.filter((s) => s.type === 'pattern_match'),
      templates: suggestions.filter((s) => s.type === 'template'),
      total: suggestions.length,
      diagnostics,
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
    const normalizedMonthIndex = Number.isFinite(month)
      ? Math.max(0, Math.min(11, month))
      : now.getMonth();
    const suggestedDate = new Date(year, normalizedMonthIndex, 15); // Mid-month

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

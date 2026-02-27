import { supabase, Tables, TablesInsert, TablesUpdate } from './supabase';
import { isMissingIdColumn, isMissingRelationError } from '@/lib/utils/supabaseSchemaFallback';
import { createLogger } from '@/lib/utils/logger';

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

const isMissingColumnError = (error: any): boolean => {
  if (!error) return false;
  if (error.code === '42703') return true;
  const message = typeof error?.message === 'string' ? error.message.toLowerCase() : '';
  return message.includes('column') && message.includes('does not exist');
};
const logger = createLogger('apiService');

// ============================================================================
// Sailor Profile API
// ============================================================================

export const sailorProfileApi = {
  async getProfile(userId: string): Promise<ApiResponse<Tables<'users'>>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async updateProfile(userId: string, updates: TablesUpdate<'users'>): Promise<ApiResponse<Tables<'users'>>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  }
};

// ============================================================================
// Venues API
// ============================================================================

export const venuesApi = {
  async getVenueById(venueId: string) {
    try {
      const { data, error } = await supabase
        .from('sailing_venues')
        .select('*, regional_intelligence(*), cultural_profiles(*)')
        .eq('id', venueId)
        .single();

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async getNearbyVenues(lat: number, lng: number, radiusKm: number = 50) {
    try {
      const { data, error } = await supabase
        .rpc('venues_within_radius', { lat, lng, radius_km: radiusKm });

      if (error && (error as any)?.code?.startsWith?.('PGRST2')) {
        logger.warn('[api.venues.getNearbyVenues] RPC missing; using bbox RPC fallback');
        const latDelta = radiusKm / 111; // ~111km per degree
        const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
        const fallback = await supabase.rpc('venues_within_bbox', {
          min_lon: lng - lngDelta,
          min_lat: lat - latDelta,
          max_lon: lng + lngDelta,
          max_lat: lat + latDelta,
        });

        return { data: fallback.data as any, error: fallback.error as any, loading: false };
      }

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async getSavedVenues(userId: string) {
    try {
      const { data, error } = await supabase
        .from('saved_venues')
        .select('*, sailing_venues(*)')
        .eq('sailor_id', userId)
        .order('last_visited_at', { ascending: false });

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async saveVenue(userId: string, venueId: string) {
    try {
      const { data, error } = await supabase
        .from('saved_venues')
        .insert({ sailor_id: userId, venue_id: venueId })
        .select()
        .single();

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  }
};

// ============================================================================
// Races API
// ============================================================================

export const racesApi = {
  async getRaces(userId: string, limit: number = 20, offset: number = 0) {
    try {
      let { data, error, count } = await supabase
        .from('regatta_races')
        .select('*, regatta:regattas(*)', { count: 'exact' })
        .eq('regattas.created_by', userId)
        .order('scheduled_date', { ascending: false })
        .order('scheduled_time', { ascending: false, nullsFirst: false })
        .range(offset, offset + limit - 1);

      if (error) {
        // If still failing (e.g., table missing), return empty without throwing
        return { data: [], count: 0, page: 1, pageSize: limit, hasMore: false };
      }

      // Map to a UI-friendly shape expected by dashboard
      const mapped = (data || []).map((r: any) => ({
        ...r,
        name: r.race_name || r.regatta?.name || 'Race',
        venue: r.regatta?.venue_id || r.regatta?.name || '—',
        scheduled_start: r.scheduled_date || r.race_date || null,
      }));

      const hasMore = count ? count > offset + limit : false;

      return {
        data: mapped,
        count: count || 0,
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        hasMore
      };
    } catch (error) {
      throw error;
    }
  },

  async getRaceById(raceId: string) {
    try {
      let { data, error } = await supabase
        .from('regatta_races')
        .select('*, regatta:regattas(*)')
        .eq('id', raceId)
        .single();

      if (error) return { data: null, error, loading: false };

      const mapped = data
        ? { ...data, name: data.race_name || data.regatta?.name || 'Race', venue: data.regatta?.venue_id || data.regatta?.name || '—' }
        : null;

      return { data: mapped, error: null, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async createRace(race: TablesInsert<'races'>) {
    try {
      const { data, error } = await supabase
        .from('regatta_races')
        .insert(race as any)
        .select()
        .single();

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async updateRace(raceId: string, updates: TablesUpdate<'races'>) {
    try {
      const { data, error } = await supabase
        .from('regatta_races')
        .update(updates as any)
        .eq('id', raceId)
        .select()
        .single();

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  }
};

// ============================================================================
// Race Strategies API
// ============================================================================

export const raceStrategiesApi = {
  normalizeStrategyPayload(strategy: any) {
    if (!strategy || typeof strategy !== 'object') return strategy;

    const normalized = { ...strategy } as Record<string, any>;
    if (!normalized.regatta_id && normalized.race_id) {
      normalized.regatta_id = normalized.race_id;
    }
    delete normalized.race_id;

    if (!normalized.strategy_content) {
      const strategyContentFields = [
        'overall_approach',
        'start_strategy',
        'beat_strategy',
        'run_strategy',
        'finish_strategy',
        'mark_roundings',
        'contingencies',
        'wind_speed',
        'wind_direction',
        'current_speed',
        'current_direction',
        'wave_height',
        'simulation_results',
        'confidence',
        'course_marks',
        'course_extraction',
      ];

      const content: Record<string, any> = {};
      strategyContentFields.forEach((key) => {
        if (key in normalized && normalized[key] !== undefined) {
          content[key] = normalized[key];
          delete normalized[key];
        }
      });

      if (Object.keys(content).length > 0) {
        normalized.strategy_content = content;
      }
    }

    return normalized;
  },

  async getStrategyForRace(raceId: string) {
    try {
      const primary = await supabase
        .from('race_strategies')
        .select('*')
        .eq('regatta_id', raceId)
        .maybeSingle();

      if (!primary.error) {
        return { data: primary.data, error: null, loading: false };
      }

      // Backward-compat fallback for older schemas that still use race_id.
      if (isMissingIdColumn(primary.error, 'race_strategies', 'regatta_id')) {
        const fallback = await supabase
          .from('race_strategies')
          .select('*')
          .eq('race_id', raceId)
          .maybeSingle();
        return { data: fallback.data, error: fallback.error, loading: false };
      }

      return { data: null, error: primary.error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async createStrategy(strategy: any) {
    try {
      const normalizedStrategy = this.normalizeStrategyPayload(strategy);
      const { data, error } = await supabase
        .from('race_strategies')
        .insert(normalizedStrategy)
        .select()
        .single();

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async updateStrategy(strategyId: string, updates: any) {
    try {
      const normalizedUpdates = this.normalizeStrategyPayload(updates);
      const { data, error } = await supabase
        .from('race_strategies')
        .update(normalizedUpdates)
        .eq('id', strategyId)
        .select()
        .single();

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  }
};

// ============================================================================
// Race Performance API
// ============================================================================

export const racePerformanceApi = {
  async getPerformanceByRace(raceId: string) {
    try {
      const primary = await supabase
        .from('race_results')
        .select('*, entry:race_entries(sailor_id), race:regatta_races(*)')
        .eq('regatta_id', raceId)
        .single();

      if (!primary.error) {
        return { data: primary.data, error: null, loading: false };
      }

      if (isMissingIdColumn(primary.error, 'race_results', 'regatta_id')) {
        const fallback = await supabase
          .from('race_results')
          .select('*, entry:race_entries(sailor_id), race:regatta_races(*)')
          .eq('race_id', raceId)
          .single();
        return { data: fallback.data, error: fallback.error, loading: false };
      }

      return { data: null, error: primary.error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async getPerformanceHistory(userId: string, limit: number = 10) {
    try {
      let { data, error } = await supabase
        .from('race_results')
        .select('*, entry:race_entries(sailor_id), race:regatta_races(*)')
        .eq('entry.sailor_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async createPerformance(performance: any) {
    try {
      const { data, error } = await supabase
        .from('race_results')
        .insert(performance)
        .select()
        .single();

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  }
};

// ============================================================================
// Boats API
// ============================================================================

export const boatsApi = {
  async getBoats(userId: string) {
    try {
      // First get the sailor_profile id from user_id
      const { data: profile } = await supabase
        .from('sailor_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!profile) {
        return { data: [], error: null, loading: false };
      }

      const { data, error } = await supabase
        .from('sailor_boats')
        .select('*, boat_class:boat_classes(*)')
        .eq('sailor_id', profile.id)
        .order('is_primary', { ascending: false });

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async getBoatById(boatId: string) {
    try {
      const { data, error } = await supabase
        .from('sailor_boats')
        .select('*, boat_class:boat_classes(*)')
        .eq('id', boatId)
        .single();

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async createBoat(boat: any) {
    try {
      const { data, error } = await supabase
        .from('sailor_boats')
        .insert(boat)
        .select()
        .single();

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async updateBoat(boatId: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('sailor_boats')
        .update(updates)
        .eq('id', boatId)
        .select()
        .single();

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  }
};

// ============================================================================
// Sails & Equipment API
// ============================================================================

export const equipmentApi = {
  async getSails(boatId: string) {
    try {
      const { data, error } = await supabase
        .from('boat_equipment')
        .select('*')
        .eq('boat_id', boatId)
        .eq('category', 'sail')
        .order('is_primary', { ascending: false });

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async getEquipment(boatId: string, category?: string) {
    try {
      let query = supabase
        .from('boat_equipment')
        .select('*')
        .eq('boat_id', boatId);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async createEquipment(equipment: any) {
    try {
      const { data, error } = await supabase
        .from('boat_equipment')
        .insert(equipment)
        .select()
        .single();

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async updateEquipment(equipmentId: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('boat_equipment')
        .update(updates)
        .eq('id', equipmentId)
        .select()
        .single();

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  }
};

// ============================================================================
// Maintenance Records API
// ============================================================================

export const maintenanceApi = {
  async getMaintenanceRecords(boatId: string) {
    try {
      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*')
        .eq('boat_id', boatId)
        .order('service_date', { ascending: false });

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async createMaintenance(maintenance: any) {
    try {
      const { data, error } = await supabase
        .from('maintenance_records')
        .insert(maintenance)
        .select()
        .single();

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  }
};

// ============================================================================
// Fleets API
// ============================================================================

export const fleetsApi = {
  async getFleets(userId: string) {
    try {
      const { data, error } = await supabase
        .from('fleet_members')
        .select('*, fleet:fleets(*)')
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async getFleetById(fleetId: string) {
    try {
      const { data, error } = await supabase
        .from('fleets')
        .select('*')
        .eq('id', fleetId)
        .single();

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async getFleetMembers(fleetId: string) {
    try {
      const { data, error } = await supabase
        .from('fleet_members')
        .select('*, sailor:users(*)')
        .eq('fleet_id', fleetId)
        .order('joined_at', { ascending: false });

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async joinFleet(userId: string, fleetId: string) {
    try {
      const { data, error } = await supabase
        .from('fleet_members')
        .insert({ user_id: userId, fleet_id: fleetId })
        .select()
        .single();

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  }
};

// ============================================================================
// Clubs API
// ============================================================================

export const clubsApi = {
  async getClubs(userId: string) {
    try {
      const sortMemberships = (rows: any[] | null | undefined) => {
        const list = [...(rows || [])];
        return list.sort((a, b) => {
          const aTs = new Date(a?.created_at || a?.joined_at || a?.joined_date || 0).getTime();
          const bTs = new Date(b?.created_at || b?.joined_at || b?.joined_date || 0).getTime();
          return bTs - aTs;
        });
      };

      const loadGlobalMembershipFallback = async (
        existingMemberships: any[]
      ): Promise<any[]> => {
        const globalMembershipResult = await supabase
          .from('global_club_members')
          .select('id, user_id, global_club_id, role, created_at')
          .eq('user_id', userId);

        if (globalMembershipResult.error) {
          if (isMissingRelationError(globalMembershipResult.error)) {
            return [];
          }
          logger.warn('⚠️ [getClubs] Unable to load global_club_members fallback:', globalMembershipResult.error);
          return [];
        }

        const globalMemberships = (globalMembershipResult.data || []) as any[];
        if (globalMemberships.length === 0) {
          return [];
        }

        const globalClubIds = Array.from(
          new Set(globalMemberships.map((membership: any) => membership?.global_club_id).filter(Boolean))
        ) as string[];

        const globalClubById = new Map<string, any>();
        if (globalClubIds.length > 0) {
          const globalClubsResult = await supabase
            .from('global_clubs')
            .select(
              'id, name, short_name, description, city, country, website, logo_url, platform_club_id'
            )
            .in('id', globalClubIds);

          if (globalClubsResult.error) {
            logger.warn('⚠️ [getClubs] Unable to load global_clubs metadata:', globalClubsResult.error);
          } else {
            (globalClubsResult.data || []).forEach((club: any) => {
              if (club?.id) globalClubById.set(club.id, club);
            });
          }
        }

        const existingClubIds = new Set(
          existingMemberships.map((membership: any) => membership?.club_id).filter(Boolean)
        );

        const mapped = globalMemberships
          .map((membership: any, index: number) => {
            const globalClub = membership?.global_club_id
              ? globalClubById.get(membership.global_club_id)
              : null;
            const resolvedClubId =
              globalClub?.platform_club_id || membership?.global_club_id || null;

            if (!resolvedClubId) return null;
            if (existingClubIds.has(resolvedClubId)) return null;

            const clubPayload = {
              id: resolvedClubId,
              name: globalClub?.name || `Club ${String(resolvedClubId).slice(0, 8)}`,
              address: globalClub?.city || null,
              website: globalClub?.website || null,
              email: null,
              description: globalClub?.description || null,
              country: globalClub?.country || null,
              logo_url: globalClub?.logo_url || null,
              source_table: 'global_clubs',
              global_club_id: membership?.global_club_id || null,
            };

            return {
              id: membership?.id || `global-${resolvedClubId}-${index}`,
              club_id: resolvedClubId,
              user_id: membership?.user_id || userId,
              membership_type: membership?.role || 'member',
              status: 'active',
              role: membership?.role || 'member',
              joined_date: membership?.created_at || null,
              joined_at: membership?.created_at || null,
              created_at: membership?.created_at || null,
              updated_at: membership?.created_at || null,
              club: clubPayload,
              clubs: clubPayload,
              club_profiles: null,
              yacht_clubs: null,
              source_membership_table: 'global_club_members',
            };
          })
          .filter(Boolean) as any[];

        return mapped;
      };

      const fullMembershipQuery = await supabase
        .from('club_members')
        .select(`
          id,
          club_id,
          user_id,
          membership_type,
          status,
          role,
          member_number,
          joined_date,
          joined_at,
          expiry_date,
          payment_status,
          total_volunteer_hours,
          membership_number,
          membership_start,
          membership_end,
          is_active,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false, nullsFirst: false });

      let data: any[] | null = fullMembershipQuery.data as any[] | null;
      let error = fullMembershipQuery.error;

      if (error && isMissingColumnError(error)) {
        logger.warn('⚠️ [getClubs] club_members schema drift detected; retrying with compatible column set');
        const compactMembershipQuery = await supabase
          .from('club_members')
          .select('id, club_id, user_id, membership_type, status, role, joined_at, joined_date, is_active, created_at')
          .eq('user_id', userId);

        data = compactMembershipQuery.data as any[] | null;
        error = compactMembershipQuery.error;
      }

      if (error) {
        if (isMissingRelationError(error)) {
          logger.warn('🔄 [getClubs] club_members table not available, falling back to legacy club_memberships');
          const legacyResult = await supabase
            .from('club_memberships')
            .select('*')
            .eq('user_id', userId)
            .order('joined_at', { ascending: false });

          if (
            legacyResult.error &&
            (legacyResult.error.message?.includes('relation') ||
              legacyResult.error.message?.includes('does not exist'))
          ) {
            logger.warn('⚠️ [getClubs] Club membership tables not yet created, returning empty array');
            return { data: [], error: null, loading: false };
          }

          const legacyMemberships = legacyResult.data || [];
          const legacyClubIds = Array.from(
            new Set(legacyMemberships.map((membership: any) => membership?.club_id).filter(Boolean))
          ) as string[];
          const legacyClubById = new Map<string, any>();

          if (legacyClubIds.length > 0) {
            const { data: legacyClubData } = await supabase
              .from('yacht_clubs')
              .select('*')
              .in('id', legacyClubIds);
            (legacyClubData || []).forEach((club: any) => {
              if (club?.id) legacyClubById.set(club.id, club);
            });
          }

          const enrichedLegacyMemberships = legacyMemberships.map((membership: any) => ({
            ...membership,
            club: membership.club_id ? legacyClubById.get(membership.club_id) || null : null,
          }));
          const globalMembershipFallback = await loadGlobalMembershipFallback(enrichedLegacyMemberships);

          return {
            data: sortMemberships([...enrichedLegacyMemberships, ...globalMembershipFallback]),
            error: legacyResult.error,
            loading: false,
          };
        }

        logger.error('❌ [getClubs] Returning error:', error.message);
        return { data: [], error, loading: false };
      }

      const memberships = sortMemberships(data);
      const clubIds = Array.from(
        new Set(memberships.map((membership: any) => membership?.club_id).filter(Boolean))
      ) as string[];

      const clubsById = new Map<string, any>();
      const clubProfilesById = new Map<string, any>();
      const yachtClubsById = new Map<string, any>();

      if (clubIds.length > 0) {
        const { data: clubsData, error: clubsError } = await supabase
          .from('clubs')
          .select('id, name, address, website, email, description')
          .in('id', clubIds);

        if (!clubsError && clubsData) {
          clubsData.forEach((club: any) => clubsById.set(club.id, club));
        }

        const unresolvedClubIds = clubIds.filter((clubId) => !clubsById.has(clubId));
        if (clubsError || unresolvedClubIds.length > 0) {
          if (clubsError) {
            logger.warn('⚠️ [getClubs] clubs table lookup failed, trying club_profiles fallback');
          }

          const idsToResolve = clubsError ? clubIds : unresolvedClubIds;
          const { data: clubProfilesData, error: clubProfilesError } = await supabase
            .from('club_profiles')
            .select(
              'id, club_name, organization_name, website_url, contact_email, city, country, description'
            )
            .in('id', idsToResolve);

          if (!clubProfilesError && clubProfilesData) {
            clubProfilesData.forEach((profile: any) => clubProfilesById.set(profile.id, profile));
          }
        }

        const stillUnresolvedClubIds = clubIds.filter(
          (clubId) => !clubsById.has(clubId) && !clubProfilesById.has(clubId)
        );
        if (clubsError || stillUnresolvedClubIds.length > 0) {
          if (clubsError) {
            logger.warn('⚠️ [getClubs] clubs table lookup failed, trying yacht_clubs fallback');
          }
          const { data: yachtData, error: yachtError } = await supabase
            .from('yacht_clubs')
            .select('id, name, location, country, website, contact_email, description, facilities, metadata')
            .in('id', clubsError ? clubIds : stillUnresolvedClubIds);

          if (!yachtError && yachtData) {
            yachtData.forEach((club: any) => yachtClubsById.set(club.id, club));
          }
        }
      }

      const enrichedMemberships = memberships.map((membership: any) => ({
        ...membership,
        club:
          membership.club_id
            ? clubsById.get(membership.club_id) ||
              clubProfilesById.get(membership.club_id) ||
              yachtClubsById.get(membership.club_id) ||
              null
            : null,
        clubs: membership.club_id ? clubsById.get(membership.club_id) || null : null,
        club_profiles:
          membership.club_id && clubProfilesById.has(membership.club_id)
            ? {
                id: membership.club_id,
                name:
                  clubProfilesById.get(membership.club_id)?.organization_name ||
                  clubProfilesById.get(membership.club_id)?.club_name ||
                  'Sailing Club',
                location: clubProfilesById.get(membership.club_id)?.city || null,
                country: clubProfilesById.get(membership.club_id)?.country || null,
                website:
                  clubProfilesById.get(membership.club_id)?.website_url || null,
                contact_email:
                  clubProfilesById.get(membership.club_id)?.contact_email || null,
                description:
                  clubProfilesById.get(membership.club_id)?.description || null,
              }
            : null,
        yacht_clubs: membership.club_id ? yachtClubsById.get(membership.club_id) || null : null,
      }));

      const globalMembershipFallback = await loadGlobalMembershipFallback(enrichedMemberships);
      const mergedMemberships = sortMemberships([...enrichedMemberships, ...globalMembershipFallback]);

      return {
        data: mergedMemberships,
        error: null,
        loading: false,
      };
    } catch (error) {
      logger.error('❌ [getClubs] Exception caught:', error);
      return { data: [], error: error as Error, loading: false };
    }
  },

  async getClubDirectory() {
    try {
      const globalResult = await supabase
        .from('global_clubs')
        .select('id, name, short_name, city, country, website, description, logo_url, platform_club_id')
        .order('name', { ascending: true });

      const normalizedGlobal = !globalResult.error && globalResult.data
        ? globalResult.data.map((club: any) => ({
            id: club.platform_club_id || club.id,
            name: club.name,
            short_name: club.short_name || null,
            address: club.city || null,
            website: club.website || null,
            email: null,
            description: club.description || null,
            country: club.country || null,
            logo_url: club.logo_url || null,
            source_table: 'global_clubs',
            global_club_id: club.id,
            platform_club_id: club.platform_club_id || null,
          }))
        : [];

      const clubsResult = await supabase
        .from('clubs')
        .select('*')
        .order('name', { ascending: true });

      if (!clubsResult.error && clubsResult.data && clubsResult.data.length > 0) {
        const merged = [...normalizedGlobal, ...clubsResult.data];
        const deduped = Array.from(
          new Map(merged.map((club: any) => [club.id, club])).values()
        );
        return { data: deduped, error: null, loading: false };
      }

      const yachtResult = await supabase
        .from('yacht_clubs')
        .select('id, name, location, country, website, contact_email, description')
        .order('name', { ascending: true });

      if (!yachtResult.error && yachtResult.data && yachtResult.data.length > 0) {
        const mapped = yachtResult.data.map((club: any) => ({
          id: club.id,
          name: club.name,
          address: club.location || null,
          website: club.website || null,
          email: club.contact_email || null,
          description: club.description || null,
          country: club.country || null,
          source_table: 'yacht_clubs',
        }));
        const merged = [...normalizedGlobal, ...mapped];
        const deduped = Array.from(
          new Map(merged.map((club: any) => [club.id, club])).values()
        );
        return { data: deduped, error: null, loading: false };
      }

      const profilesResult = await supabase
        .from('club_profiles')
        .select('id, club_name, organization_name, city, country, website_url, contact_email, description')
        .order('organization_name', { ascending: true });

      if (!profilesResult.error && profilesResult.data && profilesResult.data.length > 0) {
        const mapped = profilesResult.data.map((club: any) => ({
          id: club.id,
          name: club.organization_name || club.club_name || 'Sailing Club',
          address: club.city || null,
          website: club.website_url || null,
          email: club.contact_email || null,
          description: club.description || null,
          country: club.country || null,
          source_table: 'club_profiles',
        }));
        const merged = [...normalizedGlobal, ...mapped];
        const deduped = Array.from(
          new Map(merged.map((club: any) => [club.id, club])).values()
        );
        return { data: deduped, error: null, loading: false };
      }

      return {
        data: normalizedGlobal,
        error: clubsResult.error || yachtResult.error || profilesResult.error,
        loading: false,
      };
    } catch (error) {
      logger.error('[apiService] Exception in getClubDirectory:', error);
      return { data: [], error: error as Error, loading: false };
    }
  },

  async getClubById(clubId: string) {
    try {
      const yachtResult = await supabase
        .from('yacht_clubs')
        .select('*')
        .eq('id', clubId)
        .single();

      if (!yachtResult.error && yachtResult.data) {
        return { data: yachtResult.data, error: null, loading: false };
      }

      const clubsResult = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .maybeSingle();
      if (!clubsResult.error && clubsResult.data) {
        return { data: clubsResult.data, error: null, loading: false };
      }

      const profileResult = await supabase
        .from('club_profiles')
        .select('id, club_name, organization_name, city, country, website_url, contact_email, description')
        .eq('id', clubId)
        .maybeSingle();
      if (!profileResult.error && profileResult.data) {
        const mapped = {
          id: profileResult.data.id,
          name: profileResult.data.organization_name || profileResult.data.club_name || 'Sailing Club',
          location: profileResult.data.city || null,
          country: profileResult.data.country || null,
          website: profileResult.data.website_url || null,
          contact_email: profileResult.data.contact_email || null,
          description: profileResult.data.description || null,
          source_table: 'club_profiles',
        };
        return { data: mapped, error: null, loading: false };
      }

      return {
        data: null,
        error: yachtResult.error || clubsResult.error || profileResult.error,
        loading: false,
      };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async joinClub(userId: string, clubId: string, membershipType: string) {
    const upsertGlobalMembership = async (globalClubId: string) => {
      const globalResult = await supabase
        .from('global_club_members')
        .insert({
          user_id: userId,
          global_club_id: globalClubId,
          role: membershipType === 'admin' ? 'admin' : 'member',
        })
        .select()
        .single();

      if (globalResult.error && globalResult.error.code !== '23505') {
        return { data: null, error: globalResult.error, loading: false };
      }

      if (globalResult.error?.code === '23505') {
        // Already joined globally; treat as success and return existing row if possible.
        const existing = await supabase
          .from('global_club_members')
          .select('*')
          .eq('user_id', userId)
          .eq('global_club_id', globalClubId)
          .maybeSingle();
        return { data: existing.data || null, error: existing.error, loading: false };
      }

      return { data: globalResult.data, error: null, loading: false };
    };

    // Resolve whether this ID maps to a global club (and potentially a platform club).
    const globalLookup = await supabase
      .from('global_clubs')
      .select('id, platform_club_id')
      .or(`id.eq.${clubId},platform_club_id.eq.${clubId}`)
      .limit(1)
      .maybeSingle();

    const globalClubId = globalLookup.data?.id || null;
    const mappedPlatformClubId = globalLookup.data?.platform_club_id || null;
    const resolvedClubId = mappedPlatformClubId || clubId;

    const payload = {
      user_id: userId,
      club_id: resolvedClubId,
      membership_type: membershipType,
      role: membershipType === 'admin' ? 'admin' : 'member',
      status: 'pending',
      is_active: true,
      joined_date: new Date().toISOString(),
    };

    try {
      const insertResult = await supabase
        .from('club_members')
        .insert(payload)
        .select()
        .single();

      let data = insertResult.data;
      let error = insertResult.error;

      if (error && isMissingColumnError(error)) {
        logger.warn('⚠️ [joinClub] club_members schema drift detected; retrying with minimal payload');
        const fallbackInsert = await supabase
          .from('club_members')
          .insert({
            user_id: userId,
            club_id: resolvedClubId,
            membership_type: membershipType,
            status: 'pending',
          })
          .select()
          .single();

        data = fallbackInsert.data;
        error = fallbackInsert.error;
      }

      if (error) {
        // If this selection came from global directory and no platform row exists,
        // persist membership in unified global_club_members.
        if (globalClubId && !mappedPlatformClubId) {
          return upsertGlobalMembership(globalClubId);
        }

        // Platform FK failures can happen if selected ID is effectively global-only.
        if ((error as any)?.code === '23503' && globalClubId) {
          return upsertGlobalMembership(globalClubId);
        }

        if (isMissingRelationError(error)) {
          logger.warn('club_members table unavailable, inserting into legacy club_memberships instead');
          const legacyResult = await supabase
            .from('club_memberships')
            .insert({ user_id: userId, club_id: resolvedClubId, membership_type: membershipType })
            .select()
            .single();

          return { data: legacyResult.data, error: legacyResult.error, loading: false };
        }

        return { data: null, error, loading: false };
      }

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  }
};

// ============================================================================
// Venue Intelligence API
// ============================================================================

export const venueIntelligenceApi = {
  async getVenueIntelligence(venueId: string) {
    try {
      const { data, error } = await supabase
        .from('regional_intelligence')
        .select('*')
        .eq('venue_id', venueId)
        .single();

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async getCulturalProfile(venueId: string) {
    try {
      const { data, error } = await supabase
        .from('cultural_profiles')
        .select('*')
        .eq('venue_id', venueId)
        .single();

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  }
};

// ============================================================================
// Regattas API
// ============================================================================

export const regattasApi = {
  async getRegattas(userId: string) {
    try {
      const { data, error } = await supabase
        .from('regattas')
        .select('*')
        .eq('created_by', userId)
        .order('start_date', { ascending: false });

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async getRegattaById(regattaId: string) {
    try {
      const { data, error } = await supabase
        .from('regattas')
        .select('*')
        .eq('id', regattaId)
        .single();

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async createRegatta(regatta: TablesInsert<'regattas'>) {
    try {
      const { data, error } = await supabase
        .from('regattas')
        .insert(regatta)
        .select()
        .single();

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async updateRegatta(regattaId: string, updates: TablesUpdate<'regattas'>) {
    try {
      const { data, error } = await supabase
        .from('regattas')
        .update(updates)
        .eq('id', regattaId)
        .select()
        .single();

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  }
};

// ============================================================================
// Export all APIs
// ============================================================================

export default {
  sailorProfile: sailorProfileApi,
  venues: venuesApi,
  races: racesApi,
  raceStrategies: raceStrategiesApi,
  racePerformance: racePerformanceApi,
  boats: boatsApi,
  equipment: equipmentApi,
  maintenance: maintenanceApi,
  fleets: fleetsApi,
  clubs: clubsApi,
  venueIntelligence: venueIntelligenceApi,
  regattas: regattasApi,
  // Export supabase client for direct queries
  supabase
};

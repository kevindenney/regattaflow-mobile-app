import { supabase, Tables, TablesInsert, TablesUpdate } from './supabase';

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
        console.warn('[api.venues.getNearbyVenues] RPC missing; using bbox RPC fallback');
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
        .eq('regattas.user_id', userId)
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
  async getStrategyForRace(raceId: string) {
    try {
      const { data, error } = await supabase
        .from('race_strategies')
        .select('*')
        .eq('race_id', raceId)
        .maybeSingle();

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async createStrategy(strategy: any) {
    try {
      const { data, error } = await supabase
        .from('race_strategies')
        .insert(strategy)
        .select()
        .single();

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async updateStrategy(strategyId: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('race_strategies')
        .update(updates)
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
      const { data, error } = await supabase
        .from('race_results')
        .select('*, entry:race_entries(sailor_id), race:regatta_races(*)')
        .eq('race_id', raceId)
        .single();

      return { data, error, loading: false };
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

const isMissingRelation = (error: any) =>
  typeof error?.message === 'string' &&
  (error.message.includes('relation') || error.message.includes('does not exist'));

export const clubsApi = {
  async getClubs(userId: string) {
    try {
      console.log('🔍 [getClubs] Starting with userId:', userId);

      // Check current auth session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔐 [getClubs] Current session:', {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        matchesProvidedUserId: session?.user?.id === userId
      });

      // Try joining with the clubs table (UUID-based)
      // Note: Using clubs(...) syntax instead of clubs!club_id to avoid foreign key requirement
      console.log('🔍 [getClubs] Querying club_members with clubs join...');
      const { data, error } = await supabase
        .from('club_members')
        .select(`
          id,
          club_id,
          user_id,
          role,
          membership_number,
          membership_start,
          membership_end,
          is_active,
          created_at,
          updated_at,
          clubs (
            id,
            name,
            address,
            website,
            email,
            description
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false, nullsFirst: false });

      console.log('📊 [getClubs] clubs join result:', {
        hasData: !!data,
        dataLength: data?.length,
        hasError: !!error,
        errorMessage: error?.message,
        errorDetails: error?.details,
        errorHint: error?.hint
      });

      if (error) {
        console.warn('⚠️ [getClubs] Primary query failed, checking error type...');

        // If clubs join fails, try yacht_clubs (string ID-based)
        if (error.message.includes('foreign key') || error.message.includes('clubs')) {
          console.warn('🔄 [getClubs] Trying yacht_clubs join instead of clubs');
          const yachtResult = await supabase
            .from('club_members')
            .select(`
              id,
              club_id,
              membership_type,
              status,
              role,
              member_number,
              joined_date,
              joined_at,
              expiry_date,
              payment_status,
              total_volunteer_hours,
              yacht_clubs:club_id (
                id,
                name,
                location,
                country,
                website,
                contact_email,
                description,
                facilities,
                metadata
              )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false, nullsFirst: false });

          console.log('📊 [getClubs] yacht_clubs join result:', {
            hasData: !!yachtResult.data,
            dataLength: yachtResult.data?.length,
            hasError: !!yachtResult.error,
            errorMessage: yachtResult.error?.message
          });

          if (!yachtResult.error) {
            console.log('✅ [getClubs] Successfully returned data from yacht_clubs join');
            return { data: yachtResult.data, error: null, loading: false };
          }
        }

        if (isMissingRelation(error)) {
          console.warn('🔄 [getClubs] club_members table not available, falling back to legacy club_memberships');
          const legacyResult = await supabase
            .from('club_memberships')
            .select('*, club:yacht_clubs(*)')
            .eq('user_id', userId)
            .order('joined_at', { ascending: false });

          console.log('📊 [getClubs] legacy club_memberships result:', {
            hasData: !!legacyResult.data,
            dataLength: legacyResult.data?.length,
            hasError: !!legacyResult.error,
            errorMessage: legacyResult.error?.message
          });

          if (
            legacyResult.error &&
            (legacyResult.error.message?.includes('relation') ||
              legacyResult.error.message?.includes('does not exist'))
          ) {
            console.warn('⚠️ [getClubs] Club membership tables not yet created, returning empty array');
            return { data: [], error: null, loading: false };
          }

          console.log('✅ [getClubs] Returning legacy club_memberships data');
          return { data: legacyResult.data, error: legacyResult.error, loading: false };
        }

        console.error('❌ [getClubs] Returning error:', error.message);
        return { data: [], error, loading: false };
      }

      console.log('✅ [getClubs] Successfully returning data from clubs join:', {
        count: data?.length,
        clubs: data?.map((m: any) => m.club?.name)
      });
      return {
        data,
        error: null,
        loading: false,
      };
    } catch (error) {
      console.error('❌ [getClubs] Exception caught:', error);
      return { data: [], error: error as Error, loading: false };
    }
  },

  async getClubDirectory() {
    try {
      console.log('[apiService] Fetching club directory...');
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .order('name', { ascending: true });

      console.log('[apiService] Club directory response:', {
        hasData: !!data,
        dataLength: data?.length,
        error: error?.message,
        errorCode: error?.code,
        sampleClub: data?.[0],
      });

      return { data, error, loading: false };
    } catch (error) {
      console.error('[apiService] Exception in getClubDirectory:', error);
      return { data: [], error: error as Error, loading: false };
    }
  },

  async getClubById(clubId: string) {
    try {
      const { data, error } = await supabase
        .from('yacht_clubs')
        .select('*')
        .eq('id', clubId)
        .single();

      return { data, error, loading: false };
    } catch (error) {
      return { data: null, error: error as Error, loading: false };
    }
  },

  async joinClub(userId: string, clubId: string, membershipType: string) {
    const payload = {
      user_id: userId,
      club_id: clubId,
      membership_type: membershipType,
      role: membershipType === 'admin' ? 'admin' : 'member',
      status: 'pending',
      is_active: true,
      joined_date: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('club_members')
        .insert(payload)
        .select()
        .single();

      if (error) {
        if (isMissingRelation(error)) {
          console.warn('club_members table unavailable, inserting into legacy club_memberships instead');
          const legacyResult = await supabase
            .from('club_memberships')
            .insert({ user_id: userId, club_id: clubId, membership_type: membershipType })
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
        .eq('user_id', userId)
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

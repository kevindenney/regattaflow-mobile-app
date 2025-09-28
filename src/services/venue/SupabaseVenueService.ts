/**
 * Supabase Venue Intelligence Service
 * Integrates global venue database with Supabase for persistent storage and real-time updates
 * Leverages Supabase MCP for seamless database operations
 */

import { supabase } from '@/src/services/supabase';
import type {
  SailingVenue,
  VenueType,
  Coordinates,
  YachtClub,
  UserVenueProfile,
  VenueTransition,
  CulturalBriefing,
  GlobalRacingEvent
} from '@/src/lib/types/global-venues';

export class SupabaseVenueService {
  constructor() {
    console.log('🌍 SupabaseVenueService initialized with MCP integration');
  }

  /**
   * Initialize database schema and seed with global venues
   */
  async initializeVenueSchema(): Promise<void> {
    console.log('🌍 [DEBUG] Initializing Supabase venue schema...');
    console.log('🌍 [DEBUG] Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...');
    console.log('🌍 [DEBUG] Supabase Key exists:', !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

    try {
      // Test basic Supabase connection first
      console.log('🔍 [DEBUG] Testing basic Supabase connection...');
      const { data: testData, error: testError } = await supabase
        .from('_dummy_table_that_should_not_exist')
        .select('*')
        .limit(1);

      if (testError) {
        console.log('✅ [DEBUG] Supabase connection working (expected error for non-existent table)');
        console.log('🔍 [DEBUG] Connection error details:', {
          code: testError.code,
          message: testError.message,
          hint: testError.hint
        });
      }

      // Check if sailing_venues table exists
      console.log('🔍 [DEBUG] Checking if sailing_venues table exists...');
      const { data: existingData, error: existingError } = await supabase
        .from('sailing_venues')
        .select('id')
        .limit(1);

      if (existingError) {
        console.log('❌ [DEBUG] sailing_venues table does not exist:', existingError.message);
        console.log('🌱 [DEBUG] Will attempt to seed database...');
      } else {
        console.log('✅ [DEBUG] sailing_venues table exists, contains data:', existingData?.length || 0);
      }

      // Always try to seed - the seeding function will handle duplicates
      console.log('🌱 [DEBUG] Starting seeding process...');
      await this.seedGlobalVenues();
      console.log('✅ Supabase venue schema initialized successfully');

    } catch (error: any) {
      console.error('❌ [DEBUG] Failed to initialize venue schema:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack?.substring(0, 500)
      });
      throw new Error(`Schema initialization failed: ${error.message}`);
    }
  }

  /**
   * Get venue by location with GPS-based detection
   */
  async findVenueByLocation(
    coordinates: Coordinates,
    radiusKm: number = 50,
    userId?: string
  ): Promise<SailingVenue | null> {
    const [longitude, latitude] = coordinates;

    console.log(`🌍 Finding venue near [${latitude}, ${longitude}] within ${radiusKm}km`);

    try {
      // Use PostGIS for geographic queries
      const { data, error } = await supabase.rpc('find_venues_by_location', {
        lat: latitude,
        lng: longitude,
        radius_km: radiusKm
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const venue = data[0] as SailingVenue;
        console.log(`✅ Found venue: ${venue.name} (${data[0].distance_km?.toFixed(1)}km away)`);

        // Track venue detection if user provided
        if (userId) {
          await this.trackVenueDetection(userId, venue.id, 'gps', data[0].distance_km);
        }

        return venue;
      }

      console.log(`ℹ️ No venue found within ${radiusKm}km`);
      return null;

    } catch (error: any) {
      console.error('❌ Failed to find venue by location:', error);
      throw new Error(`Location-based venue search failed: ${error.message}`);
    }
  }

  /**
   * Get all venues from database
   */
  async getAllVenues(): Promise<SailingVenue[]> {
    console.log('🌍 [GET DEBUG] Loading all venues from Supabase PostGIS database...');

    try {
      // First, try to initialize/seed if needed
      console.log('🔄 [GET DEBUG] Calling initializeVenueSchema()...');
      await this.initializeVenueSchema();
      console.log('✅ [GET DEBUG] initializeVenueSchema() completed');

      console.log('📤 [GET DEBUG] Querying sailing_venues table...');
      const { data, error } = await supabase
        .from('sailing_venues')
        .select(`
          *,
          yacht_clubs (*)
        `)
        .order('name');

      if (error) {
        console.error('❌ [GET DEBUG] Query failed:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ [GET DEBUG] Query successful');
      console.log(`🔍 [GET DEBUG] Raw data count: ${data?.length || 0}`);
      console.log('🔍 [GET DEBUG] First venue sample:', data?.[0] ? {
        id: data[0].id,
        name: data[0].name,
        coordinates_lng: data[0].coordinates_lng,
        coordinates_lat: data[0].coordinates_lat
      } : 'No data');

      if (data && data.length > 0) {
        console.log(`✅ [GET DEBUG] Loaded ${data.length} venues from Supabase, starting transformation...`);

        // Transform to match our SailingVenue interface
        const venues: SailingVenue[] = data.map(venue => ({
          id: venue.id,
          name: venue.name,
          coordinates: [venue.coordinates_lng, venue.coordinates_lat],
          country: venue.country,
          region: venue.region,
          venueType: venue.venue_type,
          establishedYear: venue.established_year,
          timeZone: venue.time_zone,
          primaryClubs: venue.yacht_clubs || [],
          sailingConditions: {
            windPatterns: [],
            typicalConditions: {
              windSpeed: { min: 5, max: 25, average: 15 },
              windDirection: { primary: 180 },
              waveHeight: { typical: 1, maximum: 3 },
              visibility: { typical: 10, minimum: 2 }
            },
            seasonalVariations: [],
            hazards: [],
            racingAreas: []
          },
          culturalContext: {
            primaryLanguages: [{ code: 'en', name: 'English', prevalence: 'primary' }],
            sailingCulture: {
              tradition: 'modern',
              competitiveness: 'regional',
              formality: 'relaxed',
              inclusivity: 'welcoming',
              characteristics: []
            },
            racingCustoms: [],
            socialProtocols: [],
            economicFactors: {
              currency: 'USD',
              costLevel: 'moderate',
              entryFees: { typical: 200, range: { min: 100, max: 500 } },
              accommodation: { budget: 100, moderate: 200, luxury: 400 },
              dining: { budget: 20, moderate: 50, upscale: 100 },
              services: { rigger: 200, sail_repair: 150, chandlery: 'moderate' },
              tipping: { expected: false, contexts: [] }
            },
            regulatoryEnvironment: {
              racingRules: { authority: 'World Sailing', variations: [] },
              safetyRequirements: [],
              environmentalRestrictions: [],
              entryRequirements: []
            }
          },
          weatherSources: {
            primary: {
              name: 'Generic Weather Service',
              type: 'commercial',
              region: venue.region,
              accuracy: 'moderate',
              forecastHorizon: 72,
              updateFrequency: 6,
              specialties: []
            },
            secondary: [],
            updateFrequency: 6,
            reliability: 0.8
          },
          localServices: [],
          createdAt: new Date(venue.created_at),
          updatedAt: new Date(venue.updated_at),
          dataQuality: venue.data_quality
        }));

        return venues;
      }

      console.log('ℹ️ No venues found in database');
      return [];

    } catch (error: any) {
      console.error('❌ Failed to load all venues:', error);
      throw new Error(`Failed to load venues from database: ${error.message}`);
    }
  }

  /**
   * Get venue with full intelligence data
   */
  async getVenueWithIntelligence(venueId: string, userId?: string): Promise<SailingVenue | null> {
    console.log(`🌍 Getting venue intelligence for: ${venueId}`);

    try {
      const { data, error } = await supabase
        .from('sailing_venues')
        .select(`
          *,
          yacht_clubs (*),
          venue_conditions (*),
          cultural_profiles (*),
          weather_sources (*),
          user_venue_profiles!inner (
            familiarity_level,
            visit_count,
            last_visit,
            racing_history,
            preferences
          )
        `)
        .eq('id', venueId)
        .eq('user_venue_profiles.user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        console.log(`✅ Retrieved venue intelligence: ${data.name}`);
        return data as SailingVenue;
      }

      // If no user profile exists, get venue without user data
      const { data: venueData, error: venueError } = await supabase
        .from('sailing_venues')
        .select(`
          *,
          yacht_clubs (*),
          venue_conditions (*),
          cultural_profiles (*),
          weather_sources (*)
        `)
        .eq('id', venueId)
        .single();

      if (venueError) throw venueError;

      console.log(`✅ Retrieved venue (no user profile): ${venueData.name}`);
      return venueData as SailingVenue;

    } catch (error: any) {
      console.error('❌ Failed to get venue intelligence:', error);
      return null;
    }
  }

  /**
   * Search venues globally with fuzzy matching
   */
  async searchVenues(
    query: string,
    filters?: {
      venueType?: VenueType[];
      region?: string;
      country?: string;
      limit?: number;
    }
  ): Promise<SailingVenue[]> {
    console.log(`🌍 Searching venues: "${query}"`);

    try {
      let queryBuilder = supabase
        .from('sailing_venues')
        .select(`
          *,
          yacht_clubs (*)
        `);

      // Add text search
      if (query.trim()) {
        queryBuilder = queryBuilder.textSearch('search_vector', query, {
          type: 'websearch',
          config: 'english'
        });
      }

      // Add filters
      if (filters?.venueType) {
        queryBuilder = queryBuilder.in('venue_type', filters.venueType);
      }
      if (filters?.region) {
        queryBuilder = queryBuilder.eq('region', filters.region);
      }
      if (filters?.country) {
        queryBuilder = queryBuilder.eq('country', filters.country);
      }

      // Limit results
      queryBuilder = queryBuilder.limit(filters?.limit || 20);

      const { data, error } = await queryBuilder;

      if (error) throw error;

      console.log(`✅ Found ${data?.length || 0} venues matching "${query}"`);
      return (data || []) as SailingVenue[];

    } catch (error: any) {
      console.error('❌ Venue search failed:', error);
      return [];
    }
  }

  /**
   * Get nearby venues for circuit planning
   */
  async getNearbyVenues(
    coordinates: Coordinates,
    maxDistanceKm: number = 500,
    limit: number = 10
  ): Promise<Array<SailingVenue & { distance_km: number }>> {
    const [longitude, latitude] = coordinates;

    console.log(`🌍 Getting venues within ${maxDistanceKm}km of [${latitude}, ${longitude}]`);

    try {
      const { data, error } = await supabase.rpc('get_nearby_venues', {
        lat: latitude,
        lng: longitude,
        max_distance_km: maxDistanceKm,
        result_limit: limit
      });

      if (error) throw error;

      console.log(`✅ Found ${data?.length || 0} nearby venues`);
      return data || [];

    } catch (error: any) {
      console.error('❌ Failed to get nearby venues:', error);
      return [];
    }
  }

  /**
   * Create or update user venue profile
   */
  async upsertUserVenueProfile(
    userId: string,
    venueId: string,
    updates: Partial<UserVenueProfile>
  ): Promise<UserVenueProfile | null> {
    console.log(`🌍 Updating user venue profile: ${userId} @ ${venueId}`);

    try {
      const { data, error } = await supabase
        .from('user_venue_profiles')
        .upsert({
          user_id: userId,
          venue_id: venueId,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ User venue profile updated');
      return data as UserVenueProfile;

    } catch (error: any) {
      console.error('❌ Failed to update user venue profile:', error);
      return null;
    }
  }

  /**
   * Record venue transition for analytics
   */
  async recordVenueTransition(
    userId: string,
    transition: Omit<VenueTransition, 'transitionDate'>
  ): Promise<void> {
    console.log(`🌍 Recording venue transition: ${transition.fromVenue?.name || 'Unknown'} → ${transition.toVenue.name}`);

    try {
      const { error } = await supabase
        .from('venue_transitions')
        .insert({
          user_id: userId,
          from_venue_id: transition.fromVenue?.id,
          to_venue_id: transition.toVenue.id,
          transition_type: transition.transitionType,
          transition_date: new Date().toISOString(),
          adaptation_required: transition.adaptationRequired?.length > 0,
          metadata: {
            adaptations: transition.adaptationRequired,
            cultural_briefing: transition.culturalBriefing
          }
        });

      if (error) throw error;

      console.log('✅ Venue transition recorded');

      // Update visit count and last visit
      await this.upsertUserVenueProfile(userId, transition.toVenue.id, {
        visitCount: 1, // This will be incremented by DB function
        lastVisit: new Date()
      });

    } catch (error: any) {
      console.error('❌ Failed to record venue transition:', error);
    }
  }

  /**
   * Get user's venue history and preferences
   */
  async getUserVenueHistory(userId: string): Promise<{
    homeVenue: SailingVenue | null;
    visitedVenues: Array<SailingVenue & { visit_count: number; last_visit: Date }>;
    favoriteVenues: SailingVenue[];
    recentTransitions: Array<VenueTransition & { recorded_at: Date }>;
  }> {
    console.log(`🌍 Getting venue history for user: ${userId}`);

    try {
      // Get user profiles with venue data
      const { data: profiles, error: profilesError } = await supabase
        .from('user_venue_profiles')
        .select(`
          *,
          sailing_venues (*)
        `)
        .eq('user_id', userId)
        .order('last_visit', { ascending: false });

      if (profilesError) throw profilesError;

      // Get recent transitions
      const { data: transitions, error: transitionsError } = await supabase
        .from('venue_transitions')
        .select(`
          *,
          from_venue:sailing_venues!from_venue_id (*),
          to_venue:sailing_venues!to_venue_id (*)
        `)
        .eq('user_id', userId)
        .order('transition_date', { ascending: false })
        .limit(10);

      if (transitionsError) throw transitionsError;

      const visitedVenues = (profiles || [])
        .map(profile => ({
          ...profile.sailing_venues,
          visit_count: profile.visit_count,
          last_visit: new Date(profile.last_visit)
        }))
        .filter(Boolean);

      const homeVenue = visitedVenues.find(v => v.home_venue) || null;
      const favoriteVenues = visitedVenues.filter(v => v.favorited) || [];

      console.log(`✅ Retrieved venue history: ${visitedVenues.length} visited, ${favoriteVenues.length} favorites`);

      return {
        homeVenue,
        visitedVenues,
        favoriteVenues,
        recentTransitions: transitions || []
      };

    } catch (error: any) {
      console.error('❌ Failed to get user venue history:', error);
      return {
        homeVenue: null,
        visitedVenues: [],
        favoriteVenues: [],
        recentTransitions: []
      };
    }
  }

  /**
   * Get global racing events for venue
   */
  async getVenueRacingEvents(
    venueId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<GlobalRacingEvent[]> {
    console.log(`🌍 Getting racing events for venue: ${venueId}`);

    try {
      let query = supabase
        .from('global_racing_events')
        .select('*')
        .eq('venue_id', venueId)
        .order('start_date', { ascending: true });

      if (startDate) {
        query = query.gte('start_date', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('end_date', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log(`✅ Found ${data?.length || 0} racing events`);
      return (data || []) as GlobalRacingEvent[];

    } catch (error: any) {
      console.error('❌ Failed to get racing events:', error);
      return [];
    }
  }

  /**
   * Get venue statistics and analytics
   */
  async getVenueAnalytics(): Promise<{
    totalVenues: number;
    venuesByType: Record<VenueType, number>;
    venuesByRegion: Record<string, number>;
    topVenuesByVisits: Array<{ venue: SailingVenue; visit_count: number }>;
    recentTransitions: number;
  }> {
    console.log('🌍 Getting global venue analytics...');

    try {
      const { data, error } = await supabase.rpc('get_venue_analytics');

      if (error) throw error;

      console.log('✅ Retrieved venue analytics');
      return data;

    } catch (error: any) {
      console.error('❌ Failed to get venue analytics:', error);
      return {
        totalVenues: 0,
        venuesByType: { championship: 0, premier: 0, regional: 0, local: 0, club: 0 },
        venuesByRegion: {},
        topVenuesByVisits: [],
        recentTransitions: 0
      };
    }
  }

  /**
   * Track venue detection event
   */
  private async trackVenueDetection(
    userId: string,
    venueId: string,
    method: 'gps' | 'network' | 'manual',
    accuracy?: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('venue_detections')
        .insert({
          user_id: userId,
          venue_id: venueId,
          detection_method: method,
          accuracy_meters: accuracy ? accuracy * 1000 : null,
          detected_at: new Date().toISOString()
        });

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        console.warn('⚠️ Failed to track venue detection:', error);
      }
    } catch (error) {
      // Silent fail for tracking
      console.warn('⚠️ Venue detection tracking failed:', error);
    }
  }

  /**
   * Seed database with initial global venues
   */
  private async seedGlobalVenues(): Promise<void> {
    console.log('🌍 [SEED DEBUG] Checking if venue seeding is needed...');

    try {
      // Check if the table exists first
      const { data: testData, error: testError } = await supabase
        .from('sailing_venues')
        .select('id')
        .limit(1);

      if (testError && testError.code === 'PGRST205') {
        // Table doesn't exist - set up the database directly
        console.log('🚨 [SEED DEBUG] sailing_venues table does not exist in Supabase');
        console.log('🚀 [SEED DEBUG] Setting up Supabase database directly...');

        const { setupSupabaseDatabase } = await import('@/src/scripts/setup-supabase-db');
        await setupSupabaseDatabase();

        console.log('✅ [SEED DEBUG] Supabase database setup completed!');
        return;
      }

      if (testError) {
        throw testError;
      }

      // Table exists, check if we need to add more data
      const { count } = await supabase
        .from('sailing_venues')
        .select('*', { count: 'exact', head: true });

      console.log(`✅ [SEED DEBUG] sailing_venues table exists with ${count || 0} venues`);

      if (count && count >= 12) {
        console.log('ℹ️ [SEED DEBUG] Database already has sufficient venue data');
        return;
      }

      // Need more data, run the seeding
      console.log('📊 [SEED DEBUG] Need to add more venue data...');
      const { seedVenueDatabase } = await import('@/scripts/seed-venues');
      await seedVenueDatabase();

    } catch (error: any) {
      console.error('❌ [SEED DEBUG] Failed to seed venues:', {
        message: error.message,
        code: error.code,
        stack: error.stack?.substring(0, 300)
      });
      throw error;
    }
  }
}

// Export singleton instance
export const supabaseVenueService = new SupabaseVenueService();
/**
 * Supabase Venue Intelligence Service
 * Integrates global venue database with Supabase for persistent storage and real-time updates
 * Leverages Supabase MCP for seamless database operations
 */

import type {
    Coordinates,
    GlobalRacingEvent,
    SailingVenue,
    UserVenueProfile,
    VenueTransition,
    VenueType
} from '@/lib/types/global-venues';
import { supabase } from '@/services/supabase';

export class SupabaseVenueService {
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  private initializationFailed: boolean = false;
  private lastFailureTime: number = 0;
  private failureCount: number = 0;
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly FAILURE_COOLDOWN_MS = 30000; // 30 seconds

  constructor() {
  }

  /**
   * Return a lightweight venue list tailored for the currently signed-in sailor client
   * Used by the dashboard to populate the "current venue" and nearby venue cards.
   */
  async listVenuesForClient(limit: number = 50, options?: { region?: string; country?: string }) {
    // SKIP initialization in critical dashboard path - just query the table
    // If table doesn't exist, we'll handle the error gracefully
    // Initialization should happen separately via explicit admin/setup flow

    try {
      let query = supabase
        .from('sailing_venues')
        .select('id, name, country, region, venue_type, coordinates_lat, coordinates_lng, updated_at')
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (options?.region) {
        query = query.eq('region', options.region);
      }

      if (options?.country) {
        query = query.eq('country', options.country);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [CLIENT VENUES] Failed to fetch venues for client:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      return (data || []).map((venue) => ({
        id: venue.id,
        name: venue.name,
        country: venue.country,
        region: venue.region,
        venueType: venue.venue_type,
        coordinates: [venue.coordinates_lng, venue.coordinates_lat] as [number | null, number | null],
        updatedAt: venue.updated_at,
      }));
    } catch (error: any) {
      console.error('💥 [CLIENT VENUES] Unexpected error while listing client venues:', {
        message: error?.message,
        stack: error?.stack?.substring(0, 400),
      });

      return [];
    }
  }

  /**
   * Initialize database schema and seed with global venues (cached to prevent loops)
   */
  async initializeVenueSchema(): Promise<void> {
    // Return cached initialization if already completed
    if (this.isInitialized) {
      return;
    }

    // Circuit breaker: Check if we're in failure cooldown period
    const now = Date.now();
    if (this.initializationFailed && (now - this.lastFailureTime) < this.FAILURE_COOLDOWN_MS) {
      const remainingTime = Math.round((this.FAILURE_COOLDOWN_MS - (now - this.lastFailureTime)) / 1000);
      console.log(`🔴 [CIRCUIT_BREAKER] Initialization blocked due to recent failures. Retry in ${remainingTime}s`);
      throw new Error(`Circuit breaker: Retrying in ${remainingTime} seconds`);
    }

    // Circuit breaker: Check if we've exceeded max retry attempts
    if (this.failureCount >= this.MAX_RETRY_ATTEMPTS) {
      console.log(`🔴 [CIRCUIT_BREAKER] Max retry attempts (${this.MAX_RETRY_ATTEMPTS}) exceeded. Service disabled.`);
      throw new Error(`Circuit breaker: Max retry attempts exceeded`);
    }

    // Return ongoing initialization promise if already in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Create and cache the initialization promise
    this.initializationPromise = this._performInitialization();

    try {
      await this.initializationPromise;
      this.isInitialized = true;
      this.initializationFailed = false;
      this.failureCount = 0; // Reset failure count on success
      console.log('✅ Supabase venue schema initialized successfully');
    } catch (error) {
      this.initializationPromise = null; // Reset on failure to allow retry
      this.initializationFailed = true;
      this.lastFailureTime = Date.now();
      this.failureCount++;
      console.log(`🔴 [CIRCUIT_BREAKER] Initialization failed (attempt ${this.failureCount}/${this.MAX_RETRY_ATTEMPTS})`);
      throw error;
    }
  }

  /**
   * Internal initialization method
   */
  private async _performInitialization(): Promise<void> {
    try {
      // Check if sailing_venues table exists
      const { data: existingData, error: existingError } = await supabase
        .from('sailing_venues')
        .select('id')
        .limit(1);

      // Only seed if table exists but has insufficient data
      if (!existingError) {
        // Table exists, check if we need to add more data
        const { count } = await supabase
          .from('sailing_venues')
          .select('*', { count: 'exact', head: true });

        if (count && count >= 12) {
          return;
        }
      }

      // Try to seed - the seeding function will handle duplicates
      await this.seedGlobalVenues();

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
    // CRITICAL FIX: Always return empty array if initialization has failed
    // This prevents any component re-renders that could cause infinite loops
    if (this.initializationFailed) {
      return [];
    }

    // CRITICAL FIX: If not initialized, return empty array immediately
    // Do NOT attempt initialization during component render cycles
    if (!this.isInitialized) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('sailing_venues')
        .select(`
          *,
          yacht_clubs (*)
        `)
        .order('name');

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {

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
   * Seed database with initial global venues (cached to prevent repeated seeding)
   */
  private async seedGlobalVenues(): Promise<void> {
    try {
      // Check if the table exists first
      const { data: testData, error: testError } = await supabase
        .from('sailing_venues')
        .select('id')
        .limit(1);

      if (testError && testError.code === 'PGRST205') {
        // Table doesn't exist - set up the database directly
        const { setupSupabaseDatabase } = await import('@/scripts/setup-supabase-db');
        await setupSupabaseDatabase();
        return;
      }

      if (testError) {
        throw testError;
      }

      // Table exists, check if we need to add more data
      const { count } = await supabase
        .from('sailing_venues')
        .select('*', { count: 'exact', head: true });

      if (count && count >= 12) {
        return;
      }

      // Need more data, run the seeding ONCE
      const { seedVenueDatabase } = await import('@/scripts/seed-venues');
      await seedVenueDatabase();

    } catch (error: any) {
      console.error('❌ [SEED DEBUG] Failed to seed venues:', {
        message: error.message,
        code: error.code,
        stack: error.stack?.substring(0, 300)
      });

      // Don't throw - allow app to continue with empty venues
      console.warn('⚠️ [SEED DEBUG] Continuing without venue data...');
    }
  }
}

// Export singleton instance
export const supabaseVenueService = new SupabaseVenueService();
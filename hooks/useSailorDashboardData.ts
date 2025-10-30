import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import { supabaseVenueService } from '@/services/venue/SupabaseVenueService';
import type { FleetActivityEntry, FleetMembership, FleetOverview } from '@/services/fleetService';
import { useCallback, useEffect, useState } from 'react';

interface SailorRace {
  id: string;
  name: string;
  venue: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'in_progress' | 'completed';
  hasStrategy: boolean;
  weatherConfidence: number;
  documentsReady: boolean;
  tuningGuideReady?: boolean;
  crewAssigned?: boolean;
  classId?: string;
  venueIntelligence?: {
    conditions: string;
    tactics: string[];
    localTips: string;
  };
}

interface SailorDocument {
  id: string;
  name: string;
  type: 'sailing_instructions' | 'notice_of_race' | 'course_chart' | 'results' | 'other';
  uploadedAt: string;
  processed: boolean;
  raceId?: string;
}

interface SailorStrategy {
  id: string;
  raceId: string;
  raceName: string;
  confidence: number;
  lastUpdated: string;
  sections: {
    overview: boolean;
    weather: boolean;
    equipment: boolean;
    tactical: boolean;
  };
}

interface SailorPerformance {
  recentResults: Array<{
    raceName: string;
    position: number;
    fleet: number;
    venue: string;
    date: string;
  }>;
  seasonStats: {
    totalRaces: number;
    averagePosition: number;
    podiumFinishes: number;
    improvement: number;
  };
  venueComparison: Array<{
    venue: string;
    races: number;
    avgPosition: number;
    bestResult: number;
  }>;
}

interface WeatherData {
  current: {
    windSpeed: number;
    windDirection: number;
    temperature: number;
    conditions: string;
  };
  forecast: Array<{
    time: string;
    windSpeed: number;
    windDirection: number;
    conditions: string;
  }>;
  confidence: number;
}

export interface SailorDashboardData {
  classes: SailorClass[];
  activeClassId: string | null;
  races: SailorRace[];
  documents: SailorDocument[];
  strategies: SailorStrategy[];
  performance: SailorPerformance;
  weather: WeatherData | null;
  venues: SailorVenueIntel;
  fleets: FleetMembership[];
  primaryFleetOverview: FleetOverview | null;
  primaryFleetActivity: FleetActivityEntry[];
  loading: boolean;
  error: string | null;
  setActiveClassId: (classId: string | null) => void;
}

export interface SailorVenueIntel {
  currentVenue: {
    id: string;
    name: string;
    country: string;
    region: string;
    confidence: number;
    culturalContext: {
      primaryLanguage: string;
      currency: string;
      protocols: string[];
    };
    racingIntelligence: {
      bestConditions: string;
      commonHazards: string[];
      localTactics: string[];
      records: Array<{ type: string; value: string; holder: string }>;
    };
    services: Array<{ type: string; name: string; contact: string; rating: number }>;
  } | null;
  nearbyVenues: Array<{ id: string; name: string; distance: number; country: string; hasData: boolean }>;
  isDetecting: boolean;
}

interface SailorClass {
  id: string;
  name: string;
  isPrimary: boolean;
  boatName?: string;
  sailNumber?: string;
  tuningGuideUrl?: string | null;
  group?: {
    id: string;
    name: string;
    ratingSystem?: string | null;
  };
}

export function useSailorDashboardData(): SailorDashboardData {
  const { user } = useAuth();
  const [data, setData] = useState<Omit<SailorDashboardData, 'setActiveClassId'>>({
    classes: [],
    activeClassId: null,
    races: [],
    documents: [],
    strategies: [],
    performance: {
      recentResults: [],
      seasonStats: {
        totalRaces: 0,
        averagePosition: 0,
        podiumFinishes: 0,
        improvement: 0,
      },
      venueComparison: [],
    },
    weather: null,
    venues: {
      currentVenue: null,
      nearbyVenues: [],
      isDetecting: false,
    },
    fleets: [],
    primaryFleetOverview: null,
    primaryFleetActivity: [],
    loading: true,
    error: null,
  });

  const fetchSailorData = useCallback(async (overrideClassId?: string | null) => {

    if (!user) {

      setData(prev => ({ ...prev, loading: false, error: 'No user authenticated' }));
      return;
    }

    try {

      setData(prev => ({ ...prev, loading: true, error: null }));

      // Query regattas using only the existing created_by column
      
      // Step 1: Fetch classes for this sailor (WITHOUT foreign key join to avoid deadlock)
      const { data: classRows, error: classError } = await supabase
        .from('sailor_classes')
        .select('class_id, is_primary, boat_name, sail_number')
        .eq('sailor_id', user.id);

      if (classError) {

        throw classError;
      }

      // Step 2: Fetch boat class details and groups separately
      const classIds = classRows?.map(r => r.class_id) || [];
      let boatClassesMap: Record<string, { name: string; tuning_guide_url: string | null }> = {};
      let classGroupsMap: Record<string, { id: string; name: string; rating_system: string | null }> = {};

      if (classIds.length > 0) {
        const { data: classesData, error: classesError } = await supabase
          .from('boat_classes')
          .select('id, name, tuning_guide_url')
          .in('id', classIds);

        if (classesData && !classesError) {
          classesData.forEach((cls: any) => {
            boatClassesMap[cls.id] = { name: cls.name, tuning_guide_url: cls.tuning_guide_url };
          });
        }

        // Fetch class groups (without foreign key join)
        const { data: groupData, error: groupError } = await supabase
          .from('class_group_members')
          .select('class_id, group_id')
          .in('class_id', classIds);

        if (groupData && !groupError) {
          const groupIds = groupData.map((g: any) => g.group_id).filter(Boolean);

          if (groupIds.length > 0) {
            const { data: groupsData } = await supabase
              .from('class_groups')
              .select('id, name, rating_system')
              .in('id', groupIds);

            // Build maps
            const groupsById: Record<string, any> = {};
            groupsData?.forEach((g: any) => {
              groupsById[g.id] = g;
            });

            groupData.forEach((item: any) => {
              if (item.group_id && groupsById[item.group_id]) {
                classGroupsMap[item.class_id] = groupsById[item.group_id];
              }
            });
          }
        }
      }

      type ClassRow = {
        class_id: string;
        is_primary: boolean | null;
        boat_name: string | null;
        sail_number: string | null;
      };

      const processedClasses: SailorClass[] = (classRows as ClassRow[] | null | undefined)?.map(row => ({
        id: row.class_id,
        name: boatClassesMap[row.class_id]?.name ?? 'Unclassified',
        isPrimary: !!row.is_primary,
        boatName: row.boat_name ?? undefined,
        sailNumber: row.sail_number ?? undefined,
        tuningGuideUrl: boatClassesMap[row.class_id]?.tuning_guide_url ?? null,
        group: classGroupsMap[row.class_id]
          ? {
              id: classGroupsMap[row.class_id].id,
              name: classGroupsMap[row.class_id].name,
              ratingSystem: classGroupsMap[row.class_id].rating_system,
            }
          : undefined,
      })) ?? [];

      const resolvedClassId =
        overrideClassId === undefined
          ? (data.activeClassId && processedClasses.some(cls => cls.id === data.activeClassId)
              ? data.activeClassId
              : processedClasses.find(cls => cls.isPrimary)?.id ?? processedClasses[0]?.id ?? null)
          : overrideClassId === null
            ? null
            : processedClasses.some(cls => cls.id === overrideClassId)
              ? overrideClassId
              : processedClasses[0]?.id ?? null;

      // Step 3: Fetch regattas
      const { data: racesData, error: racesError } = await supabase
        .from('regattas')
        .select('*')
        .eq('created_by', user.id)
        .order('start_date', { ascending: true });

      if (racesError) {

        throw racesError;
      }

      // Step 4: Fetch documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (documentsError) {

        throw documentsError;
      }

      // Step 5: Fetch strategies
      const { data: strategiesData, error: strategiesError } = await supabase
        .from('ai_analyses')
        .select(`
          *,
          regatta:regattas(name)
        `)
        .eq('user_id', user.id)
        .eq('analysis_type', 'strategy')
        .order('updated_at', { ascending: false });

      if (strategiesError) {

        throw strategiesError;
      }

      // Step 6: Fetch results
      const { data: resultsData, error: resultsError } = await supabase
        .from('regatta_results')
        .select(`
          *,
          regatta:regattas(name, metadata)
        `)
        .eq('sailor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (resultsError) {

        throw resultsError;
      }

      // Process and set data
      const processedRaces: SailorRace[] = racesData?.map(race => {
        const metadata = (race.metadata as Record<string, unknown> | null) ?? {};
        const raceClass = typeof metadata.class_id === 'string' ? metadata.class_id : undefined;

        return {
          id: race.id,
          name: race.name,
          venue: (metadata.venue as string) || 'Venue TBD',
          startDate: race.start_date,
          endDate: race.end_date || race.start_date,
          status: race.status === 'completed' ? 'completed' :
                  race.status === 'active' ? 'in_progress' : 'upcoming',
          hasStrategy: strategiesData?.some(s => s.regatta_id === race.id) || false,
          weatherConfidence: 0.8,
          documentsReady: documentsData?.some(doc =>
            doc.document_type === 'sailing_instructions' &&
            (doc.metadata as any)?.regatta_id === race.id
          ) || false,
          tuningGuideReady: !!raceClass && processedClasses.some(c => c.id === raceClass && c.tuningGuideUrl),
          crewAssigned: (metadata.crew_assigned as boolean) || false,
          classId: raceClass,
          venueIntelligence: {
            conditions: 'Variable conditions expected',
            tactics: ['Monitor wind shifts', 'Stay close to shore'],
            localTips: 'Check local sailing instructions'
          },
        };
      }) || [];

      const processedDocuments: SailorDocument[] = documentsData?.filter(doc => {
        if (!resolvedClassId) return true;
        const metadata = (doc.metadata as Record<string, unknown> | null) ?? {};
        const docClass = typeof metadata.class_id === 'string' ? metadata.class_id : undefined;
        return !docClass || docClass === resolvedClassId;
      }).map(doc => ({
        id: doc.id,
        name: doc.title || doc.filename,
        type: doc.document_type || 'other',
        uploadedAt: doc.created_at,
        processed: doc.processing_status === 'completed',
        raceId: undefined,
      })) || [];

      const processedStrategies: SailorStrategy[] = strategiesData?.filter(strategy => {
        if (!resolvedClassId) return true;
        const metadata = (strategy.metadata as Record<string, unknown> | null) ?? {};
        const strategyClass = typeof metadata.class_id === 'string' ? metadata.class_id : undefined;
        return !strategyClass || strategyClass === resolvedClassId;
      }).map(strategy => ({
        id: strategy.id,
        raceId: strategy.regatta_id,
        raceName: strategy.regatta?.name || 'Unknown Race',
        confidence: strategy.confidence_score || 0,
        lastUpdated: strategy.updated_at,
        sections: {
          overview: true,
          weather: true,
          equipment: false,
          tactical: true,
        },
      })) || [];

      // Process performance data
      const recentResults = resultsData?.slice(0, 5).map(result => ({
        raceName: result.regatta?.name || 'Unknown',
        position: result.finish_position || 0,
        fleet: (((result.regatta?.metadata as Record<string, unknown>) ?? {}).fleet_size as number) || 25,
        venue: (((result.regatta?.metadata as Record<string, unknown>) ?? {}).venue as string) || 'Venue TBD',
        date: result.created_at,
      })) || [];

      const totalRaces = resultsData?.length || 0;
      const averagePosition = totalRaces > 0
        ? resultsData.reduce((sum, result) => sum + (result.finish_position || 0), 0) / totalRaces
        : 0;
      const podiumFinishes = resultsData?.filter(result => (result.finish_position || 0) <= 3).length || 0;

      // Calculate venue comparison (simplified for now)
      const venueStats = resultsData?.reduce((acc, result) => {
        const venueMetadata = (result.regatta?.metadata as Record<string, unknown> | null) ?? {};
        const venue = (venueMetadata.venue as string) || 'Various Venues';
        if (!acc[venue]) {
          acc[venue] = { races: 0, totalPosition: 0, bestResult: Infinity };
        }
        acc[venue].races++;
        acc[venue].totalPosition += result.finish_position || 0;
        acc[venue].bestResult = Math.min(acc[venue].bestResult, result.finish_position || Infinity);
        return acc;
      }, {} as Record<string, { races: number; totalPosition: number; bestResult: number }>) || {};

      const venueComparison = Object.entries(venueStats).map(([venue, stats]) => ({
        venue,
        races: stats.races,
        avgPosition: Math.round(stats.totalPosition / stats.races * 10) / 10,
        bestResult: stats.bestResult === Infinity ? 0 : stats.bestResult,
      }));

      // Step 6.5: Fetch fleet memberships and overview
      let fleetMemberships: FleetMembership[] = [];
      let primaryFleetOverview: FleetOverview | null = null;
      let primaryFleetActivity: FleetActivityEntry[] = [];

      // Step 7: Set initial loading state and fetch venue intelligence in background

      // Set initial empty venue state to allow dashboard to render immediately
      const venueIntel: SailorVenueIntel = {
        currentVenue: null,
        nearbyVenues: [],
        isDetecting: true, // Show loading state for venues
      };

      // Update state with non-venue data (venues will load in background)
      setData(prev => ({
        ...prev,
        classes: processedClasses,
        activeClassId: resolvedClassId,
        races: processedRaces,
        documents: processedDocuments,
        strategies: processedStrategies,
        performance: {
          recentResults,
          seasonStats: {
            totalRaces,
            averagePosition: Math.round(averagePosition * 10) / 10,
            podiumFinishes,
            improvement: 5,
          },
          venueComparison,
        },
        weather: {
          current: {
            windSpeed: 12,
            windDirection: 180,
            temperature: 22,
            conditions: 'Partly cloudy'
          },
          forecast: [
            {
              time: 'Tomorrow',
              windSpeed: 15,
              windDirection: 200,
              conditions: 'Sunny'
            }
          ],
          confidence: 0.85
        },
        venues: venueIntel,
        fleets: fleetMemberships,
        primaryFleetOverview,
        primaryFleetActivity,
        loading: false,
      }));

      // Step 8: Load venue data in background (non-blocking)
      supabaseVenueService.listVenuesForClient(100)
        .then(clientVenues => {
          if (!clientVenues || clientVenues.length === 0) {
            return;
          }

          const hongKongVenue = clientVenues.find(
            (venue) => venue.name?.toLowerCase().includes('hong kong') || venue.region?.toLowerCase()?.includes('hong kong')
          );

          const updatedVenueIntel: SailorVenueIntel = {
            currentVenue: hongKongVenue
              ? {
                  id: hongKongVenue.id,
                  name: hongKongVenue.name || 'Hong Kong - Victoria Harbour',
                  country: hongKongVenue.country || 'Hong Kong SAR',
                  region: hongKongVenue.region || 'Asia-Pacific',
                  confidence: 0.65,
                  culturalContext: {
                    primaryLanguage: 'Cantonese / English',
                    currency: 'Hong Kong Dollar (HKD)',
                    protocols: [
                      'Harbour patrol monitors racing areas closely',
                      'Respect typhoon flag warnings and signal flags',
                      'Dress codes enforced at most yacht clubs'
                    ],
                  },
                  racingIntelligence: {
                    bestConditions: 'Northeasterly monsoon winds, 12-18 knots',
                    commonHazards: [
                      'Heavy commercial traffic in Victoria Harbour',
                      'Rapid weather changes during typhoon season',
                      'Strong tidal currents near harbour entrances',
                    ],
                    localTactics: [
                      'Favor shore breeze shifts in the afternoon',
                      'Monitor shipping lane closures and race committee updates',
                      'Use tidal eddies along the island shoreline',
                    ],
                    records: [
                      { type: 'Harbour Series Best Time', value: '00:58:42', holder: 'Royal HKYC A-Team' },
                      { type: 'Typhoon Series Points Champion', value: '16 pts', holder: 'Aberdeen Boat Club Elite' },
                    ],
                  },
                  services: [
                    { type: 'Chandlery', name: 'Royal HKYC Boat Yard', contact: '+852 2234 5678', rating: 4.7 },
                    { type: 'Sailmaker', name: 'Aberdeen Sail Loft', contact: '+852 8765 4321', rating: 4.5 },
                    { type: 'Rigger', name: 'Victoria Harbour Rigging', contact: '+852 5555 6789', rating: 4.2 },
                  ],
                }
              : null,
            nearbyVenues: clientVenues
              .filter((venue) => venue.id !== hongKongVenue?.id)
              .slice(0, 5)
              .map((venue) => ({
                id: venue.id,
                name: venue.name,
                country: venue.country || 'Unknown',
                distance: Math.round(Math.random() * 50 + 10),
                hasData: true,
              })),
            isDetecting: false,
          };

          // Update state with venue data
          setData(prev => ({
            ...prev,
            venues: updatedVenueIntel,
          }));
        })
        .catch(error => {
          // Keep empty venue state on error
          setData(prev => ({
            ...prev,
            venues: {
              currentVenue: null,
              nearbyVenues: [],
              isDetecting: false,
            },
          }));
        });

    } catch (error) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data',
      }));
    }
  }, [user]);

  useEffect(() => {

    if (user) {
      // Add timeout fallback to prevent infinite loading
      const timeout = setTimeout(() => {
        console.error('⏰ [SAILOR-DATA] Fetch timeout after 10 seconds');
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Data load timeout - please refresh the page',
        }));
      }, 10000);

      fetchSailorData().finally(() => {

        clearTimeout(timeout);
      });
    } else {

      // If no user, stop loading
      setData(prev => ({ ...prev, loading: false, error: null }));
    }
  }, [user, fetchSailorData]);

  const setActiveClassId = useCallback((classId: string | null) => {
    setData(prev => ({ ...prev, activeClassId: classId }));
    fetchSailorData(classId).catch(error => {
    });
  }, [fetchSailorData]);

  return {
    ...data,
    setActiveClassId,
  };
}

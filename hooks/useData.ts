import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import api from '@/services/apiService';
import { useApi, useMutation, usePaginatedQuery, usePullToRefreshReturn, usePullToRefresh } from './useApi';
import { Tables, TablesInsert, TablesUpdate } from '@/services/supabase';
import { useLiveRaces } from './useRaceResults';

// ============================================================================
// Sailor Profile Hooks
// ============================================================================

export function useSailorProfile() {
  const { user } = useAuth();

  return useApi(
    () => api.sailorProfile.getProfile(user?.id || ''),
    { enabled: !!user?.id }
  );
}

export function useUpdateSailorProfile() {
  const { user } = useAuth();

  return useMutation(
    (updates: TablesUpdate<'users'>) => api.sailorProfile.updateProfile(user?.id || '', updates)
  );
}

// ============================================================================
// Venues Hooks
// ============================================================================

export function useVenue(venueId: string) {
  return useApi(
    () => api.venues.getVenueById(venueId),
    { enabled: !!venueId }
  );
}

export function useNearbyVenues(lat: number, lng: number, radiusKm: number = 50) {
  return useApi(
    () => api.venues.getNearbyVenues(lat, lng, radiusKm),
    { enabled: !!lat && !!lng }
  );
}

export function useSavedVenues() {
  const { user } = useAuth();

  return useApi(
    () => api.venues.getSavedVenues(user?.id || ''),
    { enabled: !!user?.id }
  );
}

export function useSaveVenue() {
  const { user } = useAuth();

  return useMutation(
    (venueId: string) => api.venues.saveVenue(user?.id || '', venueId)
  );
}

// ============================================================================
// Races Hooks
// ============================================================================

export function useRaces() {
  const { user } = useAuth();
  console.log('🏁🏁🏁 [useRaces] FUNCTION CALLED - User:', user?.id);

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('🏁 [useRaces] useEffect FIRED - user:', user?.id);

    if (!user?.id) {
      console.log('🏁 [useRaces] No user ID - setting loading to false');
      setLoading(false);
      return;
    }

    console.log('🏁 [useRaces] Starting database query...');
    setLoading(true);
    setError(null);

    // Execute query directly in useEffect
    (async () => {
      try {
        console.error('🏁🏁🏁 USERACES HOOK EXECUTING - CODE_VERSION: LIMIT_100_FIX 🏁🏁🏁');
        console.error('🏁 Querying for user:', user.id);
        const { data: rawData, error: dbError } = await api.supabase
          .from('regattas')
          .select('id, name, start_date, end_date, metadata, created_by, created_at, updated_at')
          .eq('created_by', user.id)
          .order('start_date', { ascending: true })
          .limit(100); // Increased to support full season calendars (CSV imports)

        console.error('🏁 QUERY RESULT - rawData count:', rawData?.length, 'error:', dbError);
        console.error('🏁 First 3:', rawData?.slice(0, 3).map(r => ({ name: r.name, date: r.start_date })));
        console.error('🏁 Last 3:', rawData?.slice(-3).map(r => ({ name: r.name, date: r.start_date })));

        if (dbError) {
          console.error('🏁 [useRaces] Database error:', dbError);
          setError(dbError as Error);
          setData([]);
          setLoading(false);
          return;
        }

        console.log('🏁 [useRaces] Mapping', rawData?.length || 0, 'records...');

        // Map to expected format
        const mapped = (rawData || []).map((regatta: any) => ({
          id: regatta.id,
          name: regatta.name,
          venue: regatta.metadata?.venue_name || 'Venue TBD',
          date: regatta.start_date,
          startTime: regatta.warning_signal_time || new Date(regatta.start_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          boatClass: regatta.metadata?.class || regatta.metadata?.class_name || 'Class TBD',
          status: regatta.status || 'upcoming',
          wind: regatta.metadata?.wind || { direction: 'Variable', speedMin: 8, speedMax: 15 },
          tide: regatta.metadata?.tide || { state: 'slack', height: 1.0 },
          strategy: regatta.metadata?.strategy || 'Race strategy will be generated based on conditions.',
          critical_details: regatta.metadata?.critical_details
        }));

        console.log('🏁 [useRaces] Mapped races count:', mapped.length);
        console.log('🏁 [useRaces] Mapped race names (first 10):', mapped.slice(0, 10).map(r => r.name));
        console.log('🏁 [useRaces] Mapped race names (last 5):', mapped.slice(-5).map(r => r.name));
        console.log('🏁 [useRaces] Setting data with', mapped.length, 'mapped races');
        setData(mapped);
        setLoading(false);
      } catch (err) {
        console.error('🏁 [useRaces] Exception during query:', err);
        setError(err as Error);
        setData([]);
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const refetch = useCallback(async () => {
    console.log('🏁 [useRaces] refetch called');
    // Trigger re-fetch by updating a dependency
    setLoading(true);
  }, []);

  const mutate = useCallback(async (optimisticData?: any[]) => {
    if (optimisticData) {
      setData(optimisticData);
    }
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
    mutate
  };
}

export function useRace(raceId: string) {
  return useApi(
    () => api.races.getRaceById(raceId),
    { enabled: !!raceId }
  );
}

export function useCreateRace() {
  return useMutation(
    (race: TablesInsert<'races'>) => api.races.createRace(race)
  );
}

export function useUpdateRace() {
  return useMutation(
    ({ raceId, updates }: { raceId: string; updates: TablesUpdate<'races'> }) =>
      api.races.updateRace(raceId, updates)
  );
}

// ============================================================================
// Race Strategies Hooks
// ============================================================================

export function useRaceStrategy(raceId: string) {
  return useApi(
    () => api.raceStrategies.getStrategyForRace(raceId),
    { enabled: !!raceId }
  );
}

export function useCreateRaceStrategy() {
  return useMutation(
    (strategy: any) => api.raceStrategies.createStrategy(strategy)
  );
}

export function useUpdateRaceStrategy() {
  return useMutation(
    ({ strategyId, updates }: { strategyId: string; updates: any }) =>
      api.raceStrategies.updateStrategy(strategyId, updates)
  );
}

// ============================================================================
// Race Performance Hooks
// ============================================================================

export function useRacePerformance(raceId: string) {
  return useApi(
    () => api.racePerformance.getPerformanceByRace(raceId),
    { enabled: !!raceId }
  );
}

export function usePerformanceHistory(limit: number = 10) {
  const { user } = useAuth();

  return useApi(
    async () => {
      // Query regatta_results table instead of non-existent race_results
      const { data, error } = await api.supabase
        .from('regatta_results')
        .select(`
          *,
          regatta:regattas(name, metadata)
        `)
        .eq('sailor_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    { enabled: !!user?.id }
  );
}

export function useCreatePerformance() {
  return useMutation(
    (performance: any) => api.racePerformance.createPerformance(performance)
  );
}

// ============================================================================
// Boats Hooks
// ============================================================================

export function useBoats() {
  const { user } = useAuth();

  return useApi(
    () => api.boats.getBoats(user?.id || ''),
    { enabled: !!user?.id }
  );
}

export function useBoat(boatId: string) {
  return useApi(
    () => api.boats.getBoatById(boatId),
    { enabled: !!boatId }
  );
}

export function useCreateBoat() {
  return useMutation(
    (boat: any) => api.boats.createBoat(boat)
  );
}

export function useUpdateBoat() {
  return useMutation(
    ({ boatId, updates }: { boatId: string; updates: any }) =>
      api.boats.updateBoat(boatId, updates)
  );
}

// ============================================================================
// Equipment Hooks
// ============================================================================

export function useSails(boatId: string) {
  return useApi(
    () => api.equipment.getSails(boatId),
    { enabled: !!boatId }
  );
}

export function useEquipment(boatId: string, category?: string) {
  return useApi(
    () => api.equipment.getEquipment(boatId, category),
    { enabled: !!boatId }
  );
}

export function useCreateEquipment() {
  return useMutation(
    (equipment: any) => api.equipment.createEquipment(equipment)
  );
}

export function useUpdateEquipment() {
  return useMutation(
    ({ equipmentId, updates }: { equipmentId: string; updates: any }) =>
      api.equipment.updateEquipment(equipmentId, updates)
  );
}

// ============================================================================
// Maintenance Hooks
// ============================================================================

export function useMaintenanceRecords(boatId: string) {
  return useApi(
    () => api.maintenance.getMaintenanceRecords(boatId),
    { enabled: !!boatId }
  );
}

export function useCreateMaintenance() {
  return useMutation(
    (maintenance: any) => api.maintenance.createMaintenance(maintenance)
  );
}

// ============================================================================
// Fleets Hooks
// ============================================================================

export function useFleets() {
  const { user } = useAuth();

  return useApi(
    () => api.fleets.getFleets(user?.id || ''),
    { enabled: !!user?.id }
  );
}

export function useFleet(fleetId: string) {
  return useApi(
    () => api.fleets.getFleetById(fleetId),
    { enabled: !!fleetId }
  );
}

export function useFleetMembers(fleetId: string) {
  return useApi(
    () => api.fleets.getFleetMembers(fleetId),
    { enabled: !!fleetId }
  );
}

export function useJoinFleet() {
  const { user } = useAuth();

  return useMutation(
    (fleetId: string) => api.fleets.joinFleet(user?.id || '', fleetId)
  );
}

// ============================================================================
// Clubs Hooks
// ============================================================================

export function useClubs() {
  const { user } = useAuth();

  return useApi(
    () => api.clubs.getClubs(user?.id || ''),
    { enabled: !!user?.id }
  );
}

export function useClub(clubId: string) {
  return useApi(
    () => api.clubs.getClubById(clubId),
    { enabled: !!clubId }
  );
}

export function useJoinClub() {
  const { user } = useAuth();

  return useMutation(
    ({ clubId, membershipType }: { clubId: string; membershipType: string }) =>
      api.clubs.joinClub(user?.id || '', clubId, membershipType)
  );
}

// ============================================================================
// Venue Intelligence Hooks
// ============================================================================

export function useVenueIntelligence(venueId: string) {
  return useApi(
    () => api.venueIntelligence.getVenueIntelligence(venueId),
    { enabled: !!venueId }
  );
}

export function useCulturalProfile(venueId: string) {
  return useApi(
    () => api.venueIntelligence.getCulturalProfile(venueId),
    { enabled: !!venueId }
  );
}

// ============================================================================
// Regattas Hooks
// ============================================================================

export function useRegattas() {
  const { user } = useAuth();

  return useApi(
    () => api.regattas.getRegattas(user?.id || ''),
    { enabled: !!user?.id }
  );
}

export function useRegatta(regattaId: string) {
  return useApi(
    () => api.regattas.getRegattaById(regattaId),
    { enabled: !!regattaId }
  );
}

export function useCreateRegatta() {
  return useMutation(
    (regatta: TablesInsert<'regattas'>) => api.regattas.createRegatta(regatta)
  );
}

export function useUpdateRegatta() {
  return useMutation(
    ({ regattaId, updates }: { regattaId: string; updates: TablesUpdate<'regattas'> }) =>
      api.regattas.updateRegatta(regattaId, updates)
  );
}

// ============================================================================
// Race Analysis Hooks (AI Coach)
// ============================================================================

export function useRaceAnalysis(timerSessionId: string) {
  return useApi(
    async () => {
      const { data, error } = await api.supabase
        .from('ai_coach_analysis')
        .select('*')
        .eq('timer_session_id', timerSessionId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" errors
      return data;
    },
    { enabled: !!timerSessionId }
  );
}

export function useTriggerRaceAnalysis() {
  return useMutation(
    async (timerSessionId: string) => {
      // Import the service dynamically to avoid circular dependencies
      const { RaceAnalysisService } = await import('@/services/RaceAnalysisService');
      return RaceAnalysisService.analyzeRaceSession(timerSessionId);
    }
  );
}

export function useRaceTimerSession(sessionId: string) {
  return useApi(
    async () => {
      const { data, error } = await api.supabase
        .from('race_timer_sessions')
        .select(`
          *,
          regattas(id, name, venue_id, start_date)
        `)
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data;
    },
    { enabled: !!sessionId }
  );
}

// ============================================================================
// Combined Hooks for Complex Queries
// ============================================================================

export function useRecentTimerSessions(limit: number = 5) {
  const { user } = useAuth();

  return useApi(
    async () => {
      const { data, error } = await api.supabase
        .from('race_timer_sessions')
        .select(`
          *,
          regattas(id, name, venue_id, start_date)
        `)
        .eq('sailor_id', user?.id)
        .not('end_time', 'is', null)
        .order('start_time', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    { enabled: !!user?.id }
  );
}

export function useDashboardData() {
  const { user } = useAuth();

  console.log('🏠 [useDashboardData] Fetching dashboard for user:', user?.id);

  const profile = useSailorProfile();
  const { liveRaces, loading: racesLoading, refresh: racesRefresh } = useLiveRaces(user?.id);
  const performanceHistory = usePerformanceHistory(5);
  const boats = useBoats();
  const fleets = useFleets();
  const recentSessions = useRecentTimerSessions(5);

  // Map liveRaces to expected format (same format as useRaces)
  const mappedRaces = (liveRaces || []).map((regatta: any) => ({
    id: regatta.id,
    name: regatta.name,
    venue: regatta.metadata?.venue_name || 'Venue TBD',
    date: regatta.start_date,
    startTime: regatta.warning_signal_time || new Date(regatta.start_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    boatClass: regatta.metadata?.class || regatta.metadata?.class_name || 'Class TBD',
    status: regatta.status || 'upcoming',
    wind: regatta.metadata?.wind || { direction: 'Variable', speedMin: 8, speedMax: 15 },
    tide: regatta.metadata?.tide || { state: 'slack', height: 1.0 },
    strategy: regatta.metadata?.strategy || 'Race strategy will be generated based on conditions.',
    critical_details: regatta.metadata?.critical_details
  }));

  console.log('🏠 [useDashboardData] Data loaded:', {
    profile: profile.data,
    profileError: profile.error,
    liveRacesCount: liveRaces?.length,
    mappedRacesCount: mappedRaces.length,
    boats: boats.data,
    boatsCount: boats.data?.length,
    boatsError: boats.error,
    fleets: fleets.data,
    fleetsCount: fleets.data?.length,
    fleetsError: fleets.error,
  });

  const loading = profile.loading || racesLoading || performanceHistory.loading || boats.loading || fleets.loading || recentSessions.loading;
  const error = profile.error || performanceHistory.error || boats.error || fleets.error || recentSessions.error;

  const refetch = useCallback(async () => {
    await Promise.all([
      profile.refetch(),
      racesRefresh(),
      performanceHistory.refetch(),
      boats.refetch(),
      fleets.refetch(),
      recentSessions.refetch()
    ]);
  }, [profile.refetch, racesRefresh, performanceHistory.refetch, boats.refetch, fleets.refetch, recentSessions.refetch]);

  const { refreshing, onRefresh } = usePullToRefresh(refetch);

  // Find the next race (first future race)
  // Compare dates only (ignore time) to avoid issues with races at midnight
  const now = new Date();
  const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  console.error('📊 Current date/time:', now.toISOString());
  console.error('📊 Today (date only for comparison):', todayDateOnly.toISOString());

  const nextRaceIndex = mappedRaces.findIndex((race: any) => {
    const raceDate = new Date(race.date);
    const raceDateOnly = new Date(raceDate.getFullYear(), raceDate.getMonth(), raceDate.getDate());
    return raceDateOnly >= todayDateOnly;
  });
  const nextRace = nextRaceIndex >= 0 ? mappedRaces[nextRaceIndex] : null;

  // All races in chronological order (mappedRaces is already sorted by date ascending)
  const recentRaces = mappedRaces;

  console.error('📊📊📊 DASHBOARD DATA HOOK RETURNING 📊📊📊');
  console.error('📊 Total races count:', mappedRaces?.length);
  console.error('📊 nextRace:', nextRace?.name, nextRace?.date);
  console.error('📊 nextRace index in chronological order:', nextRaceIndex);
  console.error('📊 First 5 race names:', mappedRaces.slice(0, 5).map((r: any) => `${r.name} (${r.date})`));

  return {
    profile: profile.data,
    nextRace,
    recentRaces,
    recentTimerSessions: recentSessions.data,
    performanceHistory: performanceHistory.data,
    boats: boats.data,
    fleets: fleets.data,
    loading,
    error,
    refreshing,
    onRefresh,
    refetch
  };
}

export function useBoatDetailData(boatId: string) {
  const boat = useBoat(boatId);
  const sails = useSails(boatId);
  const equipment = useEquipment(boatId);
  const maintenance = useMaintenanceRecords(boatId);

  const loading = boat.loading || sails.loading || equipment.loading || maintenance.loading;
  const error = boat.error || sails.error || equipment.error || maintenance.error;

  const refetch = useCallback(async () => {
    await Promise.all([
      boat.refetch(),
      sails.refetch(),
      equipment.refetch(),
      maintenance.refetch()
    ]);
  }, [boat, sails, equipment, maintenance]);

  const { refreshing, onRefresh } = usePullToRefresh(refetch);

  return {
    boat: boat.data,
    sails: sails.data,
    equipment: equipment.data,
    maintenance: maintenance.data,
    loading,
    error,
    refreshing,
    onRefresh,
    refetch
  };
}

export function useFleetDetailData(fleetId: string) {
  const fleet = useFleet(fleetId);
  const members = useFleetMembers(fleetId);

  const loading = fleet.loading || members.loading;
  const error = fleet.error || members.error;

  const refetch = useCallback(async () => {
    await Promise.all([
      fleet.refetch(),
      members.refetch()
    ]);
  }, [fleet, members]);

  const { refreshing, onRefresh } = usePullToRefresh(refetch);

  return {
    fleet: fleet.data,
    members: members.data,
    loading,
    error,
    refreshing,
    onRefresh,
    refetch
  };
}

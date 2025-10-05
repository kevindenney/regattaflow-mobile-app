import { useCallback } from 'react';
import { useAuth } from '@/src/providers/AuthProvider';
import api from '@/src/services/apiService';
import { useApi, useMutation, usePaginatedQuery, UsePullToRefreshReturn, usePullToRefresh } from './useApi';
import { Tables, TablesInsert, TablesUpdate } from '@/src/services/supabase';

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

  return useApi(
    async () => {
      // Query regattas table directly instead of non-existent regatta_races
      const { data, error } = await api.supabase
        .from('regattas')
        .select('*')
        .eq('created_by', user?.id)
        .order('start_date', { ascending: true })
        .limit(20);

      if (error) throw error;

      // Map to expected format for dashboard
      return (data || []).map((regatta: any) => ({
        id: regatta.id,
        name: regatta.name,
        venue: regatta.metadata?.venue || 'Venue TBD',
        scheduled_start: regatta.start_date,
        boatClass: regatta.metadata?.class_name || 'Class TBD',
        status: regatta.status || 'upcoming'
      }));
    },
    { enabled: !!user?.id }
  );
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
      const { RaceAnalysisService } = await import('@/src/services/RaceAnalysisService');
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

  const profile = useSailorProfile();
  const races = useRaces();
  const performanceHistory = usePerformanceHistory(5);
  const boats = useBoats();
  const fleets = useFleets();
  const recentSessions = useRecentTimerSessions(5);

  const loading = profile.loading || races.loading || performanceHistory.loading || boats.loading || fleets.loading || recentSessions.loading;
  const error = profile.error || races.error || performanceHistory.error || boats.error || fleets.error || recentSessions.error;

  const refetch = useCallback(async () => {
    await Promise.all([
      profile.refetch(),
      races.refetch(),
      performanceHistory.refetch(),
      boats.refetch(),
      fleets.refetch(),
      recentSessions.refetch()
    ]);
  }, [profile, races, performanceHistory, boats, fleets, recentSessions]);

  const { refreshing, onRefresh } = usePullToRefresh(refetch);

  return {
    profile: profile.data,
    nextRace: (races.data && races.data[0]) || null,
    recentRaces: (races.data && races.data.slice(1, 6)) || [],
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

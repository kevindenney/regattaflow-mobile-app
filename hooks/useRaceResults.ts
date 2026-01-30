import { createChannelName, realtimeService } from '@/services/RealtimeService';
import { supabase } from '@/services/supabase';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('RaceResults');

/**
 * Validates if a string is a valid UUID format
 */
const isValidUUID = (id: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export interface RaceResult {
  id: string;
  regatta_id: string;
  race_number?: number;
  sailor_id: string;
  position: number;
  points: number;
  finish_time?: string;
  dnf?: boolean;
  dsq?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Race {
  id: string;
  regatta_id: string;
  race_number: number;
  scheduled_start: string;
  actual_start?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'abandoned';
  course_config?: any;
  weather_snapshot?: any;
}

/**
 * Hook for real-time race results updates
 */
export function useRaceResults(raceId?: string) {
  const [results, setResults] = useState<RaceResult[]>([]);
  const [race, setRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load initial results
  const loadResults = useCallback(async () => {
    if (!raceId || !isValidUUID(raceId)) {
      // Skip Supabase query for missing or demo race IDs
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load race/regatta details
      const { data: raceData, error: raceError } = await supabase
        .from('regattas')
        .select('*')
        .eq('id', raceId)
        .single();

      if (raceError) throw raceError;
      setRace(raceData);

      // Load results
      const { data: resultsData, error: resultsError } = await supabase
        .from('race_results')
        .select('*')
        .eq('regatta_id', raceId)
        .order('position', { ascending: true });

      if (resultsError) throw resultsError;
      setResults(resultsData || []);
    } catch (err) {
      logger.error('Error loading results:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [raceId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!raceId || !isValidUUID(raceId)) return;

    loadResults();

    const channelName = createChannelName('race-results', raceId);

    // Subscribe to race results updates
    realtimeService.subscribe(
      channelName,
      {
        table: 'race_results',
        filter: `regatta_id=eq.${raceId}`,
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          setResults((prev) => [...prev, payload.new as RaceResult].sort((a, b) => a.position - b.position));
        } else if (payload.eventType === 'UPDATE') {
          setResults((prev) =>
            prev.map((r) => (r.id === payload.new.id ? (payload.new as RaceResult) : r))
              .sort((a, b) => a.position - b.position)
          );
        } else if (payload.eventType === 'DELETE') {
          setResults((prev) => prev.filter((r) => r.id !== payload.old.id));
        }
      }
    );

    // Subscribe to race status updates
    const raceChannelName = createChannelName('race-status', raceId);
    realtimeService.subscribe(
      raceChannelName,
      {
        table: 'regattas',
        filter: `id=eq.${raceId}`,
      },
      (payload) => {
        if (payload.eventType === 'UPDATE') {
          setRace(payload.new as Race);
        }
      }
    );

    return () => {
      realtimeService.unsubscribe(channelName);
      realtimeService.unsubscribe(raceChannelName);
    };
  }, [raceId, loadResults]);

  return {
    results,
    race,
    loading,
    error,
    refresh: loadResults,
  };
}

/**
 * Hook for monitoring live race updates across multiple races
 */
export function useLiveRaces(userId?: string) {
  const [liveRaces, setLiveRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasLoadedRef = useRef(false);

  const loadLiveRaces = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Only show full loading skeleton on the first fetch.
    // Subsequent fetches (tab re-focus, pull-to-refresh) keep existing data visible.
    if (!hasLoadedRef.current) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const racesById = new Map<string, Race>();
      const addRaces = (races: any[] | null | undefined) => {
        races?.forEach((race: any) => {
          if (race?.id) {
            racesById.set(race.id, race);
          }
        });
      };

      // Regattas the user created
      const { data: createdRaces, error: createdError } = await supabase
        .from('regattas')
        .select('*')
        .eq('created_by', userId)
        .order('start_date', { ascending: true })
        .limit(100);

      if (createdError) {
        logger.warn('Returning empty due to regatta query error:', createdError);
        setLiveRaces([]);
        setLoading(false);
        return;
      }
      addRaces(createdRaces as any[]);

      // Regattas where the user is registered as a participant (excluding withdrawn)
      const { data: participantRows, error: participantRegError } = await supabase
        .from('race_participants')
        .select('regatta_id')
        .eq('user_id', userId)
        .not('regatta_id', 'is', null)
        .neq('status', 'withdrawn');

      if (participantRegError) {
        logger.warn('Unable to load registered regattas from race_participants:', participantRegError);
      } else {
        const participantRegattaIds = Array.from(
          new Set((participantRows ?? []).map((row) => row.regatta_id).filter(Boolean))
        ) as string[];

        const missingParticipantIds = participantRegattaIds.filter((regattaId) => !racesById.has(regattaId));

        if (missingParticipantIds.length > 0) {
          const { data: registeredRaces, error: regRacesError } = await supabase
            .from('regattas')
            .select('*')
            .in('id', missingParticipantIds)
            .order('start_date', { ascending: true });

          if (regRacesError) {
            logger.warn('Unable to load regattas for registered participants:', regRacesError);
          } else {
            addRaces(registeredRaces as any[]);
          }
        }
      }

      // Regattas where the user has logged timer sessions
      const { data: sessionRows, error: sessionsError } = await supabase
        .from('race_timer_sessions')
        .select('regatta_id')
        .eq('sailor_id', userId)
        .not('regatta_id', 'is', null)
        .order('end_time', { ascending: false })
        .limit(200);

      if (sessionsError) {
        logger.warn('Unable to load participant regattas from race_timer_sessions:', sessionsError);
      } else {
        const uniqueSessionRegattaIds = Array.from(
          new Set((sessionRows ?? []).map((row) => row.regatta_id).filter(Boolean))
        ) as string[];

        const missingRegattaIds = uniqueSessionRegattaIds.filter((regattaId) => !racesById.has(regattaId));

        if (missingRegattaIds.length > 0) {
          const { data: participantRaces, error: participantError } = await supabase
            .from('regattas')
            .select('*')
            .in('id', missingRegattaIds)
            .order('start_date', { ascending: true });

          if (participantError) {
            logger.warn('Unable to load regattas for participant sessions:', participantError);
          } else {
            addRaces(participantRaces as any[]);
          }
        }
      }

      // Race events created by the user (user-created races via add race flow)
      const { data: userRaceEvents, error: raceEventsError } = await supabase
        .from('race_events')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: true })
        .limit(100);

      if (raceEventsError) {
        logger.warn('Unable to load user race_events:', raceEventsError);
      } else {
        // Normalize race_events to match regatta structure for consistent handling
        const normalizedRaceEvents = (userRaceEvents || []).map((event: any) => ({
          ...event,
          // Map race_events fields to regatta-like structure
          start_date: event.start_time || event.event_date,
          race_name: event.name,
          created_by: event.user_id,
          // Map location to metadata.venue_name so useEnrichedRaces can find it
          metadata: {
            ...(event.metadata || {}),
            venue_name: event.location || event.metadata?.venue_name || null,
            venue: event.location || event.metadata?.venue || null,
          },
          _source: 'race_events', // Track source for debugging
        }));
        addRaces(normalizedRaceEvents);
      }

      // Map to track collaboration info for each race
      const collaborationInfo = new Map<string, {
        isCollaborator: boolean;
        isPendingInvite: boolean;
        accessLevel: string;
        collaboratorId: string;
      }>();

      // Regattas where the user is a collaborator (accepted or pending)
      const { data: collaboratorRows, error: collaboratorError } = await supabase
        .from('race_collaborators')
        .select('regatta_id, id, access_level, status')
        .eq('user_id', userId)
        .in('status', ['accepted', 'pending']);

      if (collaboratorError) {
        logger.warn('Unable to load collaborator regattas:', collaboratorError);
      } else {
        const collaboratorRegattaIds = Array.from(
          new Set((collaboratorRows ?? []).map((row) => row.regatta_id).filter(Boolean))
        ) as string[];

        // Store collaboration info for each race
        (collaboratorRows ?? []).forEach((row) => {
          if (row.regatta_id) {
            collaborationInfo.set(row.regatta_id, {
              isCollaborator: row.status === 'accepted',
              isPendingInvite: row.status === 'pending',
              accessLevel: row.access_level,
              collaboratorId: row.id,
            });
          }
        });

        const missingCollaboratorIds = collaboratorRegattaIds.filter((regattaId) => !racesById.has(regattaId));

        if (missingCollaboratorIds.length > 0) {
          const { data: collaboratorRaces, error: collabRacesError } = await supabase
            .from('regattas')
            .select('*')
            .in('id', missingCollaboratorIds)
            .order('start_date', { ascending: true });

          if (collabRacesError) {
            logger.warn('Unable to load regattas for collaborators:', collabRacesError);
          } else {
            addRaces(collaboratorRaces as any[]);
          }
        }
      }

      // Add ownership/collaboration flags to all races
      const merged = Array.from(racesById.values()).map((race: any) => {
        const collabInfo = collaborationInfo.get(race.id);
        return {
          ...race,
          // Ownership flags
          isOwner: race.created_by === userId,
          isCollaborator: collabInfo?.isCollaborator ?? false,
          isPendingInvite: collabInfo?.isPendingInvite ?? false,
          accessLevel: collabInfo?.accessLevel ?? (race.created_by === userId ? 'full' : undefined),
          collaboratorId: collabInfo?.collaboratorId ?? undefined,
        };
      }).sort((a: any, b: any) => {
        const aTime = a?.start_date ? new Date(a.start_date).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b?.start_date ? new Date(b.start_date).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      });

      setLiveRaces(merged);
      hasLoadedRef.current = true;
    } catch (err) {
      logger.error('Error loading races:', err);
      setLiveRaces([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadLiveRaces();

    // Subscribe to regatta changes for the user (INSERT, UPDATE, DELETE)
    // Only set up subscription if we successfully loaded races
    const channelName = createChannelName('user-regattas', userId);

    try {
      realtimeService.subscribe(
        channelName,
        {
          table: 'regattas',
          // No event filter - listen to all events (INSERT, UPDATE, DELETE)
        },
        (payload) => {
          try {
            if (payload.eventType === 'INSERT') {
              // Add new race to the list
              const newRace = payload.new as Race;
              setLiveRaces((prev) => {
                // Check if race already exists to avoid duplicates
                if (prev.some((r) => r.id === newRace.id)) {
                  return prev;
                }
                // Add and sort by start_date
                return [...prev, newRace].sort((a: any, b: any) =>
                  new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
                );
              });
            } else if (payload.eventType === 'UPDATE') {
              // Update existing race
              const updatedRace = payload.new as Race;
              setLiveRaces((prev) => {
                const index = prev.findIndex((r) => r.id === updatedRace.id);
                if (index >= 0) {
                  const updated = [...prev];
                  updated[index] = updatedRace;
                  return updated;
                }
                return prev;
              });
            } else if (payload.eventType === 'DELETE') {
              // Remove deleted race
              setLiveRaces((prev) => prev.filter((r) => r.id !== payload.old.id));
            }
          } catch (err) {
            logger.error('Error handling realtime event:', err);
          }
        }
      );
    } catch (err) {
      logger.error('Error setting up realtime subscription:', err);
    }

    // Also subscribe to race_events for user-created races
    const raceEventsChannelName = createChannelName('user-race-events', userId);
    try {
      realtimeService.subscribe(
        raceEventsChannelName,
        {
          table: 'race_events',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          try {
            if (payload.eventType === 'INSERT') {
              const newEvent = payload.new as any;
              // Normalize to match regatta structure
              const normalizedEvent = {
                ...newEvent,
                start_date: newEvent.start_time || newEvent.event_date,
                race_name: newEvent.name,
                created_by: newEvent.user_id,
                _source: 'race_events',
              };
              setLiveRaces((prev) => {
                if (prev.some((r) => r.id === normalizedEvent.id)) {
                  return prev;
                }
                return [...prev, normalizedEvent].sort((a: any, b: any) =>
                  new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
                );
              });
            } else if (payload.eventType === 'UPDATE') {
              const updatedEvent = payload.new as any;
              const normalizedEvent = {
                ...updatedEvent,
                start_date: updatedEvent.start_time || updatedEvent.event_date,
                race_name: updatedEvent.name,
                created_by: updatedEvent.user_id,
                _source: 'race_events',
              };
              setLiveRaces((prev) => {
                const index = prev.findIndex((r) => r.id === normalizedEvent.id);
                if (index >= 0) {
                  const updated = [...prev];
                  updated[index] = normalizedEvent;
                  return updated;
                }
                return prev;
              });
            } else if (payload.eventType === 'DELETE') {
              setLiveRaces((prev) => prev.filter((r) => r.id !== payload.old.id));
            }
          } catch (err) {
            logger.error('Error handling race_events realtime event:', err);
          }
        }
      );
    } catch (err) {
      logger.error('Error setting up race_events realtime subscription:', err);
    }

    // Subscribe to race_collaborators changes for this user
    // This handles when user receives a new invite or when their invite status changes
    const collaboratorsChannelName = createChannelName('user-collaborators', userId);
    try {
      realtimeService.subscribe(
        collaboratorsChannelName,
        {
          table: 'race_collaborators',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          try {
            // For any collaborator change, refresh the races list to get updated data
            // This is simpler than trying to merge individual updates and ensures consistency
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
              loadLiveRaces();
            }
          } catch (err) {
            logger.error('Error handling race_collaborators realtime event:', err);
          }
        }
      );
    } catch (err) {
      logger.error('Error setting up race_collaborators realtime subscription:', err);
    }

    return () => {
      try {
        realtimeService.unsubscribe(channelName);
        realtimeService.unsubscribe(raceEventsChannelName);
        realtimeService.unsubscribe(collaboratorsChannelName);
      } catch (err) {
        logger.error('Error unsubscribing from realtime:', err);
      }
    };
  }, [userId, loadLiveRaces]);

  return {
    liveRaces,
    loading,
    isRefreshing,
    refresh: loadLiveRaces,
  };
}

/**
 * Withdraw from a race (hide it from timeline)
 * This sets the race_participants status to 'withdrawn' for the user
 */
export async function withdrawFromRace(userId: string, regattaId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('race_participants')
      .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('regatta_id', regattaId);

    if (error) {
      logger.error('Error withdrawing from race:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    logger.error('Exception withdrawing from race:', err);
    return { success: false, error: err.message || 'Unknown error' };
  }
}

/**
 * Re-register for a race (unhide it)
 * This sets the race_participants status back to 'registered'
 */
export async function rejoinRace(userId: string, regattaId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('race_participants')
      .update({ status: 'registered', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('regatta_id', regattaId);

    if (error) {
      logger.error('Error rejoining race:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    logger.error('Exception rejoining race:', err);
    return { success: false, error: err.message || 'Unknown error' };
  }
}

// ============================================================================
// USER RACE RESULTS
// ============================================================================

export interface UserRaceResult {
  regattaId: string;
  position: number;
  points: number;
  fleetSize: number;
  status: 'finished' | 'dnf' | 'dns' | 'dsq' | 'ocs' | 'ret';
  seriesPosition?: number;
  totalRaces?: number;
}

/**
 * Fetch race results for a specific user across their regattas
 * Returns a map of regattaId -> UserRaceResult
 */
export async function fetchUserResults(userId: string, regattaIds: string[]): Promise<Map<string, UserRaceResult>> {
  const resultsMap = new Map<string, UserRaceResult>();

  // Filter out demo race IDs (non-UUIDs) before querying Supabase
  const validRegattaIds = regattaIds.filter(isValidUUID);

  if (!userId || validRegattaIds.length === 0) {
    return resultsMap;
  }

  try {
    // First, try to get results from series_standings (for series races)
    const { data: standings, error: standingsError } = await supabase
      .from('series_standings')
      .select(`
        regatta_id,
        rank,
        net_points,
        races_sailed,
        race_scores,
        sailor_id
      `)
      .in('regatta_id', validRegattaIds);

    if (!standingsError && standings) {
      // Filter standings for this user and map to results
      for (const standing of standings) {
        // Check if this standing belongs to the user
        if (standing.sailor_id === userId) {
          // Get fleet size from counting all standings in same regatta
          const fleetSize = standings.filter(s => s.regatta_id === standing.regatta_id).length;
          
          resultsMap.set(standing.regatta_id, {
            regattaId: standing.regatta_id,
            position: standing.rank,
            points: standing.net_points,
            fleetSize,
            status: 'finished',
            seriesPosition: standing.rank,
            totalRaces: standing.races_sailed,
          });
        }
      }
    }

    // Also check race_results table for individual race results
    const { data: raceResults, error: raceResultsError } = await supabase
      .from('race_results')
      .select(`
        id,
        regatta_id,
        race_number,
        sailor_id,
        position,
        points,
        status_code
      `)
      .eq('sailor_id', userId);

    if (!raceResultsError && raceResults) {
      for (const result of raceResults) {
        const regattaId = result.regatta_id;

        if (regattaId && validRegattaIds.includes(regattaId) && !resultsMap.has(regattaId)) {
          // Count fleet size for this regatta + race_number
          const { count } = await supabase
            .from('race_results')
            .select('*', { count: 'exact', head: true })
            .eq('regatta_id', regattaId)
            .eq('race_number', result.race_number);

          resultsMap.set(regattaId, {
            regattaId,
            position: result.position,
            points: result.points || result.position,
            fleetSize: count || 0,
            status: (result.status_code?.toLowerCase() || 'finished') as UserRaceResult['status'],
          });
        }
      }
    }

    // For demo purposes, also check race_participants for any mock results
    const { data: participants, error: participantsError } = await supabase
      .from('race_participants')
      .select('regatta_id, finish_position, points_scored, status')
      .eq('user_id', userId)
      .in('regatta_id', validRegattaIds)
      .not('finish_position', 'is', null);

    if (!participantsError && participants) {
      for (const participant of participants) {
        if (!resultsMap.has(participant.regatta_id) && participant.finish_position) {
          // Get fleet size
          const { count } = await supabase
            .from('race_participants')
            .select('*', { count: 'exact', head: true })
            .eq('regatta_id', participant.regatta_id)
            .not('finish_position', 'is', null);

          resultsMap.set(participant.regatta_id, {
            regattaId: participant.regatta_id,
            position: participant.finish_position,
            points: participant.points_scored || participant.finish_position,
            fleetSize: count || 0,
            status: 'finished',
          });
        }
      }
    }

    logger.debug(`[fetchUserResults] Found results for ${resultsMap.size} regattas`);
  } catch (err) {
    logger.error('[fetchUserResults] Error fetching user results:', err);
  }

  return resultsMap;
}

/**
 * Hook to fetch and cache user race results
 */
export function useUserRaceResults(userId?: string, regattaIds?: string[]) {
  const [results, setResults] = useState<Map<string, UserRaceResult>>(new Map());
  const [loading, setLoading] = useState(false);

  const loadResults = useCallback(async () => {
    if (!userId || !regattaIds || regattaIds.length === 0) {
      return;
    }

    setLoading(true);
    try {
      const fetchedResults = await fetchUserResults(userId, regattaIds);
      setResults(fetchedResults);
    } finally {
      setLoading(false);
    }
  }, [userId, regattaIds?.join(',')]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  return {
    results,
    loading,
    refresh: loadResults,
  };
}

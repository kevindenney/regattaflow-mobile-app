import { createChannelName, realtimeService } from '@/src/services/RealtimeService';
import { supabase } from '@/src/services/supabase';
import { useCallback, useEffect, useState } from 'react';

export interface RaceResult {
  id: string;
  race_id: string;
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
    if (!raceId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load race details
      const { data: raceData, error: raceError } = await supabase
        .from('regatta_races')
        .select('*')
        .eq('id', raceId)
        .single();

      if (raceError) throw raceError;
      setRace(raceData);

      // Load results
      const { data: resultsData, error: resultsError } = await supabase
        .from('race_results')
        .select('*')
        .eq('race_id', raceId)
        .order('position', { ascending: true });

      if (resultsError) throw resultsError;
      setResults(resultsData || []);
    } catch (err) {
      console.error('[useRaceResults] Error loading results:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [raceId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!raceId) return;

    loadResults();

    const channelName = createChannelName('race-results', raceId);

    // Subscribe to race results updates
    realtimeService.subscribe(
      channelName,
      {
        table: 'race_results',
        filter: `race_id=eq.${raceId}`,
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
        table: 'regatta_races',
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

  const loadLiveRaces = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Get all regattas for the user (don't filter by status to show all races)
      let { data, error } = await supabase
        .from('regattas')
        .select('*')
        .eq('created_by', userId)
        .order('start_date', { ascending: true })
        .limit(10);

      if (error) {
        console.warn('[useLiveRaces] returning empty due to error', error);
        setLiveRaces([]);
        return;
      }
      setLiveRaces((data as any[]) || []);
    } catch (err) {
      console.error('[useLiveRaces] Error loading races:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    loadLiveRaces();

    // Subscribe to regatta changes for the user (INSERT, UPDATE, DELETE)
    const channelName = createChannelName('user-regattas', userId);
    realtimeService.subscribe(
      channelName,
      {
        table: 'regattas',
        // No event filter - listen to all events (INSERT, UPDATE, DELETE)
      },
      (payload) => {
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
      }
    );

    return () => {
      realtimeService.unsubscribe(channelName);
    };
  }, [userId, loadLiveRaces]);

  return {
    liveRaces,
    loading,
    refresh: loadLiveRaces,
  };
}

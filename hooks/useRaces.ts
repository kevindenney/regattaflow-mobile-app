// src/hooks/useRaces.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { isMissingIdColumn } from '@/lib/utils/supabaseSchemaFallback';
import { createLogger } from '@/lib/utils/logger';

interface RaceWithCourse {
  id: string;
  name: string;
  date: string;
  venue: string;
  hasStrategy: boolean;
  courseMarks: any[];
  regattaId?: string;
  startTime?: string;
  status?: 'upcoming' | 'in_progress' | 'completed';
}

interface UseRacesReturn {
  races: RaceWithCourse[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const logger = createLogger('useRaces');

export function useRaces(): UseRacesReturn {
  const { user } = useAuth();
  const [races, setRaces] = useState<RaceWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const fetchRunIdRef = useRef(0);
  const activeUserIdRef = useRef<string | null>(user?.id ?? null);

  useEffect(() => {
    activeUserIdRef.current = user?.id ?? null;
  }, [user?.id]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      fetchRunIdRef.current += 1;
    };
  }, []);

  const fetchRaces = useCallback(async () => {
    const runId = ++fetchRunIdRef.current;
    const targetUserId = user?.id ?? null;
    const canCommit = () =>
      isMountedRef.current &&
      runId === fetchRunIdRef.current &&
      activeUserIdRef.current === targetUserId;

    try {
      if (!canCommit()) return;
      setLoading(true);
      setError(null);

      if (!targetUserId) {
        if (!canCommit()) return;
        setRaces([]);
        setLoading(false);
        return;
      }

      // Fetch races with their associated strategies
      const { data: racesData, error: racesError } = await supabase
        .from('races')
        .select(`
          id,
          name,
          race_date,
          venue_name,
          regatta_id,
          start_time,
          status
        `)
        .eq('user_id', targetUserId)
        .order('race_date', { ascending: true });

      if (racesError) {
        throw new Error(racesError.message);
      }

      // Fetch strategies for these races
      const primaryStrategies = await supabase
        .from('race_strategies')
        .select('id, regatta_id, strategy_content')
        .eq('user_id', targetUserId);
      let strategiesData = primaryStrategies.data as any[] | null;
      let strategiesError = primaryStrategies.error;
      if (strategiesError && isMissingIdColumn(strategiesError, 'race_strategies', 'regatta_id')) {
        const fallbackStrategies = await supabase
          .from('race_strategies')
          .select('id, race_id, strategy_content')
          .eq('user_id', targetUserId);
        strategiesData = fallbackStrategies.data as any[] | null;
        strategiesError = fallbackStrategies.error;
      }

      if (strategiesError) {
        logger.error('Error fetching strategies', strategiesError);
        // Don't fail completely if strategies fail
      }

      // Map strategies to races
      const strategiesMap = new Map(
        (strategiesData || []).map((s: any) => [s.regatta_id || s.race_id, s])
      );

      // Transform to RaceWithCourse format
      const transformedRaces: RaceWithCourse[] = (racesData || []).map(race => {
        const strategy = strategiesMap.get(race.regatta_id || race.id);
        const strategyContent = (strategy as any)?.strategy_content || {};
        const courseMarks = Array.isArray(strategyContent?.course_marks)
          ? strategyContent.course_marks
          : Array.isArray(strategyContent?.mark_roundings)
          ? strategyContent.mark_roundings
          : [];

        return {
          id: race.id,
          name: race.name,
          date: formatRaceDate(race.race_date),
          venue: race.venue_name || 'Unknown Venue',
          hasStrategy: !!strategy,
          courseMarks,
          regattaId: race.regatta_id,
          startTime: race.start_time,
          status: race.status as 'upcoming' | 'in_progress' | 'completed',
        };
      });

      if (!canCommit()) return;
      setRaces(transformedRaces);
    } catch (err: any) {
      logger.error('Error fetching races', err);
      if (!canCommit()) return;
      setError(err.message || 'Failed to load races');
      setRaces([]);
    } finally {
      if (!canCommit()) return;
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void fetchRaces();
  }, [fetchRaces]);

  return {
    races,
    loading,
    error,
    refresh: fetchRaces,
  };
}

/**
 * Format race date for display
 */
function formatRaceDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0 && diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 0 && diffDays > -7) return `${Math.abs(diffDays)} days ago`;

    // Otherwise format as date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return dateString;
  }
}

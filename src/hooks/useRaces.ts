// src/hooks/useRaces.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/src/services/supabase';
import { useAuth } from '@/src/providers/AuthProvider';

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

export function useRaces(): UseRacesReturn {
  const { user } = useAuth();
  const [races, setRaces] = useState<RaceWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRaces = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        setRaces([]);
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
        .eq('user_id', user.id)
        .order('race_date', { ascending: true });

      if (racesError) {
        throw new Error(racesError.message);
      }

      // Fetch strategies for these races
      const { data: strategiesData, error: strategiesError } = await supabase
        .from('race_strategies')
        .select('id, race_id, course_marks')
        .eq('user_id', user.id);

      if (strategiesError) {
        console.error('Error fetching strategies:', strategiesError);
        // Don't fail completely if strategies fail
      }

      // Map strategies to races
      const strategiesMap = new Map(
        (strategiesData || []).map(s => [s.race_id, s])
      );

      // Transform to RaceWithCourse format
      const transformedRaces: RaceWithCourse[] = (racesData || []).map(race => {
        const strategy = strategiesMap.get(race.id);

        return {
          id: race.id,
          name: race.name,
          date: formatRaceDate(race.race_date),
          venue: race.venue_name || 'Unknown Venue',
          hasStrategy: !!strategy,
          courseMarks: strategy?.course_marks || [],
          regattaId: race.regatta_id,
          startTime: race.start_time,
          status: race.status as 'upcoming' | 'in_progress' | 'completed',
        };
      });

      setRaces(transformedRaces);
    } catch (err: any) {
      console.error('Error fetching races:', err);
      setError(err.message || 'Failed to load races');
      setRaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRaces();
  }, [user?.id]);

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

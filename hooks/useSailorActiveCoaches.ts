/**
 * useSailorActiveCoaches
 *
 * Hook to fetch and rank a sailor's active coaching relationships.
 * Used by CoachingSuggestionTile to show contextual coaching prompts.
 *
 * Returns:
 *   - hasCoach: boolean indicating if sailor has any active coach
 *   - primaryCoach: the most relevant coach based on context
 *   - activeCoaches: all active coaches with ranking info
 *   - isLoading: loading state
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';

export interface ActiveCoach {
  /** coaching_clients record ID */
  id: string;
  /** coach_profiles ID */
  coachId: string;
  /** Coach display name */
  displayName: string;
  /** Coach avatar URL */
  avatarUrl?: string | null;
  /** Coach specialties (e.g., 'tactics', 'boat_speed', 'starts') */
  specialties: string[];
  /** Boat classes the coach teaches */
  boatClasses: string[];
  /** Number of sessions with this coach */
  totalSessions: number;
  /** Date of last session */
  lastSessionDate?: string | null;
  /** Relevance score (0-100) based on context */
  relevanceScore: number;
}

interface UseSailorActiveCoachesOptions {
  /** Race's boat class for relevance ranking */
  raceBoatClass?: string;
  /** Phase context for specialty matching */
  phase?: 'prep' | 'review';
}

interface UseSailorActiveCoachesResult {
  /** Whether the sailor has at least one active coach */
  hasCoach: boolean;
  /** The most relevant coach based on context */
  primaryCoach: ActiveCoach | null;
  /** All active coaches with ranking */
  activeCoaches: ActiveCoach[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Error if any */
  error: Error | null;
}

/**
 * Phase-specific specialty mappings for coach relevance
 */
const PHASE_SPECIALTIES: Record<string, string[]> = {
  prep: ['strategy', 'tactics', 'starts', 'boat_setup', 'race_prep'],
  review: ['analysis', 'video_review', 'performance', 'debrief'],
};

/**
 * Calculate relevance score for a coach based on context
 * Higher score = more relevant
 */
function calculateRelevanceScore(
  coach: {
    specialties: string[];
    boatClasses: string[];
    totalSessions: number;
    lastSessionDate?: string | null;
  },
  options: UseSailorActiveCoachesOptions
): number {
  let score = 0;

  // Boat class match (40 pts)
  if (options.raceBoatClass && coach.boatClasses.includes(options.raceBoatClass)) {
    score += 40;
  }

  // Phase specialty match (30 pts)
  if (options.phase && PHASE_SPECIALTIES[options.phase]) {
    const phaseSpecialties = PHASE_SPECIALTIES[options.phase];
    const matchCount = coach.specialties.filter(s =>
      phaseSpecialties.some(ps => s.toLowerCase().includes(ps))
    ).length;
    if (matchCount > 0) {
      score += Math.min(30, matchCount * 15);
    }
  }

  // Recency score (20 pts)
  if (coach.lastSessionDate) {
    const daysSinceSession = Math.floor(
      (Date.now() - new Date(coach.lastSessionDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceSession < 7) {
      score += 20;
    } else if (daysSinceSession < 30) {
      score += 15;
    } else if (daysSinceSession < 90) {
      score += 10;
    }
  }

  // Session volume score (10 pts)
  score += Math.min(10, coach.totalSessions);

  return score;
}

export function useSailorActiveCoaches(
  options: UseSailorActiveCoachesOptions = {}
): UseSailorActiveCoachesResult {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['sailor-active-coaches', user?.id, options.raceBoatClass, options.phase],
    queryFn: async (): Promise<ActiveCoach[]> => {
      if (!user?.id) return [];

      // Fetch active coaching relationships
      const { data: clientRecords, error: clientError } = await supabase
        .from('coaching_clients')
        .select('id, coach_id, total_sessions, last_session_date')
        .eq('sailor_id', user.id)
        .eq('status', 'active');

      if (clientError) {
        console.error('[useSailorActiveCoaches] Error fetching clients:', clientError);
        throw clientError;
      }

      if (!clientRecords || clientRecords.length === 0) {
        return [];
      }

      // Get coach profile IDs
      const coachIds = clientRecords.map(c => c.coach_id).filter(Boolean);

      if (coachIds.length === 0) {
        return [];
      }

      // Fetch coach profiles
      const { data: coachProfiles, error: profileError } = await supabase
        .from('coach_profiles')
        .select('id, display_name, profile_photo_url, specialties, boat_classes_coached')
        .in('id', coachIds);

      if (profileError) {
        console.error('[useSailorActiveCoaches] Error fetching coach profiles:', profileError);
        throw profileError;
      }

      // Create a map for coach profiles
      const coachMap = new Map(
        (coachProfiles || []).map(c => [c.id, c])
      );

      // Build ActiveCoach objects with relevance scoring
      const activeCoaches: ActiveCoach[] = clientRecords
        .map(client => {
          const coachProfile = coachMap.get(client.coach_id);
          if (!coachProfile) return null;

          const coachData = {
            specialties: coachProfile.specialties || [],
            boatClasses: coachProfile.boat_classes_coached || [],
            totalSessions: client.total_sessions || 0,
            lastSessionDate: client.last_session_date,
          };

          const relevanceScore = calculateRelevanceScore(coachData, options);

          return {
            id: client.id,
            coachId: coachProfile.id,
            displayName: coachProfile.display_name || 'Coach',
            avatarUrl: coachProfile.profile_photo_url,
            specialties: coachProfile.specialties || [],
            boatClasses: coachProfile.boat_classes_coached || [],
            totalSessions: client.total_sessions || 0,
            lastSessionDate: client.last_session_date,
            relevanceScore,
          };
        })
        .filter((c): c is ActiveCoach => c !== null)
        .sort((a, b) => b.relevanceScore - a.relevanceScore);

      return activeCoaches;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const activeCoaches = data || [];
  const hasCoach = activeCoaches.length > 0;
  const primaryCoach = activeCoaches[0] || null;

  return {
    hasCoach,
    primaryCoach,
    activeCoaches,
    isLoading,
    error: error as Error | null,
  };
}

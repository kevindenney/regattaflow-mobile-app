/**
 * useCoachingStatus
 *
 * Determines the user's coaching relationship status for rendering
 * context-aware coaching prompts throughout the app.
 *
 * Three states:
 *   1. NO_RELATIONSHIP  – never engaged with coaching
 *   2. HAS_COACH        – actively being coached (has active coaching_clients record)
 *   3. IS_COACH          – has coaching capability / is a coach
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import { useUserSeasons } from '@/hooks/useSeason';

export type CoachingRelationship = 'NO_RELATIONSHIP' | 'HAS_COACH' | 'IS_COACH';

interface CoachingStatus {
  /** The user's coaching relationship category */
  relationship: CoachingRelationship;
  /** Number of seasons the user has been racing (for banner copy) */
  seasonCount: number;
  /** Whether data is still loading */
  isLoading: boolean;
}

export function useCoachingStatus(): CoachingStatus {
  const { user, capabilities } = useAuth();

  // Check if user is being coached (has an active coaching_clients record)
  const { data: coachingClient, isLoading: loadingClient } = useQuery({
    queryKey: ['coaching-status', 'has-coach', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('coaching_clients')
        .select('id')
        .eq('sailor_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id && !capabilities?.hasCoaching,
    staleTime: 5 * 60 * 1000,
  });

  // Season count for banner messaging
  const { data: seasons, isLoading: loadingSeasons } = useUserSeasons();
  const seasonCount = seasons?.length ?? 0;

  const isLoading = loadingClient || loadingSeasons;

  let relationship: CoachingRelationship = 'NO_RELATIONSHIP';
  if (capabilities?.hasCoaching) {
    relationship = 'IS_COACH';
  } else if (coachingClient) {
    relationship = 'HAS_COACH';
  }

  return { relationship, seasonCount, isLoading };
}

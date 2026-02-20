/**
 * useSailorCoachRelationships
 *
 * React Query hook that fetches the current sailor's active coaching
 * relationships (from the sailor's perspective). Used by the Learn → Coaches
 * orchestrator to decide which view to render.
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { coachingService } from '@/services/CoachingService';
import type { CoachingClient, CoachProfile } from '@/services/CoachingService';

export type SailorCoachRelationship = CoachingClient & {
  coachProfile?: CoachProfile;
};

export function useSailorCoachRelationships() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['sailor', 'coach-relationships', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await coachingService.getSailorCoachRelationships(user.id, 'active');
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const relationships = query.data ?? [];

  return {
    relationships,
    hasActiveCoach: relationships.length > 0,
    coachCount: relationships.length,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

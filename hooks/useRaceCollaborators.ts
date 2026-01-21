/**
 * useRaceCollaborators Hook
 *
 * Lightweight hook for just displaying collaborator avatars on race cards.
 * Uses React Query for caching and automatic refetching.
 */

import { useQuery } from '@tanstack/react-query';
import { RaceCollaborationService } from '@/services/RaceCollaborationService';
import { RaceCollaborator } from '@/types/raceCollaboration';
import { isUuid } from '@/utils/uuid';

interface UseRaceCollaboratorsResult {
  collaborators: RaceCollaborator[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useRaceCollaborators(regattaId: string | null): UseRaceCollaboratorsResult {
  const {
    data: collaborators = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['race-collaborators', regattaId],
    queryFn: () => RaceCollaborationService.getCollaborators(regattaId!),
    enabled: !!regattaId && isUuid(regattaId), // Only query for valid UUIDs
    staleTime: 30000, // 30 seconds - collaborators don't change often
    gcTime: 5 * 60 * 1000, // 5 minutes cache time
  });

  return {
    collaborators,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

/**
 * Hook to get only accepted collaborators (for avatar display)
 */
export function useAcceptedCollaborators(regattaId: string | null): RaceCollaborator[] {
  const { collaborators } = useRaceCollaborators(regattaId);
  return collaborators.filter((c) => c.status === 'accepted');
}

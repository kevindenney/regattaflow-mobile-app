/**
 * useCompetenciesForInterest — Fetches competency definitions for a given interest.
 */

import { useQuery } from '@tanstack/react-query';
import { getCompetencies } from '@/services/competencyService';
import type { Competency } from '@/types/competency';

export function useCompetenciesForInterest(interestId: string | undefined) {
  return useQuery<Competency[], Error>({
    queryKey: ['competencies', interestId],
    queryFn: () => getCompetencies(interestId!),
    enabled: Boolean(interestId),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

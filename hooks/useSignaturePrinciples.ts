import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { useOrganization } from '@/providers/OrganizationProvider';
import { signatureInsightService, UserPrincipleMemory } from '@/services/SignatureInsightService';

const SIGNATURE_PRINCIPLES_KEYS = {
  all: ['signature-principles'] as const,
  list: (userId: string, interestId: string) =>
    [...SIGNATURE_PRINCIPLES_KEYS.all, userId, interestId] as const,
};

export function useSignaturePrinciples(limit = 20) {
  const { user } = useAuth();
  const { activeInterestSlug, activeDomain } = useOrganization();
  const userId = user?.id || null;
  const interestId = activeInterestSlug || activeDomain || 'sailing';

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: userId ? SIGNATURE_PRINCIPLES_KEYS.list(userId, interestId) : ['no-user-signature-principles'],
    queryFn: async () => {
      if (!userId) return [] as UserPrincipleMemory[];
      return signatureInsightService.listPrincipleMemory(userId, interestId, limit);
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });

  return {
    principles: (data || []) as UserPrincipleMemory[],
    isLoading,
    error,
    refetch,
    interestId,
  };
}

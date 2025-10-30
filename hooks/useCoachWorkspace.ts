import { useAuth } from '@/providers/AuthProvider';

export function useCoachWorkspace() {
  const { coachProfile, personaLoading, refreshPersonaContext } = useAuth();

  const coachId = coachProfile?.id ?? null;

  return {
    coachId,
    coachProfile,
    loading: personaLoading,
    isConnected: !!coachId,
    refresh: refreshPersonaContext,
  };
}

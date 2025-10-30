import { useAuth } from '@/providers/AuthProvider';

export function useClubWorkspace() {
  const { clubProfile, personaLoading, refreshPersonaContext } = useAuth();

  const clubId = clubProfile?.id ?? null;

  return {
    clubId,
    clubProfile,
    loading: personaLoading,
    isConnected: !!clubId,
    refresh: refreshPersonaContext,
  };
}

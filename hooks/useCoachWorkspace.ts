import { useCoachWorkspace as useCoachWorkspaceContext } from '@/providers/CoachWorkspaceProvider';

export function useCoachWorkspace() {
  const {
    coachId,
    coachProfile,
    isLoadingProfile,
    stats,
    refetchAll,
  } = useCoachWorkspaceContext();

  return {
    coachId,
    coachProfile,
    stats,
    loading: isLoadingProfile,
    isConnected: !!coachId,
    refresh: refetchAll,
  };
}

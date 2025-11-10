import { useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('useClubWorkspace');
const DEBUG = true;

export function useClubWorkspace() {
  const {
    clubProfile,
    userProfile,
    personaLoading,
    refreshPersonaContext,
  } = useAuth();

  if (DEBUG) {
    logger.debug('[hook] Auth snapshot', {
      hasClubProfile: !!clubProfile,
      clubProfileId: clubProfile?.id,
      clubProfileUserId: clubProfile?.user_id,
      hasUserProfile: !!userProfile,
      userProfileId: userProfile?.id,
      userProfileClubId: userProfile?.club_id,
      personaLoading,
    });
  }

  const clubId = useMemo(() => {
    if (clubProfile?.id) {
      if (DEBUG) logger.debug('[hook] clubId from clubProfile.id', clubProfile.id);
      return clubProfile.id as string;
    }
    if (userProfile?.club_id) {
      if (DEBUG) logger.debug('[hook] clubId from userProfile.club_id', userProfile.club_id);
      return userProfile.club_id as string;
    }
    if (DEBUG) logger.debug('[hook] clubId unresolved');
    return null;
  }, [clubProfile?.id, userProfile?.club_id]);

  const profile = useMemo(() => {
    if (clubProfile) {
      if (DEBUG) logger.debug('[hook] Using hydrated clubProfile');
      return clubProfile;
    }

    if (clubId && userProfile) {
      const fallbackProfile = {
        id: clubId,
        user_id: userProfile.id,
        club_name:
          (userProfile as any)?.club_name ||
          (userProfile as any)?.organization_name ||
          userProfile.full_name ||
          'Club',
        organization_name:
          (userProfile as any)?.organization_name ||
          (userProfile as any)?.club_name ||
          userProfile.full_name ||
          'Club',
      };
      if (DEBUG) logger.debug('[hook] Using fallback profile derived from userProfile', fallbackProfile);
      return fallbackProfile;
    }

    if (DEBUG) logger.debug('[hook] No club profile available yet');
    return null;
  }, [clubProfile, clubId, userProfile]);

  const loading = personaLoading;

  if (DEBUG) {
    logger.debug('[hook] Result', {
      clubId,
      hasProfile: !!profile,
      loading,
      isConnected: !!clubId,
    });
  }

  return {
    clubId,
    clubProfile: profile,
    loading,
    isConnected: !!clubId,
    refresh: refreshPersonaContext,
  };
}

/**
 * usePostRaceInterview Hook
 *
 * Manages post-race interview state, including loading user sessions,
 * triggering interviews on race completion, and handling interview completion.
 */

import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('usePostRaceInterview');

// =============================================================================
// TYPES
// =============================================================================

export interface RaceTimerSession {
  id: string;
  sailor_id: string;
  regatta_id: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  track_points?: Array<unknown>;
  [key: string]: unknown;
}

export interface SelectedRaceDataForInterview {
  name?: string;
  start_date?: string;
  [key: string]: unknown;
}

export interface UserForInterview {
  id: string;
  [key: string]: unknown;
}

export interface UsePostRaceInterviewParams {
  /** Currently selected race ID */
  selectedRaceId: string | null;
  /** Selected race data object */
  selectedRaceData: SelectedRaceDataForInterview | null;
  /** Current user */
  user: UserForInterview | null;
  /** Refetch function to refresh race data after interview */
  refetch?: () => void;
}

export interface UsePostRaceInterviewReturn {
  /** Whether post-race interview modal is shown */
  showPostRaceInterview: boolean;
  /** ID of the completed session for the interview */
  completedSessionId: string | null;
  /** Name of the completed race */
  completedRaceName: string;
  /** ID of the completed race */
  completedRaceId: string | null;
  /** Number of GPS points recorded in the session */
  completedSessionGpsPoints: number;
  /** User's most recent race timer session for this race */
  userPostRaceSession: RaceTimerSession | null;
  /** Whether user post-race session is loading */
  loadingUserPostRaceSession: boolean;
  /** Handler to manually open post-race interview */
  handleOpenPostRaceInterviewManually: () => Promise<void>;
  /** Handler called when a race is completed (triggers interview) */
  handleRaceComplete: (sessionId: string, raceName: string, raceId?: string) => Promise<void>;
  /** Handler called when interview is completed */
  handlePostRaceInterviewComplete: () => void;
  /** Handler to close the interview modal */
  handleClosePostRaceInterview: () => void;
  /** Setter for showPostRaceInterview (for external control) */
  setShowPostRaceInterview: React.Dispatch<React.SetStateAction<boolean>>;
  /** Setter for completedRaceName (for external control) */
  setCompletedRaceName: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * Hook for managing post-race interview flow
 */
export function usePostRaceInterview({
  selectedRaceId,
  selectedRaceData,
  user,
  refetch,
}: UsePostRaceInterviewParams): UsePostRaceInterviewReturn {
  // Post-race interview state
  const [showPostRaceInterview, setShowPostRaceInterview] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
  const [completedRaceName, setCompletedRaceName] = useState<string>('');
  const [completedRaceId, setCompletedRaceId] = useState<string | null>(null);
  const [completedSessionGpsPoints, setCompletedSessionGpsPoints] = useState<number>(0);
  const [userPostRaceSession, setUserPostRaceSession] = useState<RaceTimerSession | null>(null);
  const [loadingUserPostRaceSession, setLoadingUserPostRaceSession] = useState(false);

  // Load user's most recent race timer session for the selected race
  const loadUserPostRaceSession = useCallback(async () => {
    if (!selectedRaceId || !user?.id) {
      setUserPostRaceSession(null);
      return;
    }

    setLoadingUserPostRaceSession(true);
    try {
      const { data, error } = await supabase
        .from('race_timer_sessions')
        .select('*')
        .eq('regatta_id', selectedRaceId)
        .eq('sailor_id', user.id)
        .order('end_time', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        logger.warn('[usePostRaceInterview] Unable to load user race session', {
          error,
          selectedRaceId,
        });
        setUserPostRaceSession(null);
        return;
      }

      setUserPostRaceSession(data && data.length > 0 ? (data[0] as RaceTimerSession) : null);
    } catch (error) {
      logger.warn('[usePostRaceInterview] Unexpected error loading user race session', error);
      setUserPostRaceSession(null);
    } finally {
      setLoadingUserPostRaceSession(false);
    }
  }, [selectedRaceId, user?.id]);

  // Load user session when race selection changes
  useEffect(() => {
    loadUserPostRaceSession();
  }, [loadUserPostRaceSession]);

  // Handler to manually open post-race interview (creates session if needed)
  const handleOpenPostRaceInterviewManually = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Post-Race Interview', 'You need to be signed in to add post-race notes.');
      return;
    }

    if (!selectedRaceId || !selectedRaceData) {
      Alert.alert('Post-Race Interview', 'Select a race first to add your post-race interview.');
      return;
    }

    setLoadingUserPostRaceSession(true);
    try {
      let session = userPostRaceSession;

      // Create a new session if one doesn't exist
      if (!session) {
        const nowIso = new Date().toISOString();
        const startTime = selectedRaceData.start_date || nowIso;

        const { data: createdSession, error } = await supabase
          .from('race_timer_sessions')
          .insert({
            sailor_id: user.id,
            regatta_id: selectedRaceId,
            start_time: startTime,
            end_time: nowIso,
            duration_seconds: 0,
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        session = createdSession as RaceTimerSession;
        setUserPostRaceSession(createdSession as RaceTimerSession);
      }

      if (!session?.id) {
        throw new Error('Missing race timer session');
      }

      setCompletedSessionId(session.id);
      setCompletedRaceName(selectedRaceData.name ?? 'Race');
      setCompletedRaceId(selectedRaceId);
      setShowPostRaceInterview(true);
    } catch (error: any) {
      logger.error('[usePostRaceInterview] Failed to open post-race interview manually', error);
      Alert.alert(
        'Post-Race Interview',
        error?.message
          ? `Unable to open interview: ${error.message}`
          : 'We could not open the post-race interview. Please try again.'
      );
    } finally {
      setLoadingUserPostRaceSession(false);
    }
  }, [selectedRaceData, selectedRaceId, user?.id, userPostRaceSession]);

  // Handler for race completion - triggers post-race interview
  const handleRaceComplete = useCallback(async (sessionId: string, raceName: string, raceId?: string) => {
    logger.debug('Race completed:', sessionId, raceName, raceId);

    // Fetch GPS point count from the session
    try {
      const { data: session } = await supabase
        .from('race_timer_sessions')
        .select('track_points')
        .eq('id', sessionId)
        .single();

      const pointCount = Array.isArray(session?.track_points) ? session.track_points.length : 0;
      setCompletedSessionGpsPoints(pointCount);
    } catch (error) {
      logger.warn('Failed to fetch GPS points count', error);
      setCompletedSessionGpsPoints(0);
    }

    setCompletedSessionId(sessionId);
    setCompletedRaceName(raceName);
    setCompletedRaceId(raceId || null);
    setShowPostRaceInterview(true);
  }, []);

  // Handler for post-race interview completion
  const handlePostRaceInterviewComplete = useCallback(() => {
    logger.debug('Post-race interview completed');
    setShowPostRaceInterview(false);
    setCompletedSessionId(null);
    setCompletedRaceName('');
    setCompletedRaceId(null);
    setCompletedSessionGpsPoints(0);
    loadUserPostRaceSession();
    // Refresh races data to show updated analysis
    refetch?.();
  }, [loadUserPostRaceSession, refetch]);

  // Handler to close the interview modal
  const handleClosePostRaceInterview = useCallback(() => {
    setShowPostRaceInterview(false);
    setCompletedSessionId(null);
    setCompletedRaceName('');
    setCompletedRaceId(null);
    setCompletedSessionGpsPoints(0);
  }, []);

  return {
    showPostRaceInterview,
    completedSessionId,
    completedRaceName,
    completedRaceId,
    completedSessionGpsPoints,
    userPostRaceSession,
    loadingUserPostRaceSession,
    handleOpenPostRaceInterviewManually,
    handleRaceComplete,
    handlePostRaceInterviewComplete,
    handleClosePostRaceInterview,
    setShowPostRaceInterview,
    setCompletedRaceName,
  };
}

export default usePostRaceInterview;

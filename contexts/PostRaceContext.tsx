/**
 * Post Race Context
 *
 * Manages post-race interview flow and completed session state.
 * Provides a consistent interface for triggering and completing post-race reviews.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface PostRaceState {
  /** Whether post-race interview modal is visible */
  showInterview: boolean;
  /** Session ID for the completed race session */
  completedSessionId: string | null;
  /** Name of the completed race */
  completedRaceName: string;
  /** ID of the completed race */
  completedRaceId: string | null;
  /** Number of GPS points recorded during the session */
  completedSessionGpsPoints: number;
  /** User's post-race session data (if any) */
  userPostRaceSession: any | null;
  /** Whether loading user's post-race session */
  loadingUserPostRaceSession: boolean;
}

interface PostRaceContextValue extends PostRaceState {
  /** Show the post-race interview modal */
  openInterview: (options: {
    sessionId: string;
    raceName?: string;
    raceId?: string;
    gpsPoints?: number;
  }) => void;
  /** Close the post-race interview modal */
  closeInterview: () => void;
  /** Called when post-race interview is complete */
  completeInterview: () => void;
  /** Set user's post-race session data */
  setUserPostRaceSession: (session: any | null) => void;
  /** Set loading state for user post-race session */
  setLoadingUserPostRaceSession: (loading: boolean) => void;
  /** Reset all post-race state */
  reset: () => void;
}

const PostRaceContext = createContext<PostRaceContextValue | null>(null);

const initialState: PostRaceState = {
  showInterview: false,
  completedSessionId: null,
  completedRaceName: '',
  completedRaceId: null,
  completedSessionGpsPoints: 0,
  userPostRaceSession: null,
  loadingUserPostRaceSession: false,
};

interface PostRaceProviderProps {
  children: React.ReactNode;
  /** Optional callback when interview is completed */
  onInterviewComplete?: () => void;
}

export function PostRaceProvider({ children, onInterviewComplete }: PostRaceProviderProps) {
  const [state, setState] = useState<PostRaceState>(initialState);

  const openInterview = useCallback(
    (options: {
      sessionId: string;
      raceName?: string;
      raceId?: string;
      gpsPoints?: number;
    }) => {
      setState((prev) => ({
        ...prev,
        showInterview: true,
        completedSessionId: options.sessionId,
        completedRaceName: options.raceName ?? 'Race',
        completedRaceId: options.raceId ?? null,
        completedSessionGpsPoints: options.gpsPoints ?? 0,
      }));
    },
    []
  );

  const closeInterview = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showInterview: false,
    }));
  }, []);

  const completeInterview = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showInterview: false,
      completedSessionId: null,
      completedRaceName: '',
      completedRaceId: null,
      completedSessionGpsPoints: 0,
    }));
    onInterviewComplete?.();
  }, [onInterviewComplete]);

  const setUserPostRaceSession = useCallback((session: any | null) => {
    setState((prev) => ({
      ...prev,
      userPostRaceSession: session,
    }));
  }, []);

  const setLoadingUserPostRaceSession = useCallback((loading: boolean) => {
    setState((prev) => ({
      ...prev,
      loadingUserPostRaceSession: loading,
    }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const value = useMemo<PostRaceContextValue>(
    () => ({
      ...state,
      openInterview,
      closeInterview,
      completeInterview,
      setUserPostRaceSession,
      setLoadingUserPostRaceSession,
      reset,
    }),
    [
      state,
      openInterview,
      closeInterview,
      completeInterview,
      setUserPostRaceSession,
      setLoadingUserPostRaceSession,
      reset,
    ]
  );

  return <PostRaceContext.Provider value={value}>{children}</PostRaceContext.Provider>;
}

/**
 * Hook to access post-race context
 * @throws Error if used outside of PostRaceProvider
 */
export function usePostRace(): PostRaceContextValue {
  const context = useContext(PostRaceContext);
  if (!context) {
    throw new Error('usePostRace must be used within a PostRaceProvider');
  }
  return context;
}

/**
 * Hook to access post-race context (returns null if outside provider)
 */
export function usePostRaceSafe(): PostRaceContextValue | null {
  return useContext(PostRaceContext);
}

/**
 * Strategy Share Context
 *
 * Manages strategy sharing state and coach selection modals.
 * Provides a consistent interface for sharing race strategies with coaches.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface StrategyShareState {
  /** Whether coach selection modal is visible */
  showCoachSelection: boolean;
  /** Whether currently sharing a strategy */
  isSharing: boolean;
  /** Race event ID being shared */
  sharingRaceEventId: string | null;
  /** Strategy ID being shared */
  sharingStrategyId: string | null;
}

interface StrategyShareContextValue extends StrategyShareState {
  /** Open coach selection modal to share a strategy */
  openCoachSelection: (options: { raceEventId: string; strategyId?: string }) => void;
  /** Close coach selection modal */
  closeCoachSelection: () => void;
  /** Set sharing state */
  setSharing: (isSharing: boolean) => void;
  /** Called when strategy share is complete */
  completeShare: () => void;
  /** Reset all state */
  reset: () => void;
}

const StrategyShareContext = createContext<StrategyShareContextValue | null>(null);

const initialState: StrategyShareState = {
  showCoachSelection: false,
  isSharing: false,
  sharingRaceEventId: null,
  sharingStrategyId: null,
};

interface StrategyShareProviderProps {
  children: React.ReactNode;
  /** Optional callback when share is initiated */
  onShareStart?: (raceEventId: string, strategyId?: string) => void;
  /** Optional callback when share is complete */
  onShareComplete?: () => void;
}

export function StrategyShareProvider({
  children,
  onShareStart,
  onShareComplete,
}: StrategyShareProviderProps) {
  const [state, setState] = useState<StrategyShareState>(initialState);

  const openCoachSelection = useCallback(
    (options: { raceEventId: string; strategyId?: string }) => {
      setState((prev) => ({
        ...prev,
        showCoachSelection: true,
        sharingRaceEventId: options.raceEventId,
        sharingStrategyId: options.strategyId ?? null,
      }));
      onShareStart?.(options.raceEventId, options.strategyId);
    },
    [onShareStart]
  );

  const closeCoachSelection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showCoachSelection: false,
    }));
  }, []);

  const setSharing = useCallback((isSharing: boolean) => {
    setState((prev) => ({
      ...prev,
      isSharing,
    }));
  }, []);

  const completeShare = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showCoachSelection: false,
      isSharing: false,
      sharingRaceEventId: null,
      sharingStrategyId: null,
    }));
    onShareComplete?.();
  }, [onShareComplete]);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const value = useMemo<StrategyShareContextValue>(
    () => ({
      ...state,
      openCoachSelection,
      closeCoachSelection,
      setSharing,
      completeShare,
      reset,
    }),
    [state, openCoachSelection, closeCoachSelection, setSharing, completeShare, reset]
  );

  return (
    <StrategyShareContext.Provider value={value}>{children}</StrategyShareContext.Provider>
  );
}

/**
 * Hook to access strategy share context
 * @throws Error if used outside of StrategyShareProvider
 */
export function useStrategyShare(): StrategyShareContextValue {
  const context = useContext(StrategyShareContext);
  if (!context) {
    throw new Error('useStrategyShare must be used within a StrategyShareProvider');
  }
  return context;
}

/**
 * Hook to access strategy share context (returns null if outside provider)
 */
export function useStrategyShareSafe(): StrategyShareContextValue | null {
  return useContext(StrategyShareContext);
}

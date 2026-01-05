/**
 * GPS Tracking Context
 *
 * Manages GPS tracking state for live race execution.
 * Provides position updates, trail history, and session management.
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';

export interface GpsPosition {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp?: Date;
}

interface GpsTrackingState {
  /** Current GPS position */
  position: GpsPosition | null;
  /** Trail of GPS positions */
  trail: GpsPosition[];
  /** Whether GPS tracking is active */
  isTracking: boolean;
  /** Current tracking session ID */
  sessionId: string | null;
  /** Sailor ID for the session */
  sailorId: string | null;
}

interface GpsTrackingContextValue extends GpsTrackingState {
  /** Start GPS tracking */
  startTracking: (options: { sessionId: string; sailorId?: string }) => void;
  /** Stop GPS tracking */
  stopTracking: () => void;
  /** Update current GPS position */
  updatePosition: (position: GpsPosition) => void;
  /** Clear trail history */
  clearTrail: () => void;
  /** Set sailor ID */
  setSailorId: (id: string | null) => void;
  /** Get last known heading */
  lastHeading: number | null;
  /** Reset all state */
  reset: () => void;
}

const GpsTrackingContext = createContext<GpsTrackingContextValue | null>(null);

const initialState: GpsTrackingState = {
  position: null,
  trail: [],
  isTracking: false,
  sessionId: null,
  sailorId: null,
};

interface GpsTrackingProviderProps {
  children: React.ReactNode;
  /** Optional callback when tracking starts */
  onTrackingStart?: (sessionId: string) => void;
  /** Optional callback when tracking stops */
  onTrackingStop?: (trail: GpsPosition[]) => void;
  /** Optional callback on position update */
  onPositionUpdate?: (position: GpsPosition) => void;
}

export function GpsTrackingProvider({
  children,
  onTrackingStart,
  onTrackingStop,
  onPositionUpdate,
}: GpsTrackingProviderProps) {
  const [state, setState] = useState<GpsTrackingState>(initialState);
  const lastHeadingRef = useRef<number | null>(null);

  const startTracking = useCallback(
    (options: { sessionId: string; sailorId?: string }) => {
      setState((prev) => ({
        ...prev,
        isTracking: true,
        sessionId: options.sessionId,
        sailorId: options.sailorId ?? prev.sailorId,
        trail: [], // Clear previous trail
      }));
      onTrackingStart?.(options.sessionId);
    },
    [onTrackingStart]
  );

  const stopTracking = useCallback(() => {
    setState((prev) => {
      onTrackingStop?.(prev.trail);
      return {
        ...prev,
        isTracking: false,
        sessionId: null,
      };
    });
  }, [onTrackingStop]);

  const updatePosition = useCallback(
    (position: GpsPosition) => {
      // Update last heading if available
      if (typeof position.heading === 'number') {
        lastHeadingRef.current = position.heading;
      }

      setState((prev) => ({
        ...prev,
        position,
        trail: prev.isTracking ? [...prev.trail, position] : prev.trail,
      }));

      onPositionUpdate?.(position);
    },
    [onPositionUpdate]
  );

  const clearTrail = useCallback(() => {
    setState((prev) => ({
      ...prev,
      trail: [],
    }));
  }, []);

  const setSailorId = useCallback((id: string | null) => {
    setState((prev) => ({
      ...prev,
      sailorId: id,
    }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
    lastHeadingRef.current = null;
  }, []);

  const value = useMemo<GpsTrackingContextValue>(
    () => ({
      ...state,
      startTracking,
      stopTracking,
      updatePosition,
      clearTrail,
      setSailorId,
      lastHeading: lastHeadingRef.current,
      reset,
    }),
    [state, startTracking, stopTracking, updatePosition, clearTrail, setSailorId, reset]
  );

  return (
    <GpsTrackingContext.Provider value={value}>{children}</GpsTrackingContext.Provider>
  );
}

/**
 * Hook to access GPS tracking context
 * @throws Error if used outside of GpsTrackingProvider
 */
export function useGpsTracking(): GpsTrackingContextValue {
  const context = useContext(GpsTrackingContext);
  if (!context) {
    throw new Error('useGpsTracking must be used within a GpsTrackingProvider');
  }
  return context;
}

/**
 * Hook to access GPS tracking context (returns null if outside provider)
 */
export function useGpsTrackingSafe(): GpsTrackingContextValue | null {
  return useContext(GpsTrackingContext);
}

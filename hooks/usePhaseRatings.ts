/**
 * usePhaseRatings Hook
 *
 * Manages structured debrief phase ratings for post-race review.
 * Reads/writes to race_timer_sessions.phase_ratings column.
 *
 * Features:
 * - Auto-loads existing ratings
 * - Auto-saves on changes (debounced)
 * - Calculates completion status
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';
import { isMissingIdColumn } from '@/lib/utils/supabaseSchemaFallback';

const logger = createLogger('usePhaseRatings');

// =============================================================================
// TYPES
// =============================================================================

export interface PhaseRating {
  rating: number;
  note?: string;
}

export interface PhaseRatings {
  prestart?: PhaseRating;
  start?: PhaseRating;
  upwind?: PhaseRating;
  windwardMark?: PhaseRating;
  downwind?: PhaseRating;
  leewardMark?: PhaseRating;
}

export type PhaseKey = keyof PhaseRatings;

export const PHASE_KEYS: PhaseKey[] = [
  'prestart',
  'start',
  'upwind',
  'windwardMark',
  'downwind',
  'leewardMark',
];

export interface UsePhaseRatingsParams {
  raceId: string | null | undefined;
  userId: string | null | undefined;
  /** Debounce delay in ms (default: 1000) */
  debounceMs?: number;
}

export interface UsePhaseRatingsReturn {
  /** Current phase ratings */
  ratings: PhaseRatings;
  /** Set rating for a specific phase */
  setRating: (phase: PhaseKey, rating: number) => void;
  /** Set note for a specific phase */
  setNote: (phase: PhaseKey, note: string) => void;
  /** Whether all 6 phases have ratings */
  isComplete: boolean;
  /** Count of phases with ratings */
  completedCount: number;
  /** Whether data is loading */
  isLoading: boolean;
  /** Whether data is saving */
  isSaving: boolean;
  /** Error message if any */
  error: string | null;
  /** Timer session ID */
  sessionId: string | null;
  /** Force save (for manual trigger) */
  save: () => Promise<void>;
  /** Refresh data from server */
  refetch: () => void;
}

// =============================================================================
// HOOK
// =============================================================================

export function usePhaseRatings({
  raceId,
  userId,
  debounceMs = 1000,
}: UsePhaseRatingsParams): UsePhaseRatingsReturn {
  const [ratings, setRatings] = useState<PhaseRatings>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Debounce timer ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track if we have unsaved changes
  const pendingChangesRef = useRef<PhaseRatings | null>(null);
  const isMountedRef = useRef(true);
  const loadRunIdRef = useRef(0);
  const saveRunIdRef = useRef(0);
  const activeRaceIdRef = useRef<string | null | undefined>(raceId);
  const activeUserIdRef = useRef<string | null | undefined>(userId);

  useEffect(() => {
    activeRaceIdRef.current = raceId;
    activeUserIdRef.current = userId;
  }, [raceId, userId]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      loadRunIdRef.current += 1;
      saveRunIdRef.current += 1;
    };
  }, []);

  // ==========================================================================
  // Load existing ratings
  // ==========================================================================

  useEffect(() => {
    async function loadRatings() {
      const runId = ++loadRunIdRef.current;
      const targetRaceId = raceId;
      const targetUserId = userId;
      const canCommit = () =>
        isMountedRef.current &&
        runId === loadRunIdRef.current &&
        activeRaceIdRef.current === targetRaceId &&
        activeUserIdRef.current === targetUserId;
      // Skip for demo races or missing params
      if (!targetRaceId || !targetUserId || targetRaceId.startsWith('demo-')) {
        if (!canCommit()) return;
        setRatings({});
        setSessionId(null);
        setIsLoading(false);
        setError(null);
        return;
      }

      if (!canCommit()) return;
      setIsLoading(true);
      setError(null);

      try {
        // Find existing timer session for this race
        let session: any = null;
        let sessionError: any = null;
        const primarySession = await supabase
          .from('race_timer_sessions')
          .select('id, phase_ratings')
          .eq('regatta_id', targetRaceId)
          .eq('sailor_id', targetUserId)
          .order('end_time', { ascending: false })
          .limit(1)
          .maybeSingle();
        session = primarySession.data;
        sessionError = primarySession.error;

        if (isMissingIdColumn(sessionError, 'race_timer_sessions', 'regatta_id')) {
          const fallbackSession = await supabase
            .from('race_timer_sessions')
            .select('id, phase_ratings')
            .eq('race_id', targetRaceId)
            .eq('sailor_id', targetUserId)
            .order('end_time', { ascending: false })
            .limit(1)
            .maybeSingle();
          session = fallbackSession.data;
          sessionError = fallbackSession.error;
        }

        if (sessionError) {
          logger.warn('[usePhaseRatings] Session query error:', sessionError);
          if (canCommit()) {
            setError('Failed to load ratings');
          }
          return;
        }

        if (canCommit()) {
          if (session) {
            setSessionId(session.id);
            // Parse phase_ratings JSONB
            const savedRatings = session.phase_ratings as PhaseRatings | null;
            setRatings(savedRatings || {});
          } else {
            // No session exists yet - will be created on first save
            setSessionId(null);
            setRatings({});
          }
        }
      } catch (err) {
        logger.error('[usePhaseRatings] Unexpected error:', err);
        if (canCommit()) {
          setError('Unexpected error loading ratings');
        }
      } finally {
        if (canCommit()) {
          setIsLoading(false);
        }
      }
    }

    void loadRatings();
  }, [raceId, userId, refetchTrigger]);

  // ==========================================================================
  // Save ratings (debounced)
  // ==========================================================================

  const saveRatings = useCallback(
    async (ratingsToSave: PhaseRatings) => {
      const runId = ++saveRunIdRef.current;
      const targetRaceId = raceId;
      const targetUserId = userId;
      const canCommit = () =>
        isMountedRef.current &&
        runId === saveRunIdRef.current &&
        activeRaceIdRef.current === targetRaceId &&
        activeUserIdRef.current === targetUserId;

      if (!targetRaceId || !targetUserId || targetRaceId.startsWith('demo-')) {
        logger.warn('[usePhaseRatings] Cannot save: missing raceId or userId');
        return;
      }

      if (!canCommit()) return;
      setIsSaving(true);
      setError(null);

      try {
        let currentSessionId = sessionId;

        // Create session if it doesn't exist
        if (!currentSessionId) {
          const nowIso = new Date().toISOString();
          const primaryCreate = await supabase
            .from('race_timer_sessions')
            .insert({
              sailor_id: userId,
              regatta_id: targetRaceId,
              start_time: nowIso,
              end_time: nowIso,
              duration_seconds: 0,
              phase_ratings: ratingsToSave,
            })
            .select('id')
            .single();
          let newSession = primaryCreate.data;
          let createError = primaryCreate.error;

          if (isMissingIdColumn(createError, 'race_timer_sessions', 'regatta_id')) {
            const fallbackCreate = await supabase
              .from('race_timer_sessions')
              .insert({
                sailor_id: userId,
                race_id: targetRaceId,
                start_time: nowIso,
                end_time: nowIso,
                duration_seconds: 0,
                phase_ratings: ratingsToSave,
              })
              .select('id')
              .single();
            newSession = fallbackCreate.data;
            createError = fallbackCreate.error;
          }

          if (createError) {
            throw createError;
          }

          currentSessionId = newSession!.id;
          if (canCommit()) {
            setSessionId(currentSessionId);
          }
          logger.debug('[usePhaseRatings] Created new session:', currentSessionId);
        } else {
          // Update existing session
          const { error: updateError } = await supabase
            .from('race_timer_sessions')
            .update({ phase_ratings: ratingsToSave })
            .eq('id', currentSessionId);

          if (updateError) {
            throw updateError;
          }

          logger.debug('[usePhaseRatings] Updated session:', currentSessionId);
        }

        pendingChangesRef.current = null;
      } catch (err) {
        logger.error('[usePhaseRatings] Save error:', err);
        if (canCommit()) {
          setError('Failed to save ratings');
        }
      } finally {
        if (canCommit()) {
          setIsSaving(false);
        }
      }
    },
    [raceId, userId, sessionId]
  );

  // Debounced save trigger
  const triggerDebouncedSave = useCallback(
    (newRatings: PhaseRatings) => {
      pendingChangesRef.current = newRatings;

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout
      saveTimeoutRef.current = setTimeout(() => {
        if (pendingChangesRef.current) {
          void saveRatings(pendingChangesRef.current);
        }
      }, debounceMs);
    },
    [saveRatings, debounceMs]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Save any pending changes immediately on unmount
      if (pendingChangesRef.current) {
        saveRatings(pendingChangesRef.current);
      }
    };
  }, [saveRatings]);

  // ==========================================================================
  // Rating setters
  // ==========================================================================

  const setRating = useCallback(
    (phase: PhaseKey, rating: number) => {
      setRatings((prev) => {
        const newRatings = {
          ...prev,
          [phase]: {
            ...prev[phase],
            rating,
          },
        };
        triggerDebouncedSave(newRatings);
        return newRatings;
      });
    },
    [triggerDebouncedSave]
  );

  const setNote = useCallback(
    (phase: PhaseKey, note: string) => {
      setRatings((prev) => {
        const newRatings = {
          ...prev,
          [phase]: {
            ...prev[phase],
            note,
          },
        };
        triggerDebouncedSave(newRatings);
        return newRatings;
      });
    },
    [triggerDebouncedSave]
  );

  // ==========================================================================
  // Computed values
  // ==========================================================================

  const { isComplete, completedCount } = useMemo(() => {
    const count = PHASE_KEYS.filter(
      (key) => ratings[key]?.rating !== undefined && ratings[key]!.rating > 0
    ).length;
    return {
      completedCount: count,
      isComplete: count === PHASE_KEYS.length,
    };
  }, [ratings]);

  // ==========================================================================
  // Manual save trigger
  // ==========================================================================

  const save = useCallback(async () => {
    // Clear debounce timer
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    // Save immediately
    await saveRatings(ratings);
  }, [saveRatings, ratings]);

  // ==========================================================================
  // Refetch trigger
  // ==========================================================================

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    ratings,
    setRating,
    setNote,
    isComplete,
    completedCount,
    isLoading,
    isSaving,
    error,
    sessionId,
    save,
    refetch,
  };
}

export default usePhaseRatings;

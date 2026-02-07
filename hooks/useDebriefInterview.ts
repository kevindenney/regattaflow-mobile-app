/**
 * useDebriefInterview Hook
 *
 * Manages the guided post-race interview state, navigation, and persistence.
 *
 * Features:
 * - Navigate through questions one at a time
 * - Conditional follow-up questions based on answers
 * - Save responses to database (debounced)
 * - Resume incomplete interviews
 * - Track completion progress
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';
import {
  DEBRIEF_PHASES,
  getFlatQuestions,
  getActiveQuestions,
  type FlatQuestion,
} from '@/components/races/review/debriefQuestions';

const logger = createLogger('useDebriefInterview');

// =============================================================================
// TYPES
// =============================================================================

export type DebriefResponseValue = string | number | boolean | string[] | null;

export interface DebriefResponses {
  [questionId: string]: DebriefResponseValue;
}

export interface UseDebriefInterviewParams {
  raceId: string | null | undefined;
  userId: string | null | undefined;
  /** Debounce delay for saving (default: 1500ms) */
  debounceMs?: number;
}

export interface UseDebriefInterviewReturn {
  /** All questions (unfiltered, for reference) */
  allQuestions: FlatQuestion[];
  /** Active questions (filtered by conditions) */
  questions: FlatQuestion[];
  /** Current question index in active list */
  currentIndex: number;
  /** Current question */
  currentQuestion: FlatQuestion | null;
  /** All responses */
  responses: DebriefResponses;
  /** Set a response */
  setResponse: (questionId: string, value: DebriefResponseValue) => void;
  /** Go to next question */
  next: () => void;
  /** Go to previous question */
  back: () => void;
  /** Skip current question (same as next) */
  skip: () => void;
  /** Jump to specific question */
  goTo: (index: number) => void;
  /** Is at first question */
  isFirst: boolean;
  /** Is at last question */
  isLast: boolean;
  /** Is interview complete (reached end) */
  isComplete: boolean;
  /** Progress info */
  progress: {
    current: number;
    total: number;
    answeredCount: number;
    currentPhaseIndex: number;
    totalPhases: number;
    percentComplete: number;
  };
  /** Loading state */
  isLoading: boolean;
  /** Saving state */
  isSaving: boolean;
  /** Error message */
  error: string | null;
  /** Timer session ID */
  sessionId: string | null;
  /** Force save immediately */
  save: () => Promise<void>;
  /** Reset interview to beginning */
  reset: () => void;
  /** Mark interview as fully complete */
  markComplete: () => Promise<void>;
  /** Refetch responses from database */
  refetch: () => Promise<void>;
}

// =============================================================================
// HOOK
// =============================================================================

export function useDebriefInterview({
  raceId,
  userId,
  debounceMs = 1500,
}: UseDebriefInterviewParams): UseDebriefInterviewReturn {
  // All questions (unfiltered)
  const allQuestions = useMemo(() => getFlatQuestions(), []);

  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<DebriefResponses>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start true to prevent adjustment effect during initial load
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Active questions (filtered by current responses)
  // This list updates as responses are given (follow-ups appear/disappear)
  const questions = useMemo(
    () => getActiveQuestions(responses),
    [responses]
  );

  // Track current question ID to maintain position when questions list changes
  const currentQuestionIdRef = useRef<string | null>(null);

  // Refs for debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingResponsesRef = useRef<DebriefResponses | null>(null);

  // ==========================================================================
  // Adjust current index when question list changes
  // ==========================================================================

  // Track previous questions IDs to detect actual content changes (not just reference)
  const prevQuestionIdsRef = useRef<string>('');

  useEffect(() => {
    // Skip during initial load - loadResponses will set the correct index and ref
    if (isLoading) {
      return;
    }

    // Create a stable string of question IDs to detect actual content changes
    const currentQuestionIds = questions.map(q => q.id).join(',');

    // Skip if questions haven't actually changed
    if (currentQuestionIds === prevQuestionIdsRef.current) {
      return;
    }
    prevQuestionIdsRef.current = currentQuestionIds;

    // Only run adjustment logic when questions array content actually changes
    if (currentQuestionIdRef.current) {
      const newIndex = questions.findIndex(q => q.id === currentQuestionIdRef.current);

      if (newIndex !== -1) {
        // Question still exists - update index using functional update
        setCurrentIndex(prevIndex => {
          if (newIndex !== prevIndex) {
            return newIndex;
          }
          return prevIndex;
        });
        // Update ref to current question
        currentQuestionIdRef.current = questions[newIndex].id;
      } else {
        // Question no longer visible - use functional update to get current index
        setCurrentIndex(prevIndex => {
          const safeIndex = Math.max(0, Math.min(prevIndex, questions.length - 1));
          // Update ref to the new valid question
          if (questions[safeIndex]) {
            currentQuestionIdRef.current = questions[safeIndex].id;
          }
          return safeIndex;
        });
      }
    } else if (questions.length > 0) {
      // No tracked question yet, set ref to first question
      currentQuestionIdRef.current = questions[0].id;
    }
  }, [questions, isLoading]); // Only depend on questions and isLoading, NOT currentIndex

  // ==========================================================================
  // Keep ref in sync with current question when user navigates
  // ==========================================================================

  // This effect updates the ref when the user manually navigates (next/back/skip)
  // It's separate from the adjustment effect to avoid dependency cycles
  useEffect(() => {
    // Skip during loading - loadResponses handles the initial ref setup
    if (isLoading) {
      return;
    }

    // Only update ref if there's a valid question at the current index
    // and the ref doesn't already point to it
    if (questions[currentIndex] && currentQuestionIdRef.current !== questions[currentIndex].id) {
      currentQuestionIdRef.current = questions[currentIndex].id;
    }
  }, [currentIndex, questions, isLoading]);

  // ==========================================================================
  // Load existing responses
  // ==========================================================================

  // Extracted load function for reuse in useEffect and refetch
  const loadResponsesFromDb = useCallback(async (skipResumePosition = false) => {
    // Skip for demo races or missing params
    if (!raceId || !userId || raceId.startsWith('demo-')) {
      setResponses({});
      setSessionId(null);
      setIsComplete(false);
      if (!skipResumePosition) {
        setCurrentIndex(0);
        currentQuestionIdRef.current = null;
      }
      setIsLoading(false);
      return;
    }

    setError(null);

    try {
      // Find existing timer session for this race
      const { data: session, error: sessionError } = await supabase
        .from('race_timer_sessions')
        .select('id, debrief_responses, debrief_complete')
        .eq('regatta_id', raceId)
        .eq('sailor_id', userId)
        .order('end_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError) {
        logger.warn('[useDebriefInterview] Session query error:', sessionError);
        setError('Failed to load interview');
        return;
      }

      if (session) {
        setSessionId(session.id);
        // Parse debrief_responses JSONB
        const savedResponses = session.debrief_responses as DebriefResponses | null;
        setResponses(savedResponses || {});
        setIsComplete(session.debrief_complete || false);

        // Resume from last answered question (only on initial load, not refetch)
        if (savedResponses && !skipResumePosition) {
          // Get active questions based on saved responses
          const activeQs = getActiveQuestions(savedResponses);
          const answeredIds = Object.keys(savedResponses).filter(
            (k) => savedResponses[k] !== null && savedResponses[k] !== undefined
          );

          if (answeredIds.length > 0) {
            // Find highest index that was answered in the active list
            const lastAnsweredIndex = activeQs.reduce((maxIdx, q, idx) => {
              if (answeredIds.includes(q.id)) {
                return Math.max(maxIdx, idx);
              }
              return maxIdx;
            }, -1);
            // Resume at next question (or last if at end)
            const resumeIndex = Math.min(lastAnsweredIndex + 1, activeQs.length - 1);
            setCurrentIndex(resumeIndex);
            currentQuestionIdRef.current = activeQs[resumeIndex]?.id || null;
          }
        }
      } else {
        // No session exists yet - will be created on first save
        setSessionId(null);
        setResponses({});
        setIsComplete(false);
        if (!skipResumePosition) {
          setCurrentIndex(0);
          currentQuestionIdRef.current = null;
        }
      }
    } catch (err) {
      logger.error('[useDebriefInterview] Unexpected error:', err);
      setError('Unexpected error loading interview');
    } finally {
      setIsLoading(false);
    }
  }, [raceId, userId]);

  // Initial load on mount
  useEffect(() => {
    loadResponsesFromDb(false);
  }, [loadResponsesFromDb]);

  // Refetch function for external callers
  const refetch = useCallback(async () => {
    // Skip resume position adjustment on refetch - just update data
    await loadResponsesFromDb(true);
  }, [loadResponsesFromDb]);

  // ==========================================================================
  // Save responses (debounced)
  // ==========================================================================

  const saveResponses = useCallback(
    async (responsesToSave: DebriefResponses, markAsComplete = false) => {
      if (!raceId || !userId || raceId.startsWith('demo-')) {
        logger.warn('[useDebriefInterview] Cannot save: missing raceId or userId');
        return;
      }

      setIsSaving(true);
      setError(null);

      try {
        let currentSessionId = sessionId;

        // ALWAYS fetch fresh session data to avoid creating duplicates
        // This prevents the bug where race results disappear because we create
        // a new session instead of updating the existing one with the race result
        if (!currentSessionId) {
          logger.debug('[useDebriefInterview] No sessionId in state, fetching fresh session data...');

          const { data: freshSessions, error: fetchError } = await supabase
            .from('race_timer_sessions')
            .select('*')
            .eq('regatta_id', raceId)
            .eq('sailor_id', userId)
            .order('end_time', { ascending: false })
            .limit(1);

          if (fetchError) {
            logger.error('[useDebriefInterview] Error fetching fresh session:', fetchError);
            throw fetchError;
          }

          if (freshSessions && freshSessions.length > 0) {
            currentSessionId = freshSessions[0].id;
            setSessionId(currentSessionId);
            logger.debug('[useDebriefInterview] Found existing session:', currentSessionId);
          }
        }

        // Create session only if it truly doesn't exist
        if (!currentSessionId) {
          const nowIso = new Date().toISOString();
          const { data: newSession, error: createError } = await supabase
            .from('race_timer_sessions')
            .insert({
              sailor_id: userId,
              regatta_id: raceId,
              start_time: nowIso,
              end_time: nowIso,
              duration_seconds: 0,
              debrief_responses: responsesToSave,
              debrief_complete: markAsComplete,
            })
            .select('id')
            .single();

          if (createError) {
            throw createError;
          }

          currentSessionId = newSession.id;
          setSessionId(currentSessionId);
          logger.debug('[useDebriefInterview] Created new session:', currentSessionId);
        } else {
          // Update existing session
          const updateData: Record<string, unknown> = {
            debrief_responses: responsesToSave,
          };
          if (markAsComplete) {
            updateData.debrief_complete = true;
          }

          const { error: updateError } = await supabase
            .from('race_timer_sessions')
            .update(updateData)
            .eq('id', currentSessionId);

          if (updateError) {
            throw updateError;
          }

          logger.debug('[useDebriefInterview] Updated session:', currentSessionId);
        }

        pendingResponsesRef.current = null;
        if (markAsComplete) {
          setIsComplete(true);
        }
      } catch (err) {
        logger.error('[useDebriefInterview] Save error:', err);
        setError('Failed to save responses');
        throw err; // Re-throw so callers know the save failed
      } finally {
        setIsSaving(false);
      }
    },
    [raceId, userId, sessionId]
  );

  // Debounced save trigger
  const triggerDebouncedSave = useCallback(
    (newResponses: DebriefResponses) => {
      pendingResponsesRef.current = newResponses;

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout
      saveTimeoutRef.current = setTimeout(() => {
        if (pendingResponsesRef.current) {
          saveResponses(pendingResponsesRef.current);
        }
      }, debounceMs);
    },
    [saveResponses, debounceMs]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Save any pending changes immediately on unmount
      if (pendingResponsesRef.current) {
        saveResponses(pendingResponsesRef.current);
      }
    };
  }, [saveResponses]);

  // ==========================================================================
  // Response setter
  // ==========================================================================

  const setResponse = useCallback(
    (questionId: string, value: DebriefResponseValue) => {
      setResponses((prev) => {
        const newResponses = {
          ...prev,
          [questionId]: value,
        };
        triggerDebouncedSave(newResponses);
        return newResponses;
      });
    },
    [triggerDebouncedSave]
  );

  // ==========================================================================
  // Navigation
  // ==========================================================================

  const next = useCallback(() => {
    setCurrentIndex((prev) => {
      const nextIndex = Math.min(prev + 1, questions.length - 1);
      return nextIndex;
    });
  }, [questions.length]);

  const back = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const skip = useCallback(() => {
    next();
  }, [next]);

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < questions.length) {
        setCurrentIndex(index);
      }
    },
    [questions.length]
  );

  const reset = useCallback(() => {
    setCurrentIndex(0);
    currentQuestionIdRef.current = questions[0]?.id || null;
  }, [questions]);

  // ==========================================================================
  // Computed values
  // ==========================================================================

  const currentQuestion = questions[currentIndex] || null;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;

  const answeredCount = useMemo(() => {
    // Count answers for active questions only
    return questions.filter(
      (q) => responses[q.id] !== null && responses[q.id] !== undefined && responses[q.id] !== ''
    ).length;
  }, [responses, questions]);

  const progress = useMemo(() => {
    return {
      current: currentIndex + 1,
      total: questions.length,
      answeredCount,
      currentPhaseIndex: currentQuestion?.phaseIndex ?? 0,
      totalPhases: DEBRIEF_PHASES.length,
      percentComplete: questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0,
    };
  }, [currentIndex, questions.length, answeredCount, currentQuestion]);

  // ==========================================================================
  // Manual save trigger
  // ==========================================================================

  const save = useCallback(async () => {
    // Clear debounce timer
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    // Save immediately
    await saveResponses(responses);
  }, [saveResponses, responses]);

  // ==========================================================================
  // Mark complete
  // ==========================================================================

  const markComplete = useCallback(async () => {
    // Clear debounce timer
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    // Save immediately with complete flag
    await saveResponses(responses, true);
  }, [saveResponses, responses]);

  // ==========================================================================
  // Return
  // ==========================================================================

  return {
    allQuestions,
    questions,
    currentIndex,
    currentQuestion,
    responses,
    setResponse,
    next,
    back,
    skip,
    goTo,
    isFirst,
    isLast,
    isComplete,
    progress,
    isLoading,
    isSaving,
    error,
    sessionId,
    save,
    reset,
    markComplete,
    refetch,
  };
}

export default useDebriefInterview;

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
  const [isLoading, setIsLoading] = useState(false);
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

  useEffect(() => {
    // If we have a tracked question ID, find it in the new list
    if (currentQuestionIdRef.current) {
      const newIndex = questions.findIndex(q => q.id === currentQuestionIdRef.current);
      if (newIndex !== -1 && newIndex !== currentIndex) {
        // Question still exists, update index if needed
        setCurrentIndex(newIndex);
      } else if (newIndex === -1) {
        // Question no longer visible (condition changed), stay at current index or move back
        const safeIndex = Math.min(currentIndex, questions.length - 1);
        setCurrentIndex(Math.max(0, safeIndex));
      }
    }
  }, [questions, currentIndex]);

  // Update current question ID when index changes
  useEffect(() => {
    if (questions[currentIndex]) {
      currentQuestionIdRef.current = questions[currentIndex].id;
    }
  }, [currentIndex, questions]);

  // ==========================================================================
  // Load existing responses
  // ==========================================================================

  useEffect(() => {
    let isMounted = true;

    async function loadResponses() {
      // Skip for demo races or missing params
      if (!raceId || !userId || raceId.startsWith('demo-')) {
        setResponses({});
        setSessionId(null);
        setIsComplete(false);
        setCurrentIndex(0);
        currentQuestionIdRef.current = null;
        return;
      }

      setIsLoading(true);
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
          if (isMounted) {
            setError('Failed to load interview');
          }
          return;
        }

        if (isMounted) {
          if (session) {
            setSessionId(session.id);
            // Parse debrief_responses JSONB
            const savedResponses = session.debrief_responses as DebriefResponses | null;
            setResponses(savedResponses || {});
            setIsComplete(session.debrief_complete || false);

            // Resume from last answered question
            if (savedResponses) {
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
            setCurrentIndex(0);
            currentQuestionIdRef.current = null;
          }
        }
      } catch (err) {
        logger.error('[useDebriefInterview] Unexpected error:', err);
        if (isMounted) {
          setError('Unexpected error loading interview');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadResponses();

    return () => {
      isMounted = false;
    };
  }, [raceId, userId]);

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

        // Create session if it doesn't exist
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
  };
}

export default useDebriefInterview;

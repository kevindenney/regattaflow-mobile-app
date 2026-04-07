/**
 * useRaceAnalysisState Hook
 *
 * Provides race analysis completeness state for Tufte "absence as interface" display.
 * This hook determines what data is missing from a completed race, enabling the UI
 * to show empty fields that communicate incompleteness through visual sparseness.
 *
 * Design principles (from Tufte):
 * - Absence communicates through sparse data, not notifications
 * - Visual weight difference shows completeness without words
 * - "Memories fade" hint after 3+ days
 */

import { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '@/services/supabase';
import { isMissingIdColumn } from '@/lib/utils/supabaseSchemaFallback';
import type { RaceAnalysisState, CoachAnnotation } from '@/types/raceAnalysis';
import { createLogger } from '@/lib/utils/logger';

interface UseRaceAnalysisStateResult {
  state: RaceAnalysisState | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  markAnnotationsAsRead: () => Promise<void>;
}

const MEMORY_FADE_THRESHOLD_DAYS = 3;
const logger = createLogger('useRaceAnalysisState');

/**
 * Calculate days since a date
 */
function calculateDaysSince(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Hook to get race analysis completeness state
 *
 * @param raceId - The race ID to check
 * @param raceDate - The race date string (ISO format)
 * @param userId - The current user ID
 * @returns Analysis state with completeness indicators
 */
export function useRaceAnalysisState(
  raceId: string | null | undefined,
  raceDate: string | null | undefined,
  userId: string | null | undefined
): UseRaceAnalysisStateResult {
  const [state, setState] = useState<RaceAnalysisState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const isMountedRef = useRef(true);
  const fetchRunIdRef = useRef(0);
  const activeRaceIdRef = useRef<string | null | undefined>(raceId);
  const activeUserIdRef = useRef<string | null | undefined>(userId);

  // Calculate if race is completed and days since
  const { isCompleted, daysSinceRace, memoryFading } = useMemo(() => {
    if (!raceDate) {
      return { isCompleted: false, daysSinceRace: 0, memoryFading: false };
    }

    const raceDateTime = new Date(raceDate);
    const now = new Date();
    const isCompleted = raceDateTime < now;
    const daysSinceRace = isCompleted ? calculateDaysSince(raceDate) : 0;
    const memoryFading = daysSinceRace >= MEMORY_FADE_THRESHOLD_DAYS;

    return { isCompleted, daysSinceRace, memoryFading };
  }, [raceDate]);

  useEffect(() => {
    activeRaceIdRef.current = raceId;
    activeUserIdRef.current = userId;
  }, [raceId, userId]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      fetchRunIdRef.current += 1;
    };
  }, []);

  useEffect(() => {
    async function fetchAnalysisState() {
      const runId = ++fetchRunIdRef.current;
      const targetRaceId = raceId;
      const targetUserId = userId;
      const canCommit = () =>
        isMountedRef.current &&
        runId === fetchRunIdRef.current &&
        activeRaceIdRef.current === targetRaceId &&
        activeUserIdRef.current === targetUserId;
      // Only fetch for completed races with valid (non-demo) IDs
      if (!targetRaceId || !targetUserId || !isCompleted || targetRaceId.startsWith('demo-')) {
        if (!canCommit()) return;
        setState(null);
        setIsLoading(false);
        setError(null);
        return;
      }

      if (!canCommit()) return;
      setIsLoading(true);
      setError(null);

      try {
        // Check for official race result (from race_results table)
        let resultData: { position?: number | null; points?: number | null } | null = null;
        const primaryResult = await supabase
          .from('race_results')
          .select('position, points')
          .eq('regatta_id', targetRaceId)
          .eq('sailor_id', targetUserId)
          .maybeSingle();
        resultData = primaryResult.data;
        if (isMissingIdColumn(primaryResult.error, 'race_results', 'regatta_id')) {
          const fallbackResult = await supabase
            .from('race_results')
            .select('position, points')
            .eq('race_id', targetRaceId)
            .eq('sailor_id', targetUserId)
            .maybeSingle();
          resultData = fallbackResult.data;
        }

        const hasOfficialResult = !!resultData?.position;

        // Check for timer session with self-reported data, key moment, and multi-race results
        interface TimerSessionStateRow {
          id: string;
          notes: string | null;
          auto_analyzed: boolean | null;
          self_reported_position: number | null;
          self_reported_fleet_size: number | null;
          key_moment: string | null;
          race_count: number | null;
          race_results: unknown;
        }
        let sessionData: TimerSessionStateRow | null = null;
        const sessionPrimary = await supabase
          .from('race_timer_sessions')
          .select('id, notes, auto_analyzed, self_reported_position, self_reported_fleet_size, key_moment, race_count, race_results')
          .eq('regatta_id', targetRaceId)
          .eq('sailor_id', targetUserId)
          .order('end_time', { ascending: false })
          .limit(1)
          .maybeSingle();
        sessionData = sessionPrimary.data as TimerSessionStateRow | null;

        if (isMissingIdColumn(sessionPrimary.error, 'race_timer_sessions', 'regatta_id')) {
          const sessionFallback = await supabase
            .from('race_timer_sessions')
            .select('id, notes, auto_analyzed, self_reported_position, self_reported_fleet_size, key_moment, race_count, race_results')
            .eq('race_id', targetRaceId)
            .eq('sailor_id', targetUserId)
            .order('end_time', { ascending: false })
            .limit(1)
            .maybeSingle();
          sessionData = sessionFallback.data as TimerSessionStateRow | null;
        }

        const hasNotes = sessionData && typeof sessionData.notes === 'string' && sessionData.notes.trim().length > 0;
        const hasSelfReportedResult = !!sessionData?.self_reported_position;
        const hasExplicitKeyMoment = sessionData && typeof sessionData.key_moment === 'string' && sessionData.key_moment.trim().length > 0;

        // Check for multi-race results (JSONB array)
        const hasMultiRaceResults = sessionData?.race_results &&
          Array.isArray(sessionData.race_results) &&
          (sessionData.race_results as { position?: number | null }[]).some(r => r.position != null);
        const hasMultiRaceKeyMoments = sessionData?.race_results &&
          Array.isArray(sessionData.race_results) &&
          (sessionData.race_results as { key_moment?: string | null }[]).some(r => r.key_moment?.trim());

        // Check for full race_analysis (structured form-based analysis)
        interface RaceAnalysisStateRow {
          id: string;
          key_learnings: unknown;
          overall_satisfaction: string | null;
          start_notes: string | null;
          upwind_notes: string | null;
        }
        let analysisData: RaceAnalysisStateRow | null = null;
        const primaryAnalysis = await supabase
          .from('race_analysis')
          .select('id, key_learnings, overall_satisfaction, start_notes, upwind_notes')
          .eq('race_id', targetRaceId)
          .eq('sailor_id', targetUserId)
          .maybeSingle();
        analysisData = primaryAnalysis.data as RaceAnalysisStateRow | null;
        if (isMissingIdColumn(primaryAnalysis.error, 'race_analysis', 'race_id')) {
          const fallbackAnalysis = await supabase
            .from('race_analysis')
            .select('id, key_learnings, overall_satisfaction, start_notes, upwind_notes')
            .eq('regatta_id', targetRaceId)
            .eq('sailor_id', targetUserId)
            .maybeSingle();
          analysisData = fallbackAnalysis.data as RaceAnalysisStateRow | null;
        }

        const hasFullAnalysis = !!analysisData?.overall_satisfaction;

        // Check for AI Coach Analysis (ai_coach_analysis table linked via timer session)
        let hasAIAnalysis = false;
        if (sessionData?.id) {
          const { data: aiAnalysisData } = await supabase
            .from('ai_coach_analysis')
            .select('id')
            .eq('timer_session_id', sessionData.id)
            .maybeSingle();
          hasAIAnalysis = !!aiAnalysisData;
        }

        // Result: official OR self-reported OR multi-race results
        const hasResult = hasOfficialResult || hasSelfReportedResult || hasMultiRaceResults;

        // Key moment: explicit field OR notes OR key_learnings from analysis OR multi-race key moments
        const hasKeyMoment = hasExplicitKeyMoment || hasNotes || hasMultiRaceKeyMoments || (analysisData?.key_learnings && analysisData.key_learnings.length > 0);

        // Fetch coach annotations from coach_race_annotations table
        interface AnnotationRow {
          id: string;
          race_id: string | null;
          regatta_id?: string | null;
          coach_id: string;
          field: string;
          comment: string;
          is_read: boolean;
          created_at: string;
          coach: { full_name: string | null } | null;
        }
        let annotationsData: AnnotationRow[] | null = null;
        const primaryAnnotations = await supabase
          .from('coach_race_annotations')
          .select(`
            id,
            race_id,
            coach_id,
            field,
            comment,
            is_read,
            created_at,
            coach:profiles!coach_id(full_name)
          `)
          .eq('race_id', targetRaceId)
          .eq('sailor_id', targetUserId)
          .order('created_at', { ascending: false });
        annotationsData = primaryAnnotations.data as AnnotationRow[] | null;
        if (isMissingIdColumn(primaryAnnotations.error, 'coach_race_annotations', 'race_id')) {
          const fallbackAnnotations = await supabase
            .from('coach_race_annotations')
            .select(`
              id,
              regatta_id,
              coach_id,
              field,
              comment,
              is_read,
              created_at,
              coach:profiles!coach_id(full_name)
            `)
            .eq('regatta_id', targetRaceId)
            .eq('sailor_id', targetUserId)
            .order('created_at', { ascending: false });
          annotationsData = fallbackAnnotations.data as AnnotationRow[] | null;
        }

        // Transform to CoachAnnotation interface
        const coachAnnotations: CoachAnnotation[] = (annotationsData || []).map((ann) => ({
          id: ann.id,
          raceId: ann.race_id || ann.regatta_id,
          coachId: ann.coach_id,
          coachName: ann.coach?.full_name || 'Coach',
          field: ann.field,
          comment: ann.comment,
          createdAt: new Date(ann.created_at),
          isRead: ann.is_read,
        }));

        const hasUnreadCoachFeedback = coachAnnotations.some((ann) => !ann.isRead);

        if (!canCommit()) return;

        setState({
          raceId: targetRaceId,
          isCompleted,
          daysSinceRace,
          memoryFading,
          hasResult,
          hasKeyMoment,
          hasFullAnalysis,
          hasAIAnalysis,
          coachAnnotations,
          hasUnreadCoachFeedback,
        });
      } catch (err) {
        logger.error('Error loading race analysis state', err);
        if (!canCommit()) return;
        setError('Failed to load analysis state');
        setState(null);
      } finally {
        if (!canCommit()) return;
        setIsLoading(false);
      }
    }

    void fetchAnalysisState();
  }, [raceId, userId, isCompleted, daysSinceRace, memoryFading, refetchTrigger]);

  const refetch = () => setRefetchTrigger((prev) => prev + 1);

  /**
   * Mark all unread annotations as read for this race
   */
  const markAnnotationsAsRead = async () => {
    if (!raceId || !userId || !state?.coachAnnotations.length) return;

    const unreadIds = state.coachAnnotations
      .filter((ann) => !ann.isRead)
      .map((ann) => ann.id);

    if (unreadIds.length === 0) return;

    try {
      await supabase
        .from('coach_race_annotations')
        .update({ is_read: true })
        .in('id', unreadIds)
        .eq('sailor_id', userId);

      // Refetch to update state
      refetch();
    } catch (err) {
      logger.error('Failed to mark annotations as read', err);
    }
  };

  return { state, isLoading, error, refetch, markAnnotationsAsRead };
}

/**
 * Quick check if a race needs analysis (for list views)
 * Uses the "absence as interface" logic
 */
export function raceNeedsAnalysis(
  raceDate: string,
  hasResult: boolean,
  hasKeyMoment: boolean
): { needsAnalysis: boolean; memoryFading: boolean } {
  const raceDateTime = new Date(raceDate);
  const now = new Date();

  if (raceDateTime >= now) {
    return { needsAnalysis: false, memoryFading: false };
  }

  const daysSince = calculateDaysSince(raceDate);
  const memoryFading = daysSince >= MEMORY_FADE_THRESHOLD_DAYS;
  const needsAnalysis = !hasResult || !hasKeyMoment;

  return { needsAnalysis, memoryFading };
}

export default useRaceAnalysisState;

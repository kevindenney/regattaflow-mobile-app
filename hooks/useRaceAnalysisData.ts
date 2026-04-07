/**
 * useRaceAnalysisData Hook
 *
 * Fetches post-race analysis data for completed races including:
 * - AI analysis summary and insights
 * - Whether debrief has been completed
 * - Key learnings and focus areas
 */

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/services/supabase';
import { isMissingIdColumn } from '@/lib/utils/supabaseSchemaFallback';
import { createLogger } from '@/lib/utils/logger';

/**
 * Labels for select option values to create readable summaries
 */
const RESPONSE_LABELS: Record<string, Record<string, string>> = {
  finish_overall: {
    great: 'Executed the plan well',
    good: 'Solid overall performance',
    mixed: 'Mixed results - some good, some to improve',
    frustrating: 'Difficult race with lessons learned',
    learning: 'Good learning experience',
  },
  start_execution: {
    nailed: 'Strong start execution',
    good: 'Good start, close to plan',
    ok: 'Start needs improvement',
    poor: 'Start didn\'t go as planned',
    ocs: 'OCS - work on timing',
  },
  upwind_shifts: {
    great: 'Read the shifts well upwind',
    ok: 'Mixed shift reading',
    poor: 'Missed key wind shifts',
    no_shifts: 'Steady wind conditions',
  },
  marks_rounding_quality: {
    clean: 'Clean mark roundings',
    ok: 'Decent mark work',
    wide: 'Roundings too wide - tighten up',
    tight: 'Roundings too tight - give more room',
    traffic: 'Got caught in traffic at marks',
  },
  finish_approach: {
    favored_end: 'Good finish approach to favored end',
    safe: 'Safe, conservative finish',
    aggressive: 'Took calculated risk at finish',
    no_plan: 'Need better finish strategy',
  },
};

const logger = createLogger('useRaceAnalysisData');

/**
 * Synthesize a key insight from structured debrief responses
 * when no explicit text was entered
 */
function synthesizeFromResponses(responses: Record<string, unknown>): string | undefined {
  if (!responses || Object.keys(responses).length === 0) {
    return undefined;
  }

  const insights: string[] = [];

  // Check for overall feeling first
  const finishOverall = responses.finish_overall as string | undefined;
  if (finishOverall && RESPONSE_LABELS.finish_overall?.[finishOverall]) {
    insights.push(RESPONSE_LABELS.finish_overall[finishOverall]);
  }

  // Add start insight if notable
  const startExecution = responses.start_execution as string | undefined;
  if (startExecution === 'nailed' || startExecution === 'poor' || startExecution === 'ocs') {
    const label = RESPONSE_LABELS.start_execution?.[startExecution];
    if (label) insights.push(label);
  }

  // Add shift reading if notable
  const upwindShifts = responses.upwind_shifts as string | undefined;
  if (upwindShifts === 'great' || upwindShifts === 'poor') {
    const label = RESPONSE_LABELS.upwind_shifts?.[upwindShifts];
    if (label) insights.push(label);
  }

  // Add mark rounding if there were issues
  const marksQuality = responses.marks_rounding_quality as string | undefined;
  if (marksQuality === 'wide' || marksQuality === 'tight' || marksQuality === 'traffic') {
    const label = RESPONSE_LABELS.marks_rounding_quality?.[marksQuality];
    if (label) insights.push(label);
  }

  // Return first 1-2 insights joined, or undefined if none
  if (insights.length === 0) {
    return undefined;
  }

  return insights.slice(0, 2).join('. ');
}

/** Per-race result for multi-race regattas */
export interface RaceResult {
  raceNumber: number;
  position: number | null;
  fleetSize: number | null;
  keyMoment: string | null;
}

export interface RaceAnalysisData {
  hasDebrief: boolean;
  analysisId?: string;
  analysisSummary?: string;
  analysisInsights?: string[];
  analysisConfidence?: number;
  keyLearning?: string;
  focusNextRace?: string;
  /** Explicit key moment from Tufte logbook entry */
  keyMoment?: string;
  /** Self-reported finish position (before official results) */
  selfReportedPosition?: number;
  /** Self-reported fleet size */
  selfReportedFleetSize?: number;
  /** Number of races in the regatta */
  raceCount?: number;
  /** Per-race results for multi-race regattas */
  raceResults?: RaceResult[];
  /** Timer session ID (for triggering analysis) */
  timerSessionId?: string;
  /** Strength identified from AI analysis */
  strengthIdentified?: string;
}

interface UseRaceAnalysisDataResult {
  analysisData: RaceAnalysisData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetch analysis data for a specific race
 */
export function useRaceAnalysisData(
  raceId: string | null | undefined,
  userId: string | null | undefined
): UseRaceAnalysisDataResult {
  const [analysisData, setAnalysisData] = useState<RaceAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const isMountedRef = useRef(true);
  const fetchRunIdRef = useRef(0);
  const activeRaceIdRef = useRef<string | null | undefined>(raceId);
  const activeUserIdRef = useRef<string | null | undefined>(userId);

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
    async function fetchAnalysisData() {
      const runId = ++fetchRunIdRef.current;
      const targetRaceId = raceId;
      const targetUserId = userId;
      const canCommit = () =>
        isMountedRef.current &&
        runId === fetchRunIdRef.current &&
        activeRaceIdRef.current === targetRaceId &&
        activeUserIdRef.current === targetUserId;
      // Skip queries for demo race (string ID) - DB expects UUIDs
      if (!targetRaceId || !targetUserId || targetRaceId === 'demo-race' || targetRaceId.startsWith('demo-')) {
        if (!canCommit()) return;
        setAnalysisData(null);
        setIsLoading(false);
        setError(null);
        return;
      }

      if (!canCommit()) return;
      setIsLoading(true);
      setError(null);

      try {
        // First, get the sailor profile ID from the auth user ID
        // This is necessary because race_analysis stores sailor_profiles.id, not auth user.id
        const { data: sailorProfile, error: profileError } = await supabase
          .from('sailor_profiles')
          .select('id')
          .eq('user_id', targetUserId)
          .maybeSingle();

        if (profileError) {
          logger.warn('Error fetching sailor profile', profileError);
        }

        const sailorProfileId = sailorProfile?.id;

        interface TimerSessionRow {
          id: string;
          notes: string | null;
          end_time: string | null;
          self_reported_position: number | null;
          self_reported_fleet_size: number | null;
          key_moment: string | null;
          race_count: number | null;
          race_results: unknown;
          debrief_responses: Record<string, unknown> | null;
        }
        // Check for timer session with notes, self-reported data, key moment, debrief responses, and multi-race results
        let sessionData: TimerSessionRow | null = null;
        let sessionError: { message: string } | null = null;
        const primarySession = await supabase
          .from('race_timer_sessions')
          .select('id, notes, end_time, self_reported_position, self_reported_fleet_size, key_moment, race_count, race_results, debrief_responses')
          .eq('regatta_id', targetRaceId)
          .eq('sailor_id', targetUserId)
          .order('end_time', { ascending: false })
          .limit(1)
          .maybeSingle();
        sessionData = primarySession.data;
        sessionError = primarySession.error;

        if (isMissingIdColumn(sessionError, 'race_timer_sessions', 'regatta_id')) {
          const fallbackSession = await supabase
            .from('race_timer_sessions')
            .select('id, notes, end_time, self_reported_position, self_reported_fleet_size, key_moment, race_count, race_results, debrief_responses')
            .eq('race_id', targetRaceId)
            .eq('sailor_id', targetUserId)
            .order('end_time', { ascending: false })
            .limit(1)
            .maybeSingle();
          sessionData = fallbackSession.data;
          sessionError = fallbackSession.error;
        }

        if (sessionError) {
          logger.warn('Session query error', sessionError);
        }

        const hasSession = !!sessionData;
        const hasNotes = hasSession && typeof sessionData.notes === 'string' && sessionData.notes.trim().length > 0;
        const explicitKeyMoment = sessionData?.key_moment?.trim() || undefined;

        // Extract key learning from structured debrief responses
        // Try multiple fields in priority order
        const debriefResponses = sessionData?.debrief_responses as Record<string, unknown> | null;


        // Try finish phase fields first, then any notes from other phases
        const debriefKeyLearning =
          (typeof debriefResponses?.finish_key_learning === 'string' && debriefResponses.finish_key_learning.trim()) ||
          (typeof debriefResponses?.finish_key_decision === 'string' && debriefResponses.finish_key_decision.trim()) ||
          (typeof debriefResponses?.finish_work_on === 'string' && debriefResponses.finish_work_on.trim()) ||
          (typeof debriefResponses?.finish_what_worked === 'string' && debriefResponses.finish_what_worked.trim()) ||
          // Fall back to notes from other phases
          (typeof debriefResponses?.upwind_notes === 'string' && debriefResponses.upwind_notes.trim()) ||
          (typeof debriefResponses?.downwind_notes === 'string' && debriefResponses.downwind_notes.trim()) ||
          (typeof debriefResponses?.start_strategy === 'string' && debriefResponses.start_strategy.trim()) ||
          undefined;
        const selfReportedPosition = sessionData?.self_reported_position ?? undefined;
        const selfReportedFleetSize = sessionData?.self_reported_fleet_size ?? undefined;
        const raceCount = sessionData?.race_count ?? undefined;

        // Parse race_results JSONB into typed array
        let raceResults: RaceResult[] | undefined;
        if (sessionData?.race_results && Array.isArray(sessionData.race_results)) {
          raceResults = (sessionData.race_results as {
            race_number?: number;
            position?: number | null;
            fleet_size?: number | null;
            key_moment?: string | null;
          }[]).map(r => ({
            raceNumber: r.race_number ?? 1,
            position: r.position ?? null,
            fleetSize: r.fleet_size ?? null,
            keyMoment: r.key_moment ?? null,
          }));
        }

        // Check for AI analysis
        let aiAnalysis: {
          id: string;
          overall_summary?: string;
          recommendations?: string[];
          confidence_score?: number;
        } | null = null;

        if (hasSession && sessionData.id) {
          const { data: aiData, error: aiError } = await supabase
            .from('ai_coach_analysis')
            .select('id, overall_summary, recommendations, confidence_score')
            .eq('timer_session_id', sessionData.id)
            .maybeSingle();

          if (aiError) {
            logger.warn('AI analysis query error', aiError);
          } else {
            aiAnalysis = aiData;
          }
        }

        // Check for race_analysis (structured form-based analysis)
        // Note: race_analysis uses sailor_profiles.id, not auth user.id
        interface RaceAnalysisRow {
          id: string;
          key_learnings: unknown;
          overall_satisfaction: string | null;
        }
        let raceAnalysis: RaceAnalysisRow | null = null;
        let raceAnalysisError: { message: string } | null = null;
        if (sailorProfileId) {
          const primary = await supabase
            .from('race_analysis')
            .select('id, key_learnings, overall_satisfaction')
            .eq('race_id', targetRaceId)
            .eq('sailor_id', sailorProfileId)
            .maybeSingle();

          raceAnalysis = primary.data;
          raceAnalysisError = primary.error;

          if (isMissingIdColumn(raceAnalysisError, 'race_analysis', 'race_id')) {
            const fallback = await supabase
              .from('race_analysis')
              .select('id, key_learnings, overall_satisfaction')
              .eq('regatta_id', targetRaceId)
              .eq('sailor_id', sailorProfileId)
              .maybeSingle();
            raceAnalysis = fallback.data;
            raceAnalysisError = fallback.error;
          }
        }

        if (raceAnalysisError) {
          logger.warn('Race analysis query error', raceAnalysisError);
        }

        if (!canCommit()) return;

        // Extract key learning from various sources
        let keyLearning: string | undefined;
        let focusNextRace: string | undefined;

        // Priority 1: AI recommendations
        if (aiAnalysis?.recommendations && aiAnalysis.recommendations.length > 0) {
          keyLearning = aiAnalysis.recommendations[0];
          focusNextRace = aiAnalysis.recommendations.length > 1
            ? aiAnalysis.recommendations[1]
            : undefined;
        }
        // Priority 2: Race analysis key learnings (from PostRaceAnalysisForm)
        else if (raceAnalysis?.key_learnings) {
          const learnings = Array.isArray(raceAnalysis.key_learnings)
            ? raceAnalysis.key_learnings
            : typeof raceAnalysis.key_learnings === 'string'
              ? [raceAnalysis.key_learnings]
              : [];

          if (learnings.length > 0) {
            keyLearning = learnings[0];
            focusNextRace = learnings.length > 1 ? learnings[1] : undefined;
          }
        }
        // Priority 3: Structured debrief interview key learning (textarea text)
        else if (debriefKeyLearning) {
          keyLearning = debriefKeyLearning;
        }
        // Priority 4: Synthesize from structured select responses
        else if (debriefResponses) {
          const synthesized = synthesizeFromResponses(debriefResponses);
          if (synthesized) {
            keyLearning = synthesized;
          }
        }

        // Extract insights from AI summary
        let analysisInsights: string[] = [];
        if (aiAnalysis?.recommendations) {
          analysisInsights = aiAnalysis.recommendations.slice(0, 3);
        }

        // Check if debrief has any meaningful responses
        const hasDebriefResponses = debriefResponses && Object.keys(debriefResponses).length > 0;

        setAnalysisData({
          hasDebrief: !!(hasNotes || aiAnalysis || raceAnalysis || explicitKeyMoment || hasDebriefResponses || (raceResults && raceResults.length > 0)),
          analysisId: aiAnalysis?.id || raceAnalysis?.id,
          analysisSummary: aiAnalysis?.overall_summary,
          analysisInsights: analysisInsights.length > 0 ? analysisInsights : undefined,
          analysisConfidence: aiAnalysis?.confidence_score,
          keyLearning,
          focusNextRace,
          keyMoment: explicitKeyMoment,
          selfReportedPosition,
          selfReportedFleetSize,
          raceCount,
          raceResults,
          timerSessionId: sessionData?.id,
          strengthIdentified: aiAnalysis?.overall_summary?.split('.')[0], // First sentence as strength
        });
      } catch (err) {
        logger.error('Error fetching analysis', err);
        if (!canCommit()) return;
        setError('Failed to load analysis data');
        setAnalysisData(null);
      } finally {
        if (!canCommit()) return;
        setIsLoading(false);
      }
    }

    void fetchAnalysisData();
  }, [raceId, userId, refetchTrigger]);

  const refetch = () => setRefetchTrigger((prev) => prev + 1);

  return { analysisData, isLoading, error, refetch };
}

/**
 * Batch fetch analysis data for multiple races
 * Useful for pre-loading data when displaying race list
 */
export async function fetchAnalysisDataForRaces(
  raceIds: string[],
  userId: string
): Promise<Map<string, RaceAnalysisData>> {
  const result = new Map<string, RaceAnalysisData>();

  // Filter out demo race IDs (string IDs) - DB expects UUIDs
  const validRaceIds = raceIds.filter(id => id !== 'demo-race' && !id.startsWith('demo-'));

  if (validRaceIds.length === 0 || !userId) {
    return result;
  }

  try {
    // First, get the sailor profile ID from the auth user ID
    // This is necessary because race_analysis stores sailor_profiles.id, not auth user.id
    const { data: sailorProfile } = await supabase
      .from('sailor_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const sailorProfileId = sailorProfile?.id;

    interface BatchTimerSessionRow {
      id: string;
      regatta_id?: string | null;
      race_id?: string | null;
      notes: string | null;
      self_reported_position: number | null;
      self_reported_fleet_size: number | null;
      key_moment: string | null;
      debrief_responses: Record<string, unknown> | null;
    }
    // Batch fetch sessions with self-reported data, key moment, and debrief responses
    let sessions: BatchTimerSessionRow[] | null = null;
    const primarySessions = await supabase
      .from('race_timer_sessions')
      .select('id, regatta_id, race_id, notes, self_reported_position, self_reported_fleet_size, key_moment, debrief_responses')
      .in('regatta_id', validRaceIds)
      .eq('sailor_id', userId);
    sessions = primarySessions.data as BatchTimerSessionRow[] | null;

    if (isMissingIdColumn(primarySessions.error, 'race_timer_sessions', 'regatta_id')) {
      const fallbackSessions = await supabase
        .from('race_timer_sessions')
        .select('id, race_id, notes, self_reported_position, self_reported_fleet_size, key_moment, debrief_responses')
        .in('race_id', validRaceIds)
        .eq('sailor_id', userId);
      sessions = (fallbackSessions.data || []).map((row: BatchTimerSessionRow) => ({
        ...row,
        regatta_id: row.race_id,
      }));
    }

    const sessionsByRace = new Map<string, {
      id: string;
      notes: string | null;
      self_reported_position: number | null;
      self_reported_fleet_size: number | null;
      key_moment: string | null;
      debrief_responses: Record<string, unknown> | null;
    }>();
    const sessionIds: string[] = [];

    for (const session of sessions || []) {
      const sessionRaceId = session.regatta_id || session.race_id;
      if (sessionRaceId && !sessionsByRace.has(sessionRaceId)) {
        sessionsByRace.set(sessionRaceId, {
          id: session.id,
          notes: session.notes,
          self_reported_position: session.self_reported_position,
          self_reported_fleet_size: session.self_reported_fleet_size,
          key_moment: session.key_moment,
          debrief_responses: session.debrief_responses as Record<string, unknown> | null,
        });
        sessionIds.push(session.id);
      }
    }

    // Batch fetch AI analyses
    const aiAnalysesBySession = new Map<string, {
      overall_summary?: string;
      recommendations?: string[];
      confidence_score?: number;
    }>();

    if (sessionIds.length > 0) {
      const { data: aiData } = await supabase
        .from('ai_coach_analysis')
        .select('timer_session_id, overall_summary, recommendations, confidence_score')
        .in('timer_session_id', sessionIds);

      for (const ai of aiData || []) {
        if (ai.timer_session_id) {
          aiAnalysesBySession.set(ai.timer_session_id, ai);
        }
      }
    }

    interface BatchRaceAnalysisRow {
      race_id?: string | null;
      key_learnings: unknown;
    }
    // Batch fetch race analyses
    // Note: race_analysis uses sailor_profiles.id, not auth user.id
    const raceAnalysesByRace = new Map<string, BatchRaceAnalysisRow>();

    if (sailorProfileId) {
      let raceAnalyses: BatchRaceAnalysisRow[] | null = null;
      const primary = await supabase
        .from('race_analysis')
        .select('race_id, key_learnings')
        .in('race_id', validRaceIds)
        .eq('sailor_id', sailorProfileId);

      raceAnalyses = primary.data as BatchRaceAnalysisRow[] | null;
      if (isMissingIdColumn(primary.error, 'race_analysis', 'race_id')) {
        const fallback = await supabase
          .from('race_analysis')
          .select('regatta_id, key_learnings')
          .in('regatta_id', validRaceIds)
          .eq('sailor_id', sailorProfileId);
        raceAnalyses = (fallback.data || []).map((row: { regatta_id: string | null; key_learnings: unknown }) => ({
          race_id: row.regatta_id,
          key_learnings: row.key_learnings,
        }));
      }

      for (const analysis of raceAnalyses || []) {
        if (analysis.race_id) {
          raceAnalysesByRace.set(analysis.race_id, analysis);
        }
      }
    }

    // Build results
    for (const raceId of validRaceIds) {
      const session = sessionsByRace.get(raceId);
      const hasNotes = session && typeof session.notes === 'string' && session.notes.trim().length > 0;
      const aiAnalysis = session ? aiAnalysesBySession.get(session.id) : undefined;
      const raceAnalysis = raceAnalysesByRace.get(raceId);

      const explicitKeyMoment = session?.key_moment?.trim() || undefined;
      const selfReportedPosition = session?.self_reported_position ?? undefined;
      const selfReportedFleetSize = session?.self_reported_fleet_size ?? undefined;

      // Extract key learning from structured debrief responses
      // Try finish phase fields first, then any notes from other phases
      const dr = session?.debrief_responses;
      const debriefKeyLearning =
        (typeof dr?.finish_key_learning === 'string' && (dr.finish_key_learning as string).trim()) ||
        (typeof dr?.finish_key_decision === 'string' && (dr.finish_key_decision as string).trim()) ||
        (typeof dr?.finish_work_on === 'string' && (dr.finish_work_on as string).trim()) ||
        (typeof dr?.finish_what_worked === 'string' && (dr.finish_what_worked as string).trim()) ||
        (typeof dr?.upwind_notes === 'string' && (dr.upwind_notes as string).trim()) ||
        (typeof dr?.downwind_notes === 'string' && (dr.downwind_notes as string).trim()) ||
        (typeof dr?.start_strategy === 'string' && (dr.start_strategy as string).trim()) ||
        undefined;

      let keyLearning: string | undefined;
      let focusNextRace: string | undefined;

      if (aiAnalysis?.recommendations && aiAnalysis.recommendations.length > 0) {
        keyLearning = aiAnalysis.recommendations[0];
        focusNextRace = aiAnalysis.recommendations.length > 1
          ? aiAnalysis.recommendations[1]
          : undefined;
      } else if (raceAnalysis?.key_learnings) {
        const rawLearnings = raceAnalysis.key_learnings;
        const learnings: string[] = Array.isArray(rawLearnings)
          ? rawLearnings.filter((l): l is string => typeof l === 'string')
          : typeof rawLearnings === 'string'
            ? [rawLearnings]
            : [];
        keyLearning = learnings[0];
        focusNextRace = learnings[1];
      } else if (debriefKeyLearning) {
        keyLearning = debriefKeyLearning;
      } else if (dr) {
        // Synthesize from structured select responses
        const synthesized = synthesizeFromResponses(dr);
        if (synthesized) {
          keyLearning = synthesized;
        }
      }

      // Check if debrief has any meaningful responses
      const hasDebriefResponses = dr && Object.keys(dr).length > 0;

      result.set(raceId, {
        hasDebrief: hasNotes || !!aiAnalysis || !!raceAnalysis || !!explicitKeyMoment || !!hasDebriefResponses,
        analysisSummary: aiAnalysis?.overall_summary,
        analysisInsights: aiAnalysis?.recommendations?.slice(0, 3),
        analysisConfidence: aiAnalysis?.confidence_score,
        keyLearning,
        focusNextRace,
        keyMoment: explicitKeyMoment,
        selfReportedPosition,
        selfReportedFleetSize,
      });
    }
  } catch (error) {
    logger.error('fetchAnalysisDataForRaces error', error);
  }

  return result;
}

export default useRaceAnalysisData;

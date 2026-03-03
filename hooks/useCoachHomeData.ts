import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useOrganization } from '@/providers/OrganizationProvider';
import { CompetencyProgressTrend, programService } from '@/services/ProgramService';
import { supabase } from '@/services/supabase';
import { createCoachHomeRealtimeController } from '@/hooks/coachHomeRealtimeController';
import { resolveCoachUnreadThreadCount } from '@/lib/coach/unreadScope';
import {
  CoachHomeProfileSample,
  profileCoachHomeStep,
  summarizeCoachHomeProfile,
} from '@/lib/coach/coachHomeProfiling';
import {
  buildCoachReminders,
  buildCoachWeeklyRecap,
  CoachReminder,
  CoachWeeklyRecap,
  computeDailyStreak,
  countActiveDaysWithin,
} from '@/lib/coach/retentionLoop';

type CoachHomeCounts = {
  assignedPrograms: number;
  dueAssessments: number;
  unreadThreads: number;
  dueTodayAssessments: number;
  overdueAssessments: number;
};

export type CoachAssignedProgramPreview = {
  id: string;
  title: string;
  status: string;
  start_at: string | null;
};

type CoachRetentionLoop = {
  streakDays: number;
  reminders: CoachReminder[];
  weeklyRecap: CoachWeeklyRecap;
};

export function useCoachHomeData() {
  const { user } = useAuth();
  const { activeOrganization } = useOrganization();
  const [counts, setCounts] = useState<CoachHomeCounts>({
    assignedPrograms: 0,
    dueAssessments: 0,
    unreadThreads: 0,
    dueTodayAssessments: 0,
    overdueAssessments: 0,
  });
  const [assignedProgramsPreview, setAssignedProgramsPreview] = useState<CoachAssignedProgramPreview[]>([]);
  const [competencyTrends, setCompetencyTrends] = useState<CompetencyProgressTrend[]>([]);
  const [retention, setRetention] = useState<CoachRetentionLoop>({
    streakDays: 0,
    reminders: [],
    weeklyRecap: {
      completedActions: 0,
      pendingActions: 0,
      activeDays: 0,
      trendDelta: null,
    },
  });
  const [loading, setLoading] = useState(false);
  const refreshDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRunIdRef = useRef(0);

  const organizationId = activeOrganization?.id ?? null;
  const userId = user?.id ?? null;

  const markThreadsSeen = useCallback(async () => {
    if (!organizationId || !userId) return;
    try {
      const assignedProgramIds = await programService.listAssignedProgramIdsForStaff(organizationId, userId);
      const scopedProgramIds = Array.from(
        new Set(assignedProgramIds.map((id) => String(id || '').trim()).filter(Boolean))
      );
      if (scopedProgramIds.length === 0) {
        await programService.markAllThreadsRead(organizationId, userId);
      } else {
        await Promise.all(
          scopedProgramIds.map((programId) => programService.markAllThreadsRead(organizationId, userId, programId))
        );
      }
    } catch (error) {
      console.warn('[useCoachHomeData] Failed to mark threads seen', error);
    }

    setCounts((prev) => ({ ...prev, unreadThreads: 0 }));
  }, [organizationId, userId]);

  const refresh = useCallback(async () => {
    if (!organizationId || !userId) {
      setCounts({
        assignedPrograms: 0,
        dueAssessments: 0,
        unreadThreads: 0,
        dueTodayAssessments: 0,
        overdueAssessments: 0,
      });
      setAssignedProgramsPreview([]);
      setCompetencyTrends([]);
      setRetention({
        streakDays: 0,
        reminders: [],
        weeklyRecap: {
          completedActions: 0,
          pendingActions: 0,
          activeDays: 0,
          trendDelta: null,
        },
      });
      return;
    }

    setLoading(true);
    try {
      const profileSamples: CoachHomeProfileSample[] = [];
      const [assignedProgramIds, dueSummary, unreadThreadCountsByProgram, trends, recentAssessments] =
        await profileCoachHomeStep('core_queries', () =>
          Promise.all([
            programService.listAssignedProgramIdsForStaff(organizationId, userId),
            programService.getEvaluatorDueAssessmentSummary(organizationId, userId),
            programService.getUnreadThreadCountsByProgram(organizationId, userId),
            programService.listCompetencyProgressTrendsForEvaluator(organizationId, userId, {
              weeks: 8,
              limitCompetencies: 4,
            }),
            programService.listEvaluatorAssessmentRecords(organizationId, userId, 800),
          ]),
        profileSamples);

      let assignedProgramPreviewRows: CoachAssignedProgramPreview[] = [];
      if (assignedProgramIds.length > 0) {
        const programs = await profileCoachHomeStep(
          'assigned_program_preview',
          () => programService.listProgramsByIds(organizationId, assignedProgramIds, 3),
          profileSamples
        );
        assignedProgramPreviewRows = programs.map((row) => ({
          id: row.id,
          title: row.title,
          status: row.status,
          start_at: row.start_at,
        }));
      }

      const {
        unreadThreads,
        assessmentActivityTimestamps,
        reminders,
        weeklyRecap,
      } = await profileCoachHomeStep('derive_retention_metrics', async () => {
        const unreadThreads = resolveCoachUnreadThreadCount(unreadThreadCountsByProgram, assignedProgramIds);
        const assessmentActivityTimestamps = recentAssessments.map((row) => row.assessed_at || row.created_at);
        const completedActions = recentAssessments.filter((row) => {
          const status = String(row.status || '').toLowerCase();
          const completedStatus = status === 'submitted' || status === 'reviewed' || status === 'finalized';
          if (!completedStatus) return false;
          const timestamp = row.assessed_at || row.created_at;
          if (!timestamp) return false;
          const parsed = new Date(timestamp);
          if (Number.isNaN(parsed.getTime())) return false;
          return Date.now() - parsed.getTime() <= 7 * 24 * 60 * 60 * 1000;
        }).length;
        const activeDays = countActiveDaysWithin(assessmentActivityTimestamps, 7);
        const reminders = buildCoachReminders({
          overdueAssessments: dueSummary.overdue,
          dueTodayAssessments: dueSummary.dueToday,
          unreadThreads,
        });
        const weeklyRecap = buildCoachWeeklyRecap({
          completedActions,
          pendingActions: dueSummary.totalDue + unreadThreads,
          activeDays,
          trendDelta: trends[0]?.delta_from_previous ?? null,
        });
        return {
          unreadThreads,
          assessmentActivityTimestamps,
          reminders,
          weeklyRecap,
        };
      });

      await profileCoachHomeStep('state_commit', async () => {
        setCounts({
          assignedPrograms: assignedProgramIds.length,
          dueAssessments: dueSummary.totalDue,
          unreadThreads,
          dueTodayAssessments: dueSummary.dueToday,
          overdueAssessments: dueSummary.overdue,
        });
        setAssignedProgramsPreview(assignedProgramPreviewRows);
        setCompetencyTrends(trends);
        setRetention({
          streakDays: computeDailyStreak(assessmentActivityTimestamps),
          reminders,
          weeklyRecap,
        });
      }, profileSamples);

      if (__DEV__) {
        const summary = summarizeCoachHomeProfile(profileSamples);
        if (summary.budgetExceeded) {
          console.warn(
            `[CoachHomeProfile] refresh exceeded p95 budget (${summary.totalMs}ms > ${summary.budgetMs}ms)`,
            summary.steps
          );
        }
      }
    } finally {
      setLoading(false);
    }
  }, [organizationId, userId]);

  const clearRefreshTimer = useCallback(() => {
    if (!refreshDebounceTimerRef.current) return;
    clearTimeout(refreshDebounceTimerRef.current);
    refreshDebounceTimerRef.current = null;
  }, []);

  const scheduleRefresh = useCallback((delayMs: number = 250) => {
    clearRefreshTimer();
    refreshDebounceTimerRef.current = setTimeout(() => {
      refreshDebounceTimerRef.current = null;
      void refresh();
    }, delayMs);
  }, [clearRefreshTimer, refresh]);

  useEffect(() => {
    scheduleRefresh(0);
    return () => {
      clearRefreshTimer();
    };
  }, [clearRefreshTimer, scheduleRefresh]);

  useEffect(() => {
    if (!organizationId || !userId) return;
    const runId = ++activeRunIdRef.current;
    const controller = createCoachHomeRealtimeController({
      organizationId,
      userId,
      runId,
      isActiveRun: () => activeRunIdRef.current === runId,
      supabase,
      scheduleRefresh,
    });

    return () => {
      if (activeRunIdRef.current === runId) {
        activeRunIdRef.current += 1;
      }
      controller.dispose();
    };
  }, [organizationId, scheduleRefresh, userId]);

  const hasWorkspace = useMemo(() => Boolean(organizationId && userId), [organizationId, userId]);

  return {
    counts,
    retention,
    assignedProgramsPreview,
    competencyTrends,
    loading,
    hasWorkspace,
    refresh,
    markThreadsSeen,
  };
}

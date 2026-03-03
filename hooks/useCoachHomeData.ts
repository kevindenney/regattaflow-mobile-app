import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useOrganization } from '@/providers/OrganizationProvider';
import { CompetencyProgressTrend, programService } from '@/services/ProgramService';
import { supabase } from '@/services/supabase';
import { createCoachHomeRealtimeController } from '@/hooks/coachHomeRealtimeController';

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
  const [loading, setLoading] = useState(false);
  const refreshDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRunIdRef = useRef(0);

  const organizationId = activeOrganization?.id ?? null;
  const userId = user?.id ?? null;

  const markThreadsSeen = useCallback(async () => {
    if (!organizationId || !userId) return;
    try {
      await programService.markAllThreadsRead(organizationId, userId);
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
      return;
    }

    setLoading(true);
    try {
      const [assignedProgramIds, dueSummary, unreadThreadIds, trends] = await Promise.all([
        programService.listAssignedProgramIdsForStaff(organizationId, userId),
        programService.getEvaluatorDueAssessmentSummary(organizationId, userId),
        programService.listUnreadThreadIds(organizationId, userId),
        programService.listCompetencyProgressTrendsForEvaluator(organizationId, userId, {
          weeks: 8,
          limitCompetencies: 4,
        }),
      ]);

      let assignedProgramPreviewRows: CoachAssignedProgramPreview[] = [];
      if (assignedProgramIds.length > 0) {
        const programs = await programService.listProgramsByIds(organizationId, assignedProgramIds, 3);
        assignedProgramPreviewRows = programs.map((row) => ({
          id: row.id,
          title: row.title,
          status: row.status,
          start_at: row.start_at,
        }));
      }

      setCounts({
        assignedPrograms: assignedProgramIds.length,
        dueAssessments: dueSummary.totalDue,
        unreadThreads: unreadThreadIds.length,
        dueTodayAssessments: dueSummary.dueToday,
        overdueAssessments: dueSummary.overdue,
      });
      setAssignedProgramsPreview(assignedProgramPreviewRows);
      setCompetencyTrends(trends);
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
    assignedProgramsPreview,
    competencyTrends,
    loading,
    hasWorkspace,
    refresh,
    markThreadsSeen,
  };
}

/**
 * Cohort Competency Service
 *
 * Aggregates competency data across all students in a cohort.
 * Powers the faculty cohort dashboard, heatmap, gap alerts, and NCLEX readiness.
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';
import { NURSING_AACN_DOMAINS } from '@/configs/competencies/nursing-core-v1';
import type { Competency, CompetencyProgress, CompetencyStatus } from '@/types/competency';
import type {
  CohortCompetencyMatrix,
  CohortStudentRow,
  CohortDomain,
  CohortSummary,
  DomainAverage,
  AtRiskStudent,
  CohortGap,
} from '@/types/cohortCompetency';

const logger = createLogger('CohortCompetencyService');

const ACHIEVED_STATUSES: CompetencyStatus[] = ['validated', 'competent'];

function isAchieved(status: CompetencyStatus): boolean {
  return ACHIEVED_STATUSES.includes(status);
}

// ---------------------------------------------------------------------------
// 1. Full cohort × competency matrix
// ---------------------------------------------------------------------------

export async function getCohortCompetencyMatrix(
  cohortId: string,
  orgId: string,
): Promise<CohortCompetencyMatrix> {
  logger.debug('Fetching cohort competency matrix', { cohortId, orgId });

  // 1. Fetch cohort members
  const { data: memberRows, error: membersErr } = await supabase
    .from('betterat_org_cohort_members')
    .select('user_id')
    .eq('cohort_id', cohortId);

  if (membersErr) throw membersErr;
  if (!memberRows || memberRows.length === 0) {
    return { students: [], domains: buildDomains([]), competencyCount: 0 };
  }

  const userIds = memberRows.map((m: any) => m.user_id);

  // Fetch profile names separately
  const { data: profileRows } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds);

  const nameMap = new Map<string, string>();
  for (const p of (profileRows ?? []) as any[]) {
    nameMap.set(p.id, p.full_name || 'Unknown');
  }

  // 2. Fetch competency definitions for this org
  const { data: competencies, error: compErr } = await supabase
    .from('betterat_competencies')
    .select('id, title, category, sort_order')
    .eq('organization_id', orgId)
    .order('sort_order', { ascending: true });

  if (compErr) throw compErr;
  if (!competencies || competencies.length === 0) {
    return { students: [], domains: buildDomains([]), competencyCount: 0 };
  }

  const competencyIds = competencies.map((c: Competency) => c.id);

  // 3. Batch-fetch all progress rows for all members × all competencies
  const { data: progressRows, error: progErr } = await supabase
    .from('betterat_competency_progress')
    .select('user_id, competency_id, status')
    .in('user_id', userIds)
    .in('competency_id', competencyIds);

  if (progErr) throw progErr;

  // Build lookup: userId → competencyId → status
  const progressMap = new Map<string, Map<string, CompetencyStatus>>();
  for (const row of (progressRows ?? []) as CompetencyProgress[]) {
    if (!progressMap.has(row.user_id)) {
      progressMap.set(row.user_id, new Map());
    }
    progressMap.get(row.user_id)!.set(row.competency_id, row.status);
  }

  // 4. Build domain structure
  const domains = buildDomains(competencies as Competency[]);
  const domainByCompetencyId = new Map<string, string>();
  for (const d of domains) {
    for (const cId of d.competencyIds) {
      domainByCompetencyId.set(cId, d.id);
    }
  }

  // 5. Build student rows
  const students: CohortStudentRow[] = userIds.map((userId: string) => {
    const userProgress = progressMap.get(userId) ?? new Map();
    const byCompetency: Record<string, CompetencyStatus> = {};
    const domainStats: Record<string, { total: number; achieved: number }> = {};

    // Initialize domain stats
    for (const d of domains) {
      domainStats[d.id] = { total: d.competencyIds.length, achieved: 0 };
    }

    let totalAchieved = 0;
    for (const comp of competencies as Competency[]) {
      const status: CompetencyStatus = userProgress.get(comp.id) ?? 'not_started';
      byCompetency[comp.id] = status;

      if (isAchieved(status)) {
        totalAchieved++;
        const domainId = domainByCompetencyId.get(comp.id);
        if (domainId && domainStats[domainId]) {
          domainStats[domainId].achieved++;
        }
      }
    }

    const overallPercent = competencies.length > 0
      ? Math.round((totalAchieved / competencies.length) * 100)
      : 0;

    const byDomain: CohortStudentRow['byDomain'] = {};
    for (const [domainId, stats] of Object.entries(domainStats)) {
      byDomain[domainId] = {
        total: stats.total,
        achieved: stats.achieved,
        percent: stats.total > 0 ? Math.round((stats.achieved / stats.total) * 100) : 0,
      };
    }

    return {
      userId,
      userName: nameMap.get(userId) ?? 'Unknown',
      overallPercent,
      byDomain,
      byCompetency,
    };
  });

  // Sort students by name
  students.sort((a, b) => a.userName.localeCompare(b.userName));

  // Build competency title lookup for heatmap expanded rows
  const competencyTitles: Record<string, string> = {};
  for (const c of competencies as Competency[]) {
    competencyTitles[c.id] = c.title;
  }

  return { students, domains, competencyCount: competencies.length, competencyTitles };
}

// ---------------------------------------------------------------------------
// 2. Cohort summary KPIs
// ---------------------------------------------------------------------------

export async function getCohortSummary(
  cohortId: string,
  orgId: string,
): Promise<CohortSummary> {
  const matrix = await getCohortCompetencyMatrix(cohortId, orgId);

  let totalPercent = 0;
  let atRisk = 0;
  let onTrack = 0;
  let excelling = 0;

  for (const s of matrix.students) {
    totalPercent += s.overallPercent;
    if (s.overallPercent < 30) atRisk++;
    else if (s.overallPercent <= 70) onTrack++;
    else excelling++;
  }

  const avgPercent = matrix.students.length > 0
    ? Math.round(totalPercent / matrix.students.length)
    : 0;

  // Domain averages
  const domainTotals: Record<string, { sum: number; count: number }> = {};
  for (const d of matrix.domains) {
    domainTotals[d.id] = { sum: 0, count: 0 };
  }
  for (const s of matrix.students) {
    for (const [domainId, achievement] of Object.entries(s.byDomain)) {
      if (domainTotals[domainId]) {
        domainTotals[domainId].sum += achievement.percent;
        domainTotals[domainId].count++;
      }
    }
  }

  const domainAverages: DomainAverage[] = matrix.domains.map(d => ({
    domainId: d.id,
    domainTitle: d.title,
    averagePercent: domainTotals[d.id]?.count > 0
      ? Math.round(domainTotals[d.id].sum / domainTotals[d.id].count)
      : 0,
  }));

  return {
    totalStudents: matrix.students.length,
    averageCompetencyPercent: avgPercent,
    studentsAtRisk: atRisk,
    studentsOnTrack: onTrack,
    studentsExcelling: excelling,
    domainAverages,
  };
}

// ---------------------------------------------------------------------------
// 3. At-risk students (below threshold)
// ---------------------------------------------------------------------------

export async function getAtRiskStudents(
  cohortId: string,
  orgId: string,
  thresholdPercent: number = 50,
): Promise<AtRiskStudent[]> {
  const matrix = await getCohortCompetencyMatrix(cohortId, orgId);

  // Build competency title lookup
  const { data: competencies } = await supabase
    .from('betterat_competencies')
    .select('id, title, category')
    .eq('organization_id', orgId);

  const compMap = new Map<string, { title: string; category: string }>();
  for (const c of (competencies ?? []) as Competency[]) {
    compMap.set(c.id, { title: c.title, category: c.category });
  }

  return matrix.students
    .filter(s => s.overallPercent < thresholdPercent)
    .map(s => ({
      userId: s.userId,
      userName: s.userName,
      overallPercent: s.overallPercent,
      gapCompetencies: Object.entries(s.byCompetency)
        .filter(([, status]) => !isAchieved(status))
        .map(([compId, status]) => ({
          competencyId: compId,
          title: compMap.get(compId)?.title ?? 'Unknown',
          category: compMap.get(compId)?.category ?? 'Unknown',
          status,
        }))
        .sort((a, b) => {
          // Sort by status severity: not_started first
          const order: Record<string, number> = { not_started: 0, learning: 1, practicing: 2, checkoff_ready: 3 };
          return (order[a.status] ?? 4) - (order[b.status] ?? 4);
        }),
    }))
    .sort((a, b) => a.overallPercent - b.overallPercent);
}

// ---------------------------------------------------------------------------
// 4. Cohort gaps (weakest competencies across cohort)
// ---------------------------------------------------------------------------

export async function getCohortGaps(
  cohortId: string,
  orgId: string,
): Promise<CohortGap[]> {
  const matrix = await getCohortCompetencyMatrix(cohortId, orgId);
  if (matrix.students.length === 0) return [];

  // Build competency info lookup
  const { data: competencies } = await supabase
    .from('betterat_competencies')
    .select('id, title, category')
    .eq('organization_id', orgId);

  const compMap = new Map<string, { title: string; category: string }>();
  for (const c of (competencies ?? []) as Competency[]) {
    compMap.set(c.id, { title: c.title, category: c.category });
  }

  // For each competency, calculate attempt rate and achievement rate
  const compIds = new Set<string>();
  for (const s of matrix.students) {
    for (const cId of Object.keys(s.byCompetency)) {
      compIds.add(cId);
    }
  }

  const gaps: CohortGap[] = [];
  const n = matrix.students.length;

  for (const compId of compIds) {
    let attempted = 0;
    let achieved = 0;

    for (const s of matrix.students) {
      const status = s.byCompetency[compId] ?? 'not_started';
      if (status !== 'not_started') attempted++;
      if (isAchieved(status)) achieved++;
    }

    const info = compMap.get(compId);
    gaps.push({
      competencyId: compId,
      competencyTitle: info?.title ?? 'Unknown',
      domainTitle: info?.category ?? 'Unknown',
      attemptRate: Math.round((attempted / n) * 100),
      achievementRate: Math.round((achieved / n) * 100),
    });
  }

  // Sort by lowest achievement rate, then lowest attempt rate
  gaps.sort((a, b) => a.achievementRate - b.achievementRate || a.attemptRate - b.attemptRate);

  return gaps;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildDomains(competencies: Competency[]): CohortDomain[] {
  // Group competencies by category → map to AACN domains
  const categoryToCompIds = new Map<string, string[]>();
  for (const c of competencies) {
    const cat = c.category;
    if (!categoryToCompIds.has(cat)) {
      categoryToCompIds.set(cat, []);
    }
    categoryToCompIds.get(cat)!.push(c.id);
  }

  // Try to match category names to AACN domain IDs
  return NURSING_AACN_DOMAINS.map(d => {
    const competencyIds = categoryToCompIds.get(d.title) ?? [];
    return {
      id: d.id,
      title: d.title,
      competencyIds,
    };
  }).filter(d => d.competencyIds.length > 0);
}

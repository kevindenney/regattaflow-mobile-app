/**
 * Cohort Competency Types
 *
 * Types for the faculty cohort dashboard that aggregates
 * competency data across all students in a cohort.
 */

import type { CompetencyStatus } from './competency';

// ---------------------------------------------------------------------------
// Cohort Matrix
// ---------------------------------------------------------------------------

/** Full competency matrix: every student × every competency, grouped by domain. */
export interface CohortCompetencyMatrix {
  students: CohortStudentRow[];
  domains: CohortDomain[];
  competencyCount: number;
  /** Competency ID → title lookup for display in expanded rows */
  competencyTitles?: Record<string, string>;
}

export interface CohortDomain {
  id: string;
  title: string;
  competencyIds: string[];
}

export interface CohortStudentRow {
  userId: string;
  userName: string;
  overallPercent: number;
  /** Achievement per domain: domain ID → stats */
  byDomain: Record<string, DomainAchievement>;
  /** Achievement per competency: competency ID → status */
  byCompetency: Record<string, CompetencyStatus>;
}

export interface DomainAchievement {
  total: number;
  achieved: number; // count at 'validated' or 'competent'
  percent: number;
}

// ---------------------------------------------------------------------------
// Cohort Summary (KPIs)
// ---------------------------------------------------------------------------

export interface CohortSummary {
  totalStudents: number;
  averageCompetencyPercent: number;
  studentsAtRisk: number;      // <30% validated+
  studentsOnTrack: number;     // 30-70% validated+
  studentsExcelling: number;   // >70% validated+
  domainAverages: DomainAverage[];
}

export interface DomainAverage {
  domainId: string;
  domainTitle: string;
  averagePercent: number;
}

// ---------------------------------------------------------------------------
// At-Risk Students
// ---------------------------------------------------------------------------

export interface AtRiskStudent {
  userId: string;
  userName: string;
  overallPercent: number;
  gapCompetencies: GapCompetency[];
}

export interface GapCompetency {
  competencyId: string;
  title: string;
  category: string;
  status: CompetencyStatus;
}

// ---------------------------------------------------------------------------
// Cohort Gaps (competencies where the cohort is weakest)
// ---------------------------------------------------------------------------

export interface CohortGap {
  competencyId: string;
  competencyTitle: string;
  domainTitle: string;
  /** % of students with at least 1 attempt */
  attemptRate: number;
  /** % of students at 'validated' or 'competent' */
  achievementRate: number;
}

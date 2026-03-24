/**
 * Competency Tracking Types
 *
 * Supports the full sign-off chain:
 *   Student self-assesses → Preceptor validates → Faculty approves
 *
 * Status progression:
 *   not_started → learning → practicing → checkoff_ready → validated → competent
 */

// ---------------------------------------------------------------------------
// Status & Rating Enums
// ---------------------------------------------------------------------------

export type CompetencyStatus =
  | 'not_started'
  | 'learning'
  | 'practicing'
  | 'checkoff_ready'
  | 'validated'
  | 'competent';

export type SelfRating =
  | 'needs_practice'
  | 'developing'
  | 'proficient'
  | 'confident';

export type PreceptorRating =
  | 'not_observed'
  | 'needs_improvement'
  | 'satisfactory'
  | 'excellent';

export type FacultyDecision =
  | 'approved'
  | 'needs_more_practice'
  | 'remediation_required';

/** Category is a free-form string — nursing defaults shown for reference. */
export type CompetencyCategory = string;

// ---------------------------------------------------------------------------
// Core Entities
// ---------------------------------------------------------------------------

export interface Competency {
  id: string;
  interest_id: string;
  organization_id?: string | null;
  category: CompetencyCategory;
  competency_number: number;
  title: string;
  description: string | null;
  requires_supervision: boolean;
  sort_order: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Admin CRUD Payloads
// ---------------------------------------------------------------------------

export interface CreateCompetencyPayload {
  interest_id: string;
  organization_id: string;
  category: string;
  competency_number: number;
  title: string;
  description?: string | null;
  requires_supervision?: boolean;
  sort_order?: number;
}

export interface UpdateCompetencyPayload {
  title?: string;
  description?: string | null;
  category?: string;
  requires_supervision?: boolean;
  sort_order?: number;
}

export interface CreateSubCompetencyPayload {
  competency_id: string;
  organization_id: string;
  title: string;
  description?: string | null;
  sort_order?: number;
}

export interface UpdateSubCompetencyPayload {
  title?: string;
  description?: string | null;
  sort_order?: number;
}

export interface CompetencyProgress {
  id: string;
  user_id: string;
  competency_id: string;
  status: CompetencyStatus;
  attempts_count: number;
  last_attempt_at: string | null;
  validated_by: string | null;
  validated_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompetencyAttempt {
  id: string;
  user_id: string;
  competency_id: string;
  event_id: string | null;
  attempt_number: number;
  self_rating: SelfRating | null;
  self_notes: string | null;
  preceptor_id: string | null;
  preceptor_rating: PreceptorRating | null;
  preceptor_notes: string | null;
  preceptor_reviewed_at: string | null;
  clinical_context: string | null;
  created_at: string;
}

export interface CompetencyReview {
  id: string;
  progress_id: string;
  reviewer_id: string;
  decision: FacultyDecision;
  notes: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Enriched / Joined Types
// ---------------------------------------------------------------------------

/** Competency definition + user's current progress (for dashboard display). */
export interface CompetencyWithProgress extends Competency {
  progress: CompetencyProgress | null;
}

/** A single attempt with the competency title attached. */
export interface AttemptWithCompetency extends CompetencyAttempt {
  competency: Pick<Competency, 'title' | 'competency_number' | 'category'>;
}

/** Full detail view: competency + progress + all attempts + reviews. */
export interface CompetencyDetail {
  competency: Competency;
  progress: CompetencyProgress | null;
  attempts: CompetencyAttempt[];
  reviews: CompetencyReview[];
}

// ---------------------------------------------------------------------------
// Dashboard Summary
// ---------------------------------------------------------------------------

export interface CompetencyDashboardSummary {
  total: number;
  byStatus: Record<CompetencyStatus, number>;
  byCategory: Record<string, {
    total: number;
    completed: number;
    items: CompetencyWithProgress[];
  }>;
  overallPercent: number; // percentage at 'validated' or 'competent'
  clinicalHoursLogged?: number;
}

// ---------------------------------------------------------------------------
// Action Payloads
// ---------------------------------------------------------------------------

export interface LogAttemptPayload {
  competency_id: string;
  event_id?: string;
  self_rating: SelfRating;
  self_notes?: string;
  preceptor_id?: string;
  clinical_context?: string;
}

export interface PreceptorValidationPayload {
  attempt_id: string;
  preceptor_rating: PreceptorRating;
  preceptor_notes?: string;
}

export interface FacultyReviewPayload {
  progress_id: string;
  decision: FacultyDecision;
  notes?: string;
}

// ---------------------------------------------------------------------------
// UI Config
// ---------------------------------------------------------------------------

export const COMPETENCY_STATUS_CONFIG: Record<
  CompetencyStatus,
  { label: string; color: string; bg: string; icon: string; ordinal: number }
> = {
  not_started: { label: 'Not Started', color: '#9CA3AF', bg: '#F3F4F6', icon: 'ellipse-outline', ordinal: 0 },
  learning: { label: 'Learning', color: '#0369A1', bg: '#E0F2FE', icon: 'book-outline', ordinal: 1 },
  practicing: { label: 'Practicing', color: '#B45309', bg: '#FEF3C7', icon: 'fitness-outline', ordinal: 2 },
  checkoff_ready: { label: 'Checkoff Ready', color: '#7C3AED', bg: '#EDE9FE', icon: 'checkmark-circle-outline', ordinal: 3 },
  validated: { label: 'Validated', color: '#15803D', bg: '#DCFCE7', icon: 'shield-checkmark-outline', ordinal: 4 },
  competent: { label: 'Competent', color: '#047857', bg: '#D1FAE5', icon: 'ribbon-outline', ordinal: 5 },
};

export const SELF_RATING_CONFIG: Record<
  SelfRating,
  { label: string; color: string; icon: string }
> = {
  needs_practice: { label: 'Needs Practice', color: '#DC2626', icon: 'alert-circle-outline' },
  developing: { label: 'Developing', color: '#B45309', icon: 'trending-up-outline' },
  proficient: { label: 'Proficient', color: '#0369A1', icon: 'thumbs-up-outline' },
  confident: { label: 'Confident', color: '#15803D', icon: 'checkmark-done-outline' },
};

export const PRECEPTOR_RATING_CONFIG: Record<
  PreceptorRating,
  { label: string; color: string; shortLabel: string }
> = {
  not_observed: { label: 'Not Observed', color: '#9CA3AF', shortLabel: 'N/O' },
  needs_improvement: { label: 'Needs Improvement', color: '#DC2626', shortLabel: 'NI' },
  satisfactory: { label: 'Satisfactory', color: '#B45309', shortLabel: 'S' },
  excellent: { label: 'Excellent', color: '#15803D', shortLabel: 'E' },
};

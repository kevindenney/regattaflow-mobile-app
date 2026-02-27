/**
 * Blank Plan Card Types
 *
 * A universal, untyped event card for structured planning across all interests.
 * Uses What/Who/Why/How phases instead of Before/During/After.
 *
 * Use cases:
 *  - A sailor planning a coaching session that isn't a race
 *  - A nursing student planning a study group review
 *  - An artist planning a museum visit for inspiration
 *  - A fitness athlete planning a recovery day
 */

// =============================================================================
// PLAN CARD PHASES
// =============================================================================

export type PlanCardPhase = 'what' | 'who' | 'why' | 'how' | 'capture' | 'review';

export const PLAN_CARD_PHASES: PlanCardPhase[] = ['what', 'who', 'why', 'how'];

export const PLAN_CARD_PHASE_LABELS: Record<PlanCardPhase, string> = {
  what: 'What',
  who: 'Who',
  why: 'Why',
  how: 'How',
  capture: 'Capture',
  review: 'Review',
};

export const PLAN_CARD_PHASE_DESCRIPTIONS: Record<PlanCardPhase, string> = {
  what: 'Define the activity',
  who: 'People involved',
  why: 'Goals and motivation',
  how: 'Execution plan',
  capture: 'Record evidence',
  review: 'Reflect on what happened',
};

// =============================================================================
// PLAN CARD STATUS
// =============================================================================

export type PlanCardStatus = 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled';

// =============================================================================
// WHAT TAB DATA
// =============================================================================

export interface PlanWhatData {
  title: string;
  description?: string;
  date?: string;
  time?: string;
  endTime?: string;
  location?: string;
  /** Interest tag (auto-filled from current interest) */
  interestSlug?: string;
  /** Free-text notes */
  notes?: string;
}

// =============================================================================
// WHO TAB DATA
// =============================================================================

export interface PlanWhoPerson {
  /** User ID if from connections */
  userId?: string;
  /** Display name */
  name: string;
  /** Role in the activity */
  role?: string;
  /** Avatar URL */
  avatarUrl?: string;
  /** External (not in the app) */
  isExternal?: boolean;
}

export interface PlanWhoData {
  people: PlanWhoPerson[];
}

// =============================================================================
// WHY TAB DATA
// =============================================================================

export interface PlanWhyData {
  /** Learning objectives */
  objectives: string[];
  /** Competency IDs to target */
  competencyIds?: number[];
  /** Personal motivation */
  motivation?: string;
  /** Link to a course or lesson */
  linkedLessonId?: string;
  linkedLessonTitle?: string;
}

// =============================================================================
// HOW TAB DATA
// =============================================================================

export interface PlanHowStep {
  id: string;
  text: string;
  completed?: boolean;
}

export interface PlanHowData {
  /** Step-by-step plan */
  steps: PlanHowStep[];
  /** Materials / equipment needed */
  materials: string[];
  /** Timeline / schedule notes */
  timeline?: string;
  /** Contingency notes */
  contingency?: string;
}

// =============================================================================
// CAPTURE DATA (during / after the activity)
// =============================================================================

export interface PlanCaptureMedia {
  id: string;
  type: 'photo' | 'video' | 'audio' | 'text';
  /** Local URI or remote URL */
  uri: string;
  /** Thumbnail URI for photos/videos */
  thumbnailUri?: string;
  /** Capture timestamp */
  timestamp: string;
  /** User-provided caption */
  caption?: string;
  /** Duration in seconds (audio/video) */
  durationSeconds?: number;
}

export interface PlanActivityLogEntry {
  id: string;
  action: string;
  timestamp: string;
  notes?: string;
}

export interface PlanCaptureData {
  media: PlanCaptureMedia[];
  activityLog: PlanActivityLogEntry[];
}

// =============================================================================
// REVIEW DATA (reflection after the activity)
// =============================================================================

export interface PlanReviewData {
  whatHappened?: string;
  whatLearned?: string;
  whatsNext?: string;
  /** Competency IDs demonstrated */
  competenciesDemonstrated?: number[];
  /** AI-generated summary */
  aiSummary?: string;
  /** Overall satisfaction 1-5 */
  rating?: number;
}

// =============================================================================
// COMPLETE PLAN CARD
// =============================================================================

export interface PlanCard {
  id: string;
  userId: string;
  interestId: string;
  status: PlanCardStatus;
  /** The What/Who/Why/How data */
  what: PlanWhatData;
  who: PlanWhoData;
  why: PlanWhyData;
  how: PlanHowData;
  /** Capture data (filled during the activity) */
  capture: PlanCaptureData;
  /** Review data (filled after the activity) */
  review: PlanReviewData;
  /** Timestamps */
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// =============================================================================
// DATABASE ROW TYPE
// =============================================================================

export interface PlanCardRow {
  id: string;
  user_id: string;
  interest_id: string;
  status: string;
  plan_data: {
    what: PlanWhatData;
    who: PlanWhoData;
    why: PlanWhyData;
    how: PlanHowData;
    capture: PlanCaptureData;
    review: PlanReviewData;
  };
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

// =============================================================================
// TRANSFORM
// =============================================================================

const EMPTY_WHAT: PlanWhatData = { title: '' };
const EMPTY_WHO: PlanWhoData = { people: [] };
const EMPTY_WHY: PlanWhyData = { objectives: [] };
const EMPTY_HOW: PlanHowData = { steps: [], materials: [] };
const EMPTY_CAPTURE: PlanCaptureData = { media: [], activityLog: [] };
const EMPTY_REVIEW: PlanReviewData = {};

export function rowToPlanCard(row: PlanCardRow): PlanCard {
  const d = row.plan_data;
  return {
    id: row.id,
    userId: row.user_id,
    interestId: row.interest_id,
    status: row.status as PlanCardStatus,
    what: d?.what ?? EMPTY_WHAT,
    who: d?.who ?? EMPTY_WHO,
    why: d?.why ?? EMPTY_WHY,
    how: d?.how ?? EMPTY_HOW,
    capture: d?.capture ?? EMPTY_CAPTURE,
    review: d?.review ?? EMPTY_REVIEW,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? undefined,
  };
}

export function planCardToRow(card: PlanCard): Omit<PlanCardRow, 'created_at' | 'updated_at'> {
  return {
    id: card.id,
    user_id: card.userId,
    interest_id: card.interestId,
    status: card.status,
    plan_data: {
      what: card.what,
      who: card.who,
      why: card.why,
      how: card.how,
      capture: card.capture,
      review: card.review,
    },
    completed_at: card.completedAt ?? null,
  };
}

// =============================================================================
// INPUT TYPES
// =============================================================================

export interface CreatePlanCardInput {
  interestId: string;
  what: Partial<PlanWhatData> & { title: string };
  who?: Partial<PlanWhoData>;
  why?: Partial<PlanWhyData>;
  how?: Partial<PlanHowData>;
}

export interface UpdatePlanCardInput {
  what?: Partial<PlanWhatData>;
  who?: Partial<PlanWhoData>;
  why?: Partial<PlanWhyData>;
  how?: Partial<PlanHowData>;
  capture?: Partial<PlanCaptureData>;
  review?: Partial<PlanReviewData>;
  status?: PlanCardStatus;
}

/**
 * Adaptive Learning Types
 *
 * Types for the adaptive learning system that extracts insights
 * from race feedback and generates personalized nudges.
 */

import type { RacePhase, ChecklistCategory } from './excellenceFramework';

// ============================================
// Learnable Event Types
// ============================================

/**
 * Types of learnable events that can be extracted from feedback
 */
export type LearnableEventType =
  | 'forgotten_item' // Forgot to bring/check something
  | 'performance_issue' // Struggled in a specific area
  | 'successful_strategy' // A tactic that worked well
  | 'venue_learning' // Venue-specific insight
  | 'equipment_issue' // Rig/sail setting learning
  | 'timing_issue' // Arrived late, rushed, etc.
  | 'weather_adaptation' // How conditions were handled
  | 'crew_coordination' // Team communication learning
  | 'decision_outcome'; // Morning decision effectiveness

/**
 * Outcome of a learnable event
 */
export type LearnableEventOutcome = 'positive' | 'negative' | 'neutral';

/**
 * Conditions context for matching events to future races
 */
export interface ConditionsContext {
  windSpeedRange?: [number, number]; // [min, max] in knots
  windDirectionRange?: [number, number]; // [min, max] in degrees
  venueSpecific?: boolean;
  venueId?: string;
  raceTypeSpecific?: boolean;
  raceType?: 'fleet' | 'team' | 'match' | 'distance';
  tideSensitive?: boolean;
  tideState?: 'rising' | 'falling' | 'slack' | 'spring' | 'neap';
  boatClass?: string;
  boatClassId?: string;
  seaState?: 'flat' | 'choppy' | 'moderate' | 'rough';
}

/**
 * A learnable event extracted from race feedback
 */
export interface LearnableEvent {
  id: string;
  sailorId: string;
  raceEventId?: string;
  regattaId?: string; // Reference to regattas table (may exist even when raceEventId is null)
  venueId?: string;

  // Classification
  eventType: LearnableEventType;
  phase?: RacePhase;
  category?: ChecklistCategory;

  // Content
  originalText: string; // The source quote from sailor
  title: string; // Short summary
  actionText: string; // Imperative nudge text for future races

  // Outcome
  outcome: LearnableEventOutcome;
  impactRating?: number; // 1-5 how significant

  // Conditions for matching
  conditionsContext: ConditionsContext;

  // AI metadata
  aiExtracted: boolean;
  aiConfidence?: number; // 0-1
  sailorConfirmed: boolean;

  // Nudge tracking
  nudgeEligible: boolean;
  timesSurfaced: number;
  lastSurfacedAt?: string;
  dismissed: boolean;
  dismissedAt?: string;

  // Effectiveness
  effectivenessRating?: number; // 1-5 how helpful was this nudge

  // Timestamps
  eventDate?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating a learnable event
 */
export interface CreateLearnableEventInput {
  raceEventId?: string; // Can be race_event ID or regatta ID (service will resolve)
  regattaId?: string; // Explicit regatta ID if known
  venueId?: string;
  eventType: LearnableEventType;
  phase?: RacePhase;
  category?: ChecklistCategory;
  originalText: string;
  title: string;
  actionText: string;
  outcome: LearnableEventOutcome;
  impactRating?: number;
  conditionsContext?: ConditionsContext;
  aiExtracted?: boolean;
  aiConfidence?: number;
  eventDate?: string;
}

// ============================================
// Nudge Delivery Types
// ============================================

/**
 * Channel through which a nudge is delivered
 */
export type NudgeDeliveryChannel = 'in_app' | 'push' | 'checklist' | 'briefing';

/**
 * Record of a nudge being shown to a sailor
 */
export interface NudgeDelivery {
  id: string;
  learnableEventId: string;
  sailorId: string;
  raceEventId?: string;

  // Delivery info
  deliveredAt: string;
  deliveryChannel: NudgeDeliveryChannel;

  // Sailor response
  acknowledged?: boolean;
  acknowledgedAt?: string;
  actionTaken?: boolean;
  actionTakenAt?: string;

  // Effectiveness
  outcomeRating?: number; // 1-5
  outcomeNotes?: string;
  issueRecurred?: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for recording a nudge delivery
 */
export interface RecordNudgeDeliveryInput {
  learnableEventId: string;
  raceEventId?: string;
  deliveryChannel: NudgeDeliveryChannel;
}

/**
 * Input for updating nudge delivery response
 */
export interface UpdateNudgeDeliveryInput {
  deliveryId: string;
  acknowledged?: boolean;
  actionTaken?: boolean;
}

/**
 * Input for recording nudge outcome
 */
export interface RecordNudgeOutcomeInput {
  deliveryId: string;
  outcomeRating: number;
  outcomeNotes?: string;
  issueRecurred: boolean;
}

// ============================================
// AI Extraction Types
// ============================================

/**
 * Source type for extraction
 */
export type ExtractionSourceType =
  | 'post_race_narrative'
  | 'key_moment'
  | 'morning_review_feedback'
  | 'phase_notes'
  | 'race_analysis_notes';

/**
 * Input for AI extraction
 */
export interface ExtractionInput {
  text: string;
  sourceType: ExtractionSourceType;
  context: {
    venue?: string;
    venueId?: string;
    windSpeed?: number;
    windDirection?: number;
    tide?: string;
    raceType?: string;
    boatClass?: string;
    date?: string;
  };
}

/**
 * Output from AI extraction (before persisting)
 */
export interface ExtractedEvent {
  eventType: LearnableEventType;
  category?: string;
  originalText: string;
  eventSummary: string;
  actionText: string;
  outcome: LearnableEventOutcome;
  confidence: number;
  conditionsSpecific: boolean;
  relevantConditions: Partial<ConditionsContext>;
}

/**
 * Result of AI extraction
 */
export interface ExtractionResult {
  events: ExtractedEvent[];
  extractionNotes?: string;
}

// ============================================
// Personalized Nudge Set
// ============================================

/**
 * A personalized nudge ready for display
 */
export interface PersonalizedNudge {
  id: string;
  learnableEventId: string;
  title: string;
  message: string;
  actionText: string;
  category: LearnableEventType;
  matchScore: number; // 0-1 how well this matches current context
  matchReasons: string[];
  sourceRaceDate?: string;
  outcome: LearnableEventOutcome;
  isNew: boolean; // First time showing this nudge
}

/**
 * Set of personalized nudges for a race
 */
export interface PersonalizedNudgeSet {
  sailorId: string;
  raceEventId: string;

  // Grouped nudges by display context
  checklistAdditions: PersonalizedNudge[];
  venueInsights: PersonalizedNudge[];
  conditionsInsights: PersonalizedNudge[];
  reminders: PersonalizedNudge[];

  // Stats
  totalCount: number;
  highPriorityCount: number;

  // Generation metadata
  generatedAt: string;
  conditionsSnapshot?: {
    windSpeed?: number;
    windDirection?: number;
    venue?: string;
  };
}

// ============================================
// Learning Insights
// ============================================

/**
 * Summary of learnings for a sailor
 */
export interface LearningInsights {
  sailorId: string;

  // Aggregations
  totalEvents: number;
  positiveEvents: number;
  negativeEvents: number;

  // Category breakdown
  byCategory: {
    category: LearnableEventType;
    count: number;
    recentExample?: string;
  }[];

  // Venue breakdown
  byVenue: {
    venueId: string;
    venueName: string;
    tipsCount: number;
    topTip?: string;
  }[];

  // Effectiveness summary
  nudgeEffectiveness: {
    totalDelivered: number;
    acknowledgedRate: number;
    actionRate: number;
    averageOutcome: number | null;
  };

  // Trends
  eventsLast30Days: number;
  improvementTrend: 'improving' | 'stable' | 'declining';
}

// ============================================
// Database Row Types
// ============================================

/**
 * Database row type for learnable_events table
 */
export interface LearnableEventRow {
  id: string;
  sailor_id: string;
  race_event_id: string | null;
  regatta_id: string | null;
  venue_id: string | null;
  event_type: LearnableEventType;
  phase: RacePhase | null;
  category: string | null;
  original_text: string;
  title: string;
  action_text: string;
  outcome: LearnableEventOutcome | null;
  impact_rating: number | null;
  conditions_context: ConditionsContext;
  ai_extracted: boolean;
  ai_confidence: number | null;
  sailor_confirmed: boolean;
  nudge_eligible: boolean;
  times_surfaced: number;
  last_surfaced_at: string | null;
  dismissed: boolean;
  dismissed_at: string | null;
  effectiveness_rating: number | null;
  event_date: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Database row type for nudge_deliveries table
 */
export interface NudgeDeliveryRow {
  id: string;
  learnable_event_id: string;
  sailor_id: string;
  race_event_id: string | null;
  delivered_at: string;
  delivery_channel: NudgeDeliveryChannel;
  acknowledged: boolean | null;
  acknowledged_at: string | null;
  action_taken: boolean | null;
  action_taken_at: string | null;
  outcome_rating: number | null;
  outcome_notes: string | null;
  issue_recurred: boolean | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Type Mappers
// ============================================

/**
 * Convert database row to LearnableEvent
 */
export function mapRowToLearnableEvent(row: LearnableEventRow): LearnableEvent {
  return {
    id: row.id,
    sailorId: row.sailor_id,
    raceEventId: row.race_event_id || undefined,
    regattaId: row.regatta_id || undefined,
    venueId: row.venue_id || undefined,
    eventType: row.event_type,
    phase: row.phase || undefined,
    category: row.category as ChecklistCategory | undefined,
    originalText: row.original_text,
    title: row.title,
    actionText: row.action_text,
    outcome: row.outcome || 'neutral',
    impactRating: row.impact_rating || undefined,
    conditionsContext: row.conditions_context || {},
    aiExtracted: row.ai_extracted,
    aiConfidence: row.ai_confidence || undefined,
    sailorConfirmed: row.sailor_confirmed,
    nudgeEligible: row.nudge_eligible,
    timesSurfaced: row.times_surfaced,
    lastSurfacedAt: row.last_surfaced_at || undefined,
    dismissed: row.dismissed,
    dismissedAt: row.dismissed_at || undefined,
    effectivenessRating: row.effectiveness_rating || undefined,
    eventDate: row.event_date || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert database row to NudgeDelivery
 */
export function mapRowToNudgeDelivery(row: NudgeDeliveryRow): NudgeDelivery {
  return {
    id: row.id,
    learnableEventId: row.learnable_event_id,
    sailorId: row.sailor_id,
    raceEventId: row.race_event_id || undefined,
    deliveredAt: row.delivered_at,
    deliveryChannel: row.delivery_channel,
    acknowledged: row.acknowledged || undefined,
    acknowledgedAt: row.acknowledged_at || undefined,
    actionTaken: row.action_taken || undefined,
    actionTakenAt: row.action_taken_at || undefined,
    outcomeRating: row.outcome_rating || undefined,
    outcomeNotes: row.outcome_notes || undefined,
    issueRecurred: row.issue_recurred || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ============================================
// Utility Types
// ============================================

/**
 * Options for querying learnable events
 */
export interface GetLearnableEventsOptions {
  sailorId: string;
  raceEventId?: string;
  venueId?: string;
  eventType?: LearnableEventType;
  phase?: RacePhase;
  nudgeEligibleOnly?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Options for generating personalized nudges
 */
export interface GenerateNudgesOptions {
  sailorId: string;
  raceEventId: string;
  venueId?: string;
  forecast?: {
    windSpeed: number;
    windDirection: number;
  };
  boatClassId?: string;
  raceType?: 'fleet' | 'team' | 'match' | 'distance';
  limit?: number;
}

/**
 * Nudge matching score calculation input
 */
export interface NudgeMatchInput {
  event: LearnableEvent;
  context: {
    venueId?: string;
    windSpeed?: number;
    windDirection?: number;
    boatClassId?: string;
    raceType?: string;
  };
}

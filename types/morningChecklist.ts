/**
 * Morning Checklist Types
 *
 * Types for the morning checklist tools with pre-race intentions,
 * recommendations, and post-race feedback for AI learning loop.
 */

import type { RaceTuningSetting } from '@/services/RaceTuningService';
import type { ForecastSnapshot, ForecastAnalysis, SailInventoryItem } from './raceIntentions';

// =============================================================================
// SAIL RECOMMENDATIONS
// =============================================================================

/**
 * AI-generated sail recommendation with reasoning
 */
export interface SailRecommendation {
  /** Sail ID from boat_equipment */
  sailId: string;
  /** Sail display name */
  sailName: string;
  /** Sail category */
  category: 'mainsail' | 'jib' | 'genoa' | 'spinnaker' | 'code_zero';
  /** Confidence score 0-100 */
  confidence: number;
  /** Why this sail is recommended */
  reasoning: string;
  /** Wind range this is optimal for */
  windRange: string;
  /** Current condition of sail (0-100) */
  conditionRating?: number;
  /** Alternative option if this sail isn't available */
  alternative?: {
    sailId: string;
    sailName: string;
    reason: string;
  };
}

/**
 * Complete sail selection recommendation set
 */
export interface SailSelectionRecommendations {
  /** Recommended mainsail */
  mainsail?: SailRecommendation;
  /** Recommended headsail (jib/genoa) */
  headsail?: SailRecommendation;
  /** Recommended spinnaker/downwind sail */
  downwind?: SailRecommendation;
  /** Overall reasoning for the combination */
  combinationReasoning: string;
  /** Conditions this selection is optimized for */
  conditionsSummary: string;
  /** Generated at timestamp */
  generatedAt: string;
}

// =============================================================================
// TACTICAL RECOMMENDATIONS
// =============================================================================

/**
 * Pre-race tactical recommendation
 */
export interface TacticalRecommendation {
  /** Category of tactical advice */
  category: 'start' | 'upwind' | 'mark_rounding' | 'downwind' | 'finish' | 'general';
  /** The recommendation itself */
  recommendation: string;
  /** Reasoning behind this recommendation */
  reasoning: string;
  /** Based on venue history, conditions, or learning */
  source: 'venue_history' | 'conditions' | 'learning' | 'general';
  /** Confidence score 0-100 */
  confidence: number;
  /** Related past performance if from learning */
  pastPerformanceContext?: string;
}

/**
 * Complete tactical briefing
 */
export interface TacticalBriefing {
  /** Venue-specific insights */
  venueInsights: TacticalRecommendation[];
  /** Conditions-based recommendations */
  conditionsInsights: TacticalRecommendation[];
  /** Learning-based personal recommendations */
  learningInsights: TacticalRecommendation[];
  /** Key decisions to make before the start */
  keyDecisions: string[];
  /** Generated at timestamp */
  generatedAt: string;
}

// =============================================================================
// MORNING CHECKLIST PRE-RACE INTENTIONS
// =============================================================================

/**
 * Pre-race forecast intention with user notes
 */
export interface ForecastCheckIntention {
  /** Current forecast snapshot */
  snapshot: ForecastSnapshot;
  /** AI analysis if comparing to previous */
  analysis?: ForecastAnalysis;
  /** User's notes about the forecast */
  userNotes: string;
  /** What approach user plans to take based on forecast */
  plannedApproach: string;
  /** Checked at timestamp */
  checkedAt: string;
}

/**
 * Pre-race rig tuning intention with user notes
 */
export interface RigTuningIntention {
  /** AI-generated recommendations */
  recommendations: RaceTuningSetting[];
  /** Conditions this was generated for */
  conditionsSummary: string;
  /** User's notes about rig setup */
  userNotes: string;
  /** What settings user actually plans to use (key -> value) */
  plannedSettings: Record<string, string>;
  /** Past performance insight for similar conditions */
  pastPerformanceNote?: string;
  /** Saved at timestamp */
  savedAt: string;
}

/**
 * Pre-race sail selection intention with user notes
 */
export interface SailSelectionIntention {
  /** AI-generated recommendations */
  recommendations: SailSelectionRecommendations;
  /** Sails user actually selected (IDs) */
  selectedSails: {
    mainsailId?: string;
    headsailId?: string;
    downwindId?: string;
  };
  /** User's notes about sail selection */
  userNotes: string;
  /** Saved at timestamp */
  savedAt: string;
}

/**
 * Pre-race tactical intention with user notes
 */
export interface TacticalIntention {
  /** AI-generated tactical briefing */
  briefing: TacticalBriefing;
  /** User's notes from crew discussion */
  userNotes: string;
  /** Key decisions crew agreed on */
  agreedDecisions: string[];
  /** Saved at timestamp */
  savedAt: string;
}

/**
 * Complete morning checklist intentions
 * Stored in sailor_race_preparation table
 */
export interface MorningChecklistIntentions {
  /** Race event ID */
  raceEventId: string;
  /** Forecast check intention */
  forecast?: ForecastCheckIntention;
  /** Rig tuning intention */
  rigTuning?: RigTuningIntention;
  /** Sail selection intention */
  sailSelection?: SailSelectionIntention;
  /** Tactical review intention */
  tactics?: TacticalIntention;
  /** Last updated timestamp */
  updatedAt: string;
}

// =============================================================================
// POST-RACE FEEDBACK FOR LEARNING
// =============================================================================

/**
 * Post-race feedback for a single morning checklist item
 */
export interface ChecklistItemFeedback {
  /** How effective was the recommendation/decision? 1-5 */
  effectiveness: number;
  /** What worked well */
  whatWorked: string;
  /** What to change next time */
  whatToChange: string;
  /** Any additional notes */
  notes?: string;
}

/**
 * Complete post-race feedback for morning checklist
 */
export interface MorningChecklistFeedback {
  /** Race event ID */
  raceEventId: string;
  /** Feedback on forecast accuracy and decisions */
  forecast?: ChecklistItemFeedback & {
    /** How accurate was the forecast? 1-5 */
    forecastAccuracy: number;
  };
  /** Feedback on rig tuning */
  rigTuning?: ChecklistItemFeedback;
  /** Feedback on sail selection */
  sailSelection?: ChecklistItemFeedback;
  /** Feedback on tactical decisions */
  tactics?: ChecklistItemFeedback;
  /** Overall morning prep effectiveness 1-5 */
  overallRating: number;
  /** Overall notes */
  overallNotes?: string;
  /** Submitted at timestamp */
  submittedAt: string;
}

// =============================================================================
// WIZARD PROPS
// =============================================================================

/**
 * Common props for morning checklist wizards
 */
export interface MorningChecklistWizardProps {
  /** Race event ID */
  raceEventId: string;
  /** Race name for display */
  raceName?: string;
  /** Boat ID for equipment context */
  boatId?: string;
  /** Current wind conditions */
  wind?: {
    direction: string;
    speedMin: number;
    speedMax: number;
  };
  /** Current tide conditions */
  tide?: {
    state: string;
    height?: number;
  };
  /** Venue ID for venue-specific insights */
  venueId?: string;
  /** Called when wizard completes with saved intention */
  onComplete: () => void;
  /** Called when wizard is cancelled */
  onCancel: () => void;
}

/**
 * Props for forecast check wizard
 */
export interface ForecastCheckWizardProps extends MorningChecklistWizardProps {
  /** Existing forecast intention to edit */
  existingIntention?: ForecastCheckIntention;
}

/**
 * Props for rig tuning wizard
 */
export interface RigTuningWizardProps extends MorningChecklistWizardProps {
  /** Boat class for tuning recommendations */
  boatClass?: string;
  /** Existing rig intention to edit */
  existingIntention?: RigTuningIntention;
}

/**
 * Props for sail selection wizard
 */
export interface SailSelectionWizardProps extends MorningChecklistWizardProps {
  /** Available sails from boat inventory */
  availableSails?: SailInventoryItem[];
  /** Existing sail intention to edit */
  existingIntention?: SailSelectionIntention;
}

/**
 * Props for tactical review wizard
 */
export interface TacticalReviewWizardProps extends MorningChecklistWizardProps {
  /** Existing tactical intention to edit */
  existingIntention?: TacticalIntention;
}

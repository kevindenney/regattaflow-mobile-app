/**
 * Race Intentions Types
 *
 * Types for structured user intentions across all detail cards.
 * Enables sailors to declare their race preparation plans in a structured way.
 */

import type { WatchSchedule } from './watchSchedule';

/**
 * Arrival time intention for the Race Card
 */
export interface ArrivalTimeIntention {
  /** ISO timestamp for planned arrival at the start area */
  plannedArrival: string;
  /** Free-form notes about arrival approach */
  notes?: string;
  /** Minutes before warning signal */
  minutesBefore?: number;
}

/**
 * Sail selection intention for the Conditions Card
 * Equipment IDs reference the boat_equipment table
 */
export interface SailSelectionIntention {
  /** Selected mainsail equipment_id */
  mainsail?: string;
  /** Selected mainsail display name */
  mainsailName?: string;
  /** Selected jib/genoa equipment_id */
  jib?: string;
  /** Selected jib/genoa display name */
  jibName?: string;
  /** Selected spinnaker equipment_id */
  spinnaker?: string;
  /** Selected spinnaker display name */
  spinnakerName?: string;
  /** Free-form notes about sail selection rationale */
  notes?: string;
  /** Wind range this selection is optimized for */
  windRangeContext?: string;
}

/**
 * Status for individual rig setting intentions
 */
export type RigIntentionStatus = 'default' | 'adjusted' | 'monitoring';

/**
 * Individual rig setting intention
 */
export interface RigSettingIntention {
  /** Status of this setting: default (use recommended), adjusted (custom), or monitoring */
  status: RigIntentionStatus;
  /** Custom value if status is 'adjusted' */
  value?: string;
  /** Notes about this specific setting */
  notes?: string;
}

/**
 * Rig intentions for the Rig Card
 * Keys are rig setting keys (e.g., 'upper_shrouds', 'mast_rake', etc.)
 */
export interface RigIntentions {
  /** Map of setting key to intention */
  settings: Record<string, RigSettingIntention>;
  /** Overall notes about rig setup approach */
  overallNotes?: string;
}

/**
 * Course selection intention for the Course Card
 */
export interface CourseSelectionIntention {
  /** Selected course ID if from structured data */
  selectedCourseId?: string;
  /** Selected course name/label */
  selectedCourseName?: string;
  /** Course sequence (e.g., "Start - A - C - A - Finish") */
  selectedCourseSequence?: string;
  /** Whether this was identified from Sailing Instructions */
  identifiedFromSI?: boolean;
  /** Free-form notes about course understanding */
  notes?: string;
  /** Confirmed user has reviewed/understood the course */
  confirmed?: boolean;
}

/**
 * Strategy notes stored by section ID
 * Used by the new template-based strategy cards
 */
export type StrategyNotes = Record<string, string>;

/**
 * Complete race intentions structure
 * Stored in sailor_race_preparation.user_intentions JSONB column
 */
export interface RaceIntentions {
  /** Race Card - arrival time intention */
  arrivalTime?: ArrivalTimeIntention;

  /** Conditions Card - sail selection from boat inventory */
  sailSelection?: SailSelectionIntention;

  /** Rig Card - per-item intentions for rig settings */
  rigIntentions?: RigIntentions;

  /** Course Card - course identification from SI */
  courseSelection?: CourseSelectionIntention;

  /** Strategy Cards - per-section user notes (keyed by section ID) */
  strategyNotes?: StrategyNotes;

  /** Watch Schedule - crew watch rotation for distance races */
  watchSchedule?: WatchSchedule;

  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Partial update type for individual intention updates
 */
export type RaceIntentionUpdate = Partial<Omit<RaceIntentions, 'updatedAt'>>;

/**
 * Sail inventory item from boat_equipment
 */
export interface SailInventoryItem {
  id: string;
  customName?: string;
  category: 'mainsail' | 'jib' | 'genoa' | 'spinnaker' | 'code_zero';
  manufacturer?: string;
  model?: string;
  conditionRating?: number;
  status: 'active' | 'backup' | 'retired' | 'sold';
  totalRacesUsed?: number;
  lastUsedDate?: string;
}

/**
 * Grouped sail inventory by category
 */
export interface GroupedSailInventory {
  mainsails: SailInventoryItem[];
  jibs: SailInventoryItem[];
  genoas: SailInventoryItem[];
  spinnakers: SailInventoryItem[];
  codeZeros: SailInventoryItem[];
}

/**
 * Default empty intentions object
 */
export const DEFAULT_RACE_INTENTIONS: RaceIntentions = {
  updatedAt: new Date().toISOString(),
};

/**
 * Helper to create a new intentions object with current timestamp
 */
export function createRaceIntentions(
  partial?: RaceIntentionUpdate
): RaceIntentions {
  return {
    ...partial,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Helper to merge intention updates
 */
export function mergeRaceIntentions(
  existing: RaceIntentions | undefined,
  update: RaceIntentionUpdate
): RaceIntentions {
  return {
    ...existing,
    ...update,
    updatedAt: new Date().toISOString(),
  };
}

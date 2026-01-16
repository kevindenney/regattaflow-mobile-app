/**
 * Checklist Types
 *
 * Type definitions for race-type-specific checklists
 * Used across Before, Morning, Racing, and After phases
 */

import { RaceType } from './raceEvents';

/**
 * Race phases for temporal checklist management
 */
export type RacePhase = 'days_before' | 'race_morning' | 'on_water' | 'after_race';

/**
 * Checklist categories for grouping items
 */
export type ChecklistCategory =
  | 'equipment'
  | 'crew'
  | 'logistics'
  | 'safety'
  | 'navigation'        // Distance racing
  | 'tactics'           // Match/Team racing
  | 'team_coordination' // Team racing
  | 'rules'             // Match racing
  | 'weather'           // All types
  | 'morning'           // Race morning general
  | 'on_water'          // On water checks
  | 'documents'         // Race documents (NOR, SI, Course)
  | 'strategy';         // Strategy brief checklist

/**
 * Priority level for checklist items
 */
export type ChecklistPriority = 'high' | 'medium' | 'low';

/**
 * Tool types for checklist items
 * - full_wizard: Multi-step with photos/AI (like SailInspectionWizard)
 * - interactive: Expandable sub-items checklist
 * - quick_tips: Simple panel with tips/guidance
 * - none: No dedicated tool (just checkbox toggle)
 */
export type ChecklistToolType = 'full_wizard' | 'interactive' | 'quick_tips' | 'none';

/**
 * Individual checklist item definition
 */
export interface ChecklistItem {
  id: string;
  label: string;
  priority?: ChecklistPriority;
  description?: string;           // Tooltip/help text
  raceTypes: RaceType[];          // Which race types include this item
  phase: RacePhase;
  category: ChecklistCategory;

  // Tool integration
  toolId?: string;                // Identifier for tool component lookup
  toolType?: ChecklistToolType;   // Type of tool to render
  toolConfig?: Record<string, unknown>;  // Tool-specific configuration

  // Learning module links
  learningModuleId?: string;      // Specific lesson ID for deep link
  learningModuleSlug?: string;    // Course slug for navigation
  quickTips?: string[];           // Inline tips shown in tool panel
}

/**
 * Completed item with metadata
 * Used for tracking who completed what and when
 */
export interface ChecklistCompletion {
  itemId: string;
  completedAt: string;            // ISO timestamp
  completedBy: string;            // user_id
  completedByName?: string;       // Display name (for team racing)
  notes?: string;                 // Optional notes
}

/**
 * Full checklist state for a race
 * Maps item IDs to their completion status
 */
export interface RaceChecklistState {
  raceEventId: string;
  completions: Record<string, ChecklistCompletion>;
  updatedAt: string;
}

/**
 * Team checklist state (for shared team racing entries)
 * Same as RaceChecklistState but tied to a team entry
 */
export interface TeamChecklistState {
  teamEntryId: string;
  checklistState: Record<string, ChecklistCompletion>;
  updatedAt: string;
}

/**
 * Category display configuration
 */
export interface CategoryConfig {
  id: ChecklistCategory;
  label: string;
  icon: string;       // Icon name from lucide-react-native
  color: string;      // iOS system color
}

/**
 * Category configurations for display
 */
export const CATEGORY_CONFIG: Record<ChecklistCategory, CategoryConfig> = {
  equipment: {
    id: 'equipment',
    label: 'EQUIPMENT',
    icon: 'Wrench',
    color: '#FF9500', // iOS orange
  },
  crew: {
    id: 'crew',
    label: 'CREW',
    icon: 'Users',
    color: '#007AFF', // iOS blue
  },
  logistics: {
    id: 'logistics',
    label: 'LOGISTICS',
    icon: 'Car',
    color: '#34C759', // iOS green
  },
  safety: {
    id: 'safety',
    label: 'SAFETY',
    icon: 'Shield',
    color: '#FF3B30', // iOS red
  },
  navigation: {
    id: 'navigation',
    label: 'NAVIGATION',
    icon: 'Compass',
    color: '#5856D6', // iOS purple
  },
  tactics: {
    id: 'tactics',
    label: 'TACTICS',
    icon: 'Target',
    color: '#FF2D55', // iOS pink
  },
  team_coordination: {
    id: 'team_coordination',
    label: 'TEAM',
    icon: 'Users',
    color: '#0D9488', // Teal (team racing color)
  },
  rules: {
    id: 'rules',
    label: 'RULES',
    icon: 'BookOpen',
    color: '#AF52DE', // iOS purple
  },
  weather: {
    id: 'weather',
    label: 'WEATHER',
    icon: 'CloudSun',
    color: '#007AFF', // iOS blue
  },
  morning: {
    id: 'morning',
    label: 'MORNING',
    icon: 'Sun',
    color: '#FF9500', // iOS orange
  },
  on_water: {
    id: 'on_water',
    label: 'ON WATER',
    icon: 'Waves',
    color: '#007AFF', // iOS blue
  },
  documents: {
    id: 'documents',
    label: 'DOCUMENTS',
    icon: 'FileText',
    color: '#5856D6', // iOS purple
  },
  strategy: {
    id: 'strategy',
    label: 'STRATEGY',
    icon: 'Target',
    color: '#FF2D55', // iOS pink
  },
};

/**
 * Phase labels for display
 */
export const PHASE_LABELS: Record<RacePhase, string> = {
  days_before: 'Days Before',
  race_morning: 'Race Morning',
  on_water: 'On Water',
  after_race: 'After Race',
};

export const PHASE_SHORT_LABELS: Record<RacePhase, string> = {
  days_before: 'Before',
  race_morning: 'Morning',
  on_water: 'Racing',
  after_race: 'After',
};

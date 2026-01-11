/**
 * Race Card Content Module System - Type Definitions
 *
 * Defines the types for the expandable race card's dynamic content modules.
 * Content modules are phase-aware and race-type-aware, with user customization.
 */

import { RacePhase } from '@/components/cards/types';

// =============================================================================
// RACE TYPES
// =============================================================================

/**
 * Race types that affect which modules are available
 */
export type RaceType = 'fleet' | 'match' | 'team' | 'distance';

// =============================================================================
// CONTENT MODULE IDS
// =============================================================================

/**
 * All available content module identifiers
 */
export type ContentModuleId =
  // Core modules (available for most phases/types)
  | 'conditions'
  | 'strategy'
  | 'rig_setup'
  | 'course'
  | 'fleet_analysis'
  | 'regulatory'
  | 'checklist'
  // Specialized modules
  | 'start_sequence'
  | 'tide_currents'
  | 'competitor_notes'
  // Race-type specific modules
  | 'team_assignments' // team racing
  | 'match_opponent' // match racing
  | 'distance_waypoints' // distance/offshore racing
  // Post-race modules
  | 'results_preview'
  | 'learning_notes'
  // Sharing modules
  | 'share_with_team'; // pre-race sharing with coach/crew

/**
 * Module display metadata
 */
export interface ContentModuleInfo {
  id: ContentModuleId;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
}

/**
 * All module metadata for display and configuration
 */
export const CONTENT_MODULE_INFO: Record<ContentModuleId, ContentModuleInfo> = {
  conditions: {
    id: 'conditions',
    label: 'Conditions',
    shortLabel: 'Wx',
    icon: 'weather-partly-cloudy',
    description: 'Wind, waves, and weather forecast',
  },
  strategy: {
    id: 'strategy',
    label: 'Strategy',
    shortLabel: 'Strategy',
    icon: 'compass-outline',
    description: 'Race strategy recommendations',
  },
  rig_setup: {
    id: 'rig_setup',
    label: 'Rig Setup',
    shortLabel: 'Rig',
    icon: 'tune-vertical',
    description: 'Tuning and rig settings for conditions',
  },
  course: {
    id: 'course',
    label: 'Course',
    shortLabel: 'Course',
    icon: 'map-marker-path',
    description: 'Course layout, marks, and distances',
  },
  fleet_analysis: {
    id: 'fleet_analysis',
    label: 'Fleet Analysis',
    shortLabel: 'Fleet',
    icon: 'sail-boat',
    description: 'Fleet composition and competitor insights',
  },
  regulatory: {
    id: 'regulatory',
    label: 'Regulatory',
    shortLabel: 'Rules',
    icon: 'file-document-outline',
    description: 'Sailing instructions and notices',
  },
  checklist: {
    id: 'checklist',
    label: 'Checklist',
    shortLabel: 'Tasks',
    icon: 'checkbox-marked-outline',
    description: 'Pre-race preparation checklist',
  },
  start_sequence: {
    id: 'start_sequence',
    label: 'Start Sequence',
    shortLabel: 'Start',
    icon: 'flag-checkered',
    description: 'Starting sequence and signals',
  },
  tide_currents: {
    id: 'tide_currents',
    label: 'Tides & Currents',
    shortLabel: 'Tides',
    icon: 'waves',
    description: 'Tidal state and current predictions',
  },
  competitor_notes: {
    id: 'competitor_notes',
    label: 'Competitor Notes',
    shortLabel: 'Notes',
    icon: 'account-group-outline',
    description: 'Notes on key competitors',
  },
  team_assignments: {
    id: 'team_assignments',
    label: 'Team Assignments',
    shortLabel: 'Team',
    icon: 'account-multiple',
    description: 'Team positions and pairing assignments',
  },
  match_opponent: {
    id: 'match_opponent',
    label: 'Opponent Analysis',
    shortLabel: 'Opponent',
    icon: 'sword-cross',
    description: 'Match racing opponent analysis',
  },
  distance_waypoints: {
    id: 'distance_waypoints',
    label: 'Waypoints',
    shortLabel: 'Waypoints',
    icon: 'map-marker-multiple',
    description: 'Distance race waypoints and routing',
  },
  results_preview: {
    id: 'results_preview',
    label: 'Results',
    shortLabel: 'Results',
    icon: 'podium',
    description: 'Race results and standings',
  },
  learning_notes: {
    id: 'learning_notes',
    label: 'Learning Notes',
    shortLabel: 'Learn',
    icon: 'lightbulb-outline',
    description: 'Post-race learnings and takeaways',
  },
  share_with_team: {
    id: 'share_with_team',
    label: 'Share with Team',
    shortLabel: 'Team',
    icon: 'share-variant',
    description: 'Share race prep with coach and crew',
  },
};

// =============================================================================
// PHASE MODULE CONFIGURATION
// =============================================================================

/**
 * Configuration for which modules are available/default per phase
 */
export interface PhaseModuleConfig {
  phase: RacePhase;
  /** All modules that can be shown in this phase */
  availableModules: ContentModuleId[];
  /** Modules shown by default (user can customize) */
  defaultModules: ContentModuleId[];
  /** Maximum modules to show (for performance/UX) */
  maxModules: number;
}

// =============================================================================
// RACE TYPE MODULE CONFIGURATION
// =============================================================================

/**
 * Configuration for race-type-specific module adjustments
 */
export interface RaceTypeModuleConfig {
  raceType: RaceType;
  /** Additional modules specific to this race type */
  additionalModules: ContentModuleId[];
  /** Modules not relevant for this race type */
  excludedModules: ContentModuleId[];
  /** Module label overrides for this race type */
  labelOverrides?: Partial<Record<ContentModuleId, string>>;
}

// =============================================================================
// USER PREFERENCES
// =============================================================================

/**
 * User's preferences for content module display
 */
export interface ContentModulePreferences {
  /** User ID */
  userId: string;
  /** Specific race ID (null for type-level defaults) */
  raceId?: string | null;
  /** Race type these preferences apply to (when raceId is null) */
  raceType?: RaceType | null;
  /** Ordered list of modules to show */
  moduleOrder: ContentModuleId[];
  /** Modules that should be collapsed by default */
  collapsedModules: ContentModuleId[];
  /** Modules that are hidden (not shown at all) */
  hiddenModules: ContentModuleId[];
  /** Last updated timestamp */
  updatedAt: string;
}

/**
 * Default preferences (used when no user preferences exist)
 */
export const DEFAULT_CONTENT_PREFERENCES: Omit<ContentModulePreferences, 'userId'> = {
  raceId: null,
  raceType: null,
  moduleOrder: [],
  collapsedModules: [],
  hiddenModules: [],
  updatedAt: new Date().toISOString(),
};

// =============================================================================
// MODULE COMPONENT PROPS
// =============================================================================

/**
 * Props passed to individual content module components
 */
export interface ContentModuleProps<TRace = unknown> {
  /** Race data */
  race: TRace;
  /** Current phase */
  phase: RacePhase;
  /** Race type */
  raceType: RaceType;
  /** Whether this module is collapsed */
  isCollapsed: boolean;
  /** Callback to toggle collapse state */
  onToggleCollapse: () => void;
  /** Available height hint (for layout optimization) */
  containerHeight?: number;
  /** Whether this module is in compact mode (embedded in card) */
  variant?: 'default' | 'compact';
}

// =============================================================================
// MODULE HEIGHT CONFIGURATION
// =============================================================================

/**
 * Height constraints for content modules
 */
export interface ModuleHeightConfig {
  /** Collapsed height (title bar only) */
  collapsed: number;
  /** Minimum expanded height */
  minExpanded: number;
  /** Maximum expanded height */
  maxExpanded: number;
}

/**
 * Default height configurations per module
 */
export const MODULE_HEIGHT_CONFIG: Record<ContentModuleId, ModuleHeightConfig> = {
  conditions: { collapsed: 48, minExpanded: 120, maxExpanded: 200 },
  strategy: { collapsed: 48, minExpanded: 150, maxExpanded: 300 },
  rig_setup: { collapsed: 48, minExpanded: 100, maxExpanded: 180 },
  course: { collapsed: 48, minExpanded: 120, maxExpanded: 250 },
  fleet_analysis: { collapsed: 48, minExpanded: 100, maxExpanded: 200 },
  regulatory: { collapsed: 48, minExpanded: 80, maxExpanded: 150 },
  checklist: { collapsed: 48, minExpanded: 100, maxExpanded: 250 },
  start_sequence: { collapsed: 48, minExpanded: 80, maxExpanded: 150 },
  tide_currents: { collapsed: 48, minExpanded: 100, maxExpanded: 180 },
  competitor_notes: { collapsed: 48, minExpanded: 80, maxExpanded: 200 },
  team_assignments: { collapsed: 48, minExpanded: 100, maxExpanded: 200 },
  match_opponent: { collapsed: 48, minExpanded: 120, maxExpanded: 220 },
  distance_waypoints: { collapsed: 48, minExpanded: 120, maxExpanded: 250 },
  results_preview: { collapsed: 48, minExpanded: 100, maxExpanded: 200 },
  learning_notes: { collapsed: 48, minExpanded: 100, maxExpanded: 250 },
  share_with_team: { collapsed: 48, minExpanded: 100, maxExpanded: 180 },
};

// =============================================================================
// HOOK RETURN TYPES
// =============================================================================

/**
 * Return type for useContentModules hook
 */
export interface UseContentModulesReturn {
  /** Resolved list of modules to display */
  modules: ContentModuleId[];
  /** Set of collapsed module IDs */
  collapsedModules: Set<ContentModuleId>;
  /** Update module order */
  updateOrder: (newOrder: ContentModuleId[]) => void;
  /** Toggle collapse state for a module */
  toggleCollapse: (moduleId: ContentModuleId) => void;
  /** Hide a module */
  hideModule: (moduleId: ContentModuleId) => void;
  /** Show a hidden module */
  showModule: (moduleId: ContentModuleId) => void;
  /** Reset to default configuration */
  resetToDefaults: () => void;
  /** Whether preferences are loading */
  isLoading: boolean;
  /** All available modules for current phase/type */
  availableModules: ContentModuleId[];
  /** Hidden modules that can be shown */
  hiddenModules: ContentModuleId[];
}

/**
 * Return type for useContentPreferences hook
 */
export interface UseContentPreferencesReturn {
  /** Current preferences */
  preferences: ContentModulePreferences | null;
  /** Whether preferences are loading */
  isLoading: boolean;
  /** Save preferences */
  savePreferences: (prefs: Partial<ContentModulePreferences>) => Promise<void>;
  /** Load preferences */
  loadPreferences: () => Promise<ContentModulePreferences | null>;
  /** Reset to defaults */
  resetPreferences: () => Promise<void>;
}

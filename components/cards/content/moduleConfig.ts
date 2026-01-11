/**
 * Content Module Configuration
 *
 * Defines which content modules are available and shown by default
 * for each race phase and race type combination.
 */

import { RacePhase } from '@/components/cards/types';
import {
  ContentModuleId,
  PhaseModuleConfig,
  RaceType,
  RaceTypeModuleConfig,
} from '@/types/raceCardContent';

// =============================================================================
// PHASE MODULE CONFIGURATION
// =============================================================================

/**
 * Module configuration per race phase
 * Determines which modules are available and which are shown by default
 */
export const PHASE_MODULE_CONFIG: Record<RacePhase, PhaseModuleConfig> = {
  days_before: {
    phase: 'days_before',
    availableModules: [
      'conditions',
      'course',
      'fleet_analysis',
      'regulatory',
      'rig_setup',
      'checklist',
      'competitor_notes',
      'tide_currents',
      'share_with_team',
    ],
    defaultModules: ['conditions', 'course', 'checklist', 'share_with_team'],
    maxModules: 5,
  },

  race_morning: {
    phase: 'race_morning',
    availableModules: [
      'conditions',
      'strategy',
      'rig_setup',
      'course',
      'tide_currents',
      'start_sequence',
      'checklist',
      'fleet_analysis',
      'share_with_team',
    ],
    defaultModules: ['conditions', 'strategy', 'rig_setup', 'share_with_team'],
    maxModules: 5,
  },

  on_water: {
    phase: 'on_water',
    availableModules: [
      'conditions',
      'strategy',
      'tide_currents',
      'course',
      'start_sequence',
    ],
    defaultModules: ['conditions', 'strategy'],
    maxModules: 3, // Limited for on-water focus
  },

  after_race: {
    phase: 'after_race',
    availableModules: [
      'results_preview',
      'learning_notes',
      'conditions',
      'strategy',
      'competitor_notes',
      'fleet_analysis',
    ],
    defaultModules: ['results_preview', 'learning_notes'],
    maxModules: 4,
  },
};

// =============================================================================
// RACE TYPE MODULE CONFIGURATION
// =============================================================================

/**
 * Module adjustments per race type
 * Adds type-specific modules and excludes irrelevant ones
 */
export const RACE_TYPE_MODULE_CONFIG: Record<RaceType, RaceTypeModuleConfig> = {
  fleet: {
    raceType: 'fleet',
    additionalModules: [],
    excludedModules: ['team_assignments', 'match_opponent', 'distance_waypoints'],
    labelOverrides: {},
  },

  match: {
    raceType: 'match',
    additionalModules: ['match_opponent'],
    excludedModules: ['fleet_analysis', 'team_assignments', 'distance_waypoints'],
    labelOverrides: {
      strategy: 'Match Strategy',
      competitor_notes: 'Opponent Notes',
    },
  },

  team: {
    raceType: 'team',
    additionalModules: ['team_assignments'],
    excludedModules: ['match_opponent', 'distance_waypoints'],
    labelOverrides: {
      fleet_analysis: 'Team Analysis',
      strategy: 'Team Strategy',
    },
  },

  distance: {
    raceType: 'distance',
    additionalModules: ['distance_waypoints'],
    excludedModules: ['start_sequence', 'team_assignments', 'match_opponent'],
    labelOverrides: {
      conditions: 'Weather Outlook',
      course: 'Route',
      strategy: 'Passage Planning',
      rig_setup: 'Boat Prep',
      regulatory: 'Safety & Docs',
      checklist: 'Departure Checklist',
    },
  },
};

// =============================================================================
// MODULE RESOLUTION HELPERS
// =============================================================================

/**
 * Get the available modules for a given phase and race type
 */
export function getAvailableModules(
  phase: RacePhase,
  raceType: RaceType
): ContentModuleId[] {
  const phaseConfig = PHASE_MODULE_CONFIG[phase];
  const typeConfig = RACE_TYPE_MODULE_CONFIG[raceType];

  // Start with phase-available modules
  let modules = [...phaseConfig.availableModules];

  // Add type-specific modules
  for (const module of typeConfig.additionalModules) {
    if (!modules.includes(module)) {
      modules.push(module);
    }
  }

  // Remove excluded modules for this type
  modules = modules.filter((m) => !typeConfig.excludedModules.includes(m));

  return modules;
}

/**
 * Get the default modules for a given phase and race type
 */
export function getDefaultModules(
  phase: RacePhase,
  raceType: RaceType
): ContentModuleId[] {
  const phaseConfig = PHASE_MODULE_CONFIG[phase];
  const typeConfig = RACE_TYPE_MODULE_CONFIG[raceType];

  // Start with phase defaults
  let modules = [...phaseConfig.defaultModules];

  // Remove any defaults that are excluded for this type
  modules = modules.filter((m) => !typeConfig.excludedModules.includes(m));

  // Add type-specific module to defaults if relevant to this phase
  // (e.g., team_assignments for team races in days_before phase)
  const available = getAvailableModules(phase, raceType);
  for (const module of typeConfig.additionalModules) {
    if (available.includes(module) && !modules.includes(module)) {
      // Insert type-specific modules after first default
      modules.splice(1, 0, module);
    }
  }

  // Respect max modules limit
  return modules.slice(0, phaseConfig.maxModules);
}

/**
 * Get the label for a module, respecting race type overrides
 */
export function getModuleLabel(
  moduleId: ContentModuleId,
  raceType: RaceType
): string {
  const typeConfig = RACE_TYPE_MODULE_CONFIG[raceType];
  const override = typeConfig.labelOverrides?.[moduleId];

  if (override) {
    return override;
  }

  // Import would create circular dep, so use inline fallback map
  const defaultLabels: Record<ContentModuleId, string> = {
    conditions: 'Conditions',
    strategy: 'Strategy',
    rig_setup: 'Rig Setup',
    course: 'Course',
    fleet_analysis: 'Fleet Analysis',
    regulatory: 'Regulatory',
    checklist: 'Checklist',
    start_sequence: 'Start Sequence',
    tide_currents: 'Tides & Currents',
    competitor_notes: 'Competitor Notes',
    team_assignments: 'Team Assignments',
    match_opponent: 'Opponent Analysis',
    distance_waypoints: 'Waypoints',
    results_preview: 'Results',
    learning_notes: 'Learning Notes',
    share_with_team: 'Share with Team',
  };

  return defaultLabels[moduleId] || moduleId;
}

/**
 * Get max modules allowed for a phase
 */
export function getMaxModules(phase: RacePhase): number {
  return PHASE_MODULE_CONFIG[phase].maxModules;
}

/**
 * Check if a module is available for a phase/type combination
 */
export function isModuleAvailable(
  moduleId: ContentModuleId,
  phase: RacePhase,
  raceType: RaceType
): boolean {
  const available = getAvailableModules(phase, raceType);
  return available.includes(moduleId);
}

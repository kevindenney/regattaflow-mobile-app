/**
 * Strategy Module
 *
 * Race-type-specific strategy configuration and utilities.
 */

// Main config registry and utilities
export {
  getStrategyConfig,
  getStrategyPhasesAndSections,
  getSectionsForPhaseFromList,
  getSectionMetaFromList,
  hasDynamicSections,
  getRaceTypeLabel,
  getPhaseProgress,
  // Individual configs (for direct access if needed)
  FLEET_RACING_CONFIG,
  DISTANCE_RACING_CONFIG,
  MATCH_RACING_CONFIG,
  TEAM_RACING_CONFIG,
} from './strategyConfig';

// Section definitions
export { FLEET_PHASES, FLEET_SECTIONS } from './fleetSections';
export {
  DISTANCE_STATIC_PHASES,
  DISTANCE_STATIC_SECTIONS,
  generateDistanceLegSections,
} from './distanceSections';
export { MATCH_PHASES, MATCH_SECTIONS } from './matchSections';
export { TEAM_PHASES, TEAM_SECTIONS } from './teamSections';

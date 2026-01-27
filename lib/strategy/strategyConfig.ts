/**
 * Strategy Configuration Registry
 *
 * Central configuration for race-type-specific strategy sections.
 * Use getStrategyConfig() to get the appropriate configuration for a race type.
 */

import type {
  DistanceRaceData,
  PhaseInfo,
  RaceType,
  RaceTypeStrategyConfig,
  StrategySectionMeta,
} from '@/types/raceStrategy';

import { FLEET_RACING_CONFIG } from './fleetSections';
import { DISTANCE_RACING_CONFIG, generateDistanceLegSections } from './distanceSections';
import { MATCH_RACING_CONFIG } from './matchSections';
import { TEAM_RACING_CONFIG } from './teamSections';

// Re-export individual configs for direct access if needed
export { FLEET_RACING_CONFIG } from './fleetSections';
export { DISTANCE_RACING_CONFIG } from './distanceSections';
export { MATCH_RACING_CONFIG } from './matchSections';
export { TEAM_RACING_CONFIG } from './teamSections';

/**
 * Registry of all strategy configurations by race type
 */
const STRATEGY_CONFIG_REGISTRY: Record<RaceType, RaceTypeStrategyConfig> = {
  fleet: FLEET_RACING_CONFIG,
  distance: DISTANCE_RACING_CONFIG,
  match: MATCH_RACING_CONFIG,
  team: TEAM_RACING_CONFIG,
};

/**
 * Get strategy configuration for a specific race type
 *
 * @param raceType - The type of race
 * @returns The strategy configuration for that race type
 */
export function getStrategyConfig(raceType: RaceType): RaceTypeStrategyConfig {
  return STRATEGY_CONFIG_REGISTRY[raceType] || FLEET_RACING_CONFIG;
}

/**
 * Get all phases and sections for a race, including dynamic sections
 *
 * @param raceType - The type of race
 * @param raceData - Optional race data for generating dynamic sections (distance races)
 * @returns Object containing all phases and sections
 */
export function getStrategyPhasesAndSections(
  raceType: RaceType,
  raceData?: DistanceRaceData
): {
  phases: PhaseInfo[];
  sections: StrategySectionMeta[];
} {
  const config = getStrategyConfig(raceType);
  let phases = [...config.phases];
  let sections = [...config.staticSections];

  // Generate dynamic sections for distance races
  if (config.generateDynamicSections && raceData) {
    const dynamic = config.generateDynamicSections(raceData);
    phases = [...phases, ...dynamic.phases];
    sections = [...sections, ...dynamic.sections];
  }

  return { phases, sections };
}

/**
 * Get sections for a specific phase
 *
 * @param phase - The phase key
 * @param allSections - All sections to filter
 * @returns Sections belonging to that phase
 */
export function getSectionsForPhaseFromList(
  phase: string,
  allSections: StrategySectionMeta[]
): StrategySectionMeta[] {
  return allSections.filter((s) => s.phase === phase);
}

/**
 * Get section metadata by ID from a list of sections
 *
 * @param id - The section ID
 * @param allSections - All sections to search
 * @returns The section metadata or undefined
 */
export function getSectionMetaFromList(
  id: string,
  allSections: StrategySectionMeta[]
): StrategySectionMeta | undefined {
  return allSections.find((s) => s.id === id);
}

/**
 * Check if a race type supports dynamic sections
 *
 * @param raceType - The type of race
 * @returns True if the race type can have dynamic sections
 */
export function hasDynamicSections(raceType: RaceType): boolean {
  const config = getStrategyConfig(raceType);
  return !!config.generateDynamicSections;
}

/**
 * Get default race type label for display
 *
 * @param raceType - The type of race
 * @returns Human-readable label
 */
export function getRaceTypeLabel(raceType: RaceType): string {
  const labels: Record<RaceType, string> = {
    fleet: 'Fleet Racing',
    distance: 'Distance Racing',
    match: 'Match Racing',
    team: 'Team Racing',
  };
  return labels[raceType] || 'Fleet Racing';
}

/**
 * Utility to count planned sections
 *
 * @param phase - The phase key
 * @param sections - All sections
 * @param plans - Map of section ID to user plan text
 * @returns Object with total count and planned count
 */
export function getPhaseProgress(
  phase: string,
  sections: StrategySectionMeta[],
  plans: Record<string, string | undefined>
): { total: number; planned: number } {
  const phaseSections = getSectionsForPhaseFromList(phase, sections);
  const total = phaseSections.length;
  const planned = phaseSections.filter(
    (s) => plans[s.id] && plans[s.id]!.trim().length > 0
  ).length;
  return { total, planned };
}

/**
 * Central Learning Links Registry
 * Maps checklist items and wizard topics to their learning content
 * Unified lookup for any wizard or checklist
 */

import { getWeatherLearning, type WeatherLearning } from './weather-learning';
import { getTacticsLearning, type TacticsLearning } from './tactics-learning';
import { getEquipmentLearning, type EquipmentLearning } from './equipment-learning';
import { getRulesLearning, type RulesLearning } from './rules-learning';
import { getCrewLearning, type CrewLearning } from './crew-learning';
import { getSettingLearning, type SettingLearning } from './rig-setting-learning';

// Union type for all learning content types
export type LearningContent =
  | WeatherLearning
  | TacticsLearning
  | EquipmentLearning
  | RulesLearning
  | CrewLearning
  | SettingLearning;

// Category type for learning content
export type LearningCategory =
  | 'weather'
  | 'tactics'
  | 'equipment'
  | 'rules'
  | 'crew'
  | 'rig';

/**
 * Mapping from common checklist item keys to their learning category, lookup key, and lesson ID
 */
export const CHECKLIST_LEARNING_MAP: Record<string, { category: LearningCategory; key: string; lessonId?: string }> = {
  // Weather checklist items → Race Preparation Mastery Module 1
  'check_forecast': { category: 'weather', key: 'weather_window', lessonId: 'lesson-13-1-1' },
  'check_weather_forecast': { category: 'weather', key: 'weather_window', lessonId: 'lesson-13-1-1' },
  'wind_forecast': { category: 'weather', key: 'wind_speed', lessonId: 'lesson-13-1-1' },
  'wind_direction': { category: 'weather', key: 'wind_direction', lessonId: 'lesson-13-1-3' },
  'current_check': { category: 'weather', key: 'current_speed', lessonId: 'lesson-13-1-2' },
  'tide_times': { category: 'weather', key: 'current_direction', lessonId: 'lesson-13-1-2' },
  'wave_conditions': { category: 'weather', key: 'wave_height', lessonId: 'lesson-13-1-1' },
  'swell_check': { category: 'weather', key: 'swell_direction', lessonId: 'lesson-13-1-1' },
  'pressure_trend': { category: 'weather', key: 'pressure_trend', lessonId: 'lesson-13-1-1' },
  'cloud_cover': { category: 'weather', key: 'cloud_cover', lessonId: 'lesson-13-1-1' },
  'visibility': { category: 'weather', key: 'visibility', lessonId: 'lesson-13-1-1' },
  'sea_breeze': { category: 'weather', key: 'sea_breeze', lessonId: 'lesson-13-1-3' },
  'geographic_effects': { category: 'weather', key: 'geographic_effects', lessonId: 'lesson-13-1-3' },
  'temperature': { category: 'weather', key: 'temperature', lessonId: 'lesson-13-1-1' },

  // Tactics checklist items → Race Preparation Mastery Module 2
  'start_line_bias': { category: 'tactics', key: 'start_line_bias', lessonId: 'lesson-13-2-2' },
  'favored_end': { category: 'tactics', key: 'favored_end', lessonId: 'lesson-13-2-2' },
  'laylines': { category: 'tactics', key: 'laylines', lessonId: 'lesson-13-2-1' },
  'wind_shifts': { category: 'tactics', key: 'wind_shifts', lessonId: 'lesson-13-1-3' },
  'fleet_positioning': { category: 'tactics', key: 'fleet_positioning', lessonId: 'lesson-13-2-2' },
  'clear_air': { category: 'tactics', key: 'clear_air', lessonId: 'lesson-13-2-2' },
  'mark_rounding': { category: 'tactics', key: 'mark_rounding', lessonId: 'lesson-13-2-3' },
  'upwind_strategy': { category: 'tactics', key: 'upwind_strategy', lessonId: 'lesson-13-2-1' },
  'downwind_strategy': { category: 'tactics', key: 'downwind_strategy', lessonId: 'lesson-13-2-1' },
  'course_sides': { category: 'tactics', key: 'course_sides', lessonId: 'lesson-13-2-1' },
  'course_strategy': { category: 'tactics', key: 'course_strategy', lessonId: 'lesson-13-2-1' },
  'covering': { category: 'tactics', key: 'covering', lessonId: 'lesson-13-2-2' },
  'risk_management': { category: 'tactics', key: 'risk_management', lessonId: 'lesson-13-2-2' },
  'current_strategy': { category: 'tactics', key: 'current_strategy', lessonId: 'lesson-13-1-2' },
  'starting_technique': { category: 'tactics', key: 'starting_technique', lessonId: 'lesson-13-2-2' },
  'positioning_defense': { category: 'tactics', key: 'positioning_defense', lessonId: 'lesson-13-2-2' },
  'review_tactics': { category: 'tactics', key: 'fleet_positioning', lessonId: 'lesson-13-2-2' },
  'study_course': { category: 'tactics', key: 'course_strategy', lessonId: 'lesson-13-2-1' },

  // Equipment checklist items → Race Preparation Mastery Module 3
  'sail_selection': { category: 'equipment', key: 'sail_selection', lessonId: 'lesson-13-3-1' },
  'select_sails': { category: 'equipment', key: 'sail_selection', lessonId: 'lesson-13-3-1' },
  'sails': { category: 'equipment', key: 'sail_selection', lessonId: 'lesson-13-3-1' },
  'jib_selection': { category: 'equipment', key: 'jib_selection', lessonId: 'lesson-13-3-1' },
  'spinnaker_selection': { category: 'equipment', key: 'spinnaker_selection', lessonId: 'lesson-13-3-1' },
  'safety_gear': { category: 'equipment', key: 'safety_gear', lessonId: 'lesson-13-3-2' },
  'safety': { category: 'equipment', key: 'safety_gear', lessonId: 'lesson-13-3-2' },
  'pfd_check': { category: 'equipment', key: 'pfd_lifejacket', lessonId: 'lesson-13-3-2' },
  'electronics_setup': { category: 'equipment', key: 'electronics_setup', lessonId: 'lesson-13-3-2' },
  'battery': { category: 'equipment', key: 'electronics_setup', lessonId: 'lesson-13-3-2' },
  'compass_check': { category: 'equipment', key: 'compass', lessonId: 'lesson-13-3-2' },
  'rig_inspection': { category: 'equipment', key: 'rig_inspection', lessonId: 'lesson-13-3-3' },
  'lines': { category: 'equipment', key: 'rig_inspection', lessonId: 'lesson-13-3-3' },
  'tune_rig': { category: 'equipment', key: 'rig_inspection', lessonId: 'lesson-13-3-3' },
  'hull_inspection': { category: 'equipment', key: 'hull_inspection', lessonId: 'lesson-13-3-2' },
  'spares_kit': { category: 'equipment', key: 'spares_kit', lessonId: 'lesson-13-3-2' },
  'clothing_gear': { category: 'equipment', key: 'clothing_gear', lessonId: 'lesson-13-3-2' },
  'batten_tension': { category: 'equipment', key: 'batten_tension', lessonId: 'lesson-13-3-3' },
  'engine_check': { category: 'equipment', key: 'outboard_engine', lessonId: 'lesson-13-3-2' },
  'anchor_check': { category: 'equipment', key: 'anchor', lessonId: 'lesson-13-3-2' },
  'food_water': { category: 'equipment', key: 'food_water', lessonId: 'lesson-13-3-2' },

  // Rules/Documents checklist items → Race Preparation Mastery Module 4
  'nor_review': { category: 'rules', key: 'nor_review', lessonId: 'lesson-13-4-1' },
  'review_nor': { category: 'rules', key: 'nor_review', lessonId: 'lesson-13-4-1' },
  'si_review': { category: 'rules', key: 'si_review', lessonId: 'lesson-13-4-2' },
  'review_si': { category: 'rules', key: 'si_review', lessonId: 'lesson-13-4-2' },
  'course_signals': { category: 'rules', key: 'course_signals', lessonId: 'lesson-13-4-3' },
  'starting_signals': { category: 'rules', key: 'starting_signals', lessonId: 'lesson-13-4-3' },
  'recall_procedures': { category: 'rules', key: 'recall_procedures', lessonId: 'lesson-13-4-3' },
  'penalty_system': { category: 'rules', key: 'penalty_system', lessonId: 'lesson-13-4-1' },
  'protest_procedures': { category: 'rules', key: 'protest_procedures', lessonId: 'lesson-13-4-1' },
  'right_of_way': { category: 'rules', key: 'right_of_way', lessonId: 'lesson-13-4-1' },
  'mark_room': { category: 'rules', key: 'mark_room', lessonId: 'lesson-13-4-1' },
  'time_limits': { category: 'rules', key: 'time_limits', lessonId: 'lesson-13-4-2' },
  'safety_regulations': { category: 'rules', key: 'safety_regulations', lessonId: 'lesson-13-4-2' },
  'scoring_system': { category: 'rules', key: 'scoring_system', lessonId: 'lesson-13-4-2' },
  'class_rules': { category: 'rules', key: 'class_rules', lessonId: 'lesson-13-4-1' },
  'postponement_abandonment': { category: 'rules', key: 'postponement_abandonment', lessonId: 'lesson-13-4-3' },
  'restricted_areas': { category: 'rules', key: 'restricted_areas', lessonId: 'lesson-13-4-2' },

  // Distance racing checklist items → Distance Racing Strategy Course (course-12)
  'route_briefing': { category: 'tactics', key: 'route_briefing', lessonId: 'lesson-12-1-1' },
  'weather_routing': { category: 'weather', key: 'weather_routing', lessonId: 'lesson-12-1-2' },

  // On-water checklist items
  'check_in': { category: 'rules', key: 'check_in', lessonId: 'lesson-1-3-1' },
  'current_check': { category: 'weather', key: 'current_check', lessonId: 'lesson-13-1-2' },

  // Crew checklist items
  'role_assignments': { category: 'crew', key: 'role_assignments' },
  'crew_communication': { category: 'crew', key: 'crew_communication' },
  'watch_schedule': { category: 'crew', key: 'watch_schedule' },
  'emergency_procedures': { category: 'crew', key: 'emergency_procedures' },
  'pre_race_briefing': { category: 'crew', key: 'pre_race_briefing' },
  'maneuver_coordination': { category: 'crew', key: 'maneuver_coordination' },
  'tactical_input': { category: 'crew', key: 'tactical_input' },
  'crew_weight': { category: 'crew', key: 'crew_weight' },
  'sail_trimming': { category: 'crew', key: 'sail_trimming' },
  'morale_energy': { category: 'crew', key: 'morale_energy' },
  'new_crew_integration': { category: 'crew', key: 'new_crew_integration' },
  'conflict_resolution': { category: 'crew', key: 'conflict_resolution' },

  // Rig tuning items (from existing rig-setting-learning.ts)
  'upper_shrouds': { category: 'rig', key: 'upper_shrouds' },
  'lower_shrouds': { category: 'rig', key: 'lower_shrouds' },
  'mast_rake': { category: 'rig', key: 'mast_rake' },
  'mast_ram': { category: 'rig', key: 'mast_ram' },
  'mast_position': { category: 'rig', key: 'mast_position' },
  'forestay': { category: 'rig', key: 'forestay' },
  'backstay': { category: 'rig', key: 'backstay' },
  'runners': { category: 'rig', key: 'runners' },
  'prebend': { category: 'rig', key: 'prebend' },
  'spreader_sweep': { category: 'rig', key: 'spreader_sweep' },
  'vang': { category: 'rig', key: 'vang' },
  'cunningham': { category: 'rig', key: 'cunningham' },
  'outhaul': { category: 'rig', key: 'outhaul' },
};

/**
 * Get learning content for any checklist item
 * Uses the mapping to find the right category and lookup
 */
export function getLearningForItem(itemKey: string): LearningContent | undefined {
  const normalized = itemKey.toLowerCase().replace(/\s+/g, '_');

  // First check if we have a direct mapping
  const mapping = CHECKLIST_LEARNING_MAP[normalized];

  if (mapping) {
    return getLearningByCategory(mapping.category, mapping.key);
  }

  // If no mapping, try all categories with the raw key
  return getLearningByCategory('weather', normalized) ||
         getLearningByCategory('tactics', normalized) ||
         getLearningByCategory('equipment', normalized) ||
         getLearningByCategory('rules', normalized) ||
         getLearningByCategory('crew', normalized) ||
         getLearningByCategory('rig', normalized);
}

/**
 * Get learning content from a specific category
 */
export function getLearningByCategory(category: LearningCategory, key: string): LearningContent | undefined {
  switch (category) {
    case 'weather':
      return getWeatherLearning(key);
    case 'tactics':
      return getTacticsLearning(key);
    case 'equipment':
      return getEquipmentLearning(key);
    case 'rules':
      return getRulesLearning(key);
    case 'crew':
      return getCrewLearning(key);
    case 'rig':
      return getSettingLearning(key);
    default:
      return undefined;
  }
}

/**
 * Get just the brief for any item
 */
export function getLearningBrief(itemKey: string): string | undefined {
  const content = getLearningForItem(itemKey);
  return content?.brief;
}

/**
 * Get academy links for any item
 */
export function getLearningLinks(itemKey: string): LearningContent['academyLinks'] {
  const content = getLearningForItem(itemKey);
  return content?.academyLinks;
}

/**
 * Check if an item has learning content
 */
export function hasLearningContent(itemKey: string): boolean {
  return getLearningForItem(itemKey) !== undefined;
}

/**
 * Get all items in a category
 */
export function getItemsInCategory(category: LearningCategory): string[] {
  return Object.entries(CHECKLIST_LEARNING_MAP)
    .filter(([_, mapping]) => mapping.category === category)
    .map(([key, _]) => key);
}

/**
 * Get category for an item
 */
export function getItemCategory(itemKey: string): LearningCategory | undefined {
  const normalized = itemKey.toLowerCase().replace(/\s+/g, '_');
  return CHECKLIST_LEARNING_MAP[normalized]?.category;
}

/**
 * Get lesson ID for an item (for deep-linking to specific lessons)
 */
export function getLessonId(itemKey: string): string | undefined {
  const normalized = itemKey.toLowerCase().replace(/\s+/g, '_');
  return CHECKLIST_LEARNING_MAP[normalized]?.lessonId;
}

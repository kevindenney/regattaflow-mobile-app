/**
 * Default Strategy Templates
 *
 * JSON-based templates for strategy cards. Each template defines:
 * - Static content (always shown)
 * - Dynamic content (pulled from race data)
 * - AI-enhanceable content (optionally generated)
 *
 * Template structure follows the StrategyTemplate interface from types.ts
 */

import { StrategyTemplate, TemplateSection, CardType } from '../types';

// =============================================================================
// START STRATEGY TEMPLATE
// =============================================================================

export const START_STRATEGY_TEMPLATE: StrategyTemplate = {
  id: 'start-strategy-default',
  cardType: 'start_strategy',
  title: 'Start Strategy',
  aiEnhanceable: true,
  sections: [
    {
      id: 'line_bias',
      title: 'Line Bias',
      type: 'ai_enhanced',
      aiPromptHint: 'Analyze wind direction relative to start line to determine favored end',
      icon: 'arrow-left-right',
      priority: 1,
    },
    {
      id: 'favored_end',
      title: 'Favored End',
      type: 'ai_enhanced',
      aiPromptHint: 'Based on wind, current, and first leg strategy, recommend pin or boat end',
      icon: 'flag-checkered',
      priority: 2,
    },
    {
      id: 'timing_approach',
      title: 'Timing Approach',
      type: 'static',
      staticContent: 'Plan your final approach with 10-15 seconds margin. Accelerate at 5 seconds to cross at full speed.',
      icon: 'timer-outline',
      priority: 3,
    },
    {
      id: 'traffic_zones',
      title: 'Traffic & Positioning',
      type: 'ai_enhanced',
      aiPromptHint: 'Identify crowded areas and recommend positioning based on fleet size',
      icon: 'account-group',
      priority: 4,
    },
    {
      id: 'bail_out',
      title: 'Bail-Out Options',
      type: 'static',
      staticContent: 'If pinned, tack early and duck the fleet. Better a clean start in second row than OCS or port-starboard incident.',
      icon: 'exit-run',
      priority: 5,
    },
  ],
};

// =============================================================================
// UPWIND STRATEGY TEMPLATE
// =============================================================================

export const UPWIND_STRATEGY_TEMPLATE: StrategyTemplate = {
  id: 'upwind-strategy-default',
  cardType: 'upwind_strategy',
  title: 'Upwind Strategy',
  aiEnhanceable: true,
  sections: [
    {
      id: 'favored_tack',
      title: 'Favored Tack',
      type: 'ai_enhanced',
      aiPromptHint: 'Determine starboard or port tack advantage based on wind shifts and current',
      icon: 'arrow-up-bold',
      priority: 1,
    },
    {
      id: 'laylines',
      title: 'Layline Strategy',
      type: 'ai_enhanced',
      aiPromptHint: 'Recommend layline approach considering wind oscillations and mark position',
      icon: 'vector-line',
      priority: 2,
    },
    {
      id: 'shift_pattern',
      title: 'Wind Shifts',
      type: 'ai_enhanced',
      aiPromptHint: 'Predict wind shift patterns based on thermal effects and geography',
      icon: 'swap-horizontal',
      priority: 3,
    },
    {
      id: 'pressure_zones',
      title: 'Pressure Zones',
      type: 'ai_enhanced',
      aiPromptHint: 'Identify areas of stronger/weaker wind pressure on the beat',
      icon: 'gauge',
      priority: 4,
    },
    {
      id: 'targets',
      title: 'Target Speed & Angle',
      type: 'dynamic',
      dataKey: 'boatSpeed.upwind',
      icon: 'speedometer',
      priority: 5,
    },
  ],
};

// =============================================================================
// DOWNWIND STRATEGY TEMPLATE
// =============================================================================

export const DOWNWIND_STRATEGY_TEMPLATE: StrategyTemplate = {
  id: 'downwind-strategy-default',
  cardType: 'downwind_strategy',
  title: 'Downwind Strategy',
  aiEnhanceable: true,
  sections: [
    {
      id: 'favored_gybe',
      title: 'Favored Gybe',
      type: 'ai_enhanced',
      aiPromptHint: 'Determine initial gybe based on wind angle and laylines',
      icon: 'arrow-down-bold',
      priority: 1,
    },
    {
      id: 'wave_technique',
      title: 'Wave & Swell',
      type: 'ai_enhanced',
      aiPromptHint: 'Analyze wave patterns for optimal surfing opportunities',
      icon: 'wave',
      priority: 2,
    },
    {
      id: 'pressure_patterns',
      title: 'Pressure Patterns',
      type: 'ai_enhanced',
      aiPromptHint: 'Identify wind pressure variations for optimal VMG',
      icon: 'chart-line',
      priority: 3,
    },
    {
      id: 'vmg_targets',
      title: 'VMG Targets',
      type: 'dynamic',
      dataKey: 'boatSpeed.downwind',
      icon: 'speedometer',
      priority: 4,
    },
    {
      id: 'tactical_position',
      title: 'Tactical Position',
      type: 'static',
      staticContent: 'Stay between the fleet and the next mark. Avoid sailing in disturbed air from boats ahead.',
      icon: 'chess-knight',
      priority: 5,
    },
  ],
};

// =============================================================================
// MARK ROUNDING STRATEGY TEMPLATE
// =============================================================================

export const MARK_ROUNDING_TEMPLATE: StrategyTemplate = {
  id: 'mark-rounding-default',
  cardType: 'mark_rounding',
  title: 'Mark Rounding',
  aiEnhanceable: true,
  sections: [
    {
      id: 'windward_approach',
      title: 'Windward Mark',
      type: 'ai_enhanced',
      aiPromptHint: 'Recommend approach angle and tactical options for windward mark rounding',
      icon: 'arrow-top-right',
      priority: 1,
    },
    {
      id: 'leeward_approach',
      title: 'Leeward Mark',
      type: 'ai_enhanced',
      aiPromptHint: 'Recommend inside/outside approach and exit strategy for leeward mark',
      icon: 'arrow-bottom-right',
      priority: 2,
    },
    {
      id: 'gate_choice',
      title: 'Gate Selection',
      type: 'ai_enhanced',
      aiPromptHint: 'If leeward gate, recommend left or right gate based on next leg strategy',
      icon: 'gate',
      priority: 3,
    },
    {
      id: 'zone_entry',
      title: 'Zone Rules',
      type: 'static',
      staticContent: 'Establish overlap before 3 boat lengths. Inside boat has rights to mark room.',
      icon: 'circle-outline',
      priority: 4,
    },
    {
      id: 'common_mistakes',
      title: 'Avoid These Mistakes',
      type: 'static',
      staticContent: 'Sailing too wide, getting rolled at windward, losing ground by not protecting position.',
      icon: 'alert-circle',
      priority: 5,
    },
  ],
};

// =============================================================================
// FINISHING STRATEGY TEMPLATE
// =============================================================================

export const FINISHING_TEMPLATE: StrategyTemplate = {
  id: 'finishing-default',
  cardType: 'finishing',
  title: 'Finishing Strategy',
  aiEnhanceable: true,
  sections: [
    {
      id: 'line_bias',
      title: 'Finish Line Bias',
      type: 'ai_enhanced',
      aiPromptHint: 'Analyze wind relative to finish line to determine favored end',
      icon: 'flag-checkered',
      priority: 1,
    },
    {
      id: 'final_approach',
      title: 'Final Approach',
      type: 'ai_enhanced',
      aiPromptHint: 'Recommend approach tactics for the final leg to the finish',
      icon: 'arrow-right-bold',
      priority: 2,
    },
    {
      id: 'close_battles',
      title: 'Close Finishes',
      type: 'static',
      staticContent: 'In tight battles, extend bow first. Luff if necessary to create separation. Time sheets count from bow crossing.',
      icon: 'sword-cross',
      priority: 3,
    },
    {
      id: 'tiebreaker',
      title: 'Tiebreaker Scenarios',
      type: 'ai_enhanced',
      aiPromptHint: 'If tied on points with another boat, consider race-to-race scenarios',
      icon: 'scale-balance',
      priority: 4,
    },
    {
      id: 'post_race',
      title: 'Post-Race Checklist',
      type: 'static',
      staticContent: 'Record finish time, note conditions, check for protests, thank competitors.',
      icon: 'clipboard-check',
      priority: 5,
    },
  ],
};

// =============================================================================
// DISTANCE RACE STRATEGY TEMPLATES
// =============================================================================

/**
 * Weather Routing - for distance races
 * Replaces Start Strategy for distance races
 */
export const DISTANCE_WEATHER_ROUTING_TEMPLATE: StrategyTemplate = {
  id: 'distance-weather-routing',
  cardType: 'start_strategy', // Maps to same card slot but different content
  title: 'Weather Routing',
  aiEnhanceable: true,
  sections: [
    {
      id: 'optimal_route',
      title: 'Optimal Route',
      type: 'ai_enhanced',
      aiPromptHint: 'Calculate optimal route based on weather systems, wind patterns, and currents',
      icon: 'routes',
      priority: 1,
    },
    {
      id: 'weather_windows',
      title: 'Weather Windows',
      type: 'ai_enhanced',
      aiPromptHint: 'Identify favorable weather windows and timing for each leg',
      icon: 'clock-outline',
      priority: 2,
    },
    {
      id: 'grib_analysis',
      title: 'GRIB Analysis',
      type: 'ai_enhanced',
      aiPromptHint: 'Analyze weather model data for wind direction and strength changes',
      icon: 'chart-line',
      priority: 3,
    },
    {
      id: 'routing_software',
      title: 'Routing Tips',
      type: 'static',
      staticContent: 'Update routing every 6 hours with fresh GRIB data. Consider sea state impact on VMG polars.',
      icon: 'compass',
      priority: 4,
      action: {
        type: 'learn',
        moduleId: 'grib-weather-routing',
        label: 'learn weather routing',
      },
    },
  ],
};

/**
 * Current Strategy - for distance races
 * Replaces Upwind Strategy for distance races
 */
export const DISTANCE_CURRENT_TEMPLATE: StrategyTemplate = {
  id: 'distance-current-strategy',
  cardType: 'upwind_strategy', // Maps to same card slot but different content
  title: 'Current Strategy',
  aiEnhanceable: true,
  sections: [
    {
      id: 'tidal_gates',
      title: 'Tidal Gates',
      type: 'ai_enhanced',
      aiPromptHint: 'Identify key tidal gates and optimal timing to pass them',
      icon: 'anchor',
      priority: 1,
    },
    {
      id: 'current_flow',
      title: 'Current Flow',
      type: 'ai_enhanced',
      aiPromptHint: 'Map current patterns along the route, including eddies and counter-currents',
      icon: 'wave',
      priority: 2,
    },
    {
      id: 'lee_bowing',
      title: 'Lee Bow Advantage',
      type: 'ai_enhanced',
      aiPromptHint: 'Identify opportunities to lee-bow the current for VMG advantage',
      icon: 'arrow-bottom-right',
      priority: 3,
    },
    {
      id: 'coastal_effects',
      title: 'Coastal Effects',
      type: 'static',
      staticContent: 'Stay close to shore for favorable counter-currents during adverse tide. Use headlands to find relief from strong current.',
      icon: 'map-marker',
      priority: 4,
      action: {
        type: 'learn',
        moduleId: 'tidal-currents',
        label: 'learn about tidal currents',
      },
    },
  ],
};

/**
 * Waypoint Tactics - for distance races
 * Replaces Downwind Strategy for distance races
 */
export const DISTANCE_WAYPOINT_TEMPLATE: StrategyTemplate = {
  id: 'distance-waypoint-tactics',
  cardType: 'downwind_strategy', // Maps to same card slot but different content
  title: 'Waypoint Tactics',
  aiEnhanceable: true,
  sections: [
    {
      id: 'rounding_approach',
      title: 'Rounding Approach',
      type: 'ai_enhanced',
      aiPromptHint: 'Optimal approach angle and sail configuration for each waypoint',
      icon: 'arrow-bottom-right',
      priority: 1,
    },
    {
      id: 'passing_side',
      title: 'Passing Requirements',
      type: 'dynamic',
      dataKey: 'routeWaypoints',
      icon: 'map-marker',
      priority: 2,
    },
    {
      id: 'hazard_avoidance',
      title: 'Hazard Avoidance',
      type: 'ai_enhanced',
      aiPromptHint: 'Identify navigation hazards near waypoints: rocks, shallows, traffic zones',
      icon: 'alert-triangle',
      priority: 3,
    },
    {
      id: 'night_approaches',
      title: 'Night Approaches',
      type: 'static',
      staticContent: 'Increase safety margin at night. Use radar and chartplotter cross-reference. Assign dedicated lookout.',
      icon: 'moon',
      priority: 4,
      action: {
        type: 'learn',
        moduleId: 'night-sailing-safety',
        label: 'learn night sailing',
      },
    },
  ],
};

/**
 * Passage Planning - for distance races
 * Replaces Mark Rounding for distance races
 */
export const DISTANCE_PASSAGE_TEMPLATE: StrategyTemplate = {
  id: 'distance-passage-planning',
  cardType: 'mark_rounding', // Maps to same card slot but different content
  title: 'Passage Planning',
  aiEnhanceable: true,
  sections: [
    {
      id: 'watch_schedule',
      title: 'Watch Schedule',
      type: 'static',
      staticContent: 'Establish watch rotation: 4 hours on / 4 off. Ensure key crew are rested for critical maneuvers.',
      icon: 'clock-outline',
      priority: 1,
      action: {
        type: 'tool',
        toolId: 'watch-schedule-creator',
        label: 'create watch schedule',
      },
    },
    {
      id: 'sail_inventory',
      title: 'Sail Selection',
      type: 'ai_enhanced',
      aiPromptHint: 'Recommend sail selection for each leg based on expected conditions',
      icon: 'sail-boat',
      priority: 2,
    },
    {
      id: 'communication',
      title: 'Communications',
      type: 'static',
      staticContent: 'Monitor VHF Ch16 and race frequency. File float plan. Establish sched reports.',
      icon: 'radio',
      priority: 3,
      action: {
        type: 'learn',
        moduleId: 'vhf-radio-procedures',
        label: 'learn VHF procedures',
      },
    },
    {
      id: 'contingencies',
      title: 'Contingency Plans',
      type: 'ai_enhanced',
      aiPromptHint: 'Identify backup plans for weather deterioration, equipment failure, crew injury',
      icon: 'alert-triangle',
      priority: 4,
    },
  ],
};

/**
 * Time Management - for distance races
 * Replaces Finishing for distance races
 */
export const DISTANCE_TIME_TEMPLATE: StrategyTemplate = {
  id: 'distance-time-management',
  cardType: 'finishing', // Maps to same card slot but different content
  title: 'Time Management',
  aiEnhanceable: true,
  sections: [
    {
      id: 'time_limit',
      title: 'Time Limit',
      type: 'dynamic',
      dataKey: 'timeLimitHours',
      icon: 'clock-outline',
      priority: 1,
    },
    {
      id: 'pacing',
      title: 'Pacing Strategy',
      type: 'ai_enhanced',
      aiPromptHint: 'Calculate required VMG to finish within time limit, considering weather changes',
      icon: 'gauge',
      priority: 2,
    },
    {
      id: 'finish_approach',
      title: 'Finish Approach',
      type: 'ai_enhanced',
      aiPromptHint: 'Tactics for the final approach to the finish, including current and wind considerations',
      icon: 'flag-checkered',
      priority: 3,
    },
    {
      id: 'dnf_decision',
      title: 'DNF Decision Point',
      type: 'static',
      staticContent: 'If significantly behind pace at 60% of time limit, evaluate weather outlook before committing to finish.',
      icon: 'alert-triangle',
      priority: 4,
      action: {
        type: 'tool',
        toolId: 'pace-calculator',
        label: 'use pace calculator',
      },
    },
  ],
};

// =============================================================================
// MATCH RACING STRATEGY TEMPLATES
// =============================================================================

/**
 * Pre-Start - for match racing
 */
export const MATCH_PRESTART_TEMPLATE: StrategyTemplate = {
  id: 'match-prestart',
  cardType: 'start_strategy',
  title: 'Pre-Start Tactics',
  aiEnhanceable: true,
  sections: [
    {
      id: 'entry_timing',
      title: 'Entry Timing',
      type: 'ai_enhanced',
      aiPromptHint: 'Optimal timing to enter the pre-start based on wind and opponent tendencies',
      icon: 'clock-start',
      priority: 1,
    },
    {
      id: 'dial_up_down',
      title: 'Dial-Up / Dial-Down',
      type: 'static',
      staticContent: 'Control engagement timing. Dial-up for aggressive position, dial-down to reset if trapped.',
      icon: 'arrow-up-down-bold',
      priority: 2,
    },
    {
      id: 'opponent_analysis',
      title: 'Opponent Analysis',
      type: 'ai_enhanced',
      aiPromptHint: 'Analyze opponent tendencies and preferred tactics from previous races',
      icon: 'account-search',
      priority: 3,
    },
    {
      id: 'penalty_play',
      title: 'Penalty Play',
      type: 'static',
      staticContent: 'Force opponent into penalty situations: luffing, mark-room, and proper course violations.',
      icon: 'flag-triangle',
      priority: 4,
    },
  ],
};

/**
 * Control & Cover - for match racing
 */
export const MATCH_CONTROL_TEMPLATE: StrategyTemplate = {
  id: 'match-control',
  cardType: 'upwind_strategy',
  title: 'Control & Cover',
  aiEnhanceable: true,
  sections: [
    {
      id: 'leading_tactics',
      title: 'When Leading',
      type: 'static',
      staticContent: 'Tight cover on opponent. Match their tacks. Protect the favored side of the course.',
      icon: 'shield-check',
      priority: 1,
    },
    {
      id: 'trailing_tactics',
      title: 'When Trailing',
      type: 'static',
      staticContent: 'Split from leader to find different wind. Look for passing lanes at mark roundings.',
      icon: 'run-fast',
      priority: 2,
    },
    {
      id: 'wind_leverage',
      title: 'Wind Leverage',
      type: 'ai_enhanced',
      aiPromptHint: 'Use wind shifts and pressure to gain or extend on opponent',
      icon: 'weather-windy',
      priority: 3,
    },
    {
      id: 'umpire_calls',
      title: 'Umpire Signals',
      type: 'static',
      staticContent: 'Green flag = no penalty. Red flag = penalty. Yellow flag = protest heard after finish.',
      icon: 'gavel',
      priority: 4,
    },
  ],
};

// =============================================================================
// TEAM RACING STRATEGY TEMPLATES
// =============================================================================

/**
 * Team Start - for team racing
 */
export const TEAM_START_TEMPLATE: StrategyTemplate = {
  id: 'team-start',
  cardType: 'start_strategy',
  title: 'Team Start',
  aiEnhanceable: true,
  sections: [
    {
      id: 'team_formation',
      title: 'Start Formation',
      type: 'static',
      staticContent: 'Spread across the line to cover opponents. Assign boats to mark specific opponents.',
      icon: 'account-group',
      priority: 1,
    },
    {
      id: 'communication',
      title: 'Team Communication',
      type: 'static',
      staticContent: 'Clear callouts: boat positions, opponent locations, wind shifts. Keep comms brief and loud.',
      icon: 'message-processing',
      priority: 2,
    },
    {
      id: 'first_beat_plan',
      title: 'First Beat Plan',
      type: 'ai_enhanced',
      aiPromptHint: 'Coordinate team positions for optimal first beat coverage',
      icon: 'strategy',
      priority: 3,
    },
  ],
};

/**
 * Combinations - for team racing
 */
export const TEAM_COMBINATIONS_TEMPLATE: StrategyTemplate = {
  id: 'team-combinations',
  cardType: 'upwind_strategy',
  title: 'Winning Combos',
  aiEnhanceable: true,
  sections: [
    {
      id: 'winning_combos',
      title: 'Winning Combinations',
      type: 'static',
      staticContent: '1-2 (any), 1-3-4, 1-3-5, 1-4-5, 2-3-4. Total points must be ≤10 to win.',
      icon: 'numeric',
      priority: 1,
    },
    {
      id: 'current_situation',
      title: 'Current Score',
      type: 'dynamic',
      dataKey: 'teamScore',
      icon: 'scoreboard',
      priority: 2,
    },
    {
      id: 'play_selection',
      title: 'Play Selection',
      type: 'ai_enhanced',
      aiPromptHint: 'Recommend plays based on current positions and winning combinations needed',
      icon: 'clipboard-play',
      priority: 3,
    },
    {
      id: 'defensive_plays',
      title: 'Defensive Plays',
      type: 'static',
      staticContent: 'If opponent in winning combo: mark trap, slow play, pass back. Disrupt their scoring.',
      icon: 'shield',
      priority: 4,
    },
  ],
};

/**
 * Mark Traps - for team racing
 */
export const TEAM_MARK_TRAPS_TEMPLATE: StrategyTemplate = {
  id: 'team-mark-traps',
  cardType: 'mark_rounding',
  title: 'Mark Plays',
  aiEnhanceable: true,
  sections: [
    {
      id: 'trap_setup',
      title: 'Mark Trap Setup',
      type: 'static',
      staticContent: 'Lead boat slows at mark. Teammate forces opponent into zone without room. Execute cleanly.',
      icon: 'target',
      priority: 1,
    },
    {
      id: 'pass_back',
      title: 'Pass Back',
      type: 'static',
      staticContent: 'Teammate passes boat to you at mark. Time the pass to put opponent behind both of you.',
      icon: 'swap-horizontal-bold',
      priority: 2,
    },
    {
      id: 'counter_plays',
      title: 'Counter Plays',
      type: 'static',
      staticContent: 'Break overlap early. Take penalty to escape trap. Call for teammate support.',
      icon: 'shield-alert',
      priority: 3,
    },
  ],
};

// =============================================================================
// TEMPLATE REGISTRY
// =============================================================================

/**
 * Map of card types to their default templates (fleet racing)
 */
export const DEFAULT_TEMPLATES: Record<string, StrategyTemplate> = {
  start_strategy: START_STRATEGY_TEMPLATE,
  upwind_strategy: UPWIND_STRATEGY_TEMPLATE,
  downwind_strategy: DOWNWIND_STRATEGY_TEMPLATE,
  mark_rounding: MARK_ROUNDING_TEMPLATE,
  finishing: FINISHING_TEMPLATE,
};

/**
 * Distance race specific templates
 */
export const DISTANCE_TEMPLATES: Record<string, StrategyTemplate> = {
  start_strategy: DISTANCE_WEATHER_ROUTING_TEMPLATE,
  upwind_strategy: DISTANCE_CURRENT_TEMPLATE,
  downwind_strategy: DISTANCE_WAYPOINT_TEMPLATE,
  mark_rounding: DISTANCE_PASSAGE_TEMPLATE,
  finishing: DISTANCE_TIME_TEMPLATE,
};

/**
 * Match race specific templates
 */
export const MATCH_TEMPLATES: Record<string, StrategyTemplate> = {
  start_strategy: MATCH_PRESTART_TEMPLATE,
  upwind_strategy: MATCH_CONTROL_TEMPLATE,
  downwind_strategy: DOWNWIND_STRATEGY_TEMPLATE, // Reuse fleet for now
  mark_rounding: MARK_ROUNDING_TEMPLATE, // Similar tactics
  finishing: FINISHING_TEMPLATE, // Similar tactics
};

/**
 * Team race specific templates
 */
export const TEAM_TEMPLATES: Record<string, StrategyTemplate> = {
  start_strategy: TEAM_START_TEMPLATE,
  upwind_strategy: TEAM_COMBINATIONS_TEMPLATE,
  downwind_strategy: DOWNWIND_STRATEGY_TEMPLATE, // Reuse fleet for now
  mark_rounding: TEAM_MARK_TRAPS_TEMPLATE,
  finishing: FINISHING_TEMPLATE, // Similar tactics
};

/**
 * Race type enum for template selection
 */
export type RaceType = 'fleet' | 'distance' | 'match' | 'team';

/**
 * Get template registry for a race type
 */
export function getTemplateRegistry(raceType: RaceType): Record<string, StrategyTemplate> {
  switch (raceType) {
    case 'distance':
      return DISTANCE_TEMPLATES;
    case 'match':
      return MATCH_TEMPLATES;
    case 'team':
      return TEAM_TEMPLATES;
    case 'fleet':
    default:
      return DEFAULT_TEMPLATES;
  }
}

/**
 * Get template for a card type (defaults to fleet racing)
 */
export function getTemplateForCardType(cardType: CardType, raceType: RaceType = 'fleet'): StrategyTemplate | null {
  const registry = getTemplateRegistry(raceType);
  return registry[cardType] || DEFAULT_TEMPLATES[cardType] || null;
}

/**
 * Get all templates
 */
export function getAllTemplates(): StrategyTemplate[] {
  return Object.values(DEFAULT_TEMPLATES);
}

/**
 * Get sections that can be AI-enhanced for a template
 */
export function getEnhanceableSections(template: StrategyTemplate): TemplateSection[] {
  return template.sections.filter((s) => s.type === 'ai_enhanced');
}

/**
 * Get static sections for a template
 */
export function getStaticSections(template: StrategyTemplate): TemplateSection[] {
  return template.sections.filter((s) => s.type === 'static');
}

/**
 * Get dynamic sections for a template
 */
export function getDynamicSections(template: StrategyTemplate): TemplateSection[] {
  return template.sections.filter((s) => s.type === 'dynamic');
}

/**
 * Fleet Racing Strategy Sections
 *
 * Traditional buoy racing strategy phases:
 * - START: Line positioning and timing
 * - UPWIND: Wind shifts, tack selection, laylines
 * - DOWNWIND: Pressure, VMG, gybe selection
 * - MARK ROUNDING: Approach and exit tactics
 * - FINISH: Line bias and final approach
 */

import type {
  PhaseInfo,
  RaceTypeStrategyConfig,
  StrategySectionMeta,
} from '@/types/raceStrategy';

/**
 * Fleet racing phases
 */
export const FLEET_PHASES: PhaseInfo[] = [
  { key: 'start', label: 'START' },
  { key: 'upwind', label: 'UPWIND' },
  { key: 'downwind', label: 'DOWNWIND' },
  { key: 'markRounding', label: 'MARK ROUNDING' },
  { key: 'finish', label: 'FINISH' },
];

/**
 * Fleet racing strategy sections
 */
export const FLEET_SECTIONS: StrategySectionMeta[] = [
  // Start
  {
    id: 'start.lineBias',
    phase: 'start',
    title: 'Line Bias',
    icon: 'scale-balance',
    description: 'Analyze wind direction relative to start line to determine favored end',
    defaultTip:
      'Sail down the line before the start to check for bias. If one end is closer to the wind, start there.',
    raceTypes: ['fleet'],
  },
  {
    id: 'start.favoredEnd',
    phase: 'start',
    title: 'Favored End',
    icon: 'flag-variant',
    description: 'Based on wind, current, and first leg strategy, recommend pin or boat end',
    defaultTip:
      'Consider both line bias and your first leg strategy. Sometimes the less favored end gives cleaner air.',
    raceTypes: ['fleet'],
  },
  {
    id: 'start.timingApproach',
    phase: 'start',
    title: 'Timing Approach',
    icon: 'timer-outline',
    description: 'Plan your final minute approach and acceleration',
    defaultTip:
      'Practice your time-distance runs to build confidence. Know how long it takes to accelerate to full speed.',
    raceTypes: ['fleet'],
  },
  // Upwind
  {
    id: 'upwind.favoredTack',
    phase: 'upwind',
    title: 'Favored Tack',
    icon: 'arrow-up-bold',
    description: 'Determine starboard or port tack advantage based on wind shifts and current',
    defaultTip:
      'In oscillating breeze, favor the lifted tack. In persistent shift, get to the favored side early.',
    raceTypes: ['fleet'],
  },
  {
    id: 'upwind.shiftStrategy',
    phase: 'upwind',
    title: 'Shift Strategy',
    icon: 'compass-outline',
    description: 'Plan how to play wind shifts - tack on headers or sail the lifts',
    defaultTip:
      'Track compass headings to detect shifts early. Tack when headed 5-7° in oscillating conditions.',
    raceTypes: ['fleet'],
  },
  {
    id: 'upwind.laylineApproach',
    phase: 'upwind',
    title: 'Layline Approach',
    icon: 'vector-line',
    description: 'When to approach the layline - early, late, or standard',
    defaultTip: 'Avoid early laylines in shifty conditions. Stay in the middle to keep options open.',
    raceTypes: ['fleet'],
  },
  // Downwind
  {
    id: 'downwind.favoredGybe',
    phase: 'downwind',
    title: 'Favored Gybe',
    icon: 'arrow-down-bold',
    description: 'Determine port or starboard gybe advantage',
    defaultTip:
      "Check apparent wind angle - gybe when it moves aft without getting stronger (you're being lifted).",
    raceTypes: ['fleet'],
  },
  {
    id: 'downwind.pressureStrategy',
    phase: 'downwind',
    title: 'Pressure Strategy',
    icon: 'weather-windy',
    description: 'Plan to sail in pressure bands and puffs',
    defaultTip:
      'Look upwind for pressure. Sail towards darker water and whitecaps to stay in the strongest wind.',
    raceTypes: ['fleet'],
  },
  {
    id: 'downwind.vmgApproach',
    phase: 'downwind',
    title: 'VMG Approach',
    icon: 'speedometer',
    description: 'Balance between sailing deep vs hot angles',
    defaultTip: 'In light air, sail hotter angles for speed. In breeze, sail deeper to reduce distance.',
    raceTypes: ['fleet'],
  },
  // Mark Rounding
  {
    id: 'markRounding.approach',
    phase: 'markRounding',
    title: 'Approach',
    icon: 'location-enter',
    description: 'Plan your entry angle and positioning',
    defaultTip: 'Approach wide to round tight. This gives you inside position and a better exit angle.',
    raceTypes: ['fleet'],
  },
  {
    id: 'markRounding.exitStrategy',
    phase: 'markRounding',
    title: 'Exit Strategy',
    icon: 'location-exit',
    description: 'Plan your exit angle and next leg setup',
    defaultTip: 'Exit close to the mark to sail the shortest distance to the next mark.',
    raceTypes: ['fleet'],
  },
  {
    id: 'markRounding.tacticalPosition',
    phase: 'markRounding',
    title: 'Tactical Position',
    icon: 'chess-knight',
    description: 'Position relative to competitors at the mark',
    defaultTip:
      'Consider overlaps and rights. Sometimes giving up a position at the mark gains you more on the next leg.',
    raceTypes: ['fleet'],
  },
  // Finish
  {
    id: 'finish.lineBias',
    phase: 'finish',
    title: 'Line Bias',
    icon: 'scale-balance',
    description: 'Identify the favored end of the finish line',
    defaultTip: 'Check the finish line bias as you approach. The closer end can save boat lengths.',
    raceTypes: ['fleet'],
  },
  {
    id: 'finish.finalApproach',
    phase: 'finish',
    title: 'Final Approach',
    icon: 'flag-checkered',
    description: 'Plan your final tactical moves to the line',
    defaultTip:
      'Protect your position on the final approach. A safe finish is often better than a risky gain.',
    raceTypes: ['fleet'],
  },
];

/**
 * Fleet racing strategy configuration
 */
export const FLEET_RACING_CONFIG: RaceTypeStrategyConfig = {
  raceType: 'fleet',
  phases: FLEET_PHASES,
  staticSections: FLEET_SECTIONS,
};

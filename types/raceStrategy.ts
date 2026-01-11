/**
 * Race Strategy Types
 * Structures for strategy planning with AI recommendations and user notes
 */

import type { PerformanceTrend } from './raceLearning';

/**
 * Past performance data for a strategy section
 */
export interface SectionPerformance {
  avgRating: number;
  trend: PerformanceTrend;
  sampleCount: number;
  lastRaceNote?: string;
}

/**
 * Individual strategy section with AI recommendation and user plan
 */
export interface StrategySectionNote {
  aiRecommendation?: string;
  userPlan?: string;
  pastPerformance?: SectionPerformance;
  updatedAt?: string;
}

/**
 * Strategy sections for Start phase
 */
export interface StartStrategyNotes {
  lineBias: StrategySectionNote;
  favoredEnd: StrategySectionNote;
  timingApproach: StrategySectionNote;
}

/**
 * Strategy sections for Upwind phase
 */
export interface UpwindStrategyNotes {
  favoredTack: StrategySectionNote;
  shiftStrategy: StrategySectionNote;
  laylineApproach: StrategySectionNote;
}

/**
 * Strategy sections for Downwind phase
 */
export interface DownwindStrategyNotes {
  favoredGybe: StrategySectionNote;
  pressureStrategy: StrategySectionNote;
  vmgApproach: StrategySectionNote;
}

/**
 * Strategy sections for Mark Rounding
 */
export interface MarkRoundingStrategyNotes {
  approach: StrategySectionNote;
  exitStrategy: StrategySectionNote;
  tacticalPosition: StrategySectionNote;
}

/**
 * Strategy sections for Finish
 */
export interface FinishStrategyNotes {
  lineBias: StrategySectionNote;
  finalApproach: StrategySectionNote;
}

/**
 * Complete strategy notes structure for all phases
 */
export interface RaceStrategyNotes {
  start: StartStrategyNotes;
  upwind: UpwindStrategyNotes;
  downwind: DownwindStrategyNotes;
  markRounding: MarkRoundingStrategyNotes;
  finish: FinishStrategyNotes;
  updatedAt?: string;
}

/**
 * Strategy section identifiers for lookup
 */
export type StrategySectionId =
  // Start
  | 'start.lineBias'
  | 'start.favoredEnd'
  | 'start.timingApproach'
  // Upwind
  | 'upwind.favoredTack'
  | 'upwind.shiftStrategy'
  | 'upwind.laylineApproach'
  // Downwind
  | 'downwind.favoredGybe'
  | 'downwind.pressureStrategy'
  | 'downwind.vmgApproach'
  // Mark Rounding
  | 'markRounding.approach'
  | 'markRounding.exitStrategy'
  | 'markRounding.tacticalPosition'
  // Finish
  | 'finish.lineBias'
  | 'finish.finalApproach';

/**
 * Strategy phase categories
 */
export type StrategyPhase = 'start' | 'upwind' | 'downwind' | 'markRounding' | 'finish';

/**
 * Section metadata for UI rendering
 */
export interface StrategySectionMeta {
  id: StrategySectionId;
  phase: StrategyPhase;
  title: string;
  icon: string;
  description: string;
  defaultTip: string; // Generic best practice when no history
}

/**
 * All strategy sections with metadata
 */
export const STRATEGY_SECTIONS: StrategySectionMeta[] = [
  // Start
  {
    id: 'start.lineBias',
    phase: 'start',
    title: 'Line Bias',
    icon: 'scale-balance',
    description: 'Analyze wind direction relative to start line to determine favored end',
    defaultTip: 'Sail down the line before the start to check for bias. If one end is closer to the wind, start there.',
  },
  {
    id: 'start.favoredEnd',
    phase: 'start',
    title: 'Favored End',
    icon: 'flag-variant',
    description: 'Based on wind, current, and first leg strategy, recommend pin or boat end',
    defaultTip: 'Consider both line bias and your first leg strategy. Sometimes the less favored end gives cleaner air.',
  },
  {
    id: 'start.timingApproach',
    phase: 'start',
    title: 'Timing Approach',
    icon: 'timer-outline',
    description: 'Plan your final minute approach and acceleration',
    defaultTip: 'Practice your time-distance runs to build confidence. Know how long it takes to accelerate to full speed.',
  },
  // Upwind
  {
    id: 'upwind.favoredTack',
    phase: 'upwind',
    title: 'Favored Tack',
    icon: 'arrow-up-bold',
    description: 'Determine starboard or port tack advantage based on wind shifts and current',
    defaultTip: 'In oscillating breeze, favor the lifted tack. In persistent shift, get to the favored side early.',
  },
  {
    id: 'upwind.shiftStrategy',
    phase: 'upwind',
    title: 'Shift Strategy',
    icon: 'compass-outline',
    description: 'Plan how to play wind shifts - tack on headers or sail the lifts',
    defaultTip: 'Track compass headings to detect shifts early. Tack when headed 5-7° in oscillating conditions.',
  },
  {
    id: 'upwind.laylineApproach',
    phase: 'upwind',
    title: 'Layline Approach',
    icon: 'vector-line',
    description: 'When to approach the layline - early, late, or standard',
    defaultTip: 'Avoid early laylines in shifty conditions. Stay in the middle to keep options open.',
  },
  // Downwind
  {
    id: 'downwind.favoredGybe',
    phase: 'downwind',
    title: 'Favored Gybe',
    icon: 'arrow-down-bold',
    description: 'Determine port or starboard gybe advantage',
    defaultTip: 'Check apparent wind angle - gybe when it moves aft without getting stronger (you\'re being lifted).',
  },
  {
    id: 'downwind.pressureStrategy',
    phase: 'downwind',
    title: 'Pressure Strategy',
    icon: 'weather-windy',
    description: 'Plan to sail in pressure bands and puffs',
    defaultTip: 'Look upwind for pressure. Sail towards darker water and whitecaps to stay in the strongest wind.',
  },
  {
    id: 'downwind.vmgApproach',
    phase: 'downwind',
    title: 'VMG Approach',
    icon: 'speedometer',
    description: 'Balance between sailing deep vs hot angles',
    defaultTip: 'In light air, sail hotter angles for speed. In breeze, sail deeper to reduce distance.',
  },
  // Mark Rounding
  {
    id: 'markRounding.approach',
    phase: 'markRounding',
    title: 'Approach',
    icon: 'location-enter',
    description: 'Plan your entry angle and positioning',
    defaultTip: 'Approach wide to round tight. This gives you inside position and a better exit angle.',
  },
  {
    id: 'markRounding.exitStrategy',
    phase: 'markRounding',
    title: 'Exit Strategy',
    icon: 'location-exit',
    description: 'Plan your exit angle and next leg setup',
    defaultTip: 'Exit close to the mark to sail the shortest distance to the next mark.',
  },
  {
    id: 'markRounding.tacticalPosition',
    phase: 'markRounding',
    title: 'Tactical Position',
    icon: 'chess-knight',
    description: 'Position relative to competitors at the mark',
    defaultTip: 'Consider overlaps and rights. Sometimes giving up a position at the mark gains you more on the next leg.',
  },
  // Finish
  {
    id: 'finish.lineBias',
    phase: 'finish',
    title: 'Line Bias',
    icon: 'scale-balance',
    description: 'Identify the favored end of the finish line',
    defaultTip: 'Check the finish line bias as you approach. The closer end can save boat lengths.',
  },
  {
    id: 'finish.finalApproach',
    phase: 'finish',
    title: 'Final Approach',
    icon: 'flag-checkered',
    description: 'Plan your final tactical moves to the line',
    defaultTip: 'Protect your position on the final approach. A safe finish is often better than a risky gain.',
  },
];

/**
 * Get sections for a specific phase
 */
export function getSectionsForPhase(phase: StrategyPhase): StrategySectionMeta[] {
  return STRATEGY_SECTIONS.filter((s) => s.phase === phase);
}

/**
 * Get section metadata by ID
 */
export function getSectionMeta(id: StrategySectionId): StrategySectionMeta | undefined {
  return STRATEGY_SECTIONS.find((s) => s.id === id);
}

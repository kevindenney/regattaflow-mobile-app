/**
 * Coaching Insight Mappings
 *
 * Maps race_analysis rating columns to coach discovery skill chips
 * and coach_profiles.specializations for pattern-detected coaching insights.
 */

export interface PhaseMapping {
  /** Column name in race_analysis table */
  ratingColumn: string;
  /** Human-readable label (e.g. "upwind") */
  label: string;
  /** Key matching SKILL_CHIPS in coach/discover.tsx */
  skillChipKey: string;
  /** Strings to fuzzy-match against coach_profiles.specializations */
  specializations: string[];
  /** Ionicon name for the insight card */
  icon: string;
  /** IOS_COLORS key for the insight card */
  color: string;
}

export const PHASE_MAPPINGS: PhaseMapping[] = [
  {
    ratingColumn: 'start_rating',
    label: 'starts',
    skillChipKey: 'starts',
    specializations: ['starts', 'starting', 'start line', 'race starts'],
    icon: 'flag-outline',
    color: 'systemRed',
  },
  {
    ratingColumn: 'upwind_rating',
    label: 'upwind',
    skillChipKey: 'upwind',
    specializations: ['upwind', 'upwind tactics', 'beating', 'windward'],
    icon: 'arrow-up-outline',
    color: 'systemBlue',
  },
  {
    ratingColumn: 'downwind_rating',
    label: 'downwind',
    skillChipKey: 'downwind',
    specializations: ['downwind', 'downwind tactics', 'running', 'spinnaker'],
    icon: 'arrow-down-outline',
    color: 'systemTeal',
  },
  {
    ratingColumn: 'windward_mark_rating',
    label: 'windward mark rounding',
    skillChipKey: 'boat_handling',
    specializations: ['boat handling', 'mark rounding', 'windward mark'],
    icon: 'navigate-outline',
    color: 'systemOrange',
  },
  {
    ratingColumn: 'leeward_mark_rating',
    label: 'leeward mark rounding',
    skillChipKey: 'boat_handling',
    specializations: ['boat handling', 'mark rounding', 'leeward mark'],
    icon: 'navigate-outline',
    color: 'systemOrange',
  },
  {
    ratingColumn: 'prestart_rating',
    label: 'pre-start',
    skillChipKey: 'starts',
    specializations: ['starts', 'starting', 'pre-start', 'race starts'],
    icon: 'timer-outline',
    color: 'systemPurple',
  },
  {
    ratingColumn: 'finish_rating',
    label: 'finish',
    skillChipKey: 'race_management',
    specializations: ['race management', 'finishing', 'race tactics'],
    icon: 'checkmark-circle-outline',
    color: 'systemGreen',
  },
  {
    ratingColumn: 'planning_rating',
    label: 'race planning',
    skillChipKey: 'race_tactics',
    specializations: ['race tactics', 'strategy', 'race planning', 'race management'],
    icon: 'map-outline',
    color: 'systemIndigo',
  },
];

/** Ratings at or below this value are considered weak */
export const WEAKNESS_THRESHOLD = 2;

/** Minimum number of weak races to trigger an insight */
export const MIN_WEAK_RACES = 3;

/** Number of most recent race analyses to scan */
export const RECENT_RACE_WINDOW = 5;

/**
 * Match Racing Strategy Sections
 *
 * 1-on-1 match racing strategy phases:
 * - PRE-START: Entry, positioning, time management
 * - DIAL-UP: Engagement, bow control, penalty hunting
 * - START: Line control, acceleration, immediate attack
 * - CONTROL: Covering, separation, forcing errors
 * - COVERAGE: Tight/loose coverage, risk assessment
 * - FINISH: Covering to line, final moves
 */

import type {
  PhaseInfo,
  RaceTypeStrategyConfig,
  StrategySectionMeta,
} from '@/types/raceStrategy';

/**
 * Match racing phases
 */
export const MATCH_PHASES: PhaseInfo[] = [
  { key: 'preStart', label: 'PRE-START' },
  { key: 'dialUp', label: 'DIAL-UP' },
  { key: 'start', label: 'START' },
  { key: 'control', label: 'CONTROL' },
  { key: 'coverage', label: 'COVERAGE' },
  { key: 'finish', label: 'FINISH' },
];

/**
 * Match racing strategy sections
 */
export const MATCH_SECTIONS: StrategySectionMeta[] = [
  // Pre-Start
  {
    id: 'preStart.entryTiming',
    phase: 'preStart',
    title: 'Entry Timing',
    icon: 'timer-outline',
    description: 'Plan your entry into the pre-start zone',
    defaultTip:
      'Enter with time to establish control. Early entry gives you options; late entry can catch opponents off-guard.',
    raceTypes: ['match'],
  },
  {
    id: 'preStart.circleControl',
    phase: 'preStart',
    title: 'Circle Control',
    icon: 'rotate-right',
    description: 'Strategy for controlling the pre-start circling',
    defaultTip:
      'Control the engagement circle. Force your opponent into predictable positions while maintaining your options.',
    raceTypes: ['match'],
  },
  {
    id: 'preStart.positionAssessment',
    phase: 'preStart',
    title: 'Position Assessment',
    icon: 'crosshairs-gps',
    description: 'Assess relative positioning and wind advantage',
    defaultTip:
      'Constantly reassess your position relative to the line and wind. Adjust your plan based on conditions.',
    raceTypes: ['match'],
  },
  // Dial-Up
  {
    id: 'dialUp.engagementStrategy',
    phase: 'dialUp',
    title: 'Engagement Strategy',
    icon: 'sword-cross',
    description: 'Plan your approach to the dial-up engagement',
    defaultTip:
      'Choose your engagement angle carefully. Upwind engagement gives control; downwind creates passing opportunities.',
    raceTypes: ['match'],
  },
  {
    id: 'dialUp.bowControl',
    phase: 'dialUp',
    title: 'Bow Control',
    icon: 'arrow-up-bold-circle',
    description: 'Maintain bow-forward position in the dial-up',
    defaultTip:
      'Keep your bow forward to maintain control. Small speed adjustments can swing the advantage.',
    raceTypes: ['match'],
  },
  {
    id: 'dialUp.penaltyHunting',
    phase: 'dialUp',
    title: 'Penalty Hunting',
    icon: 'flag',
    description: 'Opportunities to force opponent into penalties',
    defaultTip:
      'Know the rules intimately. Create situations where your opponent must break a rule to escape.',
    raceTypes: ['match'],
  },
  // Start
  {
    id: 'start.lineControl',
    phase: 'start',
    title: 'Line Control',
    icon: 'arrow-split-horizontal',
    description: 'Control position relative to the start line',
    defaultTip:
      'Control your opponent\'s access to the favored end. Use your windward position to push them down the line.',
    raceTypes: ['match'],
  },
  {
    id: 'start.acceleration',
    phase: 'start',
    title: 'Acceleration',
    icon: 'speedometer',
    description: 'Plan your acceleration to the line',
    defaultTip:
      'Time your acceleration to hit the line at full speed. A faster start compounds throughout the race.',
    raceTypes: ['match'],
  },
  {
    id: 'start.immediateAttack',
    phase: 'start',
    title: 'Immediate Attack',
    icon: 'arrow-right-bold',
    description: 'First move after the start',
    defaultTip:
      'Plan your first move before the gun. Tack away for clear air or stay and fight for control.',
    raceTypes: ['match'],
  },
  // Control
  {
    id: 'control.coveringTactics',
    phase: 'control',
    title: 'Covering Tactics',
    icon: 'shield',
    description: 'Maintain control over your opponent',
    defaultTip:
      'Cover tight when ahead. Match their moves to neutralize any gains from shifts or pressure.',
    raceTypes: ['match'],
  },
  {
    id: 'control.separationStrategy',
    phase: 'control',
    title: 'Separation Strategy',
    icon: 'arrow-expand-horizontal',
    description: 'When and how much to separate',
    defaultTip:
      'Separation adds risk but can create opportunities. Separate only when you have a clear reason.',
    raceTypes: ['match'],
  },
  {
    id: 'control.forcingErrors',
    phase: 'control',
    title: 'Forcing Errors',
    icon: 'alert-decagram',
    description: 'Create pressure to force opponent mistakes',
    defaultTip:
      'Consistent pressure leads to mistakes. Stay patient and capitalize on errors rather than forcing plays.',
    raceTypes: ['match'],
  },
  // Coverage
  {
    id: 'coverage.tightLooseCoverage',
    phase: 'coverage',
    title: 'Tight vs Loose Coverage',
    icon: 'vector-difference',
    description: 'Adjust coverage intensity based on lead',
    defaultTip:
      'Tight coverage preserves lead but risks losing to shifts. Loosen coverage when lead is secure.',
    raceTypes: ['match'],
  },
  {
    id: 'coverage.riskAssessment',
    phase: 'coverage',
    title: 'Risk Assessment',
    icon: 'scale-balance',
    description: 'Evaluate risk vs reward in coverage decisions',
    defaultTip:
      'Match your risk tolerance to your lead. Small leads require conservative coverage.',
    raceTypes: ['match'],
  },
  {
    id: 'coverage.positionLeverage',
    phase: 'coverage',
    title: 'Position Leverage',
    icon: 'arrow-decision',
    description: 'Use position to create and maintain advantage',
    defaultTip:
      'Windward gauge gives options. Maintain enough separation to cover tacks without losing control.',
    raceTypes: ['match'],
  },
  // Finish
  {
    id: 'finish.coveringToLine',
    phase: 'finish',
    title: 'Covering to Line',
    icon: 'shield-check',
    description: 'Maintain coverage through the finish',
    defaultTip:
      'Tighten coverage approaching the finish. Don\'t give your opponent a chance to sneak past.',
    raceTypes: ['match'],
  },
  {
    id: 'finish.finalMoves',
    phase: 'finish',
    title: 'Final Moves',
    icon: 'flag-checkered',
    description: 'Last-chance tactics at the finish',
    defaultTip:
      'Behind? Create chaos. Ahead? Simplify. The finish is where races are won and lost.',
    raceTypes: ['match'],
  },
];

/**
 * Match racing strategy configuration
 */
export const MATCH_RACING_CONFIG: RaceTypeStrategyConfig = {
  raceType: 'match',
  phases: MATCH_PHASES,
  staticSections: MATCH_SECTIONS,
};

/**
 * Team Racing Strategy Sections
 *
 * Multi-boat team racing strategy phases:
 * - TEAM COORDINATION: Communication, signals, position calls
 * - START: Team formation, lane assignments
 * - COMBINATIONS: Mark trap, hunt, pass back, chop & duck
 * - PASSING: Slam dunk, dial down, gybe set plays
 * - FINISH: Combination finishes, scoring scenarios
 */

import type {
  PhaseInfo,
  RaceTypeStrategyConfig,
  StrategySectionMeta,
} from '@/types/raceStrategy';

/**
 * Team racing phases
 */
export const TEAM_PHASES: PhaseInfo[] = [
  { key: 'teamCoordination', label: 'TEAM COORDINATION' },
  { key: 'start', label: 'START' },
  { key: 'combinations', label: 'COMBINATIONS' },
  { key: 'passing', label: 'PASSING PLAYS' },
  { key: 'finish', label: 'FINISH' },
];

/**
 * Team racing strategy sections
 */
export const TEAM_SECTIONS: StrategySectionMeta[] = [
  // Team Coordination
  {
    id: 'teamCoordination.communicationSignals',
    phase: 'teamCoordination',
    title: 'Communication Signals',
    icon: 'message-text',
    description: 'Establish team communication protocols',
    defaultTip:
      'Use clear, simple signals. Voice calls should be short and unambiguous. Practice signals before racing.',
    raceTypes: ['team'],
  },
  {
    id: 'teamCoordination.positionCalls',
    phase: 'teamCoordination',
    title: 'Position Calls',
    icon: 'numeric',
    description: 'System for calling positions during the race',
    defaultTip:
      'Know your position at all times. Call positions frequently: "We\'re 1-4-5, they\'re 2-3-6."',
    raceTypes: ['team'],
  },
  {
    id: 'teamCoordination.combinationTriggers',
    phase: 'teamCoordination',
    title: 'Combination Triggers',
    icon: 'target',
    description: 'When to initiate team combinations',
    defaultTip:
      'Identify trigger points for combinations. Don\'t force plays; wait for the right opportunity.',
    raceTypes: ['team'],
  },
  // Start
  {
    id: 'start.teamFormation',
    phase: 'start',
    title: 'Team Start Formation',
    icon: 'account-group',
    description: 'How your team will position for the start',
    defaultTip:
      'Establish formation before the sequence. Each boat should know their role and backup plan.',
    raceTypes: ['team'],
  },
  {
    id: 'start.initialPositions',
    phase: 'start',
    title: 'Initial Positions',
    icon: 'map-marker-multiple',
    description: 'Target positions immediately after the start',
    defaultTip:
      'Plan where each boat should be at the first mark. Adjust formation based on start result.',
    raceTypes: ['team'],
  },
  {
    id: 'start.laneAssignments',
    phase: 'start',
    title: 'Lane Assignments',
    icon: 'road',
    description: 'Pre-assigned lanes and coverage responsibilities',
    defaultTip:
      'Assign lanes based on boat speed and crew strengths. Know your primary and secondary assignments.',
    raceTypes: ['team'],
  },
  // Combinations
  {
    id: 'combinations.markTrap',
    phase: 'combinations',
    title: 'Mark Trap',
    icon: 'vector-triangle',
    description: 'Trapping opponents at marks',
    defaultTip:
      'Set up the trap early. One boat slows the opponent while another gains positions.',
    raceTypes: ['team'],
  },
  {
    id: 'combinations.hunt',
    phase: 'combinations',
    title: 'Hunt',
    icon: 'binoculars',
    description: 'Coordinated attack on a specific opponent',
    defaultTip:
      'Hunt the opponent who will break up the best scoring combination. Two boats working together are hard to escape.',
    raceTypes: ['team'],
  },
  {
    id: 'combinations.passBack',
    phase: 'combinations',
    title: 'Pass Back',
    icon: 'swap-horizontal',
    description: 'Passing positions between teammates',
    defaultTip:
      'Pass back when it improves the team scoring combination. The boat behind must be alert.',
    raceTypes: ['team'],
  },
  {
    id: 'combinations.chopDuck',
    phase: 'combinations',
    title: 'Chop & Duck',
    icon: 'arrow-down-left',
    description: 'Aggressive mark rounding combinations',
    defaultTip:
      'Execute chop and duck plays at mark roundings. Timing and communication are critical.',
    raceTypes: ['team'],
  },
  // Passing Plays
  {
    id: 'passing.slamDunk',
    phase: 'passing',
    title: 'Slam Dunk',
    icon: 'arrow-down-bold',
    description: 'Lee bow slam dunk passing play',
    defaultTip:
      'Set up below and ahead. Tack into a lee bow position that forces the opponent to tack away or slow down.',
    raceTypes: ['team'],
  },
  {
    id: 'passing.dialDown',
    phase: 'passing',
    title: 'Dial Down',
    icon: 'arrow-bottom-right',
    description: 'Downwind dial down passing play',
    defaultTip:
      'Engage to windward, then dial down below your opponent. Works best in light air with good boat handling.',
    raceTypes: ['team'],
  },
  {
    id: 'passing.gybeSet',
    phase: 'passing',
    title: 'Gybe Set',
    icon: 'rotate-left',
    description: 'Gybe set at the windward mark',
    defaultTip:
      'Call gybe set early. The inside boat at the mark gets the advantage on the downwind leg.',
    raceTypes: ['team'],
  },
  // Finish
  {
    id: 'finish.combinationFinishes',
    phase: 'finish',
    title: 'Combination Finishes',
    icon: 'podium',
    description: 'Coordinate team finishing order',
    defaultTip:
      'Know the combinations that win. Manipulate finishing order to achieve the best team score.',
    raceTypes: ['team'],
  },
  {
    id: 'finish.scoringScenarios',
    phase: 'finish',
    title: 'Scoring Scenarios',
    icon: 'calculator',
    description: 'Know winning and losing combinations',
    defaultTip:
      'Team racing scoring: 1+2+3=6 beats 4+5+6=15. Know the tiebreaker rules.',
    raceTypes: ['team'],
  },
  {
    id: 'finish.finalPlays',
    phase: 'finish',
    title: 'Final Plays',
    icon: 'flag-checkered',
    description: 'Last-chance team plays at the finish',
    defaultTip:
      'Behind? Create opportunities with aggressive plays. Ahead? Simplify and protect the combination.',
    raceTypes: ['team'],
  },
];

/**
 * Team racing strategy configuration
 */
export const TEAM_RACING_CONFIG: RaceTypeStrategyConfig = {
  raceType: 'team',
  phases: TEAM_PHASES,
  staticSections: TEAM_SECTIONS,
};

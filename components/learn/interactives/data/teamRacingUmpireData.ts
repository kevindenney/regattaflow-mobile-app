/**
 * Team Racing Umpire Signals Data
 *
 * This lesson teaches umpire signals used in team racing (Appendix D):
 * - Flag signals and their meanings
 * - Sound signals paired with flags
 * - Penalty scenarios and outcomes
 * - How to complete penalties in team racing
 */

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface UmpireSignal {
  id: string;
  name: string;
  flag: string;
  flagColors: string[];
  sound: string;
  meaning: string;
  whenUsed: string;
  sailorAction: string;
}

export interface PenaltyScenario {
  id: string;
  title: string;
  description: string;
  boats: {
    id: string;
    team: 'blue' | 'red';
    label: string;
    x: number;
    y: number;
    heading: number;
  }[];
  windDirection: number;
  violation: string;
  rulesBroken: string[];
  signal: string;
  outcome: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface PenaltyCompletion {
  type: 'one-turn' | 'two-turns' | 'scoring';
  description: string;
  steps: string[];
  teamRacingNote: string;
}

// ── Umpire Signals ──────────────────────────────────────────────────────────

export const UMPIRE_SIGNALS: UmpireSignal[] = [
  {
    id: 'green-white',
    name: 'Green and White Flag',
    flag: 'green-white',
    flagColors: ['#22C55E', '#FFFFFF'],
    sound: 'one short',
    meaning: 'No penalty. Protest is dismissed or umpires see no rule breach.',
    whenUsed: 'When a boat requests a penalty on another boat but the umpires determine no rule was broken, or when a protest is invalid.',
    sailorAction: 'No action required. Continue racing as normal.',
  },
  {
    id: 'red-flag',
    name: 'Red Flag',
    flag: 'red',
    flagColors: ['#EF4444'],
    sound: 'one short',
    meaning: 'Penalty on the identified boat. The red flag is pointed at the penalized boat.',
    whenUsed: 'When a boat breaks a right-of-way rule (e.g., port/starboard, windward/leeward, mark room) and the umpires decide a penalty is warranted.',
    sailorAction: 'The penalized boat must complete a one-turn penalty (one tack and one gybe) as soon as possible after the signal.',
  },
  {
    id: 'blue-yellow-pennant',
    name: 'Blue or Yellow Pennant',
    flag: 'blue-yellow-pennant',
    flagColors: ['#3B82F6', '#FACC15'],
    sound: 'one short',
    meaning: 'Identifies which boat the umpire decision applies to. Paired with a red or black flag.',
    whenUsed: 'Displayed alongside the red flag or black flag to clearly identify which boat is penalized when multiple boats are in close proximity.',
    sailorAction: 'The boat matching the displayed pennant color must take the penalty. The other boat continues racing.',
  },
  {
    id: 'black-flag',
    name: 'Black Flag',
    flag: 'black',
    flagColors: ['#1F2937'],
    sound: 'one long',
    meaning: 'Disqualification without a hearing. The boat is removed from the race immediately.',
    whenUsed: 'For serious or repeated violations: a boat that has already been penalized and commits another foul before completing the first penalty, or for deliberate rule-breaking.',
    sailorAction: 'The disqualified boat must immediately retire from the race. She receives last-place points for scoring.',
  },
  {
    id: 'yellow-flag',
    name: 'Yellow Flag (Scoring Penalty)',
    flag: 'yellow',
    flagColors: ['#FACC15'],
    sound: 'one short',
    meaning: 'Scoring penalty applied under Appendix D. The penalized boat\'s finishing position is worsened by one place.',
    whenUsed: 'When a boat gains a significant advantage through a rule breach but a turns penalty would be impractical or insufficient. Common in team racing tactical fouls near the finish.',
    sailorAction: 'No on-water action required. The boat continues racing but receives a one-place scoring penalty applied after finishing.',
  },
  {
    id: 'no-flag',
    name: 'No Flag (No Action)',
    flag: 'none',
    flagColors: [],
    sound: 'none',
    meaning: 'Umpires observed the incident but chose not to penalize. No flag is displayed and no sound is made.',
    whenUsed: 'When the umpires see an incident but determine that no rule was broken, or the breach was minor and did not affect the outcome.',
    sailorAction: 'No action required. Continue racing. Note that the absence of a signal does not prevent a later protest if applicable.',
  },
];

// ── Penalty Scenarios ───────────────────────────────────────────────────────

export const PENALTY_SCENARIOS: PenaltyScenario[] = [
  // Scenario 1: Port/Starboard violation
  {
    id: 'ps-port-starboard',
    title: 'Port/Starboard Violation',
    description: 'Blue team boat on port tack fails to keep clear of a red team boat on starboard tack. The boats are crossing on opposite tacks upwind and the port boat does not bear away or tack in time.',
    boats: [
      { id: 'blue-1', team: 'blue', label: 'Blue 1 (Port)', x: 200, y: 350, heading: 45 },
      { id: 'red-1', team: 'red', label: 'Red 1 (Starboard)', x: 500, y: 350, heading: 315 },
    ],
    windDirection: 0,
    violation: 'Blue 1 on port tack fails to keep clear of Red 1 on starboard tack. Red 1 is forced to alter course to avoid contact.',
    rulesBroken: ['Rule 10 - On Opposite Tacks'],
    signal: 'red-flag',
    outcome: 'Red flag pointed at Blue 1. Blue 1 must complete a one-turn penalty (one tack and one gybe) as soon as reasonably possible.',
    difficulty: 'beginner',
  },

  // Scenario 2: Mark-room violation
  {
    id: 'ps-mark-room',
    title: 'Mark-Room Violation',
    description: 'Two boats approach the windward mark overlapped. The outside boat (Red 2) fails to give the inside boat (Blue 2) room to round the mark.',
    boats: [
      { id: 'blue-2', team: 'blue', label: 'Blue 2 (Inside)', x: 360, y: 280, heading: 315 },
      { id: 'red-2', team: 'red', label: 'Red 2 (Outside)', x: 430, y: 310, heading: 315 },
      { id: 'mark', team: 'red', label: 'Windward Mark', x: 300, y: 150, heading: 0 },
    ],
    windDirection: 0,
    violation: 'Red 2 (outside boat) squeezes Blue 2 at the windward mark, not giving sufficient room to round. Blue 2 is forced wide and nearly hits the mark.',
    rulesBroken: ['Rule 18.2(a) - Mark-Room: Giving Mark-Room'],
    signal: 'red-flag',
    outcome: 'Red flag pointed at Red 2. Red 2 must complete a one-turn penalty. Blue 2 continues racing.',
    difficulty: 'beginner',
  },

  // Scenario 3: Touching a mark
  {
    id: 'ps-touching-mark',
    title: 'Touching a Mark',
    description: 'A blue team boat touches the leeward mark while rounding. Under team racing rules, a boat that touches a mark must take a one-turn penalty.',
    boats: [
      { id: 'blue-3', team: 'blue', label: 'Blue 3', x: 380, y: 320, heading: 200 },
      { id: 'mark-leeward', team: 'red', label: 'Leeward Mark', x: 350, y: 350, heading: 0 },
    ],
    windDirection: 0,
    violation: 'Blue 3 makes contact with the leeward mark during rounding. The boat must self-penalize or the umpires will impose a penalty.',
    rulesBroken: ['Rule 31 - Touching a Mark'],
    signal: 'red-flag',
    outcome: 'If Blue 3 does not promptly take a voluntary one-turn penalty, the umpires display the red flag. Blue 3 must complete a one-turn penalty before continuing to race.',
    difficulty: 'beginner',
  },

  // Scenario 4: Proper course violation (tactical foul)
  {
    id: 'ps-proper-course',
    title: 'Proper Course / Tactical Interference',
    description: 'On the final downwind leg, a red team boat sails well above proper course to interfere with a blue team boat and protect a teammate\'s position near the finish.',
    boats: [
      { id: 'red-3', team: 'red', label: 'Red 3 (Interfering)', x: 350, y: 250, heading: 135 },
      { id: 'blue-4', team: 'blue', label: 'Blue 4 (Victim)', x: 420, y: 220, heading: 180 },
      { id: 'red-5', team: 'red', label: 'Red 5 (Finishing)', x: 300, y: 420, heading: 180 },
    ],
    windDirection: 0,
    violation: 'Red 3 sails significantly above proper course on the downwind leg to block Blue 4 and protect Red 5\'s position approaching the finish. The umpires determine this warrants a scoring penalty.',
    rulesBroken: ['Rule 17 - On the Same Tack; Proper Course', 'Appendix D - Scoring Penalty'],
    signal: 'yellow-flag',
    outcome: 'Yellow flag displayed for Red 3. A scoring penalty is applied: Red 3\'s finishing position is worsened by one place in the results.',
    difficulty: 'intermediate',
  },

  // Scenario 5: Multiple violations leading to DSQ
  {
    id: 'ps-multiple-violations',
    title: 'Multiple Violations (DSQ)',
    description: 'A blue team boat that has already received a penalty commits a second foul before completing the first penalty turn. The umpires escalate to disqualification.',
    boats: [
      { id: 'blue-5', team: 'blue', label: 'Blue 5 (Penalized)', x: 380, y: 300, heading: 45 },
      { id: 'red-4', team: 'red', label: 'Red 4', x: 480, y: 320, heading: 315 },
    ],
    windDirection: 0,
    violation: 'Blue 5 was previously penalized (red flag) but has not yet completed the one-turn penalty. While still owing the penalty, Blue 5 commits a port/starboard foul against Red 4. The umpires escalate.',
    rulesBroken: ['Rule 10 - On Opposite Tacks', 'Appendix D3.2 - Penalties: Compounding'],
    signal: 'black-flag',
    outcome: 'Black flag displayed for Blue 5. Blue 5 is disqualified from the race without a hearing and must retire immediately. Blue 5 receives last-place points.',
    difficulty: 'advanced',
  },

  // Scenario 6: Clean encounter (no penalty)
  {
    id: 'ps-clean-encounter',
    title: 'Clean Encounter',
    description: 'Two boats from opposite teams cross on opposite tacks. The port-tack boat bears away in time, passing cleanly astern of the starboard-tack boat. No contact, no foul.',
    boats: [
      { id: 'red-6', team: 'red', label: 'Red 6 (Port)', x: 220, y: 340, heading: 45 },
      { id: 'blue-6', team: 'blue', label: 'Blue 6 (Starboard)', x: 500, y: 340, heading: 315 },
    ],
    windDirection: 0,
    violation: 'No violation. Red 6 on port tack sees Blue 6 on starboard and bears away early, passing well astern. Blue 6 does not need to alter course.',
    rulesBroken: [],
    signal: 'green-white',
    outcome: 'Green and white flag displayed. No penalty. Both boats continue racing. Clean, well-executed crossing.',
    difficulty: 'beginner',
  },
];

// ── Penalty Completions ─────────────────────────────────────────────────────

export const PENALTY_COMPLETIONS: PenaltyCompletion[] = [
  {
    type: 'one-turn',
    description: 'The standard penalty in team racing under Appendix D. The penalized boat must complete one turn including one tack and one gybe.',
    steps: [
      'As soon as reasonably possible after receiving the penalty, begin the turn.',
      'Complete one tack (pass head to wind from one tack to the other).',
      'Continue turning and complete one gybe (pass stern through the wind).',
      'Resume racing on a course to the next mark once the full turn is complete.',
    ],
    teamRacingNote: 'In team racing (Appendix D), penalties are reduced to a ONE-turn penalty instead of the standard two-turn penalty used in fleet racing. This is because team racing is faster-paced and boats are in closer quarters. The penalty must still be completed promptly.',
  },
  {
    type: 'two-turns',
    description: 'The standard fleet racing penalty (Two-Turns Penalty). In team racing, this is NOT the default; the one-turn penalty under Appendix D applies instead. Two turns may be specified in the Sailing Instructions.',
    steps: [
      'Get clear of other boats as soon as possible.',
      'Complete two full turns in the same direction (each turn includes one tack and one gybe).',
      'After both turns are complete, resume racing on proper course.',
      'If the penalty is for touching a mark, only one turn is required (even in fleet racing).',
    ],
    teamRacingNote: 'Two-turn penalties are NOT standard in team racing. Under Appendix D, the default penalty is one turn. However, the Sailing Instructions for a specific event may modify this. Always check the SI before racing.',
  },
  {
    type: 'scoring',
    description: 'A scoring penalty worsens the penalized boat\'s finishing position by one place. The boat does not need to perform any turns on the water.',
    steps: [
      'Continue racing normally after the yellow flag is displayed.',
      'Finish the race in the best position you can.',
      'After racing, your finishing place is worsened by one position in the results.',
      'If you finish 2nd, you are scored as 3rd. If you finish last, you receive points equal to last place plus one.',
    ],
    teamRacingNote: 'Scoring penalties are unique to team racing (Appendix D). They are used when a turns penalty would be impractical (e.g., near the finish) or when the umpires determine the breach gave a scoring advantage that a turn would not remedy. The team totals are recalculated with the adjusted position.',
  },
];

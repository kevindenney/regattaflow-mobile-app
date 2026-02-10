/**
 * Team Racing Communications Data
 *
 * Defines the standard communication calls used between teammates during
 * team racing. Effective communication is critical in team racing because
 * teammates must coordinate tactical plays in real time.
 *
 * Calls are organized into four categories:
 * - Combination: Calls about the current scoring combination
 * - Play: Calls to initiate or execute a tactical maneuver
 * - Position: Calls to inform teammates of positions and threats
 * - Situational: Calls about overall race strategy and risk management
 *
 * Canvas coordinate space: x 0-400, y 0-600.
 * Wind from the top (0 degrees).
 * Standard W/L marks at (200, 80) and (200, 520).
 */

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export type CallCategory = 'combination' | 'play' | 'position' | 'situational';

export interface TeamRacingCall {
  id: string;
  call: string;
  category: CallCategory;
  meaning: string;
  whenToUse: string;
  example: string;
  scenarioBoats?: {
    id: string;
    team: 'blue' | 'red';
    label: string;
    x: number;
    y: number;
    heading: number;
  }[];
  scenarioMarks?: { x: number; y: number; type: 'windward' | 'leeward' }[];
  scenarioAnnotations?: { text: string; x: number; y: number; type: 'action' | 'info' | 'warning' }[];
  windDirection?: number;
}

// ---------------------------------------------------------------------------
// Standard Marks (reused across scenarios)
// ---------------------------------------------------------------------------

const WL_MARKS: TeamRacingCall['scenarioMarks'] = [
  { x: 200, y: 80, type: 'windward' },
  { x: 200, y: 520, type: 'leeward' },
];

// ---------------------------------------------------------------------------
// Combination Calls
// ---------------------------------------------------------------------------

const COMBINATION_CALLS: TeamRacingCall[] = [
  {
    id: 'combo-were-in',
    call: "We're in!",
    category: 'combination',
    meaning:
      'Our team is currently in a winning combination. Our three finishing positions add up to 10 or less.',
    whenToUse:
      'Call this as soon as you recognize your team holds a winning combination. It tells teammates to shift from attacking to protecting the current positions.',
    example:
      'Blue boats are in 1st, 2nd, and 5th. B1 calls "We\'re in!" because 1+2+5 = 8, a comfortable win.',
    scenarioBoats: [
      { id: 'blue1', team: 'blue', label: 'B1', x: 170, y: 180, heading: 350 },
      { id: 'blue2', team: 'blue', label: 'B2', x: 200, y: 220, heading: 345 },
      { id: 'red1', team: 'red', label: 'R1', x: 250, y: 270, heading: 340 },
      { id: 'red2', team: 'red', label: 'R2', x: 160, y: 310, heading: 355 },
      { id: 'blue3', team: 'blue', label: 'B3', x: 220, y: 360, heading: 345 },
      { id: 'red3', team: 'red', label: 'R3', x: 290, y: 400, heading: 340 },
    ],
    scenarioMarks: WL_MARKS,
    scenarioAnnotations: [
      { text: 'B1 1st, B2 2nd, B3 5th', x: 50, y: 30, type: 'info' },
      { text: '1+2+5 = 8 (WIN)', x: 280, y: 30, type: 'info' },
      { text: "We're in!", x: 95, y: 175, type: 'action' },
    ],
    windDirection: 0,
  },
  {
    id: 'combo-were-out',
    call: "We're out!",
    category: 'combination',
    meaning:
      'Our team is currently in a losing combination. Our three finishing positions add up to 11 or more.',
    whenToUse:
      'Call this to alert teammates that the team needs to make a position change. It triggers teammates to look for opportunities to execute plays like traps, pass-backs, or screens.',
    example:
      'Blue boats are in 2nd, 4th, and 6th. B2 calls "We\'re out!" because 2+4+6 = 12, a loss.',
    scenarioBoats: [
      { id: 'red1', team: 'red', label: 'R1', x: 180, y: 180, heading: 350 },
      { id: 'blue1', team: 'blue', label: 'B1', x: 210, y: 230, heading: 345 },
      { id: 'red2', team: 'red', label: 'R2', x: 160, y: 280, heading: 355 },
      { id: 'blue2', team: 'blue', label: 'B2', x: 240, y: 320, heading: 340 },
      { id: 'red3', team: 'red', label: 'R3', x: 190, y: 370, heading: 350 },
      { id: 'blue3', team: 'blue', label: 'B3', x: 270, y: 420, heading: 340 },
    ],
    scenarioMarks: WL_MARKS,
    scenarioAnnotations: [
      { text: 'B1 2nd, B2 4th, B3 6th', x: 50, y: 30, type: 'info' },
      { text: '2+4+6 = 12 (LOSE)', x: 280, y: 30, type: 'warning' },
      { text: "We're out!", x: 135, y: 225, type: 'warning' },
    ],
    windDirection: 0,
  },
  {
    id: 'combo-1-2-4',
    call: '1-2-4!',
    category: 'combination',
    meaning:
      'Our team currently holds positions 1, 2, and 4. This is a specific winning combination (total = 7).',
    whenToUse:
      'Call out the exact combination so every teammate knows their position and can assess whether they need to attack or defend. Always call the three numbers in ascending order.',
    example:
      'Blue boats are 1st, 2nd, and 4th. B1 calls "1-2-4!" so B3 in 4th knows to hold position and not take unnecessary risks.',
  },
  {
    id: 'combo-cliff-edge',
    call: 'Cliff edge!',
    category: 'combination',
    meaning:
      'Our team total is exactly 10 - the minimum winning score. Any single position loss will flip the result to a loss.',
    whenToUse:
      'Call this when your team is at exactly 10 points (e.g., 1-3-6, 2-3-5, or 1-4-5). It warns teammates that there is zero margin for error and every position must be defended.',
    example:
      'Blue is in 1-3-6 (total 10). B1 calls "Cliff edge!" to warn that if R2 passes B2 from 4th to 3rd, blue drops to 1-4-6 = 11 and loses.',
    scenarioBoats: [
      { id: 'blue1', team: 'blue', label: 'B1', x: 180, y: 180, heading: 350 },
      { id: 'red1', team: 'red', label: 'R1', x: 220, y: 230, heading: 340 },
      { id: 'blue2', team: 'blue', label: 'B2', x: 170, y: 280, heading: 355 },
      { id: 'red2', team: 'red', label: 'R2', x: 240, y: 320, heading: 340 },
      { id: 'red3', team: 'red', label: 'R3', x: 200, y: 370, heading: 350 },
      { id: 'blue3', team: 'blue', label: 'B3', x: 280, y: 420, heading: 340 },
    ],
    scenarioMarks: WL_MARKS,
    scenarioAnnotations: [
      { text: 'B1 1st, B2 3rd, B3 6th', x: 50, y: 30, type: 'info' },
      { text: '1+3+6 = 10 (CLIFF EDGE)', x: 250, y: 30, type: 'warning' },
      { text: 'Cliff edge!', x: 100, y: 175, type: 'warning' },
      { text: 'If R2 passes B2, we lose', x: 250, y: 280, type: 'warning' },
    ],
    windDirection: 0,
  },
  {
    id: 'combo-they-need-one',
    call: 'They need one!',
    category: 'combination',
    meaning:
      'The opponent is one position swap away from winning. They are currently losing at a total of 11, and one swap will bring them to 10.',
    whenToUse:
      'Call this to heighten awareness when the opponent is very close to flipping the result. Teammates must identify which swap the opponent is likely to attempt and defend against it.',
    example:
      'Red is in 2-3-6 (total 11). If R3 passes B3 from 6th to 5th, red gets 2-3-5 = 10 and wins. B1 calls "They need one!" to alert the team.',
  },
];

// ---------------------------------------------------------------------------
// Play Calls
// ---------------------------------------------------------------------------

const PLAY_CALLS: TeamRacingCall[] = [
  {
    id: 'play-trap',
    call: 'Trap!',
    category: 'play',
    meaning:
      'Set up a mark trap. The lead boat should slow before the mark to compress the fleet and allow a trailing teammate to round inside an opponent.',
    whenToUse:
      'Call when approaching a mark rounding where your team has a lead boat followed by an opponent, with a teammate close behind that opponent. The lead boat slows, the teammate gains an inside overlap.',
    example:
      'Approaching the windward mark: B1 is 1st, R1 is 2nd, B2 is 3rd. B2 calls "Trap!" to tell B1 to slow before the mark so B2 can get inside R1.',
    scenarioBoats: [
      { id: 'blue1', team: 'blue', label: 'B1', x: 185, y: 170, heading: 0 },
      { id: 'red1', team: 'red', label: 'R1', x: 190, y: 230, heading: 0 },
      { id: 'blue2', team: 'blue', label: 'B2', x: 200, y: 280, heading: 355 },
      { id: 'red2', team: 'red', label: 'R2', x: 260, y: 330, heading: 345 },
      { id: 'blue3', team: 'blue', label: 'B3', x: 140, y: 380, heading: 10 },
      { id: 'red3', team: 'red', label: 'R3', x: 300, y: 400, heading: 340 },
    ],
    scenarioMarks: WL_MARKS,
    scenarioAnnotations: [
      { text: 'Trap!', x: 220, y: 275, type: 'action' },
      { text: 'B1 will slow here', x: 105, y: 155, type: 'action' },
      { text: 'B2 aims for inside overlap', x: 210, y: 255, type: 'info' },
    ],
    windDirection: 0,
  },
  {
    id: 'play-screen',
    call: 'Screen!',
    category: 'play',
    meaning:
      'Position yourself directly upwind of the target opponent to put them in dirty air, slowing them down.',
    whenToUse:
      'Call when a teammate needs to slow a specific opponent. The screening boat tacks or positions itself upwind of the target, casting turbulent air onto their sails.',
    example:
      'B2 is 3rd, R2 is 4th, B3 is 5th. B1 calls "Screen!" to B2, telling B2 to tack and position upwind of R2 to slow R2 so B3 can pass.',
  },
  {
    id: 'play-pass-back',
    call: 'Pass-back!',
    category: 'play',
    meaning:
      'Execute a pass-back play. The lead boat slows to hold an opponent, creating space for a trailing teammate to gybe or tack into a better position.',
    whenToUse:
      'Call when the lead boat can sacrifice some distance to create an opening behind them. The trailing teammate uses the gap to pass an opponent between the two blue boats.',
    example:
      'Downwind: B1 is 1st, R1 is 2nd, R2 is 3rd, B2 is 4th. B2 calls "Pass-back!" asking B1 to slow and hold R1 so B2 can gybe ahead of R2.',
    scenarioBoats: [
      { id: 'blue1', team: 'blue', label: 'B1', x: 195, y: 300, heading: 180 },
      { id: 'red1', team: 'red', label: 'R1', x: 190, y: 260, heading: 180 },
      { id: 'red2', team: 'red', label: 'R2', x: 210, y: 220, heading: 180 },
      { id: 'blue2', team: 'blue', label: 'B2', x: 200, y: 190, heading: 180 },
      { id: 'blue3', team: 'blue', label: 'B3', x: 230, y: 150, heading: 175 },
      { id: 'red3', team: 'red', label: 'R3', x: 280, y: 170, heading: 185 },
    ],
    scenarioMarks: WL_MARKS,
    scenarioAnnotations: [
      { text: 'Pass-back!', x: 115, y: 185, type: 'action' },
      { text: 'B1 slows to hold R1', x: 105, y: 295, type: 'action' },
      { text: 'B2 gybes to pass R2', x: 210, y: 170, type: 'info' },
    ],
    windDirection: 0,
  },
  {
    id: 'play-dial-up',
    call: 'Dial up!',
    category: 'play',
    meaning:
      'Luff the opponent. As the leeward boat, head up toward the wind to force the windward opponent above close-hauled, slowing both boats. This helps a trailing teammate catch up.',
    whenToUse:
      'Call when you are to leeward and slightly ahead of an opponent on the same tack upwind. Luffing them into the no-go zone dramatically reduces both boats\' speed, letting a teammate behind you gain ground.',
    example:
      'Upwind: B2 is to leeward of R2, both on starboard. B3 is behind. B3 calls "Dial up!" to B2, who then luffs R2 head-to-wind so B3 can sail past.',
  },
  {
    id: 'play-release',
    call: 'Release!',
    category: 'play',
    meaning:
      'Stop the current play and go fast. Release the hold, end the luff, or stop screening. Resume sailing at maximum speed.',
    whenToUse:
      'Call when the tactical play has achieved its objective (teammate has passed the opponent) or when continuing the play is no longer beneficial. The boat executing the play bears away or tacks to resume racing.',
    example:
      'B2 has been luffing R2 for 30 seconds. B3 passes R2. B3 calls "Release!" and B2 bears away to resume sailing to the windward mark.',
  },
];

// ---------------------------------------------------------------------------
// Position Calls
// ---------------------------------------------------------------------------

const POSITION_CALLS: TeamRacingCall[] = [
  {
    id: 'pos-youre-third',
    call: "You're third!",
    category: 'position',
    meaning:
      'Tells a specific teammate their current finishing position. Teammates often cannot see the full fleet from their vantage point.',
    whenToUse:
      'Call whenever a teammate may not know their position, especially after mark roundings, tacks, or position changes. Pair it with the teammate\'s name or boat number.',
    example:
      'After rounding the leeward mark, B1 can see the fleet. B1 calls to B2: "You\'re third!" so B2 knows their position in the overall order.',
  },
  {
    id: 'pos-r2-on-you',
    call: 'R2 is on you!',
    category: 'position',
    meaning:
      'Warns a teammate that a specific opponent is approaching them and threatening to pass. Identifies the threat by boat number.',
    whenToUse:
      'Call when you see an opponent closing on a teammate who may not be aware. This gives the teammate time to defend their position or prepare for a tactical response.',
    example:
      'B1 sees R2 approaching B3 from behind on the upwind leg. B1 calls "R2 is on you!" to B3 so B3 can cover or defend.',
    scenarioBoats: [
      { id: 'blue1', team: 'blue', label: 'B1', x: 170, y: 150, heading: 350 },
      { id: 'red1', team: 'red', label: 'R1', x: 240, y: 200, heading: 340 },
      { id: 'blue2', team: 'blue', label: 'B2', x: 160, y: 260, heading: 355 },
      { id: 'red2', team: 'red', label: 'R2', x: 225, y: 340, heading: 345 },
      { id: 'blue3', team: 'blue', label: 'B3', x: 195, y: 370, heading: 350 },
      { id: 'red3', team: 'red', label: 'R3', x: 290, y: 420, heading: 340 },
    ],
    scenarioMarks: WL_MARKS,
    scenarioAnnotations: [
      { text: 'R2 is on you!', x: 100, y: 365, type: 'warning' },
      { text: 'R2 closing on B3', x: 240, y: 320, type: 'warning' },
    ],
    windDirection: 0,
  },
  {
    id: 'pos-gap',
    call: 'Gap!',
    category: 'position',
    meaning:
      'There is an exploitable gap in the fleet. A space has opened between boats that a teammate can sail through to gain a position.',
    whenToUse:
      'Call when you see a lane opening between boats, often caused by a mark rounding, tack, or another team\'s tactical play. The teammate closest to the gap should move to exploit it.',
    example:
      'After the windward mark, R1 rounds wide leaving a gap between R1 and the mark. B2 calls "Gap!" and B3 sails through the gap to gain a position.',
  },
  {
    id: 'pos-inside',
    call: 'Inside!',
    category: 'position',
    meaning:
      'I am (or should be) taking the inside position at the upcoming mark rounding. Establishes priority for mark room.',
    whenToUse:
      'Call when approaching a mark with overlapping boats. Claiming the inside early helps teammates coordinate who rounds first and who gives room. Also used to alert an opponent that you have an inside overlap.',
    example:
      'Approaching the leeward gate, B2 has established an inside overlap on R1. B2 calls "Inside!" to claim mark room and let teammates know the rounding order.',
  },
];

// ---------------------------------------------------------------------------
// Situational Calls
// ---------------------------------------------------------------------------

const SITUATIONAL_CALLS: TeamRacingCall[] = [
  {
    id: 'sit-protect',
    call: 'Protect!',
    category: 'situational',
    meaning:
      'We are in a winning combination. Defend your current position. Do not take risks or engage in aggressive plays that could backfire.',
    whenToUse:
      'Call when the team is winning and needs to maintain the status quo. Every teammate should focus on covering their nearest opponent and avoiding situations where a position swap could occur.',
    example:
      'Blue is 1-2-5 on the final upwind leg. B1 calls "Protect!" so B2 covers R1 instead of trying to extend the lead, and B3 stays close to R2.',
    scenarioBoats: [
      { id: 'blue1', team: 'blue', label: 'B1', x: 175, y: 200, heading: 350 },
      { id: 'blue2', team: 'blue', label: 'B2', x: 210, y: 240, heading: 345 },
      { id: 'red1', team: 'red', label: 'R1', x: 240, y: 280, heading: 340 },
      { id: 'red2', team: 'red', label: 'R2', x: 170, y: 330, heading: 355 },
      { id: 'blue3', team: 'blue', label: 'B3', x: 200, y: 370, heading: 348 },
      { id: 'red3', team: 'red', label: 'R3', x: 280, y: 410, heading: 340 },
    ],
    scenarioMarks: WL_MARKS,
    scenarioAnnotations: [
      { text: '1-2-5 = winning', x: 50, y: 30, type: 'info' },
      { text: 'Protect!', x: 100, y: 195, type: 'action' },
      { text: 'B2 covers R1', x: 250, y: 260, type: 'info' },
      { text: 'B3 stays near R2', x: 105, y: 350, type: 'info' },
    ],
    windDirection: 0,
  },
  {
    id: 'sit-go-go-go',
    call: 'Go go go!',
    category: 'situational',
    meaning:
      'Speed is the priority right now. Stop any tactical engagement and sail as fast as possible to the next mark or the finish.',
    whenToUse:
      'Call when a teammate is wasting time on a play that is no longer needed, or when the race is nearing the finish and raw speed will determine the outcome. Also used after a penalty turn to remind a teammate to accelerate.',
    example:
      'B2 is still screening R2 but B3 has already passed. B1 calls "Go go go!" to tell B2 the screen is done and they need to catch up.',
  },
  {
    id: 'sit-no-risk',
    call: 'No risk!',
    category: 'situational',
    meaning:
      'We are winning comfortably. Do not engage in any aggressive plays, crosses, or maneuvers that carry risk. Sail conservatively to the finish.',
    whenToUse:
      'Call when the team has a solid winning combination with margin (e.g., 1-2-4 or better). The goal is to close out the race without giving the opponent any opportunities. Avoid close crosses, tight mark roundings, and tacking duels.',
    example:
      'Blue is 1-2-4 (total 7) approaching the final downwind leg. B1 calls "No risk!" so teammates sail clean lanes to the finish without engaging opponents.',
    scenarioBoats: [
      { id: 'blue1', team: 'blue', label: 'B1', x: 180, y: 200, heading: 180 },
      { id: 'blue2', team: 'blue', label: 'B2', x: 220, y: 240, heading: 175 },
      { id: 'red1', team: 'red', label: 'R1', x: 260, y: 280, heading: 170 },
      { id: 'blue3', team: 'blue', label: 'B3', x: 150, y: 290, heading: 185 },
      { id: 'red2', team: 'red', label: 'R2', x: 290, y: 340, heading: 175 },
      { id: 'red3', team: 'red', label: 'R3', x: 200, y: 380, heading: 180 },
    ],
    scenarioMarks: WL_MARKS,
    scenarioAnnotations: [
      { text: '1-2-4 = strong win', x: 50, y: 30, type: 'info' },
      { text: 'No risk!', x: 100, y: 195, type: 'action' },
      { text: 'Sail clean to finish', x: 50, y: 560, type: 'info' },
    ],
    windDirection: 0,
  },
  {
    id: 'sit-we-need-one',
    call: 'We need one!',
    category: 'situational',
    meaning:
      'Our team is one position swap away from winning. We need to gain exactly one place to flip the combination from a loss to a win.',
    whenToUse:
      'Call when the team total is 11 (one over the winning threshold of 10). This focuses the team on finding the single best swap. Every teammate should assess: can I pass the boat ahead of me, or can I help a teammate pass their opponent?',
    example:
      'Blue is 1-4-6 (total 11). B1 calls "We need one!" B2 in 4th tries to pass R1 in 3rd, which would give 1-3-6 = 10 and a win.',
    scenarioBoats: [
      { id: 'blue1', team: 'blue', label: 'B1', x: 180, y: 180, heading: 350 },
      { id: 'red1', team: 'red', label: 'R1', x: 220, y: 230, heading: 340 },
      { id: 'red2', team: 'red', label: 'R2', x: 170, y: 270, heading: 355 },
      { id: 'blue2', team: 'blue', label: 'B2', x: 240, y: 310, heading: 340 },
      { id: 'red3', team: 'red', label: 'R3', x: 200, y: 360, heading: 350 },
      { id: 'blue3', team: 'blue', label: 'B3', x: 270, y: 410, heading: 340 },
    ],
    scenarioMarks: WL_MARKS,
    scenarioAnnotations: [
      { text: '1+4+6 = 11 (LOSE by 1)', x: 50, y: 30, type: 'warning' },
      { text: 'We need one!', x: 100, y: 175, type: 'action' },
      { text: 'B2 targets R2 in 3rd', x: 245, y: 290, type: 'info' },
      { text: 'One swap wins it', x: 50, y: 560, type: 'info' },
    ],
    windDirection: 0,
  },
];

// ---------------------------------------------------------------------------
// Combined Exports
// ---------------------------------------------------------------------------

export const TEAM_RACING_CALLS: TeamRacingCall[] = [
  ...COMBINATION_CALLS,
  ...PLAY_CALLS,
  ...POSITION_CALLS,
  ...SITUATIONAL_CALLS,
];

export const CALLS_BY_CATEGORY: Record<CallCategory, TeamRacingCall[]> = {
  combination: COMBINATION_CALLS,
  play: PLAY_CALLS,
  position: POSITION_CALLS,
  situational: SITUATIONAL_CALLS,
};

export const COMMS_OVERVIEW = {
  title: 'Team Racing Communication',
  description:
    'Communication is the backbone of team racing. Unlike fleet racing where each boat sails independently, team racing requires constant coordination between three teammates. Effective calls must be loud, clear, and concise. The best teams develop a shared vocabulary that allows instant recognition of the race situation and the required tactical response. These calls cover four essential areas: knowing the current combination, initiating tactical plays, relaying position information, and managing overall race strategy.',
};

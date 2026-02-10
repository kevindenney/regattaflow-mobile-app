/**
 * Team Racing Tactics - Lesson Data
 * Animated visualizations of key team racing tactical plays
 *
 * This lesson covers:
 * - Mark traps (windward and leeward)
 * - Dial-up and dial-down maneuvers
 * - Pass-back plays
 * - Screening tactics
 *
 * Course layout: Windward-Leeward with wind from the top (0 degrees).
 * Canvas coordinate space: x 0-400, y 0-600.
 * Windward mark at (200, 80), leeward mark at (200, 520).
 *
 * Team racing scoring: 3 boats per team, lowest combined score wins.
 * Winning combinations include 1-2-4, 1-2-5, 1-2-6, 1-3-4, 1-3-5, 2-3-4.
 */

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export type TacticalPlayType =
  | 'mark-trap'
  | 'slow-up'
  | 'dial-up'
  | 'dial-down'
  | 'pass-back'
  | 'screen';

export interface BoatPosition {
  id: string;
  team: 'blue' | 'red';
  label: string;
  x: number;
  y: number;
  heading: number;
}

export interface TacticalStep {
  description: string;
  boats: BoatPosition[];
  marks: { x: number; y: number; type: 'windward' | 'leeward' | 'gate' }[];
  windDirection: number;
  annotations: {
    text: string;
    x: number;
    y: number;
    type: 'action' | 'info' | 'warning';
  }[];
  activeBoat: string | null;
}

export interface TacticalPlay {
  id: string;
  type: TacticalPlayType;
  title: string;
  description: string;
  phase: string;
  objective: string;
  combinationBefore: string;
  combinationAfter: string;
  steps: TacticalStep[];
  keyRules: string[];
  proTip: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// ---------------------------------------------------------------------------
// Course Marks
// ---------------------------------------------------------------------------

const WINDWARD_LEEWARD_MARKS: TacticalStep['marks'] = [
  { x: 200, y: 80, type: 'windward' },
  { x: 200, y: 520, type: 'leeward' },
];

// ---------------------------------------------------------------------------
// Mark Trap Plays
// ---------------------------------------------------------------------------

export const MARK_TRAP_PLAYS: TacticalPlay[] = [
  // ======================== WINDWARD MARK TRAP ========================
  {
    id: 'windward-mark-trap',
    type: 'mark-trap',
    title: 'Windward Mark Trap',
    description:
      'The lead blue boat (position 1) deliberately slows before the windward mark, allowing a trailing teammate to round inside an opponent and steal a position.',
    phase: 'Top Mark',
    objective:
      'Convert a losing 1-3-5 combination into a winning 1-2-5 by trapping an opponent at the windward mark.',
    combinationBefore: '1-3-5',
    combinationAfter: '1-2-5',
    difficulty: 'intermediate',
    keyRules: [
      'The boat clear ahead may slow down but cannot tack or bear away to obstruct.',
      'Mark room (Rule 18) applies once boats are in the zone (3 boat-lengths).',
      'An inside overlapped boat is entitled to mark room.',
      'The trapping boat must give room if an overlap is established before the zone.',
    ],
    proTip:
      'Timing is everything. The lead boat should begin to slow subtly one to two boat-lengths before the zone so the trapped opponent cannot accelerate around.',
    steps: [
      // Step 1: Approach
      {
        description:
          'Boats approach the windward mark on starboard tack. Blue1 leads (position 1), Red1 is in second (position 2), and Blue2 trails close behind Red1 (position 3).',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 170, y: 200, heading: 0 },
          { id: 'red1', team: 'red', label: 'R1', x: 180, y: 260, heading: 0 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 190, y: 310, heading: 0 },
          { id: 'red2', team: 'red', label: 'R2', x: 280, y: 350, heading: 345 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 120, y: 420, heading: 10 },
          { id: 'red3', team: 'red', label: 'R3', x: 300, y: 440, heading: 350 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'Order: B1 - R1 - B2', x: 50, y: 30, type: 'info' },
          { text: 'Wind', x: 360, y: 20, type: 'info' },
        ],
        activeBoat: null,
      },
      // Step 2: Lead boat slows
      {
        description:
          'Blue1 eases sails and slows down before the zone. Red1 is forced to slow or try to pass, compressing the gap. Blue2 positions to windward of Red1.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 175, y: 160, heading: 0 },
          { id: 'red1', team: 'red', label: 'R1', x: 185, y: 195, heading: 0 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 210, y: 220, heading: 355 },
          { id: 'red2', team: 'red', label: 'R2', x: 280, y: 310, heading: 345 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 125, y: 380, heading: 10 },
          { id: 'red3', team: 'red', label: 'R3', x: 300, y: 400, heading: 350 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'B1 slows!', x: 95, y: 155, type: 'action' },
          { text: 'B2 gains overlap to windward', x: 230, y: 215, type: 'action' },
          { text: 'R1 compressed', x: 105, y: 195, type: 'warning' },
        ],
        activeBoat: 'blue1',
      },
      // Step 3: Zone entry & rounding
      {
        description:
          'All three boats enter the zone. Blue2 now has an inside overlap on Red1. Blue1 rounds the mark first and bears away. Blue2 rounds inside Red1, taking second.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 220, y: 100, heading: 135 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 210, y: 120, heading: 45 },
          { id: 'red1', team: 'red', label: 'R1', x: 195, y: 140, heading: 10 },
          { id: 'red2', team: 'red', label: 'R2', x: 280, y: 275, heading: 345 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 130, y: 340, heading: 10 },
          { id: 'red3', team: 'red', label: 'R3', x: 300, y: 360, heading: 350 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'B2 rounds inside!', x: 230, y: 115, type: 'action' },
          { text: 'R1 forced wide', x: 115, y: 140, type: 'warning' },
          { text: 'Zone (3 boat-lengths)', x: 60, y: 80, type: 'info' },
        ],
        activeBoat: 'blue2',
      },
      // Step 4: New order established
      {
        description:
          'After the windward mark, the new order is Blue1, Blue2, Red1. The combination has improved from 1-3-5 to 1-2-5, a winning combination.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 240, y: 170, heading: 160 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 225, y: 140, heading: 155 },
          { id: 'red1', team: 'red', label: 'R1', x: 210, y: 115, heading: 150 },
          { id: 'red2', team: 'red', label: 'R2', x: 280, y: 240, heading: 345 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 135, y: 310, heading: 10 },
          { id: 'red3', team: 'red', label: 'R3', x: 300, y: 330, heading: 350 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'New order: B1 - B2 - R1', x: 50, y: 30, type: 'info' },
          { text: '1-2-5 = winning!', x: 280, y: 30, type: 'info' },
        ],
        activeBoat: null,
      },
    ],
  },

  // ======================== LEEWARD MARK TRAP ========================
  {
    id: 'leeward-mark-trap',
    type: 'mark-trap',
    title: 'Leeward Mark Trap',
    description:
      'A leading blue boat slows on the downwind approach to the leeward mark, letting a teammate establish an inside overlap on an opponent before the zone.',
    phase: 'Bottom Mark',
    objective:
      'Trap an opponent wide at the leeward mark to gain or protect a position for a teammate.',
    combinationBefore: '1-3-5',
    combinationAfter: '1-2-5',
    difficulty: 'intermediate',
    keyRules: [
      'Inside overlap must be established before the first boat enters the zone.',
      'The outside boat must give mark room to the inside boat (Rule 18.2).',
      'A boat without an overlap astern must give mark room to a boat ahead.',
      'Proper course is relevant after rounding the mark.',
    ],
    proTip:
      'On the downwind leg, steer slightly high of the direct course to the mark. This creates room for your teammate to dive inside the opponent at the last moment.',
    steps: [
      // Step 1: Downwind approach
      {
        description:
          'Boats sail downwind toward the leeward mark. Blue1 leads (position 1), Red1 is second, and Blue2 is close behind Red1.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 190, y: 380, heading: 180 },
          { id: 'red1', team: 'red', label: 'R1', x: 200, y: 340, heading: 180 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 175, y: 305, heading: 185 },
          { id: 'red2', team: 'red', label: 'R2', x: 280, y: 250, heading: 175 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 120, y: 200, heading: 170 },
          { id: 'red3', team: 'red', label: 'R3', x: 310, y: 220, heading: 185 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'Approaching leeward mark', x: 50, y: 560, type: 'info' },
          { text: 'Order: B1 - R1 - B2', x: 50, y: 30, type: 'info' },
        ],
        activeBoat: null,
      },
      // Step 2: Slow and compress
      {
        description:
          'Blue1 slows near the zone, compressing the fleet. Blue2 works to leeward of Red1 to establish an inside overlap before the zone.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 195, y: 450, heading: 180 },
          { id: 'red1', team: 'red', label: 'R1', x: 205, y: 420, heading: 180 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 175, y: 410, heading: 190 },
          { id: 'red2', team: 'red', label: 'R2', x: 280, y: 290, heading: 175 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 125, y: 240, heading: 170 },
          { id: 'red3', team: 'red', label: 'R3', x: 310, y: 260, heading: 185 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'B1 slows!', x: 115, y: 450, type: 'action' },
          { text: 'B2 dives inside R1', x: 90, y: 410, type: 'action' },
          { text: 'R1 squeezed', x: 225, y: 420, type: 'warning' },
        ],
        activeBoat: 'blue1',
      },
      // Step 3: Rounding
      {
        description:
          'Blue1 rounds the leeward mark and heads upwind. Blue2, with an inside overlap, rounds ahead of Red1. Red1 is forced to go wide around both blue boats.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 180, y: 530, heading: 350 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 190, y: 505, heading: 340 },
          { id: 'red1', team: 'red', label: 'R1', x: 230, y: 510, heading: 320 },
          { id: 'red2', team: 'red', label: 'R2', x: 280, y: 330, heading: 175 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 130, y: 270, heading: 170 },
          { id: 'red3', team: 'red', label: 'R3', x: 310, y: 300, heading: 185 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'B2 rounds inside!', x: 100, y: 505, type: 'action' },
          { text: 'R1 forced wide', x: 250, y: 510, type: 'warning' },
          { text: 'New order: B1 - B2 - R1', x: 50, y: 30, type: 'info' },
        ],
        activeBoat: 'blue2',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Dial Plays
// ---------------------------------------------------------------------------

export const DIAL_PLAYS: TacticalPlay[] = [
  // ======================== DIAL-UP ========================
  {
    id: 'dial-up',
    type: 'dial-up',
    title: 'Dial-Up',
    description:
      'A blue boat to leeward luffs an opponent upwind, forcing them above close-hauled course and slowing both boats. This allows a trailing teammate to catch up or pass.',
    phase: 'Upwind',
    objective:
      'Slow an opponent on the upwind leg by luffing them head-to-wind, creating an opportunity for a trailing teammate.',
    combinationBefore: '1-4-5',
    combinationAfter: '1-3-5',
    difficulty: 'intermediate',
    keyRules: [
      'A leeward boat may luff a windward boat (Rule 11).',
      'The leeward boat must give the windward boat room to keep clear (Rule 16.1).',
      'If the leeward boat passed head-to-wind, luffing rights may be limited after the start.',
      'The windward boat must keep clear at all times.',
    ],
    proTip:
      'Start the luff gradually. A sudden luff can cause a collision and earn you a penalty. The goal is to push them into the no-go zone where their speed drops dramatically.',
    steps: [
      // Step 1: Setup
      {
        description:
          'Blue2 is sailing upwind on starboard tack to leeward and slightly ahead of Red2. Blue3 trails behind. Blue2 decides to luff Red2 to help Blue3 gain a position.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 160, y: 150, heading: 350 },
          { id: 'red1', team: 'red', label: 'R1', x: 250, y: 170, heading: 345 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 150, y: 310, heading: 350 },
          { id: 'red2', team: 'red', label: 'R2', x: 180, y: 300, heading: 350 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 200, y: 380, heading: 345 },
          { id: 'red3', team: 'red', label: 'R3', x: 300, y: 400, heading: 340 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'B2 to leeward of R2', x: 60, y: 305, type: 'info' },
          { text: 'B3 trails in 5th', x: 220, y: 375, type: 'info' },
        ],
        activeBoat: null,
      },
      // Step 2: Luffing
      {
        description:
          'Blue2 luffs sharply, turning toward the wind. Red2, as the windward boat, is obligated to keep clear and must also head up. Both boats slow dramatically as they approach head-to-wind.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 155, y: 120, heading: 350 },
          { id: 'red1', team: 'red', label: 'R1', x: 245, y: 140, heading: 345 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 155, y: 270, heading: 330 },
          { id: 'red2', team: 'red', label: 'R2', x: 180, y: 265, heading: 325 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 195, y: 330, heading: 345 },
          { id: 'red3', team: 'red', label: 'R3', x: 295, y: 360, heading: 340 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'B2 luffs!', x: 80, y: 265, type: 'action' },
          { text: 'R2 must keep clear', x: 195, y: 255, type: 'warning' },
          { text: 'Both boats slowing', x: 100, y: 290, type: 'info' },
          { text: 'B3 gaining!', x: 215, y: 325, type: 'action' },
        ],
        activeBoat: 'blue2',
      },
      // Step 3: Teammate passes
      {
        description:
          'While Blue2 holds Red2 in the luff, Blue3 sails past both boats at full speed. Blue2 then bears away to resume racing. Red2 has lost a place to Blue3.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 150, y: 90, heading: 350 },
          { id: 'red1', team: 'red', label: 'R1', x: 240, y: 110, heading: 345 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 190, y: 260, heading: 345 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 160, y: 255, heading: 340 },
          { id: 'red2', team: 'red', label: 'R2', x: 185, y: 250, heading: 335 },
          { id: 'red3', team: 'red', label: 'R3', x: 290, y: 320, heading: 340 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'B3 passes R2!', x: 210, y: 255, type: 'action' },
          { text: 'R2 drops to 5th', x: 110, y: 240, type: 'warning' },
          { text: '1-3-5 achieved', x: 50, y: 30, type: 'info' },
        ],
        activeBoat: 'blue3',
      },
    ],
  },

  // ======================== DIAL-DOWN ========================
  {
    id: 'dial-down',
    type: 'dial-down',
    title: 'Dial-Down',
    description:
      'A blue boat bears off aggressively in front of an opponent on the downwind leg, forcing them below their optimal VMG angle and slowing their progress toward the leeward mark.',
    phase: 'Downwind',
    objective:
      'Slow an opponent downwind by stealing their wind and forcing them into a poor sailing angle, helping a teammate gain ground.',
    combinationBefore: '2-3-6',
    combinationAfter: '2-3-4',
    difficulty: 'advanced',
    keyRules: [
      'A boat clear ahead can change course, but must give the boat astern room to keep clear (Rule 16).',
      'A leeward boat can sail any course downwind as long as it gives the windward boat room to keep clear.',
      'If boats are on the same tack, a windward boat must keep clear (Rule 11).',
      'Proper course is not a limitation before clearing the starting mark.',
    ],
    proTip:
      'Position yourself just to windward and ahead of the target. Bear away smoothly so your sail blocks their wind. The goal is to push them deeper than optimal VMG angle, not necessarily to pass them yourself.',
    steps: [
      // Step 1: Setup downwind
      {
        description:
          'Blue3 (position 5) is sailing downwind, slightly ahead and to windward of Red2 (position 4). Blue3 prepares to bear away and blanket Red2.',
        boats: [
          { id: 'red1', team: 'red', label: 'R1', x: 160, y: 220, heading: 170 },
          { id: 'blue1', team: 'blue', label: 'B1', x: 220, y: 240, heading: 175 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 140, y: 280, heading: 180 },
          { id: 'red2', team: 'red', label: 'R2', x: 240, y: 310, heading: 175 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 260, y: 290, heading: 170 },
          { id: 'red3', team: 'red', label: 'R3', x: 310, y: 360, heading: 185 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'R2 in 4th, B3 in 5th', x: 50, y: 30, type: 'info' },
          { text: 'B3 plans to dial-down R2', x: 270, y: 270, type: 'info' },
        ],
        activeBoat: null,
      },
      // Step 2: Bearing away
      {
        description:
          'Blue3 bears away aggressively, positioning directly upwind of Red2 and blanketing their sail. Red2 loses pressure and is forced to bear away deeper to find clean air.',
        boats: [
          { id: 'red1', team: 'red', label: 'R1', x: 155, y: 270, heading: 170 },
          { id: 'blue1', team: 'blue', label: 'B1', x: 215, y: 290, heading: 175 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 135, y: 330, heading: 180 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 245, y: 350, heading: 195 },
          { id: 'red2', team: 'red', label: 'R2', x: 255, y: 380, heading: 200 },
          { id: 'red3', team: 'red', label: 'R3', x: 310, y: 410, heading: 185 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'B3 bears away!', x: 160, y: 345, type: 'action' },
          { text: 'R2 in dirty air', x: 270, y: 375, type: 'warning' },
          { text: 'Wind shadow', x: 250, y: 335, type: 'info' },
        ],
        activeBoat: 'blue3',
      },
      // Step 3: Opponent drops
      {
        description:
          'Red2 falls deep below optimal VMG angle and loses distance to the leeward mark. Red3 passes Red2, and Blue3 releases to resume sailing. The combination shifts to 2-3-4 for Blue.',
        boats: [
          { id: 'red1', team: 'red', label: 'R1', x: 150, y: 330, heading: 170 },
          { id: 'blue1', team: 'blue', label: 'B1', x: 210, y: 340, heading: 175 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 130, y: 380, heading: 180 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 240, y: 410, heading: 180 },
          { id: 'red3', team: 'red', label: 'R3', x: 310, y: 450, heading: 185 },
          { id: 'red2', team: 'red', label: 'R2', x: 280, y: 470, heading: 210 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'R2 drops to 6th!', x: 290, y: 460, type: 'warning' },
          { text: '2-3-4 = winning!', x: 50, y: 30, type: 'info' },
          { text: 'B3 releases', x: 160, y: 405, type: 'action' },
        ],
        activeBoat: 'blue3',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Pass-Back & Screen Plays
// ---------------------------------------------------------------------------

export const PASS_BACK_PLAYS: TacticalPlay[] = [
  // ======================== DOWNWIND PASS-BACK ========================
  {
    id: 'downwind-pass-back',
    type: 'pass-back',
    title: 'Downwind Pass-Back',
    description:
      'A leading blue boat deliberately slows to create a gap, allowing a trailing teammate to gybe in front of an opponent and pass them.',
    phase: 'Downwind',
    objective:
      'Create an opening for a trailing teammate to pass an opponent by disrupting the racing order on the downwind leg.',
    combinationBefore: '1-4-5',
    combinationAfter: '1-2-6',
    difficulty: 'advanced',
    keyRules: [
      'A boat changing course must give other boats room to keep clear (Rule 16).',
      'On a free leg, port gives way to starboard (Rule 10).',
      'A gybing boat must keep clear of boats on a tack (Rule 13).',
      'When two boats are on the same tack, the windward boat keeps clear (Rule 11).',
    ],
    proTip:
      'Communication between teammates is critical. The lead boat should signal when they are creating the gap. The trailing teammate must time their gybe to arrive just as the gap opens.',
    steps: [
      // Step 1: Downwind order
      {
        description:
          'On the downwind leg, Blue1 leads in first. Red1 is second, Red2 third, Blue2 fourth, and Blue3 fifth. Blue needs to improve their combination.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 200, y: 250, heading: 180 },
          { id: 'red1', team: 'red', label: 'R1', x: 190, y: 210, heading: 180 },
          { id: 'red2', team: 'red', label: 'R2', x: 210, y: 175, heading: 180 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 195, y: 145, heading: 180 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 220, y: 115, heading: 175 },
          { id: 'red3', team: 'red', label: 'R3', x: 280, y: 130, heading: 185 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'Order: B1-R1-R2-B2-B3', x: 50, y: 30, type: 'info' },
          { text: '1-4-5 = losing', x: 300, y: 30, type: 'warning' },
        ],
        activeBoat: null,
      },
      // Step 2: Lead boat slows, creates gap
      {
        description:
          'Blue1 slows in front of Red1, compressing the gap to Red1 while creating space behind Blue1. Blue2 starts to gybe toward the gap between Blue1 and Red2.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 195, y: 300, heading: 180 },
          { id: 'red1', team: 'red', label: 'R1', x: 190, y: 280, heading: 180 },
          { id: 'red2', team: 'red', label: 'R2', x: 210, y: 240, heading: 180 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 150, y: 230, heading: 200 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 220, y: 190, heading: 175 },
          { id: 'red3', team: 'red', label: 'R3', x: 280, y: 200, heading: 185 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'B1 slows!', x: 115, y: 300, type: 'action' },
          { text: 'B2 gybes toward gap', x: 55, y: 225, type: 'action' },
          { text: 'R1 stacked behind B1', x: 110, y: 275, type: 'warning' },
        ],
        activeBoat: 'blue1',
      },
      // Step 3: Pass-back executed
      {
        description:
          'Blue2 completes the gybe and slides into position ahead of Red2. Blue1 continues to hold Red1 behind. The order begins to shift.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 190, y: 360, heading: 180 },
          { id: 'red1', team: 'red', label: 'R1', x: 185, y: 340, heading: 180 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 175, y: 310, heading: 175 },
          { id: 'red2', team: 'red', label: 'R2', x: 210, y: 300, heading: 180 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 225, y: 260, heading: 175 },
          { id: 'red3', team: 'red', label: 'R3', x: 280, y: 265, heading: 185 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'B2 passes R2!', x: 90, y: 305, type: 'action' },
          { text: 'R1 still held', x: 110, y: 340, type: 'warning' },
        ],
        activeBoat: 'blue2',
      },
      // Step 4: New combination
      {
        description:
          'Blue1 releases Red1 and accelerates. The new order is Blue1, Blue2, Red1, Red2, Blue3, Red3. The combination is now 1-2-6, a winning result.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 185, y: 420, heading: 180 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 180, y: 385, heading: 178 },
          { id: 'red1', team: 'red', label: 'R1', x: 195, y: 355, heading: 180 },
          { id: 'red2', team: 'red', label: 'R2', x: 215, y: 330, heading: 180 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 230, y: 305, heading: 175 },
          { id: 'red3', team: 'red', label: 'R3', x: 280, y: 310, heading: 185 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'New order: B1-B2-R1-R2-B3-R3', x: 30, y: 30, type: 'info' },
          { text: '1-2-6 = winning!', x: 300, y: 30, type: 'info' },
        ],
        activeBoat: null,
      },
    ],
  },

  // ======================== SCREEN PLAY ========================
  {
    id: 'screen-play',
    type: 'screen',
    title: 'Screen Play',
    description:
      'A blue boat positions itself between the wind and an opponent to steal their wind (dirty air), slowing the opponent so a teammate can gain ground or hold position.',
    phase: 'Upwind',
    objective:
      'Use wind shadow (dirty air) to slow a trailing opponent, protecting a teammate who is ahead or allowing another teammate to catch up.',
    combinationBefore: '1-2-5',
    combinationAfter: '1-2-4',
    difficulty: 'beginner',
    keyRules: [
      'There is no rule against sailing in another boat\'s wind shadow; it is a legitimate tactic.',
      'The screening boat must still obey right-of-way rules.',
      'On the same tack, the windward boat keeps clear (Rule 11).',
      'A boat tacking must keep clear (Rule 13) until on close-hauled course.',
    ],
    proTip:
      'Position yourself one to two boat-lengths directly upwind of the opponent. Your sail turbulence extends roughly 5-7 boat-lengths behind you. Even a slight misalignment will let clean air reach them.',
    steps: [
      // Step 1: Setup
      {
        description:
          'Blue3 is in 5th place. Blue2 (3rd) tacks to position directly upwind of Red2 (4th). If Red2 slows enough, Blue3 can pass into 4th.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 150, y: 150, heading: 350 },
          { id: 'red1', team: 'red', label: 'R1', x: 240, y: 180, heading: 345 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 200, y: 270, heading: 350 },
          { id: 'red2', team: 'red', label: 'R2', x: 210, y: 330, heading: 350 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 180, y: 390, heading: 355 },
          { id: 'red3', team: 'red', label: 'R3', x: 300, y: 410, heading: 340 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'B2 positions upwind of R2', x: 50, y: 260, type: 'info' },
          { text: 'R2 in 4th, B3 in 5th', x: 50, y: 30, type: 'info' },
        ],
        activeBoat: null,
      },
      // Step 2: Screening
      {
        description:
          'Blue2 is now directly upwind of Red2, casting dirty air onto their sails. Red2 slows significantly while Blue3 continues at full speed in clean air.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 145, y: 120, heading: 350 },
          { id: 'red1', team: 'red', label: 'R1', x: 235, y: 145, heading: 345 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 205, y: 240, heading: 350 },
          { id: 'red2', team: 'red', label: 'R2', x: 210, y: 310, heading: 350 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 178, y: 340, heading: 355 },
          { id: 'red3', team: 'red', label: 'R3', x: 295, y: 375, heading: 340 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'Dirty air!', x: 225, y: 280, type: 'warning' },
          { text: 'B2 screening R2', x: 120, y: 235, type: 'action' },
          { text: 'R2 slowing in turbulence', x: 225, y: 310, type: 'warning' },
          { text: 'B3 gains in clean air', x: 85, y: 335, type: 'action' },
        ],
        activeBoat: 'blue2',
      },
      // Step 3: Teammate passes
      {
        description:
          'Blue3 catches and passes Red2 who is stuck in dirty air. Blue2 can now tack away, having accomplished the screen. Blue has 1-2-4, a comfortable winning combination.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 140, y: 90, heading: 350 },
          { id: 'red1', team: 'red', label: 'R1', x: 230, y: 115, heading: 345 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 200, y: 205, heading: 350 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 175, y: 280, heading: 355 },
          { id: 'red2', team: 'red', label: 'R2', x: 215, y: 295, heading: 350 },
          { id: 'red3', team: 'red', label: 'R3', x: 290, y: 340, heading: 340 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'B3 passes R2!', x: 100, y: 280, type: 'action' },
          { text: 'R2 drops to 5th', x: 230, y: 290, type: 'warning' },
          { text: '1-2-4 = winning!', x: 50, y: 30, type: 'info' },
        ],
        activeBoat: 'blue3',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Combined Export
// ---------------------------------------------------------------------------

export const ALL_TACTICAL_PLAYS: TacticalPlay[] = [
  ...MARK_TRAP_PLAYS,
  ...DIAL_PLAYS,
  ...PASS_BACK_PLAYS,
];

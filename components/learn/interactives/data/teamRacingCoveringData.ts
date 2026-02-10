/**
 * Team Racing Covering & Defense - Lesson Data
 * Defensive covering and pairing scenarios for protecting a winning combination.
 *
 * This lesson covers:
 * - Tight cover (tacking on an opponent to keep them behind)
 * - Loose cover (staying between opponent and mark without mirroring every move)
 * - Pairing strategy (each blue boat covers a specific red boat)
 * - Downwind defense (blocking opponents from passing on the run)
 * - Finish line protection (covering moves approaching the finish)
 *
 * Course layout: Windward-Leeward with wind from the top (0 degrees).
 * Canvas coordinate space: x 0-400, y 0-600.
 * Windward mark at (200, 80), leeward mark at (200, 520).
 *
 * Blue team boats: B1, B2, B3. Red team boats: R1, R2, R3.
 */

import { type TacticalStep } from './teamRacingTacticsData';

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export type DefensivePlayType =
  | 'tight-cover'
  | 'loose-cover'
  | 'pairing'
  | 'downwind-defense'
  | 'finish-protection';

export interface DefensivePlay {
  id: string;
  type: DefensivePlayType;
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
// Defensive Plays
// ---------------------------------------------------------------------------

export const DEFENSIVE_PLAYS: DefensivePlay[] = [
  // ======================== 1. TIGHT COVER (Beginner) ========================
  {
    id: 'tight-cover',
    type: 'tight-cover',
    title: 'Tight Cover',
    description:
      'Blue is winning 1-2-5. B1 tightly covers R1 (3rd) on the upwind leg by tacking directly on top of them every time they tack. This keeps R1 pinned in dirty air and unable to advance.',
    phase: 'Upwind',
    objective:
      'Keep R1 (3rd place) behind B1 by tacking on them every time they try to escape, maintaining the 1-2-5 winning combination.',
    combinationBefore: '1-2-5',
    combinationAfter: '1-2-5',
    difficulty: 'beginner',
    keyRules: [
      'A boat tacking must keep clear of other boats until on a close-hauled course (Rule 13).',
      'The covering boat must complete the tack before the other boat needs to keep clear.',
      'Port gives way to starboard (Rule 10) after both boats complete their tacks.',
      'The covering boat must give room when changing course (Rule 16.1).',
    ],
    proTip:
      'When tight covering, aim to complete your tack one to two boat-lengths directly upwind of the opponent. Too close and you risk fouling during the tack; too far and they can escape to the side.',
    steps: [
      // Step 1: Setup
      {
        description:
          'Blue is winning 1-2-5. B1 leads in first, R1 is in third. B1 decides to tight-cover R1 to prevent them from gaining on B2.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 175, y: 190, heading: 350 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 230, y: 220, heading: 345 },
          { id: 'red1', team: 'red', label: 'R1', x: 180, y: 270, heading: 355 },
          { id: 'red2', team: 'red', label: 'R2', x: 260, y: 310, heading: 340 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 145, y: 380, heading: 10 },
          { id: 'red3', team: 'red', label: 'R3', x: 290, y: 400, heading: 350 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'Blue: 1-2-5 = 8 (winning)', x: 50, y: 30, type: 'info' },
          { text: 'B1 targets R1 for tight cover', x: 50, y: 185, type: 'action' },
        ],
        activeBoat: 'blue1',
      },
      // Step 2: B1 positions upwind
      {
        description:
          'B1 tacks and positions directly upwind of R1, casting dirty air onto R1\'s sails. R1 is slowed and tries to escape by tacking to port.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 185, y: 230, heading: 350 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 225, y: 195, heading: 345 },
          { id: 'red1', team: 'red', label: 'R1', x: 185, y: 260, heading: 350 },
          { id: 'red2', team: 'red', label: 'R2', x: 255, y: 285, heading: 340 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 148, y: 355, heading: 10 },
          { id: 'red3', team: 'red', label: 'R3', x: 288, y: 375, heading: 350 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'B1 directly upwind of R1', x: 95, y: 225, type: 'action' },
          { text: 'R1 in dirty air!', x: 205, y: 260, type: 'warning' },
          { text: 'R1 tacks to escape', x: 205, y: 280, type: 'info' },
        ],
        activeBoat: 'blue1',
      },
      // Step 3: R1 tacks, B1 follows
      {
        description:
          'R1 tacks to port to try to find clean air. B1 immediately tacks to cover, positioning upwind of R1 again. R1 is stuck.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 165, y: 210, heading: 30 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 220, y: 170, heading: 345 },
          { id: 'red1', team: 'red', label: 'R1', x: 155, y: 240, heading: 35 },
          { id: 'red2', team: 'red', label: 'R2', x: 250, y: 260, heading: 340 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 152, y: 330, heading: 10 },
          { id: 'red3', team: 'red', label: 'R3', x: 285, y: 350, heading: 350 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'B1 tacks to follow!', x: 70, y: 205, type: 'action' },
          { text: 'R1 still covered', x: 70, y: 240, type: 'warning' },
          { text: 'B2 extends freely', x: 235, y: 165, type: 'info' },
        ],
        activeBoat: 'blue1',
      },
      // Step 4: R1 stuck, combination held
      {
        description:
          'R1 cannot escape the tight cover and falls further behind. B1 has successfully pinned R1 in 3rd while B2 sails freely in 2nd. The 1-2-5 combination is preserved.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 180, y: 175, heading: 350 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 215, y: 150, heading: 345 },
          { id: 'red1', team: 'red', label: 'R1', x: 180, y: 230, heading: 355 },
          { id: 'red2', team: 'red', label: 'R2', x: 250, y: 240, heading: 340 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 155, y: 310, heading: 10 },
          { id: 'red3', team: 'red', label: 'R3', x: 282, y: 330, heading: 350 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: '1-2-5 protected!', x: 50, y: 30, type: 'info' },
          { text: 'R1 pinned behind B1', x: 200, y: 230, type: 'warning' },
        ],
        activeBoat: null,
      },
    ],
  },

  // ======================== 2. LOOSE COVER (Intermediate) ========================
  {
    id: 'loose-cover',
    type: 'loose-cover',
    title: 'Loose Cover',
    description:
      'Blue is winning 1-2-6. B2 loosely covers R2 (4th) on the upwind leg by staying between R2 and the windward mark without tacking on every move. This saves B2\'s energy while limiting R2\'s options.',
    phase: 'Upwind',
    objective:
      'Keep R2 (4th place) from advancing past B2 by positioning between R2 and the windward mark, without expending energy on constant tacking.',
    combinationBefore: '1-2-6',
    combinationAfter: '1-2-6',
    difficulty: 'intermediate',
    keyRules: [
      'Port gives way to starboard (Rule 10) on crossing situations.',
      'No rule prevents a boat from sailing between an opponent and the mark.',
      'A loose cover allows the covering boat to make strategic tacks rather than reactive ones.',
      'The covering boat should stay on the same tack as the opponent whenever possible.',
    ],
    proTip:
      'In a loose cover, position yourself roughly on the line between your opponent and the windward mark, but offset three to five boat-lengths to the side. This gives you clean air while still limiting their lane to the mark.',
    steps: [
      // Step 1: Setup
      {
        description:
          'Blue is winning 1-2-6. B2 is in 2nd and R2 is in 4th. B2 does not need to tack on R2 every time. Instead, B2 stays loosely between R2 and the windward mark.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 185, y: 150, heading: 350 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 220, y: 220, heading: 345 },
          { id: 'red1', team: 'red', label: 'R1', x: 165, y: 260, heading: 355 },
          { id: 'red2', team: 'red', label: 'R2', x: 250, y: 310, heading: 340 },
          { id: 'red3', team: 'red', label: 'R3', x: 140, y: 370, heading: 10 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 280, y: 420, heading: 350 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'Blue: 1-2-6 = 9 (winning)', x: 50, y: 30, type: 'info' },
          { text: 'B2 loosely covers R2', x: 240, y: 215, type: 'action' },
        ],
        activeBoat: 'blue2',
      },
      // Step 2: Positioning
      {
        description:
          'B2 stays on starboard tack, positioned between R2 and the windward mark. R2 tacks to port, but B2 does not follow immediately. Instead, B2 continues on starboard for a few more lengths to maintain a strategic position.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 180, y: 125, heading: 350 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 210, y: 190, heading: 345 },
          { id: 'red1', team: 'red', label: 'R1', x: 160, y: 230, heading: 355 },
          { id: 'red2', team: 'red', label: 'R2', x: 220, y: 285, heading: 30 },
          { id: 'red3', team: 'red', label: 'R3', x: 142, y: 345, heading: 10 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 278, y: 395, heading: 350 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'R2 tacks to port', x: 240, y: 280, type: 'info' },
          { text: 'B2 holds starboard', x: 120, y: 185, type: 'action' },
          { text: 'B2 stays between R2 and mark', x: 50, y: 60, type: 'info' },
        ],
        activeBoat: 'blue2',
      },
      // Step 3: Strategic tack
      {
        description:
          'When R2 gets close to the layline, B2 tacks to port to maintain the loose cover. B2 is now ahead and to windward of R2, limiting R2\'s options without wasting tacks.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 200, y: 105, heading: 30 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 180, y: 170, heading: 25 },
          { id: 'red1', team: 'red', label: 'R1', x: 155, y: 200, heading: 355 },
          { id: 'red2', team: 'red', label: 'R2', x: 160, y: 255, heading: 30 },
          { id: 'red3', team: 'red', label: 'R3', x: 148, y: 320, heading: 10 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 275, y: 370, heading: 350 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'B2 tacks strategically', x: 80, y: 165, type: 'action' },
          { text: 'R2 lane blocked', x: 80, y: 255, type: 'warning' },
          { text: '1-2-6 maintained', x: 270, y: 30, type: 'info' },
        ],
        activeBoat: 'blue2',
      },
    ],
  },

  // ======================== 3. PAIRING STRATEGY (Intermediate) ========================
  {
    id: 'pairing-strategy',
    type: 'pairing',
    title: 'Pairing Strategy',
    description:
      'Blue is winning 1-3-5. Each blue boat pairs with a specific red boat: B1 covers R1 (2nd), B2 covers R2 (4th), B3 stays ahead of R3 (6th). This systematic coverage prevents any red boat from gaining a position.',
    phase: 'Upwind',
    objective:
      'Assign each blue boat a specific opponent to cover, creating three defensive pairs that lock the combination in place.',
    combinationBefore: '1-3-5',
    combinationAfter: '1-3-5',
    difficulty: 'intermediate',
    keyRules: [
      'Each blue boat is responsible for one specific opponent.',
      'The covering boat should stay upwind and between their opponent and the next mark.',
      'If an opponent escapes their pair, the nearest teammate should pick up the coverage.',
      'Communication between teammates is essential for maintaining the pairing system.',
    ],
    proTip:
      'In a pairing system, each pair fights its own battle. B1 only worries about R1, B2 only about R2, and B3 only about R3. This simplifies decision-making and prevents opponents from exploiting gaps between unsure defenders.',
    steps: [
      // Step 1: Assign pairs
      {
        description:
          'Blue is winning 1-3-5 = 9. The team assigns pairs: B1 (1st) covers R1 (2nd), B2 (3rd) covers R2 (4th), B3 (5th) stays ahead of R3 (6th). Each blue boat focuses on their assigned opponent.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 180, y: 180, heading: 350 },
          { id: 'red1', team: 'red', label: 'R1', x: 220, y: 220, heading: 345 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 165, y: 280, heading: 355 },
          { id: 'red2', team: 'red', label: 'R2', x: 240, y: 315, heading: 340 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 185, y: 380, heading: 350 },
          { id: 'red3', team: 'red', label: 'R3', x: 260, y: 420, heading: 345 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'Blue: 1-3-5 = 9 (winning)', x: 50, y: 30, type: 'info' },
          { text: 'B1 ↔ R1', x: 255, y: 200, type: 'action' },
          { text: 'B2 ↔ R2', x: 270, y: 295, type: 'action' },
          { text: 'B3 ↔ R3', x: 290, y: 400, type: 'action' },
        ],
        activeBoat: null,
      },
      // Step 2: R1 tries to escape
      {
        description:
          'R1 tacks to port to try to escape B1\'s cover. B1 responds by tacking to stay between R1 and the mark. Meanwhile, B2 and B3 hold their own pairs steady.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 160, y: 170, heading: 30 },
          { id: 'red1', team: 'red', label: 'R1', x: 150, y: 205, heading: 35 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 170, y: 260, heading: 355 },
          { id: 'red2', team: 'red', label: 'R2', x: 235, y: 290, heading: 340 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 188, y: 360, heading: 350 },
          { id: 'red3', team: 'red', label: 'R3', x: 258, y: 395, heading: 345 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'R1 tacks to escape', x: 60, y: 205, type: 'warning' },
          { text: 'B1 tacks to follow', x: 70, y: 165, type: 'action' },
          { text: 'B2-R2 pair holds', x: 255, y: 275, type: 'info' },
          { text: 'B3-R3 pair holds', x: 280, y: 378, type: 'info' },
        ],
        activeBoat: 'blue1',
      },
      // Step 3: System holds
      {
        description:
          'All three pairs remain intact. R1 is stuck behind B1, R2 cannot pass B2, and R3 trails B3. The 1-3-5 combination is locked in place by the pairing system.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 185, y: 150, heading: 350 },
          { id: 'red1', team: 'red', label: 'R1', x: 195, y: 190, heading: 348 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 175, y: 240, heading: 355 },
          { id: 'red2', team: 'red', label: 'R2', x: 230, y: 270, heading: 340 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 192, y: 340, heading: 350 },
          { id: 'red3', team: 'red', label: 'R3', x: 255, y: 375, heading: 345 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: '1-3-5 locked in!', x: 50, y: 30, type: 'info' },
          { text: 'All pairs holding', x: 280, y: 30, type: 'info' },
        ],
        activeBoat: null,
      },
    ],
  },

  // ======================== 4. DOWNWIND DEFENSE (Advanced) ========================
  {
    id: 'downwind-defense',
    type: 'downwind-defense',
    title: 'Downwind Defense',
    description:
      'Blue is winning 2-3-4. R1 leads in 1st, and R2 (5th) and R3 (6th) are trying to catch up on the downwind leg. B2 (2nd) and B3 (3rd) must defend by staying between R1 and the leeward mark while preventing R2 and R3 from passing B1 (4th).',
    phase: 'Downwind',
    objective:
      'Protect the 2-3-4 combination by slowing R1 and shielding B1 (4th) from R2 and R3 on the downwind leg.',
    combinationBefore: '2-3-4',
    combinationAfter: '2-3-4',
    difficulty: 'advanced',
    keyRules: [
      'A leeward boat has right of way over a windward boat on the same tack (Rule 11).',
      'A boat clear ahead can change course but must give the boat astern room to keep clear (Rule 16).',
      'Blanketing an opponent\'s wind is a legitimate tactic with no rule against it.',
      'On a free leg, the windward boat keeps clear (Rule 11).',
    ],
    proTip:
      'On the downwind leg, position your defensive boats to windward of the opponent they are covering. This puts the opponent in your wind shadow and forces them to sail a deeper, slower angle to find clean air.',
    steps: [
      // Step 1: Setup downwind
      {
        description:
          'Blue has 2-3-4 = 9 on the downwind leg. R1 leads in 1st. B2 (2nd) and B3 (3rd) sail behind R1, and B1 (4th) has R2 (5th) and R3 (6th) behind. Blue must prevent any red boat from passing.',
        boats: [
          { id: 'red1', team: 'red', label: 'R1', x: 200, y: 240, heading: 180 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 185, y: 280, heading: 175 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 220, y: 310, heading: 185 },
          { id: 'blue1', team: 'blue', label: 'B1', x: 195, y: 350, heading: 180 },
          { id: 'red2', team: 'red', label: 'R2', x: 250, y: 385, heading: 175 },
          { id: 'red3', team: 'red', label: 'R3', x: 155, y: 410, heading: 185 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'Blue: 2-3-4 = 9 (winning)', x: 50, y: 30, type: 'info' },
          { text: 'R1 leads but Blue has the pack', x: 50, y: 55, type: 'info' },
        ],
        activeBoat: null,
      },
      // Step 2: B2 and B3 slow R1
      {
        description:
          'B2 positions to windward of R1\'s downwind course, blanketing R1\'s wind. B3 positions on R1\'s other side. Together they create a wall that slows R1 and compresses the fleet.',
        boats: [
          { id: 'red1', team: 'red', label: 'R1', x: 200, y: 320, heading: 180 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 185, y: 300, heading: 180 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 220, y: 305, heading: 180 },
          { id: 'blue1', team: 'blue', label: 'B1', x: 195, y: 380, heading: 180 },
          { id: 'red2', team: 'red', label: 'R2', x: 248, y: 415, heading: 175 },
          { id: 'red3', team: 'red', label: 'R3', x: 158, y: 435, heading: 185 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'B2 blankets R1 from windward', x: 50, y: 295, type: 'action' },
          { text: 'B3 blocks R1 from escaping', x: 240, y: 300, type: 'action' },
          { text: 'R1 slowing in dirty air', x: 110, y: 320, type: 'warning' },
        ],
        activeBoat: 'blue2',
      },
      // Step 3: B1 holds off R2 and R3
      {
        description:
          'While B2 and B3 slow R1, B1 (4th) focuses on staying ahead of R2 (5th) and R3 (6th). B1 sails a clean downwind course without engaging the opponents behind, maintaining enough speed to keep 4th place.',
        boats: [
          { id: 'red1', team: 'red', label: 'R1', x: 200, y: 380, heading: 180 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 185, y: 365, heading: 180 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 218, y: 370, heading: 180 },
          { id: 'blue1', team: 'blue', label: 'B1', x: 195, y: 440, heading: 180 },
          { id: 'red2', team: 'red', label: 'R2', x: 245, y: 465, heading: 175 },
          { id: 'red3', team: 'red', label: 'R3', x: 160, y: 480, heading: 185 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'B1 holds 4th comfortably', x: 95, y: 435, type: 'info' },
          { text: 'R2 and R3 cannot pass', x: 260, y: 470, type: 'warning' },
          { text: '2-3-4 protected!', x: 50, y: 30, type: 'info' },
        ],
        activeBoat: 'blue1',
      },
    ],
  },

  // ======================== 5. FINISH LINE PROTECTION (Advanced) ========================
  {
    id: 'finish-protection',
    type: 'finish-protection',
    title: 'Finish Line Protection',
    description:
      'Blue is barely winning 1-3-6 = 10 approaching the finish on the upwind leg. B1 must finish ahead of R1 (2nd) and B2 (3rd) must hold off R2 (4th). Any single position change loses the race.',
    phase: 'Finish',
    objective:
      'Protect each critical position approaching the finish line. B1 covers R1 and B2 covers R2 to lock in the 1-3-6 combination.',
    combinationBefore: '1-3-6',
    combinationAfter: '1-3-6',
    difficulty: 'advanced',
    keyRules: [
      'All normal racing rules apply through the finish. There are no special finish-line privileges.',
      'A boat tacking must keep clear until on a close-hauled course (Rule 13).',
      'Port gives way to starboard (Rule 10).',
      'When overlapped on the same tack, the windward boat keeps clear (Rule 11).',
    ],
    proTip:
      'Near the finish, avoid unnecessary tacks. Each tack loses distance and creates moments where you must keep clear. Choose the tack that points most directly at the finish line and hold it, covering by positioning rather than reactive tacking.',
    steps: [
      // Step 1: Setup approaching finish
      {
        description:
          'Blue has 1-3-6 = 10, exactly on the winning threshold. B1 leads but R1 (2nd) is close behind. B2 (3rd) has R2 (4th) within striking distance. Any single pass by Red flips the result to a loss.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 185, y: 170, heading: 350 },
          { id: 'red1', team: 'red', label: 'R1', x: 210, y: 200, heading: 345 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 170, y: 240, heading: 355 },
          { id: 'red2', team: 'red', label: 'R2', x: 235, y: 265, heading: 340 },
          { id: 'red3', team: 'red', label: 'R3', x: 150, y: 310, heading: 5 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 270, y: 350, heading: 350 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'Blue: 1-3-6 = 10 (barely winning)', x: 50, y: 30, type: 'warning' },
          { text: 'Any pass = Blue loses!', x: 50, y: 55, type: 'warning' },
          { text: 'R1 close to B1', x: 230, y: 195, type: 'warning' },
          { text: 'R2 close to B2', x: 255, y: 260, type: 'warning' },
        ],
        activeBoat: null,
      },
      // Step 2: B1 covers R1
      {
        description:
          'B1 positions directly upwind of R1, matching tack for tack. R1 tacks to port and B1 follows, maintaining a tight cover. B1 must not let R1 cross ahead.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 170, y: 145, heading: 25 },
          { id: 'red1', team: 'red', label: 'R1', x: 165, y: 175, heading: 30 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 175, y: 215, heading: 355 },
          { id: 'red2', team: 'red', label: 'R2', x: 230, y: 240, heading: 340 },
          { id: 'red3', team: 'red', label: 'R3', x: 155, y: 285, heading: 5 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 268, y: 325, heading: 350 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'B1 covers R1 tack-for-tack', x: 60, y: 140, type: 'action' },
          { text: 'R1 cannot escape', x: 80, y: 175, type: 'warning' },
        ],
        activeBoat: 'blue1',
      },
      // Step 3: B2 holds off R2
      {
        description:
          'B2 stays on the same tack as R2, positioned between R2 and the finish line. R2 tries to find a lane but B2 maintains the loose cover. Both boats approach the finish with B2 still ahead.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 185, y: 115, heading: 350 },
          { id: 'red1', team: 'red', label: 'R1', x: 195, y: 140, heading: 348 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 180, y: 185, heading: 355 },
          { id: 'red2', team: 'red', label: 'R2', x: 225, y: 210, heading: 340 },
          { id: 'red3', team: 'red', label: 'R3', x: 158, y: 260, heading: 5 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 265, y: 300, heading: 350 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'B2 holds off R2 to the finish', x: 60, y: 180, type: 'action' },
          { text: 'R2 blocked from passing', x: 245, y: 205, type: 'warning' },
        ],
        activeBoat: 'blue2',
      },
      // Step 4: Finish
      {
        description:
          'B1 finishes first, R1 finishes second, B2 finishes third, R2 finishes fourth. The 1-3-6 combination is preserved and Blue wins by exactly one point.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 188, y: 85, heading: 350 },
          { id: 'red1', team: 'red', label: 'R1', x: 198, y: 100, heading: 348 },
          { id: 'blue2', team: 'blue', label: 'B2', x: 182, y: 130, heading: 355 },
          { id: 'red2', team: 'red', label: 'R2', x: 220, y: 155, heading: 340 },
          { id: 'red3', team: 'red', label: 'R3', x: 162, y: 220, heading: 5 },
          { id: 'blue3', team: 'blue', label: 'B3', x: 262, y: 270, heading: 350 },
        ],
        marks: WINDWARD_LEEWARD_MARKS,
        windDirection: 0,
        annotations: [
          { text: '1-3-6 = 10, Blue wins!', x: 50, y: 30, type: 'info' },
          { text: 'Finish', x: 200, y: 75, type: 'info' },
        ],
        activeBoat: null,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Overview Export
// ---------------------------------------------------------------------------

export const COVERING_OVERVIEW = {
  title: 'Covering & Defense',
  description:
    'Master the art of protecting a winning combination. Learn tight and loose covering techniques, the pairing system for assigning each teammate an opponent, and how to defend on downwind legs and at the finish line. Great defense wins team races.',
};

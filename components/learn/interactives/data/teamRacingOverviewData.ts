/**
 * Team Racing Overview - Race Timeline Data
 *
 * Walks through an entire team race from pre-start to finish,
 * illustrating how positions, tactics, and combinations evolve
 * across every phase of the race.
 *
 * Course layout: Windward-Leeward with wind from the top (0 degrees).
 * Canvas coordinate space: x 0-400, y 0-600.
 * Windward mark at (200, 80), leeward mark at (200, 520).
 * Start line: two start marks at (120, 520) and (280, 520).
 *
 * Blue team boats: B1, B2, B3. Red team boats: R1, R2, R3.
 */

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export interface BoatPosition {
  id: string;
  team: 'blue' | 'red';
  label: string;
  x: number;
  y: number;
  heading: number;
}

export interface RaceTimelineStep {
  id: string;
  phase: string;
  title: string;
  description: string;
  boats: BoatPosition[];
  marks: { x: number; y: number; type: 'windward' | 'leeward' | 'gate' | 'start' }[];
  windDirection: number;
  annotations: { text: string; x: number; y: number; type: 'action' | 'info' | 'warning' }[];
  combination: {
    blue: number[];
    red: number[];
    blueTotal: number;
    redTotal: number;
    blueWinning: boolean;
  } | null;
  keyInsight: string;
}

// ---------------------------------------------------------------------------
// Course Marks
// ---------------------------------------------------------------------------

const COURSE_MARKS: RaceTimelineStep['marks'] = [
  { x: 200, y: 80, type: 'windward' },
  { x: 200, y: 520, type: 'leeward' },
  { x: 120, y: 520, type: 'start' },
  { x: 280, y: 520, type: 'start' },
];

// ---------------------------------------------------------------------------
// Race Timeline Steps
// ---------------------------------------------------------------------------

export const RACE_TIMELINE: RaceTimelineStep[] = [
  // ======================== STEP 1: PRE-START ========================
  {
    id: 'pre-start',
    phase: 'Pre-Start',
    title: 'Pre-Start Maneuvering',
    description:
      'Both teams circle behind the start line, jockeying for position. Blue team aims to control the favored end while Red team tries to disrupt their setup. Boats are sailing slowly, making tight turns to stay near the line without crossing early.',
    boats: [
      { id: 'blue1', team: 'blue', label: 'B1', x: 180, y: 560, heading: 315 },
      { id: 'blue2', team: 'blue', label: 'B2', x: 220, y: 580, heading: 0 },
      { id: 'blue3', team: 'blue', label: 'B3', x: 140, y: 575, heading: 45 },
      { id: 'red1', team: 'red', label: 'R1', x: 260, y: 555, heading: 315 },
      { id: 'red2', team: 'red', label: 'R2', x: 160, y: 555, heading: 350 },
      { id: 'red3', team: 'red', label: 'R3', x: 240, y: 580, heading: 270 },
    ],
    marks: COURSE_MARKS,
    windDirection: 0,
    annotations: [
      { text: 'Wind', x: 360, y: 20, type: 'info' },
      { text: 'Teams circle for position', x: 50, y: 30, type: 'info' },
      { text: 'B1 eyes pin end', x: 100, y: 555, type: 'action' },
      { text: 'R1 defends committee end', x: 270, y: 540, type: 'action' },
    ],
    combination: null,
    keyInsight:
      'In team racing, the pre-start is about positioning all three boats together. Teams try to start in a group so they can coordinate tactics immediately after the gun.',
  },

  // ======================== STEP 2: START ========================
  {
    id: 'start',
    phase: 'Start',
    title: 'The Starting Sequence',
    description:
      'The gun fires and all six boats cross the line on starboard tack. Blue team gets a clean start with B1 and B2 at the pin end, gaining a slight advantage. Red team is slightly bunched at the committee end. B3 is squeezed between the two groups.',
    boats: [
      { id: 'blue1', team: 'blue', label: 'B1', x: 130, y: 510, heading: 350 },
      { id: 'blue2', team: 'blue', label: 'B2', x: 165, y: 512, heading: 355 },
      { id: 'red2', team: 'red', label: 'R2', x: 200, y: 515, heading: 350 },
      { id: 'blue3', team: 'blue', label: 'B3', x: 230, y: 518, heading: 348 },
      { id: 'red1', team: 'red', label: 'R1', x: 255, y: 514, heading: 352 },
      { id: 'red3', team: 'red', label: 'R3', x: 275, y: 516, heading: 345 },
    ],
    marks: COURSE_MARKS,
    windDirection: 0,
    annotations: [
      { text: 'Wind', x: 360, y: 20, type: 'info' },
      { text: 'Start!', x: 185, y: 540, type: 'action' },
      { text: 'B1 & B2 clean at pin', x: 50, y: 500, type: 'info' },
      { text: 'Red bunched at committee', x: 260, y: 500, type: 'warning' },
    ],
    combination: null,
    keyInsight:
      'A coordinated start is essential in team racing. Starting together lets the team immediately begin tactical plays. A split start makes coordination nearly impossible on the first beat.',
  },

  // ======================== STEP 3: FIRST BEAT ========================
  {
    id: 'first-beat',
    phase: 'First Beat',
    title: 'Upwind Separation',
    description:
      'The fleet spreads out on the first upwind leg. B1 leads on the left side of the course, R1 tacks to the right looking for a shift. B2 covers R2 by tacking onto port to stay between R2 and the windward mark. B3 and R3 duel in the middle of the fleet.',
    boats: [
      { id: 'blue1', team: 'blue', label: 'B1', x: 110, y: 320, heading: 350 },
      { id: 'red1', team: 'red', label: 'R1', x: 300, y: 340, heading: 345 },
      { id: 'blue2', team: 'blue', label: 'B2', x: 190, y: 370, heading: 30 },
      { id: 'red2', team: 'red', label: 'R2', x: 240, y: 380, heading: 350 },
      { id: 'blue3', team: 'blue', label: 'B3', x: 170, y: 420, heading: 355 },
      { id: 'red3', team: 'red', label: 'R3', x: 220, y: 430, heading: 345 },
    ],
    marks: COURSE_MARKS,
    windDirection: 0,
    annotations: [
      { text: 'Wind', x: 360, y: 20, type: 'info' },
      { text: 'B1 leads left', x: 40, y: 315, type: 'info' },
      { text: 'R1 goes right', x: 310, y: 325, type: 'info' },
      { text: 'B2 covers R2', x: 120, y: 365, type: 'action' },
    ],
    combination: {
      blue: [1, 3, 5],
      red: [2, 4, 6],
      blueTotal: 9,
      redTotal: 12,
      blueWinning: true,
    },
    keyInsight:
      'On the first beat, the leading team should keep their boats between the opponents and the next mark. Covering prevents the trailing team from finding a wind shift that could flip the order.',
  },

  // ======================== STEP 4: TOP MARK - MARK TRAP ========================
  {
    id: 'top-mark',
    phase: 'Top Mark',
    title: 'Windward Mark Trap',
    description:
      'B1 rounds the windward mark first and bears away onto the downwind leg. R1 arrives second but B2 executes a mark trap: B1 slowed slightly before the zone, compressing R1, and B2 established an inside overlap to round ahead of R1. R1 is forced wide and drops to third.',
    boats: [
      { id: 'blue1', team: 'blue', label: 'B1', x: 230, y: 130, heading: 160 },
      { id: 'blue2', team: 'blue', label: 'B2', x: 215, y: 105, heading: 140 },
      { id: 'red1', team: 'red', label: 'R1', x: 195, y: 95, heading: 90 },
      { id: 'red2', team: 'red', label: 'R2', x: 175, y: 180, heading: 350 },
      { id: 'blue3', team: 'blue', label: 'B3', x: 155, y: 230, heading: 355 },
      { id: 'red3', team: 'red', label: 'R3', x: 280, y: 250, heading: 345 },
    ],
    marks: COURSE_MARKS,
    windDirection: 0,
    annotations: [
      { text: 'Wind', x: 360, y: 20, type: 'info' },
      { text: 'B2 rounds inside!', x: 230, y: 95, type: 'action' },
      { text: 'R1 forced wide', x: 115, y: 90, type: 'warning' },
      { text: 'Zone', x: 130, y: 75, type: 'info' },
      { text: 'New: B1-B2-R1', x: 50, y: 30, type: 'info' },
    ],
    combination: {
      blue: [1, 2, 5],
      red: [3, 4, 6],
      blueTotal: 8,
      redTotal: 13,
      blueWinning: true,
    },
    keyInsight:
      'The mark trap is one of the most powerful team racing moves. By slowing before the zone, the lead boat compresses the fleet and creates an opportunity for a teammate to steal inside overlap and gain a position.',
  },

  // ======================== STEP 5: DOWNWIND - SCREEN ========================
  {
    id: 'downwind-screen',
    phase: 'Downwind',
    title: 'Downwind Screen',
    description:
      'On the downwind leg, B2 positions directly upwind of R1 to cast dirty air onto their sails. R1 slows in the wind shadow, allowing B3 (who has been gaining from behind) to close the gap on R2 in 4th place. Blue protects their 1-2 lead while working on the back of the fleet.',
    boats: [
      { id: 'blue1', team: 'blue', label: 'B1', x: 180, y: 280, heading: 175 },
      { id: 'blue2', team: 'blue', label: 'B2', x: 230, y: 300, heading: 180 },
      { id: 'red1', team: 'red', label: 'R1', x: 235, y: 350, heading: 180 },
      { id: 'red2', team: 'red', label: 'R2', x: 160, y: 370, heading: 185 },
      { id: 'blue3', team: 'blue', label: 'B3', x: 175, y: 390, heading: 178 },
      { id: 'red3', team: 'red', label: 'R3', x: 300, y: 400, heading: 185 },
    ],
    marks: COURSE_MARKS,
    windDirection: 0,
    annotations: [
      { text: 'Wind', x: 360, y: 20, type: 'info' },
      { text: 'B2 screens R1', x: 245, y: 285, type: 'action' },
      { text: 'Dirty air!', x: 250, y: 330, type: 'warning' },
      { text: 'R1 slowing', x: 250, y: 355, type: 'warning' },
      { text: 'B3 closing on R2', x: 85, y: 385, type: 'action' },
    ],
    combination: {
      blue: [1, 2, 5],
      red: [3, 4, 6],
      blueTotal: 8,
      redTotal: 13,
      blueWinning: true,
    },
    keyInsight:
      'Screening (sailing in an opponent\'s wind) is a legal and essential team racing tactic. There is no rule against sailing in another boat\'s wind shadow. The goal is to slow the opponent so a teammate can gain ground.',
  },

  // ======================== STEP 6: BOTTOM MARK ========================
  {
    id: 'bottom-mark',
    phase: 'Bottom Mark',
    title: 'Leeward Mark Rounding',
    description:
      'The fleet rounds the leeward mark onto the second beat. B1 rounds first and heads upwind. B2 rounds second but R1 has broken free from the screen and pushes hard, rounding close behind in third. R2 rounds fourth, but B3 has caught up and establishes an inside overlap to round ahead of R3.',
    boats: [
      { id: 'blue1', team: 'blue', label: 'B1', x: 170, y: 495, heading: 350 },
      { id: 'blue2', team: 'blue', label: 'B2', x: 195, y: 510, heading: 345 },
      { id: 'red1', team: 'red', label: 'R1', x: 215, y: 525, heading: 340 },
      { id: 'red2', team: 'red', label: 'R2', x: 235, y: 535, heading: 330 },
      { id: 'blue3', team: 'blue', label: 'B3', x: 190, y: 545, heading: 355 },
      { id: 'red3', team: 'red', label: 'R3', x: 250, y: 540, heading: 310 },
    ],
    marks: COURSE_MARKS,
    windDirection: 0,
    annotations: [
      { text: 'Wind', x: 360, y: 20, type: 'info' },
      { text: 'B1 leads upwind', x: 80, y: 490, type: 'info' },
      { text: 'R1 breaks free', x: 225, y: 510, type: 'warning' },
      { text: 'B3 rounds inside R3', x: 115, y: 555, type: 'action' },
    ],
    combination: {
      blue: [1, 2, 5],
      red: [3, 4, 6],
      blueTotal: 8,
      redTotal: 13,
      blueWinning: true,
    },
    keyInsight:
      'The leeward mark is a critical transition point. Teams must communicate quickly: who has inside overlap, who needs to give room, and how the order will look on the next beat. Every position swap at the mark can change the combination.',
  },

  // ======================== STEP 7: FINAL BEAT ========================
  {
    id: 'final-beat',
    phase: 'Final Beat',
    title: 'The Final Beat - Red Fights Back',
    description:
      'On the final upwind leg, Red team mounts a counterattack. R1 finds a favorable right-side shift and gains on B2. R2 luffs B3 to slow them both, hoping R3 can catch up from behind. Blue must decide whether to cover or extend. B1 extends their lead to protect the overall combination.',
    boats: [
      { id: 'blue1', team: 'blue', label: 'B1', x: 140, y: 230, heading: 350 },
      { id: 'blue2', team: 'blue', label: 'B2', x: 190, y: 310, heading: 355 },
      { id: 'red1', team: 'red', label: 'R1', x: 290, y: 290, heading: 340 },
      { id: 'red2', team: 'red', label: 'R2', x: 210, y: 380, heading: 330 },
      { id: 'blue3', team: 'blue', label: 'B3', x: 230, y: 375, heading: 340 },
      { id: 'red3', team: 'red', label: 'R3', x: 270, y: 420, heading: 345 },
    ],
    marks: COURSE_MARKS,
    windDirection: 0,
    annotations: [
      { text: 'Wind', x: 360, y: 20, type: 'info' },
      { text: 'R1 gains from right!', x: 300, y: 275, type: 'warning' },
      { text: 'R2 luffs B3', x: 140, y: 375, type: 'action' },
      { text: 'B1 extends to cover', x: 50, y: 225, type: 'action' },
      { text: 'Both slowing', x: 225, y: 395, type: 'info' },
    ],
    combination: {
      blue: [1, 2, 5],
      red: [3, 4, 6],
      blueTotal: 8,
      redTotal: 13,
      blueWinning: true,
    },
    keyInsight:
      'On the final beat, the leading team must decide between extending their advantage and covering opponents. In team racing, covering is usually more important than boat speed because a single position swap can flip the result.',
  },

  // ======================== STEP 8: TOP MARK 2 - POSITIONS SHIFT ========================
  {
    id: 'top-mark-2',
    phase: 'Top Mark 2',
    title: 'Second Windward Mark - R1 Takes Second',
    description:
      'R1 arrives at the windward mark having gained from the right side shift. R1 rounds in second place, pushing B2 to third. The combination shifts. Blue now holds 1-3-5 (total 9), still winning but with a thinner margin. B1 must protect the lead on the final run to the finish.',
    boats: [
      { id: 'blue1', team: 'blue', label: 'B1', x: 225, y: 120, heading: 160 },
      { id: 'red1', team: 'red', label: 'R1', x: 215, y: 100, heading: 140 },
      { id: 'blue2', team: 'blue', label: 'B2', x: 195, y: 90, heading: 100 },
      { id: 'red2', team: 'red', label: 'R2', x: 175, y: 200, heading: 350 },
      { id: 'blue3', team: 'blue', label: 'B3', x: 200, y: 250, heading: 355 },
      { id: 'red3', team: 'red', label: 'R3', x: 260, y: 270, heading: 345 },
    ],
    marks: COURSE_MARKS,
    windDirection: 0,
    annotations: [
      { text: 'Wind', x: 360, y: 20, type: 'info' },
      { text: 'R1 takes 2nd!', x: 135, y: 95, type: 'warning' },
      { text: 'B2 drops to 3rd', x: 115, y: 80, type: 'info' },
      { text: '1-3-5 still winning', x: 50, y: 30, type: 'info' },
    ],
    combination: {
      blue: [1, 3, 5],
      red: [2, 4, 6],
      blueTotal: 9,
      redTotal: 12,
      blueWinning: true,
    },
    keyInsight:
      'Losing a position does not necessarily lose the race. Blue dropped from 1-2-5 to 1-3-5 but is still winning. Understanding which position changes matter (and which do not) is the key to team racing strategy.',
  },

  // ======================== STEP 9: FINAL RUN & FINISH ========================
  {
    id: 'finish',
    phase: 'Finish',
    title: 'The Finish - Blue Holds On',
    description:
      'On the final downwind leg, B1 sails conservatively to protect first place. B2 screens R2 to prevent Red from improving their combination. R1 tries to break away for a gap but B2 holds firm in third. B3 stays ahead of R3 in the battle for 5th and 6th. Blue finishes 1-3-5 for a total of 9, beating Red\'s 2-4-6 total of 12.',
    boats: [
      { id: 'blue1', team: 'blue', label: 'B1', x: 170, y: 500, heading: 180 },
      { id: 'red1', team: 'red', label: 'R1', x: 200, y: 490, heading: 180 },
      { id: 'blue2', team: 'blue', label: 'B2', x: 215, y: 480, heading: 180 },
      { id: 'red2', team: 'red', label: 'R2', x: 235, y: 470, heading: 180 },
      { id: 'blue3', team: 'blue', label: 'B3', x: 180, y: 460, heading: 180 },
      { id: 'red3', team: 'red', label: 'R3', x: 260, y: 450, heading: 180 },
    ],
    marks: COURSE_MARKS,
    windDirection: 0,
    annotations: [
      { text: 'Wind', x: 360, y: 20, type: 'info' },
      { text: 'B1 finishes 1st!', x: 80, y: 500, type: 'action' },
      { text: 'B2 holds 3rd', x: 135, y: 475, type: 'action' },
      { text: 'B3 secures 5th', x: 95, y: 455, type: 'action' },
      { text: 'FINISH', x: 185, y: 530, type: 'info' },
      { text: 'Blue wins: 1+3+5 = 9', x: 50, y: 30, type: 'info' },
      { text: 'Red loses: 2+4+6 = 12', x: 260, y: 30, type: 'warning' },
    ],
    combination: {
      blue: [1, 3, 5],
      red: [2, 4, 6],
      blueTotal: 9,
      redTotal: 12,
      blueWinning: true,
    },
    keyInsight:
      'The finish in team racing is not about individual glory but the combined result. B1 did not need to extend their lead; they needed to protect the combination. Every boat\'s finish position contributes to the team total.',
  },
];

// ---------------------------------------------------------------------------
// Overview Metadata
// ---------------------------------------------------------------------------

export const TEAM_RACING_OVERVIEW = {
  title: 'Anatomy of a Team Race',
  description:
    'Follow a complete 3v3 team race from pre-start to finish. See how boat positions, tactical plays, and scoring combinations evolve through every phase of the race.',
  totalSteps: RACE_TIMELINE.length,
};

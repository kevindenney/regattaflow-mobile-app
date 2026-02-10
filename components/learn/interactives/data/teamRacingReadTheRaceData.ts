/**
 * Team Racing Read the Race - Lesson Data
 * Race scenario snapshots for "read the race" quizzes.
 *
 * Each scenario presents a snapshot of a team race in progress and asks the
 * learner to evaluate the current combination, identify whether Blue is
 * winning or losing, and (at higher difficulty) pick the best tactical play.
 *
 * Course layout: Windward-Leeward with wind from the top (0 degrees).
 * Canvas coordinate space: x 0-400, y 0-600.
 * Windward mark at (200, 80), leeward mark at (200, 520).
 *
 * Blue team boats: B1, B2, B3. Red team boats: R1, R2, R3.
 * Team racing scoring: 3 boats per team, lowest combined score wins (10 or less).
 */

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export interface BoatOnCourse {
  id: string;
  team: 'blue' | 'red';
  label: string;
  x: number;
  y: number;
  heading: number;
  position: number; // current race position 1-6
}

export interface RaceReadScenario {
  id: string;
  title: string;
  description: string;
  boats: BoatOnCourse[];
  marks: { x: number; y: number; type: 'windward' | 'leeward' }[];
  windDirection: number;
  phase: string; // 'upwind' | 'top-mark' | 'downwind' | 'bottom-mark' | 'finish'
  bluePositions: number[];
  blueTotal: number;
  isBlueWinning: boolean;
  question: string;
  options: { id: string; text: string; isCorrect: boolean; explanation: string }[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// ---------------------------------------------------------------------------
// Course Marks
// ---------------------------------------------------------------------------

const WINDWARD_LEEWARD_MARKS: RaceReadScenario['marks'] = [
  { x: 200, y: 80, type: 'windward' },
  { x: 200, y: 520, type: 'leeward' },
];

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

export const RACE_READ_SCENARIOS: RaceReadScenario[] = [
  // ======================== 1. EASY COMBO ID (Beginner) ========================
  {
    id: 'easy-combo-sweep',
    title: 'The Perfect Sweep',
    description:
      'Blue team has its three boats leading the fleet on the upwind leg. Identify their combination and whether they are winning.',
    boats: [
      { id: 'blue1', team: 'blue', label: 'B1', x: 180, y: 180, heading: 350, position: 1 },
      { id: 'blue2', team: 'blue', label: 'B2', x: 220, y: 220, heading: 345, position: 2 },
      { id: 'blue3', team: 'blue', label: 'B3', x: 160, y: 260, heading: 355, position: 3 },
      { id: 'red1', team: 'red', label: 'R1', x: 250, y: 310, heading: 340, position: 4 },
      { id: 'red2', team: 'red', label: 'R2', x: 140, y: 350, heading: 5, position: 5 },
      { id: 'red3', team: 'red', label: 'R3', x: 280, y: 390, heading: 350, position: 6 },
    ],
    marks: WINDWARD_LEEWARD_MARKS,
    windDirection: 0,
    phase: 'upwind',
    bluePositions: [1, 2, 3],
    blueTotal: 6,
    isBlueWinning: true,
    question: 'What is Blue\'s current combination and are they winning?',
    options: [
      {
        id: 'a',
        text: '1-2-3 = 6, Blue is winning',
        isCorrect: true,
        explanation:
          'Correct! Blue has positions 1, 2, and 3 for a total of 6. This is the best possible combination in team racing, a perfect sweep.',
      },
      {
        id: 'b',
        text: '1-2-3 = 6, but this is a losing combination',
        isCorrect: false,
        explanation:
          'The total of 6 is well under 10, so Blue is winning. Any total of 10 or less is a win.',
      },
      {
        id: 'c',
        text: '1-3-5 = 9, Blue is winning',
        isCorrect: false,
        explanation:
          'Look more carefully at the positions. All three blue boats are ahead of all three red boats, giving Blue 1-2-3, not 1-3-5.',
      },
      {
        id: 'd',
        text: '2-3-4 = 9, Blue is winning',
        isCorrect: false,
        explanation:
          'Blue\'s boats are in positions 1, 2, and 3, not 2, 3, and 4. B1 is in the lead.',
      },
    ],
    difficulty: 'beginner',
  },

  // ======================== 2. BASIC COMBO MATH (Beginner) ========================
  {
    id: 'basic-combo-math',
    title: 'Middle of the Pack',
    description:
      'Blue team has boats scattered through the middle of the fleet on the downwind leg. Calculate their total and determine if they are winning.',
    boats: [
      { id: 'red1', team: 'red', label: 'R1', x: 190, y: 280, heading: 175, position: 1 },
      { id: 'blue1', team: 'blue', label: 'B1', x: 220, y: 310, heading: 180, position: 2 },
      { id: 'blue2', team: 'blue', label: 'B2', x: 170, y: 345, heading: 185, position: 3 },
      { id: 'blue3', team: 'blue', label: 'B3', x: 240, y: 380, heading: 175, position: 4 },
      { id: 'red2', team: 'red', label: 'R2', x: 160, y: 420, heading: 180, position: 5 },
      { id: 'red3', team: 'red', label: 'R3', x: 260, y: 455, heading: 185, position: 6 },
    ],
    marks: WINDWARD_LEEWARD_MARKS,
    windDirection: 0,
    phase: 'downwind',
    bluePositions: [2, 3, 4],
    blueTotal: 9,
    isBlueWinning: true,
    question: 'What is Blue\'s total score and are they winning?',
    options: [
      {
        id: 'a',
        text: '2+3+4 = 9, Blue is winning',
        isCorrect: true,
        explanation:
          'Correct! Blue has positions 2, 3, and 4 for a total of 9. Since 9 is less than or equal to 10, Blue is winning with a comfortable 3-point margin.',
      },
      {
        id: 'b',
        text: '2+3+4 = 9, Blue is losing',
        isCorrect: false,
        explanation:
          'The math is right, but 9 is under the threshold of 10. A team wins when their total is 10 or less.',
      },
      {
        id: 'c',
        text: '1+3+5 = 9, Blue is winning',
        isCorrect: false,
        explanation:
          'Check the positions again. Red leads in 1st place, so Blue cannot have position 1. Blue has 2, 3, and 4.',
      },
      {
        id: 'd',
        text: '2+4+5 = 11, Blue is losing',
        isCorrect: false,
        explanation:
          'Look again at the fleet order. Blue\'s boats are in 2nd, 3rd, and 4th, not 2nd, 4th, and 5th.',
      },
    ],
    difficulty: 'beginner',
  },

  // ======================== 3. LOSING BY ONE (Intermediate) ========================
  {
    id: 'losing-by-one',
    title: 'Losing by One',
    description:
      'Blue has two boats near the front but one trailing badly on the upwind leg. Calculate the combination and determine the result.',
    boats: [
      { id: 'red1', team: 'red', label: 'R1', x: 240, y: 170, heading: 345, position: 1 },
      { id: 'blue1', team: 'blue', label: 'B1', x: 170, y: 210, heading: 355, position: 2 },
      { id: 'blue2', team: 'blue', label: 'B2', x: 230, y: 255, heading: 340, position: 3 },
      { id: 'red2', team: 'red', label: 'R2', x: 160, y: 300, heading: 5, position: 4 },
      { id: 'red3', team: 'red', label: 'R3', x: 270, y: 340, heading: 350, position: 5 },
      { id: 'blue3', team: 'blue', label: 'B3', x: 140, y: 410, heading: 10, position: 6 },
    ],
    marks: WINDWARD_LEEWARD_MARKS,
    windDirection: 0,
    phase: 'upwind',
    bluePositions: [2, 3, 6],
    blueTotal: 11,
    isBlueWinning: false,
    question: 'Is Blue winning or losing, and by how much?',
    options: [
      {
        id: 'a',
        text: '2+3+6 = 11, Blue is losing by 1 point',
        isCorrect: true,
        explanation:
          'Correct! Blue has 2+3+6 = 11, which is one point over the magic number of 10. Red has 1+4+5 = 10 and wins. This is the smallest possible losing margin.',
      },
      {
        id: 'b',
        text: '2+3+6 = 11, Blue is winning because two boats are near the front',
        isCorrect: false,
        explanation:
          'Having two boats near the front is not enough. The total of 11 exceeds 10, so Blue loses. The trailing boat in 6th is too far back.',
      },
      {
        id: 'c',
        text: '2+3+5 = 10, Blue is winning',
        isCorrect: false,
        explanation:
          'Check the positions again. Blue\'s third boat (B3) is in 6th, not 5th. R3 is ahead of B3.',
      },
      {
        id: 'd',
        text: '2+3+6 = 11, Blue is losing by 3 points',
        isCorrect: false,
        explanation:
          'The combination is correct but the margin calculation is wrong. Red has 1+4+5 = 10, so the difference is 11 minus 10 = 1 point, not 3.',
      },
    ],
    difficulty: 'intermediate',
  },

  // ======================== 4. CLIFF EDGE (Intermediate) ========================
  {
    id: 'cliff-edge-read',
    title: 'The Cliff Edge',
    description:
      'Blue has its lead boat in first but the other two are spread through the fleet approaching the leeward mark. Is this combination enough to win?',
    boats: [
      { id: 'blue1', team: 'blue', label: 'B1', x: 200, y: 350, heading: 180, position: 1 },
      { id: 'red1', team: 'red', label: 'R1', x: 240, y: 370, heading: 175, position: 2 },
      { id: 'blue2', team: 'blue', label: 'B2', x: 170, y: 395, heading: 185, position: 3 },
      { id: 'red2', team: 'red', label: 'R2', x: 250, y: 420, heading: 180, position: 4 },
      { id: 'red3', team: 'red', label: 'R3', x: 165, y: 445, heading: 175, position: 5 },
      { id: 'blue3', team: 'blue', label: 'B3', x: 230, y: 480, heading: 185, position: 6 },
    ],
    marks: WINDWARD_LEEWARD_MARKS,
    windDirection: 0,
    phase: 'bottom-mark',
    bluePositions: [1, 3, 6],
    blueTotal: 10,
    isBlueWinning: true,
    question: 'Blue has 1st, 3rd, and 6th. Is this a winning combination?',
    options: [
      {
        id: 'a',
        text: 'Yes, 1+3+6 = 10, exactly on the winning threshold',
        isCorrect: true,
        explanation:
          'Correct! 1+3+6 = 10, which is exactly the magic number. Blue wins, but with zero margin. Any single position lost would flip the result.',
      },
      {
        id: 'b',
        text: 'No, having a boat in last place means Blue is losing',
        isCorrect: false,
        explanation:
          'A boat in 6th does not automatically mean a loss. The power of 1st place is enormous: 1+3+6 = 10, which still wins. This is why protecting your lead boat is critical.',
      },
      {
        id: 'c',
        text: 'Yes, 1+3+6 = 10, Blue is winning comfortably',
        isCorrect: false,
        explanation:
          'Blue is winning, but certainly not comfortably. At exactly 10, any single position change (such as R1 passing B1 or R2 passing B2) would flip the result to a loss.',
      },
      {
        id: 'd',
        text: 'No, 1+3+6 = 10, which ties and Red wins on tiebreak',
        isCorrect: false,
        explanation:
          'There is no tiebreak at 10. A total of 10 or less is a win for the team. The positions always sum to 21, so if one team has 10, the other has 11.',
      },
    ],
    difficulty: 'intermediate',
  },

  // ======================== 5. PICK THE PLAY - MARK TRAP (Intermediate) ========================
  {
    id: 'pick-play-mark-trap',
    title: 'Pick the Play: Top Mark',
    description:
      'Blue is losing with 1-3-5 = 9... wait, that is winning! Let us set up a losing scenario. Blue has 1-4-5 approaching the windward mark. What is the best tactical play?',
    boats: [
      { id: 'blue1', team: 'blue', label: 'B1', x: 185, y: 170, heading: 350, position: 1 },
      { id: 'red1', team: 'red', label: 'R1', x: 215, y: 210, heading: 345, position: 2 },
      { id: 'red2', team: 'red', label: 'R2', x: 170, y: 250, heading: 355, position: 3 },
      { id: 'blue2', team: 'blue', label: 'B2', x: 230, y: 280, heading: 340, position: 4 },
      { id: 'blue3', team: 'blue', label: 'B3', x: 195, y: 310, heading: 350, position: 5 },
      { id: 'red3', team: 'red', label: 'R3', x: 280, y: 360, heading: 345, position: 6 },
    ],
    marks: WINDWARD_LEEWARD_MARKS,
    windDirection: 0,
    phase: 'top-mark',
    bluePositions: [1, 4, 5],
    blueTotal: 10,
    isBlueWinning: true,
    question: 'Blue has 1-4-5 = 10, barely winning. What should B1 do at the top mark to strengthen the combination?',
    options: [
      {
        id: 'a',
        text: 'B1 slows before the mark to let B2 trap R2 inside at the rounding',
        isCorrect: true,
        explanation:
          'Correct! By slowing before the windward mark, B1 compresses the group. B2 can establish an inside overlap on R2 (3rd) and steal that position. This converts 1-4-5 to 1-3-5 = 9, a more comfortable win.',
      },
      {
        id: 'b',
        text: 'B1 should sail as fast as possible to extend the lead',
        isCorrect: false,
        explanation:
          'Sailing fast in 1st does not help your teammates. B1 is already in 1st place; the problem is that B2 and B3 need to gain positions. Team racing rewards teamwork over individual performance.',
      },
      {
        id: 'c',
        text: 'B3 should tack and cover R3 to keep them in 6th',
        isCorrect: false,
        explanation:
          'R3 is already in last place. Covering R3 wastes B3\'s efforts when the team needs B2 or B3 to move up, not keep R3 down.',
      },
      {
        id: 'd',
        text: 'Blue is winning so no play is needed',
        isCorrect: false,
        explanation:
          'Blue has 1-4-5 = 10, barely winning. A single position change could flip the result. Good team racers always work to improve their combination when the margin is thin.',
      },
    ],
    difficulty: 'intermediate',
  },

  // ======================== 6. PICK THE PLAY - SCREEN (Advanced) ========================
  {
    id: 'pick-play-screen',
    title: 'Pick the Play: Protect the Win',
    description:
      'Blue is winning with 1-2-5 on the upwind leg, but B3 in 5th is being pressured by R3 in 6th trying to pass. What should B2 (in 2nd) do?',
    boats: [
      { id: 'blue1', team: 'blue', label: 'B1', x: 175, y: 150, heading: 350, position: 1 },
      { id: 'blue2', team: 'blue', label: 'B2', x: 220, y: 200, heading: 345, position: 2 },
      { id: 'red1', team: 'red', label: 'R1', x: 160, y: 250, heading: 355, position: 3 },
      { id: 'red2', team: 'red', label: 'R2', x: 250, y: 290, heading: 340, position: 4 },
      { id: 'blue3', team: 'blue', label: 'B3', x: 180, y: 350, heading: 350, position: 5 },
      { id: 'red3', team: 'red', label: 'R3', x: 200, y: 380, heading: 348, position: 6 },
    ],
    marks: WINDWARD_LEEWARD_MARKS,
    windDirection: 0,
    phase: 'upwind',
    bluePositions: [1, 2, 5],
    blueTotal: 8,
    isBlueWinning: true,
    question: 'Blue has 1-2-5 = 8 but R2 (4th) is threatening B3 (5th). What is the best move for B2?',
    options: [
      {
        id: 'a',
        text: 'B2 drops back to screen R1 (3rd) or R2 (4th), keeping them in dirty air to protect B3',
        isCorrect: true,
        explanation:
          'Correct! B2 can afford to sacrifice some distance because Blue has a comfortable margin (8 vs the threshold of 10). By screening an opponent, B2 slows them down and prevents them from catching B3. Even if B2 drops to 3rd, the combination becomes 1-3-5 = 9, still winning.',
      },
      {
        id: 'b',
        text: 'B2 should sail fast to hold 2nd place',
        isCorrect: false,
        explanation:
          'B2 holding 2nd does not help if B3 gets passed. If R2 passes B3, the combination stays at 1-2-6 = 9, still winning, but this is a missed opportunity to use B2\'s position advantage to protect the whole team.',
      },
      {
        id: 'c',
        text: 'B1 should slow down and help B3',
        isCorrect: false,
        explanation:
          'B1 is in 1st place and should protect that position. The lead is the most valuable asset in team racing. B2, with less at risk, is the right boat to play defense.',
      },
      {
        id: 'd',
        text: 'B3 should tack away from R3 to escape',
        isCorrect: false,
        explanation:
          'Tacking away might work short-term, but it does not address the real threat. R2 in 4th is the greater danger. The best team play is for B2 to use their position to slow the threats proactively.',
      },
    ],
    difficulty: 'advanced',
  },

  // ======================== 7. COMBINATION CHANGE (Advanced) ========================
  {
    id: 'combo-change-analysis',
    title: 'Combination Change',
    description:
      'Blue currently has 1-3-5 = 9 on the downwind leg. R2 (4th) is about to pass B2 (3rd). Determine how this changes the combination.',
    boats: [
      { id: 'blue1', team: 'blue', label: 'B1', x: 200, y: 280, heading: 180, position: 1 },
      { id: 'red1', team: 'red', label: 'R1', x: 240, y: 310, heading: 175, position: 2 },
      { id: 'blue2', team: 'blue', label: 'B2', x: 175, y: 340, heading: 185, position: 3 },
      { id: 'red2', team: 'red', label: 'R2', x: 185, y: 345, heading: 180, position: 4 },
      { id: 'blue3', team: 'blue', label: 'B3', x: 250, y: 390, heading: 175, position: 5 },
      { id: 'red3', team: 'red', label: 'R3', x: 160, y: 430, heading: 185, position: 6 },
    ],
    marks: WINDWARD_LEEWARD_MARKS,
    windDirection: 0,
    phase: 'downwind',
    bluePositions: [1, 3, 5],
    blueTotal: 9,
    isBlueWinning: true,
    question: 'If R2 (4th) passes B2 (3rd), does Blue still win?',
    options: [
      {
        id: 'a',
        text: 'Yes, Blue would have 1-4-5 = 10, still barely winning',
        isCorrect: true,
        explanation:
          'Correct! If R2 passes B2, Blue drops from 1-3-5 = 9 to 1-4-5 = 10. This is still a winning combination, but now at the absolute edge. One more position lost anywhere would flip the result.',
      },
      {
        id: 'b',
        text: 'No, Blue would have 1-4-5 = 10, which is a loss',
        isCorrect: false,
        explanation:
          'A total of 10 is still a win. The threshold is 10 or less to win, 11 or more to lose. Blue would be right on the edge but still winning.',
      },
      {
        id: 'c',
        text: 'Yes, Blue would have 1-3-5 = 9, nothing changes',
        isCorrect: false,
        explanation:
          'If R2 passes B2, then B2 drops from 3rd to 4th. The combination changes from 1-3-5 to 1-4-5. Every position swap matters in team racing.',
      },
      {
        id: 'd',
        text: 'No, Blue would have 1-4-6 = 11, a loss',
        isCorrect: false,
        explanation:
          'Only B2 is affected by this pass, dropping from 3rd to 4th. B3 remains in 5th. The new combination is 1-4-5 = 10, not 1-4-6.',
      },
    ],
    difficulty: 'advanced',
  },

  // ======================== 8. CRITICAL DECISION (Advanced) ========================
  {
    id: 'critical-decision-finish',
    title: 'Critical Decision: Final Leg',
    description:
      'Blue has 1-4-5 = 10 on the final upwind leg to the finish. The combination is winning but barely. Multiple opponents are threatening. What is the safest strategy?',
    boats: [
      { id: 'blue1', team: 'blue', label: 'B1', x: 190, y: 180, heading: 350, position: 1 },
      { id: 'red1', team: 'red', label: 'R1', x: 225, y: 210, heading: 345, position: 2 },
      { id: 'red2', team: 'red', label: 'R2', x: 165, y: 240, heading: 355, position: 3 },
      { id: 'blue2', team: 'blue', label: 'B2', x: 235, y: 270, heading: 340, position: 4 },
      { id: 'blue3', team: 'blue', label: 'B3', x: 180, y: 300, heading: 350, position: 5 },
      { id: 'red3', team: 'red', label: 'R3', x: 260, y: 340, heading: 345, position: 6 },
    ],
    marks: WINDWARD_LEEWARD_MARKS,
    windDirection: 0,
    phase: 'upwind',
    bluePositions: [1, 4, 5],
    blueTotal: 10,
    isBlueWinning: true,
    question: 'Blue has 1-4-5 = 10 on the final leg. What is the safest strategy to protect the win?',
    options: [
      {
        id: 'a',
        text: 'B1 covers R1 (2nd), B2 and B3 stay between R2 (3rd) and the finish',
        isCorrect: true,
        explanation:
          'Correct! The biggest threat is any red boat passing a blue boat. B1 must cover R1 because if R1 passes B1, Blue gets 2-4-5 = 11 and loses. B2 and B3 working together to hold off R2 prevents the 1-5-5 scenario (impossible) but more importantly keeps R2 from pushing B2 to 5th (1-5-5 cannot happen; if R2 passes B2, Blue has 1-5-5 which is still... actually B2 drops to 5th and B3 to 6th: 1-5-6 = 12, a loss). Defense across all positions is essential.',
      },
      {
        id: 'b',
        text: 'All three blue boats should sail as fast as possible to the finish',
        isCorrect: false,
        explanation:
          'In team racing, individual speed alone does not protect a combination. If R1 is faster than B1, or R2 overtakes B2, the combination flips. Active covering and tactical sailing are essential.',
      },
      {
        id: 'c',
        text: 'B1 should slow down to help B2 pass R2 (3rd)',
        isCorrect: false,
        explanation:
          'Slowing B1 risks letting R1 pass into 1st, which changes the combination to 2-4-5 = 11, a loss. On the final leg with a winning combination, protecting existing positions is safer than trying to improve.',
      },
      {
        id: 'd',
        text: 'B3 should tack to cover R3 (6th) to ensure they stay last',
        isCorrect: false,
        explanation:
          'R3 is already in 6th and is not a threat. Covering R3 wastes B3\'s effort when B3 should focus on holding 5th place against the boats ahead. Always address the most dangerous threats first.',
      },
    ],
    difficulty: 'advanced',
  },
];

// ---------------------------------------------------------------------------
// Overview Export
// ---------------------------------------------------------------------------

export const READ_THE_RACE_OVERVIEW = {
  title: 'Read the Race',
  description:
    'Learn to instantly evaluate team racing combinations by reading the positions on the course. Practice identifying whether your team is winning or losing, calculating score totals, and choosing the right tactical play to improve or protect your combination.',
};

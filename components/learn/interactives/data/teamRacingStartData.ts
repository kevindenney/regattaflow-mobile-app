/**
 * Team Racing Start Strategies - Lesson Data
 * Coordinated team start techniques for 3v3 team racing.
 *
 * This lesson covers:
 * - Line-Up Start (basic coordinated entry)
 * - Pin-End Attack (exploiting a favored end)
 * - Disruption Start (pre-start engagement to slow opponents)
 * - Controlled Entry (mid-line formation start)
 *
 * Course layout: Start line across the bottom, windward mark at the top.
 * Canvas coordinate space: x 0-400, y 0-600.
 * Start line marks at (120, 480) and (280, 480).
 * Windward mark at (200, 80).
 *
 * Blue team boats: B1, B2, B3. Red team boats: R1, R2, R3.
 * Wind from top (0 degrees).
 */

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export interface StartBoatPosition {
  id: string;
  team: 'blue' | 'red';
  label: string;
  x: number;
  y: number;
  heading: number;
  role: string; // e.g., 'Rabbit', 'Lead attacker', 'Covering'
}

export interface StartStep {
  description: string;
  boats: StartBoatPosition[];
  marks: { x: number; y: number; type: 'start' | 'windward' | 'leeward' }[];
  windDirection: number;
  annotations: { text: string; x: number; y: number; type: 'action' | 'info' | 'warning' }[];
  timeToStart: number; // seconds before start, 0 = gun
}

export interface TeamStartStrategy {
  id: string;
  name: string;
  description: string;
  objective: string;
  steps: StartStep[];
  roleAssignments: { boatId: string; role: string; task: string }[];
  postStartCombination: string;
  keyPrinciples: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// ---------------------------------------------------------------------------
// Course Marks
// ---------------------------------------------------------------------------

const START_MARKS: StartStep['marks'] = [
  { x: 120, y: 480, type: 'start' },
  { x: 280, y: 480, type: 'start' },
  { x: 200, y: 80, type: 'windward' },
];

// ---------------------------------------------------------------------------
// Start Strategies
// ---------------------------------------------------------------------------

export const TEAM_START_STRATEGIES: TeamStartStrategy[] = [
  // ======================== 1. LINE-UP START (Beginner) ========================
  {
    id: 'line-up-start',
    name: 'Line-Up Start',
    description:
      'The simplest team start. All three blue boats line up on the start line, evenly spaced, and start together on the gun. This ensures all boats cross the line at full speed without interfering with each other.',
    objective:
      'Get all three boats across the start line cleanly and at speed, with even spacing to avoid wind interference between teammates.',
    difficulty: 'beginner',
    roleAssignments: [
      { boatId: 'blue1', role: 'Lead', task: 'Start near the boat end, call timing for the team.' },
      { boatId: 'blue2', role: 'Middle', task: 'Start at mid-line, maintain spacing from B1 and B3.' },
      { boatId: 'blue3', role: 'Pin', task: 'Start near the pin end, hold position and start on time.' },
    ],
    postStartCombination: 'Even start, positions depend on first upwind leg execution.',
    keyPrinciples: [
      'Even spacing prevents teammates from taking wind from each other.',
      'All three boats should be moving at full speed when the gun fires.',
      'The lead caller (usually B1) sets the timing and communicates with the team.',
      'A clean start with all three boats on the line is better than one great start and two late ones.',
    ],
    steps: [
      // Step 1: 30 seconds before
      {
        description:
          'Thirty seconds before the start. All three blue boats approach the line on starboard tack from below, spread across the line. Red boats are also approaching. Blue boats hold back to time their run.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 260, y: 540, heading: 340, role: 'Lead' },
          { id: 'blue2', team: 'blue', label: 'B2', x: 200, y: 545, heading: 345, role: 'Middle' },
          { id: 'blue3', team: 'blue', label: 'B3', x: 140, y: 540, heading: 350, role: 'Pin' },
          { id: 'red1', team: 'red', label: 'R1', x: 240, y: 555, heading: 340, role: 'Approaching' },
          { id: 'red2', team: 'red', label: 'R2', x: 175, y: 555, heading: 350, role: 'Approaching' },
          { id: 'red3', team: 'red', label: 'R3', x: 300, y: 560, heading: 335, role: 'Approaching' },
        ],
        marks: START_MARKS,
        windDirection: 0,
        annotations: [
          { text: '30 seconds', x: 50, y: 30, type: 'info' },
          { text: 'Blue boats hold back, timing the approach', x: 50, y: 55, type: 'info' },
          { text: 'Start Line', x: 185, y: 470, type: 'info' },
        ],
        timeToStart: 30,
      },
      // Step 2: 15 seconds before
      {
        description:
          'Fifteen seconds before the start. B1 calls the approach and all three blue boats begin accelerating toward the line. They maintain even spacing of roughly one-third of the line length between each boat.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 255, y: 520, heading: 345, role: 'Lead' },
          { id: 'blue2', team: 'blue', label: 'B2', x: 200, y: 525, heading: 348, role: 'Middle' },
          { id: 'blue3', team: 'blue', label: 'B3', x: 145, y: 520, heading: 352, role: 'Pin' },
          { id: 'red1', team: 'red', label: 'R1', x: 235, y: 530, heading: 342, role: 'Approaching' },
          { id: 'red2', team: 'red', label: 'R2', x: 170, y: 535, heading: 350, role: 'Approaching' },
          { id: 'red3', team: 'red', label: 'R3', x: 290, y: 535, heading: 338, role: 'Approaching' },
        ],
        marks: START_MARKS,
        windDirection: 0,
        annotations: [
          { text: '15 seconds', x: 50, y: 30, type: 'info' },
          { text: 'B1 calls: accelerate!', x: 270, y: 510, type: 'action' },
          { text: 'Even spacing across line', x: 50, y: 55, type: 'info' },
        ],
        timeToStart: 15,
      },
      // Step 3: 5 seconds before
      {
        description:
          'Five seconds to the gun. All three blue boats are at full speed, approaching the line in formation. B1 confirms timing. Boats are bow-to-bow, ready to cross.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 252, y: 498, heading: 347, role: 'Lead' },
          { id: 'blue2', team: 'blue', label: 'B2', x: 200, y: 500, heading: 350, role: 'Middle' },
          { id: 'blue3', team: 'blue', label: 'B3', x: 148, y: 498, heading: 353, role: 'Pin' },
          { id: 'red1', team: 'red', label: 'R1', x: 230, y: 510, heading: 344, role: 'Approaching' },
          { id: 'red2', team: 'red', label: 'R2', x: 168, y: 515, heading: 352, role: 'Approaching' },
          { id: 'red3', team: 'red', label: 'R3', x: 285, y: 512, heading: 340, role: 'Approaching' },
        ],
        marks: START_MARKS,
        windDirection: 0,
        annotations: [
          { text: '5 seconds', x: 50, y: 30, type: 'warning' },
          { text: 'Full speed, line abeam', x: 50, y: 55, type: 'action' },
        ],
        timeToStart: 5,
      },
      // Step 4: Gun fires
      {
        description:
          'The starting signal fires. All three blue boats cross the line at speed together. Clean start with good spacing. Blue enters the first upwind leg with all boats in strong positions.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 250, y: 470, heading: 348, role: 'Lead' },
          { id: 'blue2', team: 'blue', label: 'B2', x: 200, y: 472, heading: 350, role: 'Middle' },
          { id: 'blue3', team: 'blue', label: 'B3', x: 150, y: 470, heading: 354, role: 'Pin' },
          { id: 'red1', team: 'red', label: 'R1', x: 228, y: 488, heading: 345, role: 'Behind' },
          { id: 'red2', team: 'red', label: 'R2', x: 166, y: 492, heading: 352, role: 'Behind' },
          { id: 'red3', team: 'red', label: 'R3', x: 282, y: 490, heading: 340, role: 'Behind' },
        ],
        marks: START_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'GUN!', x: 50, y: 30, type: 'action' },
          { text: 'Clean start, all three boats on the line!', x: 50, y: 55, type: 'info' },
        ],
        timeToStart: 0,
      },
    ],
  },

  // ======================== 2. PIN-END ATTACK (Intermediate) ========================
  {
    id: 'pin-end-attack',
    name: 'Pin-End Attack',
    description:
      'B1 and B2 target the pin end (left side) of the line, which is favored when the wind is slightly left-shifted. B3 acts as a screen, engaging red boats near the boat end to give B1 and B2 clean air at the pin.',
    objective:
      'Exploit a pin-end bias by starting B1 and B2 at the favored end with maximum speed, while B3 disrupts opponents at the boat end.',
    difficulty: 'intermediate',
    roleAssignments: [
      { boatId: 'blue1', role: 'Lead attacker', task: 'Start at the pin end with clear air and maximum speed.' },
      { boatId: 'blue2', role: 'Support attacker', task: 'Start just behind B1 at the pin, protect B1\'s wind from behind.' },
      { boatId: 'blue3', role: 'Screen', task: 'Engage red boats near the boat end, slow them before the start.' },
    ],
    postStartCombination: 'Target 1-2-4 or better if B3\'s screening is effective.',
    keyPrinciples: [
      'The pin end is favored when the left side of the course has more wind or a lift.',
      'Starting at the pin end gives a positional advantage for the first upwind tack.',
      'The screen boat (B3) sacrifices their own start to disrupt opponents.',
      'B1 and B2 must be disciplined about timing to avoid being over early at the pin.',
    ],
    steps: [
      // Step 1: 30 seconds before
      {
        description:
          'Thirty seconds before the start. B1 and B2 set up below the pin end of the line. B3 sails toward the boat end to engage Red boats. R1 and R2 are mid-line.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 130, y: 540, heading: 355, role: 'Lead attacker' },
          { id: 'blue2', team: 'blue', label: 'B2', x: 155, y: 550, heading: 350, role: 'Support attacker' },
          { id: 'blue3', team: 'blue', label: 'B3', x: 265, y: 540, heading: 335, role: 'Screen' },
          { id: 'red1', team: 'red', label: 'R1', x: 200, y: 540, heading: 345, role: 'Mid-line' },
          { id: 'red2', team: 'red', label: 'R2', x: 230, y: 545, heading: 340, role: 'Mid-line' },
          { id: 'red3', team: 'red', label: 'R3', x: 270, y: 555, heading: 340, role: 'Boat end' },
        ],
        marks: START_MARKS,
        windDirection: 0,
        annotations: [
          { text: '30 seconds', x: 50, y: 30, type: 'info' },
          { text: 'Pin end favored', x: 70, y: 470, type: 'info' },
          { text: 'B3 heads to boat end to screen', x: 270, y: 525, type: 'action' },
        ],
        timeToStart: 30,
      },
      // Step 2: 15 seconds before
      {
        description:
          'Fifteen seconds out. B1 and B2 begin their approach from below the pin end, timing to reach the line at the gun. B3 engages R3 at the boat end, getting to windward to luff them above the line.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 128, y: 520, heading: 358, role: 'Lead attacker' },
          { id: 'blue2', team: 'blue', label: 'B2', x: 152, y: 528, heading: 352, role: 'Support attacker' },
          { id: 'blue3', team: 'blue', label: 'B3', x: 275, y: 515, heading: 330, role: 'Screen' },
          { id: 'red1', team: 'red', label: 'R1', x: 195, y: 520, heading: 348, role: 'Mid-line' },
          { id: 'red2', team: 'red', label: 'R2', x: 225, y: 525, heading: 342, role: 'Mid-line' },
          { id: 'red3', team: 'red', label: 'R3', x: 260, y: 520, heading: 335, role: 'Engaged' },
        ],
        marks: START_MARKS,
        windDirection: 0,
        annotations: [
          { text: '15 seconds', x: 50, y: 30, type: 'info' },
          { text: 'B1 and B2 accelerate to pin', x: 50, y: 510, type: 'action' },
          { text: 'B3 luffs R3!', x: 290, y: 510, type: 'action' },
        ],
        timeToStart: 15,
      },
      // Step 3: 5 seconds before
      {
        description:
          'Five seconds. B1 is perfectly positioned at the pin end at full speed. B2 is close behind with clean air. B3 has pushed R3 above the line and is blocking R2 from getting to the pin side.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 125, y: 495, heading: 0, role: 'Lead attacker' },
          { id: 'blue2', team: 'blue', label: 'B2', x: 150, y: 502, heading: 354, role: 'Support attacker' },
          { id: 'blue3', team: 'blue', label: 'B3', x: 268, y: 498, heading: 335, role: 'Screen' },
          { id: 'red1', team: 'red', label: 'R1', x: 195, y: 505, heading: 350, role: 'Mid-line' },
          { id: 'red2', team: 'red', label: 'R2', x: 235, y: 508, heading: 342, role: 'Blocked' },
          { id: 'red3', team: 'red', label: 'R3', x: 280, y: 475, heading: 320, role: 'Over line' },
        ],
        marks: START_MARKS,
        windDirection: 0,
        annotations: [
          { text: '5 seconds', x: 50, y: 30, type: 'warning' },
          { text: 'B1 has the pin, full speed', x: 50, y: 490, type: 'action' },
          { text: 'R3 pushed over early!', x: 290, y: 465, type: 'warning' },
        ],
        timeToStart: 5,
      },
      // Step 4: Gun fires
      {
        description:
          'Start! B1 crosses at the pin end with clean air and a positional advantage. B2 follows closely. R3 is over early and must return. B3 crosses last but has disrupted two red boats. Blue has an excellent start.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 125, y: 465, heading: 2, role: 'Lead attacker' },
          { id: 'blue2', team: 'blue', label: 'B2', x: 150, y: 473, heading: 356, role: 'Support attacker' },
          { id: 'red1', team: 'red', label: 'R1', x: 195, y: 478, heading: 350, role: 'Mid-line' },
          { id: 'red2', team: 'red', label: 'R2', x: 232, y: 485, heading: 345, role: 'Late' },
          { id: 'blue3', team: 'blue', label: 'B3', x: 262, y: 478, heading: 340, role: 'Screen' },
          { id: 'red3', team: 'red', label: 'R3', x: 285, y: 500, heading: 180, role: 'Returning' },
        ],
        marks: START_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'GUN!', x: 50, y: 30, type: 'action' },
          { text: 'B1 wins the pin end!', x: 50, y: 460, type: 'info' },
          { text: 'R3 must return and restart', x: 290, y: 495, type: 'warning' },
        ],
        timeToStart: 0,
      },
    ],
  },

  // ======================== 3. DISRUPTION START (Advanced) ========================
  {
    id: 'disruption-start',
    name: 'Disruption Start',
    description:
      'B1 starts normally at the boat end for a clean getaway. B2 and B3 engage R1 and R2 in the pre-start, luffing and slowing them to give B1 a clear lead off the start line. B2 and B3 sacrifice their own starts to disrupt the opposition.',
    objective:
      'Guarantee B1 a dominant start in first place by having B2 and B3 disrupt the top red boats before the start signal.',
    difficulty: 'advanced',
    roleAssignments: [
      { boatId: 'blue1', role: 'Escaper', task: 'Start cleanly at the boat end, sail fast and get clear of the chaos.' },
      { boatId: 'blue2', role: 'Disruptor 1', task: 'Engage R1 in the pre-start, get to windward and luff them above the line or slow them.' },
      { boatId: 'blue3', role: 'Disruptor 2', task: 'Engage R2 in the pre-start, block their approach and prevent a clean start.' },
    ],
    postStartCombination: 'Target B1 in 1st, then B2 and B3 recover to create 1-X-Y combination.',
    keyPrinciples: [
      'The disruptors must identify their targets early and engage before 30 seconds to go.',
      'Luffing to windward of an opponent before the start is legal but you must give room to keep clear (Rule 16.1).',
      'The escaping boat (B1) must avoid the disruption zone and start cleanly.',
      'Disruptors should release their opponents just after the gun and begin their own recovery.',
    ],
    steps: [
      // Step 1: 30 seconds before
      {
        description:
          'Thirty seconds before the start. B1 sets up at the boat end for a clean start. B2 sails toward R1 to engage. B3 targets R2. The disruption plan is in motion.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 270, y: 535, heading: 340, role: 'Escaper' },
          { id: 'blue2', team: 'blue', label: 'B2', x: 200, y: 540, heading: 350, role: 'Disruptor 1' },
          { id: 'blue3', team: 'blue', label: 'B3', x: 150, y: 545, heading: 355, role: 'Disruptor 2' },
          { id: 'red1', team: 'red', label: 'R1', x: 215, y: 550, heading: 345, role: 'Target 1' },
          { id: 'red2', team: 'red', label: 'R2', x: 170, y: 555, heading: 350, role: 'Target 2' },
          { id: 'red3', team: 'red', label: 'R3', x: 245, y: 555, heading: 340, role: 'Unengaged' },
        ],
        marks: START_MARKS,
        windDirection: 0,
        annotations: [
          { text: '30 seconds', x: 50, y: 30, type: 'info' },
          { text: 'B1 heads for clean boat end', x: 275, y: 520, type: 'action' },
          { text: 'B2 targets R1', x: 200, y: 525, type: 'action' },
          { text: 'B3 targets R2', x: 100, y: 535, type: 'action' },
        ],
        timeToStart: 30,
      },
      // Step 2: 15 seconds before
      {
        description:
          'Fifteen seconds. B2 has gotten to windward of R1 and begins luffing them above close-hauled, pushing them away from the line. B3 parks in front of R2, slowing R2\'s approach. B1 is clear at the boat end.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 268, y: 510, heading: 342, role: 'Escaper' },
          { id: 'blue2', team: 'blue', label: 'B2', x: 200, y: 510, heading: 320, role: 'Disruptor 1' },
          { id: 'red1', team: 'red', label: 'R1', x: 210, y: 505, heading: 315, role: 'Luffed' },
          { id: 'blue3', team: 'blue', label: 'B3', x: 155, y: 520, heading: 10, role: 'Disruptor 2' },
          { id: 'red2', team: 'red', label: 'R2', x: 165, y: 535, heading: 355, role: 'Blocked' },
          { id: 'red3', team: 'red', label: 'R3', x: 240, y: 525, heading: 340, role: 'Approaching' },
        ],
        marks: START_MARKS,
        windDirection: 0,
        annotations: [
          { text: '15 seconds', x: 50, y: 30, type: 'info' },
          { text: 'B2 luffs R1 above line!', x: 100, y: 500, type: 'action' },
          { text: 'B3 blocks R2', x: 70, y: 520, type: 'action' },
          { text: 'B1 clear at boat end', x: 275, y: 495, type: 'info' },
        ],
        timeToStart: 15,
      },
      // Step 3: 5 seconds before
      {
        description:
          'Five seconds. B1 accelerates toward the line at the boat end with clear air and no opponents nearby. B2 holds R1 nearly head-to-wind with zero speed. B3 has R2 stuck behind, unable to build speed for the start.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 265, y: 492, heading: 345, role: 'Escaper' },
          { id: 'blue2', team: 'blue', label: 'B2', x: 195, y: 498, heading: 310, role: 'Disruptor 1' },
          { id: 'red1', team: 'red', label: 'R1', x: 205, y: 490, heading: 300, role: 'Stalled' },
          { id: 'blue3', team: 'blue', label: 'B3', x: 148, y: 505, heading: 20, role: 'Disruptor 2' },
          { id: 'red2', team: 'red', label: 'R2', x: 160, y: 520, heading: 0, role: 'Stuck' },
          { id: 'red3', team: 'red', label: 'R3', x: 238, y: 500, heading: 342, role: 'Approaching' },
        ],
        marks: START_MARKS,
        windDirection: 0,
        annotations: [
          { text: '5 seconds', x: 50, y: 30, type: 'warning' },
          { text: 'B1 full speed!', x: 275, y: 480, type: 'action' },
          { text: 'R1 stalled, no speed', x: 100, y: 485, type: 'warning' },
          { text: 'R2 trapped behind B3', x: 60, y: 520, type: 'warning' },
        ],
        timeToStart: 5,
      },
      // Step 4: Gun fires
      {
        description:
          'Start! B1 crosses the line first with clean air and open water. R1 and R2 are far behind, still recovering from the disruption. B2 and B3 release their opponents and bear away to start, accepting late starts but having given B1 a commanding lead.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 263, y: 465, heading: 347, role: 'Escaper' },
          { id: 'red3', team: 'red', label: 'R3', x: 235, y: 480, heading: 345, role: 'Starting' },
          { id: 'blue2', team: 'blue', label: 'B2', x: 195, y: 490, heading: 350, role: 'Recovering' },
          { id: 'blue3', team: 'blue', label: 'B3', x: 150, y: 495, heading: 355, role: 'Recovering' },
          { id: 'red1', team: 'red', label: 'R1', x: 210, y: 500, heading: 340, role: 'Late' },
          { id: 'red2', team: 'red', label: 'R2', x: 165, y: 510, heading: 355, role: 'Late' },
        ],
        marks: START_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'GUN!', x: 50, y: 30, type: 'action' },
          { text: 'B1 clear in 1st!', x: 270, y: 450, type: 'info' },
          { text: 'R1 and R2 far behind', x: 70, y: 505, type: 'warning' },
          { text: 'B2 and B3 release and recover', x: 50, y: 55, type: 'info' },
        ],
        timeToStart: 0,
      },
    ],
  },

  // ======================== 4. CONTROLLED ENTRY (Intermediate) ========================
  {
    id: 'controlled-entry',
    name: 'Controlled Entry',
    description:
      'All three boats enter together at mid-line in a tight formation. B1 is slightly ahead, B2 is to leeward for protection from boats below, and B3 is to windward for a strong position after the start. The formation maintains clear air for all three boats.',
    objective:
      'Start all three boats together in a compact formation at mid-line, ensuring mutual protection and clean air for the upwind leg.',
    difficulty: 'intermediate',
    roleAssignments: [
      { boatId: 'blue1', role: 'Point boat', task: 'Slightly ahead at mid-line, set the pace and call the final approach.' },
      { boatId: 'blue2', role: 'Leeward guard', task: 'Position to leeward of B1, protect the formation from boats approaching below.' },
      { boatId: 'blue3', role: 'Windward position', task: 'Position to windward of B1 for a strong upwind lane after the start.' },
    ],
    postStartCombination: 'Target compact group in positions 1-2-3 or 2-3-4 depending on Red\'s start.',
    keyPrinciples: [
      'The formation stays tight but with enough spacing for clear air (roughly two boat-lengths between each).',
      'B2 to leeward prevents opponents from establishing an overlap below the group.',
      'B3 to windward gains the favored upwind position after the start.',
      'The point boat (B1) controls timing; all three boats match B1\'s speed and acceleration.',
    ],
    steps: [
      // Step 1: 30 seconds before
      {
        description:
          'Thirty seconds before the start. All three blue boats regroup near mid-line, forming a loose triangle. B1 is at the apex, B2 drops to leeward, B3 positions to windward. Red boats are scattered.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 200, y: 540, heading: 348, role: 'Point boat' },
          { id: 'blue2', team: 'blue', label: 'B2', x: 175, y: 550, heading: 352, role: 'Leeward guard' },
          { id: 'blue3', team: 'blue', label: 'B3', x: 225, y: 548, heading: 344, role: 'Windward position' },
          { id: 'red1', team: 'red', label: 'R1', x: 140, y: 555, heading: 355, role: 'Pin area' },
          { id: 'red2', team: 'red', label: 'R2', x: 265, y: 550, heading: 340, role: 'Boat area' },
          { id: 'red3', team: 'red', label: 'R3', x: 300, y: 558, heading: 335, role: 'Boat area' },
        ],
        marks: START_MARKS,
        windDirection: 0,
        annotations: [
          { text: '30 seconds', x: 50, y: 30, type: 'info' },
          { text: 'Blue forms triangle at mid-line', x: 50, y: 55, type: 'info' },
          { text: 'Start Line', x: 185, y: 470, type: 'info' },
        ],
        timeToStart: 30,
      },
      // Step 2: 15 seconds before
      {
        description:
          'Fifteen seconds. The formation tightens. B1 calls the approach and all three boats begin moving toward the line together. B2 is half a length behind B1 to leeward, B3 is half a length behind to windward.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 200, y: 515, heading: 350, role: 'Point boat' },
          { id: 'blue2', team: 'blue', label: 'B2', x: 178, y: 525, heading: 354, role: 'Leeward guard' },
          { id: 'blue3', team: 'blue', label: 'B3', x: 222, y: 522, heading: 346, role: 'Windward position' },
          { id: 'red1', team: 'red', label: 'R1', x: 138, y: 525, heading: 358, role: 'Pin area' },
          { id: 'red2', team: 'red', label: 'R2', x: 262, y: 520, heading: 342, role: 'Boat area' },
          { id: 'red3', team: 'red', label: 'R3', x: 295, y: 528, heading: 338, role: 'Boat area' },
        ],
        marks: START_MARKS,
        windDirection: 0,
        annotations: [
          { text: '15 seconds', x: 50, y: 30, type: 'info' },
          { text: 'Formation tightens', x: 50, y: 55, type: 'action' },
          { text: 'B2 guards leeward', x: 88, y: 525, type: 'info' },
          { text: 'B3 holds windward', x: 240, y: 518, type: 'info' },
        ],
        timeToStart: 15,
      },
      // Step 3: 5 seconds before
      {
        description:
          'Five seconds. The three boats accelerate in formation. B1 leads by half a length. B2 to leeward has shut the door on R1 trying to approach from below. B3 to windward prevents R2 from establishing an overlap.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 200, y: 495, heading: 350, role: 'Point boat' },
          { id: 'blue2', team: 'blue', label: 'B2', x: 180, y: 505, heading: 354, role: 'Leeward guard' },
          { id: 'blue3', team: 'blue', label: 'B3', x: 220, y: 502, heading: 346, role: 'Windward position' },
          { id: 'red1', team: 'red', label: 'R1', x: 155, y: 510, heading: 358, role: 'Blocked' },
          { id: 'red2', team: 'red', label: 'R2', x: 248, y: 506, heading: 344, role: 'Blocked' },
          { id: 'red3', team: 'red', label: 'R3', x: 288, y: 510, heading: 340, role: 'Outside' },
        ],
        marks: START_MARKS,
        windDirection: 0,
        annotations: [
          { text: '5 seconds', x: 50, y: 30, type: 'warning' },
          { text: 'Accelerating together!', x: 50, y: 55, type: 'action' },
          { text: 'R1 blocked by B2', x: 65, y: 510, type: 'warning' },
          { text: 'R2 blocked by B3', x: 255, y: 498, type: 'warning' },
        ],
        timeToStart: 5,
      },
      // Step 4: Gun fires
      {
        description:
          'Start! All three blue boats cross the line in formation. B1 is just ahead, B3 to windward has the best upwind lane, and B2 to leeward has shut out R1. Red boats are forced to start behind or outside the Blue formation.',
        boats: [
          { id: 'blue1', team: 'blue', label: 'B1', x: 200, y: 468, heading: 350, role: 'Point boat' },
          { id: 'blue2', team: 'blue', label: 'B2', x: 182, y: 475, heading: 354, role: 'Leeward guard' },
          { id: 'blue3', team: 'blue', label: 'B3', x: 218, y: 472, heading: 346, role: 'Windward position' },
          { id: 'red1', team: 'red', label: 'R1', x: 155, y: 488, heading: 358, role: 'Behind' },
          { id: 'red2', team: 'red', label: 'R2', x: 245, y: 485, heading: 344, role: 'Behind' },
          { id: 'red3', team: 'red', label: 'R3', x: 285, y: 490, heading: 340, role: 'Outside' },
        ],
        marks: START_MARKS,
        windDirection: 0,
        annotations: [
          { text: 'GUN!', x: 50, y: 30, type: 'action' },
          { text: 'Blue formation crosses together!', x: 50, y: 55, type: 'info' },
          { text: 'Red forced behind', x: 50, y: 75, type: 'info' },
        ],
        timeToStart: 0,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Overview Export
// ---------------------------------------------------------------------------

export const START_OVERVIEW = {
  title: 'Team Starts',
  description:
    'Learn coordinated start strategies for 3v3 team racing. From basic line-up starts to advanced disruption tactics, master the art of getting your team off the line with an advantage. A great team start can set up a winning combination before the first mark.',
};

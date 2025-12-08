/**
 * Set Course Data
 * Ported from BetterAt Sail Racing
 */

export interface CourseElementState {
  wind?: { opacity: number };
  rcBoat?: { opacity: number; x?: number; y?: number; rotate?: number };
  pin?: { opacity: number };
  startLine?: { opacity: number };
  windwardMark?: { opacity: number };
  leewardGate?: { opacity: number };
  coursePath?: { opacity: number };
  finishBoat?: { opacity: number; x?: number; y?: number; rotate?: number };
  finishPin?: { opacity: number };
  finishLine?: { opacity: number };
}

export interface CourseStep {
  label: string;
  description: string;
  details: string[];
  visualState: CourseElementState;
}

export const SET_COURSE_SEQUENCE_STEPS: CourseStep[] = [
  {
    label: "Step 1: Determine Wind Direction",
    description: "The first and most important step in setting a fair race course is determining the true wind direction.",
    visualState: { wind: { opacity: 1 } },
    details: [
      "Race Committees use sophisticated instruments to find the average wind direction.",
      "A steady wind direction is crucial for a fair course where one side isn't permanently favored.",
    ],
  },
  {
    label: "Step 2: Set the Starting Line",
    description: "The starting line is set perpendicular (90°) to the wind direction.",
    visualState: { wind: { opacity: 1 }, rcBoat: { opacity: 1 }, pin: { opacity: 1 }, startLine: { opacity: 1 } },
    details: [
      "A 'square' starting line ensures that neither the committee boat end nor the pin end is favored.",
      "The line is defined by the orange flag on the RC boat and the pin-end mark.",
    ],
  },
  {
    label: "Step 3: Place the Windward Mark",
    description: "The windward mark is placed directly upwind from the center of the starting line.",
    visualState: { wind: { opacity: 1 }, rcBoat: { opacity: 1 }, pin: { opacity: 1 }, startLine: { opacity: 1 }, windwardMark: { opacity: 1 } },
    details: [
      "The distance to the windward mark determines the length of the upwind 'beat' or 'leg'.",
      "Common distances range from 0.5 to 1.5 nautical miles depending on conditions and fleet size.",
    ],
  },
  {
    label: "Step 4: Set the Leeward Gate",
    description: "The leeward gate consists of two marks that boats must pass between on the downwind leg.",
    visualState: { wind: { opacity: 1 }, rcBoat: { opacity: 1 }, pin: { opacity: 1 }, startLine: { opacity: 1 }, windwardMark: { opacity: 1 }, leewardGate: { opacity: 1 } },
    details: [
      "The gate allows boats to choose which side to round, adding tactical options.",
      "The gate is typically positioned downwind from the windward mark.",
    ],
  },
  {
    label: "Step 5: Set the Finish Line",
    description: "The finish line is typically near the starting line, marked by the RC boat and a separate pin.",
    visualState: { wind: { opacity: 1 }, rcBoat: { opacity: 1 }, pin: { opacity: 1 }, startLine: { opacity: 1 }, windwardMark: { opacity: 1 }, leewardGate: { opacity: 1 }, finishBoat: { opacity: 1 }, finishPin: { opacity: 1 }, finishLine: { opacity: 1 } },
    details: [
      "The finish line is usually set near the start area for easy observation by race officials.",
      "The finish line must remain clear and well-marked for accurate finish times.",
    ],
  },
  {
    label: "Step 6: Complete the Course Path",
    description: "The full race: Cross start → Round windward mark (port rounding) → Through leeward gate → Back to windward → Cross finish.",
    visualState: { wind: { opacity: 1 }, rcBoat: { opacity: 1 }, pin: { opacity: 1 }, startLine: { opacity: 1 }, windwardMark: { opacity: 1 }, leewardGate: { opacity: 1 }, finishBoat: { opacity: 1 }, finishPin: { opacity: 1 }, finishLine: { opacity: 1 }, coursePath: { opacity: 1 } },
    details: [
      "This is a standard 'windward-leeward' course with two upwind legs.",
      "Boats sail: Start → Windward mark (leave to port) → Leeward gate → Windward mark → Finish.",
    ],
  },
];

// Quiz questions for the set course lesson
export const SET_COURSE_QUIZ = [
  {
    id: 'sc1',
    question: 'What is the first step in setting a fair race course?',
    options: [
      { id: 'a', text: 'Place the windward mark', isCorrect: false },
      { id: 'b', text: 'Determine the wind direction', isCorrect: true },
      { id: 'c', text: 'Set the starting line', isCorrect: false },
      { id: 'd', text: 'Position the RC boat', isCorrect: false },
    ],
    explanation: 'Determining the true wind direction is the first and most critical step. All other course elements are positioned relative to the wind direction.',
    hint: 'Everything on the course is positioned relative to one key factor...',
  },
  {
    id: 'sc2',
    question: 'How should the starting line be oriented relative to the wind?',
    options: [
      { id: 'a', text: 'Parallel to the wind (0°)', isCorrect: false },
      { id: 'b', text: 'At a 45° angle to the wind', isCorrect: false },
      { id: 'c', text: 'Perpendicular to the wind (90°)', isCorrect: true },
      { id: 'd', text: 'At a 30° angle to the wind', isCorrect: false },
    ],
    explanation: 'A "square" starting line is perpendicular (90°) to the wind. This ensures neither end of the line is favored, giving all boats an equal opportunity.',
    hint: 'A "square" line means neither end is favored...',
  },
  {
    id: 'sc3',
    question: 'Where is the windward mark placed?',
    options: [
      { id: 'a', text: 'Directly downwind from the start', isCorrect: false },
      { id: 'b', text: 'Directly upwind from the center of the starting line', isCorrect: true },
      { id: 'c', text: 'To the left of the starting line', isCorrect: false },
      { id: 'd', text: 'Behind the RC boat', isCorrect: false },
    ],
    explanation: 'The windward mark is placed directly upwind from the center of the starting line. This creates a fair upwind "beat" where both sides of the course are equal.',
    hint: 'The first mark you sail to after starting is called the "windward" mark for a reason...',
  },
  {
    id: 'sc4',
    question: 'What is the purpose of a leeward gate (two marks)?',
    options: [
      { id: 'a', text: 'To make the course longer', isCorrect: false },
      { id: 'b', text: 'To give boats tactical choices on which side to round', isCorrect: true },
      { id: 'c', text: 'To slow boats down', isCorrect: false },
      { id: 'd', text: 'To mark the finish line', isCorrect: false },
    ],
    explanation: 'A leeward gate provides tactical options - boats can choose which mark to round based on their strategy for the next leg. This adds excitement and rewards good decision-making.',
    hint: 'Two marks instead of one gives sailors options...',
  },
  {
    id: 'sc5',
    question: 'What type of course is most commonly used in sailboat racing?',
    options: [
      { id: 'a', text: 'Triangle course', isCorrect: false },
      { id: 'b', text: 'Windward-leeward course', isCorrect: true },
      { id: 'c', text: 'Circular course', isCorrect: false },
      { id: 'd', text: 'Figure-eight course', isCorrect: false },
    ],
    explanation: 'The windward-leeward course is the most common type. It tests upwind and downwind sailing skills and creates exciting tactical racing with clear passing lanes.',
    hint: 'The name describes the two main directions of sailing in the race...',
  },
];


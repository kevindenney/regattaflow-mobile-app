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
    label: "Step 5: Complete the Course Path",
    description: "The full course path shows the complete race course: Start → Windward → Leeward → Finish.",
    visualState: { wind: { opacity: 1 }, rcBoat: { opacity: 1 }, pin: { opacity: 1 }, startLine: { opacity: 1 }, windwardMark: { opacity: 1 }, leewardGate: { opacity: 1 }, coursePath: { opacity: 1 } },
    details: [
      "This is a standard 'windward-leeward' course, the most common type of race course.",
      "Boats sail upwind to the windward mark, downwind through the leeward gate, and finish at the starting line.",
    ],
  },
  {
    label: "Step 6: Set the Finish Line",
    description: "The finish line is typically the same as the starting line, marked by the RC boat and pin.",
    visualState: { wind: { opacity: 1 }, rcBoat: { opacity: 1 }, pin: { opacity: 1 }, startLine: { opacity: 1 }, windwardMark: { opacity: 1 }, leewardGate: { opacity: 1 }, coursePath: { opacity: 1 }, finishBoat: { opacity: 1 }, finishPin: { opacity: 1 }, finishLine: { opacity: 1 } },
    details: [
      "Using the same line simplifies logistics and ensures consistency.",
      "The finish line must remain clear and well-marked for accurate finish times.",
    ],
  },
];


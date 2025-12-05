/**
 * Line Bias Data
 * Ported from BetterAt Sail Racing
 */

export interface LineBiasStep {
  time: number;
  label: string;
  description: string;
  visualState?: { wind?: { rotate: number } };
  blueStart?: { x: number; y: number; rotate: number };
  redStart?: { x: number; y: number; rotate: number };
  details?: string[];
}

export const LINE_BIAS_SEQUENCE_STEPS: LineBiasStep[] = [
  {
    time: 0,
    label: "A Perfectly Square Line",
    description: "On a square line, both boats can sail a close-hauled course at -45° to the wind.",
    visualState: { wind: { rotate: 0 } },
    blueStart: { x: 480, y: 250, rotate: -45 },
    redStart: { x: 320, y: 250, rotate: -45 },
    details: [
      "Wind is from 0°. A close-hauled starboard tack means the boat's bow points 45° to the left of the wind, so its heading is -45°.",
    ],
  },
  {
    time: 5,
    label: "Square Line: Equal Progress",
    description: "With no bias, both boats make equal progress up the course.",
    visualState: { wind: { rotate: 0 } },
    blueStart: { x: 400, y: 170, rotate: -45 },
    redStart: { x: 240, y: 170, rotate: -45 },
    details: [
      "Neither boat has a geometric advantage. Their paths upwind are parallel.",
    ],
  },
  {
    time: 10,
    label: "Scenario: A 10-Degree Shift",
    description: "The wind shifts left 10°. Both boats must pivot to the new close-hauled angle to maintain speed.",
    visualState: { wind: { rotate: -10 } },
    blueStart: { x: 400, y: 170, rotate: -55 },
    redStart: { x: 240, y: 170, rotate: -55 },
    details: [
      "The new optimal close-hauled angle is now -55° (relative to the course, from the new -10° wind).",
      "Both boats pivot to match this new angle. However, their positions on the course give one a huge advantage.",
    ],
  },
  {
    time: 15,
    label: "Quantifying the Advantage",
    description: "The boat on the lifted side (red) has a much more efficient path to the mark, creating a large lead.",
    visualState: { wind: { rotate: -10 } },
    blueStart: { x: 360, y: 120, rotate: -55 },
    redStart: { x: 200, y: 120, rotate: -55 },
    details: [
      "The red boat (on the left/port side) is now 'lifted' - the wind shift favors its position.",
      "The blue boat (on the right/starboard side) is 'headed' - the wind shift works against it.",
      "This creates a significant bias toward the pin end of the line.",
    ],
  },
];


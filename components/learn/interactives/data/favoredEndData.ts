/**
 * Favored End Data
 * Ported from BetterAt Sail Racing
 */

export interface FavoredEndVisualState {
  boat?: { opacity?: number; x?: number; y?: number; rotate?: number };
  startLineGraphic?: { opacity?: number; x1?: number; y1?: number; x2?: number; y2?: number; rotate?: number };
  pinGraphic?: { opacity?: number; cx?: number; cy?: number };
  rcBoatGraphic?: { opacity?: number; x?: number; y?: number; rotate?: number };
  windArrow?: { opacity?: number; rotate?: number; x?: number; y?: number; length?: number };
  compass?: { opacity?: number; rotate?: number; lineHeading?: number; windHeading?: number; x?: number; y?: number };
  distanceIndicator?: { from: { x: number; y: number }; to: { x: number; y: number }; label: string };
  secondaryLineGraphic?: { opacity?: number; x1?: number; y1?: number; x2?: number; y2?: number; rotate?: number; label?: string };
}

export interface FavoredEndCourseStep {
  label: string;
  description: string;
  details: string[];
  visualState: FavoredEndVisualState;
}

const initialBoatState = { opacity: 0, x: 0, y: 0, rotate: 0 };
const initialLineState = { opacity: 0, x1: 200, y1: 200, x2: 600, y2: 200 };
const initialWindState = { opacity: 0, rotate: 0, x: 400, y: 50, length: 80 };
const initialCompassState = { opacity: 0, rotate: 0, lineHeading: 90, windHeading: 0, x: 100, y: 100 };

export const FAVORED_END_STEPS: FavoredEndCourseStep[] = [
  {
    label: "Introduction",
    description: "In this lesson, we'll cover two methods to figure out which end of the starting line is favored.",
    visualState: {
      boat: { ...initialBoatState, x: 240, y: 320, rotate: 90, opacity: 1 },
      startLineGraphic: { ...initialLineState, opacity: 1, x1: 200, y1: 200, x2: 600, y2: 200 },
      rcBoatGraphic: { ...initialBoatState, opacity: 1, x: 590, y: 190, rotate: 0 },
      pinGraphic: { opacity: 1, cx: 200, cy: 200 },
      windArrow: { ...initialWindState, opacity: 1, rotate: 90, x: 400, y: 50 },
    },
    details: ["Understanding line bias is crucial for a winning start."],
  },
  {
    label: "Method 1: The Approach",
    description: "Sail parallel to the starting line, about two boat lengths to leeward.",
    visualState: {
      boat: { ...initialBoatState, opacity: 1, x: 200, y: 300, rotate: 90 },
      startLineGraphic: { ...initialLineState, opacity: 1, x1: 200, y1: 200, x2: 600, y2: 200 },
      rcBoatGraphic: { ...initialBoatState, opacity: 1, x: 590, y: 190, rotate: 0 },
      pinGraphic: { opacity: 1, cx: 200, cy: 200 },
      windArrow: { ...initialWindState, opacity: 1, rotate: 90 },
      distanceIndicator: { from: { x: 200, y: 300 }, to: { x: 200, y: 200 }, label: "2 boat lengths" },
    },
    details: ["Maintain a constant distance from the line."],
  },
  {
    label: "Find the Midpoint",
    description: "Identify the midpoint of the starting line as you sail parallel.",
    visualState: {
      boat: { ...initialBoatState, opacity: 1, x: 400, y: 300, rotate: 90 },
      startLineGraphic: { ...initialLineState, opacity: 1, x1: 200, y1: 200, x2: 600, y2: 200 },
      rcBoatGraphic: { ...initialBoatState, opacity: 1, x: 590, y: 190, rotate: 0 },
      pinGraphic: { opacity: 1, cx: 200, cy: 200 },
      windArrow: { ...initialWindState, opacity: 1, rotate: 90 },
    },
    details: ["Estimate the middle between the RC boat and the pin."],
  },
  {
    label: "Turn and Coast",
    description: "At the midpoint, turn your boat towards the line and release your sails to coast.",
    visualState: {
      boat: { opacity: 1, x: 400, y: 180, rotate: 0 },
      startLineGraphic: { ...initialLineState, opacity: 1, x1: 200, y1: 200, x2: 600, y2: 200 },
      rcBoatGraphic: { ...initialBoatState, opacity: 1, x: 590, y: 190, rotate: 0 },
      pinGraphic: { opacity: 1, cx: 200, cy: 200 },
      windArrow: { ...initialWindState, opacity: 1, rotate: 90 },
    },
    details: ["Letting the sheets go reduces speed, allowing for a controlled stop."],
  },
  {
    label: "Stop and Sight (Square Line)",
    description: "Coast to a stop, head-to-wind, perfectly on the line. If both ends seem equidistant, the line is square.",
    visualState: {
      boat: { opacity: 1, x: 400, y: 180, rotate: 0 },
      startLineGraphic: { ...initialLineState, opacity: 1, x1: 200, y1: 200, x2: 600, y2: 200 },
      rcBoatGraphic: { ...initialBoatState, opacity: 1, x: 590, y: 190, rotate: 0 },
      pinGraphic: { opacity: 1, cx: 200, cy: 200 },
      windArrow: { ...initialWindState, opacity: 1, rotate: 90 },
    },
    details: ["A truly square line is rare but ideal."],
  },
  {
    label: "Stop and Sight (Pin Favored)",
    description: "If the pin end appears closer, it's favored. This means the wind is coming more from the pin side of the line.",
    visualState: {
      boat: { opacity: 1, x: 400, y: 200, rotate: -10 },
      startLineGraphic: { ...initialLineState, opacity: 1, x1: 200, y1: 200, x2: 600, y2: 200, rotate: 0 },
      secondaryLineGraphic: { opacity: 1, x1: 200, y1: 200, x2: 600, y2: 200, rotate: -10, label: "Shifted Line" },
      rcBoatGraphic: { ...initialBoatState, opacity: 1, x: 590, y: 190, rotate: 0 },
      pinGraphic: { opacity: 1, cx: 200, cy: 200 },
      windArrow: { ...initialWindState, opacity: 1, rotate: 80 },
    },
    details: ["Starting closer to the pin gives you an immediate upwind advantage."],
  },
  {
    label: "Stop and Sight (RC Favored)",
    description: "If the RC end appears closer, it's favored. The wind is coming more from the RC boat side.",
    visualState: {
      boat: { opacity: 1, x: 400, y: 200, rotate: 10 },
      startLineGraphic: { ...initialLineState, opacity: 1, x1: 200, y1: 200, x2: 600, y2: 200 },
      rcBoatGraphic: { ...initialBoatState, opacity: 1, x: 590, y: 190, rotate: 0 },
      pinGraphic: { opacity: 1, cx: 200, cy: 200 },
      windArrow: { ...initialWindState, opacity: 1, rotate: 100 },
    },
    details: ["An RC favored line means a shorter distance to the first mark from the RC boat."],
  },
  {
    label: "Method 2: The Compass Method - Get Line Heading",
    description: "Sail along the starting line to get its compass heading.",
    visualState: {
      boat: { opacity: 1, x: 200, y: 200, rotate: 90 },
      startLineGraphic: { ...initialLineState, opacity: 1, x1: 200, y1: 200, x2: 600, y2: 200 },
      rcBoatGraphic: { ...initialBoatState, opacity: 1, x: 590, y: 190, rotate: 0 },
      pinGraphic: { opacity: 1, cx: 200, cy: 200 },
      windArrow: { ...initialWindState, opacity: 0 },
      compass: { opacity: 1, x: 100, y: 20, rotate: 0, lineHeading: 90, windHeading: 0 },
    },
    details: ["A steady hand on the tiller helps get an accurate reading."],
  },
  {
    label: "Get Wind Heading",
    description: "Sail away from the line and turn head-to-wind to get the true wind heading.",
    visualState: {
      boat: { opacity: 1, x: 400, y: 200, rotate: 0 },
      startLineGraphic: { ...initialLineState, opacity: 1, x1: 200, y1: 200, x2: 600, y2: 200 },
      rcBoatGraphic: { ...initialBoatState, opacity: 1, x: 590, y: 190, rotate: 0 },
      pinGraphic: { opacity: 1, cx: 200, cy: 200 },
      windArrow: { ...initialWindState, opacity: 1, rotate: 0 },
      compass: { opacity: 1, x: 100, y: 20, rotate: 0, lineHeading: 90, windHeading: 0 },
    },
    details: ["Do this well away from any wind shadows."],
  },
  {
    label: "Compare Headings (Square Line)",
    description: "Compare the line and wind headings. If they are 90 degrees apart, the line is square.",
    visualState: {
      boat: { opacity: 1, x: 400, y: 300, rotate: 0 },
      startLineGraphic: { ...initialLineState, opacity: 1, x1: 200, y1: 200, x2: 600, y2: 200 },
      rcBoatGraphic: { ...initialBoatState, opacity: 1, x: 590, y: 190, rotate: 0 },
      pinGraphic: { opacity: 1, cx: 200, cy: 200 },
      windArrow: { ...initialWindState, opacity: 1, rotate: 0 },
      compass: { opacity: 1, x: 100, y: 20, rotate: 0, lineHeading: 90, windHeading: 0 },
    },
    details: ["Line Heading 90°, Wind Heading 0°. This represents a square line to a North wind."],
  },
  {
    label: "Compare Headings (Pin Favored)",
    description: "If the wind heading is less than 90 degrees from the line heading (e.g., wind from West of North), the pin is favored.",
    visualState: {
      boat: { opacity: 1, x: 400, y: 300, rotate: -10 },
      startLineGraphic: { ...initialLineState, opacity: 1, x1: 200, y1: 200, x2: 600, y2: 200 },
      rcBoatGraphic: { ...initialBoatState, opacity: 1, x: 590, y: 190, rotate: 0 },
      pinGraphic: { opacity: 1, cx: 200, cy: 200 },
      windArrow: { ...initialWindState, opacity: 1, rotate: -10 },
      compass: { opacity: 1, x: 100, y: 20, rotate: 0, lineHeading: 90, windHeading: -10 },
    },
    details: [
      "1. Determine the square wind heading for the line: Line Heading (90°) - 90° = 0° (North).",
      "2. Compare with the actual wind heading: Actual Wind Heading (-10°) - Square Wind Heading (0°) = -10°.",
      "3. Interpret the result: A negative difference (-10°) means the wind has shifted to the left (port side) relative to a square line, favoring the pin end.",
    ],
  },
  {
    label: "Compare Headings (RC Favored)",
    description: "If the wind heading is more than 90 degrees from the line heading (e.g., wind from East of North), the RC is favored.",
    visualState: {
      boat: { opacity: 1, x: 400, y: 300, rotate: 10 },
      startLineGraphic: { ...initialLineState, opacity: 1, x1: 200, y1: 200, x2: 600, y2: 200 },
      rcBoatGraphic: { ...initialBoatState, opacity: 1, x: 590, y: 190, rotate: 0 },
      pinGraphic: { opacity: 1, cx: 200, cy: 200 },
      windArrow: { ...initialWindState, opacity: 1, rotate: 10 },
      compass: { opacity: 1, x: 100, y: 20, rotate: 0, lineHeading: 90, windHeading: 10 },
    },
    details: [
      "1. Determine the square wind heading for the line: Line Heading (90°) - 90° = 0° (North).",
      "2. Compare with the actual wind heading: Actual Wind Heading (10°) - Square Wind Heading (0°) = +10°.",
      "3. Interpret the result: A positive difference (+10°) means the wind has shifted to the right (starboard side) relative to a square line, favoring the RC boat end.",
    ],
  },
  {
    label: "Conclusion: Anywhere on the Course",
    description: "The great advantage of the compass method is that once you have the line heading, you can determine the favored end from anywhere.",
    visualState: {
      boat: { opacity: 1, x: 150, y: 350, rotate: 0 },
      startLineGraphic: { ...initialLineState, opacity: 1, x1: 200, y1: 200, x2: 600, y2: 200 },
      rcBoatGraphic: { ...initialBoatState, opacity: 1, x: 590, y: 190, rotate: 0 },
      pinGraphic: { opacity: 1, cx: 200, cy: 200 },
      windArrow: { ...initialWindState, opacity: 1, rotate: 0 },
      compass: { opacity: 1, x: 100, y: 20, rotate: 0, lineHeading: 90, windHeading: 0 },
    },
    details: [
      "You only need to sail the line once to get its heading.",
      "After that, you can sail to any clear area, 'shoot the wind', and compare the wind heading to the line heading.",
      "This allows you to re-check the line bias as conditions change, without being in traffic.",
    ],
  },
];


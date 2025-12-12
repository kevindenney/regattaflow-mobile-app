/**
 * Favored End Data
 * Ported from BetterAt Sail Racing
 * 
 * This lesson teaches two methods to determine the favored end:
 * 1. Head-to-Wind Sight Method
 * 2. Compass Method
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
  proTip?: string;
}

export interface FavoredEndQuizQuestion {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation: string;
  hint?: string;
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
      boat: { ...initialBoatState, x: 240, y: 400, rotate: 90, opacity: 1 },
      startLineGraphic: { ...initialLineState, opacity: 1, x1: 200, y1: 200, x2: 600, y2: 200 },
      rcBoatGraphic: { ...initialBoatState, opacity: 1, x: 590, y: 190, rotate: 0 },
      pinGraphic: { opacity: 1, cx: 200, cy: 200 },
      windArrow: { ...initialWindState, opacity: 1, rotate: 0, x: 400, y: 50 },
    },
    details: ["Understanding line bias is crucial for a winning start."],
    proTip: "Always arrive at the starting area early to have time to check the line multiple times before the sequence begins.",
  },
  {
    label: "Method 1: The Approach",
    description: "Sail parallel to the starting line, about two boat lengths to leeward.",
    visualState: {
      boat: { ...initialBoatState, opacity: 1, x: 200, y: 400, rotate: 90 },
      startLineGraphic: { ...initialLineState, opacity: 1, x1: 200, y1: 200, x2: 600, y2: 200 },
      rcBoatGraphic: { ...initialBoatState, opacity: 1, x: 590, y: 190, rotate: 0 },
      pinGraphic: { opacity: 1, cx: 200, cy: 200 },
      windArrow: { ...initialWindState, opacity: 1, rotate: 0 },
      distanceIndicator: { from: { x: 200, y: 300 }, to: { x: 200, y: 200 }, label: "2 boat lengths" },
    },
    details: ["Maintain a constant distance from the line."],
    proTip: "Two boat lengths gives you enough separation to see both ends clearly without being so far that your angle of sight becomes unreliable.",
  },
  {
    label: "Find the Midpoint",
    description: "At the midpoint of the line, turn your bow toward the wind and coast to a stop straddling the line.",
    visualState: {
      // Boat at midpoint (x: 400), straddling the line (y: 250), pointing at wind (rotate: 0)
      boat: { ...initialBoatState, opacity: 1, x: 400, y: 250, rotate: 0 },
      startLineGraphic: { ...initialLineState, opacity: 1, x1: 200, y1: 200, x2: 600, y2: 200 },
      rcBoatGraphic: { ...initialBoatState, opacity: 1, x: 590, y: 190, rotate: 0 },
      pinGraphic: { opacity: 1, cx: 200, cy: 200 },
      windArrow: { ...initialWindState, opacity: 1, rotate: 0 },
    },
    details: ["Point your bow directly at the wind and let your sails luff to coast to a stop."],
    proTip: "Count the number of boat lengths from the pin to the RC to help estimate the midpoint more accurately.",
  },
  {
    label: "Turn and Coast",
    description: "At the midpoint, turn your boat towards the line and release your sails to coast.",
    visualState: {
      // y: 250 places boat center on the start line (250 + 50 offset = 300 = line position)
      // This shows half the boat above and half below the line
      boat: { opacity: 1, x: 400, y: 250, rotate: 0 },
      startLineGraphic: { ...initialLineState, opacity: 1, x1: 200, y1: 200, x2: 600, y2: 200 },
      rcBoatGraphic: { ...initialBoatState, opacity: 1, x: 590, y: 190, rotate: 0 },
      pinGraphic: { opacity: 1, cx: 200, cy: 200 },
      windArrow: { ...initialWindState, opacity: 1, rotate: 0 },
    },
    details: ["Letting the sheets go reduces speed, allowing for a controlled stop."],
    proTip: "In light air, you may need to back the jib or push the boom out to stop completely head-to-wind.",
  },
  {
    label: "Stop and Sight (Square Line)",
    description: "Coast to a stop, head-to-wind, perfectly on the line. If both ends seem equidistant, the line is square.",
    visualState: {
      // Boat straddles the line - half above, half below
      boat: { opacity: 1, x: 400, y: 250, rotate: 0 },
      startLineGraphic: { ...initialLineState, opacity: 1, x1: 200, y1: 200, x2: 600, y2: 200 },
      rcBoatGraphic: { ...initialBoatState, opacity: 1, x: 590, y: 190, rotate: 0 },
      pinGraphic: { opacity: 1, cx: 200, cy: 200 },
      windArrow: { ...initialWindState, opacity: 1, rotate: 0 },
    },
    details: ["A truly square line is rare but ideal."],
    proTip: "Even a 'square' line can change quickly—always re-check as the wind shifts during the starting sequence.",
  },
  {
    label: "Stop and Sight (Pin Favored)",
    description: "If the pin end appears closer, it's favored. This means the wind is coming more from the pin side of the line.",
    visualState: {
      boat: { opacity: 1, x: 400, y: 250, rotate: -10 },
      startLineGraphic: { ...initialLineState, opacity: 1, x1: 200, y1: 200, x2: 600, y2: 200, rotate: 0 },
      secondaryLineGraphic: { opacity: 1, x1: 200, y1: 200, x2: 600, y2: 200, rotate: -10, label: "Shifted Line" },
      rcBoatGraphic: { ...initialBoatState, opacity: 1, x: 590, y: 190, rotate: 0 },
      pinGraphic: { opacity: 1, cx: 200, cy: 200 },
      windArrow: { ...initialWindState, opacity: 1, rotate: -10 },
    },
    details: ["Starting closer to the pin gives you an immediate upwind advantage."],
    proTip: "When the pin is heavily favored, expect a crowd. Position yourself for a clean start even if it means giving up a few feet of advantage.",
  },
  {
    label: "Stop and Sight (RC Favored)",
    description: "If the RC end appears closer, it's favored. The wind is coming more from the RC boat side.",
    visualState: {
      boat: { opacity: 1, x: 400, y: 250, rotate: 10 },
      startLineGraphic: { ...initialLineState, opacity: 1, x1: 200, y1: 200, x2: 600, y2: 200 },
      rcBoatGraphic: { ...initialBoatState, opacity: 1, x: 590, y: 190, rotate: 0 },
      pinGraphic: { opacity: 1, cx: 200, cy: 200 },
      windArrow: { ...initialWindState, opacity: 1, rotate: 10 },
    },
    details: ["An RC favored line means a shorter distance to the first mark from the RC boat."],
    proTip: "Starting at the RC boat end often means more congestion and risk of being over early—be extra careful with your timing.",
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
    proTip: "Sail from pin to RC (not RC to pin) to get the heading you'll use for calculations. Write it down!",
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
    proTip: "Take multiple wind readings and average them—the wind is rarely perfectly steady.",
  },
  {
    label: "Compare Headings (Square Line)",
    description: "Compare the line and wind headings. If they are 90 degrees apart, the line is square.",
    visualState: {
      boat: { opacity: 1, x: 400, y: 400, rotate: 0 },
      startLineGraphic: { ...initialLineState, opacity: 1, x1: 200, y1: 200, x2: 600, y2: 200 },
      rcBoatGraphic: { ...initialBoatState, opacity: 1, x: 590, y: 190, rotate: 0 },
      pinGraphic: { opacity: 1, cx: 200, cy: 200 },
      windArrow: { ...initialWindState, opacity: 1, rotate: 0 },
      compass: { opacity: 1, x: 100, y: 20, rotate: 0, lineHeading: 90, windHeading: 0 },
    },
    details: ["Line Heading 90°, Wind Heading 0°. This represents a square line to a North wind."],
    proTip: "Line heading - 90° = square wind heading. Compare this to your actual wind reading to find the bias.",
  },
  {
    label: "Compare Headings (Pin Favored)",
    description: "If the wind heading is less than 90 degrees from the line heading (e.g., wind from West of North), the pin is favored.",
    visualState: {
      boat: { opacity: 1, x: 400, y: 400, rotate: -10 },
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
    proTip: "Negative difference = pin favored. Remember: 'Left shift, left end' (pin is on your left when looking upwind).",
  },
  {
    label: "Compare Headings (RC Favored)",
    description: "If the wind heading is more than 90 degrees from the line heading (e.g., wind from East of North), the RC is favored.",
    visualState: {
      boat: { opacity: 1, x: 400, y: 400, rotate: 10 },
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
    proTip: "Positive difference = RC favored. Remember: 'Right shift, right end' (RC is on your right when looking upwind).",
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
    proTip: "The compass method is especially useful in large fleets where getting back to the line for a sight check is difficult.",
  },
];

// Quiz questions for the Favored End lesson
export const FAVORED_END_QUIZ: FavoredEndQuizQuestion[] = [
  {
    id: 'fe-q1',
    question: 'In the "head-to-wind" sight method, where should you position your boat to check line bias?',
    options: [
      { id: 'a', text: 'At the pin end of the line', isCorrect: false },
      { id: 'b', text: 'At the midpoint of the line, head-to-wind', isCorrect: true },
      { id: 'c', text: 'At the RC boat end of the line', isCorrect: false },
      { id: 'd', text: 'Three boat lengths behind the line', isCorrect: false },
    ],
    explanation: 'The sight method requires you to stop at the midpoint of the line, head-to-wind. From this position, you can sight both ends and determine which appears closer (favored).',
    hint: 'Think about where you would have an equal view of both ends...',
  },
  {
    id: 'fe-q2',
    question: 'If the line heading is 90° and the wind heading is 80°, which end is favored?',
    options: [
      { id: 'a', text: 'The pin end', isCorrect: true },
      { id: 'b', text: 'The RC boat end', isCorrect: false },
      { id: 'c', text: 'Neither—the line is square', isCorrect: false },
      { id: 'd', text: 'Cannot be determined from this information', isCorrect: false },
    ],
    explanation: 'Square wind = Line heading - 90° = 0°. Actual wind (80°) - Square wind (0°) = -10° (wind from left). A negative difference means the pin is favored.',
    hint: 'Calculate the difference from the "square" wind heading...',
  },
  {
    id: 'fe-q3',
    question: 'What is the main advantage of the compass method over the sight method?',
    options: [
      { id: 'a', text: 'It\'s more accurate', isCorrect: false },
      { id: 'b', text: 'You can check bias from anywhere on the course', isCorrect: true },
      { id: 'c', text: 'It doesn\'t require any calculations', isCorrect: false },
      { id: 'd', text: 'It works better in light air', isCorrect: false },
    ],
    explanation: 'Once you have the line heading (which only needs to be measured once), you can sail to any clear area, shoot the wind, and calculate the bias without returning to the crowded start line.',
    hint: 'Think about what happens in a crowded starting area...',
  },
  {
    id: 'fe-q4',
    question: 'When using the sight method, what does it mean if the pin end appears "closer" to you?',
    options: [
      { id: 'a', text: 'The RC end is favored', isCorrect: false },
      { id: 'b', text: 'The line is square', isCorrect: false },
      { id: 'c', text: 'The pin end is favored', isCorrect: true },
      { id: 'd', text: 'You are not positioned correctly', isCorrect: false },
    ],
    explanation: 'When you\'re head-to-wind at the midpoint, the end that appears closer is the favored end. If the pin looks closer, it means the pin is further upwind and therefore favored.',
    hint: 'The end that appears closer is further upwind...',
  },
  {
    id: 'fe-q5',
    question: 'How often should you check line bias before a start?',
    options: [
      { id: 'a', text: 'Once, at the five-minute warning', isCorrect: false },
      { id: 'b', text: 'Only when you first arrive at the starting area', isCorrect: false },
      { id: 'c', text: 'Multiple times—the wind can shift', isCorrect: true },
      { id: 'd', text: 'Never—the race committee sets a fair line', isCorrect: false },
    ],
    explanation: 'Wind conditions can change rapidly. What was pin-favored at the 5-minute gun could be RC-favored by the start. Top sailors check bias multiple times throughout the starting sequence.',
    hint: 'Think about how wind conditions change over time...',
  },
];

// Deep Dive content for detailed explanations
export const FAVORED_END_DEEP_DIVE = {
  title: 'Finding the Favored End: Advanced Concepts',
  sections: [
    {
      heading: 'Why Check Line Bias?',
      content: 'The starting line is rarely set perfectly perpendicular to the wind. Even experienced race committees struggle to set a "square" line, and wind shifts during the starting sequence make it even harder. Finding and exploiting line bias can give you a significant advantage—potentially several boat lengths—before you even cross the starting line.',
    },
    {
      heading: 'The Sight Method Explained',
      content: 'The head-to-wind sight method is intuitive and quick. By positioning yourself at the midpoint of the line and turning head-to-wind, you create a reference line that\'s perpendicular to the wind. The end of the starting line that appears "closer" (further forward) is the favored end. This method works best in moderate winds where you can reliably stop head-to-wind.',
    },
    {
      heading: 'The Compass Method Explained',
      content: 'The compass method is more analytical but offers the advantage of being usable from anywhere on the course. First, sail along the line to get its heading (e.g., 90°). Then, calculate the "square" wind heading by subtracting 90° (e.g., 0°). Finally, compare your actual wind reading to this square heading. If the actual wind is less than the square heading, the pin is favored; if more, the RC is favored.',
    },
    {
      heading: 'Combining Both Methods',
      content: 'Expert sailors often use both methods together. They\'ll take a compass reading of the line early in the pre-start, then use quick sight checks closer to the start to confirm the bias hasn\'t changed. This combination provides both accuracy and real-time updates.',
    },
  ],
  proTips: [
    'In oscillating breeze, the favored end can change multiple times during the starting sequence. Stay flexible!',
    'A heavily favored end will attract more boats—sometimes a clean start at the less-favored end is better than a crowded, messy start at the favored end.',
    'Practice the sight method in training until it becomes second nature. You should be able to check bias in under 30 seconds.',
    'Write down your line heading! In the heat of the starting sequence, it\'s easy to forget the number you calculated.',
  ],
};


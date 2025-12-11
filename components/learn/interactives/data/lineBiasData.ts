/**
 * Line Bias Data
 * Ported from BetterAt Sail Racing
 * 
 * This lesson demonstrates why finding the favored end of the starting line
 * gives you a winning advantage.
 */

export interface LineBiasStep {
  time: number;
  label: string;
  description: string;
  visualState?: { wind?: { rotate: number } };
  blueStart?: { x: number; y: number; rotate: number };
  redStart?: { x: number; y: number; rotate: number };
  details?: string[];
  proTip?: string;
}

export interface LineBiasQuizQuestion {
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

export const LINE_BIAS_SEQUENCE_STEPS: LineBiasStep[] = [
  // --- Step 1: Introduction - boats below the start line, between pin and RC ---
  {
    time: 0,
    label: "Why Line Bias Matters",
    description: "The starting line is rarely perfectly perpendicular to the wind. One end is usually 'favored'—meaning it is physically further upwind than the other.",
    visualState: { wind: { rotate: 0 } },
    blueStart: { x: 450, y: 420, rotate: -45 },
    redStart: { x: 350, y: 420, rotate: -45 },
    details: [
      "Identifying line bias allows you to start 'ahead' of the competition before the race even begins.",
      "Even a small 5-degree bias can translate to a significant lead within the first few minutes.",
      "This is a critical tactical decision that top racers always analyze before the start.",
    ],
    proTip: "Always check the wind direction relative to the line before the start. A 5-degree bias is hard to see with the naked eye but huge on the course.",
  },
  // --- Step 2: A Perfectly Square Line - boats crossing between pin and RC ---
  {
    time: 5,
    label: "A Perfectly Square Line",
    description: "On a square line, both boats can sail a close-hauled course at -45° to the wind.",
    visualState: { wind: { rotate: 0 } },
    blueStart: { x: 420, y: 340, rotate: -45 },
    redStart: { x: 320, y: 340, rotate: -45 },
    details: [
      "Wind is from 0° (straight down the course). A close-hauled starboard tack means the boat's bow points 45° to the left of the wind.",
      "On a square line, no geometric advantage exists—both ends are equidistant from the windward mark.",
      "A truly square line is rare, but it's the baseline for understanding bias.",
    ],
    proTip: "Even when the line is set square, wind shifts during the sequence can create bias. Keep checking!",
  },
  // --- Step 3: Square Line Progress - boats moving up together ---
  {
    time: 10,
    label: "Square Line: Equal Progress",
    description: "With no bias, both boats make equal progress up the course.",
    visualState: { wind: { rotate: 0 } },
    blueStart: { x: 380, y: 260, rotate: -45 },
    redStart: { x: 280, y: 260, rotate: -45 },
    details: [
      "Neither boat has a geometric advantage. Their paths upwind are parallel.",
      "Both boats cover the same distance to the windward mark.",
      "This scenario is ideal for demonstrating what happens when the wind shifts.",
    ],
    proTip: "Watch the other boats in the fleet during the pre-start. If they're all clustering at one end, there's probably a reason.",
  },
  // --- Step 4: A 10-Degree Shift ---
  {
    time: 15,
    label: "Scenario: A 10-Degree Wind Shift",
    description: "The wind shifts left 10°. Both boats must pivot to the new close-hauled angle to maintain speed.",
    visualState: { wind: { rotate: -10 } },
    blueStart: { x: 380, y: 260, rotate: -55 },
    redStart: { x: 280, y: 260, rotate: -55 },
    details: [
      "The new optimal close-hauled angle is now -55° (relative to the course, from the new -10° wind).",
      "Both boats pivot to match this new angle.",
      "However, their positions on the course now give one boat a huge advantage!",
    ],
    proTip: "Wind shifts change everything. The boat on the lifted side suddenly has a shorter path to the mark.",
  },
  // --- Step 5: Quantifying the Advantage ---
  {
    time: 20,
    label: "Quantifying the Advantage",
    description: "The boat on the lifted side (red/port) has a much more efficient path to the mark, creating a large lead.",
    visualState: { wind: { rotate: -10 } },
    blueStart: { x: 350, y: 200, rotate: -55 },
    redStart: { x: 240, y: 180, rotate: -55 },
    details: [
      "The red boat (closer to the port/pin end) is now 'lifted' - the wind shift favors its position.",
      "The blue boat (further to starboard) is 'headed' - the wind shift works against it.",
      "Over a 1-mile leg, a 5-degree shift is worth ~460 feet. A 10-degree shift is worth ~920 feet!",
      "This massive advantage was gained simply by being on the favored side when the shift happened.",
    ],
    proTip: "The math is simple: each degree of bias = about 90 feet per mile of advantage. Always start on the favored end!",
  },
  // --- Step 6: The Effective Line ---
  {
    time: 25,
    label: "Understanding the Effective Line",
    description: "The 'effective start line' is perpendicular to the wind, not the physical start line. The favored end is closer to this effective line.",
    visualState: { wind: { rotate: -10 } },
    blueStart: { x: 350, y: 200, rotate: -55 },
    redStart: { x: 240, y: 180, rotate: -55 },
    details: [
      "Think of an invisible line perpendicular to the wind drawn through the course.",
      "The end of the physical start line that is further UP this effective line is favored.",
      "Starting from the favored end means you're literally starting 'ahead' of boats at the other end.",
    ],
    proTip: "Visualize the effective line in your head before every start. It makes the bias obvious.",
  },
  // --- Step 7: How to Detect Bias - boats in middle checking line ---
  {
    time: 30,
    label: "How to Detect Line Bias",
    description: "There are two main methods: the 'head-to-wind' sight method and the compass method. Both help you identify which end is favored.",
    visualState: { wind: { rotate: -10 } },
    blueStart: { x: 450, y: 380, rotate: 0 },
    redStart: { x: 380, y: 420, rotate: 0 },
    details: [
      "Method 1: Sail to the middle of the line, stop head-to-wind, and sight both ends. The end that appears 'ahead' is favored.",
      "Method 2: Note the line's compass bearing, then the wind direction. If they're 90° apart, the line is square.",
      "If the difference is less than 90°, the pin is favored. If more than 90°, the boat end is favored.",
    ],
    proTip: "Practice both methods. The compass method works from anywhere on the course, but the sight method is faster in crowded starts.",
  },
  // --- Step 8: Practical Application - boats approaching start between pin and RC ---
  {
    time: 35,
    label: "Putting It Into Practice",
    description: "Before every start, check line bias multiple times. Wind can shift, and what was favored 5 minutes ago may not be favored now.",
    visualState: { wind: { rotate: -10 } },
    blueStart: { x: 420, y: 420, rotate: -55 },
    redStart: { x: 320, y: 420, rotate: -55 },
    details: [
      "Check bias during the warning signal, preparatory signal, and at 1 minute.",
      "If bias is small (under 5°), positioning and clean air may matter more than end choice.",
      "If bias is large (over 10°), fight for the favored end—it's worth the crowd.",
      "Be flexible: if a late shift changes the bias, be ready to adjust your plan.",
    ],
    proTip: "Top sailors check line bias 3-4 times before the start. The wind is always shifting, and the bias can change right up until the gun.",
  },
];

// Quiz questions for the Line Bias lesson
export const LINE_BIAS_QUIZ: LineBiasQuizQuestion[] = [
  {
    id: 'lb-q1',
    question: 'What does "line bias" refer to in sailing?',
    options: [
      { id: 'a', text: 'The tendency of boats to drift sideways', isCorrect: false },
      { id: 'b', text: 'One end of the starting line being closer to the wind than the other', isCorrect: true },
      { id: 'c', text: 'The angle of the starting line relative to shore', isCorrect: false },
      { id: 'd', text: 'How crowded one end of the line is', isCorrect: false },
    ],
    explanation: 'Line bias occurs when the starting line is not perpendicular to the wind. This means one end is geometrically further upwind (favored) than the other.',
    hint: 'Think about the relationship between the line and the wind direction...',
  },
  {
    id: 'lb-q2',
    question: 'If the wind shifts 10 degrees to the left, which end of the line becomes favored?',
    options: [
      { id: 'a', text: 'The committee boat (starboard) end', isCorrect: false },
      { id: 'b', text: 'The pin (port) end', isCorrect: true },
      { id: 'c', text: 'Both ends remain equal', isCorrect: false },
      { id: 'd', text: 'It depends on the current direction', isCorrect: false },
    ],
    explanation: 'When the wind shifts left, the pin (port) end becomes favored because boats starting there are now closer to the "effective" upwind line.',
    hint: 'A left shift means the wind is now coming more from the left side...',
  },
  {
    id: 'lb-q3',
    question: 'How much advantage (approximately) does a 5-degree line bias give over a 1-mile upwind leg?',
    options: [
      { id: 'a', text: 'About 50 feet', isCorrect: false },
      { id: 'b', text: 'About 150 feet', isCorrect: false },
      { id: 'c', text: 'About 460 feet', isCorrect: true },
      { id: 'd', text: 'About 1000 feet', isCorrect: false },
    ],
    explanation: 'The rule of thumb is approximately 90 feet per degree per mile. So 5 degrees × 90 feet = 450-460 feet advantage!',
    hint: 'Each degree of bias is worth about 90 feet per mile...',
  },
  {
    id: 'lb-q4',
    question: 'What is the "head-to-wind" method for checking line bias?',
    options: [
      { id: 'a', text: 'Sailing fast along the line', isCorrect: false },
      { id: 'b', text: 'Stopping in the middle of the line, pointing into the wind, and sighting both ends', isCorrect: true },
      { id: 'c', text: 'Asking the race committee which end is favored', isCorrect: false },
      { id: 'd', text: 'Watching where other boats are going', isCorrect: false },
    ],
    explanation: 'By stopping head-to-wind in the middle of the line and sighting both ends, the end that appears "ahead" or upwind is the favored end.',
    hint: 'When head-to-wind, you\'re looking perpendicular to the wind direction...',
  },
  {
    id: 'lb-q5',
    question: 'When using the compass method, if the line bearing is 90° and the wind is from 85°, which end is favored?',
    options: [
      { id: 'a', text: 'The committee boat end', isCorrect: false },
      { id: 'b', text: 'The pin end', isCorrect: true },
      { id: 'c', text: 'Neither - the line is square', isCorrect: false },
      { id: 'd', text: 'Cannot be determined', isCorrect: false },
    ],
    explanation: 'If line = 90° and wind = 85°, the difference is only 85° (less than 90°). This means the wind is shifted left of square, making the pin end favored.',
    hint: 'A square line has exactly 90° between line bearing and wind direction...',
  },
];

// Deep Dive content for the Line Bias lesson
export const LINE_BIAS_DEEP_DIVE = {
  title: "Mastering Line Bias",
  introduction: `The starting line is rarely perfectly perpendicular to the wind. One end is usually "favored"—meaning it is physically further upwind than the other. Identifying this bias allows you to start "ahead" of the competition before the race even begins.`,
  
  sections: [
    {
      title: "The Math Behind Line Bias",
      content: `Every degree of line bias translates to approximately 90 feet of advantage per mile of upwind sailing. This means:
      
• 5° bias = ~450 feet advantage per mile
• 10° bias = ~900 feet advantage per mile
• 15° bias = ~1,350 feet advantage per mile

In a typical club race with a 0.5-mile upwind leg, even a 5° bias gives you a 225-foot head start!`,
    },
    {
      title: "Two Methods to Check Bias",
      content: `**The Sight Method (Quick)**
1. Sail to the approximate middle of the line
2. Stop head-to-wind (bow pointing directly into the wind)
3. Look at both ends of the line
4. The end that appears "ahead" or upwind is favored

**The Compass Method (Precise)**
1. Sail along the line and note its compass bearing
2. Sail away and head directly into the wind, note the wind bearing
3. If the difference is exactly 90°, the line is square
4. Less than 90°: pin end favored | More than 90°: boat end favored`,
    },
    {
      title: "When to Check Bias",
      content: `Top sailors check line bias multiple times before the start:
      
• At the warning signal (5 minutes) - Initial assessment
• At the preparatory signal (4 minutes) - Confirm or adjust
• At 2 minutes - Check for any recent shifts
• At 1 minute - Final confirmation

Wind shifts can change the favored end right up until the gun. Stay flexible!`,
    },
    {
      title: "When Line Bias Doesn't Matter",
      content: `Sometimes other factors outweigh line bias:
      
• **Very light air**: Clean air and positioning matter more than a few degrees
• **Very crowded lines**: A clean start at the unfavored end beats a messy start at the favored end
• **Persistent shift expected**: If you know the wind will shift, start on the side that will benefit from it
• **Current**: Strong current can make one end tactically better despite wind bias`,
    },
  ],
  
  proTips: [
    "Always check the wind direction relative to the line before the start. A 5-degree bias is hard to see with the naked eye but huge on the course.",
    "Watch where the fleet clusters during pre-start. If everyone's at one end, they've probably identified bias.",
    "In shifty conditions, check bias more frequently. What was pin-favored at 5 minutes might be boat-favored at 1 minute.",
    "Practice the head-to-wind method until it becomes second nature. It takes only 15 seconds and can make or break your race.",
    "Keep a mental note of the compass heading of common starting lines at your club. This makes detecting changes faster.",
  ],
  
  commonMistakes: [
    "Checking bias only once and assuming it won't change",
    "Fighting for the favored end when it's too crowded for a clean start",
    "Ignoring small biases (even 3-5° matters!)",
    "Not accounting for current when assessing which end is tactically better",
    "Letting other boats' positions influence your bias assessment instead of checking yourself",
  ],
};

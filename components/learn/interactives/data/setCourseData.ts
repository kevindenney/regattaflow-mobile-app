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

export interface DeepDiveContent {
  whyItMatters?: string[];
  commonMistakes?: string[];
  advancedTactics?: string[];
  rulesAndRegulations?: string[];
  proTips?: string[];
}

export interface CourseStep {
  label: string;
  description: string;
  details: string[]; // Basic details for quick reference
  deepDive?: DeepDiveContent; // Comprehensive deep dive content
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
    deepDive: {
      whyItMatters: [
        'Determining true wind direction is the foundation of all course setting - every other element depends on this measurement',
        'An accurate wind direction ensures a fair race where neither side of the course is permanently favored',
        'Wind direction affects how the starting line is positioned, where marks are placed, and the overall fairness of the race',
        'Race committees use multiple instruments and observations over time to find the average wind direction, accounting for shifts and oscillations',
        'Understanding how wind direction is determined helps sailors appreciate why course setup takes time and why adjustments may be needed',
      ],
      commonMistakes: [
        'Measuring wind direction only once instead of taking multiple readings over time to find the average',
        'Not accounting for wind shifts or oscillations, leading to an unfair course setup',
        'Using inaccurate instruments or not calibrating instruments properly before use',
        'Ignoring local effects like land features, current, or other boats that can affect apparent wind',
        'Setting the course too quickly without allowing time for wind patterns to stabilize',
        'Not monitoring wind changes after course setup, potentially leading to an unfair race',
      ],
      advancedTactics: [
        'Race committees use anemometers, wind vanes, and compass readings to triangulate true wind direction',
        'Multiple readings are taken over 5-15 minutes to find the average direction and identify patterns',
        'Visual observations of flags, water surface patterns, and cloud movement supplement instrument readings',
        'In shifty conditions, committees may choose an average direction or wait for conditions to stabilize',
        'Understanding the measurement process helps sailors predict how the course might be adjusted if conditions change',
        'Local knowledge of wind patterns in the area helps committees set better courses',
      ],
      rulesAndRegulations: [
        'RRS 32.1: The race committee may change the course before the start signal for any class',
        'RRS 27.1: The race committee shall publish the sailing instructions before the race',
        'The sailing instructions typically specify how wind direction will be measured and what instruments will be used',
        'Race committees have discretion in how they measure wind, but fairness is the primary consideration',
        'If wind shifts significantly after course setup, the race committee may adjust the course (RRS 32)',
      ],
      proTips: [
        'As a sailor, understanding how wind is measured helps you understand why course setup takes time',
        'Watch the race committee during setup - their positioning and measurements reveal wind conditions',
        'If you notice the committee taking many readings, conditions are likely shifty or variable',
        'Wind direction can change between course setup and the start - stay flexible in your strategy',
        'In your own practice, learn to estimate wind direction using visual cues like flags and water patterns',
        'Understanding true vs apparent wind helps you better understand course setup and your own sailing',
        'The better you understand course setup, the better you can predict and adapt to course changes',
      ],
    },
  },
  {
    label: "Step 2: Set the Starting Line",
    description: "The starting line is set perpendicular (90°) to the wind direction.",
    visualState: { wind: { opacity: 1 }, rcBoat: { opacity: 1 }, pin: { opacity: 1 }, startLine: { opacity: 1 } },
    details: [
      "A 'square' starting line ensures that neither the committee boat end nor the pin end is favored.",
      "The line is defined by the orange flag on the RC boat and the pin-end mark.",
    ],
    deepDive: {
      whyItMatters: [
        'A square starting line ensures fairness - no boat gets an advantage simply by choosing one end over the other',
        'An unfair line (not square to the wind) can give one side a significant advantage, potentially several boat lengths',
        'The starting line sets the stage for the entire race - an unfair line can determine the outcome before boats even start',
        'Understanding line setup helps sailors identify when a line might be biased and adjust their strategy accordingly',
        'A well-set starting line promotes exciting, tactical racing with multiple viable starting strategies',
      ],
      commonMistakes: [
        'Setting the line at an angle to the wind, creating bias toward one end',
        'Not accounting for wind shifts during setup, leading to a line that becomes biased over time',
        'Placing marks too close together, creating a short line that increases congestion',
        'Placing marks too far apart, making it difficult for boats to identify the line boundaries',
        'Not checking line bias after setup or failing to adjust if conditions change',
        'Allowing local effects (current, land features) to influence line placement incorrectly',
      ],
      advancedTactics: [
        'Race committees use multiple methods to check if a line is square: sighting from the middle, using compass bearings, or measuring angles',
        'Visual checks from the middle of the line help identify bias - if one end appears closer, that end is likely favored',
        'Compass bearings of the line and wind direction should differ by 90° for a square line',
        'Experienced committees check line bias multiple times and adjust if needed before the start',
        'In shifty conditions, committees may choose an average line orientation or accept slight bias',
        'Understanding how to check line bias helps sailors identify advantages during the pre-start',
      ],
      rulesAndRegulations: [
        'RRS Definition: Starting Line - The starting line is defined by the race committee boat (orange flag) and the pin-end mark',
        'RRS 27.1: The race committee shall publish the sailing instructions, which specify the starting line',
        'RRS 32.1: The race committee may change the course (including the starting line) before the start signal',
        'The starting line must be clearly marked and visible to all boats',
        'Both ends of the line (RC boat and pin) must be clearly identifiable',
      ],
      proTips: [
        'Learn to check line bias yourself during the pre-start - this is a crucial tactical skill',
        'Use visual sighting from the middle of the line to identify which end might be favored',
        'Watch where experienced sailors position themselves - they often reveal line bias through their choices',
        'In shifty conditions, line bias can change - stay flexible in your starting strategy',
        'If you identify significant bias, the favored end may be crowded - consider the less-favored end for clear air',
        'Understanding line setup helps you appreciate when and why race committees adjust the course',
        'Practice identifying line bias in different conditions to develop your tactical skills',
      ],
    },
  },
  {
    label: "Step 3: Place the Windward Mark",
    description: "The windward mark is placed directly upwind from the center of the starting line.",
    visualState: { wind: { opacity: 1 }, rcBoat: { opacity: 1 }, pin: { opacity: 1 }, startLine: { opacity: 1 }, windwardMark: { opacity: 1 } },
    details: [
      "The distance to the windward mark determines the length of the upwind 'beat' or 'leg'.",
      "Common distances range from 0.5 to 1.5 nautical miles depending on conditions and fleet size.",
    ],
    deepDive: {
      whyItMatters: [
        'The windward mark position determines the length and difficulty of the first upwind leg',
        'Mark placement affects strategy - a longer leg allows for more tactical options, while a shorter leg emphasizes boat speed',
        'The distance and position influence how much boats can separate, affecting opportunities for passing and tactical decisions',
        'Proper placement ensures a fair course where both sides have equal opportunities',
        'The windward mark is the first major tactical decision point - its placement sets up the entire race',
      ],
      commonMistakes: [
        'Placing the mark too close to the start, creating a short leg with limited tactical options',
        'Placing the mark too far away, making the leg too long and potentially creating separation issues',
        'Not accounting for wind shifts, leading to a mark that becomes biased over time',
        'Placing the mark where it\'s difficult to see or identify, creating confusion during the race',
        'Not considering fleet size - larger fleets may need longer legs to allow for separation',
        'Ignoring current or local effects that can make the mark position unfair',
      ],
      advancedTactics: [
        'Race committees typically place the windward mark 0.5-1.5 nautical miles from the start, depending on conditions',
        'In light air, shorter legs are often used to maintain fleet cohesion and avoid excessive separation',
        'In heavy air, longer legs allow for more tactical options and better fleet separation',
        'Large fleets benefit from longer legs, giving boats more room to spread out and avoid congestion',
        'The mark should be visible from the start area - bright colors, flags, and proper positioning aid identification',
        'Committees consider the expected wind conditions and may adjust mark distance based on forecasts',
      ],
      rulesAndRegulations: [
        'RRS 27.1: The race committee shall publish the sailing instructions, which specify the course and mark positions',
        'RRS 32.1: The race committee may change the course before the start signal',
        'RRS 28.1: A boat shall start, sail the course, and finish',
        'The sailing instructions must specify the rounding direction (port or starboard) for each mark',
        'Mark positions must be clearly specified in the sailing instructions or on the course board',
      ],
      proTips: [
        'Check the sailing instructions or course board for exact mark distances and positions',
        'Use GPS or rangefinders (if allowed) to measure distance to the mark during the pre-start',
        'In light air, shorter legs mean position is more critical - fight harder for clear air',
        'In heavy air, longer legs offer more opportunities to catch up if you have a bad start',
        'Understanding mark placement helps you plan your strategy for the first leg',
        'Watch how the fleet spreads out on the first leg - this reveals the tactical opportunities',
        'If the mark is hard to see, look for other boats heading toward it to confirm position',
      ],
    },
  },
  {
    label: "Step 4: Set the Leeward Gate",
    description: "The leeward gate consists of two marks that boats must pass between on the downwind leg.",
    visualState: { wind: { opacity: 1 }, rcBoat: { opacity: 1 }, pin: { opacity: 1 }, startLine: { opacity: 1 }, windwardMark: { opacity: 1 }, leewardGate: { opacity: 1 } },
    details: [
      "The gate allows boats to choose which side to round, adding tactical options.",
      "The gate is typically positioned downwind from the windward mark.",
    ],
    deepDive: {
      whyItMatters: [
        'The leeward gate introduces tactical decision-making - boats must choose which mark to round',
        'Gate placement affects downwind strategy and sets up the next leg of the race',
        'A well-positioned gate creates multiple viable options, rewarding good decision-making',
        'The gate prevents all boats from rounding the same mark in the same way, reducing congestion',
        'Understanding gate setup helps sailors develop downwind tactics and rounding strategies',
      ],
      commonMistakes: [
        'Placing gate marks too close together, eliminating the tactical choice',
        'Placing gate marks too far apart, making it difficult for boats to sail between them',
        'Not positioning the gate properly relative to the wind, creating bias toward one mark',
        'Gate marks that are difficult to see or identify, leading to confusion and mistakes',
        'Not accounting for current or local effects that can make one gate mark unfairly favored',
        'Placing the gate too close to the windward mark or too far downwind',
      ],
      advancedTactics: [
        'Gate marks are typically positioned 2-4 boat lengths apart, allowing boats to sail between them',
        'The gate should be perpendicular to the wind direction for fairness',
        'Committees position the gate downwind from the windward mark at a distance that creates a challenging downwind leg',
        'Gate placement affects tactics - a gate closer to the windward mark favors speed, while a distant gate favors tactics',
        'The gate creates a "decision zone" where boats must commit to their rounding strategy',
        'Understanding gate geometry helps sailors identify which mark might be favored and plan accordingly',
      ],
      rulesAndRegulations: [
        'RRS 28.1: A boat shall start, sail the course, and finish - the course includes passing through the gate',
        'RRS 18.1: Gate marks are marks of the course - right-of-way rules apply when rounding',
        'The sailing instructions must specify how boats should round the gate (typically: sail between the marks)',
        'RRS 18.2: When boats are rounding or passing a gate mark, normal right-of-way rules apply',
        'Boats must pass between the gate marks - rounding outside the gate is a course violation',
      ],
      proTips: [
        'Study the gate layout during the pre-start to identify which mark might be favored',
        'Gate marks can create tactical opportunities - sometimes the "wrong" mark offers clear air',
        'In close racing, gate rounding order can determine positions for the next leg',
        'Watch how other boats approach the gate - experienced sailors reveal tactical information',
        'Plan your gate approach well in advance - last-minute decisions often lead to mistakes',
        'If you\'re unsure which mark to choose, look ahead to the next leg to see which offers better positioning',
        'Practice gate roundings to develop smooth, efficient techniques that maintain boat speed',
      ],
    },
  },
  {
    label: "Step 5: Set the Finish Line",
    description: "The finish line is typically near the starting line, marked by the RC boat and a separate pin.",
    visualState: { wind: { opacity: 1 }, rcBoat: { opacity: 1 }, pin: { opacity: 1 }, startLine: { opacity: 1 }, windwardMark: { opacity: 1 }, leewardGate: { opacity: 1 }, finishBoat: { opacity: 1 }, finishPin: { opacity: 1 }, finishLine: { opacity: 1 } },
    details: [
      "The finish line is usually set near the start area for easy observation by race officials.",
      "The finish line must remain clear and well-marked for accurate finish times.",
    ],
    deepDive: {
      whyItMatters: [
        'The finish line position determines the final leg of the race and can significantly affect outcomes',
        'A well-positioned finish line creates exciting finishes with multiple boats finishing simultaneously',
        'Finish line placement affects strategy for the final leg - boats must plan their approach',
        'The finish must be clearly visible to race officials for accurate timing and scoring',
        'Understanding finish line setup helps sailors plan their final leg strategy and approach',
      ],
      commonMistakes: [
        'Placing the finish line where it\'s difficult for race officials to see or time finishes',
        'Creating a finish line that favors one side, giving an unfair advantage',
        'Not clearly marking the finish line, leading to confusion about when boats have finished',
        'Placing the finish in a congested area, creating dangerous situations',
        'Not accounting for wind direction, creating a finish that\'s difficult to approach',
        'Finish line that\'s too short, making it difficult for multiple boats to finish simultaneously',
      ],
      advancedTactics: [
        'Finish lines are typically positioned near the start area for logistical convenience',
        'The finish line is often set perpendicular to the wind for fairness and visibility',
        'Race committees position the finish to create an exciting final leg, often upwind to the finish',
        'A longer finish line allows multiple boats to finish simultaneously without interference',
        'Committees consider visibility, wind conditions, and safety when positioning the finish',
        'The finish line must remain clear of other course elements and allow boats to finish from multiple angles',
      ],
      rulesAndRegulations: [
        'RRS Definition: Finishing Line - The finishing line is defined by the race committee boat and a separate pin or mark',
        'RRS 28.1: A boat finishes when any part of her hull crosses the finishing line',
        'RRS 44.2: A boat that has finished shall not interfere with boats that have not finished',
        'The sailing instructions must specify the finish line location and how boats should finish',
        'Race committees must position the finish line clearly and ensure officials can observe all finishes',
      ],
      proTips: [
        'Study the finish line layout during the pre-start to plan your final leg approach',
        'Identify the finish line early in the race - don\'t wait until the final leg to locate it',
        'Plan your approach to the finish well in advance - last-minute decisions often lead to mistakes',
        'If multiple boats are finishing together, protect your position and avoid interference',
        'A boat that has finished must stay clear of boats still racing - know the rules',
        'Practice finishing in different conditions to develop smooth, efficient techniques',
        'Understanding finish line setup helps you plan your strategy for the final leg of the race',
      ],
    },
  },
  {
    label: "Step 6: Complete the Course Path",
    description: "The full race: Cross start → Round windward mark (port rounding) → Through leeward gate → Back to windward → Cross finish.",
    visualState: { wind: { opacity: 1 }, rcBoat: { opacity: 1 }, pin: { opacity: 1 }, startLine: { opacity: 1 }, windwardMark: { opacity: 1 }, leewardGate: { opacity: 1 }, finishBoat: { opacity: 1 }, finishPin: { opacity: 1 }, finishLine: { opacity: 1 }, coursePath: { opacity: 1 } },
    details: [
      "This is a standard 'windward-leeward' course with two upwind legs.",
      "Boats sail: Start → Windward mark (leave to port) → Leeward gate → Windward mark → Finish.",
    ],
    deepDive: {
      whyItMatters: [
        'The windward-leeward course is the most common race format, testing key sailing skills',
        'This course type emphasizes upwind sailing ability, downwind speed, and tactical decision-making',
        'The two upwind legs create multiple opportunities for position changes and tactical moves',
        'Understanding the complete course layout helps sailors plan their overall race strategy',
        'The course geometry creates clear passing lanes and tactical opportunities throughout the race',
      ],
      commonMistakes: [
        'Not understanding the complete course layout and sailing the wrong route',
        'Forgetting which marks to round and in which direction (port vs starboard)',
        'Not planning for the second windward leg, leading to poor positioning',
        'Failing to account for how the first leg sets up subsequent legs',
        'Not recognizing that windward-leeward courses reward consistent performance across all legs',
        'Ignoring tactical opportunities created by the course geometry',
      ],
      advancedTactics: [
        'Windward-leeward courses test multiple skills: upwind speed, downwind speed, mark roundings, and tactics',
        'The first leg sets up the race - a good first leg often leads to a good overall result',
        'The second windward leg offers opportunities to catch up if you\'re behind, or consolidate if you\'re ahead',
        'Plan your race strategy considering all legs - don\'t just focus on the first leg',
        'Gate choices affect positioning for the second upwind leg - think ahead',
        'The finish leg requires careful planning - protect your position while sailing efficiently',
      ],
      rulesAndRegulations: [
        'RRS 28.1: A boat shall start, sail the course, and finish',
        'RRS 28.2: A string representing a boat\'s track shall pass each mark on the required side',
        'The sailing instructions must specify the course, including all marks and rounding directions',
        'RRS 32.1: The race committee may shorten the course by displaying flag S',
        'Boats must round all marks in the correct order and direction as specified in the sailing instructions',
      ],
      proTips: [
        'Review the sailing instructions and course diagram before racing to understand the complete course',
        'Visualize the entire race in your mind - this helps with planning and decision-making',
        'The windward-leeward course rewards all-around sailing ability - work on all aspects of your sailing',
        'Each leg is important - don\'t give up on any leg, as positions can change significantly',
        'Practice sailing complete windward-leeward courses to develop race strategy',
        'Study how top sailors approach each leg - they often reveal effective strategies',
        'Understanding course geometry helps you identify tactical opportunities throughout the race',
      ],
    },
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


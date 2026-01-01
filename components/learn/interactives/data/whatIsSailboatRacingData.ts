/**
 * What is Sailboat Racing? - Lesson Data
 * An engaging introduction to competitive sailing for beginners
 *
 * This lesson shows the flow of a typical sailboat race from start to finish,
 * highlighting what makes racing exciting without overwhelming technical details.
 */

export interface RaceOverviewStep {
  time: number; // Timeline position (seconds)
  label: string;
  description: string;
  details?: string[];
  proTip?: string;
  boats: BoatPosition[];
  marks?: MarkPosition[];
  highlights?: string[]; // Elements to highlight
}

export interface BoatPosition {
  id: string;
  color: string;
  x: number;
  y: number;
  rotation: number; // degrees, 0 = pointing right (east)
  hasSpinnaker?: boolean;
}

export interface MarkPosition {
  id: string;
  type: 'windward' | 'leeward' | 'gate-left' | 'gate-right' | 'start-pin' | 'rc-boat' | 'finish-buoy';
  x: number;
  y: number;
}

// Fleet of 8 boats with distinct colors
const FLEET_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Orange/Yellow
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

// Course marks - different configurations for different steps
// Course overview marks (step 1) - shows full course with single leeward mark
const COURSE_OVERVIEW_MARKS: MarkPosition[] = [
  { id: 'windward', type: 'windward', x: 400, y: 80 },
  { id: 'leeward', type: 'leeward', x: 400, y: 320 },
  { id: 'start-pin', type: 'start-pin', x: 200, y: 420 },
  { id: 'rc-boat', type: 'rc-boat', x: 600, y: 420 },
];

// Start area marks only (steps 2-3) - no leeward mark during start/upwind
const START_AREA_MARKS: MarkPosition[] = [
  { id: 'windward', type: 'windward', x: 400, y: 80 },
  { id: 'start-pin', type: 'start-pin', x: 200, y: 420 },
  { id: 'rc-boat', type: 'rc-boat', x: 600, y: 420 },
];

// Full course marks (steps 4+) - includes leeward gate ABOVE start line
const FULL_COURSE_MARKS: MarkPosition[] = [
  { id: 'windward', type: 'windward', x: 400, y: 80 },
  { id: 'gate-left', type: 'gate-left', x: 350, y: 320 },
  { id: 'gate-right', type: 'gate-right', x: 450, y: 320 },
  { id: 'start-pin', type: 'start-pin', x: 200, y: 420 },
  { id: 'rc-boat', type: 'rc-boat', x: 600, y: 420 },
];

// Legacy constant for backward compatibility
const COURSE_MARKS = FULL_COURSE_MARKS;

export const RACE_OVERVIEW_STEPS: RaceOverviewStep[] = [
  // ==================== STEP 1: THE COURSE ====================
  {
    time: 0,
    label: 'The Race Course',
    description: 'A sailboat race takes place on a marked course on the water. The most common is a "windward-leeward" course - boats sail upwind to a mark, then downwind back.',
    details: [
      'The course is set by the Race Committee based on wind direction',
      'Marks (buoys) define where boats must sail',
      'Boats race in a fleet - everyone starts together',
      'The first boat to complete the course wins!',
    ],
    proTip: 'The challenge: sailboats cannot sail directly into the wind, so getting to the windward mark requires zig-zagging (called "tacking").',
    marks: COURSE_OVERVIEW_MARKS, // Show full course layout with leeward mark
    boats: [
      // Fleet spread out near start line, milling around
      { id: 'boat1', color: FLEET_COLORS[0], x: 300, y: 450, rotation: 45 },
      { id: 'boat2', color: FLEET_COLORS[1], x: 350, y: 460, rotation: 60 },
      { id: 'boat3', color: FLEET_COLORS[2], x: 400, y: 455, rotation: 30 },
      { id: 'boat4', color: FLEET_COLORS[3], x: 450, y: 465, rotation: 50 },
      { id: 'boat5', color: FLEET_COLORS[4], x: 500, y: 450, rotation: 40 },
      { id: 'boat6', color: FLEET_COLORS[5], x: 280, y: 470, rotation: 55 },
      { id: 'boat7', color: FLEET_COLORS[6], x: 380, y: 475, rotation: 35 },
      { id: 'boat8', color: FLEET_COLORS[7], x: 520, y: 470, rotation: 45 },
    ],
  },

  // ==================== STEP 2: THE START ====================
  {
    time: 10,
    label: 'The Start',
    description: 'Racing begins with a countdown sequence. When the starting signal sounds, all boats race to cross the starting line. The start is one of the most exciting moments!',
    details: [
      'A countdown sequence (usually 5-4-1-0 minutes) signals the start',
      'Boats jockey for position on the starting line',
      'Being first across the line at full speed is a huge advantage',
      'Start too early and you must go back - too late and you\'re behind!',
    ],
    proTip: 'The best sailors time their approach perfectly - crossing the line at full speed just as the start signal sounds.',
    marks: START_AREA_MARKS, // No leeward gate yet - just start area
    boats: [
      // Fleet lined up at start, all heading upwind
      { id: 'boat1', color: FLEET_COLORS[0], x: 250, y: 425, rotation: -45 },
      { id: 'boat2', color: FLEET_COLORS[1], x: 300, y: 422, rotation: -45 },
      { id: 'boat3', color: FLEET_COLORS[2], x: 350, y: 420, rotation: -45 },
      { id: 'boat4', color: FLEET_COLORS[3], x: 400, y: 418, rotation: -45 },
      { id: 'boat5', color: FLEET_COLORS[4], x: 450, y: 422, rotation: -45 },
      { id: 'boat6', color: FLEET_COLORS[5], x: 500, y: 425, rotation: -45 },
      { id: 'boat7', color: FLEET_COLORS[6], x: 550, y: 428, rotation: -45 },
      { id: 'boat8', color: FLEET_COLORS[7], x: 325, y: 430, rotation: -45 },
    ],
    highlights: ['start-line'],
  },

  // ==================== STEP 3: UPWIND BATTLE ====================
  {
    time: 20,
    label: 'The Upwind Battle',
    description: 'After the start, boats sail toward the windward mark. Since they can\'t sail directly into the wind, they must "tack" - zig-zagging back and forth.',
    details: [
      'Boats sail at about 45 degrees to the wind',
      'Tacking (turning through the wind) is a key skill',
      'Sailors look for wind shifts to gain an advantage',
      'Position and tactics matter as much as speed',
    ],
    proTip: 'Smart sailors watch the wind constantly - sailing on the "lifted" tack (when the wind shifts in your favor) means less distance to travel.',
    marks: START_AREA_MARKS, // No leeward gate yet - boats are heading upwind
    // Boats on alternating tacks creating the classic zig-zag upwind pattern
    // Wind from south (180°), so upwind = north
    // Starboard tack: rotation 315° (-45°) = heading NW, wind on starboard/right side
    // Port tack: rotation 45° = heading NE, wind on port/left side
    boats: [
      // Lead group - approaching windward mark from different sides
      { id: 'boat1', color: FLEET_COLORS[0], x: 320, y: 160, rotation: -45 },  // Starboard tack, left side of course
      { id: 'boat2', color: FLEET_COLORS[1], x: 480, y: 150, rotation: 45 },   // Port tack, right side of course
      // Middle pack - spread across showing different tactical choices
      { id: 'boat3', color: FLEET_COLORS[2], x: 260, y: 220, rotation: -45 },  // Starboard tack, far left
      { id: 'boat4', color: FLEET_COLORS[3], x: 380, y: 200, rotation: 45 },   // Port tack, center-right
      { id: 'boat5', color: FLEET_COLORS[4], x: 520, y: 210, rotation: 45 },   // Port tack, far right
      { id: 'boat6', color: FLEET_COLORS[5], x: 300, y: 280, rotation: -45 },  // Starboard tack, left
      // Back of pack - still fighting upwind
      { id: 'boat7', color: FLEET_COLORS[6], x: 440, y: 270, rotation: 45 },   // Port tack, center-right
      { id: 'boat8', color: FLEET_COLORS[7], x: 360, y: 320, rotation: -45 },  // Starboard tack, center
    ],
    highlights: ['windward', 'tacking-lines'],
  },

  // ==================== STEP 4: MARK ROUNDING ====================
  {
    time: 30,
    label: 'Rounding the Mark',
    description: 'When boats reach the windward mark, they must round it and head downwind toward the leeward gate. This is where positions can change dramatically as boats converge!',
    details: [
      'Boats must pass the mark on the correct side',
      'Tight packs create exciting action at marks',
      'Rules determine who has right-of-way',
      'Good mark roundings can gain or lose positions',
    ],
    proTip: 'The inside boat at a mark has the advantage - experienced sailors fight for the inside position.',
    marks: FULL_COURSE_MARKS, // Now show leeward gate - boats will head there next
    // Windward mark is at (400, 80). Boats round to PORT (counterclockwise/left-to-right).
    // - Approaching boats come from RIGHT (east) side on starboard tack (heading NW, rotation -45)
    // - Boats that have rounded exit on LEFT (west) side heading downwind (rotation ~160-180)
    //
    // NOTE: Visual center offset is (+10, +16) from position due to scale=0.4 and local center at (25,40)
    // So to position a boat's visual center at (X, Y), set position to (X-10, Y-16)
    boats: [
      // Already rounded - on the LEFT (west) side of mark, heading downwind (SW)
      { id: 'boat1', color: FLEET_COLORS[0], x: 310, y: 100, rotation: 200 },  // Leader, past mark, heading SW
      { id: 'boat2', color: FLEET_COLORS[1], x: 340, y: 85, rotation: 190 },   // Just past mark, heading S
      // At the mark - mid-rounding, just west of mark
      { id: 'boat3', color: FLEET_COLORS[2], x: 370, y: 68, rotation: 150 },   // At mark, bearing away
      { id: 'boat4', color: FLEET_COLORS[3], x: 395, y: 50, rotation: 60 },    // At mark, mid-turn (visual center ~405,66 - clear of mark)
      // Approaching - on starboard tack layline, sailing PARALLEL course that passes just above mark
      // They're not pointing AT the mark, but on a NW heading (-45°) that will take them just past it
      // Positioned so their course passes north of mark, then they bear away around it
      { id: 'boat5', color: FLEET_COLORS[4], x: 430, y: 55, rotation: -45 },   // On layline, about to round
      { id: 'boat6', color: FLEET_COLORS[5], x: 465, y: 90, rotation: -45 },   // On layline approach
      { id: 'boat7', color: FLEET_COLORS[6], x: 500, y: 125, rotation: -45 },  // Approaching on layline
      { id: 'boat8', color: FLEET_COLORS[7], x: 535, y: 160, rotation: -45 },  // Back of pack on layline
    ],
    highlights: ['windward'],
  },

  // ==================== STEP 5: DOWNWIND RUN ====================
  {
    time: 40,
    label: 'The Downwind Run',
    description: 'With the wind behind them, boats race downwind toward the leeward gate. Many boats fly colorful spinnakers - large, balloon-like sails that catch the wind.',
    details: [
      'Spinnakers are large, colorful sails for downwind sailing',
      'Boats can sail much faster with the wind behind them',
      'Gybing (turning the stern through the wind) is the key maneuver',
      'Different angles can find more speed or shorter distance',
    ],
    proTip: 'The fastest route downwind isn\'t always straight! Boats often "gybe" back and forth to find the best angles and wind.',
    marks: FULL_COURSE_MARKS, // Show full course with leeward gate
    // Leeward gate is at x=350 (left) and x=450 (right), y=320
    // Boats pass THROUGH the gate (between the marks), then head back upwind
    boats: [
      // Already rounded - below gate, heading back upwind
      // Gate marks at x=350 (left) and x=450 (right), y=320 - keep boats well clear
      { id: 'boat1', color: FLEET_COLORS[0], x: 380, y: 380, rotation: -45 },  // Rounded left mark, starboard tack upwind
      { id: 'boat2', color: FLEET_COLORS[1], x: 420, y: 375, rotation: 45 },   // Rounded right mark, port tack upwind
      // Just passed through gate - below the marks
      { id: 'boat3', color: FLEET_COLORS[2], x: 390, y: 355, rotation: -35 },  // Just passed through, turning up
      { id: 'boat4', color: FLEET_COLORS[3], x: 410, y: 350, rotation: 30 },   // Just passed through, turning up
      // Approaching the gate - sailing downwind toward it (stay above y=320)
      { id: 'boat5', color: FLEET_COLORS[4], x: 400, y: 270, rotation: 170 },  // Center approach
      { id: 'boat6', color: FLEET_COLORS[5], x: 380, y: 240, rotation: 165 },  // Left-center approach
      { id: 'boat7', color: FLEET_COLORS[6], x: 420, y: 250, rotation: 175 },  // Right-center approach
      { id: 'boat8', color: FLEET_COLORS[7], x: 400, y: 200, rotation: 168 },  // Further back, center
    ],
    highlights: ['spinnakers'],
  },

  // ==================== STEP 6: THE FINISH ====================
  {
    time: 50,
    label: 'The Finish',
    description: 'After completing the course (often multiple laps), boats race to the finish line. Close finishes are common and incredibly exciting!',
    details: [
      'Finish line is set by the Race Committee',
      'Boats are ranked by order of finishing',
      'Photo finishes happen regularly',
      'Every second counts in competitive racing!',
    ],
    proTip: 'Races are won and lost by seconds or even inches. That\'s what makes sailboat racing so thrilling!',
    marks: [
      { id: 'windward', type: 'windward', x: 400, y: 80 },
      { id: 'gate-left', type: 'gate-left', x: 350, y: 320 },
      { id: 'gate-right', type: 'gate-right', x: 450, y: 320 },
      // Start line remains visible
      { id: 'start-pin', type: 'start-pin', x: 200, y: 420 },
      { id: 'rc-boat', type: 'rc-boat', x: 450, y: 420 },
      // Finish buoy to the RIGHT of RC boat - moved farther for longer finish line
      { id: 'finish-buoy', type: 'finish-buoy', x: 650, y: 420 },
    ],
    boats: [
      // Boats sailing downwind to finish - spread above and below finish line (x=450 to x=650, y=420)
      // Keep boats clear of the finish buoy at x=650
      // Already finished (below finish line, past it)
      { id: 'boat1', color: FLEET_COLORS[0], x: 500, y: 450, rotation: 170 }, // Just finished!
      { id: 'boat2', color: FLEET_COLORS[1], x: 540, y: 455, rotation: 165 }, // Finished
      // Crossing the finish line
      { id: 'boat3', color: FLEET_COLORS[2], x: 520, y: 420, rotation: 175 }, // Crossing now!
      { id: 'boat4', color: FLEET_COLORS[3], x: 560, y: 418, rotation: 168 }, // Crossing
      // Still approaching (above finish line)
      { id: 'boat5', color: FLEET_COLORS[4], x: 490, y: 380, rotation: 170 }, // Almost there
      { id: 'boat6', color: FLEET_COLORS[5], x: 530, y: 370, rotation: 165 }, // Approaching
      { id: 'boat7', color: FLEET_COLORS[6], x: 510, y: 340, rotation: 172 }, // Coming down
      { id: 'boat8', color: FLEET_COLORS[7], x: 550, y: 330, rotation: 160 }, // Behind
    ],
    highlights: ['finish-line'],
  },

  // ==================== STEP 7: WHY RACE? ====================
  {
    time: 60,
    label: 'Why Sailboat Racing?',
    description: 'Sailboat racing combines athletic skill, tactical thinking, and an understanding of nature. It\'s chess on the water - where split-second decisions matter!',
    details: [
      'No two races are ever the same - wind and water always change',
      'Racing sharpens your sailing skills faster than anything else',
      'A vibrant community of racers at every level',
      'From club racing to the Olympics - there\'s a path for everyone',
    ],
    proTip: 'Ready to try racing? Start with your local sailing club - most offer beginner-friendly racing programs!',
    marks: FULL_COURSE_MARKS,
    boats: [
      // Victory pose - lead boat celebrating, others finishing
      { id: 'boat1', color: FLEET_COLORS[0], x: 400, y: 410, rotation: 0 },
      { id: 'boat2', color: FLEET_COLORS[1], x: 380, y: 430, rotation: 85 },
      { id: 'boat3', color: FLEET_COLORS[2], x: 420, y: 425, rotation: 90 },
      { id: 'boat4', color: FLEET_COLORS[3], x: 360, y: 440, rotation: 88 },
      { id: 'boat5', color: FLEET_COLORS[4], x: 440, y: 435, rotation: 82 },
      { id: 'boat6', color: FLEET_COLORS[5], x: 340, y: 450, rotation: 92 },
      { id: 'boat7', color: FLEET_COLORS[6], x: 460, y: 445, rotation: 85 },
      { id: 'boat8', color: FLEET_COLORS[7], x: 320, y: 460, rotation: 95 },
    ],
  },
];

// Quiz questions for the lesson
export interface QuizQuestion {
  id: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  explanation: string;
  hint?: string;
}

export const WHAT_IS_SAILBOAT_RACING_QUIZ: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'Why do sailboats "tack" (zig-zag) when sailing upwind?',
    options: [
      { id: 'a', text: 'To confuse other boats', isCorrect: false },
      { id: 'b', text: 'Because sailboats cannot sail directly into the wind', isCorrect: true },
      { id: 'c', text: 'To make the race longer', isCorrect: false },
      { id: 'd', text: 'It\'s a racing rule requirement', isCorrect: false },
    ],
    explanation: 'Sailboats cannot sail directly into the wind due to how sails generate forward force. Instead, they must sail at an angle to the wind (about 45 degrees) and tack back and forth to make progress upwind.',
    hint: 'Think about how sails work - they need wind flowing across them to generate power.',
  },
  {
    id: 'q2',
    question: 'What is a spinnaker?',
    options: [
      { id: 'a', text: 'A type of mark on the course', isCorrect: false },
      { id: 'b', text: 'A large, colorful sail used for downwind sailing', isCorrect: true },
      { id: 'c', text: 'A racing penalty', isCorrect: false },
      { id: 'd', text: 'The person who steers the boat', isCorrect: false },
    ],
    explanation: 'A spinnaker is a large, balloon-shaped sail used when sailing downwind. They\'re often brightly colored and help boats sail much faster when the wind is behind them.',
    hint: 'Think about what you saw in the downwind section of the animation...',
  },
  {
    id: 'q3',
    question: 'What makes mark roundings exciting in sailboat racing?',
    options: [
      { id: 'a', text: 'Boats must stop at each mark', isCorrect: false },
      { id: 'b', text: 'Multiple boats converge in a small area, creating tactical battles', isCorrect: true },
      { id: 'c', text: 'The marks give out prizes', isCorrect: false },
      { id: 'd', text: 'Boats change crews at each mark', isCorrect: false },
    ],
    explanation: 'Mark roundings are exciting because boats that have spread out on the leg all converge at the same point. This creates close racing, tactical decisions about positioning, and opportunities to gain or lose places!',
    hint: 'Think about what happens when boats all need to pass the same point...',
  },
  {
    id: 'q4',
    question: 'What happens if a boat crosses the starting line before the start signal?',
    options: [
      { id: 'a', text: 'They win the race automatically', isCorrect: false },
      { id: 'b', text: 'They get a time bonus', isCorrect: false },
      { id: 'c', text: 'They must go back and restart', isCorrect: true },
      { id: 'd', text: 'Nothing - early starts are allowed', isCorrect: false },
    ],
    explanation: 'If a boat is over the line early (OCS - "On Course Side"), they must return to the pre-start side of the line and restart properly. This costs valuable time and can ruin a race!',
    hint: 'Remember from the Start section - timing is everything...',
  },
  {
    id: 'q5',
    question: 'What is a "windward-leeward" course?',
    options: [
      { id: 'a', text: 'A course where boats sail around an island', isCorrect: false },
      { id: 'b', text: 'A course with marks directly upwind and downwind', isCorrect: true },
      { id: 'c', text: 'A course only sailed in light wind', isCorrect: false },
      { id: 'd', text: 'A course shaped like a triangle', isCorrect: false },
    ],
    explanation: 'A windward-leeward course has a mark directly upwind (windward mark) and marks directly downwind (leeward gate or mark). It\'s the most common course type because it tests both upwind and downwind sailing skills.',
    hint: 'Think about the course layout shown in the animation - what direction were the marks relative to the wind?',
  },
];

// Deep dive content for the lesson
export const DEEP_DIVE_CONTENT = {
  title: 'More About Sailboat Racing',
  sections: [
    {
      title: 'Types of Racing',
      content: 'There are many types of sailboat racing: Fleet racing (everyone starts together), Match racing (one-on-one duels), Team racing (teams working together), and more. Each offers unique challenges and excitement.',
    },
    {
      title: 'Racing Rules',
      content: 'The Racing Rules of Sailing govern how boats interact. Key rules include: starboard tack boats have right-of-way over port tack boats, windward boats keep clear of leeward boats, and boats must give mark room at marks.',
    },
    {
      title: 'Getting Started',
      content: 'The best way to start racing is at your local sailing club. Most clubs offer beginner-friendly racing programs, often called "beer can races" or "Wednesday night racing." It\'s informal, fun, and a great way to learn!',
    },
  ],
  proTips: [
    'Watch the water ahead of you - darker patches indicate more wind',
    'Keep your head out of the boat - look at competitors and conditions',
    'The start is crucial - practice starting drills whenever you can',
    'Learn the basic rules early - they\'ll save you from collisions and protests',
  ],
};

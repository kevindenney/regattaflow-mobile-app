/**
 * Right of Way Rules Data
 * 
 * This lesson teaches the fundamental right-of-way rules in sailboat racing:
 * - Port/Starboard (Rule 10)
 * - Windward/Leeward (Rule 11)
 * - Overtaking (Rule 12)
 */

export interface BoatAnimationState {
  opacity?: number;
  x?: number;
  y?: number;
  rotate?: number;
  color?: string;
  label?: string;
  isOutlined?: boolean;
  showTackIndicator?: boolean;
  highlightBoom?: boolean;
  // Animation waypoints
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  // Wake trail
  showWake?: boolean;
  wakeIntensity?: number; // 0-1, how strong the wake appears
}

export interface RightOfWayVisualState {
  boat1?: BoatAnimationState;
  boat2?: BoatAnimationState;
  windArrow?: { opacity?: number; rotate?: number; x?: number; y?: number };
  courseLine?: { opacity?: number; x1?: number; y1?: number; x2?: number; y2?: number };
  mark?: { opacity?: number; cx?: number; cy?: number; type?: 'windward' | 'leeward' | 'finish' };
  highlight?: { type: 'port' | 'starboard' | 'windward' | 'leeward' | 'overtaking'; boat: 'boat1' | 'boat2' };
  ruleText?: { opacity?: number; text?: string; x?: number; y?: number };
  // Progressive boat movement animation
  boatMovement?: {
    enabled?: boolean;
    duration?: number;
    showGiveWay?: boolean; // Whether to show give-way maneuver at end
    curvedPath?: boolean; // Whether boat1 follows a curved path (for give-way)
    loop?: boolean; // Whether to loop the animation
    loopDelay?: number; // Delay before loop restarts (ms)
    pauseAtEnd?: number; // Pause at end before looping (ms)
    // Custom Bezier control points for curved path (relative to start position)
    ctrl1?: { x: number; y: number }; // First control point offset
    ctrl2?: { x: number; y: number }; // Second control point offset
  };
  // Animation sequence timing
  animationSequence?: {
    windDelay?: number; // Delay before wind appears
    boat1Delay?: number; // Delay before boat1 appears
    boat2Delay?: number; // Delay before boat2 appears
    pathDelay?: number; // Delay before collision paths draw
    labelDelay?: number; // Delay before labels appear
    movementDelay?: number; // Delay before boats start moving
  };
  // Collision danger visualization
  collisionDanger?: {
    enabled?: boolean;
    intensity?: number; // 0-1, pulsing intensity
    warningRadius?: number; // Size of warning zone
  };
  // Collision course visualization
  collisionCourse?: { 
    opacity?: number; 
    boat1Path?: { x1?: number; y1?: number; x2?: number; y2?: number };
    boat2Path?: { x1?: number; y1?: number; x2?: number; y2?: number };
    collisionPoint?: { cx?: number; cy?: number };
  };
  // Give-way maneuver visualization
  giveWayManeuver?: {
    opacity?: number;
    path?: { d?: string }; // SVG path for curved arrow
    label?: { text?: string; x?: number; y?: number };
  };
  // Alternative maneuver path (e.g., head up option for windward boat)
  headUpPath?: {
    opacity?: number;
    path?: { d?: string }; // SVG path for curved arrow
    label?: { text?: string; x?: number; y?: number };
  };
  // Right-of-way indicators
  rightOfWayLabels?: {
    giveWay?: { text?: string; x?: number; y?: number; boat?: 'boat1' | 'boat2' };
    standOn?: { text?: string; x?: number; y?: number; boat?: 'boat1' | 'boat2' };
  };
  // Course direction arrows
  courseArrows?: {
    boat1?: { opacity?: number; x?: number; y?: number; rotate?: number };
    boat2?: { opacity?: number; x?: number; y?: number; rotate?: number };
  };
  // Path labels along course lines
  pathLabels?: {
    portTack?: { text?: string; x?: number; y?: number; rotate?: number };
    starboardTack?: { text?: string; x?: number; y?: number; rotate?: number };
  };
  // Direction line showing boat's sailing direction
  directionLine?: {
    opacity?: number;
    boat?: 'boat1' | 'boat2';
    length?: number;
  };
  // Annotations pointing out specific features
  annotations?: {
    mast?: { text?: string; x?: number; y?: number; boat?: 'boat1' | 'boat2' };
    windSide?: { text?: string; x?: number; y?: number; boat?: 'boat1' | 'boat2' };
  };
  // Dynamic labels that follow animated boat positions
  dynamicLabels?: {
    boat1Label?: string;
    boat2Label?: string;
  };
  // Interactive practice scenario configuration for Step 6
  interactiveScenarios?: InteractiveScenarioConfig;
}

export interface RightOfWayDeepDive {
  sections: { heading: string; content: string }[];
  proTips: string[];
}

export interface RightOfWayStep {
  label: string;
  description: string;
  details: string[];
  visualState: RightOfWayVisualState;
  proTip?: string;
  ruleReference?: string;
  deepDive?: RightOfWayDeepDive;
}

export interface RightOfWayQuizQuestion {
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

// Interactive Practice Scenario Types
export type RuleType = 'port-starboard' | 'windward-leeward' | 'overtaking';
export type UserRole = 'give-way' | 'stand-on';
export type TackType = 'port' | 'starboard';

export interface ScenarioBoatConfig {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  decisionX: number; // Position when animation pauses for decision
  decisionY: number;
  resolutionEndX: number; // Final position after give-way maneuver
  resolutionEndY: number;
  rotate: number; // Initial heading
  tack: TackType;
  color: string;
  isUserBoat: boolean;
  label: string;
  giveWayPath?: string; // SVG path for give-way maneuver (if this boat gives way)
  // For curved give-way maneuver
  giveWayCtrl1?: { x: number; y: number };
  giveWayCtrl2?: { x: number; y: number };
  // Label positioning - offset from boat center
  labelOffsetX?: number; // Horizontal offset for label (default 0)
  labelOffsetY?: number; // Vertical offset for label (default -45 = above)
}

export interface PracticeScenario {
  id: string;
  name: string;
  ruleType: RuleType;
  ruleNumber: number; // 10, 11, or 12
  ruleText: string;
  description: string;

  // Decision checklist - which question applies
  checklistQuestion: 1 | 2 | 3; // 1=overtaking, 2=opposite tacks, 3=same tack

  // Boat configurations
  yourBoat: ScenarioBoatConfig;
  otherBoat: ScenarioBoatConfig;

  // Wind direction (0 = from North)
  windDirection: number;

  // Correct answer for user
  userRole: UserRole; // What role does "Your Boat" have?

  // Explanation shown after decision
  correctExplanation: string;
  incorrectExplanation: string;

  // Visual indicators to show during approach
  showTackLabels: boolean;
  showPositionLabels: boolean; // windward/leeward
  showCollisionCourse: boolean;

  // Optional badge positioning overrides
  yourBoatBadgeOffset?: { x: number; y: number };
  otherBoatBadgeOffset?: { x: number; y: number };
  ruleBadgePosition?: { x: number; y: number };
}

export interface InteractiveScenarioConfig {
  enabled: boolean;
  scenarios: PracticeScenario[];
  approachDuration: number; // ms - time for boats to approach decision point
  decisionPauseDuration: number; // ms - how long to wait at decision point
  resolutionDuration: number; // ms - time for give-way maneuver
  loopDelay: number; // ms - delay before next scenario
}

// Practice Scenarios for Step 6
export const PRACTICE_SCENARIOS: PracticeScenario[] = [
  // Scenario 1: Port-Starboard Crossing - You are on PORT (must give way)
  {
    id: 'ps-1-port',
    name: 'Port-Starboard Crossing',
    ruleType: 'port-starboard',
    ruleNumber: 10,
    ruleText: 'Rule 10: Port gives way to Starboard',
    description: 'Classic crossing situation on opposite tacks',
    checklistQuestion: 2, // "Are we on opposite tacks?"
    yourBoat: {
      startX: 120,
      startY: 420,
      endX: 500,
      endY: 120,
      decisionX: 280,
      decisionY: 300,
      resolutionEndX: 550,
      resolutionEndY: 420, // Bears away to pass well astern
      rotate: 45, // Heading NE
      tack: 'port',
      color: '#10B981', // Green for "Your Boat"
      isUserBoat: true,
      label: 'Your Boat',
      giveWayPath: 'M 280,300 Q 400,380 550,420',
      giveWayCtrl1: { x: 120, y: 80 },
      giveWayCtrl2: { x: 220, y: 120 },
      labelOffsetX: 0,
      labelOffsetY: -55, // Above boat
    },
    otherBoat: {
      startX: 680,
      startY: 420,
      endX: 280,
      endY: 120,
      decisionX: 520,
      decisionY: 300,
      resolutionEndX: 280,
      resolutionEndY: 120,
      rotate: 315, // Heading NW
      tack: 'starboard',
      color: '#3B82F6', // Blue for "Other Boat"
      isUserBoat: false,
      label: 'Other Boat',
      labelOffsetX: 0,
      labelOffsetY: -55, // Above boat (consistent)
    },
    windDirection: 0,
    userRole: 'give-way',
    correctExplanation: 'Correct! You are on PORT tack (wind over left side). The other boat is on STARBOARD tack. Port ALWAYS gives way to starboard.',
    incorrectExplanation: 'Not quite. Look at which tack each boat is on. You are on PORT tack, they are on STARBOARD. Rule 10 says port gives way!',
    showTackLabels: true,
    showPositionLabels: false,
    showCollisionCourse: true,
    yourBoatBadgeOffset: { x: -100, y: 70 },
    otherBoatBadgeOffset: { x: 100, y: 70 },
    ruleBadgePosition: { x: 400, y: 470 },
  },

  // Scenario 2: Port-Starboard Crossing - You are on STARBOARD (stand on)
  {
    id: 'ps-2-starboard',
    name: 'Port-Starboard Crossing',
    ruleType: 'port-starboard',
    ruleNumber: 10,
    ruleText: 'Rule 10: Port gives way to Starboard',
    description: 'Classic crossing - you have right of way this time',
    checklistQuestion: 2,
    yourBoat: {
      startX: 680,
      startY: 420,
      endX: 280,
      endY: 120,
      decisionX: 520,
      decisionY: 300,
      resolutionEndX: 280,
      resolutionEndY: 120,
      rotate: 315, // Heading NW
      tack: 'starboard',
      color: '#10B981',
      isUserBoat: true,
      label: 'Your Boat',
      labelOffsetX: 0,
      labelOffsetY: -55, // Above boat (consistent)
    },
    otherBoat: {
      startX: 120,
      startY: 420,
      endX: 500,
      endY: 120,
      decisionX: 280,
      decisionY: 300,
      resolutionEndX: 550,
      resolutionEndY: 420,
      rotate: 45,
      tack: 'port',
      color: '#3B82F6',
      isUserBoat: false,
      label: 'Other Boat',
      giveWayPath: 'M 280,300 Q 400,380 550,420',
      giveWayCtrl1: { x: 120, y: 80 },
      giveWayCtrl2: { x: 220, y: 120 },
      labelOffsetX: 0,
      labelOffsetY: -55, // Above boat (consistent)
    },
    windDirection: 0,
    userRole: 'stand-on',
    correctExplanation: 'Correct! You are on STARBOARD tack and have right of way. Maintain your course - the port-tack boat must keep clear.',
    incorrectExplanation: 'Check again! You are on STARBOARD tack (wind over right side). The other boat is on PORT. They must give way to you!',
    showTackLabels: true,
    showPositionLabels: false,
    showCollisionCourse: true,
    yourBoatBadgeOffset: { x: 100, y: 70 },
    otherBoatBadgeOffset: { x: -100, y: 70 },
    ruleBadgePosition: { x: 400, y: 470 },
  },

  // Scenario 3: Windward-Leeward - You are WINDWARD (must give way)
  // Boats on parallel courses, overlapped - windward to the right (closer to wind), leeward to the left
  // Sailing more easterly (NE direction), boats closer together
  {
    id: 'wl-1-windward',
    name: 'Windward-Leeward',
    ruleType: 'windward-leeward',
    ruleNumber: 11,
    ruleText: 'Rule 11: Windward boat keeps clear',
    description: 'Same tack, overlapped - who is upwind?',
    checklistQuestion: 3, // "Same tack? Windward gives way"
    yourBoat: {
      // Windward boat - to the right (upwind/closer to wind), sailing parallel NE
      startX: 480,
      startY: 420,
      endX: 620,
      endY: 180,
      decisionX: 530,
      decisionY: 320,
      resolutionEndX: 700,
      resolutionEndY: 220, // Bears away to give room
      rotate: 38, // More easterly heading (NE)
      tack: 'starboard',
      color: '#10B981',
      isUserBoat: true,
      label: 'Your Boat',
      giveWayPath: 'M 530,320 Q 620,280 700,220',
      giveWayCtrl1: { x: 90, y: -40 },
      giveWayCtrl2: { x: 140, y: -80 },
      labelOffsetX: 0,
      labelOffsetY: -55, // Above boat
    },
    otherBoat: {
      // Leeward boat - to the left (downwind), sailing parallel NE
      startX: 360,
      startY: 450,
      endX: 500,
      endY: 210,
      decisionX: 410,
      decisionY: 350,
      resolutionEndX: 540,
      resolutionEndY: 160,
      rotate: 38, // Same heading
      tack: 'starboard',
      color: '#3B82F6',
      isUserBoat: false,
      label: 'Other Boat',
      labelOffsetX: 0,
      labelOffsetY: -55, // Above boat
    },
    windDirection: 0,
    userRole: 'give-way',
    correctExplanation: 'Correct! Both boats are on the same tack. You are the WINDWARD boat (closer to the wind). Windward must keep clear of leeward.',
    incorrectExplanation: 'Not quite. Both boats are on the same tack (starboard). You are the WINDWARD boat - closer to where the wind comes from. Rule 11 says windward keeps clear!',
    showTackLabels: false,
    showPositionLabels: true,
    showCollisionCourse: false,
    yourBoatBadgeOffset: { x: 100, y: 60 },
    otherBoatBadgeOffset: { x: -100, y: 60 },
    ruleBadgePosition: { x: 450, y: 470 },
  },

  // Scenario 4: Windward-Leeward - You are LEEWARD (stand on)
  // Boats on parallel courses, overlapped - sailing more easterly (NE direction), boats closer together
  {
    id: 'wl-2-leeward',
    name: 'Windward-Leeward',
    ruleType: 'windward-leeward',
    ruleNumber: 11,
    ruleText: 'Rule 11: Windward boat keeps clear',
    description: 'Same tack, overlapped - you have right of way',
    checklistQuestion: 3,
    yourBoat: {
      // Leeward boat - to the left (downwind), sailing parallel NE
      startX: 360,
      startY: 450,
      endX: 500,
      endY: 210,
      decisionX: 410,
      decisionY: 350,
      resolutionEndX: 540,
      resolutionEndY: 160,
      rotate: 38, // More easterly heading (NE)
      tack: 'starboard',
      color: '#10B981',
      isUserBoat: true,
      label: 'Your Boat',
      labelOffsetX: 0,
      labelOffsetY: -55, // Above boat
    },
    otherBoat: {
      // Windward boat - to the right (upwind/closer to wind), sailing parallel NE
      startX: 480,
      startY: 420,
      endX: 620,
      endY: 180,
      decisionX: 530,
      decisionY: 320,
      resolutionEndX: 700,
      resolutionEndY: 220,
      rotate: 38, // Same heading
      tack: 'starboard',
      color: '#3B82F6',
      isUserBoat: false,
      label: 'Other Boat',
      giveWayPath: 'M 530,320 Q 620,280 700,220',
      giveWayCtrl1: { x: 90, y: -40 },
      giveWayCtrl2: { x: 140, y: -80 },
      labelOffsetX: 0,
      labelOffsetY: -55, // Above boat
    },
    windDirection: 0,
    userRole: 'stand-on',
    correctExplanation: 'Correct! You are the LEEWARD boat - further from the wind. The windward boat must keep clear of you. You can even luff to protect your position!',
    incorrectExplanation: 'Check your position relative to the wind. You are LEEWARD (downwind of the other boat). The windward boat must keep clear of you!',
    showTackLabels: false,
    showPositionLabels: true,
    showCollisionCourse: false,
    yourBoatBadgeOffset: { x: -100, y: 60 },
    otherBoatBadgeOffset: { x: 100, y: 60 },
    ruleBadgePosition: { x: 450, y: 470 },
  },

  // Scenario 5: Overtaking - You are OVERTAKING (must give way)
  // Green boat starts directly behind blue boat, then turns to pass safely
  {
    id: 'ot-1-overtaking',
    name: 'Overtaking Situation',
    ruleType: 'overtaking',
    ruleNumber: 12,
    ruleText: 'Rule 12: Overtaking boat keeps clear',
    description: 'Approaching from behind - who has priority?',
    checklistQuestion: 1, // "Am I overtaking?"
    yourBoat: {
      // Overtaking boat - starts directly behind the blue boat, same track
      startX: 420,
      startY: 480,
      endX: 520,
      endY: 180,
      decisionX: 450,
      decisionY: 380,
      resolutionEndX: 320,
      resolutionEndY: 200, // Bears away to leeward to pass safely
      rotate: 25,
      tack: 'starboard',
      color: '#10B981',
      isUserBoat: true,
      label: 'Your Boat',
      giveWayPath: 'M 450,380 Q 350,320 320,200',
      giveWayCtrl1: { x: -100, y: -60 },
      giveWayCtrl2: { x: -130, y: -140 },
      labelOffsetX: 0,
      labelOffsetY: -55, // Above boat
    },
    otherBoat: {
      // Boat clear ahead - directly in front, sailing same course
      startX: 450,
      startY: 380,
      endX: 520,
      endY: 180,
      decisionX: 475,
      decisionY: 305,
      resolutionEndX: 530,
      resolutionEndY: 160,
      rotate: 25,
      tack: 'starboard',
      color: '#3B82F6',
      isUserBoat: false,
      label: 'Other Boat',
      labelOffsetX: 0,
      labelOffsetY: -55, // Above boat
    },
    windDirection: 0,
    userRole: 'give-way',
    correctExplanation: 'Correct! You are OVERTAKING from clear astern. Even though you might be faster, the overtaking boat ALWAYS keeps clear. This rule takes priority over port/starboard!',
    incorrectExplanation: 'Think about where you are relative to the other boat. You are approaching from BEHIND - you are overtaking! Rule 12 says the overtaking boat must keep clear.',
    showTackLabels: false,
    showPositionLabels: false,
    showCollisionCourse: true,
    yourBoatBadgeOffset: { x: -120, y: 60 },
    otherBoatBadgeOffset: { x: 100, y: 60 },
    ruleBadgePosition: { x: 400, y: 470 },
  },

  // Scenario 6: Overtaking - You are being OVERTAKEN (stand on)
  // Green boat is ahead, blue boat approaches from directly behind and turns to pass
  {
    id: 'ot-2-overtaken',
    name: 'Being Overtaken',
    ruleType: 'overtaking',
    ruleNumber: 12,
    ruleText: 'Rule 12: Overtaking boat keeps clear',
    description: 'Boat approaching from behind - what do you do?',
    checklistQuestion: 1,
    yourBoat: {
      // Boat clear ahead - green boat in front, sailing same course
      startX: 450,
      startY: 380,
      endX: 520,
      endY: 180,
      decisionX: 475,
      decisionY: 305,
      resolutionEndX: 530,
      resolutionEndY: 160,
      rotate: 25,
      tack: 'starboard',
      color: '#10B981',
      isUserBoat: true,
      label: 'Your Boat',
      labelOffsetX: 0,
      labelOffsetY: -55, // Above boat
    },
    otherBoat: {
      // Overtaking boat - blue boat starts directly behind, then turns to pass
      startX: 420,
      startY: 480,
      endX: 520,
      endY: 180,
      decisionX: 450,
      decisionY: 380,
      resolutionEndX: 320,
      resolutionEndY: 200, // Bears away to leeward to pass safely
      rotate: 25,
      tack: 'starboard',
      color: '#3B82F6',
      isUserBoat: false,
      label: 'Other Boat',
      giveWayPath: 'M 450,380 Q 350,320 320,200',
      giveWayCtrl1: { x: -100, y: -60 },
      giveWayCtrl2: { x: -130, y: -140 },
      labelOffsetX: 0,
      labelOffsetY: -55, // Above boat
    },
    windDirection: 0,
    userRole: 'stand-on',
    correctExplanation: 'Correct! You are clear ahead and the other boat is overtaking. They must keep clear of you. Maintain your course and speed.',
    incorrectExplanation: 'The other boat is approaching from behind you - they are OVERTAKING. Rule 12 says the overtaking boat keeps clear, so you have right of way!',
    showTackLabels: false,
    showPositionLabels: false,
    showCollisionCourse: true,
    yourBoatBadgeOffset: { x: 100, y: 60 },
    otherBoatBadgeOffset: { x: -120, y: 60 },
    ruleBadgePosition: { x: 400, y: 470 },
  },
];

// Initial states
const initialBoat1 = { opacity: 0, x: 0, y: 0, rotate: 0, color: '#3B82F6', label: 'Boat 1' };
const initialBoat2 = { opacity: 0, x: 0, y: 0, rotate: 0, color: '#EF4444', label: 'Boat 2' };
const initialWind = { opacity: 0, rotate: 0, x: 400, y: 50 };

export const RIGHT_OF_WAY_STEPS: RightOfWayStep[] = [
  {
    label: 'Welcome to Right of Way Rules',
    description: 'Right-of-way rules are the foundation of safe sailboat racing. Let\'s learn which boat must give way when two boats meet.',
    visualState: {
      // Start with just wind indicator - boats will appear as user reads
      boat1: { ...initialBoat1, opacity: 0 },
      boat2: { ...initialBoat2, opacity: 0 },
      // Wind from North (0°) - prominent
      windArrow: { ...initialWind, opacity: 1, rotate: 0, x: 400, y: 60 },

      // Large centered rule text
      ruleText: {
        opacity: 1,
        text: 'When two boats meet, one MUST give way',
        x: 400,
        y: 250
      },
    },
    details: [
      'Right-of-way rules prevent collisions on the racecourse',
      'Every racing sailor must know these rules',
      'Rules determine which boat gives way and which maintains course',
      'Understanding these rules is essential for safe racing',
      'Let\'s see how this works with a real scenario...',
    ],
    proTip: 'These rules apply to all types of sailboat racing - from club races to the Olympics. Knowing them by heart is crucial.',
    ruleReference: 'RRS Part 2, Section A - Right of Way',
    deepDive: {
      sections: [
        {
          heading: 'Why Right-of-Way Rules Exist',
          content: 'Imagine multiple sailboats racing around a course without any rules about who gives way. It would be chaos! Right-of-way rules create order and safety on the water, ensuring fair competition while preventing dangerous collisions.',
        },
        {
          heading: 'The Two Types of Boats',
          content: 'In any right-of-way situation, there are always two roles: the GIVE-WAY boat (which must keep clear) and the STAND-ON boat (which has the right to maintain its course). Understanding which role you\'re in is the first step to racing safely.',
        },
        {
          heading: 'Learning the Rules',
          content: 'There are three main right-of-way rules you need to know: Port/Starboard, Windward/Leeward, and Overtaking. We\'ll cover each one in detail, starting with the most fundamental rule.',
        },
      ],
      proTips: [
        'When in doubt, assume you are the give-way boat and keep clear',
        'Study these rules until they become instinctive',
        'Practice identifying right-of-way situations during practice races',
        'The Racing Rules of Sailing (RRS) is the official rulebook - read Part 2',
      ],
    },
  },
  {
    label: 'The Basic Scenario',
    description: 'Here\'s a common situation: two boats sailing upwind are about to meet. One must give way - but which one?',
    visualState: {
      // Port tack boat (was blue) - follows path line exactly
      boat1: {
        ...initialBoat1,
        opacity: 1,
        startX: 200,
        startY: 380,
        x: 200,
        y: 380,
        endX: 370,  // Follows line toward collision point (stop just before)
        endY: 280,
        rotate: 45,
        // label: 'Port Tack', // Removed label
        color: '#EF4444', // Red for Port
      },
      // Starboard tack boat (was red) - follows path line exactly
      boat2: {
        ...initialBoat2,
        opacity: 1,
        startX: 600,
        startY: 380,
        x: 600,
        y: 380,
        endX: 430,  // Follows line toward collision point (stop just before)
        endY: 280,
        rotate: 315,
        // label: 'Starboard Tack', // Removed label
        color: '#10B981', // Green for Starboard
      },
      // Wind from North (0°)
      windArrow: { ...initialWind, opacity: 1, rotate: 0, x: 400, y: 60 },

      // Show both boats' course directions
      courseArrows: { opacity: 0 }, // Removed arrows by setting opacity to 0

      // Collision course indicator - paths match boat movement
      collisionCourse: {
        opacity: 1,
        boat1Path: { x1: 200, y1: 380, x2: 450, y2: 150 },
        boat2Path: { x1: 600, y1: 380, x2: 350, y2: 150 },
        collisionPoint: { cx: 400, cy: 265 },
      },

      // Collision danger indicator
      collisionDanger: {
        enabled: true,
        intensity: 1,
        warningRadius: 50,
      },

      // Rule text
      ruleText: {
        opacity: 1,
        text: 'Red boat is on PORT tack. Green boat is on STARBOARD tack. Who gives way?',
        x: 400,
        y: 450
      },

      // Animation sequence timing for dramatic effect
      animationSequence: {
        windDelay: 0,
        boat1Delay: 200,
        boat2Delay: 400,
        pathDelay: 800,
        labelDelay: 1200,
        movementDelay: 1500,
      },

      // Enable progressive boat movement animation with looping
      boatMovement: {
        enabled: true,
        duration: 4000, // 4 seconds to approach collision point
        showGiveWay: false, // Just show collision approach, not resolution
        loop: true,
        loopDelay: 1500, // Wait 1.5s before restarting
        pauseAtEnd: 2000, // Pause 2s at the danger point
      },
    },
    details: [
      'Both boats are sailing upwind toward the mark',
      'Their courses will intersect - they\'re on a collision course',
      'If neither boat takes action, they will collide',
      'Right-of-way rules tell us which boat must change course',
      'The answer depends on which TACK each boat is on',
    ],
    proTip: 'In racing, you must be constantly aware of other boats and quickly identify potential right-of-way situations before they become dangerous.',
    ruleReference: 'RRS Part 2, Section A - Right of Way',
  },
  {
    label: 'Rule 10: Port Gives Way to Starboard',
    description: 'When boats are on opposite tacks, Port tack must keep clear (GIVE WAY), while Starboard tack maintains course (STAND ON). This is the golden rule!',
    visualState: {
      // Port tack boat (red) - follows curved give-way path to pass astern (below green)
      // Starts heading NE, bears away to pass behind green, then resumes NE
      boat1: {
        ...initialBoat1,
        opacity: 1,
        startX: 200,
        startY: 300,
        x: 200,
        y: 300,
        endX: 650, // End position - east after passing behind green
        endY: 200,
        rotate: 45, // Initial heading NE (will be overridden by dynamic rotation)
        label: 'Port (Give Way)',
        color: '#EF4444', // Red for Port
      },
      // Starboard tack boat (green) - maintains straight NW course (faster to avoid overlap)
      boat2: {
        ...initialBoat2,
        opacity: 1,
        startX: 550,
        startY: 380,
        x: 550,
        y: 380,
        endX: 280, // Follows line straight NW - travels further
        endY: 110,
        rotate: 315, // Heading NW
        label: 'Starboard (Stand On)',
        color: '#10B981', // Green for Starboard
      },
      // Wind from North (0°)
      windArrow: { ...initialWind, opacity: 1, rotate: 0, x: 400, y: 60 },

      // Show port boat's give-way maneuver - curved path passing astern (below green)
      giveWayManeuver: {
        opacity: 1,
        path: {
          d: 'M 200,300 C 300,220 450,350 650,200'
        },
        label: { text: 'Port passes astern', x: 500, y: 380 }
      },

      // Right-of-way labels removed for clarity
      // rightOfWayLabels: {
      //   giveWay: { text: 'GIVE WAY', x: 200, y: 360, boat: 'boat1' },
      //   standOn: { text: 'STAND ON', x: 600, y: 360, boat: 'boat2' },
      // },

      // Rule text
      ruleText: {
        opacity: 1,
        text: 'Rule 10: Port gives way to Starboard',
        x: 400,
        y: 450
      },

      // Animation sequence timing
      animationSequence: {
        windDelay: 0,
        boat1Delay: 200,
        boat2Delay: 200,
        pathDelay: 600,
        labelDelay: 400,
        movementDelay: 1000,
      },

      // Enable boat movement with give-way maneuver
      boatMovement: {
        enabled: true,
        duration: 5000, // 5 seconds - longer to show the give-way maneuver
        showGiveWay: true, // Show blue boat altering course
        curvedPath: true, // Blue boat follows curved path to pass astern
        loop: true,
        loopDelay: 2000,
        pauseAtEnd: 1500,
      },
    },
    details: [
      'Port tack (red): wind over the left side, boom on starboard',
      'Starboard tack (green): wind over the right side, boom on port',
      'PORT always gives way to STARBOARD - the golden rule!',
      'The give-way boat passes behind (astern) to avoid collision',
      'Start your maneuver early - don\'t wait until the last moment',
    ],
    proTip: 'Remember: "Port gives way to Starboard" - if you\'re on port tack approaching a starboard-tack boat, take action early.',
    ruleReference: 'RRS 10 - On Opposite Tacks',
    deepDive: {
      sections: [
        {
          heading: 'Why Right-of-Way Rules Matter',
          content: 'Right-of-way rules are the foundation of safe and fair racing. They prevent collisions, ensure fair competition, and provide a framework for resolving conflicts on the racecourse. Without these rules, racing would be chaotic and dangerous. Every racing sailor, from beginners to professionals, must understand and follow these rules.',
        },
        {
          heading: 'The Basic Principle',
          content: 'The fundamental principle is simple: when two boats meet, one must give way and one has the right to maintain its course. The boat that must give way is called the "give-way boat" and must take action to avoid the other boat. The boat with right of way is called the "stand-on boat" and must maintain its course and speed (unless avoiding a collision).',
        },
        {
          heading: 'When Rules Apply',
          content: 'Right-of-way rules apply when boats are "about to meet" - meaning they are on a collision course or close enough that one boat\'s actions could affect the other. The rules don\'t apply when boats are far apart or clearly not on a collision course. Understanding when rules apply is crucial for making good tactical decisions.',
        },
      ],
      proTips: [
        'Always assume you are the give-way boat until you are certain you have right of way',
        'When in doubt, keep clear - it\'s better to lose a few boat lengths than risk a collision',
        'The stand-on boat must maintain course and speed, but can take action to avoid a collision if the give-way boat fails to keep clear',
        'Practice identifying right-of-way situations during practice races',
      ],
    },
  },
  {
    label: 'Rule 11: Windward Gives Way to Leeward',
    description: 'When boats are on the same tack, the windward boat (closer to wind) must keep clear of the leeward boat (further from wind).',
    visualState: {
      // Windward boat (red) - approaching from upwind toward leeward boat
      // Must either head up (go parallel) or bear away (go behind)
      // Travels SHORTER distance so it appears slower than green boat
      // Path: starts SE (135°), curves, ends NE (45°) - "heading up" maneuver
      boat1: {
        ...initialBoat1,
        opacity: 1,
        startX: 240,
        startY: 200,
        x: 240,
        y: 200,
        endX: 380, // End position after heading up
        endY: 160, // Ends going NE (upward)
        rotate: 135, // Initial heading SE (will be overridden by curve tangent)
        label: 'Windward',
        color: '#EF4444', // Red for give-way
      },
      // Leeward boat (green) - downwind position, sailing steady NE course
      // Red boat is converging from upwind and must avoid
      // Travels LONGER distance so it appears faster than red boat
      boat2: {
        ...initialBoat2,
        opacity: 1,
        startX: 200,
        startY: 400,
        x: 200,
        y: 400,
        endX: 500,
        endY: 150, // Longer distance - boat moves faster NE
        rotate: 45, // Sailing northeast
        label: 'Leeward',
        color: '#10B981', // Green for stand-on
      },
      windArrow: { ...initialWind, opacity: 1, rotate: 0, x: 400, y: 60 },

      // Show bear away option path (alternative maneuver)
      giveWayManeuver: {
        opacity: 0.5,
        path: {
          d: 'M 280,240 Q 340,300 420,320' // Bear away path - curves down to pass behind green
        },
        label: { text: 'Bear away', x: 450, y: 340 }
      },

      // Show head up option path (the animated maneuver)
      headUpPath: {
        opacity: 1,
        path: {
          d: 'M 280,240 Q 320,220 380,160' // Head up path - curves to parallel (matches animation)
        },
        label: { text: 'Head up', x: 400, y: 140 }
      },

      // Rule text
      ruleText: {
        opacity: 1,
        text: 'Windward must keep clear: Head up OR Bear away',
        x: 400,
        y: 450
      },

      // Animation sequence timing
      animationSequence: {
        windDelay: 0,
        boat1Delay: 200,
        boat2Delay: 200,
        pathDelay: 600,
        labelDelay: 400,
        movementDelay: 1000,
      },

      // Enable boat movement - windward boat heads up to parallel leeward
      boatMovement: {
        enabled: true,
        duration: 6000, // Slower animation
        showGiveWay: true,
        curvedPath: true, // Red boat curves - starts SE, ends NE
        loop: true,
        loopDelay: 2000,
        pauseAtEnd: 1500,
        // Control points for Bezier curve: boat starts SE (135°), curves to NE (45°)
        // ctrl1: initial SE direction, ctrl2: turns curve toward NE
        ctrl1: { x: 40, y: 50 }, // Continue SE initially
        ctrl2: { x: 100, y: 20 }, // Curve toward NE direction
      },
    },
    details: [
      'Windward boat: the boat closer to the wind (upwind)',
      'Leeward boat: the boat further from the wind (downwind)',
      'This rule only applies when boats are on the SAME tack',
      'The windward boat must bear away or tack to keep clear',
      'The leeward boat can luff to protect its position',
    ],
    proTip: 'Remember: "Windward keeps clear" - as the windward boat, always be ready to bear away. Don\'t wait until you\'re too close.',
    ruleReference: 'RRS 11 - On the Same Tack, Overlapped',
    deepDive: {
      sections: [
        {
          heading: 'Understanding Windward and Leeward',
          content: 'The windward boat is the one closer to the wind (upwind), while the leeward boat is further from the wind (downwind). This rule only applies when boats are on the same tack. If boats are on opposite tacks, Rule 10 (Port/Starboard) applies instead.',
        },
        {
          heading: 'Why Leeward Has Right of Way',
          content: 'The leeward boat has right of way because it is in a more constrained position - it cannot sail higher into the wind without losing speed. The windward boat has more freedom to maneuver and can more easily keep clear by bearing away or tacking.',
        },
        {
          heading: 'Luffing Rights',
          content: 'The leeward boat can luff (head up toward the wind) to protect its position, but it must give the windward boat room to keep clear. The leeward boat cannot luff so quickly that the windward boat cannot respond.',
        },
      ],
      proTips: [
        'Remember: "Windward keeps clear" - the upwind boat must give way',
        'This rule only applies when boats are on the same tack',
        'As the windward boat, always be ready to bear away or tack',
        'The leeward boat can luff, but must give room to keep clear',
      ],
    },
  },
  {
    label: 'Rule 12: Overtaking Boat Keeps Clear',
    description: 'A boat overtaking from behind must keep clear, regardless of tacks. This rule takes priority over port/starboard.',
    visualState: {
      // Overtaking boat (red) - starts DIRECTLY BEHIND green, same heading
      // Path: approaches from astern, curves to starboard (east) to pass safely,
      // then curves back to NE once clear ahead
      boat1: {
        ...initialBoat1,
        opacity: 1,
        startX: 250, // Start directly behind green (same X roughly)
        startY: 480, // Start well behind (south) - clear astern
        x: 250,
        y: 480,
        endX: 480, // End ahead and slightly east (clear ahead)
        endY: 100,
        rotate: 45, // Initial heading NE (same as green)
        label: undefined, // No static label - using dynamic label instead
        color: '#EF4444',
      },
      // Overtaken boat (green) - maintains steady NE course
      // Slower boat - just sails straight NE while red passes
      boat2: {
        ...initialBoat2,
        opacity: 1,
        startX: 280, // Start ahead of red
        startY: 380, // Ahead (north) of red's start
        x: 280,
        y: 380,
        endX: 380, // End position - steady NE course
        endY: 260,
        rotate: 45, // Steady NE course throughout
        label: undefined, // No static label - using dynamic label instead
        color: '#10B981',
      },
      windArrow: { ...initialWind, opacity: 1, rotate: 0, x: 400, y: 60 },
      highlight: { type: 'overtaking', boat: 'boat1' },
      ruleText: { opacity: 1, text: 'Boat clear astern must keep clear of boat clear ahead', x: 400, y: 450 },
      // No giveWayManeuver path - removed as requested
      // Animation: Red starts directly astern, curves to starboard to pass, curves back to NE
      boatMovement: {
        enabled: true,
        duration: 7000, // Longer duration for the full maneuver
        curvedPath: true, // Bezier curve for the passing maneuver
        loop: true,
        loopDelay: 2000,
        pauseAtEnd: 1500,
        // Control points create S-curve: initial NE, then curves east to pass, then back to NE
        // ctrl1 is relative to start, ctrl2 is relative to end
        ctrl1: { x: 200, y: -80 }, // Initial NE then curve strongly to starboard (east)
        ctrl2: { x: 100, y: -150 }, // Final part curves back toward NE heading
      },
      // Dynamic labels that follow boats
      dynamicLabels: {
        boat1Label: 'Overtaking',
        boat2Label: 'Clear Ahead',
      },
    },
    details: [
      'Overtaking: approaching from behind another boat',
      'The overtaking boat must keep clear regardless of tacks',
      'Even a starboard-tack boat that is overtaking must give way',
      'The overtaken boat maintains course and speed',
      'Once clear ahead, normal right-of-way rules apply',
    ],
    proTip: 'If you\'re approaching another boat from behind, assume you\'re overtaking and keep clear. Pass with plenty of room.',
    ruleReference: 'RRS 12 - On the Same Tack, Not Overlapped',
    deepDive: {
      sections: [
        {
          heading: 'What is Overtaking?',
          content: 'A boat is overtaking when it approaches another boat from more than 22.5 degrees abaft (behind) the beam. This means the overtaking boat is approaching from behind the other boat. The overtaking rule takes priority over port/starboard, so even a starboard-tack boat that is overtaking must keep clear.',
        },
        {
          heading: 'Why Overtaking Takes Priority',
          content: 'The overtaking rule takes priority because the overtaking boat has more control over the situation - it can see the other boat and has more options to avoid it. The overtaken boat may not even be aware of the overtaking boat until it\'s very close.',
        },
        {
          heading: 'Passing Safely',
          content: 'When overtaking, you can pass on either side. Choose the side that gives you the most room. Pass well clear - don\'t cut it close. Once you\'re clear ahead, normal right-of-way rules apply again.',
        },
      ],
      proTips: [
        'If you\'re approaching from behind, assume you\'re overtaking',
        'The overtaking rule takes priority over port/starboard',
        'Pass with plenty of room - don\'t cut it close',
        'Once you\'re clear ahead, normal right-of-way rules apply',
      ],
    },
  },
  {
    label: 'Practical Application',
    description: 'Practice identifying right-of-way situations! Watch the boats approach, then decide: do YOU give way or stand on?',
    visualState: {
      // Initial state - boats will be positioned by scenario
      boat1: { ...initialBoat1, opacity: 0 },
      boat2: { ...initialBoat2, opacity: 0 },
      windArrow: { ...initialWind, opacity: 1, rotate: 0, x: 400, y: 60 },

      // Interactive scenario configuration
      interactiveScenarios: {
        enabled: true,
        scenarios: PRACTICE_SCENARIOS,
        approachDuration: 3000, // 3 seconds to approach decision point
        decisionPauseDuration: 0, // Wait for user input (no auto-timeout)
        resolutionDuration: 2500, // 2.5 seconds for give-way maneuver
        loopDelay: 2000, // 2 seconds before next scenario
      },

      // Animation timing for step entry
      animationSequence: {
        windDelay: 0,
        boat1Delay: 300,
        boat2Delay: 300,
        pathDelay: 500,
        labelDelay: 600,
        movementDelay: 800,
      },
    },
    details: [
      'Watch the boats approach each other',
      'Use the decision checklist to identify the rule:',
      '  1. Am I overtaking? If yes, I must keep clear',
      '  2. Are we on opposite tacks? Port gives way to starboard',
      '  3. Same tack? Windward gives way to leeward',
      'Click your answer before the boats collide!',
    ],
    proTip: 'Practice these scenarios until the decision becomes instinctive. In real racing, you only have seconds to react!',
    ruleReference: 'RRS Part 2 - When Boats Meet',
    deepDive: {
      sections: [
        {
          heading: 'The Decision Tree',
          content: 'Ask yourself these questions in order: 1) Am I overtaking? If yes, keep clear. 2) Are we on opposite tacks? If yes, port gives way to starboard. 3) Are we on the same tack? If yes, windward gives way to leeward. This decision tree helps you quickly determine the right rule.',
        },
        {
          heading: 'Common Mistakes',
          content: 'A common mistake is assuming that starboard tack always has right of way. This is not true when overtaking - even a starboard-tack boat that is overtaking must keep clear. Another mistake is not recognizing when you\'re the windward boat.',
        },
        {
          heading: 'Communication and Safety',
          content: 'Always communicate with your crew about right-of-way situations. Make sure everyone on board understands who has right of way and what action needs to be taken. Safety should always be your first priority - when in doubt, keep clear.',
        },
      ],
      proTips: [
        'Always check if you\'re overtaking first - this takes priority',
        'Port/starboard takes priority over windward/leeward',
        'Take action early if you\'re the give-way boat',
        'When in doubt, keep clear - better safe than protested',
      ],
    },
  },
  {
    label: 'Review: The Three Right-of-Way Rules',
    description: 'Let\'s review all three fundamental right-of-way rules you\'ve learned. Understanding when each rule applies is the key to safe racing.',
    visualState: {
      // Show three mini-scenarios side by side

      // Scenario 1: Port/Starboard (left)
      boat1: {
        ...initialBoat1,
        opacity: 1,
        x: 200,
        y: 220,
        rotate: 45,
        label: 'Port',
        color: '#EF4444',
        showTackIndicator: true,
      },

      // Scenario 2: Windward/Leeward (center - windward boat)
      boat2: {
        ...initialBoat2,
        opacity: 1,
        x: 400,
        y: 180,
        rotate: 45,
        label: 'Windward',
        color: '#EF4444',
        showTackIndicator: true,
      },

      windArrow: { ...initialWind, opacity: 1, rotate: 0, x: 400, y: 60 },

      // Rule summary boxes
      ruleSummary: {
        opacity: 1,
        rules: [
          {
            title: 'Rule 1: Port/Starboard',
            position: { x: 200, y: 350 },
            color: '#3B82F6',
            text: 'Opposite tacks:\nPort gives way',
          },
          {
            title: 'Rule 2: Windward/Leeward',
            position: { x: 400, y: 350 },
            color: '#10B981',
            text: 'Same tack:\nWindward gives way',
          },
          {
            title: 'Rule 3: Overtaking',
            position: { x: 600, y: 350 },
            color: '#F59E0B',
            text: 'Overtaking boat\nkeeps clear',
          },
        ],
      },

      // Main rule text
      ruleText: {
        opacity: 1,
        text: 'Master these three rules and you master right-of-way',
        x: 400,
        y: 450
      },
    },
    details: [
      'Rule 1 - Port/Starboard: When boats are on opposite tacks, port tack gives way to starboard',
      'Rule 2 - Windward/Leeward: When boats are on the same tack, windward gives way to leeward',
      'Rule 3 - Overtaking: A boat overtaking from clear astern must keep clear',
      'These rules apply in order of priority when multiple situations occur',
      'Always identify which situation you\'re in and act accordingly',
    ],
    proTip: 'In complex situations where multiple rules might apply, identify your tack first (port/starboard), then your position (windward/leeward/overtaking). This systematic approach will help you make the right decision quickly.',
    ruleReference: 'RRS Part 2, Section A - Right of Way (Rules 10-13)',
    deepDive: {
      sections: [
        {
          heading: 'Applying the Rules in Practice',
          content: 'When racing, you\'ll constantly be evaluating right-of-way situations. The key is to make these assessments automatic. Before each maneuver, ask yourself: What tack am I on? What tack is the other boat on? If same tack, who is windward/leeward? Am I overtaking? Once you can answer these questions instantly, you\'ll know your rights and obligations.',
        },
        {
          heading: 'Rule Priority',
          content: 'When multiple boats are involved, or when situations change rapidly, you need to know which rule takes precedence. Port/Starboard applies first when boats are on opposite tacks. When on the same tack, Windward/Leeward applies unless one boat is overtaking from clear astern. Understanding this priority helps in complex fleet racing situations.',
        },
        {
          heading: 'Building Instinct',
          content: 'The best sailors make right-of-way decisions instinctively. This comes from practice and repetition. Every time you sail, practice identifying situations: "That boat is on starboard, I\'m on port, I must give way." Over time, these assessments become automatic, freeing your mind to focus on tactics and boat speed.',
        },
        {
          heading: 'What\'s Next?',
          content: 'You\'ve mastered the fundamental right-of-way rules! Next steps: Learn about mark-room rules (how right-of-way changes at marks), starting sequence rules, and penalty turns. Each builds on these foundations. Keep practicing these basics until they\'re second nature.',
        },
      ],
      proTips: [
        'Practice calling out right-of-way situations during casual sailing',
        'Watch racing videos and identify who has right-of-way in each scenario',
        'Study the Racing Rules of Sailing book - it\'s the official reference',
        'When in doubt during a race, give way - better safe than protested',
        'After each race, review any close calls and determine who had right-of-way',
      ],
    },
  },
];

// Quiz questions
export const RIGHT_OF_WAY_QUIZ: RightOfWayQuizQuestion[] = [
  {
    id: 'row1',
    question: 'A boat on port tack must keep clear of a boat on starboard tack. This is which rule?',
    options: [
      { id: 'a', text: 'Rule 10 - Port/Starboard', isCorrect: true },
      { id: 'b', text: 'Rule 11 - Windward/Leeward', isCorrect: false },
      { id: 'c', text: 'Rule 12 - Overtaking', isCorrect: false },
      { id: 'd', text: 'Rule 13 - While Tacking', isCorrect: false },
    ],
    explanation: 'Rule 10 states that when boats are on opposite tacks, the port-tack boat must keep clear of the starboard-tack boat. This is one of the most fundamental right-of-way rules.',
    hint: 'This rule applies when boats are on opposite tacks...',
  },
  {
    id: 'row2',
    question: 'When two boats are on the same tack, which boat must keep clear?',
    options: [
      { id: 'a', text: 'The leeward boat', isCorrect: false },
      { id: 'b', text: 'The windward boat', isCorrect: true },
      { id: 'c', text: 'The faster boat', isCorrect: false },
      { id: 'd', text: 'The boat on starboard tack', isCorrect: false },
    ],
    explanation: 'Rule 11 states that when boats are on the same tack and overlapped, the windward boat must keep clear of the leeward boat. The windward boat is the one closer to the wind.',
    hint: 'The boat that is upwind must give way...',
  },
  {
    id: 'row3',
    question: 'A boat on starboard tack is overtaking a boat on port tack. Which boat must keep clear?',
    options: [
      { id: 'a', text: 'The port-tack boat (because port gives way to starboard)', isCorrect: false },
      { id: 'b', text: 'The starboard-tack boat (because it is overtaking)', isCorrect: true },
      { id: 'c', text: 'Neither - they both have equal rights', isCorrect: false },
      { id: 'd', text: 'The slower boat', isCorrect: false },
    ],
    explanation: 'Rule 12 (Overtaking) takes priority over Rule 10 (Port/Starboard). Even though the starboard-tack boat normally has right of way, because it is overtaking, it must keep clear.',
    hint: 'Which rule takes priority: overtaking or port/starboard?',
  },
  {
    id: 'row4',
    question: 'What does it mean to be on "port tack"?',
    options: [
      { id: 'a', text: 'The wind is coming over the right side of the boat', isCorrect: false },
      { id: 'b', text: 'The wind is coming over the left side of the boat', isCorrect: true },
      { id: 'c', text: 'The boat is sailing to port (left)', isCorrect: false },
      { id: 'd', text: 'The boat is on the port side of the course', isCorrect: false },
    ],
    explanation: 'A boat is on port tack when the wind is coming over the port (left) side of the boat. You can tell by looking at which side the boom is on - if the boom is on the starboard side, you\'re on port tack.',
    hint: 'Think about which side of the boat the wind is coming from...',
  },
  {
    id: 'row5',
    question: 'The leeward boat can luff (head up) to protect its position, but must do what?',
    options: [
      { id: 'a', text: 'Give the windward boat room to keep clear', isCorrect: true },
      { id: 'b', text: 'Luff as quickly as possible', isCorrect: false },
      { id: 'c', text: 'Bear away to give more room', isCorrect: false },
      { id: 'd', text: 'Tack immediately', isCorrect: false },
    ],
    explanation: 'Rule 11 states that the leeward boat can luff to protect its position, but it must give the windward boat room to keep clear. The leeward boat cannot luff so quickly that the windward boat cannot respond.',
    hint: 'The leeward boat has rights, but must be fair...',
  },
];

// Deep dive content
export const RIGHT_OF_WAY_DEEP_DIVE = {
  sections: [
    {
      heading: 'Why Right-of-Way Rules Matter',
      content: 'Right-of-way rules are the foundation of safe and fair racing. They prevent collisions, ensure fair competition, and provide a framework for resolving conflicts on the racecourse. Understanding these rules is essential for every racing sailor, from beginners to professionals.',
    },
    {
      heading: 'The Three Fundamental Rules',
      content: 'There are three fundamental right-of-way rules that apply in most situations: Rule 10 (Port/Starboard), Rule 11 (Windward/Leeward), and Rule 12 (Overtaking). These rules work together to determine who has right of way in any given situation.',
    },
    {
      heading: 'Rule Priority',
      content: 'When multiple rules could apply, there is a clear priority order: Overtaking (Rule 12) takes priority over Port/Starboard (Rule 10), which takes priority over Windward/Leeward (Rule 11). Always determine which rule applies first before deciding who has right of way.',
    },
    {
      heading: 'Common Mistakes',
      content: 'Common mistakes include: assuming starboard tack always has right of way (not true when overtaking), not recognizing when you\'re the windward boat, waiting too long to keep clear, and not understanding rule priority. Always err on the side of caution and keep clear when in doubt.',
    },
  ],
  proTips: [
    'Practice identifying your tack quickly - look at which side your boom is on',
    'When in doubt, keep clear - it\'s better to lose a few boat lengths than risk a collision',
    'Communicate with your crew about right-of-way situations',
    'Study the Racing Rules of Sailing - knowledge is power',
    'Practice recognizing right-of-way situations during practice races',
    'Remember: the give-way boat must take action early, not at the last moment',
    'Always assume you are the give-way boat until you are certain you have right of way',
  ],
};


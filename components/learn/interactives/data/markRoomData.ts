/**
 * Mark Room Rules Data
 *
 * This lesson teaches mark room rules in sailboat racing (RRS Rule 18):
 * - What the "zone" is (3 boat lengths from mark)
 * - When mark room is established (overlapped at zone)
 * - Inside boat rights vs outside boat obligations
 * - Proper mark rounding technique
 */

export interface BoatAnimationState {
  opacity?: number;
  x?: number;
  y?: number;
  rotate?: number;
  color?: string;
  label?: string;
  isOutlined?: boolean;
  // Animation waypoints
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  // Wake trail
  showWake?: boolean;
  wakeIntensity?: number;
}

export interface MarkRoomVisualState {
  boat1?: BoatAnimationState;
  boat2?: BoatAnimationState;
  windArrow?: { opacity?: number; rotate?: number; x?: number; y?: number };
  // Mark configuration
  mark?: {
    opacity?: number;
    cx?: number;
    cy?: number;
    type?: 'windward' | 'leeward' | 'gate-left' | 'gate-right';
    showZone?: boolean;
    zoneRadius?: number; // 3 boat lengths
  };
  // Second mark for gate
  mark2?: {
    opacity?: number;
    cx?: number;
    cy?: number;
    type?: 'gate-left' | 'gate-right';
    showZone?: boolean;
    zoneRadius?: number;
  };
  // Zone entry indicator
  zoneEntry?: {
    opacity?: number;
    boat1EnteredFirst?: boolean;
    showOverlapIndicator?: boolean;
    overlapText?: string;
  };
  // Rounding path indicators
  roundingPath?: {
    opacity?: number;
    boat1Path?: { d?: string };
    boat2Path?: { d?: string };
    properPath?: { d?: string; label?: string };
    improperPath?: { d?: string; label?: string };
  };
  // Rule text display
  ruleText?: { opacity?: number; text?: string; x?: number; y?: number };
  // Position labels
  positionLabels?: {
    inside?: { text?: string; x?: number; y?: number };
    outside?: { text?: string; x?: number; y?: number };
    clearAhead?: { text?: string; x?: number; y?: number };
    clearAstern?: { text?: string; x?: number; y?: number };
  };
  // Animation sequence timing
  animationSequence?: {
    windDelay?: number;
    boat1Delay?: number;
    boat2Delay?: number;
    pathDelay?: number;
    labelDelay?: number;
    movementDelay?: number;
  };
  // Enable boat movement animation
  boatMovement?: {
    enabled?: boolean;
    duration?: number;
    showGiveWay?: boolean;
    curvedPath?: boolean;
    loop?: boolean;
    loopDelay?: number;
    pauseAtEnd?: number;
    ctrl1?: { x: number; y: number };
    ctrl2?: { x: number; y: number };
  };
  // Interactive practice scenarios
  interactiveScenarios?: InteractiveScenarioConfig;
}

export interface MarkRoomDeepDive {
  sections: { heading: string; content: string }[];
  proTips: string[];
}

export interface MarkRoomStep {
  label: string;
  description: string;
  details: string[];
  visualState: MarkRoomVisualState;
  proTip?: string;
  ruleReference?: string;
  deepDive?: MarkRoomDeepDive;
}

export interface MarkRoomQuizQuestion {
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
export type MarkRoomRole = 'entitled' | 'must-give-room';
export type OverlapStatus = 'overlapped' | 'clear-ahead' | 'clear-astern';

export interface ScenarioBoatConfig {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  decisionX: number;
  decisionY: number;
  resolutionEndX: number;
  resolutionEndY: number;
  rotate: number;
  color: string;
  isUserBoat: boolean;
  label: string;
  giveWayPath?: string;
  giveWayCtrl1?: { x: number; y: number };
  giveWayCtrl2?: { x: number; y: number };
  labelOffsetX?: number;
  labelOffsetY?: number;
}

export interface MarkRoomScenario {
  id: string;
  name: string;
  description: string;
  ruleNumber: number; // 18
  ruleText: string;

  // Mark configuration
  mark: { x: number; y: number; type: 'windward' | 'leeward' };
  zoneRadius: number;

  // Boat configurations
  yourBoat: ScenarioBoatConfig;
  otherBoat: ScenarioBoatConfig;

  // Overlap status at zone entry
  overlapStatus: OverlapStatus;

  // Wind direction
  windDirection: number;

  // Correct answer
  userRole: MarkRoomRole;

  // Explanations
  correctExplanation: string;
  incorrectExplanation: string;

  // Visual indicators
  showZone: boolean;
  showOverlapIndicator: boolean;
}

export interface InteractiveScenarioConfig {
  enabled: boolean;
  scenarios: MarkRoomScenario[];
  approachDuration: number;
  decisionPauseDuration: number;
  resolutionDuration: number;
  loopDelay: number;
}

// Practice Scenarios for Step 6
export const PRACTICE_SCENARIOS: MarkRoomScenario[] = [
  // Scenario 1: You are inside boat, overlapped at zone - entitled to room
  {
    id: 'mr-1-inside',
    name: 'Inside at Windward Mark',
    description: 'You are the inside boat approaching the windward mark',
    ruleNumber: 18,
    ruleText: 'Rule 18: Inside boat is entitled to mark room',
    mark: { x: 400, y: 150, type: 'windward' },
    zoneRadius: 90,
    yourBoat: {
      startX: 350,
      startY: 400,
      endX: 340,
      endY: 200,
      decisionX: 345,
      decisionY: 280,
      resolutionEndX: 460,
      resolutionEndY: 180,
      rotate: 350,
      color: '#10B981',
      isUserBoat: true,
      label: 'Your Boat',
      labelOffsetX: -60,
      labelOffsetY: 0,
    },
    otherBoat: {
      startX: 420,
      startY: 420,
      endX: 380,
      endY: 180,
      decisionX: 400,
      decisionY: 300,
      resolutionEndX: 320,
      resolutionEndY: 160,
      rotate: 340,
      color: '#3B82F6',
      isUserBoat: false,
      label: 'Other Boat',
      giveWayPath: 'M 400,300 Q 320,240 320,160',
      giveWayCtrl1: { x: -80, y: -60 },
      giveWayCtrl2: { x: -80, y: -100 },
      labelOffsetX: 60,
      labelOffsetY: 0,
    },
    overlapStatus: 'overlapped',
    windDirection: 0,
    userRole: 'entitled',
    correctExplanation: 'Correct! You established an inside overlap before the zone. As the inside boat, you are entitled to mark room. The outside boat must give you room to round the mark.',
    incorrectExplanation: 'Look at where you are relative to the mark. You are the INSIDE boat (between the other boat and the mark). You established overlap before the zone, so you ARE entitled to mark room!',
    showZone: true,
    showOverlapIndicator: true,
  },

  // Scenario 2: You are outside boat, overlapped at zone - must give room
  {
    id: 'mr-2-outside',
    name: 'Outside at Windward Mark',
    description: 'You are the outside boat approaching the windward mark',
    ruleNumber: 18,
    ruleText: 'Rule 18: Outside boat must give mark room',
    mark: { x: 400, y: 150, type: 'windward' },
    zoneRadius: 90,
    yourBoat: {
      startX: 420,
      startY: 420,
      endX: 380,
      endY: 180,
      decisionX: 400,
      decisionY: 300,
      resolutionEndX: 320,
      resolutionEndY: 160,
      rotate: 340,
      color: '#10B981',
      isUserBoat: true,
      label: 'Your Boat',
      giveWayPath: 'M 400,300 Q 320,240 320,160',
      giveWayCtrl1: { x: -80, y: -60 },
      giveWayCtrl2: { x: -80, y: -100 },
      labelOffsetX: 60,
      labelOffsetY: 0,
    },
    otherBoat: {
      startX: 350,
      startY: 400,
      endX: 340,
      endY: 200,
      decisionX: 345,
      decisionY: 280,
      resolutionEndX: 460,
      resolutionEndY: 180,
      rotate: 350,
      color: '#3B82F6',
      isUserBoat: false,
      label: 'Other Boat',
      labelOffsetX: -60,
      labelOffsetY: 0,
    },
    overlapStatus: 'overlapped',
    windDirection: 0,
    userRole: 'must-give-room',
    correctExplanation: 'Correct! You are the OUTSIDE boat. Even though you might be ahead, the inside boat established overlap before the zone and is entitled to mark room. You must give them room to round.',
    incorrectExplanation: 'Check your position relative to the mark. You are the OUTSIDE boat - further from the mark than the other boat. Rule 18 says you must give room to the inside boat.',
    showZone: true,
    showOverlapIndicator: true,
  },

  // Scenario 3: You are clear ahead at zone - entitled to room
  {
    id: 'mr-3-clear-ahead',
    name: 'Clear Ahead at Zone',
    description: 'You reach the zone with no overlap behind you',
    ruleNumber: 18,
    ruleText: 'Rule 18: Boat clear ahead at zone has no obligation',
    mark: { x: 400, y: 150, type: 'windward' },
    zoneRadius: 90,
    yourBoat: {
      startX: 380,
      startY: 350,
      endX: 360,
      endY: 200,
      decisionX: 370,
      decisionY: 260,
      resolutionEndX: 480,
      resolutionEndY: 160,
      rotate: 350,
      color: '#10B981',
      isUserBoat: true,
      label: 'Your Boat',
      labelOffsetX: -60,
      labelOffsetY: 0,
    },
    otherBoat: {
      startX: 400,
      startY: 450,
      endX: 380,
      endY: 250,
      decisionX: 390,
      decisionY: 350,
      resolutionEndX: 400,
      resolutionEndY: 200,
      rotate: 345,
      color: '#3B82F6',
      isUserBoat: false,
      label: 'Other Boat',
      labelOffsetX: 60,
      labelOffsetY: 0,
    },
    overlapStatus: 'clear-ahead',
    windDirection: 0,
    userRole: 'entitled',
    correctExplanation: 'Correct! You were clear ahead when you entered the zone. The boat astern had no overlap, so they cannot claim mark room from you. You can round at your own pace.',
    incorrectExplanation: 'You entered the zone CLEAR AHEAD - there was no overlap. The boat behind cannot establish mark room rights after you enter the zone. You have no obligation to them.',
    showZone: true,
    showOverlapIndicator: true,
  },

  // Scenario 4: You are clear astern at zone - must give room if they had position
  {
    id: 'mr-4-clear-astern',
    name: 'Clear Astern at Zone',
    description: 'You reach the zone behind another boat',
    ruleNumber: 18,
    ruleText: 'Rule 18: Boat clear astern cannot claim room',
    mark: { x: 400, y: 150, type: 'windward' },
    zoneRadius: 90,
    yourBoat: {
      startX: 400,
      startY: 450,
      endX: 380,
      endY: 250,
      decisionX: 390,
      decisionY: 350,
      resolutionEndX: 340,
      resolutionEndY: 200,
      rotate: 345,
      color: '#10B981',
      isUserBoat: true,
      label: 'Your Boat',
      giveWayPath: 'M 390,350 Q 340,300 340,200',
      giveWayCtrl1: { x: -50, y: -50 },
      giveWayCtrl2: { x: -50, y: -100 },
      labelOffsetX: 60,
      labelOffsetY: 0,
    },
    otherBoat: {
      startX: 380,
      startY: 350,
      endX: 360,
      endY: 200,
      decisionX: 370,
      decisionY: 260,
      resolutionEndX: 480,
      resolutionEndY: 160,
      rotate: 350,
      color: '#3B82F6',
      isUserBoat: false,
      label: 'Other Boat',
      labelOffsetX: -60,
      labelOffsetY: 0,
    },
    overlapStatus: 'clear-astern',
    windDirection: 0,
    userRole: 'must-give-room',
    correctExplanation: 'Correct! You were CLEAR ASTERN when the first boat entered the zone. You cannot establish mark room rights by overlapping after they enter. You must keep clear.',
    incorrectExplanation: 'You were clear astern when they entered the zone. Even if you catch up and overlap inside the zone, you CANNOT claim mark room. The first boat to the zone (clear ahead) has the rights.',
    showZone: true,
    showOverlapIndicator: true,
  },

  // Scenario 5: Leeward mark - inside overlap
  {
    id: 'mr-5-leeward',
    name: 'Leeward Mark Rounding',
    description: 'Approaching the leeward mark on starboard',
    ruleNumber: 18,
    ruleText: 'Rule 18: Inside boat entitled to room at leeward mark',
    mark: { x: 400, y: 350, type: 'leeward' },
    zoneRadius: 90,
    yourBoat: {
      startX: 500,
      startY: 200,
      endX: 340,
      endY: 380,
      decisionX: 420,
      decisionY: 300,
      resolutionEndX: 340,
      resolutionEndY: 500,
      rotate: 200,
      color: '#10B981',
      isUserBoat: true,
      label: 'Your Boat',
      labelOffsetX: 60,
      labelOffsetY: 0,
    },
    otherBoat: {
      startX: 560,
      startY: 180,
      endX: 380,
      endY: 360,
      decisionX: 470,
      decisionY: 280,
      resolutionEndX: 500,
      resolutionEndY: 460,
      rotate: 210,
      color: '#3B82F6',
      isUserBoat: false,
      label: 'Other Boat',
      giveWayPath: 'M 470,280 Q 500,380 500,460',
      giveWayCtrl1: { x: 30, y: 100 },
      giveWayCtrl2: { x: 30, y: 140 },
      labelOffsetX: -60,
      labelOffsetY: 0,
    },
    overlapStatus: 'overlapped',
    windDirection: 0,
    userRole: 'entitled',
    correctExplanation: 'Correct! At the leeward mark, you established an inside overlap before the zone. You are entitled to room to round the mark and head upwind.',
    incorrectExplanation: 'Look at your position - you are the INSIDE boat at the leeward mark. With overlap established before the zone, you are entitled to mark room.',
    showZone: true,
    showOverlapIndicator: true,
  },

  // Scenario 6: Last-second overlap attempt - not entitled
  {
    id: 'mr-6-late-overlap',
    name: 'Late Overlap Attempt',
    description: 'Trying to establish overlap at the last moment',
    ruleNumber: 18,
    ruleText: 'Rule 18: Overlap must be established before the zone',
    mark: { x: 400, y: 150, type: 'windward' },
    zoneRadius: 90,
    yourBoat: {
      startX: 300,
      startY: 400,
      endX: 350,
      endY: 200,
      decisionX: 330,
      decisionY: 280,
      resolutionEndX: 280,
      resolutionEndY: 200,
      rotate: 20,
      color: '#10B981',
      isUserBoat: true,
      label: 'Your Boat',
      giveWayPath: 'M 330,280 Q 280,240 280,200',
      giveWayCtrl1: { x: -50, y: -40 },
      giveWayCtrl2: { x: -50, y: -80 },
      labelOffsetX: -60,
      labelOffsetY: 0,
    },
    otherBoat: {
      startX: 400,
      startY: 350,
      endX: 380,
      endY: 200,
      decisionX: 390,
      decisionY: 260,
      resolutionEndX: 480,
      resolutionEndY: 160,
      rotate: 350,
      color: '#3B82F6',
      isUserBoat: false,
      label: 'Other Boat',
      labelOffsetX: 60,
      labelOffsetY: 0,
    },
    overlapStatus: 'clear-astern',
    windDirection: 0,
    userRole: 'must-give-room',
    correctExplanation: 'Correct! You tried to establish overlap too late - after they entered the zone. Even though you got inside, you are NOT entitled to mark room. You must keep clear!',
    incorrectExplanation: 'Even though you got to an inside position, you established it AFTER the other boat entered the zone. Rule 18.2(b) says you cannot claim mark room if you were clear astern when they reached the zone.',
    showZone: true,
    showOverlapIndicator: true,
  },
];

// Initial states
const initialBoat1 = { opacity: 0, x: 0, y: 0, rotate: 0, color: '#3B82F6', label: 'Boat 1' };
const initialBoat2 = { opacity: 0, x: 0, y: 0, rotate: 0, color: '#10B981', label: 'Boat 2' };
const initialWind = { opacity: 0, rotate: 0, x: 400, y: 50 };

export const MARK_ROOM_STEPS: MarkRoomStep[] = [
  {
    label: 'Welcome to Mark Room Rules',
    description: 'Mark room is one of the most contested areas in sailboat racing. Understanding when you have rights - and when you must give room - is essential for clean mark roundings.',
    visualState: {
      boat1: { ...initialBoat1, opacity: 0 },
      boat2: { ...initialBoat2, opacity: 0 },
      windArrow: { ...initialWind, opacity: 1, rotate: 0, x: 400, y: 60 },
      mark: {
        opacity: 1,
        cx: 400,
        cy: 200,
        type: 'windward',
        showZone: true,
        zoneRadius: 90,
      },
      ruleText: {
        opacity: 1,
        text: 'Mark room: the space to sail to the mark and round it',
        x: 400,
        y: 400,
      },
    },
    details: [
      'Mark room rules determine who has priority at marks',
      'The key is understanding the "zone" - 3 boat lengths from the mark',
      'Rights are determined by position when entering the zone',
      'Mark room includes space to sail to AND round the mark',
      'Let\'s learn how to determine who has mark room...',
    ],
    proTip: 'Most protests at marks happen because sailors don\'t understand when mark room rights are established. Knowing these rules will keep you out of the protest room!',
    ruleReference: 'RRS 18 - Mark-Room',
    deepDive: {
      sections: [
        {
          heading: 'What is Mark Room?',
          content: 'Mark room is defined in the Racing Rules of Sailing as "room for a boat to sail to the mark, and then room to sail her proper course while at the mark." This means not just getting to the mark, but having space to round it in a seamanlike way.',
        },
        {
          heading: 'When Rule 18 Applies',
          content: 'Rule 18 applies when boats are about to round or pass a mark on the same required side. It doesn\'t apply at a starting mark before starting, or at a mark that boats must leave on opposite sides.',
        },
        {
          heading: 'Why Mark Room Matters',
          content: 'Mark roundings are where most places are gained and lost. Understanding mark room lets you protect your position when entitled, and make smart tactical decisions when you must give room.',
        },
      ],
      proTips: [
        'Know your position relative to other boats as you approach',
        'The zone is approximately 3 boat lengths - know your boat length!',
        'Rights are locked in at the zone - communicate early',
        'If unsure of your rights, give room - better than a protest',
      ],
    },
  },
  {
    label: 'The Zone: 3 Boat Lengths',
    description: 'The "zone" is a circle around the mark with a radius of 3 boat lengths. This is where mark room rights are determined.',
    visualState: {
      boat1: {
        ...initialBoat1,
        opacity: 1,
        x: 380,
        y: 380,
        startX: 380,
        startY: 380,
        endX: 370,
        endY: 290,
        rotate: 350,
        color: '#3B82F6',
        label: 'Approaching',
      },
      boat2: { ...initialBoat2, opacity: 0 },
      windArrow: { ...initialWind, opacity: 1, rotate: 0, x: 400, y: 60 },
      mark: {
        opacity: 1,
        cx: 400,
        cy: 180,
        type: 'windward',
        showZone: true,
        zoneRadius: 90,
      },
      ruleText: {
        opacity: 1,
        text: 'The ZONE = 3 boat lengths from the mark',
        x: 400,
        y: 420,
      },
      animationSequence: {
        windDelay: 0,
        boat1Delay: 300,
        boat2Delay: 0,
        pathDelay: 600,
        labelDelay: 800,
        movementDelay: 1000,
      },
      boatMovement: {
        enabled: true,
        duration: 3000,
        showGiveWay: false,
        loop: true,
        loopDelay: 2000,
        pauseAtEnd: 1500,
      },
    },
    details: [
      'Zone radius = 3 boat lengths (your boat\'s hull length)',
      'This is roughly 20-30 feet for most dinghies',
      'The zone is where mark room rights are determined',
      'What happens BEFORE entering the zone is critical',
      'Overlap status at the zone determines who has rights',
    ],
    proTip: 'Visualize the zone as you approach. A typical dinghy is about 15 feet, so the zone is roughly 45 feet - about the length of 3 parked cars.',
    ruleReference: 'RRS Definition: Zone',
    deepDive: {
      sections: [
        {
          heading: 'Measuring the Zone',
          content: 'The zone is measured from the mark itself, using the length of the boats involved. For keelboats, this might be 100+ feet. For dinghies, it\'s typically 45-60 feet. Always know your boat length!',
        },
        {
          heading: 'Why 3 Boat Lengths?',
          content: 'Three boat lengths gives boats enough time to establish their position and react. It\'s long enough to allow proper rounding, but short enough that rights don\'t extend too far from the mark.',
        },
        {
          heading: 'The Zone Boundary',
          content: 'The moment any part of your boat enters the zone is when your rights (or obligations) are locked in. This is why positioning before the zone is so critical.',
        },
      ],
      proTips: [
        'Know your boat length - measure if unsure',
        'The zone is bigger than most people think',
        'Position yourself well before reaching the zone',
        'Call "zone!" to establish when you\'ve entered',
      ],
    },
  },
  {
    label: 'Windward Mark Rules',
    description: 'At the windward mark, boats approach close-hauled on the same tack. The inside boat (if overlapped) gets mark room. If one boat is clear ahead, the astern boat has no rights.',
    visualState: {
      boat1: {
        ...initialBoat1,
        opacity: 1,
        x: 540,       // Green boat - inside position, to right of layline
        y: 360,
        startX: 540,
        startY: 360,
        endX: 540,
        endY: 360,
        rotate: 315,  // Pointing toward windward mark
        color: '#10B981',
        label: 'Inside',
      },
      boat2: {
        ...initialBoat2,
        opacity: 1,
        x: 600,       // Blue boat - outside, parallel to green, same direction
        y: 390,
        startX: 600,
        startY: 390,
        endX: 600,
        endY: 390,
        rotate: 315,  // Same direction as green boat, parallel
        color: '#3B82F6',
        label: 'Outside',
      },
      windArrow: { ...initialWind, opacity: 1, rotate: 0, x: 400, y: 60 },
      mark: {
        opacity: 1,
        cx: 400,
        cy: 200,
        type: 'windward',
        showZone: true,
        zoneRadius: 90,
      },
      zoneEntry: {
        opacity: 0,  // Hide the WINDWARD MARK text to avoid overlap
        boat1EnteredFirst: false,
        showOverlapIndicator: false,
        overlapText: 'WINDWARD MARK',
      },
      positionLabels: {
        inside: { text: 'INSIDE\n(Entitled)', x: 540, y: 290 },
        outside: { text: 'OUTSIDE\n(Must Give Room)', x: 660, y: 320 },
      },
      roundingPath: {
        opacity: 1,
        properPath: {
          d: 'M 400,200 L 600,400',  // Starboard layline at 45 degrees from mark
          label: 'LAYLINE',
        },
      },
      ruleText: {
        opacity: 1,
        text: 'Round to STARBOARD - leave mark on your port side',
        x: 400,
        y: 470,
      },
      animationSequence: {
        windDelay: 0,
        boat1Delay: 200,
        boat2Delay: 400,
        pathDelay: 800,
        labelDelay: 1000,
        movementDelay: 1200,
      },
      boatMovement: {
        enabled: false,  // Disable animation - show static positions
        duration: 4000,
        showGiveWay: true,
        curvedPath: true,
        loop: true,
        loopDelay: 2000,
        pauseAtEnd: 1500,
        ctrl1: { x: -80, y: -100 },
        ctrl2: { x: -160, y: -140 },
      },
    },
    details: [
      'At windward marks, boats approach UPWIND (close-hauled)',
      'Usually both boats are on the same tack (starboard or port)',
      'INSIDE boat with overlap at zone = entitled to mark room',
      'OUTSIDE boat must give room, even if slightly ahead',
      'After rounding, boats bear away onto the next leg',
    ],
    proTip: 'At the windward mark, the inside position is gold. Establish it early! The outside boat often loses 2-3 boat lengths in a crowded rounding.',
    ruleReference: 'RRS 18.2(a) - Giving Mark-Room',
    deepDive: {
      sections: [
        {
          heading: 'Windward Mark Approach',
          content: 'Boats approach the windward mark sailing upwind. They\'re typically close-hauled, sailing as high as they can toward the wind. This means boats are usually on the same tack.',
        },
        {
          heading: 'Laylines at the Windward Mark',
          content: 'The layline is the course that allows a boat to just fetch (reach) the mark. Boats approaching on opposite laylines must resolve port/starboard before mark room applies.',
        },
        {
          heading: 'Tacking at the Mark',
          content: 'Rule 18.3 covers tacking in the zone. If you tack inside the zone and end up "inside" another boat, you don\'t automatically get mark room - special restrictions apply.',
        },
      ],
      proTips: [
        'Approach on the favored layline to maximize position',
        'Establish inside overlap before the zone',
        'If outside, slow down and give a clean rounding',
        'After rounding, bear away smoothly to the next mark',
      ],
    },
  },
  {
    label: 'Leeward Mark Rules',
    description: 'At the leeward mark, boats approach DOWNWIND. The dynamics are different - boats may be on different gybes, and the gybe itself is part of the rounding.',
    visualState: {
      boat1: {
        ...initialBoat1,
        opacity: 1,
        x: 450,
        y: 200,
        startX: 500,
        startY: 150,
        endX: 340,
        endY: 400,
        rotate: 200,
        color: '#10B981',
        label: 'Inside',
      },
      boat2: {
        ...initialBoat2,
        opacity: 1,
        x: 520,
        y: 180,
        startX: 560,
        startY: 130,
        endX: 420,
        endY: 420,
        rotate: 210,
        color: '#3B82F6',
        label: 'Outside',
      },
      windArrow: { ...initialWind, opacity: 1, rotate: 0, x: 400, y: 60 },
      mark: {
        opacity: 1,
        cx: 400,
        cy: 320,
        type: 'leeward',
        showZone: true,
        zoneRadius: 90,
      },
      zoneEntry: {
        opacity: 0,  // Hidden to avoid overlap with ruleText
        boat1EnteredFirst: false,
        showOverlapIndicator: false,
        overlapText: 'LEEWARD MARK',
      },
      positionLabels: {
        inside: { text: 'INSIDE\n(Entitled to room)', x: 280, y: 280 },
        outside: { text: 'OUTSIDE\n(Must give room)', x: 520, y: 250 },
      },
      ruleText: {
        opacity: 1,
        text: 'Boats approach DOWNWIND - may need to gybe',
        x: 400,
        y: 470,
      },
      animationSequence: {
        windDelay: 0,
        boat1Delay: 200,
        boat2Delay: 400,
        pathDelay: 800,
        labelDelay: 1000,
        movementDelay: 1200,
      },
      boatMovement: {
        enabled: true,
        duration: 4500,
        showGiveWay: true,
        curvedPath: true,
        loop: true,
        loopDelay: 2000,
        pauseAtEnd: 1500,
        ctrl1: { x: -60, y: 80 },
        ctrl2: { x: -100, y: 180 },
      },
    },
    details: [
      'At leeward marks, boats approach DOWNWIND (running/reaching)',
      'Boats may need to GYBE as part of the rounding',
      'Same rule: inside overlap at zone = entitled to room',
      'BUT: gybe timing can affect who is "inside"',
      'After rounding, boats head UP toward the wind',
    ],
    proTip: 'The leeward mark is where races are won! Wide approach, tight rounding gives you inside position and speed coming out. Plan your gybe timing.',
    ruleReference: 'RRS 18.2 & 18.4 - Mark-Room & Gybing',
    deepDive: {
      sections: [
        {
          heading: 'Leeward Mark Approach',
          content: 'Boats approach the leeward mark sailing downwind. They may be running or broad reaching. The mark rounding involves bearing up (heading toward the wind) to start the beat.',
        },
        {
          heading: 'Gybing and Mark Room',
          content: 'Rule 18.4 says if a boat in the zone passes head to wind and is subject to Rule 13 (tacking), she must gybe. This prevents boats from tacking around leeward marks.',
        },
        {
          heading: 'Wide and Tight',
          content: 'The classic leeward mark technique is "wide-and-tight" - approach wide to set up an inside position, then round tight to the mark to exit with speed and clear air.',
        },
      ],
      proTips: [
        'Wide approach, tight rounding = speed and position',
        'Time your gybe to establish inside overlap',
        'Don\'t gybe too early - you might get rolled by boats behind',
        'Exit the mark heading high to get clear air',
      ],
    },
  },
  {
    label: 'Overlap vs Clear Ahead',
    description: 'The KEY question at any mark: Were you overlapped when the first boat reached the zone? This determines everything about mark room rights.',
    visualState: {
      boat1: {
        ...initialBoat1,
        opacity: 1,
        x: 280,
        y: 350,
        startX: 280,
        startY: 380,
        endX: 340,
        endY: 200,
        rotate: 350,
        color: '#10B981',
        label: 'Clear Ahead',
      },
      boat2: {
        ...initialBoat2,
        opacity: 1,
        x: 300,
        y: 450,
        startX: 300,
        startY: 480,
        endX: 320,
        endY: 320,
        rotate: 350,
        color: '#EF4444',
        label: 'Clear Astern',
      },
      windArrow: { ...initialWind, opacity: 1, rotate: 0, x: 400, y: 60 },
      mark: {
        opacity: 1,
        cx: 400,
        cy: 180,
        type: 'windward',
        showZone: true,
        zoneRadius: 90,
      },
      zoneEntry: {
        opacity: 1,
        boat1EnteredFirst: true,
        showOverlapIndicator: true,
        overlapText: 'NO OVERLAP = NO RIGHTS',
      },
      positionLabels: {
        clearAhead: { text: 'CLEAR AHEAD\n(No obligation)', x: 180, y: 300 },
        clearAstern: { text: 'CLEAR ASTERN\n(Cannot claim room)', x: 180, y: 420 },
      },
      ruleText: {
        opacity: 1,
        text: 'Rights are LOCKED IN at zone entry',
        x: 400,
        y: 470,
      },
      animationSequence: {
        windDelay: 0,
        boat1Delay: 200,
        boat2Delay: 400,
        pathDelay: 800,
        labelDelay: 1000,
        movementDelay: 1200,
      },
      boatMovement: {
        enabled: true,
        duration: 4000,
        showGiveWay: false,
        loop: true,
        loopDelay: 2000,
        pauseAtEnd: 1500,
      },
    },
    details: [
      'OVERLAPPED = boats side by side (neither fully ahead)',
      'CLEAR AHEAD/ASTERN = one boat completely in front/behind',
      'If overlapped at zone: inside boat gets room',
      'If clear ahead at zone: astern boat has NO rights',
      'You CANNOT create new rights after entering the zone!',
    ],
    proTip: 'This is the #1 cause of mark room protests. Know exactly when you entered the zone and what the overlap situation was at that moment.',
    ruleReference: 'RRS 18.2(b) - Giving Mark-Room',
    deepDive: {
      sections: [
        {
          heading: 'The Critical Moment',
          content: 'Mark room rights are determined at the instant the first boat\'s bow crosses into the zone. This moment is everything - positions before or after don\'t matter.',
        },
        {
          heading: 'Late Overlap Attempts',
          content: 'A common mistake is trying to establish an inside overlap after the lead boat enters the zone. Even if you get "inside", you have NO mark room rights. Keep clear!',
        },
        {
          heading: 'Overlap Definition',
          content: 'Boats are overlapped when neither is clear ahead. If a line perpendicular to either boat\'s centerline would touch both boats, they\'re overlapped.',
        },
      ],
      proTips: [
        'Know your overlap status BEFORE reaching the zone',
        'If clear astern, don\'t try to force in - it\'s dangerous',
        'Communicate clearly: "Room!" or "No room!"',
        'When in doubt, give room - protests aren\'t worth collisions',
      ],
    },
  },
  {
    label: 'Practice: Mark Room Scenarios',
    description: 'Test your mark room knowledge! Watch the boats approach, identify your position, and decide: are you entitled to room or must you give it?',
    visualState: {
      boat1: { ...initialBoat1, opacity: 0 },
      boat2: { ...initialBoat2, opacity: 0 },
      windArrow: { ...initialWind, opacity: 1, rotate: 0, x: 400, y: 60 },
      interactiveScenarios: {
        enabled: true,
        scenarios: PRACTICE_SCENARIOS,
        approachDuration: 3000,
        decisionPauseDuration: 0,
        resolutionDuration: 2500,
        loopDelay: 2000,
      },
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
      'Watch the boats approach the mark',
      'Key questions to ask yourself:',
      '  1. Who reached the zone first?',
      '  2. Were boats overlapped at that moment?',
      '  3. Which boat is inside (closer to mark)?',
      'Click your answer: Entitled to Room or Must Give Room',
    ],
    proTip: 'In real racing, you only have seconds to make this decision. Practice until it becomes automatic!',
    ruleReference: 'RRS 18 - Mark-Room',
    deepDive: {
      sections: [
        {
          heading: 'The Quick Decision Process',
          content: 'When approaching a mark with another boat, quickly assess: 1) Will we reach the zone overlapped? 2) If yes, who is inside? 3) If no overlap, who is ahead? This tells you your rights immediately.',
        },
        {
          heading: 'Common Mistakes',
          content: 'The most common mistake is assuming you have rights because you caught up inside the zone. Remember: rights are set at zone entry. The second most common is not knowing your boat length and misjudging the zone.',
        },
        {
          heading: 'Communication Helps',
          content: 'Calling "room!" or "no room!" clearly helps prevent collisions and protests. Clear, early communication is always better than assuming the other boat knows.',
        },
      ],
      proTips: [
        'Assess your position BEFORE reaching the zone',
        'If in doubt about overlap, assume you need to give room',
        'Communicate your intentions clearly',
        'Practice these scenarios until they\'re automatic',
      ],
    },
  },
  {
    label: 'Review: Mark Room Summary',
    description: 'Let\'s review the key mark room concepts. Understanding these rules will help you round marks cleanly and confidently.',
    visualState: {
      boat1: {
        ...initialBoat1,
        opacity: 1,
        x: 200,
        y: 250,
        rotate: 350,
        label: 'Inside = Rights',
        color: '#10B981',
      },
      boat2: {
        ...initialBoat2,
        opacity: 1,
        x: 600,
        y: 250,
        rotate: 340,
        label: 'Clear Ahead = Rights',
        color: '#3B82F6',
      },
      windArrow: { ...initialWind, opacity: 1, rotate: 0, x: 400, y: 60 },
      mark: {
        opacity: 1,
        cx: 400,
        cy: 180,
        type: 'windward',
        showZone: true,
        zoneRadius: 70,
      },
      ruleText: {
        opacity: 1,
        text: 'Know the zone. Know your position. Know your rights.',
        x: 400,
        y: 450,
      },
    },
    details: [
      '1. THE ZONE: 3 boat lengths from the mark - rights are set here',
      '2. OVERLAP: Inside boat with overlap at zone = entitled to room',
      '3. CLEAR AHEAD: No overlap at zone = astern boat has no rights',
      '4. PROPER COURSE: Inside boat gets room for a proper rounding',
      '5. NO LATE CLAIMS: Can\'t establish rights after entering the zone',
    ],
    proTip: 'Mark roundings are won and lost by boats who know these rules. Study them, practice them, and you\'ll round with confidence every time.',
    ruleReference: 'RRS 18 - Mark-Room (Complete)',
    deepDive: {
      sections: [
        {
          heading: 'Key Takeaways',
          content: 'Mark room is about position at the zone, not boat speed or aggression. Establish your position early, know whether you\'re entitled or obligated, and execute a clean rounding.',
        },
        {
          heading: 'What\'s Next',
          content: 'You now understand the basics of mark room. Advanced topics include: mark room at gates, mark room when tacking, and the exceptions for starting marks. Keep learning!',
        },
        {
          heading: 'Practice Makes Perfect',
          content: 'The best way to internalize these rules is practice. Go sailing, approach marks with other boats, and call out the situations. Review any close calls after racing.',
        },
      ],
      proTips: [
        'Position yourself early - don\'t wait for the zone',
        'Know your boat length to judge the zone accurately',
        'Communicate clearly: "room!" or "no room!"',
        'When uncertain, give room - it\'s better than a protest',
        'Review each mark rounding after the race',
      ],
    },
  },
];

// Quiz questions
export const MARK_ROOM_QUIZ: MarkRoomQuizQuestion[] = [
  {
    id: 'mr1',
    question: 'What is the "zone" around a mark?',
    options: [
      { id: 'a', text: '2 boat lengths from the mark', isCorrect: false },
      { id: 'b', text: '3 boat lengths from the mark', isCorrect: true },
      { id: 'c', text: '4 boat lengths from the mark', isCorrect: false },
      { id: 'd', text: '5 boat lengths from the mark', isCorrect: false },
    ],
    explanation: 'The zone is defined as an area around a mark within 3 boat lengths. This is where mark-room rights and obligations are determined.',
    hint: 'The zone distance is measured in boat lengths...',
  },
  {
    id: 'mr2',
    question: 'At a WINDWARD mark, boats typically approach:',
    options: [
      { id: 'a', text: 'Running downwind on opposite gybes', isCorrect: false },
      { id: 'b', text: 'Close-hauled on the same tack', isCorrect: true },
      { id: 'c', text: 'Beam reaching from the side', isCorrect: false },
      { id: 'd', text: 'In any direction they choose', isCorrect: false },
    ],
    explanation: 'At the windward mark, boats approach sailing upwind, typically close-hauled and usually on the same tack. This is different from leeward marks where boats approach downwind.',
    hint: 'Think about what direction boats sail relative to the wind when going "up" the course...',
  },
  {
    id: 'mr3',
    question: 'At a LEEWARD mark, what additional consideration applies?',
    options: [
      { id: 'a', text: 'Boats must tack around the mark', isCorrect: false },
      { id: 'b', text: 'Only starboard tack boats have rights', isCorrect: false },
      { id: 'c', text: 'Boats may need to gybe as part of the rounding', isCorrect: true },
      { id: 'd', text: 'Mark room rules don\'t apply at leeward marks', isCorrect: false },
    ],
    explanation: 'At leeward marks, boats approach downwind and often need to gybe as part of the rounding. Rule 18.4 addresses this - boats must gybe if required, rather than tacking around the mark.',
    hint: 'Think about what maneuver boats do when changing direction downwind...',
  },
  {
    id: 'mr4',
    question: 'When must an overlap be established for the inside boat to claim mark room?',
    options: [
      { id: 'a', text: 'Any time before reaching the mark', isCorrect: false },
      { id: 'b', text: 'Before the first boat enters the zone', isCorrect: true },
      { id: 'c', text: 'Before the boats start rounding', isCorrect: false },
      { id: 'd', text: 'It doesn\'t matter when overlap is established', isCorrect: false },
    ],
    explanation: 'Mark room rights are determined at the moment the first boat reaches the zone. If you\'re clear astern at that point, you cannot later claim mark room by establishing an overlap inside the zone.',
    hint: 'Rights are "locked in" at a specific point...',
  },
  {
    id: 'mr5',
    question: 'A boat that was clear astern when the ahead boat entered the zone:',
    options: [
      { id: 'a', text: 'Can claim mark room if they get inside overlap later', isCorrect: false },
      { id: 'b', text: 'Cannot claim mark room even if they later overlap inside', isCorrect: true },
      { id: 'c', text: 'Has the same rights as an overlapped boat', isCorrect: false },
      { id: 'd', text: 'Should protest the ahead boat for not giving room', isCorrect: false },
    ],
    explanation: 'Once a boat is clear ahead at the zone, the boat astern cannot establish mark room rights by subsequently overlapping. This applies at BOTH windward and leeward marks - rights are determined at zone entry.',
    hint: 'Rights are set at zone entry, not later...',
  },
];

// Deep dive content (global fallback)
export const MARK_ROOM_DEEP_DIVE = {
  sections: [
    {
      heading: 'Understanding Mark Room',
      content: 'Mark room is one of the most contested areas in sailboat racing. Rule 18 determines who has rights at marks, based on the position of boats when entering the zone - an area 3 boat lengths from the mark.',
    },
    {
      heading: 'The Key Principle',
      content: 'Rights are established at the zone. If boats are overlapped when the first boat reaches the zone, the inside boat is entitled to room. If one boat is clear ahead at the zone, the boat behind cannot later claim room by establishing an overlap.',
    },
    {
      heading: 'What Mark Room Includes',
      content: 'Mark room includes: (1) room to sail to the mark, (2) room to sail the proper course while at the mark, and (3) room to round the mark as necessary. The outside boat must provide all of this.',
    },
    {
      heading: 'Common Protests',
      content: 'Most mark rounding protests involve disputes about: (1) whether boats were overlapped at the zone, (2) whether the inside boat sailed a proper course, or (3) whether the outside boat gave sufficient room. Clear communication helps prevent these.',
    },
  ],
  proTips: [
    'Know your boat length to judge the zone accurately',
    'Establish your inside overlap before the zone, not at the last second',
    'If you\'re outside, slow down and give a smooth, generous rounding',
    'If you\'re clear astern at the zone, don\'t try to force in - set up for the next leg',
    'Communicate clearly: "room!" or "no room!" as appropriate',
    'Round the mark efficiently - close but safe',
    'When in doubt, give room - protests are rarely worth it',
  ],
};

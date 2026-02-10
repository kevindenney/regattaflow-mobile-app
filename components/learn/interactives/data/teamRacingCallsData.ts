/**
 * Team Racing Call Book Data
 *
 * This data powers scenarios that teach users about World Sailing Call Book
 * decisions for team racing. Organized by Call Book sections A through F,
 * covering fundamental right-of-way rules, transitions between rules,
 * mark-rounding situations, limitations on right-of-way boats,
 * seamanship obligations, and team racing penalty procedures.
 */

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export type CallBookSection = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface BoatState {
  id: string; // e.g. 'blue1', 'red2'
  team: 'blue' | 'red';
  label: string; // e.g. 'B1', 'R2'
  x: number; // SVG x position, 0-400 range
  y: number; // SVG y position, 0-500 range
  heading: number; // degrees, 0 = up/north
  tack: 'port' | 'starboard';
  isRightOfWay: boolean;
}

export interface CallBookScenario {
  id: string;
  title: string;
  section: CallBookSection;
  description: string;
  rules: string[]; // e.g. ['RRS 10', 'RRS 15']
  boats: BoatState[]; // 2-4 boats involved
  windDirection: number; // degrees
  marks?: { x: number; y: number; type: 'windward' | 'leeward' | 'gate' | 'start' }[];
  steps: {
    description: string;
    highlight: string[]; // boat ids to highlight
    outcome: string;
  }[];
  umpireDecision: string;
  keyPrinciple: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// ---------------------------------------------------------------------------
// Section A: Fundamental Right-of-Way Rules
// ---------------------------------------------------------------------------

export const SECTION_A_SCENARIOS: CallBookScenario[] = [
  {
    id: 'a-port-starboard',
    title: 'Port/Starboard Crossing',
    section: 'A',
    description:
      'Two boats on opposite tacks converge on an upwind leg. The starboard-tack boat (Blue 1) holds right of way under RRS 10. Red 1 on port tack must keep clear.',
    rules: ['RRS 10'],
    boats: [
      {
        id: 'blue1',
        team: 'blue',
        label: 'B1',
        x: 120,
        y: 280,
        heading: 315,
        tack: 'starboard',
        isRightOfWay: true,
      },
      {
        id: 'red1',
        team: 'red',
        label: 'R1',
        x: 280,
        y: 280,
        heading: 45,
        tack: 'port',
        isRightOfWay: false,
      },
    ],
    windDirection: 0,
    steps: [
      {
        description:
          'B1 is sailing upwind on starboard tack. R1 is sailing upwind on port tack. Their courses converge.',
        highlight: ['blue1', 'red1'],
        outcome: 'Potential crossing situation develops.',
      },
      {
        description:
          'R1 must keep clear of B1 because port gives way to starboard (RRS 10). R1 must decide whether to pass astern or tack away.',
        highlight: ['red1'],
        outcome:
          'R1 bears away to pass astern of B1, or tacks onto starboard to avoid.',
      },
      {
        description:
          'If R1 fails to keep clear, B1 may hail for an umpire call. The umpires will penalise R1.',
        highlight: ['blue1'],
        outcome: 'R1 is penalised for failing to keep clear under RRS 10.',
      },
    ],
    umpireDecision:
      'If R1 does not keep clear, she is penalised under RRS 10. B1 need not have changed course, but if she did to avoid contact, R1 clearly broke the rule.',
    keyPrinciple:
      'A port-tack boat must keep clear of a starboard-tack boat. This is the most fundamental right-of-way rule.',
    difficulty: 'beginner',
  },
  {
    id: 'a-windward-leeward',
    title: 'Windward/Leeward Overlap',
    section: 'A',
    description:
      'Two boats on the same tack sail upwind with an overlap. The leeward boat (Blue 1) has right of way under RRS 11. The windward boat (Red 1) must keep clear.',
    rules: ['RRS 11'],
    boats: [
      {
        id: 'blue1',
        team: 'blue',
        label: 'B1',
        x: 160,
        y: 260,
        heading: 315,
        tack: 'starboard',
        isRightOfWay: true,
      },
      {
        id: 'red1',
        team: 'red',
        label: 'R1',
        x: 210,
        y: 230,
        heading: 315,
        tack: 'starboard',
        isRightOfWay: false,
      },
    ],
    windDirection: 0,
    steps: [
      {
        description:
          'B1 and R1 are both sailing upwind on starboard tack, overlapped. B1 is to leeward and R1 is to windward.',
        highlight: ['blue1', 'red1'],
        outcome: 'The overlap establishes a windward/leeward situation.',
      },
      {
        description:
          'Under RRS 11, when boats are overlapped on the same tack, the windward boat (R1) must keep clear of the leeward boat (B1).',
        highlight: ['red1'],
        outcome: 'R1 must sail higher or fall back to keep clear.',
      },
      {
        description:
          'If B1 luffs (sails higher toward the wind), R1 must respond and keep clear, provided B1 gives R1 room to do so (RRS 16.1).',
        highlight: ['blue1', 'red1'],
        outcome:
          'R1 keeps clear by heading up. If R1 fails, she is penalised.',
      },
    ],
    umpireDecision:
      'If R1 fails to keep clear when overlapped to windward, she is penalised under RRS 11. B1 must also comply with RRS 16.1 when changing course.',
    keyPrinciple:
      'When overlapped on the same tack, the windward boat must keep clear of the leeward boat.',
    difficulty: 'beginner',
  },
  {
    id: 'a-clear-astern-ahead',
    title: 'Clear Astern / Clear Ahead',
    section: 'A',
    description:
      'Two boats on the same tack sailing upwind without an overlap. The boat clear astern (Red 1) must keep clear of the boat clear ahead (Blue 1) under RRS 12.',
    rules: ['RRS 12'],
    boats: [
      {
        id: 'blue1',
        team: 'blue',
        label: 'B1',
        x: 180,
        y: 210,
        heading: 315,
        tack: 'starboard',
        isRightOfWay: true,
      },
      {
        id: 'red1',
        team: 'red',
        label: 'R1',
        x: 190,
        y: 330,
        heading: 315,
        tack: 'starboard',
        isRightOfWay: false,
      },
    ],
    windDirection: 0,
    steps: [
      {
        description:
          'B1 is clear ahead and R1 is clear astern on the same tack. There is no overlap between them.',
        highlight: ['blue1', 'red1'],
        outcome: 'RRS 12 applies: the boat clear astern must keep clear.',
      },
      {
        description:
          'R1 may not sail into B1. If R1 gains on B1 and begins to establish an overlap, the rule transition to RRS 11 begins.',
        highlight: ['red1'],
        outcome:
          'R1 keeps clear by not sailing above her course toward B1.',
      },
      {
        description:
          'If R1 makes contact with B1 from astern without an overlap being established, R1 has broken RRS 12.',
        highlight: ['red1', 'blue1'],
        outcome: 'R1 is penalised for failing to keep clear under RRS 12.',
      },
    ],
    umpireDecision:
      'R1 is penalised if she fails to keep clear while clear astern. Contact from astern without a prior overlap is a clear breach of RRS 12.',
    keyPrinciple:
      'A boat clear astern must keep clear of a boat clear ahead on the same tack.',
    difficulty: 'beginner',
  },
];

// ---------------------------------------------------------------------------
// Section B: Transitions Between Rules
// ---------------------------------------------------------------------------

export const SECTION_B_SCENARIOS: CallBookScenario[] = [
  {
    id: 'b-overlap-from-astern',
    title: 'Establishing Overlap from Clear Astern',
    section: 'B',
    description:
      'Red 1 approaches Blue 1 from clear astern and establishes a leeward overlap. The rule shifts from RRS 12 to RRS 11. Under RRS 15, R1 must initially give B1 room to keep clear.',
    rules: ['RRS 11', 'RRS 12', 'RRS 15'],
    boats: [
      {
        id: 'blue1',
        team: 'blue',
        label: 'B1',
        x: 200,
        y: 230,
        heading: 315,
        tack: 'starboard',
        isRightOfWay: false,
      },
      {
        id: 'red1',
        team: 'red',
        label: 'R1',
        x: 170,
        y: 340,
        heading: 315,
        tack: 'starboard',
        isRightOfWay: true,
      },
    ],
    windDirection: 0,
    steps: [
      {
        description:
          'R1 is clear astern of B1, both on starboard tack. R1 is sailing faster and closing the gap.',
        highlight: ['red1', 'blue1'],
        outcome:
          'While clear astern, R1 must keep clear of B1 under RRS 12.',
      },
      {
        description:
          'R1 establishes a leeward overlap on B1. Now RRS 11 applies and B1 becomes the windward boat with the obligation to keep clear.',
        highlight: ['red1'],
        outcome:
          'The right-of-way shifts: B1 must now keep clear as the windward boat.',
      },
      {
        description:
          'However, because R1 obtained right of way by establishing the overlap, RRS 15 requires R1 to initially give B1 room to keep clear.',
        highlight: ['blue1'],
        outcome:
          'B1 must be given time to respond. R1 may not immediately luff into B1.',
      },
    ],
    umpireDecision:
      'If R1 immediately luffs into B1 without giving room under RRS 15, R1 is penalised even though she is the leeward (right-of-way) boat. B1 is penalised only if she had time and space to keep clear but did not.',
    keyPrinciple:
      'When a boat acquires right of way, she must initially give the other boat room to keep clear (RRS 15).',
    difficulty: 'intermediate',
  },
  {
    id: 'b-overlap-break-at-mark',
    title: 'Breaking Overlap Approaching a Mark',
    section: 'B',
    description:
      'Two boats approach a windward mark overlapped, then the overlap breaks as the trailing boat falls behind. The rules transition from RRS 11 (windward/leeward) to RRS 12 (clear astern/ahead) before the zone.',
    rules: ['RRS 11', 'RRS 12', 'RRS 18.2'],
    boats: [
      {
        id: 'blue1',
        team: 'blue',
        label: 'B1',
        x: 170,
        y: 220,
        heading: 315,
        tack: 'starboard',
        isRightOfWay: true,
      },
      {
        id: 'red1',
        team: 'red',
        label: 'R1',
        x: 220,
        y: 250,
        heading: 315,
        tack: 'starboard',
        isRightOfWay: false,
      },
    ],
    windDirection: 0,
    marks: [{ x: 200, y: 100, type: 'windward' }],
    steps: [
      {
        description:
          'B1 (leeward) and R1 (windward) approach the windward mark overlapped. B1 has right of way under RRS 11.',
        highlight: ['blue1', 'red1'],
        outcome: 'R1 must keep clear as the windward boat.',
      },
      {
        description:
          'R1 slows and falls behind B1, breaking the overlap before reaching the zone. Now RRS 12 applies: R1 is clear astern.',
        highlight: ['red1'],
        outcome:
          'R1 must keep clear under RRS 12. B1 is clear ahead entering the zone.',
      },
      {
        description:
          'B1 enters the zone clear ahead and rounds the mark. R1 must give B1 mark room even though no overlap exists, because B1 was clear ahead at the zone (RRS 18.2(b)).',
        highlight: ['blue1'],
        outcome:
          'B1 rounds freely. R1 must wait and round after B1.',
      },
    ],
    umpireDecision:
      'If R1 attempts to barge in at the mark after the overlap broke, R1 is penalised. The overlap must exist at the zone entry for inside mark-room rights.',
    keyPrinciple:
      'Mark-room rights depend on the overlap status at the moment the first boat reaches the zone.',
    difficulty: 'intermediate',
  },
];

// ---------------------------------------------------------------------------
// Section C: Mark-Rounding Situations
// ---------------------------------------------------------------------------

export const SECTION_C_SCENARIOS: CallBookScenario[] = [
  {
    id: 'c-windward-mark-inside-overlap',
    title: 'Windward Mark with Inside Overlap',
    section: 'C',
    description:
      'Two boats on starboard tack approach the windward mark overlapped. The inside boat (Blue 1) is entitled to mark room under RRS 18.2(a). The outside boat (Red 1) must give room.',
    rules: ['RRS 18.2(a)', 'RRS 18.2(b)'],
    boats: [
      {
        id: 'blue1',
        team: 'blue',
        label: 'B1',
        x: 215,
        y: 200,
        heading: 315,
        tack: 'starboard',
        isRightOfWay: false,
      },
      {
        id: 'red1',
        team: 'red',
        label: 'R1',
        x: 160,
        y: 200,
        heading: 315,
        tack: 'starboard',
        isRightOfWay: true,
      },
    ],
    windDirection: 0,
    marks: [{ x: 200, y: 100, type: 'windward' }],
    steps: [
      {
        description:
          'B1 and R1 approach the windward mark on starboard tack, overlapped. B1 is the inside boat (closer to the mark).',
        highlight: ['blue1', 'red1'],
        outcome: 'An overlap exists as the first boat reaches the zone.',
      },
      {
        description:
          'B1 reaches the zone with the overlap established. Under RRS 18.2(a), B1 is entitled to mark room from R1, the outside boat.',
        highlight: ['blue1'],
        outcome:
          'R1 must give B1 room to sail to the mark and round it.',
      },
      {
        description:
          'B1 rounds the mark, bearing away onto the downwind leg. R1 must give enough room for B1 to round in a seamanlike way.',
        highlight: ['blue1', 'red1'],
        outcome:
          'B1 rounds successfully. R1 rounds behind or to the outside.',
      },
    ],
    umpireDecision:
      'If R1 fails to give mark room and B1 is unable to round the mark, R1 is penalised under RRS 18.2. B1 is entitled to the room she needs to round the mark.',
    keyPrinciple:
      'An inside overlapped boat at the zone is entitled to mark room from outside boats.',
    difficulty: 'intermediate',
  },
  {
    id: 'c-leeward-mark-opposite-tacks',
    title: 'Leeward Mark on Opposite Tacks',
    section: 'C',
    description:
      'Two boats approach a leeward mark on opposite tacks. Under RRS 18.3, when boats are on opposite tacks and one must tack to round the mark, the inside boat may need to gybe rather than claim mark room.',
    rules: ['RRS 18.3', 'RRS 10'],
    boats: [
      {
        id: 'blue1',
        team: 'blue',
        label: 'B1',
        x: 160,
        y: 280,
        heading: 135,
        tack: 'starboard',
        isRightOfWay: true,
      },
      {
        id: 'red1',
        team: 'red',
        label: 'R1',
        x: 250,
        y: 300,
        heading: 225,
        tack: 'port',
        isRightOfWay: false,
      },
    ],
    windDirection: 0,
    marks: [{ x: 200, y: 400, type: 'leeward' }],
    steps: [
      {
        description:
          'B1 approaches the leeward mark on starboard tack (downwind). R1 approaches on port tack (downwind). They converge near the mark.',
        highlight: ['blue1', 'red1'],
        outcome: 'Boats on opposite tacks approach a leeward mark.',
      },
      {
        description:
          'RRS 18.3 applies: at a mark to be left to port, if boats are on opposite tacks and the port-tack boat must gybe at the mark, RRS 18.2 does not apply between them.',
        highlight: ['red1'],
        outcome:
          'R1 on port tack cannot claim inside mark-room from B1 on starboard.',
      },
      {
        description:
          'RRS 10 (port/starboard) applies instead. R1 must keep clear of B1. R1 can gybe early and then approach the mark on starboard tack to establish different rights.',
        highlight: ['red1', 'blue1'],
        outcome:
          'R1 gybes to starboard before the zone and the normal overlap rules then apply.',
      },
    ],
    umpireDecision:
      'R1 cannot claim mark room while on the opposite tack from B1 when R1 must gybe at the mark. If R1 causes B1 to take avoiding action, R1 is penalised under RRS 10.',
    keyPrinciple:
      'At a mark where one boat must gybe and boats are on opposite tacks, RRS 18.2 does not apply; basic right-of-way rules govern.',
    difficulty: 'advanced',
  },
  {
    id: 'c-gate-mark-room',
    title: 'Gate Mark Room',
    section: 'C',
    description:
      'Boats approach a leeward gate. Each boat may choose which gate mark to round. Mark room under RRS 18.1 applies at gate marks, and boats must give room to inside overlapped boats.',
    rules: ['RRS 18.1', 'RRS 18.2(a)'],
    boats: [
      {
        id: 'blue1',
        team: 'blue',
        label: 'B1',
        x: 180,
        y: 310,
        heading: 135,
        tack: 'starboard',
        isRightOfWay: true,
      },
      {
        id: 'red1',
        team: 'red',
        label: 'R1',
        x: 230,
        y: 300,
        heading: 135,
        tack: 'starboard',
        isRightOfWay: false,
      },
    ],
    windDirection: 0,
    marks: [
      { x: 160, y: 400, type: 'gate' },
      { x: 240, y: 400, type: 'gate' },
    ],
    steps: [
      {
        description:
          'B1 and R1 approach the leeward gate overlapped on starboard tack. The gate has a port mark and a starboard mark.',
        highlight: ['blue1', 'red1'],
        outcome: 'Both boats must choose which gate mark to round.',
      },
      {
        description:
          'B1 is to leeward and chooses the port-side gate mark (left). R1 is to windward. If both choose the same mark, B1 is inside and entitled to mark room.',
        highlight: ['blue1'],
        outcome:
          'R1 must give B1 room at whichever gate mark B1 chooses.',
      },
      {
        description:
          'If R1 wants to take the other gate mark, she must gybe away and separate before the zone. Inside the zone, she must respect the mark room of boats already committed.',
        highlight: ['red1'],
        outcome:
          'R1 either gives mark room or separates by choosing the other gate mark.',
      },
    ],
    umpireDecision:
      'If both boats choose the same gate mark and R1 does not give B1 mark room as the inside overlapped boat, R1 is penalised under RRS 18.2(a).',
    keyPrinciple:
      'At gate marks, each boat may choose her mark but must give mark room to inside overlapped boats at the chosen mark.',
    difficulty: 'advanced',
  },
];

// ---------------------------------------------------------------------------
// Section D: Limitations on Right-of-Way Boats
// ---------------------------------------------------------------------------

export const SECTION_D_SCENARIOS: CallBookScenario[] = [
  {
    id: 'd-luffing-rights-prestart',
    title: 'Luffing Rights Pre-Start',
    section: 'D',
    description:
      'Before the starting signal, a leeward boat luffs a windward boat. In team racing the leeward boat may luff provided she gives the windward boat room to keep clear (RRS 16.1). There is no "proper course" limitation before the start.',
    rules: ['RRS 11', 'RRS 16.1'],
    boats: [
      {
        id: 'blue1',
        team: 'blue',
        label: 'B1',
        x: 150,
        y: 300,
        heading: 315,
        tack: 'starboard',
        isRightOfWay: true,
      },
      {
        id: 'red1',
        team: 'red',
        label: 'R1',
        x: 200,
        y: 270,
        heading: 315,
        tack: 'starboard',
        isRightOfWay: false,
      },
    ],
    windDirection: 0,
    marks: [
      { x: 80, y: 380, type: 'start' },
      { x: 320, y: 380, type: 'start' },
    ],
    steps: [
      {
        description:
          'Before the starting signal, B1 (leeward) and R1 (windward) are overlapped on starboard tack near the start line.',
        highlight: ['blue1', 'red1'],
        outcome: 'Pre-start positioning: RRS 11 applies.',
      },
      {
        description:
          'B1 luffs sharply toward head to wind to push R1 above the favored end. Before the start, there is no proper course limitation, so B1 may luff as high as head to wind.',
        highlight: ['blue1'],
        outcome:
          'R1 must respond and keep clear by heading up with B1.',
      },
      {
        description:
          'B1 must give R1 room to keep clear (RRS 16.1). If B1 luffs so fast that R1 cannot respond, B1 breaks RRS 16.1.',
        highlight: ['blue1', 'red1'],
        outcome:
          'If R1 had room and did not keep clear, R1 is penalised. If B1 luffed too quickly, B1 is penalised.',
      },
    ],
    umpireDecision:
      'The umpires assess whether B1 gave R1 room to keep clear when luffing. If yes, R1 is penalised under RRS 11. If B1 did not give room, B1 is penalised under RRS 16.1.',
    keyPrinciple:
      'Before the start, a leeward boat may luff without limit, but must always give the windward boat room to keep clear.',
    difficulty: 'intermediate',
  },
  {
    id: 'd-proper-course-after-start',
    title: 'Proper Course Limitation After Start',
    section: 'D',
    description:
      'After the starting signal, a leeward boat that established her overlap from clear astern is limited to sailing no higher than her proper course while the overlap persists (RRS 17). This prevents tactical hunting after the start.',
    rules: ['RRS 17', 'RRS 11'],
    boats: [
      {
        id: 'blue1',
        team: 'blue',
        label: 'B1',
        x: 200,
        y: 270,
        heading: 315,
        tack: 'starboard',
        isRightOfWay: false,
      },
      {
        id: 'red1',
        team: 'red',
        label: 'R1',
        x: 160,
        y: 310,
        heading: 315,
        tack: 'starboard',
        isRightOfWay: true,
      },
    ],
    windDirection: 0,
    marks: [
      { x: 80, y: 380, type: 'start' },
      { x: 320, y: 380, type: 'start' },
    ],
    steps: [
      {
        description:
          'After the start, R1 overtakes B1 from clear astern and establishes a leeward overlap. R1 becomes the right-of-way boat under RRS 11.',
        highlight: ['red1'],
        outcome:
          'R1 gains right of way as the leeward boat, but RRS 17 also applies.',
      },
      {
        description:
          'Because R1 established the overlap from clear astern, RRS 17 restricts R1: she may not sail above her proper course while the overlap exists.',
        highlight: ['red1', 'blue1'],
        outcome:
          'R1 cannot luff B1 above the course to the next mark.',
      },
      {
        description:
          'If R1 sails above her proper course to push B1 away from the rhumb line, B1 can protest and the umpires will penalise R1.',
        highlight: ['red1'],
        outcome:
          'R1 is penalised under RRS 17 for sailing above proper course.',
      },
    ],
    umpireDecision:
      'If R1 established the overlap from clear astern and then luffs above proper course, R1 is penalised under RRS 17. The umpires consider the course to the next mark and wind conditions to judge proper course.',
    keyPrinciple:
      'A leeward boat that gained her overlap from clear astern may not sail above her proper course while the overlap persists (RRS 17).',
    difficulty: 'intermediate',
  },
];

// ---------------------------------------------------------------------------
// Section E: Seamanship & Avoiding Contact
// ---------------------------------------------------------------------------

export const SECTION_E_SCENARIOS: CallBookScenario[] = [
  {
    id: 'e-avoiding-contact',
    title: 'Seamanship Obligation to Avoid Contact',
    section: 'E',
    description:
      'Even a right-of-way boat must avoid contact if reasonably possible (RRS 14). In team racing this is especially important because umpires are watching closely. A right-of-way boat that makes no attempt to avoid contact when she could have may be penalised.',
    rules: ['RRS 14'],
    boats: [
      {
        id: 'blue1',
        team: 'blue',
        label: 'B1',
        x: 140,
        y: 260,
        heading: 315,
        tack: 'starboard',
        isRightOfWay: true,
      },
      {
        id: 'red1',
        team: 'red',
        label: 'R1',
        x: 260,
        y: 260,
        heading: 45,
        tack: 'port',
        isRightOfWay: false,
      },
    ],
    windDirection: 0,
    steps: [
      {
        description:
          'B1 on starboard tack and R1 on port tack converge. R1 fails to keep clear and it becomes apparent that contact will occur.',
        highlight: ['blue1', 'red1'],
        outcome: 'R1 has broken RRS 10, but RRS 14 also applies to both boats.',
      },
      {
        description:
          'B1, even though she has right of way, sees that R1 is not keeping clear. Once it becomes clear that R1 is not acting, B1 must try to avoid contact if reasonably possible.',
        highlight: ['blue1'],
        outcome:
          'B1 bears away or takes other action to minimise or avoid the collision.',
      },
      {
        description:
          'If contact occurs and results in damage, and B1 could have avoided it, B1 may also be penalised under RRS 14 (even though she had right of way). R1 is penalised for the original rule breach.',
        highlight: ['blue1', 'red1'],
        outcome:
          'Both boats may be penalised: R1 under RRS 10, B1 under RRS 14 if there is damage.',
      },
    ],
    umpireDecision:
      'R1 is penalised for failing to keep clear (RRS 10). B1 may also be penalised under RRS 14 if contact caused damage and B1 could have avoided it. A right-of-way boat breaks RRS 14 only if contact causes damage or injury.',
    keyPrinciple:
      'All boats must avoid contact if reasonably possible. A right-of-way boat is not excused from causing damage, even when the other boat breaks a rule.',
    difficulty: 'advanced',
  },
];

// ---------------------------------------------------------------------------
// Section F: Penalties in Team Racing
// ---------------------------------------------------------------------------

export const SECTION_F_SCENARIOS: CallBookScenario[] = [
  {
    id: 'f-penalty-turn',
    title: 'Penalty Turn Execution in Team Racing',
    section: 'F',
    description:
      'In team racing under Appendix D, penalties are modified. A boat penalised by the umpires is signalled with a flag and must take a penalty by completing a turn as soon as reasonably possible. The turn must include one tack and one gybe.',
    rules: ['Appendix D', 'RRS 44.2'],
    boats: [
      {
        id: 'red1',
        team: 'red',
        label: 'R1',
        x: 200,
        y: 280,
        heading: 315,
        tack: 'starboard',
        isRightOfWay: false,
      },
      {
        id: 'blue1',
        team: 'blue',
        label: 'B1',
        x: 140,
        y: 260,
        heading: 315,
        tack: 'starboard',
        isRightOfWay: true,
      },
    ],
    windDirection: 0,
    steps: [
      {
        description:
          'The umpires signal a penalty against R1 with a flag (typically green and white or red flag). R1 must take a penalty turn promptly.',
        highlight: ['red1'],
        outcome:
          'R1 is penalised and must execute a turn as soon as reasonably possible.',
      },
      {
        description:
          'R1 must complete one full turn including one tack and one gybe. While turning, R1 must keep clear of all other boats and may not interfere with them.',
        highlight: ['red1'],
        outcome:
          'R1 bears away, gybes, then heads up and tacks to complete the turn.',
      },
      {
        description:
          'Once the turn is completed, R1 resumes racing. If R1 delays taking the penalty or does not complete it properly, additional penalties may be applied.',
        highlight: ['red1', 'blue1'],
        outcome:
          'R1 has served the penalty and continues racing. Failure to comply may result in disqualification.',
      },
    ],
    umpireDecision:
      'Under Appendix D for team racing, the umpires signal the penalised boat. The penalty is a turn (one tack and one gybe). If the boat does not take the penalty promptly or correctly, the umpires may signal a further penalty or display a black flag for disqualification.',
    keyPrinciple:
      'In team racing, umpire-signalled penalties require a prompt turn including one tack and one gybe. The penalised boat must keep clear of others while executing the turn.',
    difficulty: 'beginner',
  },
];

// ---------------------------------------------------------------------------
// All Scenarios Combined
// ---------------------------------------------------------------------------

export const ALL_CALL_BOOK_SCENARIOS: CallBookScenario[] = [
  ...SECTION_A_SCENARIOS,
  ...SECTION_B_SCENARIOS,
  ...SECTION_C_SCENARIOS,
  ...SECTION_D_SCENARIOS,
  ...SECTION_E_SCENARIOS,
  ...SECTION_F_SCENARIOS,
];

/**
 * Team Racing Course Layouts - Lesson Data
 *
 * Defines common team racing course configurations used in collegiate,
 * club, and international team racing. Each layout includes mark positions,
 * sailing legs, and key features that differentiate it from standard
 * fleet racing courses.
 *
 * Course layouts are designed for the S-Course (most common), Digital N,
 * and standard Windward-Leeward configurations.
 *
 * Canvas coordinate space: x 0-400, y 0-600.
 * Wind from the top (0 degrees).
 */

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface CourseMark {
  id: string;
  label: string;
  x: number;
  y: number;
  type: 'windward' | 'leeward' | 'gate' | 'start' | 'spreader' | 'wing' | 'finish';
}

export interface SailingLeg {
  from: string; // mark id
  to: string; // mark id
  type: 'upwind' | 'downwind' | 'reaching';
  label: string;
}

export interface CourseLayout {
  id: string;
  name: string;
  description: string;
  marks: CourseMark[];
  legs: SailingLeg[];
  windDirection: number;
  annotations: { text: string; x: number; y: number; type: 'action' | 'info' | 'warning' }[];
  keyFeatures: string[];
  usedIn: string;
}

// ---------------------------------------------------------------------------
// S-Course (Most Common Team Racing Course)
// ---------------------------------------------------------------------------

const S_COURSE: CourseLayout = {
  id: 's-course',
  name: 'S-Course',
  description:
    'The most widely used team racing course. Boats sail an S-shaped path: upwind to the windward mark, downwind through a leeward gate, then a reaching leg to a spreader mark before heading back upwind. The S-shape creates multiple passing opportunities and tactical decision points at every transition.',
  marks: [
    { id: 'windward', label: 'Windward Mark', x: 200, y: 80, type: 'windward' },
    { id: 'gate-left', label: 'Gate Left', x: 160, y: 520, type: 'gate' },
    { id: 'gate-right', label: 'Gate Right', x: 240, y: 520, type: 'gate' },
    { id: 'spreader', label: 'Spreader Mark', x: 340, y: 300, type: 'spreader' },
  ],
  legs: [
    { from: 'start', to: 'windward', type: 'upwind', label: 'Beat 1 (Start to Windward)' },
    { from: 'windward', to: 'gate-left', type: 'downwind', label: 'Run (Windward to Gate)' },
    { from: 'gate-left', to: 'spreader', type: 'reaching', label: 'Reach (Gate to Spreader)' },
    { from: 'gate-right', to: 'spreader', type: 'reaching', label: 'Reach (Gate to Spreader)' },
    { from: 'spreader', to: 'windward', type: 'upwind', label: 'Beat 2 (Spreader to Windward)' },
    { from: 'windward', to: 'gate-left', type: 'downwind', label: 'Final Run (Windward to Gate/Finish)' },
  ],
  windDirection: 0,
  annotations: [
    { text: 'Wind', x: 200, y: 20, type: 'info' },
    { text: 'Gate choice is tactical', x: 200, y: 560, type: 'info' },
    { text: 'Reaching leg creates passing lanes', x: 340, y: 260, type: 'info' },
    { text: 'Mark traps common here', x: 130, y: 80, type: 'warning' },
  ],
  keyFeatures: [
    'S-shaped sailing path creates diverse tactical situations across upwind, downwind, and reaching legs.',
    'Leeward gate gives boats a choice of which side to round, enabling split-tack strategies.',
    'The reaching leg to the spreader mark is unique to team racing and creates high-speed passing opportunities.',
    'Multiple mark roundings provide frequent trap and pass-back opportunities.',
    'The spreader mark is offset to one side, forcing boats to sail a true reach rather than a close fetch.',
    'Shorter course length keeps races fast (8-12 minutes) to suit the rapid rotation format of team racing events.',
  ],
  usedIn: 'Most college and club team racing, including ICSA, BUSA, and World Sailing team racing events',
};

// ---------------------------------------------------------------------------
// Digital N Course
// ---------------------------------------------------------------------------

const DIGITAL_N_COURSE: CourseLayout = {
  id: 'digital-n',
  name: 'Digital N',
  description:
    'A course shaped like the letter N (or its mirror). Boats sail upwind to the windward mark, reach across to a wing mark, run downwind to the leeward mark, then beat back upwind. The reaching leg between the windward and wing marks adds a tactical dimension not found in simple windward-leeward courses.',
  marks: [
    { id: 'windward', label: 'Windward Mark', x: 200, y: 80, type: 'windward' },
    { id: 'leeward', label: 'Leeward Mark', x: 200, y: 520, type: 'leeward' },
    { id: 'wing', label: 'Wing Mark', x: 340, y: 300, type: 'wing' },
  ],
  legs: [
    { from: 'start', to: 'windward', type: 'upwind', label: 'Beat (Start to Windward)' },
    { from: 'windward', to: 'wing', type: 'reaching', label: 'Reach (Windward to Wing)' },
    { from: 'wing', to: 'leeward', type: 'downwind', label: 'Run (Wing to Leeward)' },
    { from: 'leeward', to: 'windward', type: 'upwind', label: 'Beat (Leeward to Windward)' },
  ],
  windDirection: 0,
  annotations: [
    { text: 'Wind', x: 200, y: 20, type: 'info' },
    { text: 'N-shaped track', x: 50, y: 300, type: 'info' },
    { text: 'Reaching leg is key tactical zone', x: 340, y: 260, type: 'info' },
    { text: 'Transition from reach to run at wing', x: 340, y: 340, type: 'warning' },
  ],
  keyFeatures: [
    'The N-shape provides three distinct points of sail: upwind, reaching, and downwind.',
    'The wing mark creates a transition from reaching to running, a critical tactical moment.',
    'Reaching leg between windward and wing marks allows high-speed overtaking.',
    'The run from wing to leeward is angled rather than dead downwind, adding tactical complexity.',
    'Fewer mark roundings than the S-Course but each one is more consequential.',
    'Well-suited to venues where a single offset mark is easier to set than a full gate.',
  ],
  usedIn: 'Some club team racing events, particularly in venues with space constraints or simpler mark-laying capabilities',
};

// ---------------------------------------------------------------------------
// Standard Windward-Leeward Course
// ---------------------------------------------------------------------------

const WINDWARD_LEEWARD_COURSE: CourseLayout = {
  id: 'windward-leeward',
  name: 'Standard Windward-Leeward',
  description:
    'The simplest course configuration: a single windward mark and a single leeward mark. Boats beat upwind, round the top mark, run downwind, round the bottom mark, and repeat. While standard in fleet racing, it is sometimes used in team racing for simplicity or when teaching beginners.',
  marks: [
    { id: 'windward', label: 'Windward Mark', x: 200, y: 80, type: 'windward' },
    { id: 'leeward', label: 'Leeward Mark', x: 200, y: 520, type: 'leeward' },
  ],
  legs: [
    { from: 'start', to: 'windward', type: 'upwind', label: 'Beat (Start to Windward)' },
    { from: 'windward', to: 'leeward', type: 'downwind', label: 'Run (Windward to Leeward)' },
    { from: 'leeward', to: 'windward', type: 'upwind', label: 'Beat (Leeward to Windward)' },
    { from: 'windward', to: 'leeward', type: 'downwind', label: 'Final Run (Windward to Finish)' },
  ],
  windDirection: 0,
  annotations: [
    { text: 'Wind', x: 200, y: 20, type: 'info' },
    { text: 'Simple up-and-down course', x: 50, y: 300, type: 'info' },
    { text: 'Only two marks to round', x: 280, y: 300, type: 'info' },
  ],
  keyFeatures: [
    'The simplest team racing course with only two marks and two points of sail.',
    'Upwind and downwind legs only; no reaching legs reduce passing opportunities.',
    'Mark traps at both windward and leeward marks are the primary tactical tools.',
    'Less tactical variety than the S-Course or Digital N, making it easier for beginners to learn.',
    'Standard fleet racing comparison course; helps new team racers transition from fleet racing.',
    'Quick to set up and requires minimal mark-laying resources.',
  ],
  usedIn: 'Introductory team racing clinics, some school-level competitions, and as a fleet racing comparison layout',
};

// ---------------------------------------------------------------------------
// Combined Exports
// ---------------------------------------------------------------------------

export const COURSE_LAYOUTS: CourseLayout[] = [S_COURSE, DIGITAL_N_COURSE, WINDWARD_LEEWARD_COURSE];

export const COURSE_OVERVIEW = {
  title: 'Team Racing Course Layouts',
  description:
    'Team racing uses specialized course layouts designed to maximize tactical engagement between the two teams. Unlike fleet racing, where courses are optimized for fair starts and clean air, team racing courses are built to create frequent interactions, passing opportunities, and mark-rounding battles. The most common layout is the S-Course, which combines upwind, downwind, and reaching legs in a compact format that keeps races short and intense.',
};

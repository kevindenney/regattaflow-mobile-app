/**
 * Learning Links
 *
 * Maps checklist items to relevant learning modules.
 * Provides quick tips inline and links to full course content.
 */

/**
 * Learning link configuration for a checklist item
 */
export interface LearningLink {
  itemId: string;
  moduleSlug: string;         // Course slug for navigation
  lessonId?: string;          // Deep link to specific lesson
  title: string;              // Display title for the link
  quickTips: string[];        // Tips to show inline in tool panel
  isPremium: boolean;         // Requires subscription to access full content
}

/**
 * Learning links mapped by checklist item ID
 */
export const LEARNING_LINKS: Record<string, LearningLink> = {
  // Documents - Days Before
  review_nor: {
    itemId: 'review_nor',
    moduleSlug: 'racing-basics',
    lessonId: 'lesson-1-5-1',
    title: 'Understanding Race Documents',
    quickTips: [
      'NOR is like an invitation - it tells you what the event is about',
      'Check entry deadlines and eligibility requirements first',
      'Note equipment restrictions and class rules',
      'Review protest procedures and scoring system',
      'Look for any amendments or changes posted',
    ],
    isPremium: false,
  },

  review_si: {
    itemId: 'review_si',
    moduleSlug: 'racing-basics',
    lessonId: 'lesson-1-5-1',
    title: 'Understanding Race Documents',
    quickTips: [
      'SI is your rulebook for the day - read it carefully',
      'Note the starting procedure and warning signals',
      'Find VHF channel and race committee contact',
      'Understand mark rounding order and directions',
      'Check time limits and finishing procedures',
    ],
    isPremium: false,
  },

  study_course: {
    itemId: 'study_course',
    moduleSlug: 'racing-basics',
    lessonId: 'lesson-1-5-1',
    title: 'Understanding Race Documents',
    quickTips: [
      'Course diagrams show marks, order, and rounding directions',
      'Identify all marks by color, shape, and name',
      'Note start/finish line positions and orientations',
      'Check for gate marks and their rounding rules',
      'Look for hazards and restricted areas on the map',
    ],
    isPremium: false,
  },

  // On Water - Starting
  line_sight: {
    itemId: 'line_sight',
    moduleSlug: 'winning-starts-first-beats',
    lessonId: 'lesson-3-2-1',
    title: 'Line Bias & Sights',
    quickTips: [
      'Sail to each end of the line before the sequence',
      'Note transits to shore features for distance',
      'Check for line sag (boat end is often favored)',
      'Time your reach from committee boat to pin',
      'Watch other boats to gauge crowd density',
    ],
    isPremium: true,
  },

  // On Water - Course
  read_course: {
    itemId: 'read_course',
    moduleSlug: 'racing-basics',
    lessonId: 'lesson-1-3-2',
    title: 'Course Reading',
    quickTips: [
      'Confirm course code/number with RC on VHF',
      'Identify all marks in rounding order',
      'Note any gate marks and which side to round',
      'Check course length and number of legs',
      'Know the finish location and orientation',
    ],
    isPremium: false,
  },

  // Rules
  rules_review_18: {
    itemId: 'rules_review_18',
    moduleSlug: 'racing-basics',
    lessonId: 'lesson-1-2-2',
    title: 'Rule 18: Mark Room',
    quickTips: [
      'Inside boat gets room at marks',
      'Overlap must exist at 3 boat lengths (zone)',
      'No room at start marks before starting',
      'Proper course applies in the zone',
      'Tacking in the zone: give mark-room if fetching',
    ],
    isPremium: false,
  },

  // Equipment - Sails
  sails: {
    itemId: 'sails',
    moduleSlug: 'boat-handling-fundamentals',
    title: 'Sail Care & Inspection',
    quickTips: [
      'Check for UV damage along leech and foot',
      'Inspect stitching at high-stress points',
      'Look for chafe marks from spreaders/shrouds',
      'Check batten pockets and battens',
      'Verify tell-tales are intact',
    ],
    isPremium: false,
  },

  // Equipment - Rigging
  lines: {
    itemId: 'lines',
    moduleSlug: 'boat-tuning-performance',
    title: 'Rigging Inspection',
    quickTips: [
      'Check halyards for chafe at sheave exit',
      'Inspect sheets at clew attachment points',
      'Look for core-sheath slippage in control lines',
      'Verify all clutches grip properly',
      'Check standing rigging for cotter pins/tape',
    ],
    isPremium: true,
  },

  // Morning - Rig Tuning
  tune_rig: {
    itemId: 'tune_rig',
    moduleSlug: 'boat-tuning-performance',
    title: 'Rig Tuning Guide',
    quickTips: [
      'Check mast rake for expected conditions',
      'Adjust cap shroud tension based on wind',
      'Set lower shrouds for desired mast bend',
      'Verify spreader sweep angle',
      'Pre-set cunningham and outhaul for conditions',
    ],
    isPremium: true,
  },

  // Morning - Sail Selection
  select_sails: {
    itemId: 'select_sails',
    moduleSlug: 'boat-handling-fundamentals',
    title: 'Sail Selection',
    quickTips: [
      'Match headsail size to expected wind range',
      'Consider wave state for reefing decisions',
      'Choose spinnaker weight for expected shifts',
      'Have backup sails ready if conditions may change',
      'Consider fleet performance in similar conditions',
    ],
    isPremium: false,
  },

  // Morning - Weather
  check_forecast: {
    itemId: 'check_forecast',
    moduleSlug: 'wind-shift-tactics',
    title: 'Weather Analysis',
    quickTips: [
      'Note wind direction and expected shifts',
      'Check for thermal effects (sea breeze)',
      'Review tide times and current strength',
      'Look for pressure trends affecting wind',
      'Monitor cloud development for gusts',
    ],
    isPremium: true,
  },

  // Safety
  safety: {
    itemId: 'safety',
    moduleSlug: 'racing-basics',
    title: 'Safety Requirements',
    quickTips: [
      'PFD must be Coast Guard approved',
      'Whistle attached to PFD for signaling',
      'Knife readily accessible for emergencies',
      'First aid kit with basic supplies',
      'Know emergency procedures for your class',
    ],
    isPremium: false,
  },

  // Distance Racing - Navigation
  nav_prep: {
    itemId: 'nav_prep',
    moduleSlug: 'distance-racing-fundamentals',
    title: 'Navigation Preparation',
    quickTips: [
      'Download latest electronic charts',
      'Enter all waypoints with correct datum',
      'Mark hazards and exclusion zones',
      'Prepare backup paper charts',
      'Test all nav electronics before departure',
    ],
    isPremium: true,
  },

  // Distance Racing - Offshore Safety
  offshore_safety: {
    itemId: 'offshore_safety',
    moduleSlug: 'distance-racing-fundamentals',
    title: 'Offshore Safety',
    quickTips: [
      'EPIRB registered and battery current',
      'Life raft inspected within certification period',
      'Flares within expiration dates',
      'Jacklines installed and inspected',
      'Tethers for all crew, tested',
    ],
    isPremium: true,
  },

  // Match Racing - Opponent Analysis
  opponent_review: {
    itemId: 'opponent_review',
    moduleSlug: 'match-racing-mastery',
    title: 'Opponent Analysis',
    quickTips: [
      'Study their preferred pre-start approach',
      'Note their favored side of the course',
      'Watch their acceleration patterns',
      'Identify crew roles and communication style',
      'Review their penalty turn technique',
    ],
    isPremium: true,
  },

  // Match Racing - Pre-start Tactics
  prestart_tactics: {
    itemId: 'prestart_tactics',
    moduleSlug: 'match-racing-mastery',
    title: 'Pre-start Tactics',
    quickTips: [
      'Plan entry timing and angle',
      'Know when to dial up vs dial down',
      'Practice circling engagements',
      'Control position at 1 minute',
      'Have escape routes planned',
    ],
    isPremium: true,
  },

  // Team Racing - Combinations
  combo_plays: {
    itemId: 'combo_plays',
    moduleSlug: 'team-racing-tactics',
    title: 'Team Racing Combinations',
    quickTips: [
      '1-2 combo: Lead protects second',
      'Pass-back: Give position to teammate',
      'Mark trap: Slow opponent at mark',
      'Hunt and catch: Two on one pursuit',
      'Know winning combinations: 1-2-3, 1-2-4, etc.',
    ],
    isPremium: true,
  },

  // Team Racing - Assignments
  team_boat_assignments: {
    itemId: 'team_boat_assignments',
    moduleSlug: 'team-racing-tactics',
    title: 'Team Boat Assignments',
    quickTips: [
      'Match sailor strengths to boat positions',
      'Pin end: Strong starter, aggressive',
      'Middle: Flexible, good boat handling',
      'Boat end: Tactical, good at reading plays',
      'Have backup assignments if conditions change',
    ],
    isPremium: true,
  },
};

/**
 * Get learning link for a checklist item
 */
export function getLearningLink(itemId: string): LearningLink | null {
  return LEARNING_LINKS[itemId] || null;
}

/**
 * Check if an item has a learning module link
 */
export function hasLearningLink(itemId: string): boolean {
  return !!LEARNING_LINKS[itemId];
}

/**
 * Get quick tips for a checklist item
 */
export function getQuickTips(itemId: string): string[] {
  return LEARNING_LINKS[itemId]?.quickTips || [];
}

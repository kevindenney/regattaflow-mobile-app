/**
 * Checklist Configuration
 *
 * Data-driven checklist items organized by race type and phase.
 * Each item specifies which race types it applies to.
 */

import { ChecklistItem, ChecklistCategory, RacePhase } from '@/types/checklists';
import { RaceType } from '@/types/raceEvents';

// =============================================================================
// DOCUMENT ITEMS (Days Before - All race types)
// =============================================================================

const DOCUMENT_ITEMS: ChecklistItem[] = [
  {
    id: 'review_nor',
    label: 'Review Notice of Race',
    priority: 'high',
    description: 'Read NOR for entry requirements, schedule, and race format',
    raceTypes: ['fleet', 'distance', 'match', 'team'],
    phase: 'days_before',
    category: 'documents',
    toolId: 'nor_review',
    toolType: 'full_wizard',
    learningModuleSlug: 'racing-basics',
    learningModuleId: 'lesson-1-5-1', // Understanding Race Documents
    quickTips: [
      'Check entry deadlines and requirements',
      'Note any equipment restrictions',
      'Review protest procedures',
      'Understand scoring system',
      'Note any amendments or changes',
    ],
  },
  {
    id: 'review_si',
    label: 'Review Sailing Instructions',
    priority: 'high',
    description: 'Study SI for course info, signals, and special procedures',
    raceTypes: ['fleet', 'distance', 'match', 'team'],
    phase: 'days_before',
    category: 'documents',
    toolId: 'si_review',
    toolType: 'full_wizard',
    learningModuleSlug: 'racing-basics',
    learningModuleId: 'lesson-1-5-1', // Understanding Race Documents
    quickTips: [
      'Note VHF channel and race committee contact',
      'Understand starting procedure and flags',
      'Review mark rounding order',
      'Check time limits and finishing procedures',
      'Note any restricted areas',
    ],
  },
  {
    id: 'study_course',
    label: 'Study course layout',
    priority: 'high',
    description: 'Review course marks, layout, and racing area on the map',
    raceTypes: ['fleet', 'distance', 'match', 'team'],
    phase: 'days_before',
    category: 'documents',
    toolId: 'course_map',
    toolType: 'full_wizard',
    learningModuleSlug: 'racing-basics',
    learningModuleId: 'lesson-1-5-1', // Understanding Race Documents
    quickTips: [
      'Identify all marks and their colors/shapes',
      'Understand the course configuration',
      'Note any gates and rounding directions',
      'Check for hazards and restricted areas',
      'Plan laylines for expected wind',
    ],
  },
];

// =============================================================================
// WEATHER ITEMS (Days Before - All race types)
// =============================================================================

const WEATHER_ITEMS: ChecklistItem[] = [
  {
    id: 'check_weather_forecast',
    label: 'Check weather forecast',
    priority: 'high',
    description: 'Review forecast for race time - AI tracks changes between checks',
    raceTypes: ['fleet', 'distance', 'match', 'team'],
    phase: 'days_before',
    category: 'weather',
    toolId: 'forecast_check',
    toolType: 'full_wizard',
    learningModuleSlug: 'wind-shift-tactics',
    quickTips: [
      'Check forecast daily as race approaches',
      'Note significant wind or tide changes',
      'AI will analyze implications automatically',
    ],
  },
];

// =============================================================================
// BASE EQUIPMENT ITEMS (All race types)
// =============================================================================

const BASE_EQUIPMENT_ITEMS: ChecklistItem[] = [
  {
    id: 'sails',
    label: 'Check sails for damage',
    priority: 'high',
    description: 'Inspect main, jib, and spinnaker for tears, UV damage, or worn stitching',
    raceTypes: ['fleet', 'distance', 'match', 'team'],
    phase: 'days_before',
    category: 'equipment',
    toolId: 'sail_inspection',
    toolType: 'full_wizard',
    learningModuleSlug: 'boat-handling-fundamentals',
  },
  {
    id: 'lines',
    label: 'Inspect running rigging',
    priority: 'high', // Upgraded from medium - physical inspection is important
    description: 'Check halyards, sheets, and control lines for chafe and wear',
    raceTypes: ['fleet', 'distance', 'match', 'team'],
    phase: 'days_before',
    category: 'equipment',
    toolId: 'rigging_inspection',
    toolType: 'full_wizard',
    learningModuleSlug: 'boat-tuning-performance',
  },
  {
    id: 'battery',
    label: 'Charge electronics',
    priority: 'high', // Upgraded from medium - critical for safety
    description: 'GPS, VHF, phone, camera batteries fully charged',
    raceTypes: ['fleet', 'distance', 'match', 'team'],
    phase: 'days_before',
    category: 'equipment',
    toolId: 'electronics_checklist',
    toolType: 'interactive',
    toolConfig: {
      subItems: [
        { id: 'gps', label: 'GPS/chartplotter', description: 'Check battery level 100%' },
        { id: 'vhf', label: 'VHF radio', description: 'Transmit/receive test completed' },
        { id: 'phone', label: 'Phone/backup nav', description: 'Charged with waterproof case' },
        { id: 'camera', label: 'Camera', description: 'For finish photos and protests' },
      ],
    },
  },
  {
    id: 'safety',
    label: 'Safety gear complete',
    priority: 'high',
    description: 'PFDs, whistle, knife, first aid kit checked and accessible',
    raceTypes: ['fleet', 'distance', 'match', 'team'],
    phase: 'days_before',
    category: 'safety',
    toolId: 'safety_gear',
    toolType: 'full_wizard',
    learningModuleSlug: 'racing-basics',
  },
];

// =============================================================================
// BASE CREW ITEMS (All race types)
// =============================================================================

const BASE_CREW_ITEMS: ChecklistItem[] = [
  {
    id: 'confirm_crew',
    label: 'Confirm crew availability',
    priority: 'high',
    raceTypes: ['fleet', 'distance', 'match', 'team'],
    phase: 'days_before',
    category: 'crew',
    toolId: 'crew_confirmation',
    toolType: 'quick_tips',
    quickTips: [
      'Contact all crew members 48+ hours before',
      'Confirm transportation arrangements',
      'Share meeting time and location',
      'Discuss roles and any position changes',
      'Verify everyone has required gear',
    ],
  },
  {
    id: 'assign_positions',
    label: 'Assign positions',
    priority: 'medium',
    description: 'Helm, trim, bow, tactics roles confirmed',
    raceTypes: ['fleet', 'distance', 'match'],
    phase: 'days_before',
    category: 'crew',
    toolId: 'position_assignment',
    toolType: 'interactive',
  },
  {
    id: 'meeting_point',
    label: 'Set meeting point/time',
    priority: 'medium',
    description: 'Where and when to meet before the race',
    raceTypes: ['fleet', 'distance', 'match', 'team'],
    phase: 'days_before',
    category: 'crew',
    toolId: 'meeting_point',
    toolType: 'interactive',
  },
];

// =============================================================================
// BASE LOGISTICS ITEMS (All race types)
// =============================================================================

const BASE_LOGISTICS_ITEMS: ChecklistItem[] = [
  {
    id: 'transport',
    label: 'Arrange transport',
    priority: 'low',
    raceTypes: ['fleet', 'distance', 'match', 'team'],
    phase: 'days_before',
    category: 'logistics',
  },
  {
    id: 'accommodation',
    label: 'Book accommodation',
    priority: 'low',
    raceTypes: ['fleet', 'distance', 'match', 'team'],
    phase: 'days_before',
    category: 'logistics',
  },
  {
    id: 'food',
    label: 'Plan provisions',
    priority: 'low',
    raceTypes: ['fleet', 'distance', 'match', 'team'],
    phase: 'days_before',
    category: 'logistics',
  },
];

// =============================================================================
// DISTANCE RACING ITEMS
// =============================================================================

const DISTANCE_ITEMS: ChecklistItem[] = [
  // Days Before
  {
    id: 'provisions_planning',
    label: 'Provision planning complete',
    priority: 'high',
    description: 'Food, water, snacks calculated for race duration + reserve',
    raceTypes: ['distance'],
    phase: 'days_before',
    category: 'logistics',
  },
  {
    id: 'watch_schedule',
    label: 'Watch schedule assigned',
    priority: 'high',
    description: 'Crew rotation plan for multi-day passage',
    raceTypes: ['distance'],
    phase: 'days_before',
    category: 'crew',
    toolId: 'watch_schedule',
    toolType: 'full_wizard',
    learningModuleSlug: 'distance-racing-fundamentals',
  },
  {
    id: 'nav_prep',
    label: 'Navigation prep complete',
    priority: 'high',
    description: 'Charts updated, waypoints entered, backup nav available',
    raceTypes: ['distance'],
    phase: 'days_before',
    category: 'navigation',
    toolId: 'nav_prep',
    toolType: 'full_wizard',
    learningModuleSlug: 'distance-racing-fundamentals',
  },
  {
    id: 'offshore_safety',
    label: 'Offshore safety equipment checked',
    priority: 'high',
    description: 'EPIRB, life raft, flares, jacklines, tethers inspected',
    raceTypes: ['distance'],
    phase: 'days_before',
    category: 'safety',
    toolId: 'offshore_safety',
    toolType: 'full_wizard',
    learningModuleSlug: 'distance-racing-fundamentals',
  },
  {
    id: 'storm_sails',
    label: 'Storm sails rigged and ready',
    priority: 'medium',
    description: 'Trysail and storm jib accessible, crew familiar with setup',
    raceTypes: ['distance'],
    phase: 'days_before',
    category: 'equipment',
  },
  // Race Morning
  {
    id: 'route_briefing',
    label: 'Route briefing with crew',
    priority: 'high',
    description: 'Review waypoints, hazards, and strategic decision points',
    raceTypes: ['distance'],
    phase: 'race_morning',
    category: 'navigation',
    toolType: 'quick_tips',
    learningModuleSlug: 'distance-racing-strategy',
    learningModuleId: 'lesson-12-1-1',
    quickTips: [
      'Review all waypoints and coordinates with entire crew',
      'Mark major hazards: shipping lanes, shallows, exclusion zones',
      'Establish key decision points where strategy may change',
      'Assign navigation duties and handoff procedures',
      'Brief on emergency waypoints and nearest safe harbors',
      'Discuss communication protocol for course changes',
      'Post written route summary at nav station',
    ],
  },
  {
    id: 'weather_routing',
    label: 'Weather routing check',
    priority: 'high',
    description: 'Final weather files downloaded, routing optimized',
    raceTypes: ['distance'],
    phase: 'race_morning',
    category: 'weather',
    toolType: 'quick_tips',
    learningModuleSlug: 'distance-racing-strategy',
    learningModuleId: 'lesson-12-1-2',
    quickTips: [
      'Download latest GRIB files from multiple sources',
      'Run routing with current polars and safety margins',
      'Identify weather windows and timing for key decisions',
      'Note model disagreement areas - plan contingencies',
      'Check for developing systems that may affect race',
      'Compare optimal route with rhumb line',
      'Plan sail changes based on forecasted conditions',
    ],
  },
  {
    id: 'watch_assignments',
    label: 'Crew watch assignments confirmed',
    priority: 'medium',
    description: 'First watches assigned, rest schedule started',
    raceTypes: ['distance'],
    phase: 'race_morning',
    category: 'crew',
  },
];

// =============================================================================
// MATCH RACING ITEMS
// =============================================================================

const MATCH_ITEMS: ChecklistItem[] = [
  // Days Before
  {
    id: 'opponent_review',
    label: 'Review opponent style/tendencies',
    priority: 'high',
    description: 'Study their pre-start patterns, preferred side, and weaknesses',
    raceTypes: ['match'],
    phase: 'days_before',
    category: 'tactics',
    toolId: 'opponent_review',
    toolType: 'interactive',
    learningModuleSlug: 'match-racing-mastery',
  },
  {
    id: 'prestart_tactics',
    label: 'Plan pre-start tactics',
    priority: 'high',
    description: 'Entry strategy, dial-up/dial-down, control positions',
    raceTypes: ['match'],
    phase: 'days_before',
    category: 'tactics',
    toolId: 'prestart_tactics',
    toolType: 'quick_tips',
    learningModuleSlug: 'match-racing-mastery',
    quickTips: [
      'Plan entry timing and angle',
      'Know when to dial up vs dial down',
      'Practice circling engagements',
      'Control position at 1 minute',
      'Have escape routes planned',
    ],
  },
  {
    id: 'umpire_channel',
    label: 'Confirm umpire VHF channel',
    priority: 'medium',
    description: 'Know the channel for penalty calls and protests',
    raceTypes: ['match'],
    phase: 'days_before',
    category: 'equipment',
  },
  {
    id: 'protest_deadline',
    label: 'Note protest deadline',
    priority: 'low',
    description: 'Know the time limit for filing protests after racing',
    raceTypes: ['match'],
    phase: 'days_before',
    category: 'rules',
  },
  // Race Morning
  {
    id: 'rules_review_18',
    label: 'Review Rule 18 (mark room)',
    priority: 'high',
    description: 'Mark room scenarios specific to match racing',
    raceTypes: ['match'],
    phase: 'race_morning',
    category: 'rules',
    toolId: 'rules_review',
    toolType: 'quick_tips',
    learningModuleSlug: 'racing-basics',
    learningModuleId: 'lesson-1-2-2',
    quickTips: [
      'Inside boat gets room at marks',
      'Overlap must exist at 3 boat lengths (zone)',
      'No room at start marks before starting',
      'Proper course applies in the zone',
      'Tacking in zone: give mark-room if fetching',
    ],
  },
  {
    id: 'rules_review_31',
    label: 'Review Rule 31 (touching a mark)',
    priority: 'medium',
    description: 'Penalty turns and exoneration rules',
    raceTypes: ['match'],
    phase: 'race_morning',
    category: 'rules',
  },
  {
    id: 'penalty_system',
    label: 'Review penalty system',
    priority: 'medium',
    description: 'Umpire signals, spin penalties, red/green flag meanings',
    raceTypes: ['match'],
    phase: 'race_morning',
    category: 'rules',
  },
  {
    id: 'match_prestart_drill',
    label: 'Pre-start drill with crew',
    priority: 'high',
    description: 'Practice entry timing, acceleration, and maneuvers',
    raceTypes: ['match'],
    phase: 'race_morning',
    category: 'tactics',
  },
];

// =============================================================================
// TEAM RACING ITEMS
// =============================================================================

const TEAM_ITEMS: ChecklistItem[] = [
  // Days Before
  {
    id: 'team_boat_assignments',
    label: 'Confirm team boat assignments',
    priority: 'high',
    description: 'Which sailor races which boat in each heat',
    raceTypes: ['team'],
    phase: 'days_before',
    category: 'team_coordination',
    toolId: 'team_assignments',
    toolType: 'interactive',
    learningModuleSlug: 'team-racing-tactics',
  },
  {
    id: 'combo_plays',
    label: 'Review combination plays',
    priority: 'high',
    description: '1-2 combo, pass-back, mark trap tactics',
    raceTypes: ['team'],
    phase: 'days_before',
    category: 'tactics',
    toolId: 'combo_plays',
    toolType: 'quick_tips',
    learningModuleSlug: 'team-racing-tactics',
    quickTips: [
      '1-2 combo: Lead boat protects second',
      'Pass-back: Give position to teammate in better position',
      'Mark trap: Slow opponent at mark for teammate to pass',
      'Hunt and catch: Two boats pursue one opponent',
      'Know winning combinations: 1-2-3 (6), 1-2-4 (7), etc.',
    ],
  },
  {
    id: 'starting_positions',
    label: 'Assign starting boat positions',
    priority: 'medium',
    description: 'Who starts pin, middle, and boat end',
    raceTypes: ['team'],
    phase: 'days_before',
    category: 'team_coordination',
  },
  {
    id: 'winning_combos',
    label: 'Review winning combinations',
    priority: 'medium',
    description: 'Know which position combos win: 1-2-3 (6), 1-2-4 (7), etc.',
    raceTypes: ['team'],
    phase: 'days_before',
    category: 'tactics',
  },
  // Race Morning
  {
    id: 'team_tactics_review',
    label: 'Team tactics review',
    priority: 'high',
    description: 'Go through scenarios and communication plan',
    raceTypes: ['team'],
    phase: 'race_morning',
    category: 'tactics',
  },
  {
    id: 'mark_assignments',
    label: 'Mark rounding assignments',
    priority: 'medium',
    description: 'Who covers which opponent at marks',
    raceTypes: ['team'],
    phase: 'race_morning',
    category: 'team_coordination',
  },
  {
    id: 'comm_signals',
    label: 'Confirm communication signals',
    priority: 'medium',
    description: 'Hand signals, calls for pass-back, help, etc.',
    raceTypes: ['team'],
    phase: 'race_morning',
    category: 'team_coordination',
  },
  {
    id: 'team_warmup',
    label: 'Team warmup sail together',
    priority: 'medium',
    description: 'Practice maneuvers and communication on the water',
    raceTypes: ['team'],
    phase: 'race_morning',
    category: 'team_coordination',
  },
];

// =============================================================================
// MORNING ITEMS (All race types)
// =============================================================================

const MORNING_ITEMS: ChecklistItem[] = [
  {
    id: 'check_forecast',
    label: 'Check final forecast',
    priority: 'high',
    description: 'View current wind, waves, and tide forecast for race time',
    raceTypes: ['fleet', 'distance', 'match', 'team'],
    phase: 'race_morning',
    category: 'weather',
    toolId: 'forecast_check',
    toolType: 'full_wizard',
    learningModuleSlug: 'wind-shift-tactics',
    quickTips: [
      'Note wind direction and expected shifts',
      'Check for thermal effects (sea breeze timing)',
      'Review tide times and current strength',
      'Look for pressure trends affecting wind',
      'Monitor cloud development for gusts',
    ],
  },
  {
    id: 'tune_rig',
    label: 'Tune rig for conditions',
    priority: 'high',
    description: 'AI-powered rig tuning recommendations for current conditions',
    raceTypes: ['fleet', 'distance', 'match', 'team'],
    phase: 'race_morning',
    category: 'equipment',
    toolId: 'rig_tuning_wizard',
    toolType: 'full_wizard',
    learningModuleSlug: 'boat-tuning-performance',
    quickTips: [
      'Check mast rake for expected conditions',
      'Adjust cap shroud tension based on wind',
      'Set lower shrouds for desired mast bend',
      'Verify spreader sweep angle',
      'Pre-set cunningham and outhaul for conditions',
    ],
  },
  {
    id: 'select_sails',
    label: 'Select and rig sails',
    priority: 'high',
    description: 'AI-powered sail recommendations for current conditions',
    raceTypes: ['fleet', 'distance', 'match', 'team'],
    phase: 'race_morning',
    category: 'equipment',
    toolId: 'sail_selection_wizard',
    toolType: 'full_wizard',
    learningModuleSlug: 'boat-handling-fundamentals',
    quickTips: [
      'Match headsail size to expected wind range',
      'Consider wave state for reefing decisions',
      'Choose spinnaker weight for expected shifts',
      'Have backup sails ready if conditions may change',
      'Consider fleet performance in similar conditions',
    ],
  },
  {
    id: 'review_tactics',
    label: 'Review tactics with crew',
    priority: 'medium',
    description: 'AI-powered tactical briefing with venue and conditions insights',
    raceTypes: ['fleet', 'match'],
    phase: 'race_morning',
    category: 'tactics',
    toolId: 'tactics_review_wizard',
    toolType: 'full_wizard',
    learningModuleSlug: 'pre-race-planning',
    quickTips: [
      'Discuss wind shifts and favored side of the course',
      'Review starting plan and fallback options',
      'Assign mark rounding roles and communication',
      'Identify key competitors and their tendencies',
      'Agree on tactical calls and crew responses',
    ],
  },
];

// =============================================================================
// ON WATER ITEMS (All race types)
// =============================================================================

const ON_WATER_ITEMS: ChecklistItem[] = [
  {
    id: 'check_in',
    label: 'Check in with race committee',
    priority: 'high',
    description: 'Confirm on course and ready to race',
    raceTypes: ['fleet', 'distance', 'match', 'team'],
    phase: 'on_water',
    category: 'on_water',
    toolType: 'quick_tips',
    learningModuleSlug: 'racing-basics',
    learningModuleId: 'lesson-1-3-1',
    quickTips: [
      'Sail past the committee boat to confirm your sail number is visible',
      'Listen for acknowledgment on VHF or visual signal',
      'Note the course designation announced',
      'Confirm starting sequence timing (5-4-1 or 3-2-1)',
      'Check wind direction relative to committee boat',
    ],
  },
  {
    id: 'read_course',
    label: 'Read course board / get course info',
    priority: 'high',
    description: 'Course configuration, mark order, VHF channel',
    raceTypes: ['fleet', 'match', 'team'],
    phase: 'on_water',
    category: 'on_water',
    toolId: 'course_reading',
    toolType: 'quick_tips',
    learningModuleSlug: 'racing-basics',
    learningModuleId: 'lesson-1-3-2',
    quickTips: [
      'Confirm course code/number with RC on VHF',
      'Identify all marks in rounding order',
      'Note any gate marks and which side to round',
      'Check course length and number of legs',
      'Know the finish location and orientation',
    ],
  },
  {
    id: 'line_sight',
    label: 'Get line sights',
    priority: 'high',
    description: 'Transit marks for start line bias and distance',
    raceTypes: ['fleet', 'match', 'team'],
    phase: 'on_water',
    category: 'tactics',
    toolId: 'line_sight',
    toolType: 'quick_tips',
    learningModuleSlug: 'winning-starts-first-beats',
    learningModuleId: 'lesson-3-2-1',
    quickTips: [
      'Sail to each end of the line before the sequence',
      'Note transits to shore features for distance',
      'Check for line sag (boat end is often favored)',
      'Time your reach from committee boat to pin',
      'Watch other boats to gauge crowd density',
    ],
  },
  {
    id: 'current_check',
    label: 'Check current at marks',
    priority: 'medium',
    description: 'Observe water flow at windward and leeward marks',
    raceTypes: ['fleet', 'match', 'team'],
    phase: 'on_water',
    category: 'tactics',
    toolType: 'quick_tips',
    learningModuleSlug: 'race-preparation-mastery',
    learningModuleId: 'lesson-13-1-2',
    quickTips: [
      'Look for ripples or disturbance around mark anchors',
      'Note which way debris or seaweed flows past marks',
      'Compare boat drift when stationary near marks',
      'Check if current differs between windward and leeward ends',
      'Factor current into layline calculations',
    ],
  },
];

// =============================================================================
// ALL ITEMS COMBINED
// =============================================================================

const ALL_CHECKLIST_ITEMS: ChecklistItem[] = [
  ...DOCUMENT_ITEMS,
  ...WEATHER_ITEMS,
  ...BASE_EQUIPMENT_ITEMS,
  ...BASE_CREW_ITEMS,
  ...BASE_LOGISTICS_ITEMS,
  ...DISTANCE_ITEMS,
  ...MATCH_ITEMS,
  ...TEAM_ITEMS,
  ...MORNING_ITEMS,
  ...ON_WATER_ITEMS,
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get checklist items for a specific race type and phase
 */
export function getChecklistItems(
  raceType: RaceType,
  phase: RacePhase
): ChecklistItem[] {
  return ALL_CHECKLIST_ITEMS.filter(
    (item) => item.raceTypes.includes(raceType) && item.phase === phase
  );
}

/**
 * Get checklist items for a specific race type, phase, and category
 */
export function getChecklistItemsByCategory(
  raceType: RaceType,
  phase: RacePhase,
  category: ChecklistCategory
): ChecklistItem[] {
  return ALL_CHECKLIST_ITEMS.filter(
    (item) =>
      item.raceTypes.includes(raceType) &&
      item.phase === phase &&
      item.category === category
  );
}

/**
 * Get all categories used in a specific phase for a race type
 */
export function getCategoriesForPhase(
  raceType: RaceType,
  phase: RacePhase
): ChecklistCategory[] {
  const items = getChecklistItems(raceType, phase);
  const categories = [...new Set(items.map((item) => item.category))];

  // Sort categories in a logical order
  // Documents come first in prep phase as NOR/SI inform other decisions
  // Weather next as it impacts equipment and tactics
  const categoryOrder: ChecklistCategory[] = [
    'documents',
    'weather',
    'equipment',
    'safety',
    'crew',
    'team_coordination',
    'logistics',
    'navigation',
    'tactics',
    'rules',
    'morning',
    'on_water',
  ];

  return categories.sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );
}

/**
 * Get items grouped by category for a specific race type and phase
 */
export function getItemsGroupedByCategory(
  raceType: RaceType,
  phase: RacePhase
): Record<ChecklistCategory, ChecklistItem[]> {
  const items = getChecklistItems(raceType, phase);
  const grouped: Partial<Record<ChecklistCategory, ChecklistItem[]>> = {};

  for (const item of items) {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category]!.push(item);
  }

  return grouped as Record<ChecklistCategory, ChecklistItem[]>;
}

/**
 * Get the total count of items for a race type and phase
 */
export function getChecklistCount(
  raceType: RaceType,
  phase: RacePhase
): number {
  return getChecklistItems(raceType, phase).length;
}

/**
 * Check if a race type has any race-type-specific items
 * (beyond the base items shared by all types)
 */
export function hasTypeSpecificItems(raceType: RaceType): boolean {
  const typeSpecificItems = ALL_CHECKLIST_ITEMS.filter(
    (item) =>
      item.raceTypes.length < 4 && // Not shared by all types
      item.raceTypes.includes(raceType)
  );
  return typeSpecificItems.length > 0;
}

// Export individual item collections for testing/debugging
export {
  DOCUMENT_ITEMS,
  WEATHER_ITEMS,
  BASE_EQUIPMENT_ITEMS,
  BASE_CREW_ITEMS,
  BASE_LOGISTICS_ITEMS,
  DISTANCE_ITEMS,
  MATCH_ITEMS,
  TEAM_ITEMS,
  MORNING_ITEMS,
  ON_WATER_ITEMS,
  ALL_CHECKLIST_ITEMS,
};

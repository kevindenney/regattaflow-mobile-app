/**
 * Practice Session Checklist Configuration
 *
 * Data-driven checklist items organized by practice phase.
 * Parallels the race checklist system but focused on training.
 */

import { ChecklistCategory, ChecklistPriority, ChecklistToolType } from '@/types/checklists';
import { PracticePhase } from '@/types/practice';

// =============================================================================
// PRACTICE-SPECIFIC TYPES
// =============================================================================

/**
 * Practice checklist item (similar to race ChecklistItem but for practice phases)
 */
export interface PracticeChecklistItem {
  id: string;
  label: string;
  priority?: ChecklistPriority;
  description?: string;
  phase: PracticePhase;
  category: ChecklistCategory;

  // Tool integration
  toolId?: string;
  toolType?: ChecklistToolType;
  toolConfig?: Record<string, unknown>;

  // Learning module links
  learningModuleId?: string;
  learningModuleSlug?: string;
  quickTips?: string[];
}

/**
 * Practice checklist completion with user attribution (for shared checklists)
 */
export interface PracticeChecklistCompletion {
  itemId: string;
  completedAt: string;
  completedBy: string;
  completedByName?: string;
  notes?: string;
}

// =============================================================================
// PREPARE PHASE ITEMS (Before session day)
// =============================================================================

const PREPARE_ITEMS: PracticeChecklistItem[] = [
  // Planning
  {
    id: 'review_drill_plan',
    label: 'Review drill plan',
    priority: 'high',
    description: 'Confirm the drills and focus areas for this session',
    phase: 'practice_prepare',
    category: 'tactics', // Using tactics for planning
    quickTips: [
      'Check drill durations fit your time slot',
      'Ensure drills build on each other logically',
      'Match drill difficulty to current skill level',
    ],
  },
  {
    id: 'set_goals',
    label: 'Set session goals',
    priority: 'high',
    description: 'Define 1-2 specific, measurable goals for this practice',
    phase: 'practice_prepare',
    category: 'tactics',
    quickTips: [
      'Be specific: "Tack in 4 seconds" not "improve tacking"',
      'Choose goals you can measure or observe',
      'Limit to 1-2 goals per session for focus',
    ],
  },
  // Equipment
  {
    id: 'check_equipment',
    label: 'Check equipment condition',
    priority: 'high',
    description: 'Inspect boat, sails, and lines for any issues',
    phase: 'practice_prepare',
    category: 'equipment',
    toolId: 'equipment_quick_check',
    toolType: 'interactive',
    toolConfig: {
      subItems: [
        { id: 'hull', label: 'Hull & fittings', description: 'No cracks, bungs in' },
        { id: 'rigging', label: 'Standing rigging', description: 'Shrouds tight, no damage' },
        { id: 'sails', label: 'Sails', description: 'No tears or worn spots' },
        { id: 'lines', label: 'Running rigging', description: 'Lines not frayed' },
      ],
    },
    learningModuleSlug: 'boat-handling-fundamentals',
  },
  {
    id: 'pack_marks',
    label: 'Pack marks and buoys',
    priority: 'medium',
    description: 'Bring any marks needed for drill setup',
    phase: 'practice_prepare',
    category: 'equipment',
    quickTips: [
      'Check which drills need marks',
      'Include anchors and weights',
      'Bring visible colors for easy spotting',
    ],
  },
  // Crew
  {
    id: 'confirm_attendance',
    label: 'Confirm crew attendance',
    priority: 'high',
    description: 'Verify who is coming and their roles',
    phase: 'practice_prepare',
    category: 'crew',
    toolId: 'crew_confirmation',
    toolType: 'quick_tips',
    quickTips: [
      'Contact crew 24h before',
      'Confirm meeting time and location',
      'Share the practice plan',
      'Assign roles if rotating positions',
    ],
  },
  // Weather
  {
    id: 'check_forecast',
    label: 'Check forecast conditions',
    priority: 'high',
    description: 'Review wind and weather for practice time',
    phase: 'practice_prepare',
    category: 'weather',
    toolId: 'forecast_check',
    toolType: 'full_wizard',
    learningModuleSlug: 'wind-shift-tactics',
    quickTips: [
      'Check wind strength matches drill requirements',
      'Note any weather changes expected',
      'Consider postponing if conditions unsuitable',
    ],
  },
];

// =============================================================================
// LAUNCH PHASE ITEMS (Session day, before start)
// =============================================================================

const LAUNCH_ITEMS: PracticeChecklistItem[] = [
  // Safety
  {
    id: 'safety_briefing',
    label: 'Safety briefing complete',
    priority: 'high',
    description: 'Review safety procedures and communication plan',
    phase: 'practice_launch',
    category: 'safety',
    toolId: 'safety_briefing',
    toolType: 'quick_tips',
    quickTips: [
      'Confirm all crew have PFDs',
      'Review capsize recovery procedure',
      'Set emergency rendezvous point',
      'Share phone numbers',
      'Identify potential hazards',
    ],
  },
  {
    id: 'communication_check',
    label: 'Communication check',
    priority: 'high',
    description: 'Test VHF radio or agree on visual signals',
    phase: 'practice_launch',
    category: 'safety',
    quickTips: [
      'Test VHF if using',
      'Agree on hand signals for common commands',
      'Set check-in intervals if separating',
    ],
  },
  // Conditions
  {
    id: 'review_conditions',
    label: 'Review current conditions',
    priority: 'high',
    description: 'Assess wind, waves, and current before launching',
    phase: 'practice_launch',
    category: 'weather',
    quickTips: [
      'Note actual vs forecast wind',
      'Check for shifts or gusts',
      'Observe wave state',
      'Adjust drill plan if needed',
    ],
  },
  // Warmup
  {
    id: 'warmup_plan',
    label: 'Confirm warm-up plan',
    priority: 'medium',
    description: 'Plan 5-10 minutes of easy sailing before drills',
    phase: 'practice_launch',
    category: 'tactics',
    quickTips: [
      'Start with easy maneuvers',
      'Get a feel for the conditions',
      'Check all controls are working',
      'Let crew settle into positions',
    ],
  },
  // Crew
  {
    id: 'assign_roles',
    label: 'Assign crew roles',
    priority: 'medium',
    description: 'Confirm who does what for each drill',
    phase: 'practice_launch',
    category: 'crew',
    quickTips: [
      'Rotate positions if training multiple skills',
      'Match roles to learning goals',
      'Consider fatigue management',
    ],
  },
  // Equipment
  {
    id: 'rig_setup',
    label: 'Set up rig for conditions',
    priority: 'medium',
    description: 'Adjust rig settings based on current wind',
    phase: 'practice_launch',
    category: 'equipment',
    toolId: 'rig_tuning_wizard',
    toolType: 'full_wizard',
    learningModuleSlug: 'boat-tuning-performance',
  },
];

// =============================================================================
// TRAIN PHASE ITEMS (During session - minimal)
// =============================================================================

const TRAIN_ITEMS: PracticeChecklistItem[] = [
  // These are intentionally minimal - focus should be on training
  {
    id: 'drill_setup',
    label: 'Set up drill course',
    priority: 'high',
    description: 'Deploy any marks needed for current drill',
    phase: 'practice_train',
    category: 'equipment',
  },
  {
    id: 'time_check',
    label: 'Check remaining time',
    priority: 'low',
    description: 'Ensure enough time for remaining drills',
    phase: 'practice_train',
    category: 'logistics',
  },
];

// =============================================================================
// REFLECT PHASE ITEMS (After session)
// =============================================================================

const REFLECT_ITEMS: PracticeChecklistItem[] = [
  // Reflection
  {
    id: 'rate_drills',
    label: 'Rate each drill',
    priority: 'high',
    description: 'Score how well each drill went (1-5)',
    phase: 'practice_reflect',
    category: 'tactics',
    quickTips: [
      '5 = Excellent execution, met all goals',
      '4 = Good, minor issues',
      '3 = Average, some challenges',
      '2 = Struggled, needs more work',
      '1 = Did not go well, revisit approach',
    ],
  },
  {
    id: 'capture_learning',
    label: 'Note key learning moment',
    priority: 'high',
    description: 'Record the most important insight from this session',
    phase: 'practice_reflect',
    category: 'tactics',
    quickTips: [
      'What worked really well?',
      'What surprised you?',
      'What would you do differently?',
      'What should you practice next?',
    ],
  },
  // Equipment
  {
    id: 'log_equipment_issues',
    label: 'Log any equipment issues',
    priority: 'medium',
    description: 'Note anything that needs repair or attention',
    phase: 'practice_reflect',
    category: 'equipment',
    quickTips: [
      'Minor issues easy to forget',
      'Issues carry to next session prep',
      'Include any consumables used up',
    ],
  },
  // Planning
  {
    id: 'identify_next_focus',
    label: 'Identify next focus area',
    priority: 'medium',
    description: 'Based on today, what should the next session target?',
    phase: 'practice_reflect',
    category: 'tactics',
    quickTips: [
      'Continue working on today\'s skill?',
      'Move to related skill?',
      'Address a gap that emerged?',
    ],
  },
  // Crew
  {
    id: 'crew_debrief',
    label: 'Debrief with crew',
    priority: 'low',
    description: 'Quick discussion of what went well and what to improve',
    phase: 'practice_reflect',
    category: 'crew',
    quickTips: [
      'Keep it positive and constructive',
      'Each person shares one highlight',
      'Agree on one thing to work on',
    ],
  },
];

// =============================================================================
// ALL ITEMS COMBINED
// =============================================================================

const ALL_PRACTICE_CHECKLIST_ITEMS: PracticeChecklistItem[] = [
  ...PREPARE_ITEMS,
  ...LAUNCH_ITEMS,
  ...TRAIN_ITEMS,
  ...REFLECT_ITEMS,
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get practice checklist items for a specific phase
 */
export function getPracticeChecklistItems(
  phase: PracticePhase
): PracticeChecklistItem[] {
  return ALL_PRACTICE_CHECKLIST_ITEMS.filter((item) => item.phase === phase);
}

/**
 * Get practice checklist items for a specific phase and category
 */
export function getPracticeChecklistItemsByCategory(
  phase: PracticePhase,
  category: ChecklistCategory
): PracticeChecklistItem[] {
  return ALL_PRACTICE_CHECKLIST_ITEMS.filter(
    (item) => item.phase === phase && item.category === category
  );
}

/**
 * Get all categories used in a specific practice phase
 */
export function getCategoriesForPracticePhase(
  phase: PracticePhase
): ChecklistCategory[] {
  const items = getPracticeChecklistItems(phase);
  const categories = [...new Set(items.map((item) => item.category))];

  // Sort categories in a logical order for practice
  const categoryOrder: ChecklistCategory[] = [
    'tactics',      // Planning/goals first
    'safety',       // Safety is paramount
    'weather',      // Conditions check
    'equipment',    // Gear prep
    'crew',         // Team coordination
    'logistics',    // Time management
  ];

  return categories.sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );
}

/**
 * Get items grouped by category for a specific practice phase
 */
export function getPracticeItemsGroupedByCategory(
  phase: PracticePhase
): Partial<Record<ChecklistCategory, PracticeChecklistItem[]>> {
  const items = getPracticeChecklistItems(phase);
  const grouped: Partial<Record<ChecklistCategory, PracticeChecklistItem[]>> = {};

  for (const item of items) {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category]!.push(item);
  }

  return grouped;
}

/**
 * Get the total count of items for a practice phase
 */
export function getPracticeChecklistCount(phase: PracticePhase): number {
  return getPracticeChecklistItems(phase).length;
}

// Export individual item collections for testing/debugging
export {
  PREPARE_ITEMS,
  LAUNCH_ITEMS,
  TRAIN_ITEMS,
  REFLECT_ITEMS,
  ALL_PRACTICE_CHECKLIST_ITEMS,
};

/**
 * Tool Registry
 *
 * Maps checklist item toolIds to their implementations.
 * Provides a centralized way to look up tool components for checklist items.
 */

import { ComponentType } from 'react';
import { ChecklistItem, ChecklistToolType } from '@/types/checklists';

/**
 * Props common to all checklist tools
 */
export interface ChecklistToolProps {
  item: ChecklistItem;
  regattaId: string;
  boatId?: string;
  onComplete: () => void;
  onCancel: () => void;
}

/**
 * Tool registration entry
 */
export interface ToolRegistration {
  id: string;
  type: ChecklistToolType;
  component: ComponentType<ChecklistToolProps>;
  displayName: string;
  icon: string; // Lucide icon name
}

/**
 * Tool registry - maps tool IDs to their implementations
 * Components are lazy-loaded to avoid circular dependencies
 */
export const TOOL_REGISTRY: Record<string, Omit<ToolRegistration, 'component'> & {
  componentPath: string;
}> = {
  // Full Wizards
  sail_inspection: {
    id: 'sail_inspection',
    type: 'full_wizard',
    componentPath: '@/components/sail-inspection/SailInspectionWizard',
    displayName: 'Sail Inspection',
    icon: 'Sailboat',
  },
  safety_gear: {
    id: 'safety_gear',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/wizards/SafetyGearWizard',
    displayName: 'Safety Gear Check',
    icon: 'Shield',
  },
  rigging_inspection: {
    id: 'rigging_inspection',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/wizards/RiggingInspectionWizard',
    displayName: 'Rigging Inspection',
    icon: 'Link2',
  },
  offshore_safety: {
    id: 'offshore_safety',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/wizards/OffshoreSafetyWizard',
    displayName: 'Offshore Safety',
    icon: 'LifeBuoy',
  },
  nav_prep: {
    id: 'nav_prep',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/wizards/NavigationPrepWizard',
    displayName: 'Navigation Prep',
    icon: 'Compass',
  },
  watch_schedule: {
    id: 'watch_schedule',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/wizards/WatchScheduleWizard',
    displayName: 'Watch Schedule',
    icon: 'Clock',
  },
  forecast_check: {
    id: 'forecast_check',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/wizards/ForecastCheckWizard',
    displayName: 'Forecast Check',
    icon: 'CloudSun',
  },
  rig_tuning_wizard: {
    id: 'rig_tuning_wizard',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/wizards/RigTuningWizard',
    displayName: 'Rig Tuning',
    icon: 'Wrench',
  },
  sail_selection_wizard: {
    id: 'sail_selection_wizard',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/wizards/SailSelectionWizard',
    displayName: 'Sail Selection',
    icon: 'Sailboat',
  },
  tactics_review_wizard: {
    id: 'tactics_review_wizard',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/wizards/TacticsReviewWizard',
    displayName: 'Tactics Review',
    icon: 'Target',
  },
  nor_review: {
    id: 'nor_review',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/wizards/DocumentReviewWizard',
    displayName: 'Notice of Race Review',
    icon: 'FileText',
  },
  si_review: {
    id: 'si_review',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/wizards/DocumentReviewWizard',
    displayName: 'Sailing Instructions Review',
    icon: 'Sailboat',
  },
  course_map: {
    id: 'course_map',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/wizards/CourseMapWizard',
    displayName: 'Course Study',
    icon: 'Map',
  },
  pre_race_briefing: {
    id: 'pre_race_briefing',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/wizards/PreRaceBriefingWizard',
    displayName: 'Pre-Race Briefing',
    icon: 'FileText',
  },
  route_briefing: {
    id: 'route_briefing',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/wizards/RouteBriefingWizard',
    displayName: 'Route Briefing',
    icon: 'Navigation',
  },
  tide_strategy: {
    id: 'tide_strategy',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/wizards/TideStrategyWizard',
    displayName: 'Tide Strategy',
    icon: 'Waves',
  },
  wind_shift_strategy: {
    id: 'wind_shift_strategy',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/wizards/WindShiftStrategyWizard',
    displayName: 'Wind Shift Strategy',
    icon: 'Wind',
  },
  start_planner: {
    id: 'start_planner',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/wizards/StartPlannerWizard',
    displayName: 'Start Planner',
    icon: 'Flag',
  },
  first_beat_strategy: {
    id: 'first_beat_strategy',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/wizards/FirstBeatStrategyWizard',
    displayName: 'First Beat Strategy',
    icon: 'TrendingUp',
  },
  four_peaks_schedule: {
    id: 'four_peaks_schedule',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/wizards/FourPeaksScheduleWizard',
    displayName: '4 Peaks Schedule',
    icon: 'Mountain',
  },
  weather_routing_wizard: {
    id: 'weather_routing_wizard',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/wizards/WeatherRoutingWizard',
    displayName: 'Weather Routing',
    icon: 'Navigation',
  },
  vhf_input: {
    id: 'vhf_input',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/wizards/VHFInputWizard',
    displayName: 'VHF Channels',
    icon: 'Radio',
  },
  amendments_viewer: {
    id: 'amendments_viewer',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/AmendmentsViewer',
    displayName: 'Amendments Viewer',
    icon: 'FileWarning',
  },
  scoring_calculator: {
    id: 'scoring_calculator',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/ScoringCalculator',
    displayName: 'Scoring Calculator',
    icon: 'Calculator',
  },
  start_line_analyzer: {
    id: 'start_line_analyzer',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/wizards/StartLineAnalyzerWizard',
    displayName: 'Start Line Analyzer',
    icon: 'Flag',
  },
  distance_calculator: {
    id: 'distance_calculator',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/DistanceCalculator',
    displayName: 'Distance Calculator',
    icon: 'Ruler',
  },
  restricted_areas_map: {
    id: 'restricted_areas_map',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/RestrictedAreasMap',
    displayName: 'Restricted Areas',
    icon: 'AlertTriangle',
  },
  strategy_notes: {
    id: 'strategy_notes',
    type: 'full_wizard',
    componentPath: '@/components/checklist-tools/wizards/StrategyNotesWizard',
    displayName: 'Strategy Notes',
    icon: 'Target',
  },

  // Interactive Checklists
  electronics_checklist: {
    id: 'electronics_checklist',
    type: 'interactive',
    componentPath: '@/components/checklist-tools/checklists/ElectronicsChecklist',
    displayName: 'Electronics Checklist',
    icon: 'Battery',
  },
  opponent_review: {
    id: 'opponent_review',
    type: 'interactive',
    componentPath: '@/components/checklist-tools/checklists/OpponentReviewPanel',
    displayName: 'Opponent Review',
    icon: 'UserSearch',
  },
  team_assignments: {
    id: 'team_assignments',
    type: 'interactive',
    componentPath: '@/components/checklist-tools/checklists/TeamAssignmentsPanel',
    displayName: 'Team Assignments',
    icon: 'Users',
  },
  position_assignment: {
    id: 'position_assignment',
    type: 'interactive',
    componentPath: '@/components/checklist-tools/crew/PositionAssignmentPanel',
    displayName: 'Assign Positions',
    icon: 'Users',
  },
  meeting_point: {
    id: 'meeting_point',
    type: 'interactive',
    componentPath: '@/components/checklist-tools/crew/MeetingPointPicker',
    displayName: 'Meeting Point',
    icon: 'MapPin',
  },

  // Quick Tips Panels
  crew_confirmation: {
    id: 'crew_confirmation',
    type: 'quick_tips',
    componentPath: '@/components/checklist-tools/QuickTipsPanel',
    displayName: 'Crew Confirmation',
    icon: 'Users',
  },
  course_reading: {
    id: 'course_reading',
    type: 'quick_tips',
    componentPath: '@/components/checklist-tools/QuickTipsPanel',
    displayName: 'Course Reading',
    icon: 'Map',
  },
  line_sight: {
    id: 'line_sight',
    type: 'quick_tips',
    componentPath: '@/components/checklist-tools/QuickTipsPanel',
    displayName: 'Line Sights',
    icon: 'Eye',
  },
  rig_tuning: {
    id: 'rig_tuning',
    type: 'quick_tips',
    componentPath: '@/components/checklist-tools/QuickTipsPanel',
    displayName: 'Rig Tuning',
    icon: 'Wrench',
  },
  sail_selection: {
    id: 'sail_selection',
    type: 'quick_tips',
    componentPath: '@/components/checklist-tools/QuickTipsPanel',
    displayName: 'Sail Selection',
    icon: 'Wind',
  },
  forecast_review: {
    id: 'forecast_review',
    type: 'quick_tips',
    componentPath: '@/components/checklist-tools/QuickTipsPanel',
    displayName: 'Forecast Review',
    icon: 'CloudSun',
  },
  rules_review: {
    id: 'rules_review',
    type: 'quick_tips',
    componentPath: '@/components/checklist-tools/QuickTipsPanel',
    displayName: 'Rules Review',
    icon: 'BookOpen',
  },
  prestart_tactics: {
    id: 'prestart_tactics',
    type: 'quick_tips',
    componentPath: '@/components/checklist-tools/QuickTipsPanel',
    displayName: 'Pre-Start Tactics',
    icon: 'Flag',
  },
  combo_plays: {
    id: 'combo_plays',
    type: 'quick_tips',
    componentPath: '@/components/checklist-tools/QuickTipsPanel',
    displayName: 'Combination Plays',
    icon: 'Users',
  },
  crew_debrief: {
    id: 'crew_debrief',
    type: 'quick_tips',
    componentPath: '@/components/checklist-tools/QuickTipsPanel',
    displayName: 'Crew Debrief',
    icon: 'MessageCircle',
  },
  result_entry: {
    id: 'result_entry',
    type: 'interactive',
    componentPath: '@/components/checklist-tools/checklists/ResultEntryPanel',
    displayName: 'Record Result',
    icon: 'Trophy',
  },
  learnings_capture: {
    id: 'learnings_capture',
    type: 'interactive',
    componentPath: '@/components/checklist-tools/checklists/LearningsCapturePanel',
    displayName: 'Capture Learnings',
    icon: 'Lightbulb',
  },
  equipment_log: {
    id: 'equipment_log',
    type: 'interactive',
    componentPath: '@/components/checklist-tools/checklists/EquipmentLogPanel',
    displayName: 'Equipment Log',
    icon: 'Wrench',
  },
};

/**
 * Get tool metadata for a checklist item
 */
export function getToolMetadata(item: ChecklistItem) {
  if (!item.toolId) return null;
  return TOOL_REGISTRY[item.toolId] || null;
}

/**
 * Check if an item has a tool
 */
export function hasTool(item: ChecklistItem): boolean {
  return !!item.toolId && item.toolType !== 'none';
}

/**
 * Get the icon name for a tool type
 */
export function getToolTypeIcon(toolType: ChecklistToolType): string {
  switch (toolType) {
    case 'full_wizard':
      return 'Camera';
    case 'interactive':
      return 'ListChecks';
    case 'quick_tips':
      return 'Info';
    default:
      return 'Circle';
  }
}

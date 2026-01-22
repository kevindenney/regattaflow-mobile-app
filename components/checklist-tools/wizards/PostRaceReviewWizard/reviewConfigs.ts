/**
 * Post-Race Review Wizard Configurations
 *
 * Defines the configuration for each review type including:
 * - Display properties (title, icon, color)
 * - Rating fields for data persistence
 * - Prompts to guide sailor reflection
 * - Data sources for past race trends
 */

import { ComponentType } from 'react';
import {
  Flag,
  TrendingUp,
  TrendingDown,
  CircleDot,
  Brain,
  Lightbulb,
  ThumbsUp,
  Target,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react-native';

/**
 * Review type identifiers
 */
export type PostRaceReviewType =
  | 'start'
  | 'upwind'
  | 'downwind'
  | 'marks'
  | 'decisions'
  | 'key_learning'
  | 'what_worked'
  | 'improvement'
  | 'coach_feedback';

/**
 * Prompt for guiding sailor reflection
 */
export interface ReviewPrompt {
  id: string;
  question: string;
  placeholder?: string;
  type: 'text' | 'rating' | 'select';
  options?: string[];
}

/**
 * Configuration for a single review type
 */
export interface ReviewTypeConfig {
  id: PostRaceReviewType;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  /** Field name for the rating in race_analysis table */
  ratingField?: string;
  /** Field name for notes in race_analysis table */
  notesField?: string;
  /** Prompts to guide the review */
  prompts: ReviewPrompt[];
  /** Tips shown at the bottom of the wizard */
  tips: string[];
  /** Whether this is a request-type wizard (e.g., coach feedback) */
  isRequest?: boolean;
}

/**
 * iOS System Colors for consistency
 */
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  purple: '#AF52DE',
  teal: '#5AC8FA',
  pink: '#FF2D55',
};

/**
 * Review configurations by type
 */
export const REVIEW_CONFIGS: Record<PostRaceReviewType, ReviewTypeConfig> = {
  start: {
    id: 'start',
    title: 'Start Review',
    subtitle: 'Analyze your start execution',
    icon: Flag,
    color: IOS_COLORS.green,
    ratingField: 'start_execution_rating',
    notesField: 'start_execution_notes',
    prompts: [
      {
        id: 'timing',
        question: 'Did you hit the line at full speed?',
        placeholder: 'Describe your timing and acceleration...',
        type: 'text',
      },
      {
        id: 'position',
        question: 'Were you in your planned position?',
        placeholder: 'Where did you start vs your plan...',
        type: 'text',
      },
      {
        id: 'clear_air',
        question: 'Did you get clear air after the start?',
        type: 'select',
        options: ['Yes, clean lane', 'Partially compromised', 'No, heavily gassed'],
      },
      {
        id: 'improvement',
        question: 'What would you do differently?',
        placeholder: 'One thing to change next time...',
        type: 'text',
      },
    ],
    tips: [
      'Compare your actual position to your planned position',
      'Note how competitors around you executed their starts',
      'Identify the moment that most affected your outcome',
    ],
  },

  upwind: {
    id: 'upwind',
    title: 'Upwind Review',
    subtitle: 'Analyze your windward leg performance',
    icon: TrendingUp,
    color: IOS_COLORS.blue,
    ratingField: 'upwind_execution_rating',
    notesField: 'upwind_execution_notes',
    prompts: [
      {
        id: 'side_selection',
        question: 'Did you sail the correct side of the course?',
        placeholder: 'What influenced your side selection...',
        type: 'text',
      },
      {
        id: 'shift_response',
        question: 'How well did you respond to wind shifts?',
        type: 'select',
        options: ['Excellent - caught all shifts', 'Good - caught most', 'Average - missed some', 'Poor - missed many'],
      },
      {
        id: 'boat_speed',
        question: 'How was your boat speed compared to nearby boats?',
        type: 'select',
        options: ['Faster', 'Similar', 'Slower', 'Mixed'],
      },
      {
        id: 'tacking',
        question: 'How efficient were your tacks?',
        placeholder: 'Distance lost, smoothness...',
        type: 'text',
      },
    ],
    tips: [
      'Upwind legs often determine race outcomes',
      'Assess both strategy (where you went) and execution (how fast)',
      'Note specific shifts or pressure changes you observed',
    ],
  },

  downwind: {
    id: 'downwind',
    title: 'Downwind Review',
    subtitle: 'Analyze your leeward leg performance',
    icon: TrendingDown,
    color: IOS_COLORS.teal,
    ratingField: 'downwind_execution_rating',
    notesField: 'downwind_execution_notes',
    prompts: [
      {
        id: 'vmg',
        question: 'How was your VMG and sailing angles?',
        placeholder: 'Did you sail the fastest angles...',
        type: 'text',
      },
      {
        id: 'waves',
        question: 'How effective was your wave sailing?',
        type: 'select',
        options: ['Great surfing', 'Good wave use', 'Average', 'Struggled with waves'],
      },
      {
        id: 'gybes',
        question: 'How smooth were your gybes?',
        type: 'select',
        options: ['Very smooth', 'Good', 'Some issues', 'Struggled'],
      },
      {
        id: 'pressure',
        question: 'Did you stay in the pressure?',
        placeholder: 'How well did you follow the wind...',
        type: 'text',
      },
    ],
    tips: [
      'Downwind requires different skills than upwind',
      'Balance VMG optimization with staying in pressure',
      'Smooth gybes prevent distance loss',
    ],
  },

  marks: {
    id: 'marks',
    title: 'Mark Roundings Review',
    subtitle: 'Analyze your approaches and roundings',
    icon: CircleDot,
    color: IOS_COLORS.orange,
    ratingField: 'windward_mark_execution_rating',
    notesField: 'windward_mark_execution_notes',
    prompts: [
      {
        id: 'laylines',
        question: 'Were your layline approaches accurate?',
        type: 'select',
        options: ['Spot on', 'Slightly over/under', 'Significantly off', 'Very poor'],
      },
      {
        id: 'arc',
        question: 'How tight were your rounding arcs?',
        placeholder: 'Distance lost at marks...',
        type: 'text',
      },
      {
        id: 'crew_work',
        question: 'How was the crew coordination during roundings?',
        type: 'select',
        options: ['Excellent', 'Good', 'Some fumbles', 'Struggled'],
      },
      {
        id: 'tactical',
        question: 'Did you gain or lose positions at marks?',
        placeholder: 'Describe any tactical situations...',
        type: 'text',
      },
    ],
    tips: [
      'Mark roundings are high-pressure moments',
      'Layline accuracy comes from practice and current awareness',
      'A tight rounding can gain multiple boat lengths',
    ],
  },

  decisions: {
    id: 'decisions',
    title: 'Key Decisions Review',
    subtitle: 'Analyze your tactical choices',
    icon: Brain,
    color: IOS_COLORS.purple,
    ratingField: 'rig_tuning_execution_rating', // Using as general tactical rating
    notesField: 'rig_tuning_execution_notes',
    prompts: [
      {
        id: 'best_decision',
        question: 'What was your best decision?',
        placeholder: 'Describe a moment where good judgment paid off...',
        type: 'text',
      },
      {
        id: 'worst_decision',
        question: 'What decision would you change?',
        placeholder: 'What would you do differently...',
        type: 'text',
      },
      {
        id: 'information',
        question: 'What information would have helped?',
        placeholder: 'What did you not know that affected you...',
        type: 'text',
      },
      {
        id: 'pattern',
        question: 'Did you notice any decision patterns?',
        placeholder: 'Tendencies in your choices...',
        type: 'text',
      },
    ],
    tips: [
      'Good sailors make better decisions, not faster ones',
      'Distinguish between outcome and decision quality',
      'Pattern recognition improves with deliberate review',
    ],
  },

  key_learning: {
    id: 'key_learning',
    title: 'Key Learning',
    subtitle: 'Capture the most important lesson',
    icon: Lightbulb,
    color: IOS_COLORS.orange,
    notesField: 'key_learnings',
    prompts: [
      {
        id: 'main_lesson',
        question: 'What was the single most important lesson from this race?',
        placeholder: 'If you could only remember one thing...',
        type: 'text',
      },
      {
        id: 'why_important',
        question: 'Why is this lesson significant?',
        placeholder: 'How will it help in future races...',
        type: 'text',
      },
      {
        id: 'apply_when',
        question: 'When should you apply this learning?',
        placeholder: 'In what conditions or situations...',
        type: 'text',
      },
    ],
    tips: [
      'Focus on one primary learning to avoid dilution',
      'Make it specific and actionable',
      'Write it down while the memory is fresh',
    ],
  },

  what_worked: {
    id: 'what_worked',
    title: 'What Worked Well',
    subtitle: 'Recognize your successes',
    icon: ThumbsUp,
    color: IOS_COLORS.green,
    prompts: [
      {
        id: 'success_1',
        question: 'What went particularly well?',
        placeholder: 'Describe a moment of success...',
        type: 'text',
      },
      {
        id: 'success_2',
        question: 'What contributed to that success?',
        placeholder: 'Preparation, execution, conditions...',
        type: 'text',
      },
      {
        id: 'repeat',
        question: 'What will you definitely do again?',
        placeholder: 'Habits or tactics to repeat...',
        type: 'text',
      },
    ],
    tips: [
      'Positive patterns are your competitive advantages',
      'Understanding why something worked helps you repeat it',
      'Confidence comes from recognizing your strengths',
    ],
  },

  improvement: {
    id: 'improvement',
    title: 'Improvement Plan',
    subtitle: 'Set specific development goals',
    icon: Target,
    color: IOS_COLORS.pink,
    notesField: 'finish_execution_notes', // Using for improvement notes
    prompts: [
      {
        id: 'focus_area',
        question: 'What is your top improvement area?',
        type: 'select',
        options: ['Starts', 'Upwind speed', 'Downwind speed', 'Mark roundings', 'Tactics', 'Boat handling', 'Crew work'],
      },
      {
        id: 'specific_skill',
        question: 'What specific skill will you practice?',
        placeholder: 'Be as specific as possible...',
        type: 'text',
      },
      {
        id: 'practice_plan',
        question: 'How will you practice this?',
        placeholder: 'What drills or exercises...',
        type: 'text',
      },
      {
        id: 'measure_progress',
        question: 'How will you measure progress?',
        placeholder: 'What will indicate improvement...',
        type: 'text',
      },
    ],
    tips: [
      'Improvement requires deliberate practice of specific skills',
      'Vague goals lead to vague improvement',
      'Schedule time for the practice you identify',
    ],
  },

  coach_feedback: {
    id: 'coach_feedback',
    title: 'Request Coach Feedback',
    subtitle: 'Get an external perspective',
    icon: MessageCircle,
    color: IOS_COLORS.blue,
    isRequest: true,
    prompts: [
      {
        id: 'specific_question',
        question: 'What specific questions do you have for your coach?',
        placeholder: 'Be specific about what you want feedback on...',
        type: 'text',
      },
      {
        id: 'area_of_concern',
        question: 'What area are you most uncertain about?',
        type: 'select',
        options: ['My perception vs reality', 'Technical execution', 'Tactical choices', 'Boat speed', 'Overall approach'],
      },
      {
        id: 'video_available',
        question: 'Do you have video for them to review?',
        type: 'select',
        options: ['Yes, from chase boat', 'Yes, onboard', 'No video available'],
      },
    ],
    tips: [
      'Specific questions get specific answers',
      'Be open to feedback that contradicts your perception',
      'Video review is invaluable for objective feedback',
    ],
  },
};

/**
 * Get review config by type
 */
export function getReviewConfig(type: PostRaceReviewType): ReviewTypeConfig {
  return REVIEW_CONFIGS[type];
}

/**
 * Get all review types for a category
 */
export function getPerformanceReviewTypes(): PostRaceReviewType[] {
  return ['start', 'upwind', 'downwind', 'marks', 'decisions'];
}

export function getLearningReviewTypes(): PostRaceReviewType[] {
  return ['key_learning', 'what_worked', 'improvement', 'coach_feedback'];
}

/**
 * Map checklist item toolId to review type
 */
export const TOOL_ID_TO_REVIEW_TYPE: Record<string, PostRaceReviewType> = {
  'review_start_quality': 'start',
  'review_upwind_performance': 'upwind',
  'review_downwind_performance': 'downwind',
  'review_mark_roundings': 'marks',
  'review_tactical_decisions': 'decisions',
  'identify_key_learning': 'key_learning',
  'note_what_worked': 'what_worked',
  'plan_improvement_areas': 'improvement',
  'request_coach_feedback': 'coach_feedback',
};

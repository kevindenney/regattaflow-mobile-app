/**
 * Debrief Questions Configuration
 *
 * Defines the guided post-race interview phases and questions.
 * Each phase has multiple questions covering different aspects of racing.
 *
 * All questions are optional/skippable per user preference.
 * NO star ratings - use select options or freeform text only.
 *
 * Conditional follow-ups: Some questions appear only when a previous
 * answer indicates there's more detail to capture.
 */

export type DebriefQuestionType =
  | 'select'        // Single choice
  | 'multi-select'  // Multiple choice
  | 'boolean'       // Yes/No toggle
  | 'number'        // Numeric input
  | 'textarea'      // Free text (multi-line)
  | 'text';         // Single line text

export interface DebriefQuestionOption {
  value: string;
  label: string;
  hint?: string;
}

/**
 * Condition for showing a follow-up question
 */
export interface ShowWhenCondition {
  questionId: string;
  // Show when the answer equals one of these values
  // For boolean: use 'true' or 'false' as strings
  answerIn: string[];
}

export interface DebriefQuestion {
  id: string;
  type: DebriefQuestionType;
  label: string;
  hint?: string;
  options?: DebriefQuestionOption[];
  placeholder?: string;
  min?: number;  // For number type
  max?: number;  // For number type
  // If set, this question only shows when the condition is met
  showWhen?: ShowWhenCondition;
}

export interface DebriefPhase {
  id: string;
  title: string;
  emoji: string;
  description?: string;
  questions: DebriefQuestion[];
}

/**
 * Complete interview structure covering all race phases
 * Focus on quick taps (select/boolean) and meaningful text input
 * Follow-up questions ask for specifics when answers indicate issues
 */
export const DEBRIEF_PHASES: DebriefPhase[] = [
  {
    id: 'prep',
    title: 'Preparation',
    emoji: '⚙️',
    description: 'How was your race prep?',
    questions: [
      {
        id: 'prep_equipment',
        type: 'select',
        label: 'How was your equipment setup?',
        options: [
          { value: 'dialed', label: 'Dialed in perfectly' },
          { value: 'good', label: 'Good, minor tweaks needed' },
          { value: 'ok', label: 'OK, some issues' },
          { value: 'problems', label: 'Had problems' },
        ],
      },
      // Follow-up: What equipment problems?
      {
        id: 'prep_equipment_details',
        type: 'textarea',
        label: 'What equipment problems did you have?',
        placeholder: 'Describe the issues (rigging, foils, lines, etc.)...',
        showWhen: { questionId: 'prep_equipment', answerIn: ['ok', 'problems'] },
      },
      {
        id: 'prep_sail_choice',
        type: 'boolean',
        label: 'Did you have the right sail up?',
        hint: 'Based on the actual conditions',
      },
      // Follow-up: Wrong sail - what did you have vs what you should have had?
      {
        id: 'prep_sail_wrong',
        type: 'text',
        label: 'What sail did you have?',
        placeholder: 'e.g., #1 genoa, full main...',
        showWhen: { questionId: 'prep_sail_choice', answerIn: ['false'] },
      },
      {
        id: 'prep_sail_shouldve',
        type: 'text',
        label: 'What sail should you have had?',
        placeholder: 'e.g., #2 jib, reefed main...',
        showWhen: { questionId: 'prep_sail_choice', answerIn: ['false'] },
      },
    ],
  },
  {
    id: 'prestart',
    title: 'Pre-Start',
    emoji: '🎯',
    description: 'Setting up for the start',
    questions: [
      {
        id: 'prestart_routine',
        type: 'select',
        label: 'How was your pre-start routine?',
        hint: 'Line sight, time management, boat handling',
        options: [
          { value: 'excellent', label: 'Excellent - felt in control' },
          { value: 'good', label: 'Good - minor issues' },
          { value: 'rushed', label: 'Felt rushed' },
          { value: 'chaotic', label: 'Chaotic - need to improve' },
        ],
      },
      // Follow-up: What went wrong in pre-start?
      {
        id: 'prestart_issues',
        type: 'textarea',
        label: 'What went wrong in your pre-start?',
        placeholder: 'Time management, positioning, other boats...',
        showWhen: { questionId: 'prestart_routine', answerIn: ['rushed', 'chaotic'] },
      },
      {
        id: 'prestart_line_sight',
        type: 'boolean',
        label: 'Did you get a good line sight?',
      },
      // Follow-up: Why not?
      {
        id: 'prestart_line_sight_issue',
        type: 'text',
        label: 'Why couldn\'t you get a line sight?',
        placeholder: 'Ran out of time, traffic, couldn\'t find transit...',
        showWhen: { questionId: 'prestart_line_sight', answerIn: ['false'] },
      },
      {
        id: 'prestart_favored_end',
        type: 'select',
        label: 'Which end was favored?',
        options: [
          { value: 'pin', label: 'Pin end' },
          { value: 'square', label: 'Square/neutral' },
          { value: 'boat', label: 'Boat end' },
          { value: 'unknown', label: 'Couldn\'t tell' },
        ],
      },
    ],
  },
  {
    id: 'start',
    title: 'Start',
    emoji: '🚀',
    description: 'Start execution',
    questions: [
      {
        id: 'start_position',
        type: 'select',
        label: 'Where did you start?',
        options: [
          { value: 'pin', label: 'Pin end' },
          { value: 'pin_third', label: 'Pin third' },
          { value: 'middle', label: 'Middle' },
          { value: 'boat_third', label: 'Boat third' },
          { value: 'boat', label: 'Boat end' },
        ],
      },
      {
        id: 'start_execution',
        type: 'select',
        label: 'How was your start execution?',
        options: [
          { value: 'nailed', label: 'Nailed it - full speed, great position' },
          { value: 'good', label: 'Good - close to plan' },
          { value: 'ok', label: 'OK - room for improvement' },
          { value: 'poor', label: 'Poor - got squeezed or late' },
          { value: 'ocs', label: 'OCS' },
        ],
      },
      // Follow-up: What went wrong at the start?
      {
        id: 'start_problem',
        type: 'textarea',
        label: 'What happened?',
        placeholder: 'Got squeezed, late acceleration, bad timing...',
        showWhen: { questionId: 'start_execution', answerIn: ['poor', 'ocs'] },
      },
      {
        id: 'start_clear_air',
        type: 'boolean',
        label: 'Did you have clear air off the line?',
      },
      // Follow-up: No clear air - what happened?
      {
        id: 'start_dirty_air',
        type: 'text',
        label: 'How did you get into bad air?',
        placeholder: 'Boat to leeward, started too low in the row...',
        showWhen: { questionId: 'start_clear_air', answerIn: ['false'] },
      },
    ],
  },
  {
    id: 'upwind',
    title: 'Upwind',
    emoji: '⛵',
    description: 'Beating to windward',
    questions: [
      {
        id: 'upwind_mode',
        type: 'select',
        label: 'What mode did you sail upwind?',
        options: [
          { value: 'high_slow', label: 'High and slow (pointing)' },
          { value: 'target', label: 'Target speed/angle' },
          { value: 'low_fast', label: 'Low and fast (footing)' },
          { value: 'mixed', label: 'Mixed based on conditions' },
        ],
      },
      {
        id: 'upwind_tack_count',
        type: 'number',
        label: 'Approximately how many tacks?',
        min: 0,
        max: 50,
      },
      {
        id: 'upwind_shifts',
        type: 'select',
        label: 'How well did you play the shifts?',
        options: [
          { value: 'great', label: 'Great - consistently on the right side' },
          { value: 'ok', label: 'OK - got some, missed some' },
          { value: 'poor', label: 'Poor - felt out of phase' },
          { value: 'no_shifts', label: 'Not much shifting' },
        ],
      },
      // Follow-up: Out of phase - what did you miss?
      {
        id: 'upwind_shift_miss',
        type: 'textarea',
        label: 'What shifts did you miss?',
        placeholder: 'Missed the left shift, tacked too early on the header...',
        showWhen: { questionId: 'upwind_shifts', answerIn: ['poor'] },
      },
      {
        id: 'upwind_notes',
        type: 'textarea',
        label: 'Key moments upwind?',
        placeholder: 'Tactical decisions, passing lanes, mistakes...',
      },
    ],
  },
  {
    id: 'marks',
    title: 'Marks',
    emoji: '🔶',
    description: 'Mark roundings',
    questions: [
      {
        id: 'marks_windward_approach',
        type: 'select',
        label: 'Windward mark approach?',
        options: [
          { value: 'starboard_layline', label: 'Starboard layline' },
          { value: 'port_tack_in', label: 'Port tack in' },
          { value: 'overstanding', label: 'Overstanding' },
          { value: 'underlay', label: 'Underlay (had to tack)' },
        ],
      },
      // Follow-up: Why did you overstand/underlay?
      {
        id: 'marks_layline_issue',
        type: 'text',
        label: 'What caused the bad layline?',
        placeholder: 'Current, shift, traffic, misjudged...',
        showWhen: { questionId: 'marks_windward_approach', answerIn: ['overstanding', 'underlay'] },
      },
      {
        id: 'marks_rounding_quality',
        type: 'select',
        label: 'How were your mark roundings?',
        options: [
          { value: 'clean', label: 'Clean - gained or held position' },
          { value: 'ok', label: 'OK - no major issues' },
          { value: 'wide', label: 'Too wide - lost distance' },
          { value: 'tight', label: 'Too tight - slowed down' },
          { value: 'traffic', label: 'Got caught in traffic' },
        ],
      },
      // Follow-up: What happened at the marks?
      {
        id: 'marks_rounding_issue',
        type: 'textarea',
        label: 'What went wrong at the marks?',
        placeholder: 'Describe the rounding issues...',
        showWhen: { questionId: 'marks_rounding_quality', answerIn: ['wide', 'tight', 'traffic'] },
      },
    ],
  },
  {
    id: 'downwind',
    title: 'Downwind',
    emoji: '🌊',
    description: 'Running downwind',
    questions: [
      {
        id: 'downwind_mode',
        type: 'select',
        label: 'What angles did you sail?',
        options: [
          { value: 'vmg', label: 'VMG (optimal angles)' },
          { value: 'hot', label: 'Hot/high (fast, less deep)' },
          { value: 'deep', label: 'Deep/low (slower, more direct)' },
          { value: 'mixed', label: 'Mixed based on pressure' },
        ],
      },
      {
        id: 'downwind_jibe_count',
        type: 'number',
        label: 'Approximately how many jibes?',
        min: 0,
        max: 30,
      },
      {
        id: 'downwind_pressure',
        type: 'boolean',
        label: 'Did you connect the pressure well?',
        hint: 'Sailing to more wind',
      },
      // Follow-up: Missed pressure - what happened?
      {
        id: 'downwind_pressure_miss',
        type: 'text',
        label: 'What pressure did you miss?',
        placeholder: 'Missed the puff on the left, jibed too late...',
        showWhen: { questionId: 'downwind_pressure', answerIn: ['false'] },
      },
      {
        id: 'downwind_notes',
        type: 'textarea',
        label: 'Key moments downwind?',
        placeholder: 'Wave riding, passing moves, angles...',
      },
    ],
  },
  {
    id: 'rules',
    title: 'Rules',
    emoji: '📋',
    description: 'Rules and protests',
    questions: [
      {
        id: 'rules_situations',
        type: 'boolean',
        label: 'Any rule situations?',
        hint: 'Close calls, incidents, protests',
      },
      // Follow-up: Describe the incident
      {
        id: 'rules_incident_description',
        type: 'textarea',
        label: 'What happened?',
        placeholder: 'Describe the incident - boats involved, situation...',
        showWhen: { questionId: 'rules_situations', answerIn: ['true'] },
      },
      {
        id: 'rules_penalty_taken',
        type: 'boolean',
        label: 'Did you take a penalty?',
        showWhen: { questionId: 'rules_situations', answerIn: ['true'] },
      },
      // Follow-up: What penalty and why?
      {
        id: 'rules_penalty_details',
        type: 'text',
        label: 'What penalty and for what?',
        placeholder: 'e.g., 720 for port/starboard at mark...',
        showWhen: { questionId: 'rules_penalty_taken', answerIn: ['true'] },
      },
      {
        id: 'rules_protest_filed',
        type: 'boolean',
        label: 'Any protest filed (by you or against you)?',
        showWhen: { questionId: 'rules_situations', answerIn: ['true'] },
      },
    ],
  },
  {
    id: 'finish',
    title: 'Finish',
    emoji: '🏁',
    description: 'Final stretch and overall',
    questions: [
      {
        id: 'finish_approach',
        type: 'select',
        label: 'Finish approach?',
        options: [
          { value: 'favored_end', label: 'Sailed to favored end' },
          { value: 'safe', label: 'Safe/conservative' },
          { value: 'aggressive', label: 'Aggressive - took a risk' },
          { value: 'no_plan', label: 'No real plan' },
        ],
      },
      // Follow-up: No plan - what would you do differently?
      {
        id: 'finish_no_plan_learn',
        type: 'text',
        label: 'What would you do differently?',
        placeholder: 'Should have looked for favored end, watched competitors...',
        showWhen: { questionId: 'finish_approach', answerIn: ['no_plan'] },
      },
      {
        id: 'finish_overall',
        type: 'select',
        label: 'Overall, how do you feel about this race?',
        options: [
          { value: 'great', label: 'Great - executed my plan' },
          { value: 'good', label: 'Good - solid performance' },
          { value: 'mixed', label: 'Mixed - some good, some bad' },
          { value: 'frustrating', label: 'Frustrating - things didn\'t go well' },
          { value: 'learning', label: 'Learning experience' },
        ],
      },
      // Follow-up: Frustrating - what was the biggest issue?
      {
        id: 'finish_frustration',
        type: 'textarea',
        label: 'What was most frustrating?',
        placeholder: 'The main thing that went wrong...',
        showWhen: { questionId: 'finish_overall', answerIn: ['frustrating'] },
      },
      {
        id: 'finish_key_learning',
        type: 'textarea',
        label: 'Key learning from this race?',
        placeholder: 'One thing to remember...',
      },
      {
        id: 'finish_work_on',
        type: 'textarea',
        label: 'What to work on next?',
        placeholder: 'Focus area for next race...',
      },
    ],
  },
];

/**
 * Get total question count across all phases (static count, not filtered)
 */
export function getTotalQuestionCount(): number {
  return DEBRIEF_PHASES.reduce((sum, phase) => sum + phase.questions.length, 0);
}

/**
 * Get phase by ID
 */
export function getPhaseById(phaseId: string): DebriefPhase | undefined {
  return DEBRIEF_PHASES.find((p) => p.id === phaseId);
}

/**
 * Flatten all questions with phase context
 */
export interface FlatQuestion extends DebriefQuestion {
  phaseId: string;
  phaseTitle: string;
  phaseEmoji: string;
  phaseIndex: number;
  questionIndex: number;
  globalIndex: number;
}

export function getFlatQuestions(): FlatQuestion[] {
  const flat: FlatQuestion[] = [];
  let globalIndex = 0;

  DEBRIEF_PHASES.forEach((phase, phaseIndex) => {
    phase.questions.forEach((question, questionIndex) => {
      flat.push({
        ...question,
        phaseId: phase.id,
        phaseTitle: phase.title,
        phaseEmoji: phase.emoji,
        phaseIndex,
        questionIndex,
        globalIndex,
      });
      globalIndex++;
    });
  });

  return flat;
}

/**
 * Check if a question should be shown based on current responses
 */
export function shouldShowQuestion(
  question: DebriefQuestion,
  responses: Record<string, unknown>
): boolean {
  if (!question.showWhen) {
    return true; // No condition, always show
  }

  const { questionId, answerIn } = question.showWhen;
  const answer = responses[questionId];

  if (answer === null || answer === undefined) {
    return false; // Dependent question not answered yet
  }

  // Convert to string for comparison (handles booleans)
  const answerStr = String(answer);
  return answerIn.includes(answerStr);
}

/**
 * Get filtered questions based on current responses
 */
export function getActiveQuestions(
  responses: Record<string, unknown>
): FlatQuestion[] {
  return getFlatQuestions().filter((q) => shouldShowQuestion(q, responses));
}

import React from 'react';
import { View, Text, Pressable, TextInput, StyleSheet, Platform } from 'react-native';
import * as LucideIcons from 'lucide-react-native';

// =============================================================================
// CONSTANTS
// =============================================================================

const C = {
  blue: '#007AFF',
  orange: '#FF9500',
  green: '#34C759',
  red: '#FF3B30',
  purple: '#5856D6',
  pink: '#FF2D55',
  indigo: '#5856D6',
  teal: '#5AC8FA',
  label: '#000000',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
};

// =============================================================================
// TYPES
// =============================================================================

interface ToolProps {
  values: Record<string, string>;
  onChange: (stepId: string, text: string) => void;
  accent: string;
}

interface StepDefinition {
  id: string;
  label: string;
  icon: any;
  color: string;
  prompt: string;
  hint: string;
}

interface AccordionStepToolProps {
  title: string;
  headerIcon: React.ReactNode;
  steps: readonly StepDefinition[] | StepDefinition[];
  values: Record<string, string>;
  onChange: (stepId: string, text: string) => void;
  accent: string;
}

// =============================================================================
// SHARED ACCORDION STEP TOOL
// =============================================================================

function AccordionStepTool({
  title,
  headerIcon,
  steps,
  values,
  onChange,
  accent,
}: AccordionStepToolProps) {
  const [expandedStep, setExpandedStep] = React.useState<string | null>(
    steps.length > 0 ? steps[0].id : null
  );
  const completedCount = steps.filter(
    (step) => (values[step.id] || '').trim().length > 0
  ).length;

  return (
    <View style={toolStyles.container}>
      <View style={toolStyles.header}>
        {headerIcon}
        <Text style={[toolStyles.sectionTitle, { color: accent }]}>{title}</Text>
      </View>

      {/* Progress indicator */}
      <View style={toolStyles.progressRow}>
        <View style={toolStyles.progressBar}>
          <View
            style={[
              toolStyles.progressFill,
              {
                width: `${(completedCount / steps.length) * 100}%`,
                backgroundColor: accent,
              },
            ]}
          />
        </View>
        <Text style={toolStyles.progressLabel}>
          {completedCount}/{steps.length}
        </Text>
      </View>

      {/* Steps */}
      {steps.map((step, index) => {
        const isExpanded = expandedStep === step.id;
        const hasContent = (values[step.id] || '').trim().length > 0;
        const Icon = step.icon;

        return (
          <View
            key={step.id}
            style={[
              toolStyles.stepCard,
              isExpanded && toolStyles.stepCardExpanded,
              hasContent && !isExpanded && toolStyles.stepCardComplete,
            ]}
          >
            {/* Step header — only this part toggles expand/collapse */}
            <Pressable onPress={() => setExpandedStep(isExpanded ? null : step.id)}>
              <View style={toolStyles.stepHeader}>
                <View
                  style={[
                    toolStyles.stepNumber,
                    { backgroundColor: hasContent ? step.color : C.gray5 },
                  ]}
                >
                  {hasContent ? (
                    <LucideIcons.Check size={12} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <Text
                      style={[
                        toolStyles.stepNumberText,
                        { color: hasContent ? '#FFF' : C.gray },
                      ]}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      toolStyles.stepLabel,
                      hasContent && { color: step.color },
                    ]}
                  >
                    {step.label}
                  </Text>
                  {!isExpanded && hasContent && (
                    <Text style={toolStyles.stepPreview} numberOfLines={1}>
                      {values[step.id]}
                    </Text>
                  )}
                </View>
                <Icon size={16} color={isExpanded ? step.color : C.gray3} />
              </View>
            </Pressable>

            {/* Expanded content — outside the Pressable so TextInput clicks don't collapse */}
            {isExpanded && (
              <View style={toolStyles.stepBody}>
                <Text style={[toolStyles.stepHint, { color: step.color }]}>
                  {step.hint}
                </Text>
                <TextInput
                  style={[
                    toolStyles.stepInput,
                    { borderColor: `${step.color}40` },
                  ]}
                  placeholder={step.prompt}
                  placeholderTextColor={C.gray}
                  value={values[step.id] || ''}
                  onChangeText={(text) => onChange(step.id, text)}
                  multiline
                  textAlignVertical="top"
                  scrollEnabled={false}
                />
                {index < steps.length - 1 && (
                  <Pressable
                    style={[
                      toolStyles.nextButton,
                      { backgroundColor: step.color },
                    ]}
                    onPress={() => setExpandedStep(steps[index + 1].id)}
                  >
                    <Text style={toolStyles.nextButtonText}>
                      Next: {steps[index + 1].label}
                    </Text>
                    <LucideIcons.ChevronRight size={16} color="#FFF" />
                  </Pressable>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

// =============================================================================
// STEP DEFINITIONS
// =============================================================================

const WORKOUT_PLAN_STEPS: StepDefinition[] = [
  {
    id: 'exercise_selection',
    label: 'Exercise Selection',
    icon: LucideIcons.Dumbbell,
    color: C.blue,
    prompt:
      'Which exercises are you performing today? List primary and accessory movements',
    hint: 'Choose compound movements first, then isolation work to match your goals.',
  },
  {
    id: 'sets_reps',
    label: 'Sets & Reps',
    icon: LucideIcons.Repeat,
    color: C.green,
    prompt:
      'Sets, reps, and weight targets for each exercise',
    hint: 'Strength: 3-5 reps heavy. Hypertrophy: 8-12 reps moderate. Endurance: 15+ reps light.',
  },
  {
    id: 'rest_periods',
    label: 'Rest Periods',
    icon: LucideIcons.Timer,
    color: C.orange,
    prompt:
      'Rest intervals between sets and exercises',
    hint: 'Heavy compound lifts: 2-5 min. Hypertrophy: 60-90 sec. Circuits: 30 sec or less.',
  },
  {
    id: 'progression_notes',
    label: 'Progression Notes',
    icon: LucideIcons.TrendingUp,
    color: C.purple,
    prompt:
      'How are you progressing from last session? Any weight or rep increases?',
    hint: 'Track progressive overload — even small jumps add up over weeks.',
  },
];

const WARMUP_STEPS: StepDefinition[] = [
  {
    id: 'mobility_work',
    label: 'Mobility Work',
    icon: LucideIcons.StretchHorizontal,
    color: C.teal,
    prompt:
      'Dynamic stretches and mobility drills for today\'s target muscles',
    hint: 'Spend 5-10 minutes on joints and muscle groups you\'ll load today.',
  },
  {
    id: 'activation_exercises',
    label: 'Activation Exercises',
    icon: LucideIcons.Zap,
    color: C.orange,
    prompt:
      'Activation drills to fire up target muscle groups',
    hint: 'Band work, glute bridges, scapular retractions — wake up the muscles before loading.',
  },
  {
    id: 'warmup_sets',
    label: 'Warm-Up Sets',
    icon: LucideIcons.BarChart3,
    color: C.blue,
    prompt:
      'Ramping sets to build up to working weight',
    hint: 'Start at 50% of working weight and add 10-15% each set until ready.',
  },
  {
    id: 'mental_readiness',
    label: 'Mental Readiness',
    icon: LucideIcons.Brain,
    color: C.purple,
    prompt:
      'How is your focus and motivation? Any mental cues for today?',
    hint: 'Visualize your top sets. Set an intention — quality reps over ego lifts.',
  },
];

const NUTRITION_STEPS: StepDefinition[] = [
  {
    id: 'pre_workout_meal',
    label: 'Pre-Workout Meal',
    icon: LucideIcons.UtensilsCrossed,
    color: C.green,
    prompt:
      'What did you eat before training? Timing and macros',
    hint: 'Aim for carbs + protein 1-2 hours before. Avoid heavy fats close to training.',
  },
  {
    id: 'hydration_check',
    label: 'Hydration Check',
    icon: LucideIcons.Droplets,
    color: C.blue,
    prompt:
      'How much water have you had today? Electrolyte status?',
    hint: 'Aim for at least 500ml before training. Add electrolytes if sweating heavily.',
  },
  {
    id: 'supplements',
    label: 'Supplements',
    icon: LucideIcons.Pill,
    color: C.orange,
    prompt:
      'Any pre-workout supplements? Creatine, caffeine, etc.',
    hint: 'Keep it simple. Caffeine 30 min before, creatine daily — timing is flexible.',
  },
  {
    id: 'post_workout_plan',
    label: 'Post-Workout Plan',
    icon: LucideIcons.CookingPot,
    color: C.purple,
    prompt:
      'What\'s your post-workout nutrition plan? Recovery meal or shake?',
    hint: 'Protein + carbs within 1-2 hours post-training supports recovery.',
  },
];

const BODY_STATUS_STEPS: StepDefinition[] = [
  {
    id: 'energy_level',
    label: 'Energy Level',
    icon: LucideIcons.BatteryMedium,
    color: C.green,
    prompt:
      'Rate your energy from 1-10. How do you feel going into this session?',
    hint: 'Low energy? Consider adjusting volume. High energy? Push for PRs.',
  },
  {
    id: 'soreness_check',
    label: 'Soreness Check',
    icon: LucideIcons.AlertTriangle,
    color: C.orange,
    prompt:
      'Any muscle soreness or tightness? Which areas?',
    hint: 'Mild DOMS is fine to train through. Sharp or joint pain means back off.',
  },
  {
    id: 'sleep_quality',
    label: 'Sleep Quality',
    icon: LucideIcons.Moon,
    color: C.blue,
    prompt:
      'How many hours did you sleep? Rate the quality',
    hint: 'Under 6 hours? Reduce intensity by 10-15% and focus on form.',
  },
  {
    id: 'injury_status',
    label: 'Injury Status',
    icon: LucideIcons.ShieldAlert,
    color: C.red,
    prompt:
      'Any active injuries or areas to protect? Movement restrictions?',
    hint: 'Train around injuries, not through them. Note modifications needed.',
  },
];

// =============================================================================
// TOOL COMPONENTS
// =============================================================================

export function WorkoutPlanTool({ values, onChange, accent }: ToolProps) {
  return (
    <AccordionStepTool
      title="Workout Plan"
      headerIcon={<LucideIcons.Dumbbell size={15} color={accent} />}
      steps={WORKOUT_PLAN_STEPS}
      values={values}
      onChange={onChange}
      accent={accent}
    />
  );
}

export function WarmupTool({ values, onChange, accent }: ToolProps) {
  return (
    <AccordionStepTool
      title="Warm-Up"
      headerIcon={<LucideIcons.Flame size={15} color={accent} />}
      steps={WARMUP_STEPS}
      values={values}
      onChange={onChange}
      accent={accent}
    />
  );
}

export function NutritionTool({ values, onChange, accent }: ToolProps) {
  return (
    <AccordionStepTool
      title="Nutrition"
      headerIcon={<LucideIcons.Apple size={15} color={accent} />}
      steps={NUTRITION_STEPS}
      values={values}
      onChange={onChange}
      accent={accent}
    />
  );
}

export function BodyStatusTool({ values, onChange, accent }: ToolProps) {
  return (
    <AccordionStepTool
      title="Body Status"
      headerIcon={<LucideIcons.HeartPulse size={15} color={accent} />}
      steps={BODY_STATUS_STEPS}
      values={values}
      onChange={onChange}
      accent={accent}
    />
  );
}

// =============================================================================
// STYLES
// =============================================================================

const toolStyles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: C.gray5,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.gray,
    minWidth: 24,
    textAlign: 'right',
  },
  stepCard: {
    backgroundColor: C.gray6,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.gray5,
  },
  stepCardExpanded: {
    backgroundColor: '#FFFFFF',
    borderColor: C.gray3,
  },
  stepCardComplete: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: C.label,
  },
  stepPreview: {
    fontSize: 13,
    color: C.gray,
    marginTop: 2,
  },
  stepBody: {
    marginTop: 12,
    gap: 8,
  },
  stepHint: {
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  stepInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    lineHeight: 22,
    color: C.label,
    minHeight: 80,
    borderWidth: 1,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  nextButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  connector: {
    alignItems: 'center',
    paddingVertical: 2,
  },
});

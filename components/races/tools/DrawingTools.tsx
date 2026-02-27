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

const REFERENCE_IMAGES_STEPS: StepDefinition[] = [
  {
    id: 'subject_analysis',
    label: 'Subject Analysis',
    icon: LucideIcons.Eye,
    color: C.blue,
    prompt:
      'Describe your subject — what are the key shapes, proportions, and focal points?',
    hint: 'Look before you draw. Break complex subjects into simple geometric forms.',
  },
  {
    id: 'composition_planning',
    label: 'Composition Planning',
    icon: LucideIcons.Layout,
    color: C.orange,
    prompt:
      'How will you arrange elements on the page? Where is the focal point?',
    hint: 'Consider rule of thirds, leading lines, and negative space.',
  },
  {
    id: 'value_mapping',
    label: 'Value Mapping',
    icon: LucideIcons.Contrast,
    color: C.purple,
    prompt:
      'Identify the lightest lights and darkest darks. Where are the mid-tones?',
    hint: 'Squint at your reference to simplify values into 3-5 groups.',
  },
  {
    id: 'color_notes',
    label: 'Color Notes',
    icon: LucideIcons.Palette,
    color: C.green,
    prompt:
      'Note dominant colors, temperature shifts, and any surprising hues you observe',
    hint: 'What colors do you actually see vs. what you expect to see?',
  },
];

const TECHNIQUE_FOCUS_STEPS: StepDefinition[] = [
  {
    id: 'skill_target',
    label: 'Skill Target',
    icon: LucideIcons.Crosshair,
    color: C.blue,
    prompt:
      'What specific technique or skill are you practicing today?',
    hint: 'Pick one or two things to focus on — edges, hatching, blending, gesture, etc.',
  },
  {
    id: 'warmup_plan',
    label: 'Warm-Up Plan',
    icon: LucideIcons.Flame,
    color: C.orange,
    prompt:
      'What warm-up exercises will you do before starting? Quick gestures, line drills?',
    hint: 'Five minutes of warm-up saves thirty minutes of frustration.',
  },
  {
    id: 'technique_notes',
    label: 'Technique Notes',
    icon: LucideIcons.PenTool,
    color: C.purple,
    prompt:
      'Key reminders for executing this technique — grip, pressure, speed, angle',
    hint: 'Write down what you know works so you can stay intentional.',
  },
  {
    id: 'common_pitfalls',
    label: 'Common Pitfalls',
    icon: LucideIcons.AlertTriangle,
    color: C.red,
    prompt:
      'What mistakes do you tend to make with this technique? How will you avoid them?',
    hint: 'Knowing your habits is the first step to breaking them.',
  },
];

const COLOR_STUDY_STEPS: StepDefinition[] = [
  {
    id: 'palette_selection',
    label: 'Palette Selection',
    icon: LucideIcons.Palette,
    color: C.blue,
    prompt:
      'Which colors will you use? List your limited palette or chosen color set',
    hint: 'A limited palette creates harmony. Start with fewer colors, not more.',
  },
  {
    id: 'color_relationships',
    label: 'Color Relationships',
    icon: LucideIcons.GitMerge,
    color: C.purple,
    prompt:
      'What color scheme are you working with — complementary, analogous, triadic?',
    hint: 'Identify the dominant, secondary, and accent color roles.',
  },
  {
    id: 'temperature_notes',
    label: 'Temperature Notes',
    icon: LucideIcons.Thermometer,
    color: C.orange,
    prompt:
      'Where are the warm and cool shifts in your subject? How will you handle transitions?',
    hint: 'Warm light = cool shadows. Cool light = warm shadows. Use this to add depth.',
  },
  {
    id: 'mixing_plan',
    label: 'Mixing Plan',
    icon: LucideIcons.Blend,
    color: C.green,
    prompt:
      'Plan your color mixtures — which colors combine for key areas of the piece?',
    hint: 'Pre-mix your most-used values to keep your painting session fluid.',
  },
];

const MATERIALS_STEPS: StepDefinition[] = [
  {
    id: 'medium_selection',
    label: 'Medium Selection',
    icon: LucideIcons.Brush,
    color: C.blue,
    prompt:
      'What medium are you working in? Graphite, charcoal, ink, watercolor, oils, digital?',
    hint: 'Each medium has strengths — choose one that serves your goals today.',
  },
  {
    id: 'surface_prep',
    label: 'Surface Prep',
    icon: LucideIcons.Square,
    color: C.orange,
    prompt:
      'What surface are you using? Does it need toning, stretching, or priming?',
    hint: 'Paper weight, tooth, and tone all affect your final result.',
  },
  {
    id: 'tool_setup',
    label: 'Tool Setup',
    icon: LucideIcons.Wrench,
    color: C.green,
    prompt:
      'Lay out your tools — brushes, pencils, erasers, blending stumps, palette knives',
    hint: 'Organize before you start so your creative flow stays unbroken.',
  },
  {
    id: 'workspace_check',
    label: 'Workspace Check',
    icon: LucideIcons.Lamp,
    color: C.teal,
    prompt:
      'Is your lighting consistent? Easel angle set? Water or solvent ready?',
    hint: 'Good lighting and posture prevent fatigue and color-matching errors.',
  },
];

// =============================================================================
// TOOL COMPONENTS
// =============================================================================

export function ReferenceImagesTool({ values, onChange, accent }: ToolProps) {
  return (
    <AccordionStepTool
      title="Reference Images"
      headerIcon={<LucideIcons.Image size={15} color={accent} />}
      steps={REFERENCE_IMAGES_STEPS}
      values={values}
      onChange={onChange}
      accent={accent}
    />
  );
}

export function TechniqueFocusTool({ values, onChange, accent }: ToolProps) {
  return (
    <AccordionStepTool
      title="Technique Focus"
      headerIcon={<LucideIcons.PenTool size={15} color={accent} />}
      steps={TECHNIQUE_FOCUS_STEPS}
      values={values}
      onChange={onChange}
      accent={accent}
    />
  );
}

export function ColorStudyTool({ values, onChange, accent }: ToolProps) {
  return (
    <AccordionStepTool
      title="Color Study"
      headerIcon={<LucideIcons.Palette size={15} color={accent} />}
      steps={COLOR_STUDY_STEPS}
      values={values}
      onChange={onChange}
      accent={accent}
    />
  );
}

export function MaterialsTool({ values, onChange, accent }: ToolProps) {
  return (
    <AccordionStepTool
      title="Materials"
      headerIcon={<LucideIcons.Brush size={15} color={accent} />}
      steps={MATERIALS_STEPS}
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

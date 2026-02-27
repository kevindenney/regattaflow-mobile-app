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

const CONDITIONS_STEPS: StepDefinition[] = [
  {
    id: 'wind_analysis',
    label: 'Wind Analysis',
    icon: LucideIcons.Wind,
    color: C.blue,
    prompt:
      'Current wind speed, direction, and trends observed on the water',
    hint: 'Note TWS, TWD, and any shifts or oscillations in the last 20 minutes.',
  },
  {
    id: 'sea_state',
    label: 'Sea State',
    icon: LucideIcons.Waves,
    color: C.teal,
    prompt:
      'Wave height, chop direction, and how it affects boat handling',
    hint: 'Is the chop aligned with the wind? Any cross-swell or confused seas?',
  },
  {
    id: 'weather_forecast',
    label: 'Weather Forecast',
    icon: LucideIcons.CloudSun,
    color: C.orange,
    prompt:
      'Forecast for the race window \u2014 expected changes in wind or weather',
    hint: 'Will it build, die, or shift? Any fronts, thermals, or squalls expected?',
  },
  {
    id: 'current_tide',
    label: 'Current & Tide',
    icon: LucideIcons.ArrowDownUp,
    color: C.green,
    prompt:
      'Tidal state, current direction and strength across the course',
    hint: 'Where is current strongest? How does it change over the race duration?',
  },
];

const STRATEGY_STEPS: StepDefinition[] = [
  {
    id: 'race_strategy',
    label: 'Race Strategy',
    icon: LucideIcons.Map,
    color: C.purple,
    prompt:
      'Overall strategy \u2014 which side of the course is favored and why?',
    hint: 'Commit to a plan based on conditions. Left, right, or play the middle?',
  },
  {
    id: 'upwind_plan',
    label: 'Upwind Plan',
    icon: LucideIcons.ChevronsUp,
    color: C.blue,
    prompt:
      'Upwind leg priorities \u2014 tack timing, laylines, and positioning',
    hint: 'Which tack first? Where do you want to be at the windward mark?',
  },
  {
    id: 'downwind_plan',
    label: 'Downwind Plan',
    icon: LucideIcons.ChevronsDown,
    color: C.green,
    prompt:
      'Downwind approach \u2014 angles, gybes, and pressure targets',
    hint: 'VMG angles, gybe timing, and how to connect the pressure.',
  },
  {
    id: 'mark_rounding',
    label: 'Mark Rounding',
    icon: LucideIcons.CornerDownRight,
    color: C.orange,
    prompt:
      'Mark rounding plans \u2014 approach, rights, and exit lanes',
    hint: 'Inside or outside? Tactical rounding to set up the next leg.',
  },
];

const RIG_SETUP_STEPS: StepDefinition[] = [
  {
    id: 'mast_tune',
    label: 'Mast Tune',
    icon: LucideIcons.ArrowUpDown,
    color: C.blue,
    prompt:
      'Rig tension, rake, pre-bend, and spreader settings for conditions',
    hint: 'Match your tuning guide to the forecast. Check shroud tension and mast straight.',
  },
  {
    id: 'sail_selection',
    label: 'Sail Selection',
    icon: LucideIcons.Triangle,
    color: C.purple,
    prompt:
      'Which sails for today \u2014 main, jib/genoa, and spinnaker choice',
    hint: 'Consider wind range, sea state, and crew weight when selecting.',
  },
  {
    id: 'control_lines',
    label: 'Control Lines',
    icon: LucideIcons.Grip,
    color: C.orange,
    prompt:
      'Baseline settings for outhaul, cunningham, vang, and backstay',
    hint: 'Set your starting numbers. Plan adjustments for puffs and lulls.',
  },
  {
    id: 'rig_check',
    label: 'Rig Check',
    icon: LucideIcons.ShieldCheck,
    color: C.green,
    prompt:
      'Pre-race rig inspection \u2014 pins, rings, halyards, and fittings',
    hint: 'Systematic check: masthead to deck, bow to stern. No surprises on the course.',
  },
];

const START_SEQUENCE_STEPS: StepDefinition[] = [
  {
    id: 'start_line_analysis',
    label: 'Start Line Analysis',
    icon: LucideIcons.Ruler,
    color: C.blue,
    prompt:
      'Line bias, length, and how the line is set relative to the wind',
    hint: 'Sail the line both ways. Sight the pin and boat to measure bias.',
  },
  {
    id: 'favored_end',
    label: 'Favored End',
    icon: LucideIcons.Star,
    color: C.orange,
    prompt:
      'Which end is favored and where do you plan to start?',
    hint: 'Factor in first beat strategy, not just line bias. Where does the fleet go?',
  },
  {
    id: 'time_distance',
    label: 'Time & Distance',
    icon: LucideIcons.Timer,
    color: C.purple,
    prompt:
      'Approach timing \u2014 time-on-distance runs and acceleration plan',
    hint: 'How many seconds to accelerate to full speed from your holding position?',
  },
  {
    id: 'backup_plan',
    label: 'Backup Plan',
    icon: LucideIcons.ShieldAlert,
    color: C.red,
    prompt:
      'Bail-out plan if your start is compromised or you get shut out',
    hint: 'Always have a Plan B. Where do you go if your lane is closed?',
  },
];

// =============================================================================
// TOOL COMPONENTS
// =============================================================================

export function ConditionsTool({ values, onChange, accent }: ToolProps) {
  return (
    <AccordionStepTool
      title="Conditions"
      headerIcon={<LucideIcons.Wind size={15} color={accent} />}
      steps={CONDITIONS_STEPS}
      values={values}
      onChange={onChange}
      accent={accent}
    />
  );
}

export function StrategyTool({ values, onChange, accent }: ToolProps) {
  return (
    <AccordionStepTool
      title="Strategy"
      headerIcon={<LucideIcons.Map size={15} color={accent} />}
      steps={STRATEGY_STEPS}
      values={values}
      onChange={onChange}
      accent={accent}
    />
  );
}

export function RigSetupTool({ values, onChange, accent }: ToolProps) {
  return (
    <AccordionStepTool
      title="Rig Setup"
      headerIcon={<LucideIcons.ArrowUpDown size={15} color={accent} />}
      steps={RIG_SETUP_STEPS}
      values={values}
      onChange={onChange}
      accent={accent}
    />
  );
}

export function StartSequenceTool({ values, onChange, accent }: ToolProps) {
  return (
    <AccordionStepTool
      title="Start Sequence"
      headerIcon={<LucideIcons.Timer size={15} color={accent} />}
      steps={START_SEQUENCE_STEPS}
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

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
          <Pressable
            key={step.id}
            style={[
              toolStyles.stepCard,
              isExpanded && toolStyles.stepCardExpanded,
              hasContent && !isExpanded && toolStyles.stepCardComplete,
            ]}
            onPress={() => setExpandedStep(isExpanded ? null : step.id)}
          >
            {/* Step header */}
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

            {/* Expanded content */}
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
          </Pressable>
        );
      })}
    </View>
  );
}

// =============================================================================
// STEP DEFINITIONS
// =============================================================================

const PATIENT_OVERVIEW_STEPS: StepDefinition[] = [
  {
    id: 'history',
    label: 'Patient History',
    icon: LucideIcons.ClipboardList,
    color: C.blue,
    prompt:
      'Key diagnoses and relevant history for each patient',
    hint: 'Include admitting diagnosis, relevant PMH, and reason for admission.',
  },
  {
    id: 'current_status',
    label: 'Current Status',
    icon: LucideIcons.Activity,
    color: C.green,
    prompt:
      'Current clinical picture \u2014 vitals, recent changes, overnight events',
    hint: 'What changed since last shift? Any new orders?',
  },
  {
    id: 'concerns',
    label: 'Concerns',
    icon: LucideIcons.AlertTriangle,
    color: C.orange,
    prompt: 'What are you most worried about for each patient?',
    hint: 'Think about what could go wrong today.',
  },
  {
    id: 'care_priorities',
    label: 'Care Priorities',
    icon: LucideIcons.Target,
    color: C.purple,
    prompt:
      'Your priorities, assessments, and interventions for today',
    hint: 'What must get done vs. what you hope to accomplish?',
  },
  {
    id: 'handoff_questions',
    label: 'Handoff Questions',
    icon: LucideIcons.MessageCircle,
    color: C.pink,
    prompt: 'Questions to ask during handoff',
    hint: "Don't wait \u2014 prepare your questions now.",
  },
];

const MEDICATIONS_STEPS: StepDefinition[] = [
  {
    id: 'med_review',
    label: 'Medication Review',
    icon: LucideIcons.Tablet,
    color: C.blue,
    prompt:
      "List each patient's key medications and their purposes",
    hint: "Know the 'why' for every med you give.",
  },
  {
    id: 'high_alerts',
    label: 'High-Alert Drugs',
    icon: LucideIcons.AlertTriangle,
    color: C.red,
    prompt: 'Any high-alert drugs? What safety checks are needed?',
    hint: 'Insulin, heparin, opioids, blood products \u2014 double-check protocol.',
  },
  {
    id: 'timing_plan',
    label: 'Timing Plan',
    icon: LucideIcons.Clock,
    color: C.orange,
    prompt:
      'Administration timeline \u2014 any time-critical medications?',
    hint: 'Map out your med pass schedule.',
  },
  {
    id: 'interactions',
    label: 'Interactions',
    icon: LucideIcons.GitMerge,
    color: C.purple,
    prompt: 'Drug interactions or contraindications to watch',
    hint: 'Check allergies, renal function, and combination risks.',
  },
];

const LAB_VALUES_STEPS: StepDefinition[] = [
  {
    id: 'critical_labs',
    label: 'Critical Labs',
    icon: LucideIcons.AlertCircle,
    color: C.red,
    prompt: 'Which lab values need immediate attention?',
    hint: 'Know your critical value thresholds.',
  },
  {
    id: 'trends',
    label: 'Trends',
    icon: LucideIcons.TrendingUp,
    color: C.blue,
    prompt:
      "What values are you tracking over time? What's the trajectory?",
    hint: 'Is the patient trending better or worse?',
  },
  {
    id: 'expected_results',
    label: 'Expected Results',
    icon: LucideIcons.Clock,
    color: C.orange,
    prompt: 'What labs are pending? When are results expected?',
    hint: 'Plan when to check back and what to do with results.',
  },
  {
    id: 'clinical_significance',
    label: 'Clinical Significance',
    icon: LucideIcons.Brain,
    color: C.purple,
    prompt: 'How do these lab values affect your care plan?',
    hint: 'Connect the numbers to nursing interventions.',
  },
];

const PROCEDURES_STEPS: StepDefinition[] = [
  {
    id: 'procedure_list',
    label: 'Procedure List',
    icon: LucideIcons.ClipboardList,
    color: C.blue,
    prompt:
      'What procedures do you expect to perform or assist with?',
    hint: 'List each procedure and your role.',
  },
  {
    id: 'mental_rehearsal',
    label: 'Mental Rehearsal',
    icon: LucideIcons.Brain,
    color: C.purple,
    prompt:
      'Walk through each procedure step-by-step in your mind',
    hint: 'Visualize: gather, verify, explain, position, perform, document.',
  },
  {
    id: 'equipment',
    label: 'Equipment & Supplies',
    icon: LucideIcons.Package,
    color: C.orange,
    prompt: 'What supplies and equipment will you need?',
    hint: 'Locate supplies before you need them.',
  },
  {
    id: 'safety_checks',
    label: 'Safety Checks',
    icon: LucideIcons.Shield,
    color: C.green,
    prompt: 'Safety protocols and special considerations?',
    hint: 'Patient ID, allergies, consent, sterile technique.',
  },
];

const CARE_PLAN_STEPS: StepDefinition[] = [
  {
    id: 'priority_diagnoses',
    label: 'Priority Diagnoses',
    icon: LucideIcons.Heart,
    color: C.blue,
    prompt: 'Top nursing diagnoses for your patients',
    hint: 'Use NANDA language. Prioritize by acuity.',
  },
  {
    id: 'interventions',
    label: 'Interventions',
    icon: LucideIcons.Wrench,
    color: C.orange,
    prompt: "Nursing interventions you'll implement",
    hint: 'Be specific: what will you do, how often, and why?',
  },
  {
    id: 'expected_outcomes',
    label: 'Expected Outcomes',
    icon: LucideIcons.Target,
    color: C.green,
    prompt: 'Target outcomes and measures of success',
    hint: 'Use measurable, time-bound indicators.',
  },
  {
    id: 'evaluation',
    label: 'Evaluation',
    icon: LucideIcons.CheckCircle,
    color: C.purple,
    prompt: 'How and when will you evaluate effectiveness?',
    hint: 'What data will tell you if your plan is working?',
  },
];

const CLINICAL_OBJECTIVES_STEPS: StepDefinition[] = [
  {
    id: 'todays_focus',
    label: "Today's Focus",
    icon: LucideIcons.Crosshair,
    color: C.blue,
    prompt:
      'What specific skill or competency are you working on?',
    hint: 'Pick one or two things to be intentional about.',
  },
  {
    id: 'success_criteria',
    label: 'Success Criteria',
    icon: LucideIcons.Award,
    color: C.green,
    prompt: 'What would success look like for you today?',
    hint: 'Define concrete, achievable markers.',
  },
  {
    id: 'preceptor_alignment',
    label: 'Preceptor Alignment',
    icon: LucideIcons.Users,
    color: C.purple,
    prompt: 'What does your preceptor want you to focus on?',
    hint: 'Align your goals with their expectations.',
  },
];

const EBP_CONNECTION_STEPS: StepDefinition[] = [
  {
    id: 'clinical_question',
    label: 'Clinical Question',
    icon: LucideIcons.HelpCircle,
    color: C.blue,
    prompt: 'What clinical question arose from your experience?',
    hint: 'Frame it as a PICO question if possible.',
  },
  {
    id: 'evidence_found',
    label: 'Evidence Found',
    icon: LucideIcons.Search,
    color: C.orange,
    prompt:
      'What evidence did you find? Guidelines, research, best practices?',
    hint: 'Even a quick search counts \u2014 note your source.',
  },
  {
    id: 'application',
    label: 'Application',
    icon: LucideIcons.Link,
    color: C.purple,
    prompt:
      'How does this evidence apply to what you experienced?',
    hint: 'Connect the evidence to your specific situation.',
  },
  {
    id: 'practice_change',
    label: 'Practice Change',
    icon: LucideIcons.RefreshCw,
    color: C.green,
    prompt:
      'What will you do differently based on this evidence?',
    hint: 'One concrete change based on what you learned.',
  },
];

// =============================================================================
// TOOL COMPONENTS
// =============================================================================

export function PatientOverviewTool({ values, onChange, accent }: ToolProps) {
  return (
    <AccordionStepTool
      title="Patient Overview"
      headerIcon={<LucideIcons.ClipboardList size={15} color={accent} />}
      steps={PATIENT_OVERVIEW_STEPS}
      values={values}
      onChange={onChange}
      accent={accent}
    />
  );
}

export function MedicationsTool({ values, onChange, accent }: ToolProps) {
  return (
    <AccordionStepTool
      title="Medications"
      headerIcon={<LucideIcons.Tablet size={15} color={accent} />}
      steps={MEDICATIONS_STEPS}
      values={values}
      onChange={onChange}
      accent={accent}
    />
  );
}

export function LabValuesTool({ values, onChange, accent }: ToolProps) {
  return (
    <AccordionStepTool
      title="Lab Values"
      headerIcon={<LucideIcons.TrendingUp size={15} color={accent} />}
      steps={LAB_VALUES_STEPS}
      values={values}
      onChange={onChange}
      accent={accent}
    />
  );
}

export function ProceduresTool({ values, onChange, accent }: ToolProps) {
  return (
    <AccordionStepTool
      title="Procedures"
      headerIcon={<LucideIcons.ClipboardList size={15} color={accent} />}
      steps={PROCEDURES_STEPS}
      values={values}
      onChange={onChange}
      accent={accent}
    />
  );
}

export function CarePlanTool({ values, onChange, accent }: ToolProps) {
  return (
    <AccordionStepTool
      title="Care Plan"
      headerIcon={<LucideIcons.Heart size={15} color={accent} />}
      steps={CARE_PLAN_STEPS}
      values={values}
      onChange={onChange}
      accent={accent}
    />
  );
}

export function ClinicalObjectivesTool({ values, onChange, accent }: ToolProps) {
  return (
    <AccordionStepTool
      title="Clinical Objectives"
      headerIcon={<LucideIcons.Crosshair size={15} color={accent} />}
      steps={CLINICAL_OBJECTIVES_STEPS}
      values={values}
      onChange={onChange}
      accent={accent}
    />
  );
}

export function EBPConnectionTool({ values, onChange, accent }: ToolProps) {
  return (
    <AccordionStepTool
      title="Evidence-Based Practice"
      headerIcon={<LucideIcons.Search size={15} color={accent} />}
      steps={EBP_CONNECTION_STEPS}
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

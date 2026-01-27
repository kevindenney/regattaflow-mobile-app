/**
 * StrategyNotesWizard
 *
 * Race strategy planning tool for recording pre-race game plan.
 * Captures first beat preference, decision points, and crew briefing notes.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Compass,
  Check,
  ChevronRight,
  ChevronLeft,
  Wind,
  AlertCircle,
  Users,
  Lightbulb,
} from 'lucide-react-native';
import type { ChecklistToolProps } from '@/lib/checklists/toolRegistry';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  purple: '#AF52DE',
  gray: '#8E8E93',
  gray2: '#636366',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
};

// First beat options
const FIRST_BEAT_OPTIONS = [
  {
    id: 'left',
    label: 'Left Side',
    description: 'Sail the left side of the course',
    icon: '←',
  },
  {
    id: 'right',
    label: 'Right Side',
    description: 'Sail the right side of the course',
    icon: '→',
  },
  {
    id: 'middle',
    label: 'Middle / Flexible',
    description: 'Stay central and play shifts',
    icon: '↔',
  },
];

// Decision trigger templates
const DECISION_TEMPLATES = [
  'If wind shifts left >10°, tack to starboard',
  'If behind at windward mark, sail opposite side down run',
  'If wind increases, switch to flatter headsail',
  'Cover key competitors after rounding mark 1',
];

interface StrategyNotesWizardProps extends ChecklistToolProps {
  /** Pre-filled first beat preference */
  initialFirstBeat?: string;
  /** Pre-filled notes */
  initialNotes?: string;
  /** Callback to save strategy data */
  onSave?: (data: {
    firstBeatPreference: string;
    decisionPoints: string[];
    crewBriefing: string;
  }) => void;
}

export function StrategyNotesWizard({
  item,
  regattaId,
  onComplete,
  onCancel,
  initialFirstBeat,
  initialNotes,
}: StrategyNotesWizardProps) {
  const [step, setStep] = useState<'beat' | 'decisions' | 'briefing'>('beat');
  const [firstBeat, setFirstBeat] = useState(initialFirstBeat || '');
  const [beatReason, setBeatReason] = useState('');
  const [decisionPoints, setDecisionPoints] = useState<string[]>(['']);
  const [crewBriefing, setCrewBriefing] = useState('');

  const handleAddDecision = useCallback(() => {
    setDecisionPoints((prev) => [...prev, '']);
  }, []);

  const handleRemoveDecision = useCallback((index: number) => {
    setDecisionPoints((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpdateDecision = useCallback((index: number, value: string) => {
    setDecisionPoints((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleAddTemplate = useCallback((template: string) => {
    setDecisionPoints((prev) => {
      // Add to first empty slot or create new
      const emptyIndex = prev.findIndex((d) => !d.trim());
      if (emptyIndex >= 0) {
        const next = [...prev];
        next[emptyIndex] = template;
        return next;
      }
      return [...prev, template];
    });
  }, []);

  const handleNext = useCallback(() => {
    if (step === 'beat') setStep('decisions');
    else if (step === 'decisions') setStep('briefing');
  }, [step]);

  const handleBack = useCallback(() => {
    if (step === 'briefing') setStep('decisions');
    else if (step === 'decisions') setStep('beat');
  }, [step]);

  const handleComplete = useCallback(() => {
    // In a full implementation, save to race strategy_analysis
    onComplete();
  }, [onComplete]);

  const renderStepContent = () => {
    switch (step) {
      case 'beat':
        return renderBeatStep();
      case 'decisions':
        return renderDecisionsStep();
      case 'briefing':
        return renderBriefingStep();
      default:
        return null;
    }
  };

  const renderBeatStep = () => (
    <>
      <View style={styles.stepHeader}>
        <Wind size={24} color={IOS_COLORS.blue} />
        <Text style={styles.stepTitle}>First Beat Strategy</Text>
        <Text style={styles.stepSubtitle}>
          Which side of the course do you favor?
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        {FIRST_BEAT_OPTIONS.map((option) => (
          <Pressable
            key={option.id}
            style={[
              styles.optionCard,
              firstBeat === option.id && styles.optionCardSelected,
            ]}
            onPress={() => setFirstBeat(option.id)}
          >
            <Text style={styles.optionIcon}>{option.icon}</Text>
            <View style={styles.optionContent}>
              <Text
                style={[
                  styles.optionLabel,
                  firstBeat === option.id && styles.optionLabelSelected,
                ]}
              >
                {option.label}
              </Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            {firstBeat === option.id && (
              <Check size={20} color={IOS_COLORS.blue} />
            )}
          </Pressable>
        ))}
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Why this side? (Optional)</Text>
        <TextInput
          style={styles.textArea}
          value={beatReason}
          onChangeText={setBeatReason}
          placeholder="e.g., Expected left shift, more pressure on left, geographic features..."
          placeholderTextColor={IOS_COLORS.tertiaryLabel}
          multiline
          numberOfLines={3}
        />
      </View>
    </>
  );

  const renderDecisionsStep = () => (
    <>
      <View style={styles.stepHeader}>
        <Lightbulb size={24} color={IOS_COLORS.orange} />
        <Text style={styles.stepTitle}>Decision Triggers</Text>
        <Text style={styles.stepSubtitle}>
          Set if-then rules for key race decisions
        </Text>
      </View>

      {/* Decision Points */}
      <View style={styles.decisionsContainer}>
        {decisionPoints.map((decision, index) => (
          <View key={index} style={styles.decisionRow}>
            <View style={styles.decisionNumber}>
              <Text style={styles.decisionNumberText}>{index + 1}</Text>
            </View>
            <TextInput
              style={styles.decisionInput}
              value={decision}
              onChangeText={(v) => handleUpdateDecision(index, v)}
              placeholder="If... then..."
              placeholderTextColor={IOS_COLORS.tertiaryLabel}
            />
            {decisionPoints.length > 1 && (
              <Pressable
                style={styles.removeDecisionButton}
                onPress={() => handleRemoveDecision(index)}
              >
                <X size={16} color={IOS_COLORS.red} />
              </Pressable>
            )}
          </View>
        ))}
        <Pressable style={styles.addDecisionButton} onPress={handleAddDecision}>
          <Text style={styles.addDecisionText}>+ Add Decision Point</Text>
        </Pressable>
      </View>

      {/* Templates */}
      <View style={styles.templatesSection}>
        <Text style={styles.templatesTitle}>Quick Add Templates</Text>
        <View style={styles.templatesGrid}>
          {DECISION_TEMPLATES.map((template, index) => (
            <Pressable
              key={index}
              style={styles.templateChip}
              onPress={() => handleAddTemplate(template)}
            >
              <Text style={styles.templateText} numberOfLines={1}>
                {template}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </>
  );

  const renderBriefingStep = () => (
    <>
      <View style={styles.stepHeader}>
        <Users size={24} color={IOS_COLORS.purple} />
        <Text style={styles.stepTitle}>Crew Briefing</Text>
        <Text style={styles.stepSubtitle}>
          Notes to share with your crew before the start
        </Text>
      </View>

      <TextInput
        style={styles.briefingInput}
        value={crewBriefing}
        onChangeText={setCrewBriefing}
        placeholder="Key points for the crew:
- Start strategy and position
- Mark rounding priorities
- Communication signals
- Individual responsibilities..."
        placeholderTextColor={IOS_COLORS.tertiaryLabel}
        multiline
        numberOfLines={10}
        textAlignVertical="top"
      />

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Strategy Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>First Beat:</Text>
          <Text style={styles.summaryValue}>
            {FIRST_BEAT_OPTIONS.find((o) => o.id === firstBeat)?.label || 'Not set'}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Decision Points:</Text>
          <Text style={styles.summaryValue}>
            {decisionPoints.filter((d) => d.trim()).length} defined
          </Text>
        </View>
      </View>
    </>
  );

  const getStepNumber = () => {
    switch (step) {
      case 'beat':
        return 1;
      case 'decisions':
        return 2;
      case 'briefing':
        return 3;
      default:
        return 1;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.closeButton}
          onPress={onCancel}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color={IOS_COLORS.gray} />
        </Pressable>
        <Text style={styles.headerTitle}>Race Strategy</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(getStepNumber() / 3) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>Step {getStepNumber()} of 3</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentInner}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepContent()}
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          {step !== 'beat' && (
            <Pressable style={styles.backButton} onPress={handleBack}>
              <ChevronLeft size={20} color={IOS_COLORS.blue} />
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
          )}
          <View style={styles.spacer} />
          {step === 'briefing' ? (
            <Pressable style={styles.completeButton} onPress={handleComplete}>
              <Check size={20} color="#FFFFFF" />
              <Text style={styles.completeButtonText}>Save Strategy</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next</Text>
              <ChevronRight size={20} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  closeButton: {
    padding: 4,
    minWidth: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerRight: {
    minWidth: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
  },
  progressBar: {
    height: 4,
    backgroundColor: IOS_COLORS.separator,
    borderRadius: 2,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentInner: {
    padding: 20,
    paddingBottom: 40,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    marginTop: 12,
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 10,
    marginBottom: 24,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  optionCardSelected: {
    borderColor: IOS_COLORS.blue,
    backgroundColor: `${IOS_COLORS.blue}08`,
  },
  optionIcon: {
    fontSize: 24,
    width: 40,
    textAlign: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  optionLabelSelected: {
    color: IOS_COLORS.blue,
  },
  optionDescription: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: IOS_COLORS.label,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  decisionsContainer: {
    marginBottom: 20,
  },
  decisionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  decisionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: IOS_COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decisionNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  decisionInput: {
    flex: 1,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: IOS_COLORS.label,
  },
  removeDecisionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${IOS_COLORS.red}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDecisionButton: {
    padding: 12,
    alignItems: 'center',
  },
  addDecisionText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  templatesSection: {
    marginBottom: 20,
  },
  templatesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    marginBottom: 10,
  },
  templatesGrid: {
    gap: 8,
  },
  templateChip: {
    padding: 10,
    backgroundColor: `${IOS_COLORS.blue}10`,
    borderRadius: 8,
  },
  templateText: {
    fontSize: 13,
    color: IOS_COLORS.blue,
  },
  briefingInput: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: IOS_COLORS.label,
    minHeight: 200,
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: `${IOS_COLORS.green}08`,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: `${IOS_COLORS.green}30`,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.green,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 4,
  },
  backButtonText: {
    fontSize: 16,
    color: IOS_COLORS.blue,
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 12,
    gap: 6,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: IOS_COLORS.green,
    borderRadius: 12,
    gap: 8,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default StrategyNotesWizard;

/**
 * StructuredDebriefInterview Component
 *
 * Guided post-race interview modal.
 * Shows one question at a time with navigation.
 *
 * Features:
 * - Phase progress indicator
 * - Question-by-question navigation
 * - Skip any question (all optional)
 * - Auto-saves progress
 * - Resume from where left off
 *
 * Question types: select, multi-select, boolean, number, textarea, text
 * (NO star ratings - uses descriptive options instead)
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from 'react-native';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react-native';

import { useDebriefInterview, type DebriefResponseValue } from '@/hooks/useDebriefInterview';
import { useDebriefSailContext, type SailOption } from '@/hooks/useDebriefSailContext';
import { DEBRIEF_PHASES, type FlatQuestion, type DebriefQuestionOption } from './debriefQuestions';

// IDs of sail-related questions that should show sail options
const SAIL_QUESTION_IDS = ['prep_sail_wrong', 'prep_sail_shouldve'];

// iOS System Colors
const IOS_COLORS = {
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C434A',
  systemBackground: '#FFFFFF',
  secondarySystemBackground: '#F2F2F7',
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  purple: '#AF52DE',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
};

interface StructuredDebriefInterviewProps {
  visible: boolean;
  raceId: string;
  userId: string;
  raceName?: string;
  onClose: () => void;
  onComplete: () => void;
}

// =============================================================================
// QUESTION RENDERERS
// =============================================================================

interface QuestionInputProps {
  question: FlatQuestion;
  value: DebriefResponseValue;
  onChange: (value: DebriefResponseValue) => void;
}

/**
 * Boolean input (Yes/No toggle)
 */
function BooleanInput({ question, value, onChange }: QuestionInputProps) {
  const currentValue = typeof value === 'boolean' ? value : null;

  return (
    <View style={inputStyles.booleanContainer}>
      <Pressable
        style={[
          inputStyles.booleanOption,
          currentValue === true && inputStyles.booleanOptionSelected,
        ]}
        onPress={() => onChange(currentValue === true ? null : true)}
      >
        <Text
          style={[
            inputStyles.booleanText,
            currentValue === true && inputStyles.booleanTextSelected,
          ]}
        >
          Yes
        </Text>
      </Pressable>
      <Pressable
        style={[
          inputStyles.booleanOption,
          currentValue === false && inputStyles.booleanOptionSelected,
        ]}
        onPress={() => onChange(currentValue === false ? null : false)}
      >
        <Text
          style={[
            inputStyles.booleanText,
            currentValue === false && inputStyles.booleanTextSelected,
          ]}
        >
          No
        </Text>
      </Pressable>
    </View>
  );
}

/**
 * Select input (single choice)
 */
function SelectInput({ question, value, onChange }: QuestionInputProps) {
  const options = question.options || [];
  const currentValue = typeof value === 'string' ? value : null;

  return (
    <View style={inputStyles.selectContainer}>
      {options.map((option: DebriefQuestionOption) => (
        <Pressable
          key={option.value}
          style={[
            inputStyles.selectOption,
            currentValue === option.value && inputStyles.selectOptionSelected,
          ]}
          onPress={() => onChange(currentValue === option.value ? null : option.value)}
        >
          <View style={inputStyles.selectRadio}>
            {currentValue === option.value && (
              <View style={inputStyles.selectRadioInner} />
            )}
          </View>
          <View style={inputStyles.selectTextContainer}>
            <Text
              style={[
                inputStyles.selectText,
                currentValue === option.value && inputStyles.selectTextSelected,
              ]}
            >
              {option.label}
            </Text>
            {option.hint && (
              <Text style={inputStyles.selectHint}>{option.hint}</Text>
            )}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

/**
 * Number input
 */
function NumberInput({ question, value, onChange }: QuestionInputProps) {
  const currentValue = typeof value === 'number' ? value : null;
  const min = question.min ?? 0;
  const max = question.max ?? 100;

  const increment = () => {
    const newValue = (currentValue ?? min) + 1;
    if (newValue <= max) {
      onChange(newValue);
    }
  };

  const decrement = () => {
    const newValue = (currentValue ?? min) - 1;
    if (newValue >= min) {
      onChange(newValue);
    } else if (currentValue !== null) {
      onChange(null);
    }
  };

  return (
    <View style={inputStyles.numberContainer}>
      <Pressable
        style={[inputStyles.numberButton, currentValue === null && inputStyles.numberButtonDisabled]}
        onPress={decrement}
      >
        <Text style={inputStyles.numberButtonText}>−</Text>
      </Pressable>
      <View style={inputStyles.numberDisplay}>
        <Text style={inputStyles.numberValue}>
          {currentValue !== null ? currentValue : '—'}
        </Text>
      </View>
      <Pressable style={inputStyles.numberButton} onPress={increment}>
        <Text style={inputStyles.numberButtonText}>+</Text>
      </Pressable>
    </View>
  );
}

/**
 * Textarea input (multi-line)
 */
function TextareaInput({ question, value, onChange }: QuestionInputProps) {
  const currentValue = typeof value === 'string' ? value : '';

  return (
    <TextInput
      style={inputStyles.textarea}
      value={currentValue}
      onChangeText={(text) => onChange(text || null)}
      placeholder={question.placeholder || 'Type your answer...'}
      placeholderTextColor={IOS_COLORS.gray3}
      multiline
      numberOfLines={4}
      textAlignVertical="top"
    />
  );
}

/**
 * Single-line text input
 */
function TextInputField({ question, value, onChange }: QuestionInputProps) {
  const currentValue = typeof value === 'string' ? value : '';

  return (
    <TextInput
      style={inputStyles.textInput}
      value={currentValue}
      onChangeText={(text) => onChange(text || null)}
      placeholder={question.placeholder || 'Type your answer...'}
      placeholderTextColor={IOS_COLORS.gray3}
    />
  );
}

/**
 * Multi-select input (checkboxes)
 */
function MultiSelectInput({ question, value, onChange }: QuestionInputProps) {
  const options = question.options || [];
  const currentValues = Array.isArray(value) ? value : [];

  const toggleOption = (optionValue: string) => {
    if (currentValues.includes(optionValue)) {
      const newValues = currentValues.filter((v) => v !== optionValue);
      onChange(newValues.length > 0 ? newValues : null);
    } else {
      onChange([...currentValues, optionValue]);
    }
  };

  return (
    <View style={inputStyles.selectContainer}>
      {options.map((option: DebriefQuestionOption) => {
        const isSelected = currentValues.includes(option.value);
        return (
          <Pressable
            key={option.value}
            style={[
              inputStyles.selectOption,
              isSelected && inputStyles.selectOptionSelected,
            ]}
            onPress={() => toggleOption(option.value)}
          >
            <View style={[inputStyles.checkbox, isSelected && inputStyles.checkboxSelected]}>
              {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
            </View>
            <View style={inputStyles.selectTextContainer}>
              <Text
                style={[
                  inputStyles.selectText,
                  isSelected && inputStyles.selectTextSelected,
                ]}
              >
                {option.label}
              </Text>
              {option.hint && (
                <Text style={inputStyles.selectHint}>{option.hint}</Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Sail select input - shows user's actual sails from intentions or boat inventory
 */
interface SailSelectInputProps {
  value: DebriefResponseValue;
  onChange: (value: DebriefResponseValue) => void;
  sailOptions: SailOption[];
  isLoading: boolean;
  placeholder?: string;
}

function SailSelectInput({ value, onChange, sailOptions, isLoading, placeholder }: SailSelectInputProps) {
  const currentValue = typeof value === 'string' ? value : null;

  // Group sails by category for better organization
  const groupedSails = useMemo(() => {
    const groups: Record<string, SailOption[]> = {};
    sailOptions.forEach((sail) => {
      if (!groups[sail.category]) {
        groups[sail.category] = [];
      }
      groups[sail.category].push(sail);
    });
    return groups;
  }, [sailOptions]);

  const categoryLabels: Record<string, string> = {
    mainsail: 'Mainsails',
    jib: 'Jibs',
    genoa: 'Genoas',
    spinnaker: 'Spinnakers',
    code_zero: 'Code Zeros',
  };

  if (isLoading) {
    return (
      <View style={inputStyles.sailLoadingContainer}>
        <ActivityIndicator size="small" color={IOS_COLORS.blue} />
        <Text style={inputStyles.sailLoadingText}>Loading your sails...</Text>
      </View>
    );
  }

  if (sailOptions.length === 0) {
    return (
      <View style={inputStyles.noSailsContainer}>
        <Text style={inputStyles.noSailsText}>
          No sails found. Add sails to your boat inventory to see them here.
        </Text>
        <TextInput
          style={inputStyles.textInput}
          value={typeof value === 'string' ? value : ''}
          onChangeText={(text) => onChange(text || null)}
          placeholder={placeholder || 'Type sail name manually...'}
          placeholderTextColor={IOS_COLORS.gray3}
        />
      </View>
    );
  }

  return (
    <View style={inputStyles.selectContainer}>
      {Object.entries(groupedSails).map(([category, sails]) => (
        <View key={category}>
          {Object.keys(groupedSails).length > 1 && (
            <Text style={inputStyles.sailCategoryLabel}>
              {categoryLabels[category] || category}
            </Text>
          )}
          {sails.map((sail) => {
            const isSelected = currentValue === sail.value;
            return (
              <Pressable
                key={sail.value}
                style={[
                  inputStyles.selectOption,
                  isSelected && inputStyles.selectOptionSelected,
                  sail.isPlanned && inputStyles.plannedSailOption,
                ]}
                onPress={() => onChange(isSelected ? null : sail.value)}
              >
                <View style={inputStyles.selectRadio}>
                  {isSelected && <View style={inputStyles.selectRadioInner} />}
                </View>
                <View style={inputStyles.selectTextContainer}>
                  <Text
                    style={[
                      inputStyles.selectText,
                      isSelected && inputStyles.selectTextSelected,
                    ]}
                  >
                    {sail.label}
                  </Text>
                  {sail.hint && (
                    <Text style={inputStyles.selectHint}>{sail.hint}</Text>
                  )}
                </View>
                {sail.isPlanned && (
                  <View style={inputStyles.plannedBadge}>
                    <Text style={inputStyles.plannedBadgeText}>Planned</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function StructuredDebriefInterview({
  visible,
  raceId,
  userId,
  raceName,
  onClose,
  onComplete,
}: StructuredDebriefInterviewProps) {
  const {
    currentQuestion,
    responses,
    setResponse,
    next,
    back,
    skip,
    isFirst,
    isLast,
    progress,
    isLoading,
    isSaving,
    error,
    markComplete,
  } = useDebriefInterview({ raceId, userId });

  // Get sail options from race intentions or boat inventory
  const {
    sailOptions,
    isLoading: sailsLoading,
  } = useDebriefSailContext({ raceId, userId });

  // Current response value
  const currentValue = currentQuestion ? responses[currentQuestion.id] : null;

  // Handle next/finish
  const handleNext = useCallback(async () => {
    if (isLast) {
      await markComplete();
      onComplete();
    } else {
      next();
    }
  }, [isLast, markComplete, onComplete, next]);

  // Get current phase info
  const currentPhase = currentQuestion
    ? DEBRIEF_PHASES[currentQuestion.phaseIndex]
    : null;

  // Render the appropriate input type
  const renderInput = useCallback(() => {
    if (!currentQuestion) return null;

    const props: QuestionInputProps = {
      question: currentQuestion,
      value: currentValue,
      onChange: (value) => setResponse(currentQuestion.id, value),
    };

    // For sail questions, use SailSelectInput with actual sail options
    if (SAIL_QUESTION_IDS.includes(currentQuestion.id)) {
      return (
        <SailSelectInput
          value={currentValue}
          onChange={(value) => setResponse(currentQuestion.id, value)}
          sailOptions={sailOptions}
          isLoading={sailsLoading}
          placeholder={currentQuestion.placeholder}
        />
      );
    }

    switch (currentQuestion.type) {
      case 'boolean':
        return <BooleanInput {...props} />;
      case 'select':
        return <SelectInput {...props} />;
      case 'number':
        return <NumberInput {...props} />;
      case 'textarea':
        return <TextareaInput {...props} />;
      case 'text':
        return <TextInputField {...props} />;
      case 'multi-select':
        return <MultiSelectInput {...props} />;
      default:
        return null;
    }
  }, [currentQuestion, currentValue, setResponse, sailOptions, sailsLoading]);

  // Has answer for current question
  const hasAnswer = currentValue !== null && currentValue !== undefined && currentValue !== '';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={IOS_COLORS.label} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Race Debrief</Text>
            {raceName && (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {raceName}
              </Text>
            )}
          </View>
          <View style={styles.headerRight}>
            {isSaving && <ActivityIndicator size="small" color={IOS_COLORS.blue} />}
          </View>
        </View>

        {/* Phase Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.phaseDotsRow}>
            {DEBRIEF_PHASES.map((phase, index) => (
              <View key={phase.id} style={styles.phaseDotWrapper}>
                <View
                  style={[
                    styles.phaseDot,
                    index < (currentQuestion?.phaseIndex ?? 0) && styles.phaseDotComplete,
                    index === (currentQuestion?.phaseIndex ?? 0) && styles.phaseDotCurrent,
                  ]}
                >
                  {index < (currentQuestion?.phaseIndex ?? 0) && (
                    <Check size={10} color="#FFFFFF" strokeWidth={3} />
                  )}
                </View>
                {index < DEBRIEF_PHASES.length - 1 && (
                  <View
                    style={[
                      styles.phaseLine,
                      index < (currentQuestion?.phaseIndex ?? 0) && styles.phaseLineComplete,
                    ]}
                  />
                )}
              </View>
            ))}
          </View>
          <Text style={styles.progressText}>
            {progress.current} of {progress.total} · {progress.answeredCount} answered
          </Text>
        </View>

        {/* Loading State */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={IOS_COLORS.blue} />
            <Text style={styles.loadingText}>Loading interview...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : currentQuestion ? (
          <>
            {/* Question Content */}
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentInner}
              keyboardShouldPersistTaps="handled"
            >
              {/* Phase Header */}
              <View style={styles.phaseHeader}>
                <Text style={styles.phaseEmoji}>{currentPhase?.emoji}</Text>
                <Text style={styles.phaseTitle}>{currentPhase?.title}</Text>
              </View>

              {/* Question */}
              <View style={styles.questionContainer}>
                <Text style={styles.questionLabel}>{currentQuestion.label}</Text>
                {currentQuestion.hint && (
                  <Text style={styles.questionHint}>{currentQuestion.hint}</Text>
                )}
              </View>

              {/* Input */}
              <View style={styles.inputContainer}>{renderInput()}</View>
            </ScrollView>

            {/* Navigation Footer */}
            <View style={styles.footer}>
              <View style={styles.footerLeft}>
                {!isFirst && (
                  <TouchableOpacity style={styles.backButton} onPress={back}>
                    <ChevronLeft size={20} color={IOS_COLORS.blue} />
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.footerRight}>
                {!hasAnswer && !isLast && (
                  <TouchableOpacity style={styles.skipButton} onPress={skip}>
                    <Text style={styles.skipButtonText}>Skip</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.nextButton, isLast && styles.finishButton]}
                  onPress={handleNext}
                >
                  <Text style={[styles.nextButtonText, isLast && styles.finishButtonText]}>
                    {isLast ? 'Finish' : 'Next'}
                  </Text>
                  {!isLast && <ChevronRight size={20} color="#FFFFFF" />}
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.systemBackground,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 16 : 24,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  closeButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  headerSubtitle: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },

  // Progress
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  phaseDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  phaseDotWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phaseDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: IOS_COLORS.gray5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseDotComplete: {
    backgroundColor: IOS_COLORS.green,
  },
  phaseDotCurrent: {
    backgroundColor: IOS_COLORS.blue,
  },
  phaseLine: {
    width: 20,
    height: 2,
    backgroundColor: IOS_COLORS.gray5,
  },
  phaseLineComplete: {
    backgroundColor: IOS_COLORS.green,
  },
  progressText: {
    fontSize: 12,
    color: IOS_COLORS.gray,
    fontWeight: '500',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: '#FF3B30',
    textAlign: 'center',
  },

  // Content
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 24,
  },

  // Phase Header
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  phaseEmoji: {
    fontSize: 24,
  },
  phaseTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Question
  questionContainer: {
    marginBottom: 24,
  },
  questionLabel: {
    fontSize: 22,
    fontWeight: '600',
    color: IOS_COLORS.label,
    lineHeight: 28,
  },
  questionHint: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 8,
    lineHeight: 22,
  },

  // Input Container
  inputContainer: {
    marginTop: 8,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  footerLeft: {
    flex: 1,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 17,
    color: IOS_COLORS.blue,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    fontSize: 17,
    color: IOS_COLORS.gray,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOS_COLORS.blue,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 4,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  finishButton: {
    backgroundColor: IOS_COLORS.green,
  },
  finishButtonText: {
    color: '#FFFFFF',
  },
});

// =============================================================================
// INPUT STYLES
// =============================================================================

const inputStyles = StyleSheet.create({
  // Boolean
  booleanContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  booleanOption: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.gray6,
    alignItems: 'center',
  },
  booleanOptionSelected: {
    backgroundColor: IOS_COLORS.blue,
  },
  booleanText: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  booleanTextSelected: {
    color: '#FFFFFF',
  },

  // Select
  selectContainer: {
    gap: 8,
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.gray6,
    gap: 12,
  },
  selectOptionSelected: {
    backgroundColor: `${IOS_COLORS.blue}15`,
    borderWidth: 2,
    borderColor: IOS_COLORS.blue,
  },
  selectRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: IOS_COLORS.gray3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: IOS_COLORS.blue,
  },
  selectTextContainer: {
    flex: 1,
  },
  selectText: {
    fontSize: 16,
    color: IOS_COLORS.label,
  },
  selectTextSelected: {
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  selectHint: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    marginTop: 2,
  },

  // Checkbox (for multi-select)
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: IOS_COLORS.gray3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: IOS_COLORS.blue,
    borderColor: IOS_COLORS.blue,
  },

  // Number
  numberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  numberButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: IOS_COLORS.gray6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberButtonDisabled: {
    opacity: 0.5,
  },
  numberButtonText: {
    fontSize: 28,
    fontWeight: '500',
    color: IOS_COLORS.blue,
  },
  numberDisplay: {
    width: 80,
    alignItems: 'center',
  },
  numberValue: {
    fontSize: 48,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },

  // Textarea
  textarea: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: IOS_COLORS.label,
    minHeight: 120,
    textAlignVertical: 'top',
  },

  // Text Input
  textInput: {
    backgroundColor: IOS_COLORS.gray6,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: IOS_COLORS.label,
  },

  // Sail Select
  sailLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  sailLoadingText: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
  },
  noSailsContainer: {
    gap: 16,
  },
  noSailsText: {
    fontSize: 14,
    color: IOS_COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  sailCategoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  plannedSailOption: {
    borderWidth: 1,
    borderColor: IOS_COLORS.green,
    borderStyle: 'dashed',
  },
  plannedBadge: {
    backgroundColor: `${IOS_COLORS.green}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  plannedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.green,
    textTransform: 'uppercase',
  },
});

export default StructuredDebriefInterview;

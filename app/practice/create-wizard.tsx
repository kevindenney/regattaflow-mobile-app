/**
 * Practice Create Wizard Screen - Tufte Redesign
 *
 * Simplified 2-step wizard following Tufte principles:
 * 1. PLAN - Focus areas, drills, crew (combined WHAT + WHO)
 * 2. REVIEW - Summary, reasoning, instructions (combined WHY + HOW)
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, X, Calendar, Clock } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TUFTE_BACKGROUND } from '@/components/cards/constants';
import {
  TUFTE_FORM_COLORS,
  TUFTE_FORM_SPACING,
} from '@/components/races/AddRaceDialog/tufteFormStyles';
import { TuftePlanStep } from '@/components/practice/TuftePlanStep';
import { TufteReviewStep } from '@/components/practice/TufteReviewStep';
import { usePracticeCreationWizard } from '@/hooks/usePracticeCreationWizard';
import { useDrillLibrary } from '@/hooks/useDrillLibrary';
import type { SkillArea } from '@/types/practice';

// Simplified 2-step wizard
type SimpleWizardStep = 'plan' | 'review';

export default function PracticeCreateWizardScreen() {
  const params = useLocalSearchParams<{
    fromSuggestion?: string;
    skillArea?: string;
    drillIds?: string;
    aiReasoning?: string;
    contextualNotes?: string;
    estimatedDuration?: string;
    mode?: 'schedule' | 'log';
  }>();

  const wizard = usePracticeCreationWizard();
  const { drills: availableDrills, isLoading: isLoadingDrills } = useDrillLibrary();
  const [currentStep, setCurrentStep] = useState<SimpleWizardStep>('plan');
  const [hasInitialized, setHasInitialized] = useState(false);

  // Scheduling state
  const isScheduleMode = params.mode === 'schedule' || !params.mode;
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Initialize schedule when in schedule mode
  useEffect(() => {
    if (isScheduleMode && !hasInitialized) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const timeStr = selectedDate.toTimeString().slice(0, 5);
      wizard.setSchedule(dateStr, timeStr);
      wizard.setSessionType('scheduled');
    }
  }, [isScheduleMode, hasInitialized]);

  // Pre-populate from AI suggestion params
  useEffect(() => {
    if (params.fromSuggestion === 'true' && !hasInitialized) {
      if (params.skillArea) {
        wizard.setFocusAreas([params.skillArea as SkillArea]);
      }
      if (params.aiReasoning) {
        wizard.setAIReasoning(params.aiReasoning);
      }
      setHasInitialized(true);
    }
  }, [params, hasInitialized]);

  // Add drills once availableDrills are loaded (from drill library)
  useEffect(() => {
    if (
      params.fromSuggestion === 'true' &&
      params.drillIds &&
      availableDrills.length > 0 &&
      wizard.state.what.drills.length === 0
    ) {
      const drillIdList = params.drillIds.split(',').filter(Boolean);
      drillIdList.forEach((drillId, index) => {
        const drill = availableDrills.find((d) => d.id === drillId);
        if (drill) {
          wizard.addDrill(drill, index);
        }
      });
    }
  }, [params.drillIds, params.fromSuggestion, availableDrills]);

  const isFirstStep = currentStep === 'plan';
  const isLastStep = currentStep === 'review';

  // Validation for PLAN step
  const canProceed =
    currentStep === 'plan'
      ? wizard.state.what.focusAreas.length > 0 && wizard.state.what.drills.length > 0
      : true;

  const handleBack = () => {
    if (isFirstStep) {
      Alert.alert('Discard Practice?', 'Your progress will be lost.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/races');
            }
          },
        },
      ]);
    } else {
      setCurrentStep('plan');
    }
  };

  const handleClose = () => {
    Alert.alert('Discard Practice?', 'Your progress will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)/races');
          }
        },
      },
    ]);
  };

  const handleNext = () => {
    if (isLastStep) {
      handleCreate();
    } else {
      setCurrentStep('review');
    }
  };

  const handleCreate = async () => {
    try {
      const sessionId = await wizard.createSession();
      router.replace({
        pathname: '/practice/[id]',
        params: { id: sessionId },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to create practice session. Please try again.');
    }
  };

  // Date/time picker handlers
  const handleDateChange = (_event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
      setSelectedDate(newDate);
      const dateStr = newDate.toISOString().split('T')[0];
      const timeStr = newDate.toTimeString().slice(0, 5);
      wizard.setSchedule(dateStr, timeStr);
    }
  };

  const handleTimeChange = (_event: any, date?: Date) => {
    setShowTimePicker(false);
    if (date) {
      const newDate = new Date(selectedDate);
      newDate.setHours(date.getHours(), date.getMinutes());
      setSelectedDate(newDate);
      const dateStr = newDate.toISOString().split('T')[0];
      const timeStr = newDate.toTimeString().slice(0, 5);
      wizard.setSchedule(dateStr, timeStr);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const stepTitles = {
    plan: 'Plan Practice',
    review: 'Review & Create',
  };

  const nextButtonText = isLastStep ? 'Create Session' : 'Continue';
  const nextButtonDisabled = !canProceed || wizard.state.isSubmitting;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          hitSlop={12}
        >
          <ChevronLeft size={24} color={TUFTE_FORM_COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{stepTitles[currentStep]}</Text>
          <Text style={styles.headerSubtitle}>
            Step {currentStep === 'plan' ? '1' : '2'} of 2
          </Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={12}
        >
          <X size={20} color={TUFTE_FORM_COLORS.secondaryLabel} />
        </TouchableOpacity>
      </View>

      {/* Progress Indicator - Simple 2-dot version */}
      <View style={styles.progressContainer}>
        <View style={styles.progressRow}>
          <View
            style={[
              styles.progressDot,
              currentStep === 'plan' && styles.progressDotActive,
              currentStep === 'review' && styles.progressDotCompleted,
            ]}
          >
            {currentStep === 'review' && (
              <Text style={styles.progressCheck}>✓</Text>
            )}
          </View>
          <View style={styles.progressLine} />
          <View
            style={[
              styles.progressDot,
              currentStep === 'review' && styles.progressDotActive,
            ]}
          />
        </View>
        <View style={styles.progressLabels}>
          <Text
            style={[
              styles.progressLabel,
              currentStep === 'plan' && styles.progressLabelActive,
            ]}
          >
            PLAN
          </Text>
          <Text
            style={[
              styles.progressLabel,
              currentStep === 'review' && styles.progressLabelActive,
            ]}
          >
            REVIEW
          </Text>
        </View>
      </View>

      {/* Schedule Section - shown in schedule mode */}
      {isScheduleMode && (
        <View style={styles.scheduleSection}>
          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={16} color={TUFTE_FORM_COLORS.primary} />
            <Text style={styles.scheduleButtonText}>{formatDate(selectedDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Clock size={16} color={TUFTE_FORM_COLORS.primary} />
            <Text style={styles.scheduleButtonText}>{formatTime(selectedDate)}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

      {/* Time Picker Modal */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minuteInterval={15}
          onChange={handleTimeChange}
        />
      )}

      {/* Content */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        {currentStep === 'plan' ? (
          <TuftePlanStep
            focusAreas={wizard.state.what.focusAreas}
            drills={wizard.state.what.drills}
            availableDrills={availableDrills}
            estimatedDuration={wizard.state.what.estimatedDurationMinutes}
            onFocusAreasChange={wizard.setFocusAreas}
            onAddDrill={wizard.addDrill}
            onRemoveDrill={wizard.removeDrill}
            members={wizard.state.who.members}
            onAddMember={wizard.addMember}
            onRemoveMember={wizard.removeMember}
            isLoadingDrills={isLoadingDrills}
          />
        ) : (
          <TufteReviewStep
            drills={wizard.state.what.drills}
            availableDrills={availableDrills}
            members={wizard.state.who.members}
            estimatedDuration={wizard.state.what.estimatedDurationMinutes}
            whyData={wizard.state.why}
            onUserRationaleChange={wizard.setUserRationale}
            howData={wizard.state.how}
            onDrillInstructionsChange={wizard.setDrillInstructions}
            onSessionNotesChange={wizard.setSessionNotes}
          />
        )}
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={styles.footer}>
        {wizard.state.error && (
          <Text style={styles.errorText}>{wizard.state.error}</Text>
        )}
        <TouchableOpacity
          style={[
            styles.nextButton,
            nextButtonDisabled && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={nextButtonDisabled}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.nextButtonText,
              nextButtonDisabled && styles.nextButtonTextDisabled,
            ]}
          >
            {wizard.state.isSubmitting ? 'Creating...' : nextButtonText}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TUFTE_BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: TUFTE_FORM_SPACING.lg,
    paddingVertical: TUFTE_FORM_SPACING.md,
    backgroundColor: TUFTE_BACKGROUND,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TUFTE_FORM_COLORS.separator,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.label,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: TUFTE_FORM_COLORS.secondaryLabel,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Progress indicator
  progressContainer: {
    paddingHorizontal: 60,
    paddingVertical: TUFTE_FORM_SPACING.md,
    backgroundColor: TUFTE_BACKGROUND,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    backgroundColor: TUFTE_FORM_COLORS.primary,
  },
  progressDotCompleted: {
    backgroundColor: '#16A34A',
  },
  progressCheck: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: TUFTE_FORM_COLORS.sectionLabel,
    letterSpacing: 1,
  },
  progressLabelActive: {
    color: TUFTE_FORM_COLORS.primary,
  },
  // Schedule section
  scheduleSection: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: TUFTE_FORM_SPACING.lg,
    paddingVertical: TUFTE_FORM_SPACING.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TUFTE_FORM_COLORS.separator,
  },
  scheduleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: TUFTE_BACKGROUND,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TUFTE_FORM_COLORS.inputBorder,
  },
  scheduleButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: TUFTE_FORM_COLORS.label,
  },
  content: {
    flex: 1,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: TUFTE_FORM_SPACING.lg,
    paddingVertical: TUFTE_FORM_SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 28 : TUFTE_FORM_SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: TUFTE_FORM_COLORS.separator,
  },
  errorText: {
    fontSize: 13,
    color: TUFTE_FORM_COLORS.error,
    textAlign: 'center',
    marginBottom: 8,
  },
  nextButton: {
    backgroundColor: TUFTE_FORM_COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nextButtonTextDisabled: {
    color: '#9CA3AF',
  },
});

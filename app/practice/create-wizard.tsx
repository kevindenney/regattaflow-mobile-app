/**
 * Practice Create Wizard Screen - Tufte Redesign
 *
 * Simplified single-page form following Tufte principles:
 * - Plan: Focus areas, drills, crew
 * - Review: Summary, reasoning, instructions
 * - Single scrolling view for simplicity
 */

import { TUFTE_BACKGROUND } from '@/components/cards/constants';
import { TuftePlanStep } from '@/components/practice/TuftePlanStep';
import { TufteReviewStep } from '@/components/practice/TufteReviewStep';
import {
  TUFTE_FORM_COLORS,
  TUFTE_FORM_SPACING,
} from '@/components/races/AddRaceDialog/tufteFormStyles';
import { useDrillLibrary } from '@/hooks/useDrillLibrary';
import { usePracticeCreationWizard } from '@/hooks/usePracticeCreationWizard';
import { useAuth } from '@/providers/AuthProvider';
import type { SkillArea } from '@/types/practice';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Calendar, ChevronLeft, Clock, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

let DateTimePicker: any = null;
try {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (_error) {
  DateTimePicker = null;
}

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

  const { user, isGuest } = useAuth();
  const wizard = usePracticeCreationWizard();
  const { drills: availableDrills, isLoading: isLoadingDrills } = useDrillLibrary();
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
  const hasDateTimePicker = Boolean(DateTimePicker);

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

  const canProceed = wizard.state.what.focusAreas.length > 0 && wizard.state.what.drills.length > 0;

  const handleBack = () => {
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

  const handleClose = handleBack;

  const handleCreate = async () => {
    // Guest Restriction
    if (isGuest || !user?.id) {
      Alert.alert(
        'Sign Up Required',
        'Please sign up to create practice sessions and track your progress.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Up',
            onPress: () => router.push('/(auth)/signup')
          }
        ]
      );
      return;
    }

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
          <Text style={styles.headerTitle}>New Practice Session</Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={12}
        >
          <X size={20} color={TUFTE_FORM_COLORS.secondaryLabel} />
        </TouchableOpacity>
      </View>

      {/* Schedule Section - shown in schedule mode */}
      {isScheduleMode && (
        <View style={styles.scheduleSection}>
          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={() => {
              if (!hasDateTimePicker) {
                Alert.alert('Unavailable', 'Date picker is unavailable in this build.');
                return;
              }
              setShowDatePicker(true);
            }}
          >
            <Calendar size={16} color={TUFTE_FORM_COLORS.primary} />
            <Text style={styles.scheduleButtonText}>{formatDate(selectedDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={() => {
              if (!hasDateTimePicker) {
                Alert.alert('Unavailable', 'Time picker is unavailable in this build.');
                return;
              }
              setShowTimePicker(true);
            }}
          >
            <Clock size={16} color={TUFTE_FORM_COLORS.primary} />
            <Text style={styles.scheduleButtonText}>{formatTime(selectedDate)}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Date Picker Modal */}
      {hasDateTimePicker && showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

      {/* Time Picker Modal */}
      {hasDateTimePicker && showTimePicker && (
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
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Plan</Text>
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
          </View>

          <View style={styles.separator} />

          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Details</Text>
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
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer */}
      <View style={styles.footer}>
        {wizard.state.error && (
          <Text style={styles.errorText}>{wizard.state.error}</Text>
        )}
        <TouchableOpacity
          style={[
            styles.nextButton,
            (!canProceed || wizard.state.isSubmitting) && styles.nextButtonDisabled,
          ]}
          onPress={handleCreate}
          disabled={!canProceed || wizard.state.isSubmitting}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.nextButtonText,
              (!canProceed || wizard.state.isSubmitting) && styles.nextButtonTextDisabled,
            ]}
          >
            {wizard.state.isSubmitting ? 'Creating...' : 'Create Session'}
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
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: TUFTE_FORM_SPACING.xl,
  },
  stepContainer: {
    // No padding needed as steps handle it
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TUFTE_FORM_COLORS.label,
    marginHorizontal: TUFTE_FORM_SPACING.lg,
    marginTop: TUFTE_FORM_SPACING.lg,
    marginBottom: TUFTE_FORM_SPACING.sm,
  },
  separator: {
    height: 1,
    backgroundColor: TUFTE_FORM_COLORS.separator, // Use darker separator
    marginVertical: TUFTE_FORM_SPACING.lg,
    marginHorizontal: TUFTE_FORM_SPACING.lg,
  },
  bottomSpacer: {
    height: 20,
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

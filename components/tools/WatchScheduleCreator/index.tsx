/**
 * WatchScheduleCreator Component
 *
 * Multi-step wizard for creating watch schedules for distance/offshore races.
 * Step 1: Choose watch system (4on/4off or 3on/3off)
 * Step 2: Add crew members and assign to watches
 * Step 3: View and save the generated schedule timeline
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ChevronLeft, X, Clock } from 'lucide-react-native';

import type {
  WatchSystem,
  WatchSchedule,
  CrewMember,
  WatchScheduleFormData,
  WatchScheduleStep,
} from '@/types/watchSchedule';
import { createWatchSchedule } from '@/lib/watchSchedule';
import { WatchTypeStep } from './WatchTypeStep';
import { CrewStep } from './CrewStep';
import { ScheduleTimeline } from './ScheduleTimeline';

// =============================================================================
// iOS SYSTEM COLORS (Apple HIG)
// =============================================================================

const IOS_COLORS = {
  blue: '#007AFF',
  purple: '#AF52DE',
  gray: '#8E8E93',
  gray4: '#D1D1D6',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  separator: 'rgba(60, 60, 67, 0.12)',
};

// =============================================================================
// TYPES
// =============================================================================

interface WatchScheduleCreatorProps {
  visible: boolean;
  onClose: () => void;
  onSave: (schedule: WatchSchedule) => void;
  /** Race data for context */
  raceId: string;
  raceName: string;
  raceStart?: string;
  estimatedDuration?: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function WatchScheduleCreator({
  visible,
  onClose,
  onSave,
  raceId,
  raceName,
  raceStart,
  estimatedDuration = 12,
}: WatchScheduleCreatorProps) {
  // Step navigation
  const [step, setStep] = useState<WatchScheduleStep>('system');

  // Form data
  const [formData, setFormData] = useState<WatchScheduleFormData>({
    system: null,
    crew: [],
    estimatedDuration: estimatedDuration,
    notes: undefined,
  });

  // Generated schedule (created when moving to timeline step)
  const [generatedSchedule, setGeneratedSchedule] = useState<WatchSchedule | null>(null);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleClose = useCallback(() => {
    // Reset state on close
    setStep('system');
    setFormData({
      system: null,
      crew: [],
      estimatedDuration: estimatedDuration,
      notes: undefined,
    });
    setGeneratedSchedule(null);
    onClose();
  }, [onClose, estimatedDuration]);

  const handleSystemSelect = useCallback((system: WatchSystem) => {
    setFormData((prev) => ({ ...prev, system }));
  }, []);

  const handleCrewChange = useCallback((crew: CrewMember[]) => {
    setFormData((prev) => ({ ...prev, crew }));
  }, []);

  const handleDurationChange = useCallback((duration: number) => {
    setFormData((prev) => ({ ...prev, estimatedDuration: duration }));
  }, []);

  const handleNotesChange = useCallback((notes: string) => {
    setFormData((prev) => ({ ...prev, notes: notes || undefined }));
  }, []);

  const handleBack = useCallback(() => {
    if (step === 'crew') {
      setStep('system');
    } else if (step === 'timeline') {
      setStep('crew');
      setGeneratedSchedule(null);
    }
  }, [step]);

  const handleNext = useCallback(() => {
    if (step === 'system' && formData.system) {
      setStep('crew');
    } else if (step === 'crew' && formData.system) {
      // Generate the schedule when moving to timeline
      const schedule = createWatchSchedule({
        system: formData.system,
        raceStart: raceStart || new Date().toISOString(),
        estimatedDuration: formData.estimatedDuration,
        crew: formData.crew,
        notes: formData.notes,
      });
      setGeneratedSchedule(schedule);
      setStep('timeline');
    }
  }, [step, formData, raceStart]);

  const handleSave = useCallback(() => {
    if (generatedSchedule) {
      onSave(generatedSchedule);
      handleClose();
    }
  }, [generatedSchedule, onSave, handleClose]);

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const getStepTitle = useCallback(() => {
    switch (step) {
      case 'system':
        return 'Watch Schedule';
      case 'crew':
        return 'Crew Assignment';
      case 'timeline':
        return 'Watch Schedule';
      default:
        return 'Watch Schedule';
    }
  }, [step]);

  const getStepNumber = useCallback(() => {
    switch (step) {
      case 'system':
        return 1;
      case 'crew':
        return 2;
      case 'timeline':
        return 3;
      default:
        return 1;
    }
  }, [step]);

  const canProceed = useMemo(() => {
    if (step === 'system') {
      return formData.system !== null;
    }
    if (step === 'crew') {
      // Need at least one crew member in each watch
      const watchA = formData.crew.filter((c) => c.watch === 'A');
      const watchB = formData.crew.filter((c) => c.watch === 'B');
      return watchA.length > 0 && watchB.length > 0;
    }
    return false;
  }, [step, formData]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            {step !== 'system' ? (
              <Pressable style={styles.backButton} onPress={handleBack}>
                <ChevronLeft size={24} color={IOS_COLORS.blue} />
              </Pressable>
            ) : (
              <View style={styles.backButton} />
            )}

            <View style={styles.titleContainer}>
              <Clock size={18} color={IOS_COLORS.purple} />
              <Text style={styles.title}>{getStepTitle()}</Text>
            </View>

            <Pressable style={styles.closeButton} onPress={handleClose}>
              <X size={24} color={IOS_COLORS.gray} />
            </Pressable>
          </View>

          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <View
              style={[
                styles.stepDot,
                { backgroundColor: getStepNumber() >= 1 ? IOS_COLORS.purple : IOS_COLORS.gray5 },
              ]}
            />
            <View
              style={[
                styles.stepLine,
                { backgroundColor: getStepNumber() >= 2 ? IOS_COLORS.purple : IOS_COLORS.gray5 },
              ]}
            />
            <View
              style={[
                styles.stepDot,
                { backgroundColor: getStepNumber() >= 2 ? IOS_COLORS.purple : IOS_COLORS.gray5 },
              ]}
            />
            <View
              style={[
                styles.stepLine,
                { backgroundColor: getStepNumber() >= 3 ? IOS_COLORS.purple : IOS_COLORS.gray5 },
              ]}
            />
            <View
              style={[
                styles.stepDot,
                { backgroundColor: getStepNumber() >= 3 ? IOS_COLORS.purple : IOS_COLORS.gray5 },
              ]}
            />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {step === 'system' && (
              <WatchTypeStep
                selectedSystem={formData.system}
                onSelect={handleSystemSelect}
                onNext={handleNext}
                canProceed={canProceed}
              />
            )}

            {step === 'crew' && formData.system && (
              <CrewStep
                system={formData.system}
                crew={formData.crew}
                onCrewChange={handleCrewChange}
                estimatedDuration={formData.estimatedDuration}
                onDurationChange={handleDurationChange}
                raceName={raceName}
                raceStart={raceStart}
                onNext={handleNext}
                canProceed={canProceed}
              />
            )}

            {step === 'timeline' && generatedSchedule && (
              <ScheduleTimeline
                schedule={generatedSchedule}
                onSave={handleSave}
                onNotesChange={handleNotesChange}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// =============================================================================
// STYLES (Apple HIG Compliant)
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.gray6,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.gray6,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    textAlign: 'center',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingBottom: 4,
    gap: 4,
    backgroundColor: IOS_COLORS.gray6,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepLine: {
    width: 32,
    height: 2,
    borderRadius: 1,
  },
  content: {
    flex: 1,
  },
});

export default WatchScheduleCreator;

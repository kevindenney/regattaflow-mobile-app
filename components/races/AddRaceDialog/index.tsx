/**
 * AddRaceDialog Component
 *
 * Multi-step wizard for adding races with support for all 4 race types.
 * Step 1: Choose race type (Fleet, Distance, Match, Team)
 * Step 2: Choose input method (AI extraction or Manual)
 * Step 3a: AI extraction flow (AIQuickEntry → Progress → Results)
 * Step 3b: Manual entry form
 */

import React, { useState, useCallback } from 'react';
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
import { ChevronLeft, X, Sparkles } from 'lucide-react-native';
import { Typography, Spacing, BorderRadius, colors, Shadows } from '@/constants/designSystem';
import { RaceType, RACE_TYPE_COLORS } from '../RaceTypeSelector';
import { RaceTypeStep } from './RaceTypeStep';
import { InputMethodStep, InputMethod } from './InputMethodStep';
import { AIExtractionStep } from './AIExtractionStep';
import { RaceDetailsStep, RaceFormData } from './RaceDetailsStep';
import type { ExtractedRaceData } from '../ExtractionResults';

interface AddRaceDialogProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: RaceFormData) => Promise<void>;
}

type Step = 'type' | 'input-method' | 'ai-extraction' | 'details';

export function AddRaceDialog({ visible, onClose, onSave }: AddRaceDialogProps) {
  const [step, setStep] = useState<Step>('type');
  const [selectedType, setSelectedType] = useState<RaceType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedRaceData | null>(null);

  const handleClose = useCallback(() => {
    setStep('type');
    setSelectedType(null);
    setExtractedData(null);
    onClose();
  }, [onClose]);

  const handleTypeSelect = useCallback((type: RaceType) => {
    setSelectedType(type);
  }, []);

  const handleNext = useCallback(() => {
    if (selectedType) {
      setStep('input-method');
    }
  }, [selectedType]);

  const handleInputMethodSelect = useCallback((method: InputMethod) => {
    if (method === 'ai') {
      setStep('ai-extraction');
    } else {
      setStep('details');
    }
  }, []);

  const handleBack = useCallback(() => {
    if (step === 'input-method') {
      setStep('type');
    } else if (step === 'ai-extraction' || step === 'details') {
      setStep('input-method');
      setExtractedData(null);
    }
  }, [step]);

  const handleAIExtracted = useCallback((data: ExtractedRaceData) => {
    setExtractedData(data);
    setStep('details');
  }, []);

  const handleManualEntry = useCallback(() => {
    setExtractedData(null);
    setStep('details');
  }, []);

  const handleSave = useCallback(async (data: RaceFormData) => {
    setIsSaving(true);
    try {
      await onSave(data);
      handleClose();
    } catch (error) {
      console.error('Failed to save race:', error);
      // TODO: Show error toast
    } finally {
      setIsSaving(false);
    }
  }, [onSave, handleClose]);

  const getStepTitle = () => {
    if (step === 'type') return 'Add Race';
    if (step === 'input-method') return 'Add Race';
    if (step === 'ai-extraction') return 'AI Extract';
    if (selectedType) {
      const titles: Record<RaceType, string> = {
        fleet: 'Fleet Racing',
        distance: 'Distance Racing',
        match: 'Match Racing',
        team: 'Team Racing',
      };
      return titles[selectedType];
    }
    return 'Race Details';
  };

  const getStepNumber = () => {
    switch (step) {
      case 'type': return 1;
      case 'input-method': return 2;
      case 'ai-extraction': return 2;
      case 'details': return 3;
      default: return 1;
    }
  };

  const accentColor = selectedType ? RACE_TYPE_COLORS[selectedType].primary : colors.primary[600];

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
          {/* Header - hide during AI extraction (has its own header) */}
          {step !== 'ai-extraction' && (
            <View style={styles.header}>
              {step !== 'type' ? (
                <Pressable style={styles.backButton} onPress={handleBack}>
                  <ChevronLeft size={24} color={colors.text.primary} />
                </Pressable>
              ) : (
                <View style={styles.backButton} />
              )}

              <View style={styles.titleContainer}>
                <Text style={styles.title}>{getStepTitle()}</Text>
                {(step === 'details' || step === 'input-method') && selectedType && (
                  <View style={[styles.typeBadge, { backgroundColor: RACE_TYPE_COLORS[selectedType].badge }]}>
                    <View style={[styles.typeDot, { backgroundColor: accentColor }]} />
                  </View>
                )}
              </View>

              <Pressable style={styles.closeButton} onPress={handleClose}>
                <X size={24} color={colors.text.secondary} />
              </Pressable>
            </View>
          )}

          {/* Step indicator - hide during AI extraction */}
          {step !== 'ai-extraction' && (
            <View style={styles.stepIndicator}>
              {/* Step 1: Race Type */}
              <View style={[
                styles.stepDot,
                getStepNumber() >= 1 && styles.stepDotActive,
                { backgroundColor: getStepNumber() >= 1 ? accentColor : colors.border.medium }
              ]} />
              <View style={[styles.stepLine, { backgroundColor: getStepNumber() >= 2 ? accentColor : colors.border.medium }]} />

              {/* Step 2: Input Method */}
              <View style={[
                styles.stepDot,
                getStepNumber() >= 2 && styles.stepDotActive,
                { backgroundColor: getStepNumber() >= 2 ? accentColor : colors.border.medium }
              ]} />
              <View style={[styles.stepLine, { backgroundColor: getStepNumber() >= 3 ? accentColor : colors.border.medium }]} />

              {/* Step 3: Details */}
              <View style={[
                styles.stepDot,
                getStepNumber() >= 3 && styles.stepDotActive,
                { backgroundColor: getStepNumber() >= 3 ? accentColor : colors.border.medium }
              ]} />
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>
            {step === 'type' && (
              <RaceTypeStep
                selectedType={selectedType}
                onSelect={handleTypeSelect}
                onNext={handleNext}
              />
            )}

            {step === 'input-method' && selectedType && (
              <InputMethodStep
                raceType={selectedType}
                onSelectMethod={handleInputMethodSelect}
              />
            )}

            {step === 'ai-extraction' && selectedType && (
              <AIExtractionStep
                raceType={selectedType}
                onExtracted={handleAIExtracted}
                onManualEntry={handleManualEntry}
                onCancel={handleBack}
              />
            )}

            {step === 'details' && selectedType && (
              <RaceDetailsStep
                raceType={selectedType}
                onSave={handleSave}
                onCancel={handleClose}
                isSaving={isSaving}
                initialData={extractedData}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  title: {
    ...Typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
  },
  typeBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: 4,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepDotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepLine: {
    width: 40,
    height: 2,
    borderRadius: 1,
  },
  content: {
    flex: 1,
  },
});

export default AddRaceDialog;

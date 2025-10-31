/**
 * Add Race Screen - Redesigned
 *
 * AI-first approach to adding races with progressive disclosure
 * Flow: Quick Entry → Extraction → Results → Save
 */

import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  AIQuickEntry,
  InputMethod,
  ExtractionProgress,
  ExtractionStep,
  ExtractionResults,
  ExtractedRaceData,
  ManualRaceForm,
  ManualRaceFormData,
} from '@/components/races';
import { colors, Spacing } from '@/constants/designSystem';

type FlowState = 'entry' | 'extracting' | 'results' | 'manual';

export default function AddRaceRedesignScreen() {
  const [flowState, setFlowState] = useState<FlowState>('entry');
  const [extractionStep, setExtractionStep] = useState<ExtractionStep>('parsing');
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedRaceData | null>(null);

  // Simulate AI extraction
  const handleExtract = async (method: InputMethod, content: string | File) => {
    setFlowState('extracting');
    setExtractionProgress(0);

    // Simulate extraction steps
    const steps: ExtractionStep[] = [
      'parsing',
      'extracting_basic',
      'extracting_course',
      'extracting_weather',
      'validating',
      'complete',
    ];

    for (let i = 0; i < steps.length; i++) {
      setExtractionStep(steps[i]);
      setExtractionProgress(((i + 1) / steps.length) * 100);
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    // Mock extracted data with varying confidence
    const mockData: ExtractedRaceData = {
      basic: [
        { label: 'Race Name', value: 'Croucher 1 & 2', confidence: 'high' },
        { label: 'Date', value: '2025-03-15', confidence: 'high' },
        { label: 'Start Time', value: '12:45', confidence: 'medium' },
        { label: 'Location', value: 'Port Shelter, Hong Kong', confidence: 'high' },
      ],
      timing: [
        { label: 'Warning Signal', value: '5 min before', confidence: 'medium' },
        { label: 'Start Sequence', value: '5-4-1-GO', confidence: 'low' },
      ],
      course: [
        { label: 'Course Name', value: 'Windward-Leeward', confidence: 'high' },
        { label: 'Number of Laps', value: '3', confidence: 'medium' },
        { label: 'Course Length', value: '', confidence: 'missing' },
      ],
      conditions: [
        { label: 'Expected Wind', value: 'NE 12-15 kts', confidence: 'medium' },
        { label: 'Expected Current', value: '', confidence: 'missing' },
      ],
    };

    setExtractedData(mockData);
    setFlowState('results');
  };

  const handleManualEntry = () => {
    setFlowState('manual');
  };

  const handleFieldChange = (
    section: keyof ExtractedRaceData,
    index: number,
    value: string
  ) => {
    if (!extractedData) return;

    setExtractedData((prev) => {
      if (!prev) return prev;

      const sectionData = prev[section];
      if (!sectionData) return prev;

      const updatedSection = [...sectionData];
      updatedSection[index] = {
        ...updatedSection[index],
        value,
        confidence: value.trim() ? 'high' : 'missing',
      };

      return {
        ...prev,
        [section]: updatedSection,
      };
    });
  };

  const handleConfirm = async () => {
    // TODO: Save to database

    // Navigate back to races
    router.replace('/(tabs)/races');
  };

  const handleRetry = () => {
    setFlowState('entry');
    setExtractedData(null);
    setExtractionProgress(0);
  };

  const handleManualSubmit = async (data: ManualRaceFormData) => {
    // TODO: Save to database

    // Navigate back to races
    router.replace('/(tabs)/races');
  };

  const handleManualCancel = () => {
    setFlowState('entry');
  };

  const handleBack = () => {
    if (flowState === 'results' || flowState === 'manual') {
      setFlowState('entry');
    } else if (flowState === 'extracting') {
      // Can't go back during extraction
      return;
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={handleBack}
          disabled={flowState === 'extracting'}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
      </View>

      {/* Flow States */}
      {flowState === 'entry' && (
        <AIQuickEntry
          onExtract={handleExtract}
          onManualEntry={handleManualEntry}
          loading={false}
        />
      )}

      {flowState === 'extracting' && (
        <ExtractionProgress currentStep={extractionStep} progress={extractionProgress} />
      )}

      {flowState === 'results' && extractedData && (
        <ExtractionResults
          data={extractedData}
          onFieldChange={handleFieldChange}
          onConfirm={handleConfirm}
          onRetry={handleRetry}
        />
      )}

      {flowState === 'manual' && (
        <ManualRaceForm onSubmit={handleManualSubmit} onCancel={handleManualCancel} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: Spacing.xs,
  },
});

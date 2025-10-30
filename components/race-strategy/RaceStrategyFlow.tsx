/**
 * Race Strategy Flow
 *
 * Orchestrates the complete vertical slice:
 * Document Upload → AI Extraction → Visualization → Validation
 *
 * This is the main entry point for testing the race strategy data gathering UX
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DocumentUploadScreen from './DocumentUploadScreen';
import AIValidationScreen from './AIValidationScreen';
import { createLogger } from '@/lib/utils/logger';

type FlowStep = 'upload' | 'validation' | 'complete';

const logger = createLogger('RaceStrategyFlow');
export function RaceStrategyFlow() {
  const [currentStep, setCurrentStep] = useState<FlowStep>('upload');
  const [raceEventId, setRaceEventId] = useState<string>('');

  const handleProcessingComplete = (eventId: string) => {
    setRaceEventId(eventId);
    setCurrentStep('validation');
  };

  const handleApprove = () => {
    setCurrentStep('complete');
    // TODO: Navigate to race intelligence dashboard
    logger.debug('Race approved! Navigate to dashboard...');
  };

  const handleEdit = () => {
    // TODO: Navigate to course editor
    logger.debug('Edit course...');
  };

  const handleManualMode = () => {
    // TODO: Navigate to manual course drawing
    logger.debug('Manual mode...');
  };

  return (
    <View style={styles.container}>
      {currentStep === 'upload' && (
        <DocumentUploadScreen onProcessingComplete={handleProcessingComplete} />
      )}

      {currentStep === 'validation' && raceEventId && (
        <AIValidationScreen
          raceEventId={raceEventId}
          onApprove={handleApprove}
          onEdit={handleEdit}
          onManualMode={handleManualMode}
        />
      )}

      {currentStep === 'complete' && (
        <View style={styles.completeContainer}>
          <Text style={styles.completeText}>
            ✅ Race intelligence ready!
          </Text>
          <Text style={styles.completeSubtext}>
            (Dashboard implementation pending)
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  completeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00cc00',
    marginBottom: 8
  },
  completeSubtext: {
    fontSize: 14,
    color: '#666'
  }
});

export default RaceStrategyFlow;

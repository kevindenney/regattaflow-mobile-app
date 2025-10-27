import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
  color?: string;
  showStepLabels?: boolean;
}

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  currentStep,
  totalSteps,
  stepLabels,
  color = '#0066CC',
  showStepLabels = false,
}) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBackground]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%`, backgroundColor: color },
            ]}
          />
        </View>

        {/* Step Counter */}
        <View style={styles.stepCounter}>
          <Text style={[styles.stepText, { color }]}>
            Step {currentStep} of {totalSteps}
          </Text>
        </View>
      </View>

      {/* Optional Step Labels */}
      {showStepLabels && stepLabels && (
        <View style={styles.stepLabelsContainer}>
          {stepLabels.map((label, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <View key={index} style={styles.stepLabelItem}>
                <View
                  style={[
                    styles.stepCircle,
                    isCompleted && { backgroundColor: color },
                    isCurrent && { borderColor: color, borderWidth: 2 },
                    !isCompleted && !isCurrent && styles.stepCircleInactive,
                  ]}
                >
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.stepNumber,
                        isCurrent && { color },
                        !isCurrent && styles.stepNumberInactive,
                      ]}
                    >
                      {stepNumber}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    (isCompleted || isCurrent) && { color },
                    !isCompleted && !isCurrent && styles.stepLabelInactive,
                  ]}
                  numberOfLines={2}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBackground: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    transition: Platform.OS === 'web' ? 'width 0.3s ease' : undefined,
  } as any,
  stepCounter: {
    marginTop: 8,
    alignItems: 'center',
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stepLabelItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepCircleInactive: {
    borderColor: '#CBD5E1',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepNumberInactive: {
    color: '#94A3B8',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  stepLabelInactive: {
    color: '#94A3B8',
  },
});

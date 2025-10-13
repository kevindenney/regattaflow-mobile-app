/**
 * Onboarding Progress Bar
 * Visual indicator showing completion percentage
 */

import React from 'react';
import { View, Text } from 'react-native';

interface OnboardingProgressBarProps {
  currentStep: number;
  totalSteps: number;
  completedSections: number;
}

export function OnboardingProgressBar({
  currentStep,
  totalSteps,
  completedSections,
}: OnboardingProgressBarProps) {
  const percentage = Math.round((completedSections / totalSteps) * 100);

  return (
    <View className="px-6 py-4 bg-white border-b border-gray-200">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-medium text-gray-700">
          Step {currentStep}/{totalSteps}
        </Text>
        <Text className="text-sm font-semibold text-sky-600">{percentage}%</Text>
      </View>
      <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <View
          className="h-full bg-sky-600 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </View>
    </View>
  );
}

export default OnboardingProgressBar;

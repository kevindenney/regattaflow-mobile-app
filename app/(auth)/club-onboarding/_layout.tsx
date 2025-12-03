/**
 * Club Onboarding Wizard Layout
 * Provides consistent navigation and progress tracking across steps
 */

import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

const STEPS = [
  { id: 'step-1-basics', label: 'Basics', number: 1 },
  { id: 'step-2-details', label: 'Details', number: 2 },
  { id: 'step-3-contact', label: 'Contact', number: 3 },
  { id: 'step-4-launch', label: 'Launch', number: 4 },
];

function ProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <View className="flex-row items-center justify-center px-6 py-4 bg-white border-b border-gray-100">
      {STEPS.map((step, index) => (
        <React.Fragment key={step.id}>
          {/* Step circle */}
          <View className="items-center">
            <View
              className={`w-8 h-8 rounded-full items-center justify-center ${
                step.number < currentStep
                  ? 'bg-emerald-500'
                  : step.number === currentStep
                  ? 'bg-sky-600'
                  : 'bg-gray-200'
              }`}
            >
              {step.number < currentStep ? (
                <Text className="text-white font-bold text-sm">✓</Text>
              ) : (
                <Text
                  className={`font-bold text-sm ${
                    step.number === currentStep ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  {step.number}
                </Text>
              )}
            </View>
            <Text
              className={`text-xs mt-1 ${
                step.number <= currentStep ? 'text-gray-700 font-medium' : 'text-gray-400'
              }`}
            >
              {step.label}
            </Text>
          </View>
          
          {/* Connector line */}
          {index < STEPS.length - 1 && (
            <View
              className={`flex-1 h-0.5 mx-2 ${
                step.number < currentStep ? 'bg-emerald-500' : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

export default function ClubOnboardingLayout() {
  const router = useRouter();
  const segments = useSegments();
  
  // Determine current step from URL
  const currentRoute = segments[segments.length - 1] || 'step-1-basics';
  const currentStepData = STEPS.find(s => s.id === currentRoute);
  const currentStep = currentStepData?.number || 1;

  const handleBack = () => {
    if (currentStep === 1) {
      router.back();
    } else {
      const prevStep = STEPS.find(s => s.number === currentStep - 1);
      if (prevStep) {
        router.push(`/(auth)/club-onboarding/${prevStep.id}` as any);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity
          onPress={handleBack}
          className="p-2 -ml-2 rounded-full active:bg-gray-100"
        >
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text className="text-lg font-bold text-gray-900">Club Setup</Text>
          <Text className="text-xs text-gray-500">Step {currentStep} of {STEPS.length}</Text>
        </View>
        <View className="w-10" /> {/* Spacer for centering */}
      </View>

      {/* Progress Bar */}
      <ProgressBar currentStep={currentStep} />

      {/* Content */}
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </SafeAreaView>
  );
}


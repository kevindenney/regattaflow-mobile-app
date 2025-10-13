// src/app/(tabs)/courses/new/_layout.tsx
import React from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { X } from 'lucide-react-native';

// Wizard step configuration
const WIZARD_STEPS = [
  { key: 'upload', label: 'Upload', index: 1 },
  { key: 'processing', label: 'Extract', index: 2 },
  { key: 'visualize', label: 'Visualize', index: 3 },
  { key: 'strategy', label: 'Strategy', index: 4 },
];

function WizardHeader() {
  const router = useRouter();
  const segments = useSegments();

  // Get current step from route
  const currentRoute = segments[segments.length - 1] as string;
  const currentStep = WIZARD_STEPS.find(step => step.key === currentRoute) || WIZARD_STEPS[0];
  const currentIndex = currentStep.index;

  const handleCancel = () => {
    Alert.alert(
      'Cancel Race Strategy?',
      'Your progress will be lost. Are you sure?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => router.back()
        },
      ]
    );
  };

  return (
    <View className="bg-white border-b border-gray-200 pt-12 pb-4 px-4">
      {/* Top Row: Cancel + Step Count */}
      <View className="flex-row items-center justify-between mb-3">
        <TouchableOpacity
          onPress={handleCancel}
          className="flex-row items-center"
          accessibilityLabel="Cancel wizard"
          accessibilityRole="button"
        >
          <X size={20} color="#2563EB" />
          <Text className="text-blue-600 font-semibold ml-1">Cancel</Text>
        </TouchableOpacity>

        <Text className="text-sm font-medium text-gray-600">
          Step {currentIndex} of {WIZARD_STEPS.length}
        </Text>
      </View>

      {/* Title */}
      <Text className="text-xl font-bold text-gray-900 mb-4">
        Race Strategy Wizard
      </Text>

      {/* Progress Indicator */}
      <View className="flex-row items-center">
        {WIZARD_STEPS.map((step, index) => {
          const isCompleted = step.index < currentIndex;
          const isActive = step.index === currentIndex;
          const isUpcoming = step.index > currentIndex;

          return (
            <React.Fragment key={step.key}>
              {/* Step Circle */}
              <View className="flex-col items-center">
                <View
                  className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                    isCompleted
                      ? 'bg-green-500'
                      : isActive
                      ? 'bg-blue-600 shadow-lg'
                      : 'bg-gray-200'
                  }`}
                  style={isActive ? { transform: [{ scale: 1.1 }] } : undefined}
                >
                  {isCompleted ? (
                    <Text className="text-white font-bold">✓</Text>
                  ) : (
                    <Text
                      className={`font-bold text-sm ${
                        isActive ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      {step.index}
                    </Text>
                  )}
                </View>

                {/* Step Label */}
                <Text
                  className={`text-xs font-medium ${
                    isCompleted
                      ? 'text-gray-600'
                      : isActive
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </Text>
              </View>

              {/* Connector Line */}
              {index < WIZARD_STEPS.length - 1 && (
                <View
                  className={`flex-1 h-1 mx-2 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                  style={{ marginBottom: 20 }}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

export default function NewRaceLayout() {
  return (
    <Stack
      screenOptions={{
        header: () => <WizardHeader />,
        animation: 'slide_from_right',
        gestureEnabled: false, // Prevent swipe back to avoid data loss
      }}
    >
      <Stack.Screen name="upload" />
      <Stack.Screen name="processing" />
      <Stack.Screen name="visualize" />
      <Stack.Screen name="strategy" />
    </Stack>
  );
}

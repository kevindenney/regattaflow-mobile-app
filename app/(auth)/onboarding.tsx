import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const onboardingSteps = [
  {
    title: 'Welcome to RegattaFlow',
    subtitle: 'Smart sailing strategy at your fingertips',
    description: 'Experience the future of sail racing with 3D maps, AI insights, and real-time weather data.',
    emoji: '🌊',
  },
  {
    title: '3D Nautical Charts',
    subtitle: 'Navigate like never before',
    description: 'Explore race areas with detailed 3D bathymetry, wind patterns, and tidal flows.',
    emoji: '🗺️',
  },
  {
    title: 'AI Race Strategy',
    subtitle: 'Powered by advanced AI',
    description: 'Get personalized race recommendations based on conditions, course layout, and your sailing style.',
    emoji: '🧠',
  },
  {
    title: 'Real-time Weather',
    subtitle: 'Stay ahead of the wind',
    description: 'Access live weather updates, forecasts, and visualizations to make informed tactical decisions.',
    emoji: '🌬️',
  },
  {
    title: 'GPS Race Tracking',
    subtitle: 'Analyze your performance',
    description: 'Record your races, analyze your tracks, and improve your racing with detailed post-race insights.',
    emoji: '📍',
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const step = onboardingSteps[currentStep];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.replace('/(auth)/login');
    }
  };

  const handleSkip = () => {
    router.replace('/(auth)/login');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText style={styles.emoji}>{step.emoji}</ThemedText>
          <ThemedText type="title">{step.title}</ThemedText>
          <ThemedText type="subtitle">{step.subtitle}</ThemedText>
        </View>

        <View style={styles.description}>
          <ThemedText type="default">{step.description}</ThemedText>
        </View>

        <View style={styles.indicators}>
          {onboardingSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentStep && styles.activeIndicator,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <View style={styles.buttonPlaceholder} onTouchEnd={handleSkip}>
          <ThemedText type="default">⏩ Skip</ThemedText>
        </View>

        <View style={styles.buttonPlaceholder} onTouchEnd={handleNext}>
          <ThemedText type="default">
            {currentStep === onboardingSteps.length - 1 ? '🚀 Get Started' : '➡️ Next'}
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  description: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  indicators: {
    flexDirection: 'row',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  activeIndicator: {
    backgroundColor: '#0066CC',
    width: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 32,
    gap: 16,
  },
  buttonPlaceholder: {
    flex: 1,
    backgroundColor: '#0066CC',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
});